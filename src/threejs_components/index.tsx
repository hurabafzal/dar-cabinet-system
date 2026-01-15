import { useEffect, Suspense, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Loader } from "./loader/Loader";
import { Model } from "./cabinet/Model";
import { useModelStore } from "../store/modelSlice";
import { useSideBarStore } from "../store/SideBarSlice";
import { useBottomBarStore } from "../store/bottomBarSlice";
import { useConfiguratorStore } from "../store/configuratorSlice";
import { useIndexStore } from "../store/indexSlice";
import { v4 as uuidv4 } from "uuid"
import { findSnapTarget, findNearestWallPoint, WALL_ADJUST} from '../utils/wallSnap';
import { Vector3 } from "three";
import { ModelLoader } from "./../threejs_components/loader/ModelLoader"
import { Bloom, DepthOfField, EffectComposer } from "@react-three/postprocessing";
import { toast } from "react-toastify";

const Scene = () => {
  const { scene, camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const setDroppedModel = useModelStore((select: any) => select.setDroppedModel);
  const CABINET_ITEMS = useIndexStore((select: any) => select.CABINET_ITEMS);
  const droppedModel = useModelStore((select: any) => select.droppedModel);
  const setWidth = useConfiguratorStore((select: any) => select.setWidth);
  const setHeight = useConfiguratorStore((select: any) => select.setHeight);
  const setDepth = useConfiguratorStore((select: any) => select.setDepth);
  const setSeletedMesh = useBottomBarStore((select: any) => select.setSelectedMesh);
  const draggedModel = useSideBarStore((select: any) => select.draggedModel);
  const setDraggedModel = useSideBarStore((select: any) => select.setDraggedModel);
  const roomSize: any = useConfiguratorStore((select: any) => select.roomSize);
  const setClickOutline: any = useModelStore((select: any) => select.setClickOutline);
  const clickOutline: any = useModelStore((select: any) => select.clickOutline);
  const setPriceData: any = useConfiguratorStore((select: any) => select.setPriceData);
  const setIsCreated: any = useIndexStore((select: any) => select.setIsCreated);
  const setPlacedModels: any = useIndexStore((select: any) => select.setPlacedModels);
  const placedModels: any = useIndexStore((select: any) => select.placedModels);
  const [orbitControlState, setOrbitControlState] = useState(false);
  const [info, setInfo] = useState({});
  const isOrbitState: any = useIndexStore((select: any) => select.isOrbitState);
  const setIsOrbitState: any = useIndexStore((select: any) => select.setIsOrbitState);
  const setShowCuboidCollider = useModelStore((select: any) => select.setShowCuboidCollider);
  const showCuboidCollider = useModelStore((select: any) => select.showCuboidCollider);
  const [cameraPosition, setCameraPosition] = useState([0, 1, -7]);
  const [cameraTarget, setCameraTarget] = useState([0, 2, -5]);
  const MATERIAL_ITEMS = useIndexStore((select: any) => select.MATERIAL_ITEMS);

  const adjustPrice = (uuid: any) => {
    try {
      // Check for valid uuid
      if (!uuid) {
        console.error('Invalid UUID provided to adjustPrice');
        return;
      }
      
      const cabinetDataByName: any = CABINET_ITEMS.find((ele: any) => ele.id == draggedModel);
      
      // Check if cabinet data exists
      if (!cabinetDataByName) {
        console.error(`No cabinet data found for model ID: ${draggedModel}`);
        return;
      }
      
      // Ensure childObjInfo and materialInfo exist
      if (!cabinetDataByName.childObjInfo || !cabinetDataByName.materialInfo) {
        console.error('Missing childObjInfo or materialInfo in cabinet data', cabinetDataByName);
        return;
      }

      const priceDataToSet = {
        name: draggedModel,
        uuid: uuid,
        frame: {
          count: Number(cabinetDataByName.childObjInfo.frame || cabinetDataByName.childObjInfo.Frame || 0),
          material: cabinetDataByName.materialInfo.Frame || "Atlas"
        },
        shelf: {
          count: Number(cabinetDataByName.childObjInfo.shelf || cabinetDataByName.childObjInfo.Shelf || 0),
          material: cabinetDataByName.materialInfo.Shelf || "Atlas"
        },
        door: {
          count: Number(cabinetDataByName.childObjInfo.door || cabinetDataByName.childObjInfo.Door || 0),
          material: cabinetDataByName.materialInfo.Door || "Atlas"
        },
        drawer: {
          count: Number(cabinetDataByName.childObjInfo.drawer || cabinetDataByName.childObjInfo.Drawer || 0),
          material: cabinetDataByName.materialInfo.Drawer || "Atlas"
        }
      };

      setPriceData(priceDataToSet);
      setIsCreated(true);
    } catch (error) {
      console.error('Error in adjustPrice:', error);
    }
    setClickOutline([...clickOutline, false]);
  }

  function RaycastToPoint(point: any) {
    try {
      if (!Array.isArray(point) || point.length !== 3) {
        console.error('Invalid point format:', point);
        return [];
      }
      
      if (!camera || !scene) {
        console.error('Camera or scene not available');
        return [];
      }
      
      const targetPoint = new THREE.Vector3(...point);
      const rayOrigin = camera.position;
      const direction = targetPoint.clone().sub(rayOrigin).normalize();
      
      raycaster.current.ray.origin.copy(rayOrigin);
      raycaster.current.ray.direction.copy(direction);
      raycaster.current.camera = camera;
      
      const validObjects = scene.children.filter(obj => !(obj instanceof THREE.LineSegments));
      // Use the validObjects for intersection testing, not all scene.children
      const intersects = raycaster.current.intersectObjects(validObjects, true);
      
      return intersects;
    } catch (error) {
      console.error('RaycastToPoint error:', error);
      return [];
    }
  }

  const handleDrop = (event: any) => {
    try {
      if (!camera || !scene) {
        console.error('Camera or scene not available');
        return;
      }
      
      // Validate roomSize to prevent calculations with undefined values
      if (!roomSize || typeof roomSize.width !== 'number' || 
          typeof roomSize.length !== 'number' || 
          typeof roomSize.height !== 'number') {
        console.error('Invalid room size:', roomSize);
        return;
      }
      
      raycaster.current.camera = camera;

    if (event.type === "touchend") {
      event.stopImmediatePropagation();
      mouse.current.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
    } else {
      event.preventDefault();
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    const uuid = uuidv4();
    raycaster.current.setFromCamera(mouse.current, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);

    if (intersects.length > 0 && intersects[0].object.userData.meshKey === undefined && draggedModel) {
    //if (intersects[0].object.userData.meshKey === undefined && draggedModel) {
      setWidth(1);
      setHeight(240);
      setDepth(60);

      // ✅ VEREINFACHT - zurück zum alten System
      const frontWallZ = 0;
      const backWallZ = -roomSize.length * 7.8 / 600;
      const leftWallX = roomSize.width * 7.8 / 600 / 2;
      const rightWallX = -roomSize.width * 7.8 / 600 / 2;

      const faceWallDistance = Math.abs(intersects[0].point.z - frontWallZ);
      const backWallDistance = Math.abs(intersects[0].point.z - backWallZ);
      const leftWallDistance = Math.abs(intersects[0].point.x - leftWallX);
      const rightWallDistance = Math.abs(intersects[0].point.x - rightWallX);

      const distances = [faceWallDistance, backWallDistance, leftWallDistance, rightWallDistance];
      const minDistance = Math.min(...distances);
      const flagWall = distances.indexOf(minDistance);

      let casted2DPoint: any, rotation: any;
      if (flagWall === 0) {
        casted2DPoint = intersects[0].point.x;
        rotation = [0, 0, 0];
      } else if (flagWall === 1) {  // ← FIX: else if
        casted2DPoint = intersects[0].point.x;
        rotation = [0, 180 * Math.PI / 180, 0];
      } else if (flagWall === 2) {  // ← FIX: else if
        casted2DPoint = intersects[0].point.z;
        rotation = [0, 90 * Math.PI / 180, 0];
      } else if (flagWall === 3) { // ← FIX: else if
        casted2DPoint = intersects[0].point.z;
        rotation = [0, -90 * Math.PI / 180, 0];
      }

      const info = { position: casted2DPoint, rotation: rotation };
      if (info !== null) {
        const droppedModelInfo: any = CABINET_ITEMS.find((ele: any) => ele.id == draggedModel);

        // Normalisiere Keys zu Großbuchstaben (Backend liefert lowercase)
        const normalizeKey = (key: string) => key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();

        // ✅ CRITICAL FIX FOR CABINET 7: Mapping table for mesh names to component names
        // Cabinet 7 has unpredictable mesh names that don't match standard component names
        const getComponentNameForCabinet7 = (rawKey: string): string => {
          const normalizedName = rawKey.toLowerCase().trim();
          
          // Door-related meshes
          if (normalizedName.includes("door") || 
              normalizedName.includes("leftdoor") || 
              normalizedName.includes("rightdoor") ||
              normalizedName.includes("doordoor")) {
            return "Door";
          }
          
          // Handle-related meshes
          if (normalizedName.includes("handle") || 
              normalizedName.includes("hang")) {
            return "Handle";
          }
          
          // Hinge-related meshes
          if (normalizedName.includes("hinge")) {
            return "Hinge";
          }
          
          // Frame/Shelf/Panel meshes (all use Frame texture)
          if (normalizedName.includes("shelf") || 
              normalizedName.includes("frame") || 
              normalizedName.includes("panel") ||
              normalizedName.includes("leftpanel") ||
              normalizedName.includes("rightpanel") ||
              normalizedName.includes("cube") ||
              normalizedName.includes("plane")) {
            return "Frame";
          }
          
          // Drawer meshes
          if (normalizedName.includes("drawer")) {
            return "Drawer";
          }
          
          // Default fallback to Frame
          return "Frame";
        };

        // ✅ Materials vom Backend verwenden (materialInfo)
        const getBackendMaterial = (componentKey: string) => {
          // Get material ID from model info
          const materialId = droppedModelInfo.materialInfo?.[componentKey];
          
          // Find the texture in all material categories
          let foundTexture = null;
          let foundCategory = null;
          
          // Search through all material categories to find the texture by ID
          for (const category of MATERIAL_ITEMS || []) {
            const texture = category.textures?.find((t: any) => t._id === materialId);
            if (texture) {
              foundTexture = texture;
              foundCategory = category;
              break;
            }
          }
          
          // If no specific texture found, use the first available texture as default
          if (!foundTexture && MATERIAL_ITEMS && MATERIAL_ITEMS.length > 0) {
            foundCategory = MATERIAL_ITEMS[0];
            foundTexture = foundCategory.textures?.[0];
          }
          
          // Return the material data with additional properties from the API
          return {
            name: foundTexture?.name || 'Default',
            url: foundTexture?.textureSrc || '',
            category: foundCategory?.name || 'Default',
            materialType: foundTexture?.materialType || 'Default',
            description: foundTexture?.description,
            surfaceFinish: foundTexture?.surfaceFinish,
            thickness: foundTexture?.thickness,
            resistance: foundTexture?.resistance,
            features: foundTexture?.features || [],
            technicalSpecifications: foundTexture?.technicalSpecifications || {}
          };
        };

        // Check if this is Cabinet 7
        const isCabinet7 = droppedModelInfo.id === "CABIENT7";

        const newPlacedModel = {
          uuid: uuid,
          id: droppedModelInfo.id,
          components: Object.fromEntries(Object.entries(droppedModelInfo.childObjInfo)
            .filter(([key, value]: any) => {
              if (isCabinet7) {
                // For Cabinet 7, use mapping function
                const componentName = getComponentNameForCabinet7(key);
                return ['Frame', 'Shelf', 'Drawer', 'Door'].includes(componentName) && Number(value) > 0;
              } else {
                // For normal cabinets, use normalized key
                const normalizedKey = normalizeKey(key);
                return ['Frame', 'Shelf', 'Drawer', 'Door'].includes(normalizedKey) && Number(value) > 0;
              }
            })
            .map(([key]) => {
              if (isCabinet7) {
                // For Cabinet 7, map to component name
                const componentName = getComponentNameForCabinet7(key);
                return [componentName, 1];
              } else {
                // For normal cabinets, use normalized key
                return [normalizeKey(key), 1];
              }
            })),
          materials: Object.fromEntries(Object.entries(droppedModelInfo.childObjInfo)
            .filter(([key, value]: any) => {
              if (isCabinet7) {
                // For Cabinet 7, use mapping function
                const componentName = getComponentNameForCabinet7(key);
                return ['Frame', 'Shelf', 'Drawer', 'Door'].includes(componentName) && Number(value) > 0;
              } else {
                // For normal cabinets, use normalized key
                const normalizedKey = normalizeKey(key);
                return ['Frame', 'Shelf', 'Drawer', 'Door'].includes(normalizedKey) && Number(value) > 0;
              }
            })
            .map(([key]) => {
              if (isCabinet7) {
                // For Cabinet 7, map raw key to component name
                const componentName = getComponentNameForCabinet7(key);
                // CRITICAL: Use ORIGINAL raw key to lookup materialInfo (backend has raw keys like "LeftDoor", not "Door")
                // But store material under normalized component name so FbxModel can find it
                const materialData = getBackendMaterial(key); // Use raw key for lookup
                return [componentName, materialData]; // Store under normalized name
              } else {
                // For normal cabinets, use normalized key
                const normalizedKey = normalizeKey(key);
                return [normalizedKey, getBackendMaterial(normalizedKey)];
              }
            }))
        };

        setPlacedModels([...placedModels, newPlacedModel]);

        try {
          // Calculate room dimensions once to avoid repetition and potential errors
          const frontWallZ = 0;
          const backWallZ = -roomSize.length * 7.8 / 600;
          const leftWallX = roomSize.width * 7.8 / 600 / 2;
          const rightWallX = -roomSize.width * 7.8 / 600 / 2;
          
          // Validate dimensions to prevent NaN values
          if (isNaN(backWallZ) || isNaN(leftWallX) || isNaN(rightWallX)) {
            console.error('Invalid room dimensions calculated:', { backWallZ, leftWallX, rightWallX });
            toast.error('Failed to add item due to invalid room dimensions');
            return;
          }
          
          switch (flagWall) {
            case 0: // Front Wall
              if (RaycastToPoint([info.position - 0.5, 1, -1]).length === 1 && RaycastToPoint([info.position + 0.5, 1, -1]).length === 1) {
                const [safeX, safeY, safeZ] = [info.position, 0, WALL_ADJUST.front];
                // Validate position before setting
                if (!isNaN(safeX) && !isNaN(safeY) && !isNaN(safeZ)) {
                  setDroppedModel([...droppedModel, { id: draggedModel, position: [safeX, safeY, safeZ], rotation: info.rotation, uuid: uuid }]);
                  adjustPrice(uuid);
                } else {
                  console.error('Invalid position calculated for front wall:', { safeX, safeY, safeZ });
                }
              }
              break;

            case 1: // Back Wall
              if (RaycastToPoint([info.position - 0.5, 1, backWallZ + 0.5]).length === 1 && RaycastToPoint([info.position + 0.5, 1, backWallZ + 0.5]).length === 1) {
                const [safeX, safeY, safeZ] = [info.position, 0, backWallZ + WALL_ADJUST.back];
                // Validate position before setting
                if (!isNaN(safeX) && !isNaN(safeY) && !isNaN(safeZ)) {
                  setDroppedModel([...droppedModel, { id: draggedModel, position: [safeX, safeY, safeZ], rotation: info.rotation, uuid: uuid }]);
                  adjustPrice(uuid);
                } else {
                  console.error('Invalid position calculated for back wall:', { safeX, safeY, safeZ });
                }
              }
              break;

            case 2: // Left Wall
              if (RaycastToPoint([leftWallX + WALL_ADJUST.left, 1, info.position - 0.5]).length === 1 && RaycastToPoint([leftWallX + WALL_ADJUST.left, 1, info.position + 0.5]).length === 1) {
                const [safeX, safeY, safeZ] = [leftWallX + WALL_ADJUST.left, 0, info.position];
                // Validate position before setting
                if (!isNaN(safeX) && !isNaN(safeY) && !isNaN(safeZ)) {
                  setDroppedModel([...droppedModel, { id: draggedModel, position: [safeX, safeY, safeZ], rotation: info.rotation, uuid: uuid }]);
                  console.log(`📍 SCENE SENDS: [${safeX}, ${safeY}, ${safeZ}]`);
                  adjustPrice(uuid);
                } else {
                  console.error('Invalid position calculated for left wall:', { safeX, safeY, safeZ });
                }
              }
              break;

            default: // Right Wall (case 3)
              if (RaycastToPoint([rightWallX + WALL_ADJUST.right, 1, info.position - 0.5]).length === 1 && RaycastToPoint([rightWallX + WALL_ADJUST.right, 1, info.position + 0.5]).length === 1) {
                const [safeX, safeY, safeZ] = [rightWallX + WALL_ADJUST.right, 0, info.position];
                // Validate position before setting
                if (!isNaN(safeX) && !isNaN(safeY) && !isNaN(safeZ)) {
                  setDroppedModel([...droppedModel, { id: draggedModel, position: [safeX, safeY, safeZ], rotation: info.rotation, uuid: uuid }]);
                  adjustPrice(uuid);
                } else {
                  console.error('Invalid position calculated for right wall:', { safeX, safeY, safeZ });
                }
              }
              break;
          }
        } catch (error) {
          console.error('Error in wall placement logic:', error);
          toast.error('Failed to place item correctly');
          return;
        }

        setShowCuboidCollider([...showCuboidCollider, true]);
        setDraggedModel("");
        return;
      } else {
        setSeletedMesh("undefined");
      }
    }
  } catch (error) {
    console.error('Error in handleDrop:', error);
    // Notify user of error
    toast.error('Failed to add item. Please try again.');
  }
  };
  const handleDragOver = (event: any) => {
    if (event.type === "touchmove") {
      event.stopImmediatePropagation();
    } else event.preventDefault();
  };

  useEffect(() => {
    if (isOrbitState === false) {
      setIsOrbitState(true)
      const newModelLocationInfo: any = info;
      setDraggedModel(newModelLocationInfo.id);
    }
  }, [info])
  useEffect(() => {
    window.addEventListener("drop", handleDrop);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("touchmove", handleDragOver);
    window.addEventListener("touchend", handleDrop);
    return () => {
      window.removeEventListener("drop", handleDrop);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("touchmove", handleDragOver);
      window.removeEventListener("touchend", handleDrop);
    };
  });

  const getCameraLimits = useMemo(() => {
    const room3DHeight = roomSize.height / 285;
    const room3DWidth = roomSize.width * 7.8 / 600;
    const room3DLength = roomSize.length * 7.8 / 600;
    const safeDistance = Math.min(room3DWidth, room3DLength) * 0.5;
    const startDistance = Math.min(safeDistance, 2.7);
    const finalStartDistance = Math.max(startDistance, 1.5);

    return {
      // Kamera-Target (geradeaus - gleiche Höhe wie Kamera)
      target: [0, room3DHeight * 2, -room3DLength / 2] as [number, number, number],

      // Kamera-Position (in Raummitte, leicht erhöht)
      position: [0, room3DHeight * 2, -room3DLength / 2 - finalStartDistance] as [number, number, number],

      // Zoom-Grenzen
      minDistance: 1,
      startDistance: finalStartDistance,
      maxDistance: finalStartDistance
    };
  }, [roomSize]);

  const limits = getCameraLimits;

  // 🎯 Automatische Kamera-Repositionierung bei Raum-Änderungen
  useEffect(() => {
    if (!camera) return;

    // Neue Position und Target aus den aktualisierten Limits
    const newCameraPos = new THREE.Vector3(...limits.position);
    const newTarget = new THREE.Vector3(...limits.target);

    // Sanfte Animation zur neuen Position
    const startPos = camera.position.clone();
    const startTime = Date.now();
    const duration = 800; // 0.8 Sekunden Animation

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Interpolate position
      const currentPos = new THREE.Vector3().lerpVectors(startPos, newCameraPos, easeProgress);
      camera.position.copy(currentPos);

      // Update camera
      camera.updateProjectionMatrix();

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };

    // Start animation
    animateCamera();

  }, [roomSize.width, roomSize.height, roomSize.length, camera]);

  return (
    <>
      <OrbitControls
        camera={camera}
        enabled={isOrbitState}
        target={limits.target}
        makeDefault
        enableDamping={false}
        rotateSpeed={0.5}    // ← Langsameres Drehen
        zoomSpeed={0.8}      // ← Langsameres Zoomen
        panSpeed={0.6} 

        // 🔒 Position FEST in Raummitte - kein Pan/Move erlaubt
        enablePan={false}
        enableRotate={true}
        enableZoom={true}

        // 📏 Begrenzte vertikale Rotation (etwas hoch/runter)
        minPolarAngle={Math.PI / 3}         // Etwas nach oben schauen erlaubt
        maxPolarAngle={Math.PI / 1.5}       // Etwas nach unten schauen erlaubt

        // 🔍 Zoom: Nur reinzoomen, maxDistance = Startpunkt
        minDistance={1}                              // Nah ranzoomen erlaubt
        maxDistance={limits.startDistance}          // Maximal = Startposition

        onChange={(e) => {
          if (!e?.target?.object) return;
          const currentDistance = e.target.getDistance();
          const pos = e.target.object.position;
        }}

        onStart={() => setOrbitControlState(true)}
        onEnd={() => setOrbitControlState(false)}
      />
      <PerspectiveCamera
        makeDefault
        fov={50}
        position={limits.position}
      />
      <directionalLight
        color={"rgb(255, 255, 255)"}
        intensity={1.8}
        position={[3, 2, -9]}
        isDirectionalLight
      />
      <ambientLight intensity={1} />
      <Model orbitControlState={orbitControlState} />
    </>
  );
};

export default Scene;
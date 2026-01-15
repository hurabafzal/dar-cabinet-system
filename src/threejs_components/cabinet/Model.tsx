import { Gltf, useGLTF, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Ground } from "../ground/Ground";
import {
  Mesh,
  Raycaster,
  Vector2,
  MeshStandardMaterial,
  Color,
  MeshPhysicalMaterial,
  RepeatWrapping,
  TextureLoader,
} from "three";
import { useModelStore } from "../../store/modelSlice";
import { useBottomBarStore } from "../../store/bottomBarSlice";
import { useConfiguratorStore } from "../../store/configuratorSlice";
import { URLs } from "../../const/urls";
import { Movable } from "./Movable";
import { isMobile, isTablet, isBrowser } from "react-device-detect";
import { ModelLoader } from "../loader/ModelLoader";
import { useIndexStore } from "../../store/indexSlice";
import { toast } from "react-toastify";
import { useScreenshotStore } from "../../store/screenshotStore";
import FBXModel from "./FbxModel";

// Material-Cache um unnötige Material-Erstellungen zu vermeiden
const materialCache = new Map();

export function Model(props: any) {
  const [mesh, setMesh] = useState<Mesh | null>(null);
  const [selectedID, setSelectedID] = useState<string | null>(null); // Explicitly typed state
  const [selectedModelID, setSelectedModelID] = useState<number | null>(null); // Explicitly typed state

  // Zustandsmanagement - mit useCallback zur Vermeidung von Neuinstanzierungen
  const droppedModel = useModelStore((select: any) => select.droppedModel);
  const CABINET_ITEMS = useIndexStore((select: any) => select.CABINET_ITEMS);
  const MATERIAL_ITEMS = useIndexStore((select: any) => select.MATERIAL_ITEMS);
  const setSelectedMesh = useBottomBarStore(
    (select: any) => select.setSelectedMesh
  );
  const selectedMesh = useBottomBarStore((select: any) => select.selectedMesh);
  const price = useConfiguratorStore((select: any) => select.price);
  const showCuboidCollider = useModelStore(
    (select: any) => select.showCuboidCollider
  );
  const clickedModel = useModelStore((select: any) => select.clickedModel);
  const setClickedModel = useModelStore(
    (select: any) => select.setClickedModel
  );
  const setPrice = useConfiguratorStore((select: any) => select.setPrice);
  const setIsDoubleClickedModel = useModelStore(
    (select: any) => select.setIsDoubleClickedModel
  );
  const selectedMaterial = useBottomBarStore(
    (select: any) => select.selectedMaterial
  );
  const setSelectedMaterial = useBottomBarStore(
    (select: any) => select.setSelectedMaterial
  );
  const width = useConfiguratorStore((select: any) => select.width);
  const height = useConfiguratorStore((select: any) => select.height);
  const depth = useConfiguratorStore((select: any) => select.depth);
  const roomSize = useConfiguratorStore((select: any) => select.roomSize);
  const clickedComponent = useModelStore(
    (select: any) => select.clickedComponent
  );
  const setClickedComponent = useModelStore(
    (select: any) => select.setClickedComponent
  );
  const setClickOutline = useModelStore(
    (select: any) => select.setClickOutline
  );
  const clickOutline = useModelStore((select: any) => select.clickOutline);
  const isClickedApplyAll = useConfiguratorStore(
    (select: any) => select.isClickedApplyAll
  );
  const setIsClickedApplyAll = useConfiguratorStore(
    (select: any) => select.setIsClickedApplyAll
  );
  const setIsclickedMaterialCategory = useBottomBarStore(
    (select: any) => select.setIsclickedMaterialCategory
  );
  const placedModels = useIndexStore((select: any) => select.placedModels);

  const getModelMaterial = useCallback(
    (modelUuid: string, componentName: string) => {
      const model = placedModels.find((m: any) => m.uuid === modelUuid);
      return model?.materials?.[componentName]?.url || null;
    },
    [placedModels]
  );

  // Room-Model laden mit Error Boundary
  const room = useGLTF(URLs.ROOM_MODEL, true);

  // Materialiendefinitionen mit useMemo
  const materials = useMemo(() => {
    const glassMaterial = new MeshPhysicalMaterial({
      metalness: 0.9,
      roughness: 0.9,
      envMapIntensity: 0.9,
      clearcoat: 0.1,
      transparent: true,
      opacity: 0.5,
      reflectivity: 0.2,
      ior: 12,
      thickness: 13,
      color: "#a1dff0",
    });

    const metalMaterial = new MeshPhysicalMaterial({
      metalness: 1,
      roughness: 0,
      reflectivity: 0.2,
      thickness: 13,
    });

    return { glassMaterial, metalMaterial };
  }, []);

  // Texture nur laden, wenn selectedMaterial sich ändert
  const texturePath = selectedMaterial
    ? selectedMaterial
    : MATERIAL_ITEMS[0]?.textures[0]?.textureSrc;
  const texture = useTexture({ map: texturePath });

  // Sichere Behandlung der Textur
  useEffect(() => {
    if (texture && texture.map) {
      texture.map.wrapS = texture.map.wrapT = RepeatWrapping;
      texture.map.repeat.set(1, 1);
    }
  }, [texture]);

  // Materialauswahl mit Material-Cache
  const appliedMaterial = useMemo(() => {
    // Prüfen, ob das Material bereits im Cache ist
    if (materialCache.has(selectedMaterial)) {
      return materialCache.get(selectedMaterial);
    }

    let material;
    switch (selectedMaterial) {
      case "Glass (1)":
        material = materials.glassMaterial;
        break;
      case "Glass (2)":
        material = materials.metalMaterial;
        break;
      default:
        // Sicherstellen, dass Texture richtig geladen ist
        if (texture && texture.map) {
          material = new MeshStandardMaterial({
            map: texture.map,
            metalness: 0.1,
            roughness: 0.4,
            flatShading: true,
          });
        } else {
          // Fallback-Material, wenn keine Textur verfügbar ist
          material = new MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.4,
            flatShading: true,
          });
        }
        break;
    }

    // Material im Cache speichern
    materialCache.set(selectedMaterial, material);
    return material;
  }, [selectedMaterial, texture, materials]);

  // Optimierter Effect für Material-Anwendung
  useEffect(() => {
    if (!selectedMaterial) return;

    if (isClickedApplyAll === true) {
      if (!clickedModel?.parent?.parent?.parent?.children) return;

      const avaModels = clickedModel.parent.parent.parent.children;
      for (let i = 5; i < avaModels.length; i++) {
        const model =
          avaModels[i]?.children[0]?.children[1]?.children[0]?.children[0]
            ?.children;
        if (!model) continue;

        model.forEach((item: any) => {
          if (item.name === selectedMesh) {
            item.material = appliedMaterial;
          }
        });
      }
      setIsClickedApplyAll(false);
    } else if (mesh) {
      mesh.material = appliedMaterial;
      setMesh(mesh);
    }
  }, [
    selectedMaterial,
    isClickedApplyAll,
    mesh,
    appliedMaterial,
    clickedModel,
    selectedMesh,
    setIsClickedApplyAll,
  ]);

  const { scene, camera, gl: renderer, invalidate } = useThree();
  const raycaster = useRef(new Raycaster());
  const mouse = useRef(new Vector2());
  const setCaptureFunction = useScreenshotStore(
    (state) => state.setCaptureFunction
  );

  useEffect(() => {
    const canvas = renderer.domElement;

    const handleContextLost = (event: any) => {
      event.preventDefault();
      console.log("WebGL context lost. It will be restored...");
    };

    const handleContextRestored = () => {
      console.log("WebGL context restored!");
      // Re-render the scene
      renderer.render(scene, camera);
    };

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
    };
  }, [renderer, scene, camera]);

  // Helper function to reduce canvas resolution for screenshots
  const captureReducedResolutionImage = useCallback(
    (renderer: any, quality = 0.5) => {
      // Store original size
      const originalWidth = renderer.domElement.width;
      const originalHeight = renderer.domElement.height;

      // Reduce resolution by 50% for screenshots to save storage space
      const scaleFactor = 0.5;
      const reducedWidth = Math.floor(originalWidth * scaleFactor);
      const reducedHeight = Math.floor(originalHeight * scaleFactor);

      // Set renderer to smaller size temporarily
      renderer.setSize(reducedWidth, reducedHeight, false);
      renderer.render(scene, camera);

      // Capture image with reduced quality
      const imageData = renderer.domElement.toDataURL("image/jpeg", quality);

      // Restore original size
      renderer.setSize(originalWidth, originalHeight, false);
      renderer.render(scene, camera);

      return imageData;
    },
    [scene, camera]
  );

  const captureDesignScreenshots = useCallback(async () => {
    return new Promise((resolve) => {
      const screenshots: any = {};

      // Speichere aktuelle Kamera-Position
      const originalPosition = camera.position.clone();

      // Use reduced resolution for screenshots to save space

      // Front view
      camera.position.set(0, 2, 5);
      camera.lookAt(0, 1, 0);
      screenshots.front = captureReducedResolutionImage(renderer, 0.4);

      // Back view
      camera.position.set(0, 2, -8);
      camera.lookAt(0, 1, 0);
      screenshots.back = captureReducedResolutionImage(renderer, 0.4);

      // Left view
      camera.position.set(-5, 2, 0);
      camera.lookAt(0, 1, 0);
      screenshots.left = captureReducedResolutionImage(renderer, 0.4);

      // Right view
      camera.position.set(5, 2, 0);
      camera.lookAt(0, 1, 0);
      screenshots.right = captureReducedResolutionImage(renderer, 0.4);

      // Kamera zurücksetzen
      camera.position.copy(originalPosition);

      resolve(screenshots);
    });
  }, [scene, camera, renderer, captureReducedResolutionImage]);

  useEffect(() => {
    return () => {
      // Alle Materialien aufräumen
      scene.traverse((object: any) => {
        if (object.isMesh) {
          object.geometry.dispose();
          if (object.material.isMaterial) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach((material: any) => material.dispose());
          }
        }
      });

      // Texturen aufräumen
      scene.traverse((object: any) => {
        if (object.material?.map) {
          object.material.map.dispose();
        }
      });

      // Renderer aufräumen
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
    };
  }, [scene, renderer]);

  useEffect(() => {
    setCaptureFunction(captureDesignScreenshots);
  }, [captureDesignScreenshots, setCaptureFunction]);

  // Event-Handler mit useCallback
  const handleRaycastPointer = useCallback(
    (event: any) => {
      event.stopPropagation();
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true
      );

      if (intersects.length > 0) {
        setClickOutline(clickOutline.fill(false));
        const targetObject: any = intersects[0].object;

        if (targetObject.parent?.parent?.name !== "placedModel") {
          setIsDoubleClickedModel(false);
          setSelectedMesh("null");
          return;
        }

        const name = targetObject.parent?.parent?.parent?.parent?.item?.id;
        if (!name) return;

        const cabinet = CABINET_ITEMS.find((ele: any) => ele.id == name);
        if (!cabinet) return;

        // ✅ CRITICAL FIX FOR CABINET 7: Normalize mesh names to component names
        // Same mapping logic as in FbxModel.tsx and index.tsx
        const getComponentNameForCabinet7 = (rawName: string): string => {
          const normalizedName = rawName.toLowerCase().trim();
          
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

        // Normalize component name based on cabinet type
        let normalizedComponentName: string;
        if (name === "CABIENT7" || name === "CABIENT10") {
          // For Cabinet 7/10, use mapping function
          normalizedComponentName = getComponentNameForCabinet7(targetObject.name);
        } else {
          // For normal cabinets, use mesh name as-is (it should already match)
          normalizedComponentName = targetObject.name;
        }

        // Backend liefert lowercase Keys (frame, shelf, door, drawer)
        const lowerCaseName = normalizedComponentName.toLowerCase();
        const count = Number(
          cabinet.childObjInfo[lowerCaseName] ||
            cabinet.childObjInfo[normalizedComponentName] ||
            0
        );
        const newPrice = {
          name,
          uuid: targetObject.parent?.parent?.parent?.parent?.item?.uuid,
          component: normalizedComponentName, // ✅ Use normalized name, not raw mesh name
          count,
        };

        setPrice(newPrice);
        setIsDoubleClickedModel(true);
        setIsclickedMaterialCategory("Base");
        setSelectedMesh(targetObject.name);
        setMesh(targetObject);
      } else {
        setSelectedMesh("undefined");
      }
    },
    [
      camera,
      scene,
      clickOutline,
      setClickOutline,
      setIsDoubleClickedModel,
      setSelectedMesh,
      CABINET_ITEMS,
      setPrice,
      setIsclickedMaterialCategory,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // HOVER IN – NEVER overwrite originalMaterial if texture isn't ready yet
  // ─────────────────────────────────────────────────────────────────────────────
  const lastHoverTime = useRef(0);
  const handleRaycastPointerHover = useCallback(
    (event: any) => {
      if (!isBrowser || props.orbitControlState) return;

      const now = Date.now();
      if (now - lastHoverTime.current < 50) return;
      lastHoverTime.current = now;

      event.stopPropagation();
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true
      );

      if (intersects.length === 0) return;

      const targetObj: any = intersects[0].object;
      if (targetObj?.parent?.parent?.name !== "placedModel") return;

      // ONLY highlight if we have a REAL textured originalMaterial
      if (targetObj.userData.originalMaterial?.map?.image?.complete) {
        const hoverMat = targetObj.userData.originalMaterial.clone();
        hoverMat.emissive.setHex(0xff0000);
        hoverMat.emissiveIntensity = 0.3;
        targetObj.material = hoverMat;
      }
    },
    [camera, scene, props.orbitControlState]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // HOVER OUT – Always restore the real one (even if it was set later)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleRaycastPointerOut = useCallback(
    (event: any) => {
      if (!isBrowser) return;

      event.stopPropagation();
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true
      );

      if (!intersects.length) return;

      const obj = intersects[0].object;
      if (obj?.parent?.parent?.name !== "placedModel") return;

      if (obj.userData.originalMaterial && (obj as any).isMesh) {
        const mesh = obj as any;
        if (mesh.material !== mesh.userData.originalMaterial) {
          mesh.material.dispose();
        }
        mesh.material = mesh.userData.originalMaterial;
      }
    },
    [camera, scene]
  );

  // Optimierter Effect für clickedComponent - when component is selected
  useEffect(() => {
    if (!clickedComponent || !clickedModel?.children) return;

    // CRITICAL FIX: Don't reset materials to white - this was causing doors to appear lighter
    // Instead, just reset emissive if it was set, preserving the texture
    clickedModel.children[0]?.children[0]?.children.forEach((item: any) => {
      if (item.material) {
        // Only reset emissive if it was set, don't modify color to preserve texture
        if (item.material.emissive && item.material.emissiveIntensity > 0) {
          item.material.emissive = new Color(0x000000);
          item.material.emissiveIntensity = 0;
        }
      }
    });

    // Finde und setze das ausgewählte Mesh
    const meshTemp = clickedModel.children[0]?.children[0]?.children.find(
      (mesh: any) => mesh.name === clickedComponent
    );

    if (meshTemp) {
      // Store original material if not already stored
      if (!meshTemp.userData.originalMaterial) {
        meshTemp.userData.originalMaterial = meshTemp.material;
      }
      // Clone material and add red highlight while preserving texture
      if (meshTemp.material) {
        meshTemp.material = meshTemp.material.clone();
        // Use proper red color for highlight
        meshTemp.material.emissive = new Color(0xff0000); // Bright red
        meshTemp.material.emissiveIntensity = 0.5;
        // Don't modify base color - let texture show through
      }
      setMesh(meshTemp);
    } else {
      // Completely suppress all toast warnings to avoid annoying users
      // Just log it to the console for debugging purposes
      console.log(`Component not found: ${clickedComponent}`);

      // Check if we're running in development mode before showing any warnings
      if (process.env.NODE_ENV === "development") {
        console.warn(`Component not found in model: ${clickedComponent}`);
      }
    }

    setClickedComponent("");
  }, [clickedComponent, clickedModel, setClickedComponent]);

  // CRITICAL: When clickedComponent becomes empty (palette closes), restore all materials for ALL cabinets
  const prevClickedComponent = useRef(clickedComponent);
  useEffect(() => {
    // Palette just closed → restore ALL materials safely
    if (clickedComponent === "" && prevClickedComponent.current !== "") {
      console.log('🔄 Palette closed - restoring materials for all cabinets');
      let doorCount = 0;
      let frameCount = 0;
      let restoredCount = 0;
      
      // Traverse scene to find all meshes and restore their materials
      if (scene) {
        scene.traverse((obj: any) => {
          if (obj.isMesh && obj.userData.originalMaterial) {
            const meshName = obj.name.toLowerCase();
            const isDoor = meshName.includes("door");
            const isFrame = meshName.includes("frame") || meshName.includes("shelf");
            
            if (isDoor) doorCount++;
            if (isFrame) frameCount++;
            
            const hadDifferentMaterial = obj.material !== obj.userData.originalMaterial;
            const materialType = obj.material?.type || 'unknown';
            const originalMaterialType = obj.userData.originalMaterial?.type || 'unknown';
            const hasTexture = obj.userData.originalMaterial?.map?.image?.complete || false;
            
            if (hadDifferentMaterial) {
              console.log(`🔧 Restoring material for ${obj.name}:`, {
                meshName: obj.name,
                isDoor,
                isFrame,
                oldMaterialType: materialType,
                newMaterialType: originalMaterialType,
                hasTexture,
                materialChanged: true
              });
              if (obj.material && obj.material !== obj.userData.originalMaterial) {
                obj.material.dispose();
              }
              obj.material = obj.userData.originalMaterial;
              obj.material.needsUpdate = true;
              
              // CRITICAL: For doors, force immediate re-assignment to ensure renderer picks it up
              if (isDoor) {
                const tempMaterial = obj.material;
                obj.material = tempMaterial;
                obj.material.needsUpdate = true;
                if (obj.material.map) {
                  obj.material.map.needsUpdate = true;
                }
              }
              
              restoredCount++;
            } else {
              console.log(`✅ Material already correct for ${obj.name}:`, {
                meshName: obj.name,
                isDoor,
                isFrame,
                materialType,
                hasTexture,
                materialChanged: false
              });
              
              // CRITICAL: For doors, ALWAYS force re-assignment even if "correct"
              // This forces Three.js to re-render the material properly
              if (isDoor && obj.userData.originalMaterial) {
                // Force re-assignment to trigger renderer update
                const originalMat = obj.userData.originalMaterial;
                obj.material = originalMat;
                obj.material.needsUpdate = true;
                if (obj.material.map) {
                  obj.material.map.needsUpdate = true;
                }
                // Force mesh update
                obj.matrixWorldNeedsUpdate = true;
                invalidate();
              }
            }
          } else if (obj.isMesh) {
            const meshName = obj.name.toLowerCase();
            const isDoor = meshName.includes("door");
            if (isDoor) {
              console.warn(`⚠️ Door ${obj.name} has NO originalMaterial:`, {
                meshName: obj.name,
                currentMaterialType: obj.material?.type || 'unknown',
                hasTexture: obj.material?.map?.image?.complete || false
              });
            }
          }
        });
      }
      
      console.log(`📊 Material restore summary:`, {
        totalDoors: doorCount,
        totalFrames: frameCount,
        restoredCount,
        clickedComponent: prevClickedComponent.current + ' → ' + clickedComponent
      });
    }
    prevClickedComponent.current = clickedComponent;
  }, [clickedComponent, scene]);

  // Touch-Handling für Mobile
  const [touchTimeout, setTouchTimeout] = useState<number | null>(null);

  const handleLongTouchStart = useCallback(
    (e: any) => {
      if (isMobile || isTablet) {
        const timeout: any = setTimeout(() => {
          handleRaycastPointer(e);
        }, 1000);
        setTouchTimeout(timeout);
      }
    },
    [handleRaycastPointer]
  );

  const handleLongTouchEnd = useCallback(() => {
    if ((isMobile || isTablet) && touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
  }, [touchTimeout]);

  // Render memoized droppedModel items for better performance
  const renderDroppedModels = useMemo(() => {
    return droppedModel.map((item: any, index: any) => {
      const cabinet = CABINET_ITEMS.find((ele: any) => ele.id === item.id);
      if (!cabinet) return null;

      return (
        <Movable
          key={item.uuid}
          item={item}
          rotation={item.rotation}
          position={item.position}
          scale={[width, height / 240, depth / 60]}
          modelIndex={index}
          setSelectedModelID={setSelectedModelID}
          selectedID={selectedID}
          setSelectedID={setSelectedID}
          setMesh={setMesh}
          droppedModel={droppedModel}
          setIsDoubleClickedModel={setIsDoubleClickedModel}
          scene={scene}
          clickOutline={clickOutline}
          setClickOutline={setClickOutline}
          setSelectedMesh={setSelectedMesh}
          clickedModel={clickedModel}
          setClickedModel={setClickedModel}
        >
          <group name={"placedModel"} key={item.uuid}>
            <Suspense fallback={<ModelLoader />}>
              <FBXModel
                cabinet={cabinet}
                item={item}
                onPointerEnter={handleRaycastPointerHover}
                onPointerLeave={handleRaycastPointerOut}
                onPointerDown={handleLongTouchStart}
                onPointerUp={handleLongTouchEnd}
                onDoubleClick={handleRaycastPointer}
                getModelMaterial={getModelMaterial}
              />
              {showCuboidCollider && (
                <CuboidCollider
                  key={item.uuid}
                  args={[0.55 * cabinet.width, 1.3, 0.6]}
                  position={[0, 1.3, 0]}
                />
              )}
            </Suspense>
          </group>
        </Movable>
      );
    });
  }, [
    droppedModel,
    CABINET_ITEMS,
    width,
    height,
    depth,
    selectedID,
    setSelectedID,
    setSelectedModelID,
    clickOutline,
    setClickOutline,
    clickedModel,
    setClickedModel,
    setMesh,
    setIsDoubleClickedModel,
    setSelectedMesh,
    scene,
    showCuboidCollider,
    placedModels, // Wichtig: placedModels als Dependency
    handleRaycastPointerHover,
    handleRaycastPointerOut,
    handleLongTouchStart,
    handleLongTouchEnd,
    handleRaycastPointer,
    getModelMaterial,
  ]);

  return (
    <>
      <Physics timeStep="vary">
        <group
          scale={[
            roomSize.width / 600,
            roomSize.height / 285,
            roomSize.length / 600,
          ]}
        >
          <RigidBody type="fixed" colliders="trimesh">
            <Ground />
            {room?.scene && <primitive object={room.scene} />}
          </RigidBody>
        </group>
        {renderDroppedModels}
      </Physics>
    </>
  );
}
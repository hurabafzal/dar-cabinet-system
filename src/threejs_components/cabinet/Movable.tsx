// Movable.tsx - Komplette Version mit Wall-Orientierungs-Fix
import { Html } from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RigidBody, useFixedJoint } from "@react-three/rapier";
import { v4 as uuidv4 } from "uuid";
import * as THREE from "three";
import { useModelStore } from "../../store/modelSlice";
import { Select } from "@react-three/postprocessing";
import { useFrame } from "@react-three/fiber";
import { useConfiguratorStore } from "../../store/configuratorSlice";
import { useIndexStore } from "../../store/indexSlice";
import { useThree } from "@react-three/fiber";
import { findSnapTarget, findNearestWallPoint, enforceRoomBoundaries, WALL_ADJUST } from "../../utils/wallSnap";
import { adjustPositionToAvoidCollisions } from "../../utils/collisionDetection";
import { useDraftStore } from "../../store/draftStore";
import { useHistoryStore } from "../../store/historyStore";

const GLOBAL_OBJECT_POSITIONS: Record<string, THREE.Vector3> = {};
// Make it accessible to history store
if (typeof window !== 'undefined') {
  (window as any).GLOBAL_OBJECT_POSITIONS = GLOBAL_OBJECT_POSITIONS;
}

export function Movable({ selectedID, setSelectedID, modelIndex, setSelectedModelID, children, ...props }: any) {
  const setIsOrbitState = useIndexStore((select: any) => select.setIsOrbitState);
  // Access the saveDraft function from the draft store
  const { saveDraft } = useDraftStore();
  const { debouncedPushToHistory, pushToHistory } = useHistoryStore();
  const setDroppedModel = useModelStore((select: any) => select.setDroppedModel);
  const droppedModel = useModelStore((select: any) => select.droppedModel);
  const setSeletedModel = useModelStore((select: any) => select.setSeletedModel);
  const roomSize = useConfiguratorStore((select: any) => select.roomSize);
  const [activeObjectPositions, setActiveObjectPositions] = useState<Record<string, THREE.Vector3>>({});
  const [lastSnapUuid, setLastSnapUuid] = useState<string | null>(null);
  const [snapDirection, setSnapDirection] = useState<'left' | 'right' | null>(null);
  const [hideButton, setHideButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [snapRestriction, setSnapRestriction] = useState<{x: number, direction: 'left' | 'right'} | null>(null);
  
  // ✅ NEUE Wall-Orientierungs-States
  const [baseWallRotation, setBaseWallRotation] = useState<THREE.Quaternion>(new THREE.Quaternion());
  const [currentWallType, setCurrentWallType] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const [rotationSteps, setRotationSteps] = useState(0); // Relative Rotations-Schritte
  const [initialDragWallType, setInitialDragWallType] = useState<'front' | 'back' | 'left' | 'right'>('front');
  
  // States für Snapping
  const { viewport, camera } = useThree();
  const [screenSize, setScreenSize] = useState('desktop');
  
  useEffect(() => {
    const checkElements = () => {
      const toggleBtn = document.querySelector('.toggleBtn.keybind');
      const iconSidebar = document.querySelector('.icon-sidebar');
      
      const shouldHide = !!(toggleBtn?.classList.contains('visible') || 
                     iconSidebar?.classList.contains('visible'));
      
      setHideButton(shouldHide);
    };

    const observer = new MutationObserver(checkElements);
    
    const toggleBtn = document.querySelector('.toggleBtn.keybind');
    const iconSidebar = document.querySelector('.icon-sidebar');
    
    if (toggleBtn) observer.observe(toggleBtn, { attributes: true, attributeFilter: ['class'] });
    if (iconSidebar) observer.observe(iconSidebar, { attributes: true, attributeFilter: ['class'] });
    
    checkElements(); // Initial check
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Hilfsfunktion für Raumgrenzen
  /*
  const getRoomBounds = () => {
    if (!roomSize) return null;
    return {
      frontWallZ: 0,
      backWallZ: -1 * roomSize.length * 7.6 / 600 + 0.5,
      leftWallX: roomSize.width * 7.8 / 600 / 2 - 0.7,
      rightWallX: -1 * roomSize.width * 7.8 / 600 / 2 + 0.5
    };
  };*/

  // Utility: return rotation so the object's front faces into the room
  const getWallRotation = (wallType: 'front' | 'back' | 'left' | 'right') => {
    const rotations = {
      // Models schauen rückwärts -> 180° drehen
      front: Math.PI,            // front wall -> gedreht ins Zimmer
      back: 0,                   // back wall -> gedreht ins Zimmer
      left: -Math.PI / 2,        // left wall -> gedreht ins Zimmer
      right: Math.PI / 2         // right wall -> gedreht ins Zimmer
    };
    return new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotations[wallType]
    );
  };

  // ✅ ÜBERARBEITETES Initial Setup mit Wall-Snapping
  useEffect(() => {
    if (!props.item || !props.item.uuid) return;

    let initialPosition = new THREE.Vector3(
      props.position ? props.position[0] : 0,
      props.position ? props.position[1] : 0,
      props.position ? props.position[2] : 0
    );

    // ✅ AUTOMATISCH an nächste Wand snappen
    const wallSnap = findNearestWallPoint(initialPosition, roomSize);
    const snappedPosition = wallSnap ? wallSnap.position : initialPosition;
    const wallType = wallSnap ? wallSnap.wallType : 'front';

    // ✅ Korrekte Wand-Rotation setzen
    setCurrentWallType(wallType as 'front' | 'back' | 'left' | 'right');
    
    // ✅ States setzen - FIX für clone() Error
    setCurrentWallType(wallType as 'front' | 'back' | 'left' | 'right');
    const wallRotation = getWallRotation(wallType as 'front' | 'back' | 'left' | 'right');
    setBaseWallRotation(new THREE.Quaternion().copy(wallRotation));
    setCurrentObjectRotation(new THREE.Quaternion().copy(wallRotation));
    setRotationSteps(0);

    // ✅ Position und Rotation anwenden
    setActiveObjectPositions(prev => ({
      ...prev,
      [props.item.uuid]: snappedPosition
    }));

    GLOBAL_OBJECT_POSITIONS[props.item.uuid] = snappedPosition;
    
    // Prevent collisions on initialization with a short delay to ensure all positions are updated
    setTimeout(() => {
      // Only process if there are multiple items
      if (Object.keys(GLOBAL_OBJECT_POSITIONS).length > 1) {
        console.log(`Checking collisions for item ${props.item.uuid} on initialization`);
        
        // Create object sizes map
        const objectSizes: Record<string, {width: number, depth: number, height: number}> = {};
        objectSizes[props.item.uuid] = {
          width: props.item?.width || 0.6,
          depth: props.item?.depth || 0.4,
          height: props.item?.height || 1.0
        };
        
        // Clone positions without this item
        const otherPositions: Record<string, THREE.Vector3> = {};
        Object.entries(GLOBAL_OBJECT_POSITIONS).forEach(([uuid, position]) => {
          if (uuid !== props.item.uuid) {
            otherPositions[uuid] = position.clone();
          }
        });
        
        // Find a non-colliding position
        if (Object.keys(otherPositions).length > 0) {
          const adjustedPosition = adjustPositionToAvoidCollisions(
            snappedPosition.clone(),
            props.item.uuid,
            props.item?.width || 0.6,
            props.item?.depth || 0.4,
            props.item?.height || 1.0,
            otherPositions,
            objectSizes
          );
          
          // Only apply if position changed
          if (!adjustedPosition.equals(snappedPosition)) {
            console.log(`Adjusting initial position for ${props.item.uuid} to avoid collision`);
            GLOBAL_OBJECT_POSITIONS[props.item.uuid] = adjustedPosition;
            setActiveObjectPositions(prev => ({
              ...prev,
              [props.item.uuid]: adjustedPosition
            }));
            
            // Apply the new position to the object
            if (obj.current) {
              obj.current.setTranslation(adjustedPosition, true);
            }
          }
        }
      }
    }, 500); // Delay to ensure all items are loaded

    // ✅ WICHTIG: Rotation auch auf RigidBody anwenden!
    setTimeout(() => {
      if (obj.current) {
        obj.current.setRotation(wallRotation, true);
      }
    }, 0);

    return () => {
      setActiveObjectPositions(prev => {
        const newState = { ...prev };
        delete newState[props.item.uuid];
        return newState;
      });
      delete GLOBAL_OBJECT_POSITIONS[props.item.uuid];
    };
  }, [props.item?.uuid, props.position, roomSize]);

  useEffect(() => {
    (window as any).GLOBAL_OBJECT_POSITIONS = GLOBAL_OBJECT_POSITIONS;
  }, []);

  useEffect(() => {
    const syncedPositions: Record<string, THREE.Vector3> = {};
    Object.entries(GLOBAL_OBJECT_POSITIONS).forEach(([uuid, pos]) => {
      syncedPositions[uuid] = pos;
    });
    setActiveObjectPositions(syncedPositions);
  }, [Object.keys(GLOBAL_OBJECT_POSITIONS).length]);

  // States für Snapping
  const [isSnapping, setIsSnapping] = useState<boolean>(false);
  const [snapPoint, setSnapPoint] = useState<THREE.Vector3 | null>(null);
  const [currentWallTypeSnap, setCurrentWallTypeSnap] = useState<string | null>(null);
  const [snapType, setSnapType] = useState<string | null>(null);
  const [snapTargetId, setSnapTargetId] = useState<string | null>(null);
  
  // Wall collision detection placeholder for future enhancement
  // const [wallCollision, setWallCollision] = useState<{left: boolean, right: boolean, front: boolean, back: boolean} | null>(null);
  // const collisionTimeout = useRef<NodeJS.Timeout | null>(null);

  // Standardstates
  const id = useMemo(() => uuidv4(), []);

  const [matrix] = useState(() => {
    const position = props.position || [0, 0, 0];
    const rotation = props.rotation || [0, 0, 0];
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
    const matrix = new THREE.Matrix4();
    matrix.compose(new THREE.Vector3(position[0], position[1], position[2]), quaternion, new THREE.Vector3(1, 1, 1));
    return matrix;
  });

  const [vec] = useState(() => new THREE.Vector3());
  const rot = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  const obj: any = useRef();
  const pointer: any = useRef();
  const indicatorRef = useRef<THREE.Mesh>(null);
  const [xAxis, setXAxis] = useState(true);
  const [zAxis, setZAxis] = useState(true);
  
  // Listen to history restore events to update positions
  useEffect(() => {
    const handleHistoryRestore = (event: any) => {
      const positions = event.detail?.positions || [];
      const positionData = positions.find((p: any) => p.uuid === props.item?.uuid);
      
      if (positionData && obj.current) {
        const newPosition = new THREE.Vector3(
          positionData.position[0],
          positionData.position[1],
          positionData.position[2]
        );
        
        // Update GLOBAL_OBJECT_POSITIONS
        GLOBAL_OBJECT_POSITIONS[props.item.uuid] = newPosition;
        
        // Update active positions
        setActiveObjectPositions(prev => ({
          ...prev,
          [props.item.uuid]: newPosition
        }));
        
        // Update the physical object position
        matrix.setPosition(newPosition);
        pointer.current?.setNextKinematicTranslation(newPosition);
        obj.current?.setTranslation(newPosition, true);
      }
    };
    
    window.addEventListener('historyRestore', handleHistoryRestore as EventListener);
    return () => window.removeEventListener('historyRestore', handleHistoryRestore as EventListener);
  }, [props.item?.uuid, matrix]);
  
  // Update position when props.position changes (from droppedModel updates)
  // Skip update if we're currently updating from handlePointerUp or dragging to prevent circular updates
  useEffect(() => {
    // Skip update if we're dragging or updating position ourselves
    if (isUpdatingPosition.current || isDragging.current) {
      return;
    }
    
    if (props.position && props.item?.uuid && obj.current) {
      const newPosition = new THREE.Vector3(
        props.position[0],
        props.position[1],
        props.position[2]
      );
      
      // Validate the new position
      if (!isFinite(newPosition.x) || !isFinite(newPosition.y) || !isFinite(newPosition.z)) {
        console.warn('[Movable] Invalid position from props, skipping update:', newPosition);
        return;
      }
      
      // Only update if position actually changed
      const currentPos = obj.current.translation();
      if (currentPos) {
        const currentVec = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
        // Use distance check instead of equals for better tolerance
        const distance = currentVec.distanceTo(newPosition);
        if (distance > 0.01) {
          // Only update if the new position is significantly different and valid
          // Update GLOBAL_OBJECT_POSITIONS
          GLOBAL_OBJECT_POSITIONS[props.item.uuid] = newPosition;
          
          // Update active positions
          setActiveObjectPositions(prev => ({
            ...prev,
            [props.item.uuid]: newPosition
          }));
          
          // Update the physical object position
          matrix.setPosition(newPosition);
          pointer.current?.setNextKinematicTranslation(newPosition);
          obj.current?.setTranslation(newPosition, true);
        }
      }
    }
  }, [props.position, props.item?.uuid, matrix]);

  // Verbesserte Bewegungs-Refs mit Snap-Lock und Kamera-Lock
  const isDragging = useRef(false);
  const isUpdatingPosition = useRef(false); // Prevent circular updates from useEffect
  const dragPlane = useRef(new THREE.Plane());
  const dragOffset = useRef(new THREE.Vector3());
  const dragIntersect = useRef(new THREE.Vector3());
  const dragTimeout = useRef<NodeJS.Timeout | null>(null);
  const dragStartPos = useRef(new THREE.Vector3());
  const lastMousePosition = useRef(new THREE.Vector2());
  const dragVelocity = useRef(new THREE.Vector3());
  const lastFrameTime = useRef(Date.now());
  const smoothingFactor = useRef(0.15);
  const isCurrentlySnapped = useRef(false);
  const snapLockPosition = useRef(new THREE.Vector3());
  const cameraLockActive = useRef(false);
  const cameraLockTimeout = useRef<NodeJS.Timeout | null>(null);

  // Konstanten für besseres Snapping
  const LONG_PRESS_DURATION = 500; // Erhöht von 200ms → weniger versehentliches Dragging
  const DRAG_SENSITIVITY = 1.2;
  const VELOCITY_DAMPING = 0.92;
  const MIN_VELOCITY = 0.001;
  const SNAP_SENSITIVITY = 1.5;
  const MAX_SNAP_DISTANCE = 0.8;
  const MAX_WALL_SNAP_DISTANCE = 1.2;
  const MAX_OBJECT_SNAP_DISTANCE = 0.6;

  const [dragReady, setDragReady] = useState(false);
  const [highlightScale, setHighlightScale] = useState(1);

  // Sichere Kamera-Lock Funktionen
  /*const lockCamera = (reason: string, duration?: number) => {
    cameraLockActive.current = true;
    setIsOrbitState(false);
    
    if (duration) {
      if (cameraLockTimeout.current) {
        clearTimeout(cameraLockTimeout.current);
      }
      cameraLockTimeout.current = setTimeout(() => {
        unlockCamera(`Auto-unlock after ${duration}ms`);
      }, duration);
    }
  };*/

  /*const unlockCamera = (reason: string) => {
    cameraLockActive.current = false;
    setIsOrbitState(true);
    
    if (cameraLockTimeout.current) {
      clearTimeout(cameraLockTimeout.current);
      cameraLockTimeout.current = null;
    }
  };*/

  useEffect(() => {
    return () => {
      if (cameraLockTimeout.current) {
        clearTimeout(cameraLockTimeout.current);
      }
    };
  }, []);

  // Unlock the camera when this object is deselected
  useEffect(() => {
    if (selectedID !== id && cameraLockActive.current) {
      //unlockCamera("Object deselected - releasing camera");
    }
  }, [selectedID, id]);

  // Effect für Highlight und Kamera-Management
  useEffect(() => {
    setHighlightScale(dragReady ? 1.05 : 1);
    if (dragReady) {
      //lockCamera("Drag ready - preventing camera movement");
    }
  }, [dragReady]);

  useFixedJoint(pointer, obj, [
    [0, 0, 0],
    [0, 0, 0, 1],
    [0, 0, 0],
    [0, 0, 0, 1]
  ]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    props.setIsDoubleClickedModel(false);
    const formattedArray = Array(props.clickOutline.length).fill(false);
    formattedArray[modelIndex] = true;
    props.setClickOutline(formattedArray);
    if (!props.clickOutline) props.setSelectedMesh("null");
    setSeletedModel(props.item);
    props.setClickedModel(e.eventObject.children[1]);
    setSelectedModelID(modelIndex);

    const newSelectedID = selectedID ? null : id;
    setSelectedID(newSelectedID);
  };

  const [currentSnapState, setCurrentSnapState] = useState<{
    isSnapping: boolean;
    snapPoint: THREE.Vector3;
    snapType: string | null;
    targetUuid: string | null;
    wallType: string | null;
  } | null>(null);

  // useRef for wall types to track during drag operations
  const currentWallTypeRef = useRef<string | null>(null);
  const initialDragWallTypeRef = useRef<string | null>(null);
  
  // Rotation-related state (needed for the component to work)
  const [currentRotationStep] = useState(0);
  const [currentObjectRotation, setCurrentObjectRotation] = useState(new THREE.Quaternion());
  
  // Function to trigger a draft save with the current state
  const saveDraftWithCurrentState = useCallback(async () => {
    try {
      // Get current user ID (you might need to adapt this based on your user management)
      const userId = localStorage.getItem('dar-user-id') || 'anonymous';
      
      // Get configurator store state
      const state = useConfiguratorStore.getState();
      
      // Access the necessary properties with type checking
      const roomSize = state.roomSize;
      const width = state.width;
      const height = state.height;
      const depth = state.depth;
      
      // This is a simplified version - you may need to get this data differently
      const cabinetCount = Object.keys(GLOBAL_OBJECT_POSITIONS).length;
      
      // Only save if we have models placed
      if (cabinetCount === 0) return;
      
      // Create order data
      const orderData = {
        orderInfo: {
          orderId: "draft",
          orderDate: new Date().toLocaleDateString('de-DE'),
          orderTime: new Date().toLocaleTimeString('de-DE'),
          orderStatus: "Draft"
        },
        designDetails: {
          designId: "draft",
          cabinetCount: cabinetCount,
          sizeDetails: {
            width: width * 60 || 0,
            height: height || 0,
            depth: depth || 0
          },
          roomSize: roomSize || { width: 0, height: 0, length: 0 }
        },
        lastModified: new Date().toISOString(),
        // Include furniture positions
        furniturePositions: Object.entries(GLOBAL_OBJECT_POSITIONS).map(([uuid, position]) => ({
          uuid,
          position: {
            x: position.x,
            y: position.y,
            z: position.z
          }
        }))
      };
      
      // Call the saveDraft function
      console.log('Saving draft during item movement...');
      await saveDraft(userId, orderData);
    } catch (error) {
      console.error('Error saving draft during movement:', error);
    }
  }, [saveDraft]);

  // Handles the rotation button click event
  const handleRotateBtnClick = (degree: number) => {
    if (!obj.current) return;

    //lockCamera("Object rotation - camera locked", 500);

    // ✅ Relative Rotation basierend auf aktueller Wand
    const nextSteps = (rotationSteps + 1) % 4;
    const relativeRotationRad = THREE.MathUtils.degToRad(nextSteps * 90);
    
    // ✅ Neue Rotation = Base-Wall-Rotation + Relative Rotation - FIX für clone() Error
    const relativeRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), relativeRotationRad);
    const finalRotation = new THREE.Quaternion().copy(baseWallRotation).multiply(relativeRotation);

    const currentRapierQuat = obj.current.rotation();
    const startQuaternion = new THREE.Quaternion(
      currentRapierQuat.x,
      currentRapierQuat.y, 
      currentRapierQuat.z,
      currentRapierQuat.w
    );

    let startTime = Date.now();
    const duration = 300;

    const animateRotation = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const tempQuaternion = new THREE.Quaternion();
      tempQuaternion.slerpQuaternions(startQuaternion, finalRotation, easeProgress);
      obj.current?.setRotation(tempQuaternion);

      if (progress < 1) {
        requestAnimationFrame(animateRotation);
      } else {
        setRotationSteps(nextSteps);
        setCurrentObjectRotation(new THREE.Quaternion().copy(finalRotation));
      }
    };

    animateRotation();
  };

  // Vereinfachtes aber effektives useFrame mit Kamera-Schutz
  useFrame((state, delta) => {
    if (cameraLockActive.current) return;
    // Snap-Indikator Animation
    if (isSnapping && snapPoint && indicatorRef.current) {
      const material = indicatorRef.current.material as THREE.MeshBasicMaterial;
      if (material) {
        const pulse = 0.4 + Math.sin(state.clock.elapsedTime * 6) * 0.3;
        material.opacity = pulse;
      }
    }

    if (isCurrentlySnapped.current) {
      const currentPos = obj.current?.translation();
      dragVelocity.current.set(0, 0, 0);
      return;
    }

    // KRITISCH: Kein Momentum wenn Objekt ausgewählt ist
    if (selectedID === id) {
      dragVelocity.current.set(0, 0, 0);
      return;
    }

    // DEAKTIVIERT: Momentum-Bewegung verursacht unkontrolliertes Springen bei Clicks
    // Die Velocity wird auch bei normalen Clicks gesetzt, was zu ungewollten Bewegungen führt
  });

  const handlePointerDown = (e: any) => {
    // Call saveDraft when mouse is down to ensure saving during movement
    // saveDraftWithCurrentState();
    
    setIsOrbitState(false);
    e.stopPropagation();

    if (id !== selectedID) {
      handleClick(e);
    }

    setSnapDirection(null);

    isCurrentlySnapped.current = false;
    snapLockPosition.current.set(0, 0, 0);

    const pos = obj.current?.translation();
    if (!pos) return;

    // Store the current wall type in our ref
    currentWallTypeRef.current = currentWallType;
    initialDragWallTypeRef.current = currentWallType;
    
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    if (Math.abs(cameraDirection.y) > 0.7) {
      dragPlane.current.set(new THREE.Vector3(0, 1, 0), -pos.y);
    } else {
      if (currentWallType === 'left' || currentWallType === 'right') {
        dragPlane.current.set(new THREE.Vector3(1, 0, 0), -pos.x);
      } else {
        dragPlane.current.set(new THREE.Vector3(0, 0, 1), -pos.z);
      }
    }

    e.ray.intersectPlane(dragPlane.current, dragIntersect.current);
    dragOffset.current.copy(new THREE.Vector3(pos.x, pos.y, pos.z)).sub(dragIntersect.current);
    dragStartPos.current.copy(pos);
    
    lastMousePosition.current.set(e.clientX || 0, e.clientY || 0);
    dragVelocity.current.set(0, 0, 0);
    lastFrameTime.current = Date.now();

    if (e.target?.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }

    dragTimeout.current = setTimeout(() => {
      isDragging.current = true;
      setDragReady(true);
      setIsOrbitState(false);
    }, LONG_PRESS_DURATION);
  };

  // ✅ ERWEITERTE handlePointerMove mit Wall-Snapping
  const handlePointerMove = (e: any) => {
    if (!isDragging.current) return;

    e.stopPropagation();

    const currentTime = Date.now();
    const deltaTime = currentTime - lastFrameTime.current;
    lastFrameTime.current = currentTime;

    e.ray.intersectPlane(dragPlane.current, dragIntersect.current);
    
    const targetPos = new THREE.Vector3().copy(dragIntersect.current).add(dragOffset.current);
    
    let rawPosition = new THREE.Vector3();
    const currentPos = obj.current?.translation();
    
    if (currentPos) {
      const deltaX = (targetPos.x - dragStartPos.current.x) * DRAG_SENSITIVITY;
      const deltaZ = (targetPos.z - dragStartPos.current.z) * DRAG_SENSITIVITY;
      
      let newX = dragStartPos.current.x + deltaX;
      
      // ✅ EINFACHE BEWEGUNGSEINSCHRÄNKUNG - nur 3 Zeilen!
      if (snapRestriction) {
        if (snapRestriction.direction === 'left' && newX > snapRestriction.x) newX = snapRestriction.x;
        if (snapRestriction.direction === 'right' && newX < snapRestriction.x) newX = snapRestriction.x;
      }
      
      rawPosition.set(
        newX, // Verwende die eingeschränkte X-Position
        dragStartPos.current.y,
        dragStartPos.current.z + deltaZ
      );
    }

    // First, enforce room boundaries and handle collisions with other objects
    // Clone all positions to ensure we're working with fresh data
    const currentObjectPositions: Record<string, THREE.Vector3> = {};
    Object.entries(GLOBAL_OBJECT_POSITIONS).forEach(([uuid, pos]) => {
      currentObjectPositions[uuid] = pos.clone();
    });
    
    // Create object sizes map with actual dimensions if available
    const objectSizes: Record<string, {width: number, depth: number, height: number}> = {};
    if (props.item?.uuid) {
      objectSizes[props.item.uuid] = {
        width: props.item?.width || 0.6,
        depth: props.item?.depth || 0.4,
        height: props.item?.height || 1.0
      };
    }
    
    // Apply robust collision detection with room boundaries
    const boundaryResult = enforceRoomBoundaries(
      rawPosition.clone(),
      roomSize,
      props.item?.width || 0.6,
      props.item?.depth || 0.4,
      props.item?.uuid, // Current object's UUID
      currentObjectPositions, // Fresh clone of all object positions
      objectSizes // Object sizes with accurate dimensions
    );
    
    // Wall collision detection - temporarily disabled
    // if (boundaryResult.exceededWalls) {
    //   // Future enhancement: visual feedback for wall collisions
    // }
    
    let constrainedPosition = boundaryResult.position;
    // Preserve Y coordinate from drag start
    constrainedPosition.y = dragStartPos.current.y;
    let finalPosition = constrainedPosition.clone();
    
    if (roomSize) {
      const snapTarget = new THREE.Vector3(constrainedPosition.x, dragStartPos.current.y, constrainedPosition.z);
      const snap = findSnapTarget(snapTarget, roomSize, props.item.uuid, GLOBAL_OBJECT_POSITIONS);

      if (snap) {
        const snapDistance = snapTarget.distanceTo(snap.position);
        let maxAllowedDistance = MAX_SNAP_DISTANCE;
        
        if (snap.snapType.startsWith('wall')) {
          maxAllowedDistance = MAX_WALL_SNAP_DISTANCE;
        } else if (snap.targetId) {
          maxAllowedDistance = MAX_OBJECT_SNAP_DISTANCE;
        }
        
        if (snapDistance <= maxAllowedDistance) {
          isCurrentlySnapped.current = true;
          snapLockPosition.current.copy(snap.position);
          // Preserve Y coordinate when snapping
          snapLockPosition.current.y = dragStartPos.current.y;
          finalPosition.copy(snapLockPosition.current);
          
          dragVelocity.current.set(0, 0, 0);
          
          setCurrentSnapState({
            isSnapping: true,
            snapPoint: new THREE.Vector3().copy(finalPosition),
            snapType: snap.snapType,
            targetUuid: snap.targetId ?? null,
            wallType: snap.snapType.startsWith("wall-") ? snap.snapType.split("-")[1] : null,
          });

          setIsSnapping(true);
          setSnapPoint(new THREE.Vector3().copy(finalPosition));
          setSnapType(snap.snapType);
          const newWallType = snap.snapType.startsWith("wall-") ? snap.snapType.split("-")[1] : null;
          setCurrentWallTypeSnap(newWallType);
          setSnapTargetId(snap.targetId ?? null);
          
          if (snap.targetId) {
            setLastSnapUuid(snap.targetId);
            const targetPos = GLOBAL_OBJECT_POSITIONS[snap.targetId];
            if (targetPos) {
              const dx = rawPosition.x - targetPos.x;
              const direction = dx > 0 ? 'right' : 'left';
              setSnapRestriction({ x: finalPosition.x, direction });
              setSnapDirection(direction);
            }
          }

          if (snap.snapType.includes('left')) {
            setSnapDirection('left');
          } else if (snap.snapType.includes('right')) {
            setSnapDirection('right');
          }
        } else {
          handleNoSnap();
        }
      } else {
        handleNoSnap();
      }
    }

    function handleNoSnap() {
      if (isCurrentlySnapped.current) {
        isCurrentlySnapped.current = false;
      }
      
      setCurrentSnapState(null);
      setIsSnapping(false);
      setSnapPoint(null);
      setSnapType(null);
      setCurrentWallTypeSnap(null);
      setSnapTargetId(null);
      setSnapDirection(null);
      
      const currentVec = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z);
      const movement = new THREE.Vector3().subVectors(rawPosition, currentVec);
      
      if (deltaTime > 0) {
        dragVelocity.current.lerp(movement.multiplyScalar(1000 / deltaTime), 0.3);
      }
      
      finalPosition = currentVec.lerp(rawPosition, 0.6);
      // Preserve Y coordinate
      finalPosition.y = dragStartPos.current.y;
      
      obj.current?.setRotation(currentObjectRotation);
    }

    // Preserve Y coordinate in final position
    finalPosition.y = dragStartPos.current.y;
    
    // Update GLOBAL_OBJECT_POSITIONS in real-time for collision detection (matching main branch)
    GLOBAL_OBJECT_POSITIONS[props.item.uuid] = finalPosition;
    
    // Rotation during snapping
    if (isCurrentlySnapped.current) {
      obj.current?.setRotation(currentObjectRotation);
    }

    pointer.current?.setNextKinematicTranslation(finalPosition);
    obj.current?.setTranslation(finalPosition, true);
    vec.copy(finalPosition);
  };

  // ✅ SIMPLIFIED handlePointerUp matching main branch logic
  const handlePointerUp = (e?: any) => {
    if (e) {
      e.stopPropagation();
    }

    if (dragTimeout.current) {
      clearTimeout(dragTimeout.current);
      dragTimeout.current = null;
    }

    if (!isDragging.current) {
      setDragReady(false);
      setHighlightScale(1);
      setIsOrbitState(true);
      return;
    }

    isDragging.current = false;
    setDragReady(false);
    setHighlightScale(1);
    dragVelocity.current.set(0, 0, 0);

    // Get final position (from snap or current)
    let finalPosition = new THREE.Vector3();
    const currentPos = obj.current?.translation();
    
    // Use fallback position if currentPos is invalid
    const fallbackPos = GLOBAL_OBJECT_POSITIONS[props.item.uuid] || dragStartPos.current;
    
    if (currentPos) {
      if (isCurrentlySnapped.current && snapLockPosition.current) {
        // Use snapped position
        finalPosition.copy(snapLockPosition.current);
      } else {
        // Use current position
        finalPosition.copy(currentPos);
      }
    } else {
      // Fallback to last known position or drag start
      finalPosition.copy(fallbackPos);
    }
    
    // Preserve Y coordinate from drag start
    finalPosition.y = dragStartPos.current.y;
    
    // Clone all positions for boundary enforcement
    const currentObjectPositions: Record<string, THREE.Vector3> = {};
    Object.entries(GLOBAL_OBJECT_POSITIONS).forEach(([uuid, pos]) => {
      if (uuid !== props.item?.uuid) {
        currentObjectPositions[uuid] = pos.clone();
      }
    });
    
    // Create object sizes map
    const objectSizes: Record<string, {width: number, depth: number, height: number}> = {};
    if (props.item?.uuid) {
      objectSizes[props.item.uuid] = {
        width: props.item?.width || 0.6,
        depth: props.item?.depth || 0.4,
        height: props.item?.height || 1.0
      };
    }

    // Apply boundary enforcement one final time (matching main branch)
    const boundaryResult = enforceRoomBoundaries(
      finalPosition,
      roomSize,
      props.item?.width || 0.6,
      props.item?.depth || 0.4,
      props.item?.uuid,
      currentObjectPositions,
      objectSizes
    );
    
    finalPosition = boundaryResult.position;
    
    // Validate final position - ensure it's not NaN or invalid
    if (!isFinite(finalPosition.x) || !isFinite(finalPosition.y) || !isFinite(finalPosition.z)) {
      console.warn('[Movable] Invalid position detected in handlePointerUp, using fallback:', {
        finalPosition: { x: finalPosition.x, y: finalPosition.y, z: finalPosition.z },
        fallbackPos: { x: fallbackPos.x, y: fallbackPos.y, z: fallbackPos.z },
        dragStartPos: { x: dragStartPos.current.x, y: dragStartPos.current.y, z: dragStartPos.current.z }
      });
      finalPosition.copy(fallbackPos);
      finalPosition.y = dragStartPos.current.y;
    }
    
    // Ensure Y coordinate is preserved after boundary enforcement
    finalPosition.y = dragStartPos.current.y;
    
    // Debug log for position updates
    if (process.env.NODE_ENV === 'development') {
      console.log('[Movable] handlePointerUp - Final position:', {
        uuid: props.item?.uuid,
        position: { x: finalPosition.x.toFixed(3), y: finalPosition.y.toFixed(3), z: finalPosition.z.toFixed(3) },
        wasSnapped: isCurrentlySnapped.current,
        boundaryResult: boundaryResult.exceededWalls
      });
    }

    // Update positions in order (matching main branch)
    // NOTE: Main branch does NOT update droppedModel here - it's handled elsewhere
    GLOBAL_OBJECT_POSITIONS[props.item.uuid] = finalPosition;
    setActiveObjectPositions(prev => ({
      ...prev,
      [props.item.uuid]: finalPosition
    }));
    matrix.setPosition(finalPosition);
    pointer.current?.setNextKinematicTranslation(finalPosition);
    obj.current?.setTranslation(finalPosition, true);
    
    // NOTE: We don't update droppedModel here to match main branch behavior
    // The position will be synced via props.position updates from the parent component
    // This prevents circular updates that cause cabins to disappear

    // Reset snap state
    isCurrentlySnapped.current = false;
    snapLockPosition.current.set(0, 0, 0);
    
    setTimeout(() => {
      setLastSnapUuid(null);
      setIsSnapping(false);
      setSnapPoint(null);
      setSnapType(null);
      setCurrentWallTypeSnap(null);
      setSnapTargetId(null);
      setSnapDirection(null);
      setCurrentSnapState(null);
      dragVelocity.current.set(0, 0, 0);
      setSnapRestriction(null);
    }, 1000);

    if (e && e.target?.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
    
    setIsOrbitState(true);
    
    // Call saveDraft when pointer is released
    saveDraftWithCurrentState();
    
    // Push to history using debounced version to prevent too many entries during rapid movements
    // This will only create a history entry after movement stops for 500ms
    // Use debouncedPushToHistory which automatically creates snapshot with current state
    debouncedPushToHistory();
  };

  return (
    <>
      {id === selectedID && (
        <Html
          distanceFactor={4}
          position={[
            (obj.current?.translation()?.x || 0) + (screenSize === 'mobile' ? 0.3 : 0.2),
            screenSize === 'mobile' ? 1.4 : 2,
            (obj.current?.translation()?.z || 0)
          ]}
          center
          zIndexRange={[100, 105]}
        >
          <button className="htmlContent2" onClick={() => { handleRotateBtnClick(90); }}>90°</button>
        </Html>
      )}
      {selectedID === id && !dragReady && !hideButton && null}
      {dragReady && (
        <Html distanceFactor={4} position={[0, 1.6, 0]} center>
          <div className="dragReadyTag">Move</div>
        </Html>
      )}

      {/* Erweiterte Snap-Indikatoren für bessere Sichtbarkeit */}
      {currentSnapState && currentSnapState.isSnapping && (
        <>
          {/* Hauptindikator mit Typ-Information */}
          <mesh position={currentSnapState.snapPoint}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial
              color={
                currentSnapState.snapType?.startsWith('wall') ? "#44aaff" : 
                currentSnapState.targetUuid ? "#ff4444" : "#44ff44"
              }
              transparent
              opacity={0.7}
            />
          </mesh>

          {/* Bodenmarkierung mit verbesserter Sichtbarkeit */}
          <group
            position={[
              currentSnapState.snapPoint.x,
              0.01,
              currentSnapState.snapPoint.z
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            {/* Basis-Ring */}
            <mesh>
              <ringGeometry args={[0.12, 0.16, 32]} />
              <meshBasicMaterial
                color={
                  currentSnapState.snapType?.startsWith('wall') ? "#44aaff" : 
                  currentSnapState.targetUuid ? "#ff4444" : "#44ff44"
                }
                transparent
                opacity={0.7}
              />
            </mesh>

            {/* Innerer Ring */}
            <mesh>
              <ringGeometry args={[0.08, 0.10, 32]} />
              <meshBasicMaterial
                color={
                  currentSnapState.snapType?.startsWith('wall') ? "#88ccff" : 
                  currentSnapState.targetUuid ? "#ff8888" : "#88ff88"
                }
                transparent
                opacity={0.5}
              />
            </mesh>
          </group>

          {/* Animierter äußerer Ring */}
          <mesh ref={indicatorRef}>
            <ringGeometry args={[0.18, 0.22, 32]} />
            <meshBasicMaterial
              color={
                currentSnapState.snapType?.startsWith('wall') ? "#66ccff" : 
                currentSnapState.targetUuid ? "#ff6666" : "#66ff66"
              }
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>

            {/* Zentrale Punkt-Markierung */}
            <mesh>
              <circleGeometry args={[0.04, 16]} />
              <meshBasicMaterial
                color={
                  currentSnapState.snapType?.startsWith('wall') ? "#ffffff" : 
                  currentSnapState.targetUuid ? "#ffffff" : "#ffffff"
                }
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>

          {/* Debug-Info für Entwicklung */}
          {currentSnapState.snapType && (
            <Html
              position={[
                currentSnapState.snapPoint.x,
                currentSnapState.snapPoint.y + 0.3,
                currentSnapState.snapPoint.z
              ]}
              center
            >
              <div style={{
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                pointerEvents: 'none'
              }}>
                {currentSnapState.snapType}
                {currentSnapState.targetUuid && ` → ${currentSnapState.targetUuid.slice(0,8)}`}
              </div>
            </Html>
          )}
        </>
      )}

      <Select enabled={props.clickOutline[modelIndex]}>
        <group
          scale={highlightScale}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          {...props}
        >
          <RigidBody canSleep={false} type="kinematicPosition" ref={pointer} />
          <RigidBody
            ref={obj}
            type="fixed"
            ccd
            canSleep={false}
            colliders={false}
            enabledRotations={[false, false, false]}
          >
            {children}
          </RigidBody>
        </group>
      </Select>
      {/* Wall collision indicators - temporarily removed */}
      {/* Visual feedback for wall collisions will be added in future enhancement */}
    </>
  );
}

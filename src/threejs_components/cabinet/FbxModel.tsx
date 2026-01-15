import { useFBX } from '@react-three/drei'
import { useMemo, useEffect, useCallback } from 'react'
import { TextureLoader, RepeatWrapping, MeshStandardMaterial, Box3, Vector3, BufferAttribute } from 'three'
import { ThreeEvent, useThree } from '@react-three/fiber'

interface Cabinet {
  modelUrl: string
  width: number
}

interface Item {
  uuid: string
  id?: string
}

interface FBXModelProps {
  cabinet: Cabinet
  item: Item
  onPointerEnter?: (event: ThreeEvent<PointerEvent>) => void
  onPointerLeave?: (event: ThreeEvent<PointerEvent>) => void
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void
  onDoubleClick?: (event: ThreeEvent<MouseEvent>) => void
  getModelMaterial: (uuid: string, componentName: string) => string | null | undefined
}

const FBXModel: React.FC<FBXModelProps> = ({ 
  cabinet, 
  item, 
  onPointerEnter, 
  onPointerLeave, 
  onPointerDown, 
  onPointerUp, 
  onDoubleClick, 
  getModelMaterial 
}) => {
  const fbx = useFBX(cabinet.modelUrl)
  const { invalidate } = useThree() // Force render update
  
  // Function to generate/normalize UV coordinates - ensures ALL meshes use the same UV mapping
  // This fixes the issue where doors have different UVs than frames/shelves
  const generateUVCoordinates = useCallback((geometry: any, forceRegenerate: boolean = false) => {
    const positions = geometry.attributes.position;
    if (!positions) return;
    
    // If UVs exist and we're not forcing regeneration, check if we should normalize them
    if (geometry.attributes.uv && !forceRegenerate) {
      return; // Keep existing UVs if not forcing regeneration
    }
    
    const vertexCount = positions.count;
    const uvs = new Float32Array(vertexCount * 2);
    
    // Compute bounding box for planar mapping
    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox;
    if (!bbox) return;
    
    const size = new Vector3();
    bbox.getSize(size);
    const min = bbox.min;
    
    // CRITICAL: Use the SAME projection plane for ALL components (doors, frames, shelves)
    // This ensures consistent texture appearance - doors will match frames/shelves exactly
    // Use XY plane (front view) projection for all components to ensure consistency
    for (let i = 0; i < vertexCount; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      
      // Use XY plane projection for ALL components - SAME for doors, frames, and shelves
      // This ensures textures appear with the same brightness and color on all components
      const u = (x - min.x) / (size.x || 1);
      const v = (y - min.y) / (size.y || 1);
      
      // Normalize to 0-1 range and ensure consistent coordinate system
      const normalizedU = Math.max(0, Math.min(1, u));
      const normalizedV = Math.max(0, Math.min(1, v));
      
      uvs[i * 2] = normalizedU;
      uvs[i * 2 + 1] = 1 - normalizedV; // Flip V coordinate for consistency
    }
    
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
    geometry.attributes.uv.needsUpdate = true;
  }, []);

  const clonedFbx = useMemo(() => {
    const cloned = fbx.clone()
    
    // Don't clone materials here - let applyMaterials create new materials with textures
    // This prevents lighter default materials from being used
    // AND normalize UV coordinates for ALL meshes (doors, frames, shelves) to use same mapping
    cloned.traverse((child: any) => {
      if (child.isMesh) {
        // Don't clone materials - applyMaterials will create proper materials with textures
        // This ensures materials are created with correct textures from the start
        // CRITICAL: Normalize UV coordinates for ALL meshes to ensure consistent texture appearance
        // This fixes the issue where doors appear lighter than frames/shelves
        if (child.geometry) {
          const meshName = child.name.toLowerCase();
          // Check if this is a door, frame, shelf, or panel - normalize UVs for all
          const isDoor = meshName.includes("door");
          const isFrame = meshName.includes("frame") || meshName.includes("shelf") || 
                         meshName.includes("panel") || meshName.includes("cube") || 
                         meshName.includes("plane");
          
          // Force regenerate UVs for doors and frames/shelves to use same mapping
          if (isDoor || isFrame) {
            generateUVCoordinates(child.geometry, true); // Force regeneration
          } else if (!child.geometry.attributes.uv) {
            // For other meshes, only generate if missing
            generateUVCoordinates(child.geometry, false);
          }
        }
      }
    })
    
    // Reset any existing scale first
    cloned.scale.set(1, 1, 1)
    cloned.updateMatrixWorld(true)
    
    // Calculate the bounding box to get the actual model size
    const box = new Box3().setFromObject(cloned)
    const size = new Vector3()
    box.getSize(size)
    
    console.log('Original model size:', size.x, size.y, size.z)
    console.log('Target cabinet width:', cabinet.width)
    
    // Scale the model to match the cabinet width
    // NOTE: Model needs 0.01 base scale for proper visibility/positioning
    // The actual size scaling is handled by the Movable component in Model.tsx
    if (size.x > 0) {
      const calculatedScale = cabinet.width / size.x
      console.log('Calculated scale:', calculatedScale)
      // Use 0.01 base scale for proper model visibility and positioning
      // The Movable component applies additional scaling: [width, height/240, depth/60]
      cloned.scale.set(0.01, 0.01, 0.01)
    }
    
    cloned.rotation.y = -Math.PI
    
    return cloned
  }, [fbx, cabinet.width, generateUVCoordinates])

  const applyMaterials = useCallback(() => {
    if (!clonedFbx) return

    const textureLoader = new TextureLoader()
    
    // Normalize UV coordinates for ALL meshes (doors, frames, shelves) before applying textures
    // This ensures consistent texture appearance - doors will match frames/shelves
    clonedFbx.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        const meshName = child.name.toLowerCase();
        const isDoor = meshName.includes("door");
        const isFrame = meshName.includes("frame") || meshName.includes("shelf") || 
                       meshName.includes("panel") || meshName.includes("cube") || 
                       meshName.includes("plane");
        
        // Force normalize UVs for doors and frames/shelves to use same mapping
        if (isDoor || isFrame) {
          generateUVCoordinates(child.geometry, true); // Force regeneration for consistency
        } else if (!child.geometry.attributes.uv) {
          // For other meshes, only generate if missing
          generateUVCoordinates(child.geometry, false);
        }
      }
    });
    
    // ✅ CRITICAL FIX FOR CABINET 7: Mapping table for mesh names to component names
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
    
    // Apply materials to this specific model
    clonedFbx.traverse((child: any) => {
      if (child.isMesh) {
        // Map mesh names to component names for Cabinet 7/10
        let componentName = child.name;
        if (item.id === "CABIENT7" || item.id === "CABIENT10") {
          componentName = getComponentNameForCabinet7(child.name);
          console.log(`🔍 Cabinet ${item.id} Mesh: "${child.name}" → "${componentName}"`);
        }
        
        const materialUrl = getModelMaterial(item.uuid, componentName)
        
        if (materialUrl) {
          console.log(`✅ Found material for ${componentName}: ${materialUrl.substring(0, 50)}...`);
        } else {
          console.log(`⚠️ No material URL for ${componentName}, using default material`);
        }
        
        // ──────────────────────────────────────────────────────────────────────
        // FORCE DOORS TO ALWAYS RECREATE MATERIAL - Never skip for doors
        // ──────────────────────────────────────────────────────────────────────
        const meshName = child.name.toLowerCase();
        const isDoor = meshName.includes("door") || componentName === "Door";
        
        // For doors, NEVER skip - always recreate to ensure correct material
        if (isDoor && materialUrl) {
          // Force recreate material for doors - don't skip
        } else if (materialUrl) {
          // For non-doors, check if we can skip
          const currentTextureUrl = child.material?.map?.image?.src;
          if (currentTextureUrl === materialUrl) {
            const isTextureFullyLoaded = child.material.map?.image?.complete && 
                                         child.material.map.image.width > 0 &&
                                         child.material.map.image.height > 0;
            const isCorrectMaterialType = child.material.type === 'MeshStandardMaterial';
            const hasCorrectProperties = (child.material as any).metalness === 0.1 && 
                                        (child.material as any).roughness === 0.4 &&
                                        child.material.color.getHex() === 0xffffff;
            
            if (isTextureFullyLoaded && isCorrectMaterialType && hasCorrectProperties) {
              child.userData.originalMaterial = child.material;
              const isFrame = meshName.includes("frame") || meshName.includes("shelf") || 
                             meshName.includes("panel") || meshName.includes("cube") || 
                             meshName.includes("plane");
              if (isFrame && child.geometry) {
                generateUVCoordinates(child.geometry, true);
              }
              child.material.needsUpdate = true;
              if (child.material.map) {
                child.material.map.needsUpdate = true;
              }
              invalidate();
              return;
            }
          }
        }
        
        // Store old material reference - dispose it INSIDE texture callback to prevent race conditions
        const oldMaterial = child.material;
        
        if (materialUrl) {
          // Load and apply texture
          textureLoader.load(
            materialUrl, 
            (texture) => {
              // Configure texture properties FIRST
              texture.wrapS = texture.wrapT = RepeatWrapping
              texture.repeat.set(1, 1)
              texture.flipY = false // Important for some textures
              // Use SRGBColorSpace for newer Three.js versions, or sRGBEncoding for older
              if ('colorSpace' in texture) {
                (texture as any).colorSpace = 'srgb'; // Newer Three.js (r152+)
              } else if ('encoding' in texture) {
                (texture as any).encoding = 3001; // Older Three.js (sRGBEncoding = 3001)
              }
              texture.needsUpdate = true
              
              // Verify texture loaded and image is ready
              if (!texture.image) {
                console.error(`❌ Texture image not loaded for ${componentName}`);
                return;
              }
              
              // CRITICAL: Wait for image to be fully loaded before creating material
              // This ensures the texture displays correctly from the start (not lighter)
              if (!texture.image.complete || texture.image.width === 0) {
                // Image not ready yet, wait for it to load
                texture.image.onload = () => {
                  applyMaterialWithTexture();
                };
                return;
              }
              
              // Image is ready, apply material immediately
              applyMaterialWithTexture();
              
              function applyMaterialWithTexture() {
                console.log(`📦 Texture loaded for ${componentName}:`, {
                  width: texture.image.width,
                  height: texture.image.height,
                  url: materialUrl.substring(0, 50) + '...'
                });
                
                // Dispose old material
                if (oldMaterial && oldMaterial !== child.material) {
                  if (oldMaterial.map) oldMaterial.map.dispose();
                  oldMaterial.dispose();
                }
                
                // Create material with texture
                const newMaterial = new MeshStandardMaterial({
                  map: texture,
                  color: 0xffffff,
                  metalness: 0.1,
                  roughness: 0.4,
                });
                
                if ('colorSpace' in texture) {
                  (texture as any).colorSpace = 'srgb';
                }
                
                newMaterial.userData = { textureUrl: materialUrl };
                
                // CRITICAL: Set originalMaterial and assign to mesh - MUST be same reference
                child.userData.originalMaterial = newMaterial;
                child.material = newMaterial;
                
                // CRITICAL: Ensure they're the same - if not, force it
                if (child.material !== child.userData.originalMaterial) {
                  child.material = child.userData.originalMaterial;
                }
                
                // Force all updates
                child.material.needsUpdate = true;
                child.visible = true;
                child.matrixWorldNeedsUpdate = true;
                if (child.geometry) {
                  child.geometry.attributes.uv.needsUpdate = true;
                }
                
                invalidate();
                
                // Force verify and fix after render
                requestAnimationFrame(() => {
                  if (child.material !== child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial;
                    child.material.needsUpdate = true;
                    invalidate();
                  }
                });
                
                // CRITICAL: Force all updates IMMEDIATELY to ensure material displays correctly
                child.material.needsUpdate = true
                if (child.material.map) {
                  child.material.map.needsUpdate = true
                  // Force texture to update
                  if (child.material.map.image) {
                    child.material.map.image.needsUpdate = true;
                  }
                }
                
                // Force geometry to update
                if (child.geometry) {
                  child.geometry.attributes.uv.needsUpdate = true;
                  child.geometry.attributes.position.needsUpdate = true;
                }
                
                // Force mesh to be visible and update
                child.visible = true;
                child.matrixWorldNeedsUpdate = true;
                
                // CRITICAL: Force render update MULTIPLE times with aggressive verification
                // This ensures the material is actually displayed, not just assigned
                invalidate();
                
                // Force another update after a tiny delay to ensure render happens
                setTimeout(() => {
                  // CRITICAL: Verify and fix material if it was reverted
                  if (child.material !== newMaterial) {
                    console.warn(`⚠️ Material was replaced after assignment for ${child.name}, restoring...`);
                    child.material = newMaterial;
                    child.userData.originalMaterial = newMaterial;
                    child.material.needsUpdate = true;
                  }
                  invalidate();
                  
                  // Final verification after render - force one more time if needed
                  setTimeout(() => {
                    if (child.material !== newMaterial) {
                      console.error(`❌ Material still incorrect for ${child.name} after 2 attempts, forcing one more time...`);
                      child.material = newMaterial;
                      child.userData.originalMaterial = newMaterial;
                      child.material.needsUpdate = true;
                      invalidate();
                    }
                  }, 10);
                }, 0);
              }
              
              // Force mesh to update
              child.visible = true
              child.matrixWorldNeedsUpdate = true
              if (child.geometry) {
                child.geometry.computeBoundingBox()
                child.geometry.computeBoundingSphere()
                // UV coordinates are already normalized before texture loading (above in applyMaterials)
                // No need to regenerate here as it would cause texture to change appearance
              }
              
              // Force render update
              invalidate()
              
              // Verify material state after assignment
              setTimeout(() => {
                const hasMap = !!child.material?.map;
                const mapUrl = child.material?.map?.image?.src || 'N/A';
                console.log(`✅ Texture applied to ${componentName} (${child.name}):`, {
                  component: componentName,
                  meshName: child.name,
                  textureUrl: materialUrl.substring(0, 50) + '...',
                  hasMap: hasMap,
                  mapUrl: mapUrl.substring(0, 50) + '...',
                  materialColor: child.material?.color?.getHexString(),
                  textureWidth: texture.image?.width,
                  textureHeight: texture.image?.height,
                  materialId: child.material?.uuid
                });
              }, 100);
            },
            (progress) => {
              // Progress callback - can be used for loading indicators
              if (progress.lengthComputable) {
                const percentComplete = (progress.loaded / progress.total) * 100;
                console.log(`📥 Loading texture for ${componentName}: ${percentComplete.toFixed(0)}%`);
              }
            },
            (error) => {
              console.error(`❌ Error loading texture for ${componentName}:`, error)
              console.error(`❌ Failed URL: ${materialUrl}`)
            }
          )
        } else {
          // No material URL - use default material
          child.material = new MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.1,
            roughness: 0.4,
          })
          console.log(`⚠️ No material URL for ${componentName}, using default material`);
        }
      }
    })
  }, [clonedFbx, item.uuid, item.id, getModelMaterial, generateUVCoordinates, invalidate])

  useEffect(() => {
    applyMaterials()
    
    // Cleanup function to dispose textures and materials
    return () => {
      if (clonedFbx) {
        clonedFbx.traverse((child: any) => {
          if (child.isMesh && child.material) {
            // Dispose texture
            if (child.material.map) {
              child.material.map.dispose()
            }
            // Dispose material
            child.material.dispose()
          }
        })
      }
    }
  }, [applyMaterials, clonedFbx])
  
  // Listen for material updates when placedModels changes
  useEffect(() => {
    let updateTimeout: NodeJS.Timeout | null = null;
    let lastUpdateTime = 0;
    const DEBOUNCE_DELAY = 100; // Reduced debounce delay for faster updates
    
    const handleForceModelUpdate = (event: any) => {
      if (event.detail?.uuid === item.uuid) {
        const now = Date.now();
        
        // Clear any pending updates
        if (updateTimeout) {
          clearTimeout(updateTimeout);
          updateTimeout = null;
        }
        
        // Apply immediately on first call or if enough time has passed
        const timeSinceLastUpdate = now - lastUpdateTime;
        if (timeSinceLastUpdate < DEBOUNCE_DELAY && lastUpdateTime > 0) {
          // Only debounce if this is a rapid subsequent call
          console.log(`⏸️ Debouncing material update for ${item.uuid} (${timeSinceLastUpdate}ms since last)`);
          updateTimeout = setTimeout(() => {
            console.log('🔄 Applying debounced material update for', item.uuid);
            applyMaterials();
            lastUpdateTime = Date.now();
            updateTimeout = null;
          }, DEBOUNCE_DELAY - timeSinceLastUpdate);
        } else {
          // Apply immediately for first call or if enough time has passed
          console.log('🔄 Applying material update immediately for', item.uuid);
          applyMaterials();
          lastUpdateTime = now;
        }
      }
    };
    
    window.addEventListener('forceModelUpdate', handleForceModelUpdate);
    return () => {
      window.removeEventListener('forceModelUpdate', handleForceModelUpdate);
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [item.uuid, applyMaterials])
  
  // Listen to history restore events to force material updates
  useEffect(() => {
    const handleHistoryRestoreMaterials = (event: any) => {
      console.log('🔄 History restore materials event received, updating materials for', item.uuid)
      const restoredPlacedModels = event.detail?.placedModels || []
      const restoredModel = restoredPlacedModels.find((m: any) => m.uuid === item.uuid)
      
      if (!clonedFbx) return
      
      const textureLoader = new TextureLoader()
      
      // ✅ CRITICAL FIX FOR CABINET 7: Mapping table for mesh names to component names
      const getComponentNameForCabinet7Restore = (rawName: string): string => {
        const normalizedName = rawName.toLowerCase().trim();
        
        if (normalizedName.includes("door") || 
            normalizedName.includes("leftdoor") || 
            normalizedName.includes("rightdoor") ||
            normalizedName.includes("doordoor")) {
          return "Door";
        }
        if (normalizedName.includes("handle") || normalizedName.includes("hang")) {
          return "Handle";
        }
        if (normalizedName.includes("hinge")) {
          return "Hinge";
        }
        if (normalizedName.includes("shelf") || 
            normalizedName.includes("frame") || 
            normalizedName.includes("panel") ||
            normalizedName.includes("leftpanel") ||
            normalizedName.includes("rightpanel") ||
            normalizedName.includes("cube") ||
            normalizedName.includes("plane")) {
          return "Frame";
        }
        if (normalizedName.includes("drawer")) {
          return "Drawer";
        }
        return "Frame";
      };
      
      // Apply materials from the restored snapshot directly
      clonedFbx.traverse((child: any) => {
        if (child.isMesh) {
          // Map mesh names to component names for Cabinet 7/10
          let componentName = child.name;
          if (item.id === "CABIENT7" || item.id === "CABIENT10") {
            componentName = getComponentNameForCabinet7Restore(child.name);
          }
          
          const materialUrl = restoredModel?.materials?.[componentName]?.url || null
          
          // Dispose existing material first
          if (child.material) {
            if (child.material.map) {
              child.material.map.dispose()
            }
            child.material.dispose()
          }
          
          if (materialUrl) {
            console.log(`🔄 Restoring material for ${componentName}: ${materialUrl}`)
            // Load and apply texture
            textureLoader.load(
              materialUrl, 
              (texture) => {
                texture.wrapS = texture.wrapT = RepeatWrapping
                texture.repeat.set(1, 1)
                
                // Create a NEW material for this mesh
                child.material = new MeshStandardMaterial({
                  map: texture,
                  metalness: 0.1,
                  roughness: 0.4,
                })
                
                // Force material update
                child.material.needsUpdate = true
              },
              undefined,
              (error) => {
                console.error('Error loading texture for', componentName, ':', error)
              }
            )
          } else {
            // No material URL - use default material
            console.log(`🔄 No material found for ${componentName}, using default`)
            child.material = new MeshStandardMaterial({
              color: 0xcccccc,
              metalness: 0.1,
              roughness: 0.4,
            })
          }
        }
      })
    }
    
    window.addEventListener('historyRestoreMaterials', handleHistoryRestoreMaterials)
    return () => window.removeEventListener('historyRestoreMaterials', handleHistoryRestoreMaterials)
  }, [clonedFbx, item.uuid, item.id])

  return (
    <primitive
      object={clonedFbx}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    />
  )
}

export default FBXModel
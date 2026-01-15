// hooks/useInitialLoad.ts
import { useEffect, useRef, useState } from 'react';
import { useDraftStore } from '../store/draftStore';
import { useConfiguratorStore } from '../store/configuratorSlice';
import { useModelStore } from '../store/modelSlice';
import { useIndexStore } from '../store/indexSlice';
import { useOrderStore } from '../store/orderStore';
import { getUserData } from '../helpers/jwtHelper';

export const useInitialLoad = (setComputedPrice?: (price: any) => void) => {
  const { loadLatestDraft, isLoaded } = useDraftStore();
  const isInitialLoadComplete = useRef(false);
  const [isLoading, setIsLoading] = useState(false);

  // All stores to update when loading
  const setWidth = useConfiguratorStore((state: any) => state.setWidth);
  const setHeight = useConfiguratorStore((state: any) => state.setHeight);
  const setDepth = useConfiguratorStore((state: any) => state.setDepth);
  const setRoomSize = useConfiguratorStore((state: any) => state.setRoomSize);
  const setPrice = useConfiguratorStore((state: any) => state.setPrice);

  const setDroppedModel = useModelStore((state: any) => state.setDroppedModel);
  const setPlacedModels = useIndexStore((state: any) => state.setPlacedModels);
  const MATERIAL_ITEMS = useIndexStore((state: any) => state.MATERIAL_ITEMS);

  const regenerateMaterialUrls = (placedModels: any[]) => {
    return placedModels.map((model: any) => {
      if (model.materials) {
        const newMaterials = { ...model.materials };
        Object.keys(newMaterials).forEach(key => {
          const material = newMaterials[key];
          const materialCategory = MATERIAL_ITEMS?.find((item: any) => item.name === material.category);
          const texture = materialCategory?.textures?.find((t: any) => t.name === material.name);
          if (texture) {
            newMaterials[key] = { ...material, url: texture.textureSrc };
          }
        });
        return { ...model, materials: newMaterials };
      }
      return model;
    });
  };

  //setPlacedModels(updatedPlacedModels);
  const setOrderData = useOrderStore((state: any) => state.setOrderData);

  // ✅ FIX: Funktion zur verzögerten 3D-Material-Aktualisierung
  // Only dispatch once with a single delay to prevent multiple rapid updates
  const triggerMaterialUpdate = (placedModels: any[]) => {
    // Use a single delay instead of multiple to prevent material recreation
    // The debouncing in FbxModel.tsx will handle rapid events
    setTimeout(() => {
      placedModels.forEach((model: any) => {
        if (model.materials) {
          window.dispatchEvent(new CustomEvent('forceModelUpdate', {
            detail: {
              uuid: model.uuid,
              materials: model.materials
            }
          }));
        }
      });
    }, 200); // Single delay instead of multiple
  };

  useEffect(() => {
    const loadInitialDesign = async () => {
      // Skip if already loaded, loading in progress, or previously completed
      if (isLoaded || isLoading || isInitialLoadComplete.current) return;

      // Set loading state to prevent multiple calls
      setIsLoading(true);
      isInitialLoadComplete.current = true;

      // Get user ID
      const userData = await getUserData();
      const userId = userData?.decoded?.sub;

      if (!userId) {
        console.warn('No user ID found, skipping initial load');
        setIsLoading(false);
        return;
      }

      try {
        const orderData = await loadLatestDraft(userId);

        if (orderData) {
          // ✅ FIX: Restore configuration
          if (orderData.designDetails?.sizeDetails) {
            const { width, height, depth } = orderData.designDetails.sizeDetails;
            if (width) setWidth(width / 60); // Convert back from stored format
            if (height) setHeight(height);
            if (depth) setDepth(depth);
          }

          // ✅ FIX: Restore room size
          if (orderData.designDetails?.roomSize) {
            setRoomSize(orderData.designDetails.roomSize);
          }

          // ✅ FIX: Restore models
          if (orderData.fullModelData && Array.isArray(orderData.fullModelData)) {
            setDroppedModel(orderData.fullModelData);

            // ✅ DAS HINZUFÜGEN: GLOBAL_OBJECT_POSITIONS beim Laden setzen
            orderData.fullModelData.forEach((model: any) => {
              if (model.uuid && model.position) {
                window.dispatchEvent(new CustomEvent('setGlobalPosition', {
                  detail: {
                    uuid: model.uuid,
                    position: { x: model.position[0], y: model.position[1], z: model.position[2] }
                  }
                }));
              }
            });
          }

          if (orderData.fullModelData && orderData.fullModelData.length > 0) {
            console.log("🔄 Starting price recalculation for loaded draft");
            
            // Kurz warten bis alle Stores aktualisiert sind
            setTimeout(async () => {
              try {
                let newPrices = {
                  Total: 0,
                  Frame: 0,
                  Drawer: 0,
                  Shelf: 0,
                  Door: 0
                };

                // Für jedes geladene Cabinet Preis berechnen
                for (const cabinet of orderData.fullModelData) {
                  const model = orderData.placedModels?.find((m: any) => m.uuid === cabinet.uuid);
                  
                  if (model) {
                    const components = ['Frame', 'Shelf', 'Door', 'Drawer'];
                    
                    for (const component of components) {
                      if (model.materials?.[component]) {
                        const materialCategory = model.materials[component].category;
                        const materialType = materialCategory === "DAR LUX" ? "Cleaf" :
                                           materialCategory === "DAR PLUS" ? "Egger" : "Atlas";
                        
                        // Hier musst du deine getPrice Funktion importieren
                        // oder eine vereinfachte Berechnung machen
                        console.log(`📦 Cabinet ${cabinet.id} ${component}: ${materialType}`);
                        // Temporär: Setze feste Preise für Test
                        if (component === "Frame") newPrices.Frame += 50;
                        if (component === "Shelf") newPrices.Shelf += 30;
                        if (component === "Door") newPrices.Door += 36;
                        newPrices.Total += 50; // Beispielwert
                      }
                    }
                  }
                }

                console.log("✅ Calculated new prices:", newPrices);
                if (setComputedPrice) {
                  setComputedPrice(newPrices);
                }
              } catch (error) {
                console.error("❌ Error recalculating prices:", error);
              }
            }, 1500);
          }

          // ✅ FIX: Restore placed models MIT Materialien
          if (orderData.placedModels && Array.isArray(orderData.placedModels)) {
            const updatedPlacedModels = regenerateMaterialUrls(orderData.placedModels);
            setPlacedModels(updatedPlacedModels);
            
            // Trigger 3D material updates
            triggerMaterialUpdate(updatedPlacedModels);
            
            // ✅ NEU: Preise neu berechnen statt laden
            if (orderData.fullModelData && orderData.fullModelData.length > 0) {
              // Event senden um Preise neu zu berechnen
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('recalculatePrices', {
                  detail: { droppedModels: orderData.fullModelData }
                }));
              }, 1000); // Kurz warten bis alles geladen ist
            }
          }

          // ✅ FIX: Restore computed price
          console.log("🔍 FULL orderData:", orderData);
          console.log("🔍 orderData.computedPrice:", orderData.computedPrice);
          console.log("🔍 setComputedPrice function exists:", !!setComputedPrice);

          if (setComputedPrice) {
            console.log("🚨 CALLING setComputedPrice with:", orderData.computedPrice);
            setComputedPrice(orderData.computedPrice);
            console.log("✅ setComputedPrice CALLED!");
          } else {
            console.log("❌ setComputedPrice function not provided!");
          }

          // Set complete order data
          setOrderData(orderData);

          // Prüfen ob UUIDs übereinstimmen:
          orderData.fullModelData?.forEach((dropped: any) => {
            const placed = orderData.placedModels?.find((p: any) => p.uuid === dropped.uuid);
          });
        } else {
          console.log('ℹ️ No previous design found - starting fresh');
        }
      } catch (error) {
        console.error('❌ Failed to load initial design:', error);
      } finally {
        // Always clear loading state
        setIsLoading(false);
      }
    };

    loadInitialDesign();
  }, [loadLatestDraft, isLoaded]);

  return { isLoading };
};
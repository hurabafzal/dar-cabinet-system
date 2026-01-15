// hooks/useAutoSave.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import { useDraftStore } from '../store/draftStore';
import { useConfiguratorStore } from '../store/configuratorSlice';
import { useModelStore } from '../store/modelSlice';
import { useIndexStore } from '../store/indexSlice';
import { useHistoryStore } from '../store/historyStore';
import { getUserData } from '../helpers/jwtHelper';

// Debounce delay in milliseconds
const SAVE_DELAY = 500;

export const useAutoSave = (computedPrice: any) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [userId, setUserId] = useState<string | null>(null);

  // Draft Store
  const { saveDraft, isAutoSaving } = useDraftStore();
  const { debouncedPushToHistory } = useHistoryStore();

  // Configuration Store
  const width = useConfiguratorStore((state: any) => state.width);
  const height = useConfiguratorStore((state: any) => state.height);
  const depth = useConfiguratorStore((state: any) => state.depth);
  const roomSize = useConfiguratorStore((state: any) => state.roomSize);

  // Model Store
  const droppedModel = useModelStore((state: any) => state.droppedModel);
  const seletedModel = useModelStore((state: any) => state.seletedModel);

  // Index Store
  const placedModels = useIndexStore((state: any) => state.placedModels);

  // ✅ Load user ID once on mount
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const userData = await getUserData();
        setUserId(userData?.decoded?.sub || null);
      } catch (error) {
        console.error('Failed to get user data:', error);
        setUserId(null);
      }
    };
    loadUserId();
  }, []);

  // useAutoSave.ts - createOrderData Funktion anpassen
  const createOrderData = useCallback(() => {
    // ✅ Aktuelle Positionen aus GLOBAL_OBJECT_POSITIONS holen
    const modelsWithCurrentPositions = droppedModel?.map((model: any) => {
      const globalPos = (window as any).GLOBAL_OBJECT_POSITIONS?.[model.uuid];

      if (globalPos) {
        return {
          ...model,
          position: [globalPos.x, globalPos.y, globalPos.z]
        };
      }

      return model;
    }) || [];

    return {
      orderInfo: {
        orderId: "draft",
        orderDate: new Date().toLocaleDateString('de-DE'),
        orderTime: new Date().toLocaleTimeString('de-DE'),
        orderStatus: "Draft"
      },
      customerInfo: {
        fullName: "Draft User",
        phoneNumber: "N/A",
        email: "N/A",
      },
      designDetails: {
        designId: "draft",
        cabinetCount: modelsWithCurrentPositions.length,
        materials: {
          category: "N/A",
          selectedComponent: "N/A",
        },
        sizeDetails: {
          width: width * 60 || 0,
          height: height || 0,
          depth: depth || 0
        },
        roomSize: roomSize || { width: 0, height: 0, length: 0 }
      },
      fullModelData: modelsWithCurrentPositions?.map((model: any) => ({
        ...model,
        // URLs entfernen, nur IDs/Namen behalten
        materials: model.materials ? Object.fromEntries(
          Object.entries(model.materials).map(([key, material]: [string, any]) => [
            key,
            {
              name: material.name,
              category: material.category,
              // URL NICHT speichern!
            }
          ])
        ) : undefined
      })) || [],
      placedModels: placedModels?.map((model: any) => ({
        ...model,
        materials: model.materials ? Object.fromEntries(
          Object.entries(model.materials).map(([key, material]: [string, any]) => [
            key,
            {
              name: material.name,
              category: material.category,
              // URL NICHT speichern!
            }
          ])
        ) : undefined
      })) || [],
      computedPrice: computedPrice,
      lastModified: new Date().toISOString()
    };
  }, [width, height, depth, roomSize, computedPrice, droppedModel, placedModels]);

  // Debounced save function
  const debouncedSave = useCallback(() => {
    if (!userId) {
      console.warn('No user ID found, skipping auto-save');
      return;
    }

    // ✅ NUR SPEICHERN WENN PREIS BERECHNET WURDE
    const hasModels = droppedModel?.length > 0;
    const hasValidPrice = computedPrice?.Total && computedPrice.Total > 0;

    if (hasModels && !hasValidPrice) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      const orderData = createOrderData();
      await saveDraft(userId, orderData);
    }, SAVE_DELAY);
  }, [userId, createOrderData, saveDraft, droppedModel?.length, computedPrice?.Total]);

  // Watch for changes and trigger auto-save and history update
  useEffect(() => {
    // Only auto-save if we have meaningful data
    const hasData = droppedModel?.length > 0 ||
      width !== 1 ||
      height !== 240 ||
      depth !== 55;

    if (hasData && !isAutoSaving && userId) {
      debouncedSave();
      // Use the debounced version for auto-saving history
      debouncedPushToHistory();
    }

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    // Configuration changes
    width, height, depth, roomSize,
    // Model changes
    droppedModel, placedModels,
    // Price changes
    computedPrice,
    // Dependencies
    debouncedSave, isAutoSaving, userId
  ]);

  useEffect(() => {
    const handleForceAutoSave = () => {
      console.log("🚀 FORCED AUTO-SAVE triggered");
      console.log("Current droppedModel in force save:", droppedModel);

      const orderData = createOrderData();

      if (userId) {
        saveDraft(userId, orderData);
      }
    };

    window.addEventListener('forceAutoSave', handleForceAutoSave);
    return () => window.removeEventListener('forceAutoSave', handleForceAutoSave);
  }, [createOrderData, userId, saveDraft, droppedModel]);

  // Manual save function
  const manualSave = useCallback(async () => {
    if (!userId) return false;

    const orderData = createOrderData();
    const designId = await saveDraft(userId, orderData);
    return !!designId;
  }, [userId, createOrderData, saveDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAutoSaving,
    manualSave,
    hasUnsavedChanges: !!saveTimeoutRef.current
  };
};
import { create } from "zustand";
import { useIndexStore } from "./indexSlice";
import { useModelStore } from "./modelSlice";
import { useConfiguratorStore } from "./configuratorSlice";
import debounce from "lodash/debounce";

// Types
type RoomSize = {
  width: number;
  height: number;
  length: number;
} | null;

type PlacedModel = {
  id: string;
  uuid: string;
  [key: string]: any;
};

type CabinetPosition = {
  uuid: string;
  position: [number, number, number];
};

interface StateSnapshot {
  placedModels: PlacedModel[];
  droppedModel: PlacedModel[];
  width: number;
  height: number;
  depth: number;
  roomSize: RoomSize;
  computedPrice: any;
  cabinetPositions: CabinetPosition[];
  timestamp: number;
}

interface HistoryState {
  history: StateSnapshot[];
  currentIndex: number;
  maxHistory: number;
  past: StateSnapshot[];
  future: StateSnapshot[];
  maxHistorySize: number;
  canUndo: boolean;
  canRedo: boolean;
  isUndoRedo: boolean;
  pushToHistory: (state: StateSnapshot) => void;
  debouncedPushToHistory: (computedPrice?: any) => void;
  undo: () => void;
  redo: () => void;
  setComputedPriceCallback: (callback: () => any) => void;
}

const createDeepCopy = <T>(obj: T): T => {
  if (!obj) return [] as unknown as T;
  return JSON.parse(JSON.stringify(obj));
};

// Function to get GLOBAL_OBJECT_POSITIONS from Movable.tsx
const getGlobalObjectPositions = (): Record<string, { x: number; y: number; z: number }> => {
  // Access the global positions from the window object (set by Movable.tsx)
  const globalPositions = (window as any).GLOBAL_OBJECT_POSITIONS || {};
  const positions: Record<string, { x: number; y: number; z: number }> = {};
  
  Object.entries(globalPositions).forEach(([uuid, pos]: [string, any]) => {
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number') {
      positions[uuid] = { x: pos.x, y: pos.y, z: pos.z };
    }
  });
  
  return positions;
};

const createSnapshot = (computedPrice?: any): StateSnapshot => {
  const indexState = useIndexStore.getState();
  const modelState = useModelStore.getState();
  const configState = useConfiguratorStore.getState();
  
  // Get current cabinet positions from GLOBAL_OBJECT_POSITIONS
  const globalPositions = getGlobalObjectPositions();
  
  // Create cabinet positions array
  const cabinetPositions: CabinetPosition[] = Object.entries(globalPositions).map(([uuid, pos]) => ({
    uuid,
    position: [pos.x, pos.y, pos.z] as [number, number, number]
  }));
  
  // Get computedPrice from parameter or try to get it from a global state
  // If not provided, we'll get it from Configurator via a callback
  const price = computedPrice || (window as any).__COMPUTED_PRICE__ || {};

  return {
    placedModels: createDeepCopy(indexState.placedModels || []) as PlacedModel[],
    droppedModel: createDeepCopy(modelState.droppedModel || []) as PlacedModel[],
    width: configState.width,
    height: configState.height,
    depth: configState.depth,
    roomSize: createDeepCopy(configState.roomSize) as RoomSize,
    computedPrice: createDeepCopy(price),
    cabinetPositions: createDeepCopy(cabinetPositions),
    timestamp: Date.now()
  };
};

// Callback to get computedPrice from Configurator
let computedPriceCallback: (() => any) | null = null;

const applySnapshot = (snapshot: StateSnapshot, onPriceUpdate?: (price: any) => void) => {
  console.log('Applying snapshot:', snapshot);
  
  // Update droppedModel with positions from snapshot
  const updatedDroppedModel = snapshot.droppedModel.map((model: any) => {
    const positionData = snapshot.cabinetPositions.find((cp) => cp.uuid === model.uuid);
    if (positionData) {
      return {
        ...model,
        position: positionData.position
      };
    }
    return model;
  });
  
  useIndexStore.setState({ placedModels: createDeepCopy(snapshot.placedModels) });
  useModelStore.setState({ droppedModel: createDeepCopy(updatedDroppedModel) });
  useConfiguratorStore.setState({
    width: snapshot.width,
    height: snapshot.height,
    depth: snapshot.depth,
    roomSize: snapshot.roomSize
  });
  
  // Update GLOBAL_OBJECT_POSITIONS - this will be handled by Movable.tsx listening to droppedModel changes
  // We dispatch an event that Movable.tsx will listen to
  
  // Update computedPrice if callback is provided
  if (onPriceUpdate && snapshot.computedPrice) {
    onPriceUpdate(snapshot.computedPrice);
  }
  
  // Dispatch event to trigger position updates in Movable components
  window.dispatchEvent(new CustomEvent('historyRestore', { 
    detail: { positions: snapshot.cabinetPositions } 
  }));
  
  // Dispatch event to trigger material updates in Model components
  // Use a small delay to ensure store is updated first
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('historyRestoreMaterials', { 
      detail: { placedModels: snapshot.placedModels } 
    }));
  }, 50);
};

export const useHistoryStore = create<HistoryState>((set, get) => {
  // Create a debounced version of the push function
  const debouncedPush = debounce((computedPrice?: any) => {
    if (get().isUndoRedo) {
      set({ isUndoRedo: false });
      return;
    }

    const state = createSnapshot(computedPrice);
    console.log('Creating debounced history snapshot:', state);
    
    set((current) => {
      const newHistory = [...current.history.slice(0, current.currentIndex + 1), state].slice(-current.maxHistory);
      const newIndex = newHistory.length - 1;
      
      return {
        history: newHistory,
        currentIndex: newIndex,
        past: newHistory.slice(0, newIndex),
        future: [],
        canUndo: newIndex >= 0 && newHistory.length > 1, // Can undo if we have at least 2 snapshots
        canRedo: false,
        isUndoRedo: false
      };
    });
  }, 500);

  return {
    history: [],
    currentIndex: -1,
    maxHistory: 50,
    past: [],
    future: [],
    maxHistorySize: 50,
    canUndo: false,
    canRedo: false,
    isUndoRedo: false,

    pushToHistory: (state: StateSnapshot) => {
      const currentState = get();
      console.log('📤 Pushing state to history. Current state:', {
        historyLength: currentState.history.length,
        currentIndex: currentState.currentIndex,
        canUndo: currentState.canUndo,
        isUndoRedo: currentState.isUndoRedo
      });
      
      // Reset isUndoRedo flag if it's set (shouldn't block pushes after undo/redo completes)
      if (currentState.isUndoRedo) {
        console.log('⚠️ isUndoRedo is true, resetting and continuing with push');
        // Don't return - allow the push to continue
      }

      set((current) => {
        // Always reset isUndoRedo when pushing new state
        const newHistory = [...current.history.slice(0, current.currentIndex + 1), state].slice(-current.maxHistory);
        const newIndex = newHistory.length - 1;
        const canUndoValue = newIndex >= 0 && newHistory.length > 1;
        
        console.log('✅ History updated:', {
          previousHistoryLength: current.history.length,
          previousIndex: current.currentIndex,
          newHistoryLength: newHistory.length,
          newIndex: newIndex,
          canUndo: canUndoValue,
          canRedo: false,
          wasUndoRedo: current.isUndoRedo
        });
        
        return {
          history: newHistory,
          currentIndex: newIndex,
          past: newHistory.slice(0, newIndex),
          future: [],
          canUndo: canUndoValue,
          canRedo: false,
          isUndoRedo: false // Always reset when pushing new state
        };
      });
    },

    debouncedPushToHistory: (computedPrice?: any) => {
      debouncedPush(computedPrice);
    },
    
    setComputedPriceCallback: (callback: () => any) => {
      computedPriceCallback = callback;
    },

    undo: () => {
      console.log('Attempting undo...');
      set((state) => {
        if (state.currentIndex <= 0 || state.history.length <= 1) {
          console.log('No history to undo', { currentIndex: state.currentIndex, historyLength: state.history.length });
          return state;
        }

        const newIndex = state.currentIndex - 1;
        const previous = state.history[newIndex];
        
        console.log('Undoing to previous state:', previous, { fromIndex: state.currentIndex, toIndex: newIndex });
        
        // Get price update callback from window (set by Configurator)
        const priceUpdateCallback = (window as any).__PRICE_UPDATE_CALLBACK__;
        applySnapshot(previous, priceUpdateCallback);

        // Reset isUndoRedo after a short delay to allow state updates to complete
        setTimeout(() => {
          set({ isUndoRedo: false });
        }, 100);

        return {
          ...state,
          currentIndex: newIndex,
          past: state.history.slice(0, newIndex),
          future: [state.history[state.currentIndex], ...state.future],
          canUndo: newIndex > 0,
          canRedo: true,
          isUndoRedo: true
        };
      });
    },

    redo: () => {
      console.log('Attempting redo...');
      set((state) => {
        if (state.currentIndex >= state.history.length - 1) {
          console.log('No actions to redo');
          return state;
        }

        const newIndex = state.currentIndex + 1;
        const next = state.history[newIndex];

        console.log('Redoing to next state:', next);
        
        // Get price update callback from window (set by Configurator)
        const priceUpdateCallback = (window as any).__PRICE_UPDATE_CALLBACK__;
        applySnapshot(next, priceUpdateCallback);

        // Reset isUndoRedo after a short delay to allow state updates to complete
        setTimeout(() => {
          set({ isUndoRedo: false });
        }, 100);

        return {
          ...state,
          currentIndex: newIndex,
          past: state.history.slice(0, newIndex),
          future: state.future.slice(1),
          canUndo: true,
          canRedo: newIndex < state.history.length - 1,
          isUndoRedo: true
        };
      });
    }
  };
});
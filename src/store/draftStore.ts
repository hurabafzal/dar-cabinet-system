// store/draftStore.ts
import { create } from 'zustand';
import { GET_DESIGN, CREATE_DESIGN, GET_LATEST_DESIGN, GET_USER_DESIGNS } from '../apiURL/endpoints';

// Cache for design data to prevent repetitive API calls
const designCache = new Map<string, {
  data: any,
  timestamp: number
}>();

// Cache expiration time (15 minutes)
const CACHE_EXPIRATION = 15 * 60 * 1000;

// Track in-flight requests to prevent duplicate calls
const pendingRequests = new Map<string, Promise<any>>();

// Track last save timestamps by design ID to prevent rapid successive calls
const lastSaveTimestamps = new Map<string, number>();
const MIN_SAVE_INTERVAL = 1000; // Minimum 1 second between saves for the same design

interface DraftState {
  // Current Design State
  currentDesignId: string | null;
  isLoaded: boolean;
  
  // Auto-Save State
  isAutoSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  
  // Actions
  setCurrentDesignId: (id: string | null) => void;
  setIsLoaded: (loaded: boolean) => void;
  setAutoSaving: (saving: boolean) => void;
  setLastSaved: (date: Date) => void;
  setSaveError: (error: string | null) => void;
  
  // API Functions
  saveDraft: (userId: string, orderData: any) => Promise<string | null>;
  loadLatestDraft: (userId: string) => Promise<any>;
  deleteDraft: (userId: string) => Promise<boolean>; // ✅ NEU: Delete Funktion hinzugefügt
  
  // Reset
  resetDraft: () => void;
}

export const useDraftStore = create<DraftState>((set, get) => ({
  // Initial State
  currentDesignId: null,
  isLoaded: false,
  isAutoSaving: false,
  lastSaved: null,
  saveError: null,

  // Setters
  setCurrentDesignId: (id) => set({ currentDesignId: id }),
  setIsLoaded: (loaded) => set({ isLoaded: loaded }),
  setAutoSaving: (saving) => set({ isAutoSaving: saving }),
  setLastSaved: (date) => set({ lastSaved: date }),
  setSaveError: (error) => set({ saveError: error }),

  // Save Draft to Backend
  saveDraft: async (userId: string, orderData: any) => {
    const { currentDesignId } = get();
    
    // Add throttling for repeated calls with the same design ID
    if (currentDesignId) {
      const now = Date.now();
      const lastSaveTime = lastSaveTimestamps.get(currentDesignId) || 0;
      
      // If this design was saved recently, skip this call
      if (now - lastSaveTime < MIN_SAVE_INTERVAL) {
        console.log(`🛑 Throttling save for design ID ${currentDesignId}: too soon after last save`);
        return currentDesignId;
      }
      
      // Update the timestamp for this design ID
      lastSaveTimestamps.set(currentDesignId, now);
    }
    
    set({ isAutoSaving: true, saveError: null });
    try {
      const url = currentDesignId
        ? GET_DESIGN(currentDesignId) // Update existing
        : CREATE_DESIGN; // Create new

      // Use a very simplified request key based on operation + ID
      // This ensures better deduplication even with changing data
      const requestKey = currentDesignId 
        ? `save-${currentDesignId}` 
        : `save-new-${userId}`;
        
      console.log(`🔄 Processing save request: ${requestKey}`);
      
      // Check if we have a pending identical request
      if (pendingRequests.has(requestKey)) {
        console.log(`✅ Reusing pending save request for: ${currentDesignId || 'new design'}`);
        const result = await pendingRequests.get(requestKey);
        return result?.designId || null;
      }

      const method = currentDesignId ? 'PUT' : 'POST';
      const body = currentDesignId
        ? { orderData }
        : { userId, orderData };

      // Create the request promise and store it
      const requestPromise = (async () => {
        console.log(`📡 Making API call to ${url}`);
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
  
        if (!response.ok) {
          throw new Error(`Save failed: ${response.status}`);
        }
  
        const result = await response.json();
        const designId = result._id;
  
        // Update cache after successful save
        if (designId) {
          designCache.set(designId, {
            data: orderData,
            timestamp: Date.now()
          });
        }
  
        set({
          currentDesignId: designId,
          lastSaved: new Date(),
          isAutoSaving: false,
          saveError: null
        });
  
        return { designId };
      })();

      // Store the promise with an automatic timeout to prevent stale entries
      pendingRequests.set(requestKey, requestPromise);
      
      // Remove from pending when completed or after timeout
      const clearRequest = () => {
        pendingRequests.delete(requestKey);
      };
      
      // Ensure request is removed from pending even if it takes too long
      const timeoutId = setTimeout(clearRequest, 10000);
      
      requestPromise.finally(() => {
        clearTimeout(timeoutId);
        clearRequest();
      });
      
      const result = await requestPromise;
      return result?.designId || null;
    } catch (error: any) {
      set({
        isAutoSaving: false,
        saveError: error.message || 'Save failed'
      });
      console.error('Draft save error:', error);
      return null;
    }
  },

  // Load Latest Draft from Backend
  loadLatestDraft: async (userId: string) => {
    set({ saveError: null });

    try {
      // Try to get from cache first if we have a current design ID
      const { currentDesignId } = get();
      if (currentDesignId) {
        const cached = designCache.get(currentDesignId);
        if (cached && Date.now() - cached.timestamp < CACHE_EXPIRATION) {
          console.log(`✅ Using cached data for design: ${currentDesignId}`);
          set({
            isLoaded: true,
            saveError: null
          });
          return cached.data;
        }
      }

      const url = GET_LATEST_DESIGN(userId);
      
      // Check if we already have this request in flight
      if (pendingRequests.has(url)) {
        console.log(`⏳ Reusing in-flight request for: ${url}`);
        const result = await pendingRequests.get(url);
        
        if (result?.draft) {
          set({
            currentDesignId: result.draft._id,
            lastSaved: new Date(result.draft.updatedAt),
            isLoaded: true,
            saveError: null
          });
          
          return result.draft.orderData;
        }
        return null;
      }
      
      // Create the request promise
      const requestPromise = (async () => {
        const response = await fetch(url);
        
        if (response.status === 404) {
          // No draft found - that's okay
          set({ isLoaded: true });
          return { draft: null };
        }
        
        if (!response.ok) {
          throw new Error(`Load failed: ${response.status}`);
        }
        
        const draft = await response.json();
        
        // Update cache
        if (draft._id) {
          designCache.set(draft._id, {
            data: draft.orderData,
            timestamp: Date.now()
          });
        }
        
        return { draft };
      })();
      
      // Store the promise
      pendingRequests.set(url, requestPromise);
      
      // Remove from pending when completed
      requestPromise.finally(() => {
        pendingRequests.delete(url);
      });
      
      const result = await requestPromise;
      
      if (result?.draft) {
        set({
          currentDesignId: result.draft._id,
          lastSaved: new Date(result.draft.updatedAt),
          isLoaded: true,
          saveError: null
        });
        
        return result.draft.orderData;
      }
      
      set({ isLoaded: true });
      return null;
    } catch (error: any) {
      set({
        saveError: error.message || 'Load failed',
        isLoaded: true
      });
      console.error('Draft load error:', error);
      return null;
    }
  },

  // ✅ NEU: Delete Draft from Backend
  deleteDraft: async (userId: string) => {
    const { currentDesignId } = get();
    
    try {
      // Falls wir eine currentDesignId haben, diese verwenden, sonst über userId löschen
      const url = currentDesignId 
        ? GET_DESIGN(currentDesignId)
        : GET_USER_DESIGNS(userId);

      // Check if we already have this request in flight
      const requestKey = `DELETE-${url}`;
      if (pendingRequests.has(requestKey)) {
        console.log(`⏳ Reusing in-flight delete request for: ${url}`);
        return pendingRequests.get(requestKey);
      }
      
      const requestPromise = (async () => {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (response.ok) {
          console.log('✅ Draft successfully deleted for user:', userId);
          
          // Remove from cache
          if (currentDesignId) {
            designCache.delete(currentDesignId);
          }
          
          // State nach erfolgreichem Löschen zurücksetzen
          set({
            currentDesignId: null,
            lastSaved: null,
            saveError: null
          });
          
          return true;
        } else {
          console.error('❌ Failed to delete draft:', response.status);
          return false;
        }
      })();
      
      // Store the promise
      pendingRequests.set(requestKey, requestPromise);
      
      // Remove from pending when completed
      requestPromise.finally(() => {
        pendingRequests.delete(requestKey);
      });
      
      return requestPromise;
    } catch (error) {
      console.error('❌ Error deleting draft:', error);
      return false;
    }
  },

  // Reset all draft state
  resetDraft: () => {
    // Clear cache for current design
    const { currentDesignId } = get();
    if (currentDesignId) {
      designCache.delete(currentDesignId);
    }
    
    set({
      currentDesignId: null,
      isLoaded: false,
      isAutoSaving: false,
      lastSaved: null,
      saveError: null,
    });
  },
}))
import { create } from 'zustand';
import { persist, PersistStorage } from 'zustand/middleware';
import { setStorageItem, getStorageItem, removeStorageItem } from '../utils/storageUtils';

interface OrderStore {
  orderData: any | null;
  setOrderData: (data: any) => void;
  clearOrderData: () => void;
}

// Custom storage with extensive error handling
const customStorage: PersistStorage<OrderStore> = {
  getItem: async (name: string) => {
    try {
      const item = localStorage.getItem(name);
      if (!item) {
        return null;
      }
      
      // Parse and validate the stored state
      let parsedItem;
      try {
        parsedItem = JSON.parse(item);
      } catch (parseError) {
        console.error('Error parsing localStorage data:', parseError);
        localStorage.removeItem(name);
        return null;
      }
      
      // Validate the structure
      if (!parsedItem?.state) {
        console.warn('Invalid data structure in localStorage');
        localStorage.removeItem(name);
        return null;
      }
      
      return {
        state: parsedItem.state,
        version: parsedItem.version || 0
      };
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      
      // Try to clear corrupted data
      try {
        localStorage.removeItem(name);
      } catch (clearError) {
        console.error('Error clearing localStorage:', clearError);
      }
      
      return null;
    }
  },
  
  setItem: async (name: string, value: any) => {
    try {
      // Validate the value before storing
      if (!value || typeof value !== 'object') {
        console.error('Invalid value to store:', value);
        return;
      }
      
      const stringValue = JSON.stringify(value);
      
      // Check size
      const size = new Blob([stringValue]).size;
      
      // Store in localStorage
      localStorage.setItem(name, stringValue);
      
      // Verify the data was stored correctly
      const stored = localStorage.getItem(name);
      if (!stored) {
        throw new Error('Data verification failed - not stored');
      }
      
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      
      // Try to save essential data only on error
      if (value?.state?.orderData) {
        try {
          const essentialData = {
            state: {
              orderData: {
                apiResponse: value.state.orderData.apiResponse,
                orderInfo: value.state.orderData.orderInfo,
                customerInfo: value.state.orderData.customerInfo,
                designDetails: value.state.orderData.designDetails,
              }
            },
            version: value.version || 0
          };
          
          const essentialString = JSON.stringify(essentialData);
          localStorage.setItem(name, essentialString);
        } catch (fallbackError) {
          console.error('Failed to save even essential data:', fallbackError);
        }
      }
    }
  },
  
  removeItem: async (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orderData: null,
      
      setOrderData: (data) => {
        set({ orderData: data });
        
        // Also save as backup using our cross-platform storage utility
        try {
          setStorageItem('orderBackup', data, true);
        } catch (error) {
          console.warn('Failed to save backup to storage:', error);
        }
      },
      
      clearOrderData: () => {
        set({ orderData: null });
        
        // Clear both storages using our cross-platform storage utility
        try {
          removeStorageItem('orderBackup');
          removeStorageItem('fullOrderData');
        } catch (error) {
          console.error('Error clearing storage:', error);
        }
      },
    }),
    {
      name: 'order-storage',
      storage: customStorage,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error during hydration:', error);
          
          try {
            const backup = getStorageItem('orderBackup', null);
            if (backup) {
              state?.setOrderData(backup);
            }
          } catch (backupError) {
            console.error('Failed to restore from backup:', backupError);
          }
        }
      },
    }
  )
);

// Enhanced hook to get full order data with better error handling
export const useFullOrderData = () => {
  const orderData = useOrderStore((state) => state.orderData);
  
  // Try to get full data from storage first using our cross-platform storage utility
  try {
    const fullData = getStorageItem('fullOrderData', null);
    if (fullData) {
      return fullData;
    }
  } catch (error) {
    console.warn('Failed to get fullOrderData from storage:', error);
  }
  
  // Try backup from storage
  try {
    const backup = getStorageItem('orderBackup', null);
    if (backup) {
      return backup;
    }
  } catch (error) {
    console.warn('Failed to get backup from storage:', error);
  }
  
  return orderData;
};
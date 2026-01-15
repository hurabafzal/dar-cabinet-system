/**
 * Storage utility functions to handle cross-platform storage issues
 * including Safari on iOS where sessionStorage might not be available
 */

/**
 * Robustly checks if the requested Web Storage type exists and is usable.
 * Handles SSR, older Safari/WebViews where accessing window[type] may throw,
 * and quota/full-storage cases.
 */
export const isStorageAvailable = (
  type: 'localStorage' | 'sessionStorage'
): boolean => {
  // Non-browser environments
  if (typeof window === 'undefined') return false;

  let storage: Storage | undefined;

  // Accessing window[type] itself can throw in some WebViews
  try {
    if (!(type in window)) return false;
    storage = window[type];
  } catch {
    return false;
  }

  if (!storage) return false;

  // Probe read/write
  try {
    const key = `__storage_test__${Math.random()}`;
    storage.setItem(key, '1');
    const ok = storage.getItem(key) === '1';
    storage.removeItem(key);
    return ok;
  } catch (e: any) {
    // If storage exists but is full/blocked, treat as unavailable unless data already present
    const quotaExceeded =
      e?.name === 'QuotaExceededError' ||
      e?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      e?.code === 22 || // old WebKit
      e?.code === 1014; // Firefox

    return quotaExceeded ? storage.length > 0 : false;
  }
};

/**
 * Set data in the best available storage
 * @param key - The key to store the data under
 * @param value - The value to store (will be JSON stringified)
 * @param preferSession - Whether to prefer sessionStorage over localStorage
 */
export const setStorageItem = (key: string, value: any, preferSession: boolean = true): void => {
  try {
    const jsonValue = JSON.stringify(value);
    
    // Try the preferred storage first
    if (preferSession) {
      // Try sessionStorage first
      if (isStorageAvailable('sessionStorage')) {
        sessionStorage.setItem(key, jsonValue);
        return;
      }
      
      // Fall back to localStorage
      if (isStorageAvailable('localStorage')) {
        localStorage.setItem(key, jsonValue);
        return;
      }
    } else {
      // Try localStorage first
      if (isStorageAvailable('localStorage')) {
        localStorage.setItem(key, jsonValue);
        return;
      }
      
      // Fall back to sessionStorage
      if (isStorageAvailable('sessionStorage')) {
        sessionStorage.setItem(key, jsonValue);
        return;
      }
    }
    
    // If nothing works, log a warning
    console.warn(`Unable to save data to storage for key "${key}"`);
  } catch (error) {
    console.error(`Error saving to storage: ${error}`);
  }
};

/**
 * Get data from any available storage
 * @param key - The key to retrieve data for
 * @param defaultValue - Default value to return if key not found
 * @returns The retrieved value, parsed from JSON
 */
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    // Check sessionStorage first
    if (isStorageAvailable('sessionStorage')) {
      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue) {
        try {
          return JSON.parse(sessionValue) as T;
        } catch (e) {
          console.warn(`Error parsing session storage value for key ${key}:`, e);
        }
      }
    }
    
    // Then check localStorage
    if (isStorageAvailable('localStorage')) {
      const localValue = localStorage.getItem(key);
      if (localValue) {
        try {
          return JSON.parse(localValue) as T;
        } catch (e) {
          console.warn(`Error parsing local storage value for key ${key}:`, e);
        }
      }
    }
    
    return defaultValue;
  } catch (error) {
    console.error(`Error retrieving from storage: ${error}`);
    return defaultValue;
  }
};

/**
 * Remove an item from all storages
 * @param key - The key to remove
 */
export const removeStorageItem = (key: string): void => {
  try {
    if (isStorageAvailable('sessionStorage')) {
      sessionStorage.removeItem(key);
    }
    
    if (isStorageAvailable('localStorage')) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error(`Error removing from storage: ${error}`);
  }
};

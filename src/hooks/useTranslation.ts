import { useCallback } from 'react';
import { useIndexStore } from '../store/indexSlice';
import { getTranslation } from '../utils/translations';

/**
 * Hook to access translations based on the currently selected language
 * @returns A translation function that accepts a key and optional fallback
 */
export function useTranslation() {
  // Get the current language from the store
  const selectedLanguage = useIndexStore((state) => state.selectedLan);
  
  // Return a memoized translation function
  const translate = useCallback(
    (key: string, fallbackOrVars?: string | Record<string, string>, variables?: Record<string, string>): string => {
      // Handle both function signatures:
      // t(key, fallback)
      // t(key, variables)
      if (typeof fallbackOrVars === 'string') {
        return getTranslation(key, selectedLanguage, fallbackOrVars, variables);
      } else {
        return getTranslation(key, selectedLanguage, undefined, fallbackOrVars);
      }
    },
    [selectedLanguage]
  );
  
  return {
    // The translation function
    t: translate,
    
    // The current language
    language: selectedLanguage,
    
    // Helper to check if the current language is RTL
    isRTL: selectedLanguage === 'Arabic'
  };
}

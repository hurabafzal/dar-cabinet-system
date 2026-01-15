/**
 * Language utilities for handling RTL/LTR direction changes
 */

// List of RTL languages
const RTL_LANGUAGES = ['Arabic', 'العربية', 'ar', 'ara'];

// Supported languages in the application
const SUPPORTED_LANGUAGES = ['English', 'Arabic'];

/**
 * Detects the user's preferred language from browser settings
 * @returns The detected language or default language if not supported
 */
export const detectBrowserLanguage = (): string => {
  try {
    // Get browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    console.log('Detected browser language:', browserLang);
    
    // Check if it's Arabic
    if (browserLang.toLowerCase().startsWith('ar')) {
      return 'Arabic';
    }
    
    // For now we default to English for all other languages
    // This can be expanded later for more languages
    return 'English';
  } catch (error) {
    console.error('Error detecting browser language:', error);
    return 'English'; // Default fallback
  }
};

/**
 * Check if a language code or name is RTL
 * @param language Language code or name
 * @returns true if the language is RTL, false otherwise
 */
export const isRTL = (language: string): boolean => {
  if (!language) return false;
  return RTL_LANGUAGES.includes(language);
};

/**
 * Set the document direction based on language
 * @param language Language code or name
 */
export const setDocumentDirection = (language: string): void => {
  const direction = isRTL(language) ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = language === 'Arabic' ? 'ar' : 'en';
  
  // Add a class to the body for CSS styling
  if (isRTL(language)) {
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
};

/**
 * Save the selected language to localStorage
 * @param language Language code or name
 */
export const saveLanguagePreference = (language: string): void => {
  try {
    if (!language) {
      console.warn('Attempted to save empty language');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('dar-language', language);
    console.log('Language saved to localStorage:', language);
    
    // Also set the document direction immediately
    setDocumentDirection(language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

/**
 * Get the saved language preference from localStorage
 * @returns Saved language or null if not found
 */
export const getSavedLanguage = (): string | null => {
  try {
    const savedLanguage = localStorage.getItem('dar-language');
    
    if (savedLanguage && savedLanguage.length > 0) {
      return savedLanguage;
    }
  } catch (error) {
    console.error('Error retrieving language preference:', error);
  }
  
  // Return null if no language is saved - this allows the modal to appear
  return null;
};

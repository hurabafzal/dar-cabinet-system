import React, { useEffect } from 'react';
import { useIndexStore } from '../store/indexSlice';
import { setDocumentDirection, saveLanguagePreference, getSavedLanguage, detectBrowserLanguage } from '../utils/languageUtils';
import { setStorageItem, getStorageItem } from '../utils/storageUtils';

/**
 * Component that handles language direction (RTL/LTR) based on the selected language
 * This component doesn't render anything visible, it just handles the document direction
 */
const LanguageDirectionProvider: React.FC = () => {
  const selectedLan = useIndexStore((state) => state.selectedLan);
  const setSelectedLan = useIndexStore((state) => state.setSelectedLan);

  // Initialize language from localStorage or browser settings on component mount
  useEffect(() => {
    const savedLanguage = getSavedLanguage();
    const hasSelectedLanguage = localStorage.getItem('dar-language-selected');
    
    if (savedLanguage && hasSelectedLanguage === 'true') {
      // User has previously selected a language - use it
      setSelectedLan(savedLanguage);
      
      // Set the document direction
      setDocumentDirection(savedLanguage);
    } else {
      // For first-time users, detect browser language but don't save it yet
      // This way the language modal still appears, but we can suggest their language
      const detectedLanguage = detectBrowserLanguage();
      console.log('Detected browser language:', detectedLanguage);
      
      // Store the detected language for the language selection modal
      // but don't save it to permanent storage until user explicitly selects it
      setStorageItem('detected-language', detectedLanguage, true);
    }
  }, []);

  // Update direction whenever language changes
  useEffect(() => {
    if (selectedLan) {
      setDocumentDirection(selectedLan);
      saveLanguagePreference(selectedLan);
    }
  }, [selectedLan]);

  // This component doesn't render anything visible
  return null;
};

export default LanguageDirectionProvider;

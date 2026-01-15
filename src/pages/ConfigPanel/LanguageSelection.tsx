import React, { useState, useEffect } from 'react';
import { useIndexStore } from "../../store/indexSlice";
import { saveLanguagePreference } from "../../utils/languageUtils";
import { getTranslation } from "../../utils/translations";
import "./LanguageSelection.css";

const LanguageSelection = ({ isSelectedLan, setIsSelectedLan }: any) => {
  const setSelectedLan = useIndexStore((select) => select.setSelectedLan);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  
  // Get the detected language from sessionStorage on component mount
  useEffect(() => {
    const detected = sessionStorage.getItem('detected-language');
    if (detected) {
      setDetectedLanguage(detected);
      console.log('Language selection modal using detected language:', detected);
    }
  }, []);
  
  function handleClickLanBtn(language: string): void {
    // Set the language in the store
    setSelectedLan(language);
    
    // Save language preference to localStorage
    saveLanguagePreference(language);
    console.log('Initial language selection:', language);
    
    // Update the selected language state in parent component
    setIsSelectedLan(true);
    
    // Store a flag to indicate that initial language selection has happened
    localStorage.setItem('dar-language-selected', 'true');
  }
  return (
    <>
      {isSelectedLan === false && (
        <div className="initailModalContainer">
          <div className="initailModal">
            <span className="initalModalTitle">{getTranslation('select_language')}</span>
            <div className="initialModalBody">
              <div className={`flagContainer ${detectedLanguage === "Arabic" ? "suggested" : ""}`}>
                <img 
                  src="/image/icon/saudiarabia.png" 
                  className={`flagStyle ${detectedLanguage === "Arabic" ? "suggested" : ""}`}
                  onClick={() => handleClickLanBtn("Arabic")} 
                  alt="Arabic"
                />
                <span className="languageTitle">{getTranslation('language_arabic', 'Arabic')}</span>
                {detectedLanguage === "Arabic" && <span className="suggested-label">{getTranslation('recommended', 'Recommended')}</span>}
              </div>
              <div className={`flagContainer ${detectedLanguage === "English" ? "suggested" : ""}`}>
                <img 
                  src="/image/icon/united-kingdom.png" 
                  className={`flagStyle ${detectedLanguage === "English" ? "suggested" : ""}`}
                  onClick={() => handleClickLanBtn("English")} 
                  alt="English"
                />
                <span className="languageTitle">{getTranslation('language_english', 'English')}</span>
                {detectedLanguage === "English" && <span className="suggested-label">{getTranslation('recommended', 'Recommended')}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
};

export default LanguageSelection;

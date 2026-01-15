import React, { useState, useRef, useEffect } from 'react';
import { useIndexStore } from '../store/indexSlice';
import { saveLanguagePreference } from '../utils/languageUtils';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Language Dropdown Component
 * Allows the user to switch between languages
 */
const LanguageDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLan = useIndexStore((state) => state.selectedLan);
  const setSelectedLan = useIndexStore((state) => state.setSelectedLan);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();

  // Available languages
  const languages = [
    { code: 'English', name: t('language_english', 'English'), flag: '/image/icon/united-kingdom.png' },
    { code: 'Arabic', name: t('language_arabic', 'العربية'), flag: '/image/icon/saudiarabia.png' }
  ];

  const toggleDropdown = () => {
    console.log("selectedLan" ,selectedLan)
    if(!selectedLan){
      return
    }
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (language: string) => {
    // Set language in Zustand store
    setSelectedLan(language);
    
    // Save to localStorage for persistence across sessions
    saveLanguagePreference(language);
    
    console.log('Language changed to:', language);
    
    // Close the dropdown
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get the current selected language info
  const currentLanguage = languages.find(lang => lang.code === selectedLan) || languages[0];

  return (
    <div ref={dropdownRef} className="language-dropdown" style={{
      position: 'relative'
    }}>
      <button 
        onClick={toggleDropdown}
        style={{
          pointerEvents: selectedLan ? 'auto' : 'none',
          opacity: selectedLan ? 1 : 0.5,
          background: '#286d7c',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
      >
        <img 
          src={currentLanguage.flag} 
          alt={currentLanguage.name}
          style={{ 
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      </button>

      {isOpen && (
        <div 
          className={`language-dropdown-menu ${selectedLan === 'Arabic' ? 'rtl-content' : 'ltr-content'}`}
          style={{
            position: 'absolute',
            top: '60px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            minWidth: '160px',
            padding: '8px 0'
          }}
        >
          {languages.map((language) => (
            <div 
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              className="language-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                color: language.code === selectedLan ? '#286d7c' : 'black',
                backgroundColor: language.code === selectedLan ? '#f5f5f5' : 'transparent',
                fontWeight: language.code === selectedLan ? 'bold' : 'normal'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = language.code === selectedLan ? '#f5f5f5' : 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img 
                  src={language.flag} 
                  alt={language.name}
                  style={{ 
                    width: '24px',
                    height: '24px',
                    marginInlineEnd: '12px',
                    borderRadius: '50%',
                    border: language.code === selectedLan ? '2px solid #286d7c' : '1px solid #eaeaea'
                  }}
                />
                <span>{language.name}</span>
              </div>
              {/* Active indicator */}
              {language.code === selectedLan && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#286d7c">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;

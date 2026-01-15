// App.tsx - Nur die NEUEN/GEÄNDERTEN Teile

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { materialConfig } from "./config/cabinetConfig";
import Root from "./Root";
import { useIndexStore } from "./store/indexSlice";
import { getAllDesignModels } from "./api/modelApi"
import { Loader } from "./threejs_components/loader/Loader";
import OrientationLock from "./components/OrientationLock"; 
import AuthModal from "./components/AuthModal";
import AccountPanel from "./components/AccountPanel";
import { getToken, getUserData } from "./helpers/jwtHelper";
import Terms from "./components/Terms";
// ✅ GEÄNDERT: Import von Tour statt Joyride
import Tour from "./pages/ConfigPanel/Joyride";
import "./components/Login.css";
import "./components/Terms.css";
import { useModelStore } from "./store/modelSlice";
// Add the LanguageDirectionProvider and LanguageDropdown
import LanguageDirectionProvider from "./components/LanguageDirectionProvider";
import LanguageDropdown from "./components/LanguageDropdown";
import WhatsAppButton from "./components/WhatsAppButton";
import { setStorageItem, getStorageItem, removeStorageItem } from "./utils/storageUtils";
import { CapacitorCookies } from "@capacitor/core";

let flag = false;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function App() {
  // ✅ NEU: Tour State hinzufügen
  const [showTour, setShowTour] = useState(false);
  const [tourStepStatus, setTourStepStatus] = useState({
    cabinetSelected: false,
    cabinetPlaced: false,
    sizeAdjusted: false,
    materialSelected: false
  });
  const [isSelectedLan, setIsSelectedLan] = useState(false);

  // Existing authentication state (unverändert)
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAccountPanel, setShowAccountPanel] = useState<boolean>(false);
  const [pendingPayment, setPendingPayment] = useState<boolean>(false);


  // Load language selection from localStorage
  useEffect(() => {
    // Check for first-time setup using only the dar-language-selected flag
    const hasSelectedLanguage = localStorage.getItem('dar-language-selected');
        
    if (hasSelectedLanguage === 'true') {
      // User has selected a language before
      const savedLanguage = localStorage.getItem('dar-language');
      
      if (savedLanguage) {
        // Update the store with saved language
        const setSelectedLan = useIndexStore.getState().setSelectedLan;
        setSelectedLan(savedLanguage);
        
        // Mark language as selected so selection screen doesn't show
        setIsSelectedLan(true);
      }
    } else {      
      // Clear any existing language data to ensure clean start
      removeStorageItem('dar-language');
      
      // Force showing the language selection modal on first load
      setIsSelectedLan(false);
    }
  }, []);

  const handleRedirectToWebsite = () => {
    window.location.href = 'https://dar-kuwait.com';
  };

  const handlePaymentAuthRequired = () => {
    const backupData = {
      models: useModelStore.getState().droppedModel,
      placed: useIndexStore.getState().placedModels
    };

    
    // Use cross-platform storage utility instead of directly using sessionStorage
    setStorageItem('paymentBackup', backupData, true);
    
    setPendingPayment(true);
    setShowAuthModal(true);
  };

  const handlePersonIconClick = () => {
    if (user) {
      setShowAccountPanel(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setShowAuthModal(false);
    
    if (pendingPayment) {
      setPendingPayment(false);
      
      // Define the type for our backup data structure based on the actual types in the stores
      interface BackupData {
        models: object[];
        placed: unknown;
      }
      
      // Use cross-platform storage utility instead of directly using sessionStorage
      const backup = getStorageItem<BackupData | null>('paymentBackup', null);
      if (backup) {
        try {
          // Validate backup data structure before using it
          if (backup && 
              typeof backup === 'object' && 
              'models' in backup && 
              'placed' in backup && 
              Array.isArray(backup.models) && 
              Array.isArray(backup.placed)) {
            // Restore backup data with proper typecasting
            useModelStore.getState().setDroppedModel(backup.models);
            
            // Need to handle the empty array type in a special way
            const placedModels = backup.placed as unknown;
            useIndexStore.getState().setPlacedModels(placedModels as any);
          } else {
            console.warn("Invalid backup data structure:", backup);
          }
          // Clear backup regardless of validation result
          removeStorageItem('paymentBackup');
        } catch (error) {
          console.error("Error restoring backup data:", error);
        }
      }
      
      setTimeout(() => {
        const event = new CustomEvent('retryPayment');
        window.dispatchEvent(event);
      }, 100);
    }
  };

  const handleLogout = async () => {
    //document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    await CapacitorCookies.clearAllCookies();
    setUser(null);
    setShowAccountPanel(false);
  };


  // ALLE EXISTING useEffects BLEIBEN UNVERÄNDERT:
  useEffect(() => {
    const checkAuth = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlUserId = urlParams.get('userid');
      
      getUserData().then(data => {
        let userData = data?.decoded;
        if (data?.decoded) {
        
        if (!urlUserId || urlUserId !== userData!.sub) {
          window.location.href = window.location.pathname + "?userid=" + userData!.sub;
          return;
        }
        
        setUser({
          token: data?.token,
          userId: userData!.sub,
          name: (userData as any).name || (userData as any).userName || userData!.sub
        });
        } else if (urlUserId) {
        window.location.href = window.location.pathname;
        return;
      }
      });
      setIsAuthChecking(false);
    };

    checkAuth();
  }, []);

  // PWA stuff (unverändert)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
  }, []);

  // Cabinet config (unverändert)
  const setCABINET_ITEMS = useIndexStore((select: any) => select.setCABINET_ITEMS);
  const setMATERIAL_ITEMS = useIndexStore((select: any) => select.setMATERIAL_ITEMS);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  const cabinetConfig = async () => {
    setIsInitialLoading(true);
    try {
      const designModels = await getAllDesignModels();
      const materialList = await materialConfig();
      
      setMATERIAL_ITEMS(materialList);
      setCABINET_ITEMS(designModels);
      
      return designModels;
    } catch (error) {
      console.error("Error in cabinetConfig:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (flag === false) {
      flag = true;
      cabinetConfig();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paymentAuthRequired', handlePaymentAuthRequired);
    return () => {
      window.removeEventListener('paymentAuthRequired', handlePaymentAuthRequired);
    };
  }, []);

  // Loading Screen (unverändert)
  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading...</h2>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div className="bg-[#286d7c] h-full w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Add LanguageDirectionProvider to handle RTL/LTR */}
      <LanguageDirectionProvider />
      
      {/* User controls (language dropdown and person icon) - always on right side */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px', // Use right instead of insetInlineEnd to keep position consistent
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* Language Dropdown */}
        <LanguageDropdown />

        {/* Person-Icon */}
        <button 
          onClick={handlePersonIconClick}
          style={{
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
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </button>
      </div>

      {/* AuthModal (unverändert) */}
      {showAuthModal && (
        <AuthModal 
          onRedirect={handleRedirectToWebsite}
          onClose={() => {
            setShowAuthModal(false);
            setPendingPayment(false);
          }}
          onLoginSuccess={handleLoginSuccess}
          showPaymentMessage={pendingPayment}
        />
      )}

      {/* Account Panel (unverändert) */}
      {showAccountPanel && (
        <AccountPanel 
          user={user}
          onClose={() => setShowAccountPanel(false)}
          onLogout={handleLogout}
        />
      )}

      {/* ✅ GEÄNDERT: Tour Component mit Props */}
      {/* 
      <Tour 
        isSelectedLan={isSelectedLan}
        setIsSelectedLan={setIsSelectedLan}
      />
      */}
      
      <OrientationLock>
        <Routes>
          <Route path="/terms" element={<Terms />} />
          <Route path="/" element={<Root isInitialLoading={isInitialLoading} />} />
        </Routes>
      </OrientationLock>
      
      {/* WhatsApp floating button */}
      <WhatsAppButton phoneNumber="+96565964302" user={user} />
    </BrowserRouter>
  );
}

export default App;
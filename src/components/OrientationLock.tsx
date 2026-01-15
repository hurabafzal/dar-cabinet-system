import React, { useState, useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface OrientationLockProps {
  children: React.ReactNode;
  orientation?: 'portrait' | 'landscape';
}

const OrientationLock: React.FC<OrientationLockProps> = ({ 
  children, 
  orientation = 'landscape' 
}) => {
  const [isCorrectOrientation, setIsCorrectOrientation] = useState<boolean>(false);
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  // Detect device type
  useEffect(() => {
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
      const isMobile = /iPhone|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isTablet) {
        setDeviceType('tablet');
      } else if (isMobile) {
        setDeviceType('mobile');
      } else {
        setDeviceType('desktop');
      }
    };

    detectDevice();
  }, []);

  // Capacitor Screen Orientation Lock
  useEffect(() => {
    const lockOrientation = async () => {
      try {
        await ScreenOrientation.lock({ orientation });
      } catch (error) {
        console.log('Screen orientation lock failed:', error);
      }
    };

    if (deviceType !== 'desktop') {
      lockOrientation();
    }

    // Cleanup: Unlock beim Verlassen
    return () => {
      if (deviceType !== 'desktop') {
        ScreenOrientation.unlock().catch(console.log);
      }
    };
  }, [orientation, deviceType]);

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.matchMedia("(orientation: portrait)").matches;
      
      if (orientation === 'portrait') {
        setIsCorrectOrientation(isPortrait);
      } else {
        setIsCorrectOrientation(!isPortrait);
      }
    };

    // Check on load
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [orientation]);

  // Don't show the lock screen for desktop devices or if orientation is correct
  if (deviceType === 'desktop' || isCorrectOrientation) {
    return <>{children}</>;
  }

  // Messages based on desired orientation
  const getMessage = () => {
    if (orientation === 'portrait') {
      return {
        title: "Please Hold Your Device Upright",
        subtitle: "This works best in portrait mode"
      };
    } else {
      return {
        title: "Please Rotate Your Device", 
        subtitle: "This experience works best in landscape mode"
      };
    }
  };

  const message = getMessage();

  return (
    <div className="orientation-lock">
      <div className="orientation-content">
        <h2>{message.title}</h2>
        <p>{message.subtitle}</p>
        
        {deviceType === 'tablet' ? (
          <div className="device-container">
            <div className="tablet">
              <div className="tablet-inner">
                <div className="tablet-screen"></div>
                <div className="tablet-home-button"></div>
              </div>
              <div className="tablet-shadow"></div>
            </div>
            <div className="rotate-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" stroke="white" strokeWidth="2" fill="none">
                <path d="M3 12h18M18 7l5 5-5 5" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="device-container">
            <div className="phone">
              <div className="phone-inner">
                <div className="phone-screen"></div>
                <div className="phone-notch"></div>
              </div>
              <div className="phone-shadow"></div>
            </div>
            <div className="rotate-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" stroke="white" strokeWidth="2" fill="none">
                <path d="M3 12h18M18 7l5 5-5 5" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <style>
        {`
        .orientation-lock {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #0d5362 0%, #074252 100%);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          color: white;
          text-align: center;
          font-family: 'Arial', sans-serif;
        }

        .orientation-content {
          padding: 2rem;
          max-width: 90%;
          animation: fadeIn 0.5s ease-in-out;
        }

        h2 {
          font-size: 1.8rem;
          margin-bottom: 1rem;
          font-weight: bold;
        }

        p {
          font-size: 1.2rem;
          margin-bottom: 3rem;
          opacity: 0.9;
        }

        .device-container {
          position: relative;
          margin: 2rem auto;
          height: 200px;
          width: 200px;
        }

        /* Tablet styles */
        .tablet {
          width: 160px;
          height: 120px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: ${orientation === 'portrait' ? 'rotateTabletToPortrait' : 'rotateTablet'} 3s infinite ease-in-out;
          transform-origin: center center;
        }

        .tablet-inner {
          width: 100%;
          height: 100%;
          background-color: #222;
          border-radius: 10px;
          position: relative;
          overflow: hidden;
          border: 3px solid #444;
        }

        .tablet-screen {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          bottom: 8px;
          background-color: #086475;
          border-radius: 2px;
        }

        .tablet-home-button {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #555;
        }

        .tablet-shadow {
          position: absolute;
          top: 5px;
          left: 5px;
          right: -5px;
          bottom: -5px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          z-index: -1;
        }

        /* Phone styles */
        .phone {
          width: 80px;
          height: 160px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: ${orientation === 'portrait' ? 'rotatePhoneToPortrait' : 'rotatePhone'} 3s infinite ease-in-out;
          transform-origin: center center;
        }

        .phone-inner {
          width: 100%;
          height: 100%;
          background-color: #222;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          border: 3px solid #444;
        }

        .phone-screen {
          position: absolute;
          top: 12px;
          left: 6px;
          right: 6px;
          bottom: 12px;
          background-color: #086475;
          border-radius: 5px;
        }

        .phone-notch {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 12px;
          background-color: #222;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }

        .phone-shadow {
          position: absolute;
          top: 5px;
          left: 5px;
          right: -5px;
          bottom: -5px;
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          z-index: -1;
        }

        .rotate-icon {
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          animation: pulse 2s infinite ease-in-out;
        }

        @keyframes rotateTablet {
          0%, 20% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          45%, 75% {
            transform: translate(-50%, -50%) rotate(90deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
        }

        @keyframes rotateTabletToPortrait {
          0%, 20% {
            transform: translate(-50%, -50%) rotate(90deg);
          }
          45%, 75% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(90deg);
          }
        }

        @keyframes rotatePhone {
          0%, 20% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          45%, 75% {
            transform: translate(-50%, -50%) rotate(90deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
        }

        @keyframes rotatePhoneToPortrait {
          0%, 20% {
            transform: translate(-50%, -50%) rotate(90deg);
          }
          45%, 75% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(90deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-50%) scale(1.1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        `}
      </style>
    </div>
  );
};

export default OrientationLock;
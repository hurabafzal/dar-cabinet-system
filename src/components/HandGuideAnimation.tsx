import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useConfiguratorStore } from '../store/configuratorSlice';
import { useIndexStore } from '../store/indexSlice';
import './HandGuideAnimation.css';

interface HandGuideAnimationProps {
  onComplete?: () => void;
}

const HandGuideAnimation: React.FC<HandGuideAnimationProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentStep, setCurrentStep] = useState<'click' | 'drag' | 'complete'>('click');
  const [cabinetThumbnail, setCabinetThumbnail] = useState<string | null>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const draggedCabinetRef = useRef<HTMLDivElement>(null);
  const toggleBtn = useConfiguratorStore((select) => select.toggleBtn);
  const setToggleBtn = useConfiguratorStore((select) => select.setToggleBtn);
  const CABINET_ITEMS = useIndexStore((select: any) => select.CABINET_ITEMS);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const startAnimation = () => {
      const hand = handRef.current;
      if (!hand) return;

      // Get positions of elements
      const toggleButton = document.querySelector('.toggleBtn.keybind') as HTMLElement;
      const sidebar = document.querySelector('.sidebarR') as HTMLElement;

      if (!toggleButton) return;

      const toggleRect = toggleButton.getBoundingClientRect();
      const toggleCenterX = toggleRect.left + toggleRect.width / 2;
      const toggleCenterY = toggleRect.top + toggleRect.height / 2;

      // Step 1: Move hand to toggle button and click
      const clickAnimation = () => {
        if (!hand) return;

        // Fade in and move hand to toggle button using GSAP (semi-transparent)
        gsap.set(hand, { opacity: 0, x: toggleCenterX, y: toggleCenterY });
        gsap.to(hand, {
          opacity: 0.75,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            // Animate click
            setTimeout(() => {
              hand.classList.add('clicking');
              gsap.to(hand, {
                scale: 0.9,
                y: toggleCenterY + 5,
                duration: 0.15,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut',
                onComplete: () => {
                  hand.classList.remove('clicking');
                  // Trigger click on toggle button
                  if (!toggleBtn) {
                    setToggleBtn(true);
                  }
                  // Wait for sidebar to fully open and items to be visible
                  setTimeout(() => {
                    setCurrentStep('drag');
                    // Retry finding the cabinet item with multiple attempts
                    findAndDragCabinetItem();
                  }, 1000);
                }
              });
            }, 800);
          }
        });
      };

      // Step 2: Find and drag cabinet item (with retry logic)
      const findAndDragCabinetItem = (attempts = 0) => {
        if (!hand) {
          completeAnimation();
          return;
        }

        const firstCabinetItem = document.querySelector('.cabbinetItemImg') as HTMLElement;
        
        if (!firstCabinetItem && attempts < 5) {
          // Retry after a short delay if item not found
          setTimeout(() => {
            findAndDragCabinetItem(attempts + 1);
          }, 300);
          return;
        }

        if (!firstCabinetItem) {
          // If still not found after retries, complete animation
          completeAnimation();
          return;
        }

        const itemRect = firstCabinetItem.getBoundingClientRect();
        
        // Check if item is visible
        if (itemRect.width === 0 || itemRect.height === 0) {
          if (attempts < 5) {
            setTimeout(() => {
              findAndDragCabinetItem(attempts + 1);
            }, 300);
            return;
          }
          completeAnimation();
          return;
        }

        const itemCenterX = itemRect.left + itemRect.width / 2;
        const itemCenterY = itemRect.top + itemRect.height / 2;
        
        // Get the thumbnail source from the first cabinet item
        const firstCabinetItemImg = firstCabinetItem as HTMLImageElement;
        const thumbnailSrc = firstCabinetItemImg.src || firstCabinetItemImg.getAttribute('src');
        if (thumbnailSrc) {
          setCabinetThumbnail(thumbnailSrc);
        } else if (CABINET_ITEMS && CABINET_ITEMS.length > 0) {
          // Fallback: get from CABINET_ITEMS store
          setCabinetThumbnail(CABINET_ITEMS[0]?.thumbnailSrc || null);
        }
        
        // Move hand to cabinet item using GSAP
        gsap.to(hand, {
          x: itemCenterX,
          y: itemCenterY,
          duration: 0.8,
          ease: 'power2.inOut',
          onComplete: () => {
            // Animate drag
            setTimeout(() => {
              hand.classList.add('dragging');
              
              const draggedCabinet = draggedCabinetRef.current;
              if (draggedCabinet) {
                // Show and position the dragged cabinet ghost
                gsap.set(draggedCabinet, {
                  opacity: 0,
                  x: itemCenterX,
                  y: itemCenterY,
                  scale: 0.8
                });
                
                gsap.to(draggedCabinet, {
                  opacity: 0.6,
                  scale: 0.9,
                  duration: 0.3,
                  ease: 'power2.out'
                });
              }
              
              // Calculate drag path (from sidebar to center of canvas)
              const canvasCenterX = window.innerWidth / 2;
              const canvasCenterY = window.innerHeight / 2;
              
              // Animate hand and dragged cabinet moving to center using GSAP
              const dragTimeline = gsap.timeline({
                onComplete: () => {
                  // Fade out dragged cabinet
                  const cabinetGhost = draggedCabinetRef.current;
                  if (cabinetGhost) {
                    gsap.to(cabinetGhost, {
                      opacity: 0,
                      scale: 0.7,
                      duration: 0.3,
                      ease: 'power2.in',
                      onComplete: () => {
                        completeAnimation();
                      }
                    });
                  } else {
                    completeAnimation();
                  }
                }
              });
              
              dragTimeline.to(hand, {
                x: canvasCenterX,
                y: canvasCenterY,
                duration: 2,
                ease: 'power2.inOut'
              });
              
              // Animate dragged cabinet to follow hand (slightly offset to show it's being dragged)
              if (draggedCabinet) {
                dragTimeline.to(draggedCabinet, {
                  x: canvasCenterX + 30,
                  y: canvasCenterY + 30,
                  duration: 2,
                  ease: 'power2.inOut'
                }, 0); // Start at same time as hand
              }
            }, 800);
          }
        });
      };

      // Complete animation
      const completeAnimation = () => {
        // Close the sidebar after animation completes
        if (toggleBtn) {
          setTimeout(() => {
            setToggleBtn(false);
          }, 500);
        }
        
        if (hand) {
          gsap.to(hand, {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => {
              setIsVisible(false);
              setCurrentStep('complete');
              if (onComplete) {
                onComplete();
              }
            }
          });
        } else {
          setIsVisible(false);
          setCurrentStep('complete');
          if (onComplete) {
            onComplete();
          }
        }
      };

      // Start animation
      clickAnimation();
    };

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(startAnimation, 300);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, toggleBtn, setToggleBtn, onComplete]);

  if (!isVisible) return null;

  return (
    <>
      <div 
        ref={handRef}
        className={`hand-guide ${currentStep}`}
        style={{
          position: 'fixed',
          zIndex: 10000000,
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          willChange: 'transform, opacity'
        }}
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="hand-icon"
        >
          {/* Simple white pointing hand - index finger extended upward */}
          <path
            d="M13 1.5L13 8.5M13 8.5H11.5C10.3 8.5 9.5 9.3 9.5 10.5V11.5C9.5 11.5 8.5 12 8.5 13.5C8.5 15 9.5 16 11 16H12V19C12 20.1 12.7 20.5 13.5 20.5C14.3 20.5 15 20.1 15 19V16H16C17.5 16 18.5 15 18.5 13.5C18.5 12 17.5 11.5 17.5 11.5V10.5C17.5 9.3 16.7 8.5 15.5 8.5H15V3C15 2 14.5 1.5 14.5 1.5"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Wrist */}
          <path
            d="M11 16L11 20C11 20.5 11.2 21 11.5 21H12.5C12.8 21 13 20.5 13 20V16"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        {currentStep === 'click' && (
          <div className="hand-tooltip">Click to open cabinet bar</div>
        )}
        {currentStep === 'drag' && (
          <div className="hand-tooltip">Drag a cabinet to place it</div>
        )}
      </div>
      
      {/* Dragged cabinet ghost visualization */}
      {cabinetThumbnail && (
        <div
          ref={draggedCabinetRef}
          className="dragged-cabinet-ghost"
          style={{
            position: 'fixed',
            zIndex: 9999999,
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
            willChange: 'transform, opacity'
          }}
        >
          <img
            src={cabinetThumbnail}
            alt="Cabinet preview"
            className="ghost-cabinet-image"
          />
        </div>
      )}
    </>
  );
};

export default HandGuideAnimation;


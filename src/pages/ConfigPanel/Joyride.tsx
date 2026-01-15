import { useState, useEffect } from "react";
import { letters } from "../../config/letters";
import { useIndexStore } from "../../store/indexSlice";
import Joyride from "react-joyride";
import "./LanguageSelection.css";

const TOUR_COMPLETED_KEY = 'dar_tour_completed';

const Tour = ({ isSelectedLan, setIsSelectedLan }: any) => {
  // Check localStorage for tour completion status on component mount
  const [runTour, setRunTour] = useState(() => {
    try {
      const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
      return tourCompleted !== 'true'; // Run tour only if it's not marked as completed
    } catch (err) {
      // In case of any localStorage error, default to showing the tour
      console.warn('Error accessing localStorage:', err);
      return true;
    }
  });
  
  const setSelectedLan = useIndexStore((select) => select.setSelectedLan);
  const selectedLan = useIndexStore((select) => select.selectedLan);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [stepIndex, setStepIndex] = useState(0);

  function hadleClickLanBtn(arg0: string): void {
    setSelectedLan(arg0);
    setIsSelectedLan(true)
  }

  // Save tour completion status to localStorage
  const saveTourStatus = (completed: boolean) => {
    try {
      localStorage.setItem(TOUR_COMPLETED_KEY, completed ? 'true' : 'false');
    } catch (err) {
      console.error('Failed to save tour status to localStorage:', err);
    }
  };

  // Cleanup-Funktion
  const cleanupTourClasses = () => {
    const iconSidebar = document.querySelector('.icon-sidebar');
    const sizeButton = document.querySelector('.size-button');
    const colorButton = document.querySelector('.color-button');
    
    if (iconSidebar) {
      iconSidebar.classList.remove('tour-visible');
    }
    if (sizeButton) {
      sizeButton.classList.remove('tour-active');
    }
    if (colorButton) {
      colorButton.classList.remove('tour-active');
    }
  };

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      cleanupTourClasses();
    };
  }, []);

  // Cleanup wenn Tour beendet wird
  useEffect(() => {
    if (!runTour) {
      setTimeout(() => {
        cleanupTourClasses();
      }, 500);
    }
  }, [runTour]);

  const steps: any = [
    {
      target: '.keybind',
      placement: 'left',
      title: 'CABINETS DESIGNS',
      content: 'This is where you can drag and drop the cabinets model.',
      disableBeacon: true,
    },
    {
      target: '.size-button',
      placement: 'right',
      title: 'MODEL MEASUREMENT',
      content: 'You can adjust the Model size (width, length, height) here.',
      disableBeacon: true,
    },
    {
      target: '.icon-sidebar .color-button',
      placement: 'right',
      title: 'MATERIAL AND PRICE',
      content: 'You can choose your materials and adjust the final price here.',
      disableBeacon: true,
    },
  ];

  const stepsArabic: any = [
    {
      target: '.keybind',
      placement: 'left',
      title: 'تصاميم الخزائن', // oder 'تصاميم دواليب المطبخ'
      content: 'هنا يمكنك سحب وإفلات نماذج الخزائن',
      disableBeacon: true,
    },
    {
      target: '.icon-sidebar .size-button',
      placement: 'top',
      title: 'زر تعديل حجم الغرفة',
      content: 'يمكنك ضبط حجم الغرفة (العرض، الطول، الارتفاع) هنا',
      disableBeacon: true,
    },
    {
      target: '.icon-sidebar .color-button',
      placement: 'right',
      title: 'الشريط الجانبي الأيسر', // oder 'قسم المواد والألوان'
      content: 'يمكنك اختيار المواد وتعديل السعر النهائي هنا',
      disableBeacon: true,
    },
  ];

  return (
    isSelectedLan && (
      <Joyride
        steps={selectedLan === "English" ? steps : stepsArabic}
        locale={{
          nextLabelWithProgress: letters[selectedLan].Next,
          back: letters[selectedLan].Back,
          skip: letters[selectedLan].Skip,
          last: letters[selectedLan].Last
        }}
        run={runTour}
        showProgress={true}
        disableOverlayClose
        continuous
        showSkipButton
        disableScrollParentFix
        spotlightClicks={false}
        styles={{
          tooltip: {
            zIndex: 150,
          },
          options: {
            zIndex: 120,
            arrowColor: "rgba(255, 255, 255, 0.5)",
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            overlayColor: "rgba(92, 174, 171, .3)",
            primaryColor: "#0a3f4a",
            textColor: "#0a3f4a",
          },
          buttonBack: {
            color: "#0a3f4a",
          },
          spotlight: {
            display: 'none',
          },
        }}
        callback={(data: any) => {
          const { status, index } = data;

          const iconSidebar = document.querySelector('.icon-sidebar');
          const sizeButton = document.querySelector('.size-button');
          const colorButton = document.querySelector('.color-button');

          // Während der Tour sichtbar machen
          if (iconSidebar && status !== 'finished' && status !== 'skipped') {
            iconSidebar.classList.add('tour-visible');
          }

          if (index === 1) {
            if (sizeButton) {
              sizeButton.classList.add('tour-active');
            }
          } else {
            if (sizeButton) {
              sizeButton.classList.remove('tour-active');
            }
          }

          if (index === 2) {
            if (colorButton) {
              colorButton.classList.add('tour-active');
            }
          } else {
            if (colorButton) {
              colorButton.classList.remove('tour-active');
            }
          }

          // When tour is finished or skipped, mark as completed in localStorage
          if (status === 'finished' || status === 'skipped') {
            setRunTour(false);
            saveTourStatus(true);
            
            // Sofortiges Cleanup
            setTimeout(() => {
              cleanupTourClasses();
            }, 100);
          }
        }}
      />
    )
  )
};

// Add a utility function to reset the tour if needed
export const resetTour = () => {
  try {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
  } catch (err) {
    console.error('Failed to reset tour status:', err);
  }
};

export default Tour;
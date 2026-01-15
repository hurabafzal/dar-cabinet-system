import { useGLTF } from "@react-three/drei";
import { useSideBarStore } from "../store/SideBarSlice";
import "./Sidebar.css";
import { letters } from "../config/letters";
import { useIndexStore } from "../store/indexSlice";
import { useRef } from 'react';

function Sidebar() {
  const selectedLan: string = useIndexStore((select: any) => select.selectedLan);
  const CABINET_ITEMS = useIndexStore((select: any) => select.CABINET_ITEMS);
  
  interface CustomEventListenerOptions extends EventListenerOptions {
    passive?: boolean;
  }

  const RenderButtons: any = () => {
    const setDraggedModel = useSideBarStore((select: any) => select.setDraggedModel);
    
    // Hier ist die neue Logik
    const startY = useRef(0);
    
    function handleGestureStart(event: any, id: string) {
      // 1. Initialisierung der Gestenverfolgung
      const startY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
      const startX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
      const startTime = Date.now();
      
      // Aufzeichnung von Bewegungspunkten für die Analyse
      const movementPoints: {x: number, y: number, time: number}[] = [];
      
      // Status-Flags
      let gestureDecided = false;
      let isDragging = false;
      let isScrolling = false;
      
      // 2. Event-Handler für die Bewegung
      const handleMove = (moveEvent: any) => {
        const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX) || 0;
        const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY) || 0;
        const currentTime = Date.now();
        
        // Bewegungspunkte aufzeichnen für Verlaufsanalyse
        movementPoints.push({
          x: currentX,
          y: currentY,
          time: currentTime
        });
        
        // Wenn die Geste bereits entschieden ist, entsprechend handeln
        if (gestureDecided) {
          if (isDragging) {
            // Im Drag-Modus Scrollen verhindern
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
          }
          return;
        }
        
        // 3. Gestenerkennung nach kurzer Zeit oder bei genügend Datenpunkten
        if (currentTime - startTime > 100 || movementPoints.length >= 4) {
          analyzeGesture();
        }
      };
      
      // 4. Gestenanalyse
      const analyzeGesture = () => {
        if (movementPoints.length < 2) return;
        
        // Gesamtbewegung berechnen
        const lastPoint = movementPoints[movementPoints.length - 1];
        const totalDeltaX = lastPoint.x - startX;
        const totalDeltaY = lastPoint.y - startY;
        
        // Berechnung von Distanz, Winkel und Geschwindigkeit
        const distance = Math.sqrt(totalDeltaX * totalDeltaX + totalDeltaY * totalDeltaY);
        const angle = Math.atan2(Math.abs(totalDeltaY), Math.abs(totalDeltaX)) * (180 / Math.PI);
        const timeElapsed = lastPoint.time - startTime;
        const velocity = distance / timeElapsed; // Pixel pro Millisekunde
        
        // Zu geringe Bewegung - noch keine Entscheidung treffen
        if (distance < 8) return;
        
        gestureDecided = true;
        
        // 5. Entscheidungslogik mit mehreren Faktoren
        
        const isVerticalMovement = angle > 70 && angle < 110; // Strenger: nur sehr vertikal
        const isRapidMovement = velocity > 0.8; // Höher: nur wirklich schnelle Bewegung
        const isVerticallyDominated = Math.abs(totalDeltaY) > Math.abs(totalDeltaX) * 2.0; // Höher: deutlich mehr vertikal

        if (isVerticalMovement && Math.abs(totalDeltaY) > 20 && isVerticallyDominated) {
          isScrolling = true;
        } else if (Math.abs(totalDeltaX) > 5 || distance > 15) {
          isDragging = true;
          setDraggedModel(id);
        }
      };
      
      // 6. Event-Handler für das Ende
      const handleEnd = () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('touchmove', handleMove, { passive: false } as CustomEventListenerOptions);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchend', handleEnd);
      };
      
      // 7. Event-Listener hinzufügen
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('touchmove', handleMove, { passive: false } as CustomEventListenerOptions);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchend', handleEnd);
    }

    function handleMouseDonwn(event: any, id: string) {
      // Startposition speichern
      startY.current = event.clientY || (event.touches && event.touches[0].clientY) || 0;
      const startX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
      
      let isDragging = false;
      let hasMovedEnough = false;
      
      // Timer für verzögerte Auswahl
      const timer = setTimeout(() => {
        // Nur setzen, wenn der Benutzer noch nicht genug bewegt hat
        if (!hasMovedEnough) {
          isDragging = true;
          setDraggedModel(id);
        }
      }, 150);
      
      // Event-Handler für Bewegung
      const handleMove = (moveEvent: any) => {
        const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY) || 0;
        const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX) || 0;
        
        // Berechne die horizontale und vertikale Bewegung
        const deltaY = Math.abs(currentY - startY.current);
        const deltaX = Math.abs(currentX - startX);
        
        // Wenn mehr vertikal als horizontal bewegt und über Schwellenwert, ist es ein Scroll
        if (deltaY > 10 && deltaY > deltaX * 1.5) {
          hasMovedEnough = true;
          clearTimeout(timer); // Timer abbrechen
          
          // Sidebar scrollen verhindern wenn bereits im Drag-Modus
          if (isDragging) {
            moveEvent.preventDefault();
            moveEvent.stopPropagation();
          }
        }
        
        // Wenn mehr horizontal als vertikal bewegt, ist es wahrscheinlich ein Drag
        if (deltaX > 10 && deltaX > deltaY * 1.5) {
          hasMovedEnough = true;
          
          // Nur setzen wenn noch nicht im Drag-Modus
          if (!isDragging) {
            isDragging = true;
            setDraggedModel(id);
          }
          
          // Verhindern des Scrollens während des Drags
          moveEvent.preventDefault();
          moveEvent.stopPropagation();
        }
      };
      
      // Event-Handler für das Ende
      const handleEnd = () => {
        clearTimeout(timer);
        document.removeEventListener('mousemove', handleMove);
        document.addEventListener('touchmove', handleMove, { passive: false } as EventListenerOptions);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchend', handleEnd);
      };
      
      // Event-Listener mit passive: false hinzufügen, um preventDefault zu ermöglichen
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchend', handleEnd);
    }
    
    return CABINET_ITEMS.map((item: any, index: any) => (
      <div className="cabinetItem pt-4" key={index}>
        <div className="cabinetItemBody">
          <img
            src={item.thumbnailSrc}
            width="90%"
            onMouseDown={(event) => handleGestureStart(event, item.id)}
            onTouchStart={(event) => handleGestureStart(event, item.id)}
            className="cabbinetItemImg"
          />
        </div>
      </div>
    ));
  };
  
  return (
    <>
      <div className="cabinetItemContainer">
        <RenderButtons />
      </div>
    </>
  );
}

export default Sidebar;
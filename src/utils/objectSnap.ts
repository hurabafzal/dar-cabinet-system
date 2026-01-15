import * as THREE from "three";

// Konfigurationswerte
export const OBJECT_SNAP_THRESHOLD = 1.5;
export const OBJECT_SNAP_RELEASE_THRESHOLD = 1.0;
export const OBJECT_SNAP_DISTANCE = 1.0;

// Interface für Snap-Punkte
export interface SnapPoint {
  position: THREE.Vector3;
  type: 'left' | 'right' | 'front' | 'back';
  color: number;
}

// Funktion zum Generieren von Snap-Punkten für ein Objekt
export function generateSnapPoints(
  objectPosition: THREE.Vector3,
  objectWidth: number = 0.6,
  objectDepth: number = 0.4
): SnapPoint[] {
  return [
    { // Links
      position: new THREE.Vector3(
        objectPosition.x - objectWidth/2,
        objectPosition.y,
        objectPosition.z
      ),
      type: 'left',
      color: 0xff0000 // Rot
    },
    { // Rechts
      position: new THREE.Vector3(
        objectPosition.x + objectWidth/2,
        objectPosition.y,
        objectPosition.z
      ),
      type: 'right',
      color: 0x00ff00 // Grün
    },
    { // Vorne
      position: new THREE.Vector3(
        objectPosition.x,
        objectPosition.y,
        objectPosition.z + objectDepth/2
      ),
      type: 'front',
      color: 0x0000ff // Blau
    },
    { // Hinten
      position: new THREE.Vector3(
        objectPosition.x,
        objectPosition.y,
        objectPosition.z - objectDepth/2
      ),
      type: 'back',
      color: 0xffff00 // Gelb
    }
  ];
}

export function snapObjects(
  movingObject: THREE.Vector3,
  targetObjectPosition: THREE.Vector3,
  objectWidth: number = 0.6,
  objectDepth: number = 0.4
): THREE.Vector3 {
  // Berechne die Richtung vom Zielobjekt zum bewegten Objekt
  const direction = new THREE.Vector3().subVectors(movingObject, targetObjectPosition).normalize();
  
  // Bestimme, welche Achse dominanter ist (X oder Z)
  const isHorizontal = Math.abs(direction.x) > Math.abs(direction.z);
  
  // Neue Position berechnen basierend auf Ausrichtung
  const newPosition = new THREE.Vector3();
  
  if (isHorizontal) {
    // Horizontales Snapping (links/rechts)
    const signX = Math.sign(direction.x); // -1 für links, 1 für rechts
    newPosition.set(
      targetObjectPosition.x + signX * objectWidth, 
      movingObject.y,
      targetObjectPosition.z
    );
  } else {
    // Vertikales Snapping (vorne/hinten)
    const signZ = Math.sign(direction.z); // -1 für hinten, 1 für vorne
    newPosition.set(
      targetObjectPosition.x,
      movingObject.y,
      targetObjectPosition.z + signZ * objectDepth
    );
  }
  
  return newPosition;
}

// Funktion zum Finden des nächsten Objekts mit Snap-Punkten
export function findNearestObject(
  position: THREE.Vector3,
  currentObjUuid: string,
  activeObjectPositions: Record<string, THREE.Vector3>,
  objectWidth: number = 0.6,
  objectDepth: number = 0.4
): { position: THREE.Vector3, targetUuid: string, snappedToPoint: SnapPoint } | null {
  // Grundlegende Validierung
  if (!activeObjectPositions || Object.keys(activeObjectPositions).length === 0) {
    return null;
  }
  
  // Threshold für Snapping
  const threshold = OBJECT_SNAP_THRESHOLD;
  
  // Erstelle Snap-Punkte für das aktuelle Objekt
  const currentObjSnapPoints = generateSnapPoints(position, objectWidth, objectDepth);
  
  // Variablen für das beste Ergebnis
  let bestUuid: string | null = null;
  let bestDistance = threshold;
  let bestPosition: THREE.Vector3 | null = null;
  let bestSnapPoint: SnapPoint | null = null;
  
  // Für jedes Objekt in activeObjectPositions
  for (const [uuid, objPosition] of Object.entries(activeObjectPositions)) {
    // Das aktuelle Objekt überspringen
    if (uuid === currentObjUuid) continue;
    
    try {
      // Generiere Snap-Punkte für dieses Objekt
      const targetSnapPoints = generateSnapPoints(objPosition, objectWidth, objectDepth);
      
      // Für jede Kombination aus aktuellen und Ziel-Snap-Punkten
      for (const currentPoint of currentObjSnapPoints) {
        for (const targetPoint of targetSnapPoints) {
          // Berechne den Abstand zwischen den Punkten
          const distance = currentPoint.position.distanceTo(targetPoint.position);
          
          // Wenn der Abstand innerhalb des Schwellenwerts liegt und besser ist
          if (distance < bestDistance) {
            bestDistance = distance;
            bestUuid = uuid;
            
            // Berechne Snap-Position basierend auf Punkt-Typ
            if (targetPoint.type === 'left' || targetPoint.type === 'right') {
              // Horizontales Snapping
              const offsetX = (targetPoint.type === 'left') ? -objectWidth : objectWidth;
              bestPosition = new THREE.Vector3(
                targetPoint.position.x + offsetX, 
                position.y,
                targetPoint.position.z
              );
            } else {
              // Vertikales Snapping
              const offsetZ = (targetPoint.type === 'front') ? objectDepth : -objectDepth;
              bestPosition = new THREE.Vector3(
                targetPoint.position.x,
                position.y, 
                targetPoint.position.z + offsetZ
              );
            }
            
            bestSnapPoint = targetPoint;
          }
        }
      }
    } catch (error) {
      console.error("Fehler bei Objektprüfung:", error);
    }
  }
  
  // Rückgabe wenn ein passendes Objekt gefunden wurde
  if (bestUuid && bestPosition && bestSnapPoint) {
    //console.log(`[OBJEKT-SNAP] GEFUNDEN - UUID: ${bestUuid}`);
    //console.log(`[OBJEKT-SNAP] Finale Position: [${bestPosition.x.toFixed(2)}, ${bestPosition.y.toFixed(2)}, ${bestPosition.z.toFixed(2)}]`);
    
    return {
      position: bestPosition,
      targetUuid: bestUuid,
      snappedToPoint: bestSnapPoint
    };
  }
  
  // Kein passendes Objekt gefunden
  return null;
}
// src/utils/logger.ts

/**
 * Einfacher Logger für Debugging-Zwecke
 */
export const logger = {
    /**
     * Protokolliert Debug-Informationen
     * @param message - Die Nachricht
     * @param data - Zusätzliche Daten
     */
    debug: (message: string, data?: any): void => {
      console.log(`%c[DEBUG] ${message}`, 'background: #222; color: #bada55', data);
    },
    
    /**
     * Protokolliert Snapping-Informationen
     * @param position - Die aktuelle Position
     * @param wallPosition - Die Position der Wand
     * @param wallType - Die Art der Wand
     */
    snap: (position: any, wallPosition: any, wallType: string): void => {
      console.log(
        `%c[SNAP] ${wallType}`, 
        'background: #222; color: #44aaff',
        `\nObjekt: [${position.x.toFixed(3)}, ${position.y.toFixed(3)}, ${position.z.toFixed(3)}]`,
        `\nWand: ${wallPosition}`
      );
    }
  };
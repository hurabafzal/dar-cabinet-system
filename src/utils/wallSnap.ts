// src/utils/wallSnap.ts
import * as THREE from "three";
import { findNearestObject } from './objectSnap';

// Einstellungen
export const SNAP_THRESHOLD = 1.0; // Snap-Distanz in Einheiten (2D-Abstand)
export const BOUNDARY_MARGIN = 0.2; // Increased margin from 0.1 to 0.2 to prevent items moving through walls

// Feste Wand-Anpassungen - Increased values to prevent wall collision
export const WALL_ADJUST = {
  front: -.3,
  back: .3,
  left: -.3,
  right: .3
};

/**
 * Wandeinrasten: Findet den nächsten Punkt auf einer Wand
 * Verbesserte Version mit Y-Koordinate-Erhaltung
 */
export function findNearestWallPoint(
  position: THREE.Vector3,
  roomSize: any
): { position: THREE.Vector3, wallType: string } | null {
  if (!roomSize) return null;

  // Wand-Positionen
  const frontWallZ = 0; // Frontale Wand
  const backWallZ = -roomSize.length * 7.8 / 600;           // ← FIX!
  const leftWallX = roomSize.width * 7.8 / 600 / 2;         // ← FIX!
  const rightWallX = -roomSize.width * 7.8 / 600 / 2;

  // Erstelle eine Kopie der Position für das Snapping
  // Wichtig: Y-Koordinate beibehalten
  const snappedPosition = new THREE.Vector3(position.x, position.y, position.z);

  // Berechne den 2D-Abstand zu jeder Wand (nur X-Z-Ebene)
  const distToFront = Math.abs(position.z - frontWallZ);
  const distToBack = Math.abs(position.z - backWallZ);
  const distToLeft = Math.abs(position.x - leftWallX);
  const distToRight = Math.abs(position.x - rightWallX);

  // Prüfe, ob wir nahe genug an einer Wand sind
  let snappedToWall = false;
  let wallType = "";

  // Prüfen wir alle Wände der Reihe nach
  const distances = [distToFront, distToBack, distToLeft, distToRight];
  const minDistance = Math.min(...distances);
  const minIndex = distances.indexOf(minDistance);

  if (minDistance <= SNAP_THRESHOLD) {
    const wallTypes = ['front', 'back', 'left', 'right'];
    const selectedWallType = wallTypes[minIndex];

    // Apply wall adjustments with additional safety margin
    if (selectedWallType === 'front') {
      snappedPosition.z = frontWallZ + WALL_ADJUST.front;
      wallType = "front";
    } else if (selectedWallType === 'back') {
      snappedPosition.z = backWallZ + WALL_ADJUST.back;
      wallType = "back";
    } else if (selectedWallType === 'left') {
      snappedPosition.x = leftWallX + WALL_ADJUST.left;
      wallType = "left";
    } else if (selectedWallType === 'right') {
      snappedPosition.x = rightWallX + WALL_ADJUST.right;
      wallType = "right";
    }

    // Additional validation to ensure we're not too close to walls
    if (selectedWallType === 'front' && snappedPosition.z > frontWallZ) {
      snappedPosition.z = frontWallZ + WALL_ADJUST.front;
    } else if (selectedWallType === 'back' && snappedPosition.z < backWallZ) {
      snappedPosition.z = backWallZ + WALL_ADJUST.back;
    } else if (selectedWallType === 'left' && snappedPosition.x > leftWallX) {
      snappedPosition.x = leftWallX + WALL_ADJUST.left;
    } else if (selectedWallType === 'right' && snappedPosition.x < rightWallX) {
      snappedPosition.x = rightWallX + WALL_ADJUST.right;
    }

    snappedToWall = true;
  } else {
    console.log(`❌ NO SNAP: minDistance ${minDistance.toFixed(2)} > threshold ${SNAP_THRESHOLD}`);
  }

  if (snappedToWall) {
    //console.log(`[WAND-SNAP] Erfolg - Typ: ${wallType}`);
    //console.log(`[WAND-SNAP] Position: [${snappedPosition.x.toFixed(2)}, ${snappedPosition.y.toFixed(2)}, ${snappedPosition.z.toFixed(2)}]`);
    return { position: snappedPosition, wallType: wallType };
  }

  return null;
}

/**
 * Calculate room boundary coordinates for constraint checking
 */
export function calculateRoomBoundaries(roomSize: any, objectWidth: number = 0.6, objectDepth: number = 0.4) {
  if (!roomSize) return null;

  const halfWidth = objectWidth / 2;
  const halfDepth = objectDepth / 2;

  // Calculate room boundaries with additional safety margins
  // Matching main branch exactly - leftWallX and rightWallX don't include halfWidth
  return {
    frontWallZ: 0 + WALL_ADJUST.front + BOUNDARY_MARGIN + halfDepth,
    backWallZ: -roomSize.length * 7.8 / 600 + WALL_ADJUST.back - BOUNDARY_MARGIN - halfDepth,
    leftWallX: roomSize.width * 7.8 / 600 / 2 + WALL_ADJUST.left - BOUNDARY_MARGIN,
    rightWallX: -roomSize.width * 7.8 / 600 / 2 + WALL_ADJUST.right + BOUNDARY_MARGIN,
  };
}

/**
 * Check if a position exceeds room boundaries and returns the walls that are exceeded
 */
export function checkBoundaryExceeded(position: THREE.Vector3, boundaries: any) {
  if (!boundaries) return { exceeded: false };

  return {
    exceeded:
      position.x > boundaries.leftWallX ||
      position.x < boundaries.rightWallX ||
      position.z > boundaries.frontWallZ ||
      position.z < boundaries.backWallZ,
    walls: {
      left: position.x > boundaries.leftWallX,
      right: position.x < boundaries.rightWallX,
      front: position.z > boundaries.frontWallZ,
      back: position.z < boundaries.backWallZ
    }
  };
}

/**
 * Import collision detection functions
 */
import { adjustPositionToAvoidCollisions } from './collisionDetection';


/**
 * Enforce room boundaries and prevent object collisions
 * @param position Current position
 * @param roomSize Room dimensions
 * @param objectWidth Width of the object
 * @param objectDepth Depth of the object
 * @param objectUuid UUID of the object being moved
 * @param allObjects All objects in the scene with positions
 * @param objectSizes Optional map of object sizes by UUID
 * @returns Adjusted position and wall collision info
 */
export function enforceRoomBoundaries(
  position: THREE.Vector3,
  roomSize: any,
  objectWidth: number = 0.6,
  objectDepth: number = 0.4,
  objectUuid?: string,
  allObjects?: Record<string, THREE.Vector3>,
  objectSizes?: Record<string, { width: number, depth: number, height?: number }>
): { position: THREE.Vector3, exceededWalls?: { left: boolean, right: boolean, front: boolean, back: boolean } } {
  if (!roomSize) return { position };

  // Get room boundaries
  const boundaries = calculateRoomBoundaries(roomSize, objectWidth, objectDepth);
  if (!boundaries) return { position };

  const constrainedPosition = new THREE.Vector3().copy(position);

  // Check which walls are exceeded
  const boundaryCheck = checkBoundaryExceeded(constrainedPosition, boundaries);

  if (boundaryCheck.exceeded) {
    // Constrain X position (left-right) with strict boundary enforcement
    if (constrainedPosition.x >= boundaries.leftWallX - BOUNDARY_MARGIN) {
      constrainedPosition.x = boundaries.leftWallX - BOUNDARY_MARGIN;
    }
    if (constrainedPosition.x <= boundaries.rightWallX + BOUNDARY_MARGIN) {
      constrainedPosition.x = boundaries.rightWallX + BOUNDARY_MARGIN;
    }

    // Constrain Z position (front-back) with strict boundary enforcement
    if (constrainedPosition.z >= boundaries.frontWallZ - BOUNDARY_MARGIN) {
      constrainedPosition.z = boundaries.frontWallZ - BOUNDARY_MARGIN;
    }
    if (constrainedPosition.z <= boundaries.backWallZ + BOUNDARY_MARGIN) {
      constrainedPosition.z = boundaries.backWallZ + BOUNDARY_MARGIN;
    }
  }

  // Apply collision detection but only for real objects, allowing placement against walls
  if (objectUuid && allObjects && Object.keys(allObjects).length > 1) {
    // Only use real objects for collision detection, no artificial barriers
    const objectsToUse = { ...allObjects };

    // Apply standard collision avoidance
    const adjustedPosition = adjustPositionToAvoidCollisions(
      constrainedPosition,
      objectUuid,
      objectWidth,
      objectDepth,
      1.0, // Default height
      objectsToUse,
      objectSizes
    );

    // Check if the collision-adjusted position is still within room boundaries
    const adjustedPositionCheck = checkBoundaryExceeded(adjustedPosition, boundaries);

    if (!adjustedPositionCheck.exceeded) {
      // If the adjusted position is within boundaries, use it
      return {
        position: adjustedPosition,
        exceededWalls: boundaryCheck.walls
      };
    }

    // If adjusted position exceeds boundaries, apply boundary constraints to it (matching main branch)
    const finalPosition = new THREE.Vector3().copy(adjustedPosition);

    // Use same logic as main branch boundary enforcement
    if (finalPosition.x >= boundaries.leftWallX - BOUNDARY_MARGIN) {
      finalPosition.x = boundaries.leftWallX - BOUNDARY_MARGIN;
    }
    if (finalPosition.x <= boundaries.rightWallX + BOUNDARY_MARGIN) {
      finalPosition.x = boundaries.rightWallX + BOUNDARY_MARGIN;
    }
    if (finalPosition.z >= boundaries.frontWallZ - BOUNDARY_MARGIN) {
      finalPosition.z = boundaries.frontWallZ - BOUNDARY_MARGIN;
    }
    if (finalPosition.z <= boundaries.backWallZ + BOUNDARY_MARGIN) {
      finalPosition.z = boundaries.backWallZ + BOUNDARY_MARGIN;
    }

    return {
      position: finalPosition,
      exceededWalls: adjustedPositionCheck.walls
    };
  }

  return {
    position: constrainedPosition,
    exceededWalls: boundaryCheck.exceeded ? boundaryCheck.walls : undefined
  };
}

/**
 * Erweiterte Snap-Funktion die sowohl Wände als auch Objekte berücksichtigt
 * Objektsnapping wird priorisiert
 */
export function findSnapTarget(
  position: THREE.Vector3,
  roomSize: any,
  currentObjUuid: string,
  objectsPositions: Record<string, THREE.Vector3>,
  objectWidth: number = 0.66,
  objectDepth: number = 0.66
): { position: THREE.Vector3, snapType: string, targetId?: string } | null {
  // Zuerst prüfen wir das Einrasten an anderen Objekten (Priorität)
  const objectSnap = findNearestObject(
    position,
    currentObjUuid,
    objectsPositions,
    objectWidth,
    objectDepth
  );

  // Dann prüfen wir das Einrasten an Wänden
  const wallSnap = findNearestWallPoint(position, roomSize);

  // Entscheiden, welches Snap-Ziel wir verwenden
  if (objectSnap) {
    // Objekt-Snap hat immer Vorrang
    return {
      position: objectSnap.position,
      snapType: 'object',
      targetId: objectSnap.targetUuid
    };
  }
  // Nur Wand-Snap gefunden
  else if (wallSnap) {
    return {
      position: wallSnap.position,
      snapType: `wall-${wallSnap.wallType}`
    };
  }

  // Kein Snap-Ziel gefunden
  return null;
}
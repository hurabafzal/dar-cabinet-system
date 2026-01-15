/**
 * Utilities for managing design state and batch operations
 */

import * as THREE from 'three';
import { saveDesignState } from './apiUtils';

/**
 * Save all item positions in the design to the server
 * @param objectPositions Global object positions dictionary
 * @param objectTypes Map of object UUIDs to their types/names
 * @param objectDimensions Optional map of object dimensions
 * @returns Promise with the server response
 */
export async function saveAllItemPositions(
  objectPositions: Record<string, THREE.Vector3>,
  objectTypes: Record<string, string> = {},
  objectDimensions: Record<string, {width: number; height: number; depth: number}> = {}
): Promise<any> {
  // Prepare array of all item positions
  const itemsData = Object.entries(objectPositions).map(([uuid, position]) => ({
    uuid,
    position: {
      x: position.x,
      y: position.y,
      z: position.z
    },
    itemType: objectTypes[uuid] || 'furniture',
    dimensions: objectDimensions[uuid] || {
      width: 0.6,
      height: 1.0,
      depth: 0.4
    }
  }));

  // Don't send API request if there are no items
  if (itemsData.length === 0) {
    console.log('No items to save');
    return Promise.resolve({ success: true, message: 'No items to save' });
  }

  // Send all positions to the API
  return saveDesignState(itemsData)
    .then(response => {
      console.log(`Saved positions for ${itemsData.length} items`);
      return response;
    })
    .catch(error => {
      console.error('Failed to save all positions:', error);
      throw error;
    });
}

/**
 * Create a snapshot of the current design state
 * @param objectPositions Global object positions
 * @param objectRotations Optional rotations for objects
 * @param objectTypes Optional map of object types
 * @returns Design state snapshot as JSON
 */
export function createDesignSnapshot(
  objectPositions: Record<string, THREE.Vector3>,
  objectRotations: Record<string, THREE.Quaternion> = {},
  objectTypes: Record<string, string> = {}
): string {
  const snapshot = {
    timestamp: new Date().toISOString(),
    items: Object.entries(objectPositions).map(([uuid, position]) => ({
      uuid,
      position: {
        x: position.x,
        y: position.y,
        z: position.z
      },
      rotation: objectRotations[uuid] 
        ? {
            x: objectRotations[uuid].x,
            y: objectRotations[uuid].y,
            z: objectRotations[uuid].z,
            w: objectRotations[uuid].w
          } 
        : undefined,
      itemType: objectTypes[uuid] || 'furniture'
    }))
  };

  return JSON.stringify(snapshot);
}

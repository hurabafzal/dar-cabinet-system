import * as THREE from "three";

/**
 * Defines the bounding box of an object for collision detection
 */
export interface ObjectBounds {
  position: THREE.Vector3;  // Center position
  width: number;           // Width along X axis
  depth: number;           // Depth along Z axis
  height?: number;         // Height along Y axis (optional, default 1)
  uuid: string;            // Unique identifier
}

/**
 * Minimum distance required between objects to avoid collision
 * Moderate spacing for furniture items
 */
export const MIN_OBJECT_DISTANCE = 0.2; // 20cm buffer (reasonable separation)

/**
 * Check if two objects with rectangular bounds are intersecting/colliding
 * Enhanced with extreme padding to prevent overlap
 */
export function areObjectsColliding(obj1: ObjectBounds, obj2: ObjectBounds): boolean {
  // Safety checks for null or invalid objects
  if (!obj1 || !obj2) return false;
  if (!obj1.position || !obj2.position) return false;
  
  // Safety checks for valid numeric positions
  if (typeof obj1.position.x !== 'number' || isNaN(obj1.position.x) || 
      typeof obj1.position.y !== 'number' || isNaN(obj1.position.y) || 
      typeof obj1.position.z !== 'number' || isNaN(obj1.position.z)) {
    return false;
  }
  
  if (typeof obj2.position.x !== 'number' || isNaN(obj2.position.x) || 
      typeof obj2.position.y !== 'number' || isNaN(obj2.position.y) || 
      typeof obj2.position.z !== 'number' || isNaN(obj2.position.z)) {
    return false;
  }
  
  // Safety checks for valid dimensions
  if (typeof obj1.width !== 'number' || typeof obj1.depth !== 'number' || 
      typeof obj2.width !== 'number' || typeof obj2.depth !== 'number') {
    return false;
  }
  
  // Calculate half dimensions with safety checks
  const halfWidth1 = Math.max(0.1, obj1.width / 2); // Minimum size of 0.1
  const halfDepth1 = Math.max(0.1, obj1.depth / 2);
  const halfHeight1 = Math.max(0.1, (obj1.height || 1) / 2);
  
  const halfWidth2 = Math.max(0.1, obj2.width / 2);
  const halfDepth2 = Math.max(0.1, obj2.depth / 2);
  const halfHeight2 = Math.max(0.1, (obj2.height || 1) / 2);
  
  // Add minimum distance buffer to the bounds
  const totalHalfWidth = halfWidth1 + halfWidth2 + MIN_OBJECT_DISTANCE;
  const totalHalfDepth = halfDepth1 + halfDepth2 + MIN_OBJECT_DISTANCE;
  const totalHalfHeight = halfHeight1 + halfHeight2 + MIN_OBJECT_DISTANCE;
  
  // Calculate absolute distance between object centers with safety
  try {
    const dx = Math.abs(obj1.position.x - obj2.position.x);
    const dz = Math.abs(obj1.position.z - obj2.position.z);
    const dy = Math.abs(obj1.position.y - obj2.position.y);
    
    // Check for collision on all axes (AABB collision detection)
    return (
      dx < totalHalfWidth &&
      dz < totalHalfDepth &&
      dy < totalHalfHeight
    );
  } catch (err) {
    console.error('Error calculating collision:', err);
    return false; // Assume no collision on error
  }
}

/**
 * Find collisions between a moving object and all other objects in the scene
 * @returns The UUIDs of any objects that the moving object collides with
 */
export function findCollisions(
  movingObject: ObjectBounds,
  allObjects: Record<string, ObjectBounds>
): string[] {
  // Safety check for null or invalid inputs
  if (!movingObject || !allObjects) {
    console.warn('findCollisions called with invalid parameters');
    return [];
  }
  
  // Verify moving object has valid position
  if (!movingObject.position || 
      typeof movingObject.position.x !== 'number' || 
      isNaN(movingObject.position.x) || 
      typeof movingObject.position.z !== 'number' || 
      isNaN(movingObject.position.z)) {
    console.warn('Moving object has invalid position:', movingObject.position);
    return [];
  }
  
  const collisions: string[] = [];
  
  // Check collision against all other objects with safety checks
  try {
    for (const [uuid, obj] of Object.entries(allObjects)) {
      // Skip checking against self or invalid objects
      if (uuid === movingObject.uuid || !obj || !obj.position) continue;
      
      // Verify object has valid position
      if (typeof obj.position.x !== 'number' || 
          isNaN(obj.position.x) || 
          typeof obj.position.z !== 'number' || 
          isNaN(obj.position.z)) {
        continue;
      }
      
      // Check if objects collide
      try {
        if (areObjectsColliding(movingObject, obj)) {
          collisions.push(uuid);
        }
      } catch (err) {
        console.error('Error in collision check:', err);
      }
    }
  } catch (err) {
    console.error('Error in findCollisions:', err);
  }
  
  return collisions;
}

/**
 * Adjust position to avoid collisions with other objects
 * @returns New position that doesn't collide with other objects
 */
export function adjustPositionToAvoidCollisions(
  originalPosition: THREE.Vector3,
  movingObjectUuid: string,
  width: number = 0.6,
  depth: number = 0.4,
  height: number = 1.0,
  allObjects: Record<string, THREE.Vector3>,
  objectSizes: Record<string, {width: number, depth: number, height?: number}> = {}
): THREE.Vector3 {
  // If there are no other objects, no adjustment needed
  if (Object.keys(allObjects).length <= 1) {
    return originalPosition.clone();
  }
  
  // Add small padding to dimensions for better spacing
  const dimensionPadding = 0.1; // 10cm padding (reasonable value)
  
  // Create ObjectBounds for the moving object with padding
  const movingObj: ObjectBounds = {
    position: originalPosition.clone(),
    width: width + dimensionPadding,
    depth: depth + dimensionPadding,
    height,
    uuid: movingObjectUuid
  };
  
  // Convert all objects to ObjectBounds format
  const objectBounds: Record<string, ObjectBounds> = {};
  for (const [uuid, position] of Object.entries(allObjects)) {
    if (uuid === movingObjectUuid) continue; // Skip the moving object
    
    // Get object dimensions or use defaults
    const objSize = objectSizes[uuid] || { width, depth, height };
    
    objectBounds[uuid] = {
      position: position.clone(),
      width: objSize.width + dimensionPadding,
      depth: objSize.depth + dimensionPadding,
      height: objSize.height || height,
      uuid
    };
  }
  
  // Check if current position causes collisions
  const collisions = findCollisions(movingObj, objectBounds);
  if (collisions.length === 0) {
    return originalPosition.clone(); // No collisions, return original position
  }
  
  // Try to find a non-colliding position
  const adjustedPosition = originalPosition.clone();
  const step = 0.25; // Larger step size for more aggressive separation
  const maxSteps = 20; // More steps to ensure proper separation even in complex cases
  
  // Try to push away from colliding objects
  for (const collidingUuid of collisions) {
    const collidingObj = objectBounds[collidingUuid];
    if (!collidingObj) continue;
    
    // Vector from colliding object to moving object
    const pushDirection = new THREE.Vector3()
      .subVectors(adjustedPosition, collidingObj.position)
      .normalize();
    
    // Try increasing steps until no collision
    for (let i = 1; i <= maxSteps; i++) {
      // Calculate candidate position
      const candidatePos = adjustedPosition.clone().add(
        pushDirection.clone().multiplyScalar(step * i)
      );
      
      // Update moving object position
      movingObj.position.copy(candidatePos);
      
      // Check if this position still collides
      const newCollisions = findCollisions(movingObj, objectBounds);
      if (newCollisions.length === 0) {
        return candidatePos; // Found a non-colliding position
      }
    }
  }
  
  // Add safety checks and use a simpler approach to avoid potential WebGL rendering issues
  // We'll use a simple offset instead of complex calculations that might cause errors
  
  // Use reasonable offsets for spacing in fallback case
  const offsetX = 0.2;
  const offsetZ = 0.2;
  
  // Try various directions with reasonable offsets
  const directions = [
    new THREE.Vector3(offsetX, 0, 0),           // Right
    new THREE.Vector3(-offsetX, 0, 0),          // Left
    new THREE.Vector3(0, 0, offsetZ),           // Forward
    new THREE.Vector3(0, 0, -offsetZ),          // Backward
    new THREE.Vector3(offsetX, 0, offsetZ),     // Diagonal right-forward
    new THREE.Vector3(-offsetX, 0, offsetZ),    // Diagonal left-forward
    new THREE.Vector3(offsetX, 0, -offsetZ),    // Diagonal right-backward
    new THREE.Vector3(-offsetX, 0, -offsetZ)    // Diagonal left-backward
  ];
  
  // Try each direction and find the best one
  let bestPosition = adjustedPosition.clone();
  let fewestCollisions = collisions.length;
  
  for (const direction of directions) {
    const candidatePos = adjustedPosition.clone().add(direction);
    
    // Safety check - ensure the position is valid
    if (!candidatePos || isNaN(candidatePos.x) || isNaN(candidatePos.y) || isNaN(candidatePos.z)) {
      continue;
    }
    
    // Update moving object position for collision check
    movingObj.position.copy(candidatePos);
    
    // Check collisions with this position
    try {
      const newCollisions = findCollisions(movingObj, objectBounds);
      if (newCollisions.length < fewestCollisions) {
        bestPosition = candidatePos;
        fewestCollisions = newCollisions.length;
        
        // If we found a position with no collisions, use it immediately
        if (newCollisions.length === 0) {
          return bestPosition;
        }
      }
    } catch (err) {
      // If an error occurs, just continue to the next direction
      console.error('Error in collision detection:', err);
    }
  }
  
  // Return the best position we found, or use a stronger fallback if needed
  if (fewestCollisions < collisions.length) {
    return bestPosition;
  }
  
  // If no better position was found, use a small offset as last resort
  // This ensures minimal adjustment while still preventing overlap
  return originalPosition.clone().add(new THREE.Vector3(0.3, 0, 0.3));
}

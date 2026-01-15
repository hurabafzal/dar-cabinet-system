/**
 * API utilities for saving and retrieving design data
 */

import axios from 'axios';

/**
 * Interface for furniture item position data
 */
export interface ItemPositionData {
  uuid: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  itemType?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

/**
 * Save item position to the server
 * @param itemData Data about the item and its position
 * @returns Promise with the server response
 */
export async function saveItemPosition(itemData: ItemPositionData): Promise<any> {
  try {
    const response = await axios.post('/api/design', itemData);
    console.log('Position saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving position:', error);
    throw error;
  }
}

/**
 * Save multiple item positions to the server
 * @param itemsData Array of item position data
 * @returns Promise with the server response
 */
export async function saveDesignState(itemsData: ItemPositionData[]): Promise<any> {
  try {
    const response = await axios.post('/api/design', { items: itemsData });
    console.log('Design state saved successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving design state:', error);
    throw error;
  }
}

/**
 * Get saved design data from the server
 * @returns Promise with the server response containing design data
 */
export async function getDesignData(): Promise<any> {
  try {
    const response = await axios.get('/api/design');
    console.log('Design data retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('Error retrieving design data:', error);
    throw error;
  }
}

/**
 * Delete an item from the design
 * @param itemUuid UUID of the item to delete
 * @returns Promise with the server response
 */
export async function deleteDesignItem(itemUuid: string): Promise<any> {
  try {
    const response = await axios.delete(`/api/design/${itemUuid}`);
    console.log('Item deleted successfully:', itemUuid);
    return response.data;
  } catch (error) {
    console.error(`Error deleting item ${itemUuid}:`, error);
    throw error;
  }
}

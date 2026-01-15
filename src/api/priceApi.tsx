import axios from "axios";
import { API_GET_PRICE, CREATE_MODEL_PRICE, DELETE_MODEL_PRICE, UPDATE_MODEL_PRICE, GET_MEASUREMENTS } from '../apiURL/endpoints';

// Price cache implementation to prevent redundant API calls
const priceCache = new Map<string, any>();

// Calculate a cache key from price parameters
const getPriceCacheKey = (price: any): string => {
  const category = price.material === "Cleaf" ? "A" :
                  price.material === "Egger" ? "B" : "C";
  const component = price.component;
  const count = price.count;
  return `${category}_${component}_${count}`;
};

// Debounce function to prevent multiple calls in quick succession
let pendingPriceCalls: Record<string, Promise<any>> = {};

export const getPrice = async (price: any) => {
  try {
    // Generate cache key
    const cacheKey = getPriceCacheKey(price);
    
    // Check if this exact calculation is already in the cache
    if (priceCache.has(cacheKey)) {
      console.log(`✅ Cache hit for price calculation: ${cacheKey}`);
      return priceCache.get(cacheKey);
    }
    
    // Check if there's already a pending call for this cache key
    if (pendingPriceCalls?.[cacheKey] !== undefined) {
      console.log(`⏳ Reusing pending price calculation: ${cacheKey}`);
      return pendingPriceCalls[cacheKey];
    }
    
    // Create API payload
    const apiPayload = {
      categories: [{
        category: price.material === "Cleaf" ? "A" :
                  price.material === "Egger" ? "B" : "C",
        components: {
          doors: price.component === "Door" ? price.count : 0,
          frame: price.component === "Frame" ? price.count : 0,
          shelves: price.component === "Shelf" ? price.count : 0,
          drawers: price.component === "Drawer" ? price.count : 0
        }
      }]
    };
    
    // Make the API call and store it as a pending call
    console.log(`🔄 Making price API call for: ${cacheKey}`);
    pendingPriceCalls[cacheKey] = axios.post(API_GET_PRICE, apiPayload)
      .then(response => {
        // Format the result
        const result = {
          component: price.component,
          subPrice: response.data.total || 0
        };
        
        // Store in cache
        priceCache.set(cacheKey, result);
        
        // Remove from pending calls
        delete pendingPriceCalls[cacheKey];
        
        return result;
      })
      .catch(error => {
        console.error("API Error:", error.response?.data);
        delete pendingPriceCalls[cacheKey];
        return { component: price.component, subPrice: 0 };
      });
    
    return pendingPriceCalls[cacheKey];
  } catch (error: any) {
    console.error("API Error:", error.response?.data);
    return { component: price.component, subPrice: 0 };
  }
};

// Function to clear the price cache if needed
export const clearPriceCache = () => {
  priceCache.clear();
  console.log("💫 Price cache cleared");
};

export const getBaseModelPrice = async (priceData: object) => {
  try {
    const response = await axios.post(`${CREATE_MODEL_PRICE}`, priceData);
    return response.data;
  } catch (error: any) {
    console.error("Fetch error:", error);
    if (error.response) {
      console.error("Backend response:", error.response.status, error.response.data);
    }
    throw error; // Re-throw für besseres Error Handling
  }
}

export const delPrice = async (uuid: any) => {
  try {
    const response = await axios.delete(`${DELETE_MODEL_PRICE}/${uuid}`);
    return response.data;
  } catch (error) {
    console.error("Fetch error:", error);
    return;
  }
}

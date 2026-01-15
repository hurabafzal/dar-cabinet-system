import axios from 'axios';
import { GET_ALL_MATERIAL } from '../apiURL/endpoints';
//New
import { transformTextureUrl } from '../config/assetConfig';


/*
export const getMaterialList = async () => {
  try {
    const response = await axios.get(GET_ALL_MATERIAL);
    return response.data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
*/
export const getMaterialList = async () => {
  try {
    const response = await axios.get(GET_ALL_MATERIAL);
    
    // Transform URLs
    const transformedData = response.data.map((category: any) => ({
      ...category,
      // Transform the textures for each category
      textures: category.textures?.map((texture: any) => ({
        ...texture,
        textureSrc: transformTextureUrl(texture.textureSrc)
      }))
    }));
    
    return transformedData;
  } catch (error) {
    console.error('Fetch error:', error);
  }
};
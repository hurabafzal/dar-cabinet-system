import axios from 'axios';
import { GET_ALL_DESIGN_MODELS } from '../apiURL/endpoints';
//New import
import { transformModelUrl, transformThumbnailUrl } from '../config/assetConfig';

export const getModelList = async () => {
  try {
    const response = await axios.get('http://dar-cabinet/api/models');
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

export const putStagedModels = async (modelInfo: []) => {
  try {
    await axios.put('https://dar-cabinet/api/models', modelInfo);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

export const getAllDesignModels = async () => {
  try {
    const response = await axios.get(GET_ALL_DESIGN_MODELS, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Credentials': 'true',
      }
    });

    // Backend liefert bereits vollständige CloudFront URLs, keine Transformation nötig
    return response.data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error; // Re-throw für besseres Error Handling
  }
};

/*
export const getModelList = async () => {
  try {
    const response = await axios.get('http://dar-cabinet/api/models');
  } catch (error) {
    console.error('Fetch error:', error);
  }
}


export const putStagedModels = async (modelInfo: []) => {
  try {
    await axios.put('https://dar-cabinet/api/models', modelInfo);
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

export const getAllDesignModels = async () => {
  try {
    const response = await axios.get(GET_ALL_DESIGN_MODELS, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        'Access-Control-Allow-Credentials': 'true',
      }
    });
    return response.data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
}
*/


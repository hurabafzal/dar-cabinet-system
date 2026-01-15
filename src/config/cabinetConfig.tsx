import { useGLTF, useTexture } from "@react-three/drei";
import { getAllDesignModels } from "../api/modelApi"
import { useIndexStore } from "../store/indexSlice";
import { getMaterialList } from "../api/materialApi";
let material_items: any;

export const cabinetConfig = async (setIsInitialLoading: any) => {
  const setCABINET_ITEMS = useIndexStore((select: any) => select.setCABINET_ITEMS);
  setIsInitialLoading(true);
  const designModels = await getAllDesignModels();
  setCABINET_ITEMS(designModels);
  setIsInitialLoading(false);
  return designModels;
}

export const materialConfig = async () => {
  // const setMATERIAL_ITEMS = useIndexStore((select: any) => select.setMATERIAL_ITEMS);
  const materialList = await getMaterialList();
  // await setMATERIAL_ITEMS(materialList);
  material_items = materialList;
  return materialList;
}

export const COUNTBYCATEGORY = (CABINET_ITEMS: any) => {
  return CABINET_ITEMS?.reduce((acc: any, { name, textures }: any) => {
    return ({
      ...acc,
      [name.split(' ').pop() as string]: (acc[name.split(' ').pop() as string] || 0) + textures.filter((t: any) => t.isVisible).length
    })
  }, {});
};
import { create } from "zustand";

export interface ConfiguratorSlice {
  width: number;
  height: number;
  depth: number;
  price: any;
  roomSize: object;
  isClickRoom: boolean;
  priceData: object;
  isClickedApplyAll: boolean;
  toggleBtn: boolean;  // Hier hinzugefügt
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setDepth: (depth: number) => void;
  setPrice: (price: any) => void;
  setRoomSize: (roomSize: object) => void;
  setIsClickRoom: (gaps: boolean) => void;
  setIsClickedApplyAll: (isClickedApplyAll: boolean) => void;
  setPriceData: (priceData: object[]) => void;
  setToggleBtn: (value: boolean) => void;  // Hier hinzugefügt
}

export const useConfiguratorStore = create<ConfiguratorSlice>((set: any) => ({
  width: 1,
  height: 220,
  depth: 50,
  price: {},
  roomSize: {
    width: 600,
    height: 285,
    length: 600
  },
  isClickRoom: false,
  isClickedApplyAll: false,
  priceData: {
    name: "",
    Frame: {
      Count: 0,
      Material: ""
    },
    Door: {
      Count: 0,
      Material: ""
    },
    Drawer: {
      Count: 0,
      Material: ""
    }
  },
  toggleBtn: false,
  setToggleBtn: (value: boolean) => set({ toggleBtn: value }),
  setWidth: (width: number) => set({ width }),
  setHeight: (height: number) => set({ height }),
  setDepth: (depth: number) => set({ depth }),
  setPrice: (price: any) => set({ price }),
  setRoomSize: (roomSize: object) => set({ roomSize }),
  setIsClickRoom: (isClickRoom: boolean) => set({ isClickRoom }),
  setPriceData: (priceData: object[]) => set({ priceData }),
  setIsClickedApplyAll: (isClickedApplyAll: boolean) => set({ isClickedApplyAll }),
}));
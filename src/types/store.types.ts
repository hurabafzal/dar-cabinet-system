// Types for the main state stores
export interface ConfiguratorStoreState {
  width: number;
  height: number;
  depth: number;
  roomSize: {
    width: number;
    height: number;
    length: number;
  } | null;
  price: number;
  isClickRoom: boolean;
  priceData: any;
  isClickedApplyAll: boolean;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setDepth: (depth: number) => void;
  setRoomSize: (size: any) => void;
  setPrice: (price: number) => void;
  setIsClickRoom: (isClick: boolean) => void;
  setPriceData: (data: any) => void;
  setIsClickedApplyAll: (isClicked: boolean) => void;
}

export interface ModelStoreState {
  droppedModel: any[];
  seletedModel: any | null;
  clickOutline: boolean[];
  isDoubleClickedModel: boolean;
  clickedModel: any | null;
  clickedComponent: any | null;
  showCuboidCollider: boolean;
  setDroppedModel: (models: any[]) => void;
  setSeletedModel: (model: any) => void;
  setClickOutline: (outlines: boolean[]) => void;
  setIsDoubleClickedModel: (isDouble: boolean) => void;
  setClickedModel: (model: any) => void;
  setClickedComponent: (component: any) => void;
  setShowCuboidCollider: (show: boolean) => void;
}

export interface IndexStoreState {
  isCreated: boolean;
  isOrbitState: boolean;
  isLoading: boolean;
  selectedLan: string;
  CABINET_ITEMS: any[];
  MATERIAL_ITEMS: any[];
  placedModels: any[];
  currentIndex: number;
  setIsCreated: (created: boolean) => void;
  setIsOrbitState: (orbit: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setSelectedLan: (lan: string) => void;
  setCABINET_ITEMS: (items: any[]) => void;
  setMATERIAL_ITEMS: (items: any[]) => void;
  setPlacedModels: (models: any[]) => void;
  setCurrentIndex: (index: number) => void;
}

export interface BottomBarStoreState {
  selectedMesh: any | null;
  isSelectedMaterial: boolean;
  materialKind: string;
  isclickedMaterialCategory: string;
  setSelectedMesh: (mesh: any) => void;
  setIsSelectedMaterial: (selected: boolean) => void;
  setMaterialKind: (kind: string) => void;
  setIsclickedMaterialCategory: (category: string) => void;
}

export interface TopBarStoreState {
  isDeleted: boolean;
  setIsDeleted: (deleted: boolean) => void;
}

export interface OrderStoreState {
  setOrderData: (data: any) => void;
}

// Types for material prices and differences
export interface MaterialPrices {
  [key: string]: number;
}

export interface PriceDifferences {
  [key: string]: number;
}
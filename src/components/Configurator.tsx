import { Form } from "react-bootstrap";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdOutlineClose,
  MdNavigateBefore,
  MdNavigateNext
} from "react-icons/md";
import { URLs } from "../const/urls";

import { useBottomBarStore } from "../store/bottomBarSlice";
import { useConfiguratorStore } from "../store/configuratorSlice";
import { useTopBarStore } from "../store/topBarSlice";
import { useIndexStore } from "../store/indexSlice";
import { useModelStore } from "../store/modelSlice";
import { getToken, getUserData } from "../helpers/jwtHelper";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getBaseModelPrice, getPrice, delPrice } from "../api/priceApi";
import { getPaymentDetail } from "../api/measurementApi";
import { COUNTBYCATEGORY } from "../config/cabinetConfig";
import { letters } from "../config/letters";
import { ToastContainer, toast } from 'react-toastify';

import type { FC, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { setStorageItem, removeStorageItem } from '../utils/storageUtils';
import MaterialInfoModal from './MaterialInfoModal';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import axios, { AxiosError } from "axios";
import "./Configurator.css";
import { useScreenshotStore } from "../store/screenshotStore";
import { useAutoSave } from '../hooks/useAutoSave';
import { useInitialLoad } from '../hooks/useInitialLoad';
import { useDraftStore } from '../store/draftStore';
import { useHistoryStore } from '../store/historyStore';
import { GET_USER, GET_MEASUREMENTS } from '../apiURL/endpoints';

import { 
  ConfiguratorStoreState,
  ModelStoreState,
  IndexStoreState,
  BottomBarStoreState,
  TopBarStoreState,
  OrderStoreState,
  MaterialPrices,
  PriceDifferences
} from '../types/store.types';

export const Configurator: FC = () => {
  const navigate = useNavigate();
  const { canUndo, canRedo, undo, redo, pushToHistory, debouncedPushToHistory } = useHistoryStore(state => ({
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    undo: state.undo,
    redo: state.redo,
    pushToHistory: state.pushToHistory,
    debouncedPushToHistory: state.debouncedPushToHistory
  }));
  const setIsClickedApplyAll = useConfiguratorStore((select: any) => select.setIsClickedApplyAll);
  const width = useConfiguratorStore((select: any) => select.width);
  const setWidth = useConfiguratorStore((select: any) => select.setWidth);
  const height = useConfiguratorStore((select: any) => select.height);
  const setHeight = useConfiguratorStore((select: any) => select.setHeight);
  const depth = useConfiguratorStore((select: any) => select.depth);
  const setDepth = useConfiguratorStore((select: any) => select.setDepth);
  const roomSize: any = useConfiguratorStore((select: any) => select.roomSize);
  const setRoomSize = useConfiguratorStore((select: any) => select.setRoomSize);
  const setPrice = useConfiguratorStore((select: any) => select.setPrice);
  const price = useConfiguratorStore((select: any) => select.price);
  const droppedModel = useModelStore((select: any) => select.droppedModel);
  const seletedModel = useModelStore((select: any) => select.seletedModel);
  const isClickRoom = useConfiguratorStore((select: any) => select.isClickRoom);
  const setIsClickRoom = useConfiguratorStore((select: any) => select.setIsClickRoom);
  const priceData: any = useConfiguratorStore((select: any) => select.priceData);
  const isDeleted: any = useTopBarStore((select: any) => select.isDeleted);
  const isCreated: any = useIndexStore((select: any) => select.isCreated);
  const setIsCreated: any = useIndexStore((select: any) => select.setIsCreated);
  const selectedLan: string = useIndexStore((select: any) => select.selectedLan);
  const CABINET_ITEMS = useIndexStore((select: any) => select.CABINET_ITEMS);
  const selectedMesh: any = useBottomBarStore((select: any) => select.selectedMesh);
  const setIsDeleted = useTopBarStore((select: any) => select.setIsDeleted);
  const setIsSelectedMaterial = useBottomBarStore((select: any) => select.setIsSelectedMaterial);
  const setMaterialKind = useBottomBarStore((select: any) => select.setMaterialKind);
  const materialKind = useBottomBarStore((select: any) => select.materialKind);
  const setIsDoubleClickedModel = useModelStore((select: any) => select.setIsDoubleClickedModel);
  const isDoubleClickedModel = useModelStore((select: any) => select.isDoubleClickedModel);
  const setSelectedMaterial = useBottomBarStore((select: any) => select.setSelectedMaterial);
  const isclickedMaterialCategory = useBottomBarStore((select: any) => select.isclickedMaterialCategory);
  const isSelectedMaterial = useBottomBarStore((select: any) => select.isSelectedMaterial);
  const setClickedComponent = useModelStore((select: any) => select.setClickedComponent);
  const setSelectedMesh = useBottomBarStore((select: any) => select.setSelectedMesh);
  const setIsclickedMaterialCategory = useBottomBarStore((select: any) => select.setIsclickedMaterialCategory);
  const setIsLoading = useIndexStore((select: any) => select.setIsLoading);
  const setPlacedModels = useIndexStore((select: any) => select.setPlacedModels);
  const placedModels = useIndexStore((select: any) => select.placedModels);
  const MATERIAL_ITEMS = useIndexStore((select: any) => select.MATERIAL_ITEMS);
  const currentIndex = useIndexStore((select: any) => select.currentIndex);
  const setCurrentIndex = useIndexStore((select: any) => select.setCurrentIndex);
  const [computedPrice, setComputedPrice] = useState<any>({});
  const [isActive, setIsActive] = useState(false);
  const [isActive1, setIsActive1] = useState(false);
  const [flagTexture, setFlagTexture] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [iconsVisible, setIconsVisible] = useState(false);
  const sizeButtonRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLDivElement>(null);
  const sizePanelRef = useRef<HTMLDivElement>(null);
  const colorPanelRef = useRef<HTMLDivElement>(null);
  const setToggleBtn = useConfiguratorStore((select) => select.setToggleBtn);
  const setOrderData = useOrderStore((state: any) => state.setOrderData);
  const [prevPrice, setPrevPrice] = useState(0);
  const prevPriceRef = useRef(0);
  const [animatedPrice, setAnimatedPrice] = useState(0);
  const { isAutoSaving } = useAutoSave(computedPrice);
  const { t, isRTL } = useTranslation();
  
  // Set up price update callback for history store
  useEffect(() => {
    (window as any).__COMPUTED_PRICE__ = computedPrice;
    (window as any).__PRICE_UPDATE_CALLBACK__ = (price: any) => {
      if (price && Object.keys(price).length > 0) {
        setComputedPrice(price);
      } else {
        // If price not in snapshot, recalculate it
        resetAndRecalculatePrice();
      }
    };
    return () => {
      delete (window as any).__COMPUTED_PRICE__;
      delete (window as any).__PRICE_UPDATE_CALLBACK__;
    };
  }, [computedPrice]);

  // Add keyboard shortcut handlin
  const handleKeyPress = useCallback((e: globalThis.KeyboardEvent) => {
    // Check if the user is pressing Ctrl (Windows) or Command (Mac)
    const ctrlOrCmd = e.ctrlKey || e.metaKey;
    
    if (ctrlOrCmd && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.stopPropagation();
      
      // Read canUndo/canRedo directly from store to get latest value
      const historyState = useHistoryStore.getState();
      const currentCanUndo = historyState.canUndo;
      const currentCanRedo = historyState.canRedo;
      
      if (e.shiftKey) {
        // Ctrl/Cmd + Shift + Z = Redo
        if (currentCanRedo) {
          historyState.redo();
          toast.info('Redo successful');
        }
      } else {
        // Ctrl/Cmd + Z = Undo
        if (currentCanUndo) {
          historyState.undo();
          toast.info('Undo successful');
        }
      }
    } else if (ctrlOrCmd && e.key.toLowerCase() === 'y') {
      // Ctrl/Cmd + Y = Redo (alternative)
      const historyState = useHistoryStore.getState();
      const currentCanRedo = historyState.canRedo;
      e.preventDefault();
      e.stopPropagation();
      if (currentCanRedo) {
        historyState.redo();
        toast.info('Redo successful');
      }
    }
  }, []);

  // Set up keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress, true);
    return () => document.removeEventListener('keydown', handleKeyPress, true);
  }, [handleKeyPress]);
  const { isLoading } = useInitialLoad(setComputedPrice);
  
  // Create initial history snapshot when component mounts and has data
  useEffect(() => {
    if (droppedModel.length > 0 && placedModels.length > 0 && !isLoading) {
      // Wait a bit for everything to initialize
      const timer = setTimeout(() => {
        const historyState = useHistoryStore.getState();
        
        // Only create initial snapshot if history is empty
        if (historyState.history.length === 0) {
          const indexState = useIndexStore.getState();
          const modelState = useModelStore.getState();
          const configState = useConfiguratorStore.getState();
          
          const globalPositions = (window as any).GLOBAL_OBJECT_POSITIONS || {};
          const cabinetPositions = Object.entries(globalPositions).map(([uuid, pos]: [string, any]) => ({
            uuid,
            position: [pos.x, pos.y, pos.z] as [number, number, number]
          }));
          
          const initialState = {
            placedModels: JSON.parse(JSON.stringify(indexState.placedModels || [])),
            droppedModel: JSON.parse(JSON.stringify(modelState.droppedModel || [])),
            width: configState.width,
            height: configState.height,
            depth: configState.depth,
            roomSize: JSON.parse(JSON.stringify(configState.roomSize)),
            computedPrice: JSON.parse(JSON.stringify(computedPrice)),
            cabinetPositions: JSON.parse(JSON.stringify(cabinetPositions)),
            timestamp: Date.now()
          };
          
          pushToHistory(initialState);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [droppedModel.length, placedModels.length, isLoading, pushToHistory, computedPrice]);
  
  const [materialPrices, setMaterialPrices] = useState<{ [key: string]: number }>({});
  const [showCategoryButtons, setShowCategoryButtons] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showMaterialInfoModal, setShowMaterialInfoModal] = useState(false);
  const [selectedMaterialInfo, setSelectedMaterialInfo] = useState<any>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [shouldUpdatePrice, setShouldUpdatePrice] = useState(false);
  const [priceDifferences, setPriceDifferences] = useState<{ [key: string]: number }>({});
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);

  const [stepProgress, setStepProgress] = useState({
    Frame: false,
    Shelf: false,
    Drawer: false,
  });

  const categoryHasMaterials = (categoryName: string) => {
    if (!seletedModel || !selectedMesh) return false;
    const model = placedModels.find((m: any) => m.uuid === seletedModel.uuid);
    if (!model || !model.materials || !model.materials[selectedMesh]) return false;
    const materialCategory = model.materials[selectedMesh].category;
    const categoryMapping: { [key: string]: string } = {
      "Base": "DAR BASE", "Lux": "DAR LUX", "Plus": "DAR PLUS"
    };
    return materialCategory === categoryMapping[categoryName];
  };

  const selectCategory = (category: string) => {
    if (activeCategory === category) return;
    setActiveCategory(category);
    setIsclickedMaterialCategory(category);
    const materialType = category === "Lux" ? "Cleaf" : category === "Plus" ? "Egger" : "Atlas";
    setMaterialKind(materialType);
  };

  const toggleAccordion = (category: string) => {
    setOpenAccordion(openAccordion === category ? "" : category);

    setIsclickedMaterialCategory(category);
    const materialType = category === "Lux" ? "Cleaf" :
      category === "Plus" ? "Egger" : "Atlas";
    setMaterialKind(materialType);
  };

  let images: any;
  selectedMesh === "Door" ? images = [URLs.BASECATEGORY, URLs.LUXCATEGORY, URLs.PLUSCATEGORY, URLs.OTHERCATEGORY] : images = [URLs.BASECATEGORY, URLs.LUXCATEGORY, URLs.PLUSCATEGORY]// Your image URLs

  useEffect(() => {
    const handleRetryPayment = () => {
      handlePayBtn(); // Payment nochmal versuchen
    };

    window.addEventListener('retryPayment', handleRetryPayment);
    return () => {
      window.removeEventListener('retryPayment', handleRetryPayment);
    };
  }, []);

  const getComponentPrice = async (cabinetId: any, cabinetUuid: any, component: any, materialType: any, count: any) => {
    try {
      const priceData = await getPrice({
        name: cabinetId,
        uuid: cabinetUuid,
        component: component,
        count: count,
        material: materialType
      });
      return priceData?.subPrice || 0;
    } catch (error) {
      console.error(`Error getting price for ${component}:`, error);
      return 0;
    }
  };

  const calculateCabinetPrice = async (cabinet: any) => {
    const model = placedModels.find((m: any) => m.uuid === cabinet.uuid);
    const cabinetItem = CABINET_ITEMS.find((item: any) => item.id === cabinet.id);

    if (!cabinetItem) {
      return { total: 0, components: { Frame: 0, Shelf: 0, Door: 0, Drawer: 0 } };
    }

    const components = ['Frame', 'Shelf', 'Door', 'Drawer'];
    const componentPrices: any = { Frame: 0, Shelf: 0, Door: 0, Drawer: 0 };
    let totalPrice = 0;

    for (const component of components) {
      // Backend liefert lowercase Keys
      const lowerComponent = component.toLowerCase();
      const count = Number(cabinetItem.childObjInfo?.[lowerComponent] || cabinetItem.childObjInfo?.[component] || 0);

      if (count > 0) {
        // Material aus dem Model auslesen
        let materialType = "Atlas"; // Default nur als Fallback

        if (model?.materials?.[component]) {
          const materialCategory = model.materials[component].category;
          materialType = materialCategory === "DAR LUX" ? "Cleaf" :
            materialCategory === "DAR PLUS" ? "Egger" : "Atlas";
        }

        const componentPrice = await getComponentPrice(
          cabinet.id,
          cabinet.uuid,
          component,
          materialType,
          count
        );

        componentPrices[component] = componentPrice;
        totalPrice += componentPrice;
      } else {
        componentPrices[component] = 0;
      }
    }

    return { total: totalPrice, components: componentPrices };
  };

  const fetchPriceUpdate = async (oldMaterialType: any, newMaterialType: any) => {
    // If clicking on the same material type, don't update price to prevent accumulation
    if (oldMaterialType === newMaterialType) {
      return;
    }

    setIsLoading(true);

    try {

      // ✅ SCHRITT 1: Alten Preis berechnen (nur wenn Material vorher gesetzt war)
      const oldComponentPrice = oldMaterialType && oldMaterialType !== "Atlas"
        ? await getComponentPrice(price.name, price.uuid, price.component, oldMaterialType, price.count)
        : 0;

      // ✅ SCHRITT 2: Neuen Preis berechnen
      const newComponentPrice = await getComponentPrice(
        price.name,
        price.uuid,
        price.component,
        newMaterialType,
        price.count
      );

      // ✅ SCHRITT 3: Differenz anwenden
      const priceDifference = newComponentPrice - oldComponentPrice;

      setComputedPrice((prev: any) => {
        const newTotal = (prev?.Total || 0) + priceDifference;
        const newComponentTotal = (prev?.[price.component] || 0) + priceDifference;

        return {
          ...prev,
          Total: newTotal,
          [price.component]: newComponentTotal
        };
      });

    } catch (error) {
      console.error("Error in fetchPriceUpdate:", error);
    }

    setIsLoading(false);
  };

  // Function to reset and recalculate the total price from scratch
  const resetAndRecalculatePrice = async () => {
    setIsLoading(true);

    try {
      // Reset the price state
      setComputedPrice({
        Total: 0,
        Frame: 0,
        Door: 0,
        Drawer: 0,
        Shelf: 0
      });

      // Recalculate price for all cabinets
      let newPrices = {
        Total: 0,
        Frame: 0,
        Door: 0,
        Drawer: 0,
        Shelf: 0
      };

      // Calculate price for each cabinet
      for (const cabinet of droppedModel) {
        const cabinetPriceData = await calculateCabinetPrice(cabinet);
        newPrices.Total += cabinetPriceData.total;
        newPrices.Frame += cabinetPriceData.components.Frame;
        newPrices.Drawer += cabinetPriceData.components.Drawer;
        newPrices.Shelf += cabinetPriceData.components.Shelf;
        newPrices.Door += cabinetPriceData.components.Door;
      }

      // Set the recalculated price
      setComputedPrice(newPrices);
    } catch (error) {
      console.error('Error in resetAndRecalculatePrice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriceDelete = async () => {
    setIsLoading(true);

    if (droppedModel.length === 0) {
      // Wenn keine Cabinets mehr da sind, alles auf 0 setzen
      setComputedPrice({
        Total: 0,
        Frame: 0,
        Drawer: 0,
        Shelf: 0,
        Door: 0,
      });
    } else {
      // ✅ KOMPLETT NEUBERECHNUNG aller verbleibenden Cabinets
      let newPrices: any = {
        Total: 0,
        Frame: 0,
        Drawer: 0,
        Shelf: 0,
        Door: 0
      };

      // Jeden verbleibenden Cabinet durchrechnen
      for (const cabinet of droppedModel) {
        const cabinetPriceData = await calculateCabinetPrice(cabinet);

        // Zum Gesamtpreis addieren
        newPrices.Total += cabinetPriceData.total;
        newPrices.Frame += cabinetPriceData.components.Frame;
        newPrices.Drawer += cabinetPriceData.components.Drawer;
        newPrices.Shelf += cabinetPriceData.components.Shelf;
        newPrices.Door += cabinetPriceData.components.Door;
      }

      setComputedPrice(newPrices);
    }

    setIsDeleted(false);
    setIsLoading(false);
  };

  const fetchPriceCreate = async () => {
    setIsLoading(true);

    try {
      await getBaseModelPrice(priceData);

      // Neues Cabinet ist das letzte in droppedModel
      const newCabinet = droppedModel[droppedModel.length - 1];
      const cabinetPriceData = await calculateCabinetPrice(newCabinet);

      setComputedPrice((prev: any) => ({
        ...prev,
        Total: (prev?.Total || 0) + cabinetPriceData.total,
        Frame: (prev?.Frame || 0) + cabinetPriceData.components.Frame,
        Drawer: (prev?.Drawer || 0) + cabinetPriceData.components.Drawer,
        Shelf: (prev?.Shelf || 0) + cabinetPriceData.components.Shelf,
        Door: (prev?.Door || 0) + cabinetPriceData.components.Door,
      }));
    } catch (error) {
      console.error("Error in fetchPriceCreate:", error);
    }

    setIsLoading(false);
  };

  /*useEffect(() => {
    if (droppedModel.length > 0 && activePanel !== 'color') {
      setActivePanel('color');

      // Frame automatisch vorauswählen
      if (!selectedMesh) {
        safelySelectComponent("Frame");
      }

      if (seletedModel) {
        const available = ['Frame', 'Shelf', 'Drawer', 'Door'].filter(component => {
          const count = Number(CABINET_ITEMS.find((ele: any) => ele.id === seletedModel?.id)?.childObjInfo?.[component] || 0);
          return count > 0;
        });
        setAvailableComponents(available);
      }

    }
  }, [droppedModel.length]);*/

  /*
  const fetchPriceDelete = async () => {
    setIsLoading(true);
    let predictedPrice: any = 0;
    if (seletedModel) {
      if (droppedModel.length === 0) {
        setComputedPrice({
          Total: 0,
          Frame: 0,
          Drawer: 0,
          Shelf: 0,
          Door: 0,
        });
        setIsDeleted(false);
        setIsLoading(false);
        return;
      } else {
        predictedPrice = await delPrice(seletedModel.uuid);
      }
      setComputedPrice((prev: any) => ({
        ...prev,
        Total: prev.Total - predictedPrice.model.price,
        Frame: prev.Frame - predictedPrice.model.frame.Price,
        Drawer: prev.Drawer - predictedPrice.model.drawer.Price,
        Shelf: prev.Shelf - predictedPrice.model.shelf.Price,
        Door: prev.Door - predictedPrice.model.door.Price,
      }));
      setIsDeleted(false);
      setIsLoading(false);
    }
  };
  */

  const triggerTourEvent = (eventName: string) => {
    const event = new CustomEvent(eventName);
    window.dispatchEvent(event);
  };

  const fetchPaymentDetail = async (paymentPayload: any) => {
    setIsLoading(true);
    try {
      const getPayDetail = await getPaymentDetail(paymentPayload);
      setIsLoading(false);
      return getPayDetail;
    } catch (error: any) {
      setIsLoading(false);
      console.error('Payment Detail Error:', error);
      if (error.response) {
        // Der Server hat eine Antwort mit einem Statuscode außerhalb des Bereichs 2xx zurückgegeben
        console.error('Server Error Response:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      }
      // Rückgabe eines leeren Objekts, um weitere Verarbeitung zu ermöglichen
      return {};
    }
  };

  function objectToFormData(obj: any) {
    const formData = new FormData();
    for (const key in obj) {
      if (Array.isArray(obj[key])) { // Handle arrays separately
        obj[key].forEach((item: any, index: any) => {
          for (const subKey in item) {
            formData.append(`${key}[${index}][${subKey}]`, item[subKey]);
          }
        });
      } else {
        formData.append(key, obj[key]);
      }
    }
    return formData;
  }

  const handlePayBtn = async () => {
    const jwtToken = await getToken();
    if (!jwtToken) {
      const event = new CustomEvent('paymentAuthRequired');
      window.dispatchEvent(event);
      return;
    }

    if (droppedModel.length === 0) {
      toast.error(
        <div className="error-message">
          <strong>{t('no_cabinets', 'No Cabinets')}</strong>
          <p>{t('please_add_cabinet', 'Please add at least one cabinet before proceeding.')}</p>
        </div>,
        {
          position: "top-center",
          autoClose: 5000,
        }
      );
      return;
    }

    // Debug-Logging vor der Prüfung
    interface MissingMaterialModel {
      id: string;
      uuid: string;
      name: string;
      missingComponents: string[];
      requiredComponents: string[];
      hasComponents: Record<string, boolean>;
    }

    const modelsWithMissingMaterials: MissingMaterialModel[] = [];

    const hasMaterial = (model: any, component: string) => {
      const hasMaterialObject = model.materials && model.materials[component];
      const hasComponentFlag = model.components && model.components[component] === 1;
      const result = hasMaterialObject || hasComponentFlag;

      return result;
    };

    placedModels.forEach((model: any, index: number) => {
      const cabinetItem = CABINET_ITEMS.find((item: any) => item.id === model.id);

      if (!cabinetItem) {
        return;
      }
      const requiredComponents = ["Frame", "Shelf", "Door", "Drawer"].filter(
        component => {
          // Backend liefert lowercase Keys
          const lowerComponent = component.toLowerCase();
          const isRequired = (cabinetItem.childObjInfo[lowerComponent] || cabinetItem.childObjInfo[component] || 0) > 0;
          return isRequired;
        }
      );

      const missingComponents = requiredComponents.filter(component => !hasMaterial(model, component));

      const hasComponents: Record<string, boolean> = {};
      for (const component of ["Frame", "Shelf", "Door", "Drawer"]) {
        hasComponents[component] = hasMaterial(model, component);
      }

      if (missingComponents.length > 0) {
        const modelName = cabinetItem.name || `Cabinet ${model.id}`;

        modelsWithMissingMaterials.push({
          id: model.id,
          uuid: model.uuid,
          name: modelName,
          missingComponents: missingComponents,
          requiredComponents: requiredComponents,
          hasComponents: hasComponents
        });
      }
    });

    const getUserIP = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        console.error('Error fetching IP address:', error);
        return null;
      }
    };

    const getCurrentDateTimeWithZone = () => {
      const now = new Date();

      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dateString = `${day}/${month}/${year}`;

      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes} ${ampm}`;

      const timezoneOffset = now.getTimezoneOffset();
      const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
      const timezoneHours = String(Math.abs(Math.floor(timezoneOffset / 60))).padStart(2, '0');
      const timezoneMinutes = String(Math.abs(timezoneOffset % 60)).padStart(2, '0');
      const timezoneString = `GMT${timezoneSign}${timezoneHours}:${timezoneMinutes}`;

      return {
        dateString,
        timeString,
        timezone: timezoneString,
        fullDateTime: `${dateString} ${timeString} ${timezoneString}`
      };
    };

    const userIP = await getUserIP();
    const dateTimeInfo = getCurrentDateTimeWithZone();

    const userid = new URLSearchParams(new URL(location.href).search).get('userid');

    const selectedMaterialCategory = isclickedMaterialCategory === "Lux"
      ? "DAR LUX"
      : isclickedMaterialCategory === "Plus"
        ? "DAR PLUS"
        : "DAR BASE";

    const materialDetail = MATERIAL_ITEMS.find((m: any) => m.name === selectedMaterialCategory);

    const userTocken = await getUserData();
    let userData = userTocken?.decoded;
    const userId = userData?.sub;

    let userPhone = 'Not available';
    if (userId) {
      try {
        const userResponse = await axios.get(GET_USER(userId));
        userPhone = userResponse.data.phone || 'Not available';
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }

    const orderItems = await Promise.all(droppedModel.map(async (item: any) => {
      const components: any = {};

      const model = placedModels.find((m: any) => m.uuid === item.uuid);

      for (const componentName of ["Frame", "Shelf", "Door", "Drawer"]) {
        const hasMaterial = model && model.materials && model.materials[componentName];

        if (hasMaterial) {
          const material = model.materials[componentName];
          const materialCategory = material.category;
          const materialDetail = MATERIAL_ITEMS.find((m: any) => m.name === materialCategory);

          let materialType = "Atlas";
          if (materialCategory === "DAR LUX") materialType = "Cleaf";
          else if (materialCategory === "DAR PLUS") materialType = "Egger";

          const cabinetItem = CABINET_ITEMS.find((ele: any) => ele.id === item.id);
          const count = Number(cabinetItem?.childObjInfo?.[componentName]) || 0;

          let componentPrice = 0;

          if (count > 0) {
            try {
              const priceData = await getPrice({
                name: item.id,
                uuid: item.uuid,
                component: componentName,
                count: count,
                material: materialType
              });
              componentPrice = priceData?.subPrice || 0;
            } catch (error) {
              console.error(`Error getting price for ${componentName}:`, error);
            }
          }

          components[componentName] = {
            materialId: materialDetail?._id || null,
            materialCategory: material.category,
            materialName: materialDetail?.name || null,
            textureName: material.name,
            textureUrl: material.url,
            selectedMeshType: componentName === selectedMesh ? componentName : null,
            price: componentPrice,
            materialType: materialType
          };
        } else {
          components[componentName] = {
            materialId: null,
            materialCategory: null,
            materialName: null,
            textureName: null,
            textureUrl: null,
            selectedMeshType: null,
            price: 0,
            materialType: null
          };
        }
      }

      const totalItemPrice = Object.values(components).reduce((sum: number, comp: any) => sum + (comp.price || 0), 0);

      return {
        ...item,
        components: components,
        totalPrice: totalItemPrice
      };
    }));

    const paymentPayload = {
      name: 'Measurement',
      measurment: `${width * 60}*${height}*${depth}`,
      measurementDate: new Date().toISOString(),
      comments: `This is a design data with ${droppedModel.length} cabinet(s)`,
      type: 'Design',
      lineItems: orderItems.map((item: any) => ({
        id: item.uuid,
        description: item.id,
        totalPrice: item.totalPrice,
        components: item.components
      })),
      customerId: userId
    };

    const response = await fetch(GET_MEASUREMENTS, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentPayload)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const responsePayData = await response.json();

    // ✅ Capture screenshots for order data
    const captureFunction = useScreenshotStore.getState().captureScreenshots;
    let screenshots = {};

    if (captureFunction) {
      screenshots = await captureFunction();
    }

    // ✅ Order creation is deferred to Terms page to avoid 500 errors
    // The invoice number will be generated when Terms page loads
    // For now, use measurement ID temporarily
    const invoiceNumber = responsePayData._id;
    
    const orderData = {
      orderInfo: {
        orderId: invoiceNumber, // ✅ Use invoice number instead of measurement ID
        orderDate: dateTimeInfo.dateString,
        orderTime: dateTimeInfo.timeString + " " + dateTimeInfo.timezone,
        orderStatus: "Pending"
      },

      customerInfo: {
        fullName: (userData as any)?.fullName || (userData as any)?.name || (userData as any)?.sub || "Not available",
        phoneNumber: userPhone,
        email: (userData as any)?.email || (userData as any)?.mail || "Not available",
      },

      designDetails: {
        designId: responsePayData?._id || "pending",
        cabinetCount: droppedModel.length,
        materials: {
          category: selectedMaterialCategory,
          selectedComponent: selectedMesh,
          materialDetails: materialDetail ? {
            id: materialDetail._id,
            name: materialDetail.name,
            textures: materialDetail.textures?.map((t: any) => ({
              name: t.name,
              url: t.textureSrc
            })).slice(0, 3) || []
          } : null
        },
        sizeDetails: {
          width: width * 60,
          height: height,
          depth: depth
        }
      },

      securityInfo: {
        userIP: userIP,
      },

      fullModelData: orderItems,
      apiResponse: responsePayData
    };

    const updatedOrderData = {
      ...orderData,
      designScreenshots: screenshots,
      computedPrice: computedPrice
    };
    setOrderData(updatedOrderData);

    // ✅ Also save order data for Terms page using our cross-platform storage utility
    try {
      // First try to save the full order data including screenshots
      setStorageItem('fullOrderData', updatedOrderData, true);
    } catch (error) {
      console.error('Failed to save fullOrderData with screenshots to storage:', error);

      try {
        // If that fails, remove screenshots and try again
        const orderDataWithoutScreenshots = {
          ...updatedOrderData,
          designScreenshots: {}
        };

        setStorageItem('fullOrderData', orderDataWithoutScreenshots, true);

        // Store a flag to indicate screenshots were omitted
        setStorageItem('screenshotsOmitted', true, true);

      } catch (secondError) {
        // If that also fails, try with minimal data
        console.error('Failed to save even without screenshots:', secondError);

        try {
          // Create a minimal version with just essential order info
          const minimalOrderData = {
            orderInfo: updatedOrderData.orderInfo,
            customerInfo: updatedOrderData.customerInfo,
            designDetails: {
              designId: updatedOrderData.designDetails.designId,
              cabinetCount: updatedOrderData.designDetails.cabinetCount,
              sizeDetails: updatedOrderData.designDetails.sizeDetails
            },
            computedPrice: updatedOrderData.computedPrice
          };

          setStorageItem('fullOrderData', minimalOrderData, true);
          setStorageItem('minimalDataOnly', true, true);
        } catch (finalError) {
          console.error('All attempts to save order data failed:', finalError);
        }
      }
    }

    if (responsePayData && responsePayData._id) {
      navigate(`/terms?designId=${responsePayData._id}`);
    }

    return orderData;
  };

  const loadMaterialPrices = async (category: string) => {
    if (!price.uuid || !price.component) return;

    const materialType = category === "DAR LUX" ? "Cleaf" :
      category === "DAR PLUS" ? "Egger" : "Atlas";

    const materialItems = MATERIAL_ITEMS.find((item: any) => item.name === category);
    if (!materialItems) return;

    const prices: { [key: string]: number } = {};

    for (const texture of materialItems.textures) {
      try {
        const priceData = await getPrice({
          ...price,
          material: materialType
        });
        prices[texture.textureSrc] = priceData.subPrice || 0;
      } catch (error) {
        prices[texture.textureSrc] = 0;
      }
    }

    setMaterialPrices(prices);
  };

  const getPriceDifference = (textureUrl: string) => {
    const currentPrice = materialPrices[useBottomBarStore.getState().selectedMaterial] || 0;
    const newPrice = materialPrices[textureUrl] || 0;
    return newPrice - currentPrice;
  };

  // Helper function to safely handle component selection, with fallback to other components if needed
  const safelySelectComponent = (preferredComponent: string = "Frame") => {
    // Check if a model is selected first
    if (!seletedModel) {
      return false;
    }

    // Try to get the cabinet item data for this model
    const cabinetItem = CABINET_ITEMS.find((ele: any) => ele.id == seletedModel?.id);

    // If no cabinet item was found, can't proceed
    if (!cabinetItem || !cabinetItem.childObjInfo) {
      return false;
    }

    // Check if the model already has components set and use that information
    const modelInPlacedModels = placedModels.find((m: any) => m.uuid === seletedModel.uuid);
    if (modelInPlacedModels?.components) {
      // Check for components in the placed model that actually exist
      for (const comp of [preferredComponent, 'Frame', 'Shelf', 'Drawer', 'Door']) {
        if (modelInPlacedModels.components[comp]) {
          handleComponent(comp);
          return true;
        }
      }
    }

    // Check if the preferred component exists in cabinet data
    const lowerPreferred = preferredComponent.toLowerCase();
    const preferredCount = Number(
      cabinetItem.childObjInfo?.[lowerPreferred] ||
      cabinetItem.childObjInfo?.[preferredComponent] ||
      0
    );

    // If preferred component exists, select it
    if (preferredCount > 0) {
      handleComponent(preferredComponent);
      return true;
    }

    // If preferred component doesn't exist, try alternatives
    const components = ['Frame', 'Shelf', 'Drawer', 'Door'].filter(c => c !== preferredComponent);

    for (const comp of components) {
      const lowerComp = comp.toLowerCase();
      const count = Number(
        cabinetItem.childObjInfo?.[lowerComp] ||
        cabinetItem.childObjInfo?.[comp] ||
        0
      );

      if (count > 0) {
        handleComponent(comp);
        return true;
      }
    }


    // If no component was found, don't set any component
    // Silently handle the case without showing error to the user
    return false;
  };

  const handleComponent = (component: string) => {
    // Check if a model is selected first
    if (!seletedModel) {
      return;
    }

    let temp: string = component;
    const cabinetItem = CABINET_ITEMS.find((ele: any) => ele.id == seletedModel?.id);

    // If no cabinet item was found, can't proceed
    if (!cabinetItem) {
      return;
    }

    const lowerComponent = component.toLowerCase();
    const count = Number(cabinetItem?.childObjInfo?.[lowerComponent] || cabinetItem?.childObjInfo?.[component] || 0);

    if (!count) {
      // Don't show error alert, just silently return
      return;
    }

    setClickedComponent(temp);
    setSelectedMesh(temp);
    setPrice({ name: seletedModel.id, uuid: seletedModel.uuid, component: temp, count: count });
    setSelectedMaterial("");

    // Zurück zur Kategorie-Ansicht bei Komponenten-Wechsel
    setShowCategoryButtons(true);
    setSelectedCategory(null);
  };

  const handleCategorySelection = (category: string) => {
    setIsTransitioning(true);
    setSelectedCategory(category);

    setIsclickedMaterialCategory(category);

    const materialType = category === "Lux" ? "Cleaf" :
      category === "Plus" ? "Egger" : "Atlas";
    setMaterialKind(materialType);

    setTimeout(() => {
      setShowCategoryButtons(false);
      setIsTransitioning(false);
    }, 300);
  };

  const unlockNextComponent = () => {
    const componentOrder = ['Frame', 'Shelf', 'Drawer', 'Door'];
    const currentIndex = componentOrder.indexOf(selectedMesh);

    if (currentIndex < componentOrder.length - 1) {
      // Nächste verfügbare Komponente finden
      for (let i = currentIndex + 1; i < componentOrder.length; i++) {
        const nextComponent = componentOrder[i];
        const cabinetItem = CABINET_ITEMS.find((ele: any) => ele.id == seletedModel?.id);
        const lowerComponent = nextComponent.toLowerCase();
        const count = Number(cabinetItem?.childObjInfo?.[lowerComponent] || cabinetItem?.childObjInfo?.[nextComponent] || 0);

        if (count > 0) {
          setTimeout(() => {
            handleComponent(nextComponent);
          }, 500);
          return;
        }
      }
    } else {
      // Letztes Element erreicht - Panel schließen
      setTimeout(() => {
        setActivePanel(null);
      }, 1000);
    }
  };

  // Erweiterte Material-Auswahl Funktion
  // Apply texture to a single item
  const handleMaterialSelection = (texture: any, materialType: string, category: string, targetUuid?: string) => {
    // Get the currently selected model
    const selectedModel = placedModels.find((m: any) => m.uuid === (targetUuid || price.uuid));
    if (!selectedModel) {
      console.error('No selected model found');
      return;
    }

    // Extract current material information
    let oldMaterialType = "Atlas"; // Default
    let currentTextureUrl = "";

    if (selectedModel?.materials?.[price.component]) {
      const oldCategory = selectedModel.materials[price.component].category;
      oldMaterialType = oldCategory === "DAR LUX" ? "Cleaf" :
        oldCategory === "DAR PLUS" ? "Egger" : "Atlas";
      currentTextureUrl = selectedModel.materials[price.component].url;
    }

    // Check if trying to apply the exact same texture
    if (currentTextureUrl === texture.textureSrc) {
      return;
    }

    // Update UI
    setSelectedMaterial(texture.textureSrc);

    // Update models
    const updatedModels = placedModels.map((item: any) => {
      if (item.uuid === (targetUuid || price.uuid)) {
        // Create materials object if it doesn't exist
        if (!item.materials) item.materials = {};

        // Set the new material
        const categoryStr = category === "Base" ? "DAR BASE" :
          category === "Lux" ? "DAR LUX" : "DAR PLUS";

        item.materials[price.component] = {
          name: texture.name || `${materialKind || 'Default'} Material`,
          url: texture.textureSrc,
          category: categoryStr
        };

        // Ensure components entry exists
        if (!item.components) item.components = {};
        item.components[price.component] = 1;
      }
      return item;
    });

    const newModels = [...updatedModels];
    setPlacedModels(newModels);
    
    // Push to history IMMEDIATELY when material is applied (before price recalculation)
    // This ensures undo is available right away
    const indexState = useIndexStore.getState();
    const modelState = useModelStore.getState();
    const configState = useConfiguratorStore.getState();
    
    // Get current cabinet positions
    const globalPositions = (window as any).GLOBAL_OBJECT_POSITIONS || {};
    const cabinetPositions = Object.entries(globalPositions).map(([uuid, pos]: [string, any]) => ({
      uuid,
      position: [pos.x, pos.y, pos.z] as [number, number, number]
    }));
    
    const stateSnapshot = {
      placedModels: JSON.parse(JSON.stringify(newModels)), // Use the updated models with new material
      droppedModel: JSON.parse(JSON.stringify(modelState.droppedModel || [])),
      width: configState.width,
      height: configState.height,
      depth: configState.depth,
      roomSize: JSON.parse(JSON.stringify(configState.roomSize)),
      computedPrice: JSON.parse(JSON.stringify(computedPrice)), // Use current price, will update after recalculation
      cabinetPositions: JSON.parse(JSON.stringify(cabinetPositions)),
      timestamp: Date.now()
    };
    
    pushToHistory(stateSnapshot);
    
    // First, update price using the standard mechanism if material type changed
    if (oldMaterialType !== materialType) {
      fetchPriceUpdate(oldMaterialType, materialType);
    }

    // Always perform a full price recalculation after applying any material
    // This ensures price accuracy regardless of material changes
    
    // Update the price in the latest history snapshot after recalculation
    setTimeout(async () => {
      await resetAndRecalculatePrice();
      // Get the latest computedPrice after recalculation
      const currentPrice = (window as any).__COMPUTED_PRICE__ || computedPrice;
      
      // Update the last history entry with the new price
      const historyState = useHistoryStore.getState();
      if (historyState.history.length > 0 && historyState.currentIndex >= 0) {
        const lastSnapshot = historyState.history[historyState.currentIndex];
        if (lastSnapshot) {
          // Update the price in the last snapshot
          const updatedSnapshot = {
            ...lastSnapshot,
            computedPrice: JSON.parse(JSON.stringify(currentPrice))
          };
          
          // Replace the last entry in history
          const updatedHistory = [...historyState.history];
          updatedHistory[historyState.currentIndex] = updatedSnapshot;
          
          useHistoryStore.setState({
            history: updatedHistory
          });
          
        }
      }
    }, 600); // Delay to allow price recalculation

    // Step Progress aktualisieren
    setStepProgress((prev) => ({ ...prev, [price.component as keyof typeof prev]: true }));

    // Nächste Komponente automatisch freischalten
    unlockNextComponent();

    triggerTourEvent('tour:materialSelected');
  };

  // Prüft ob eine Komponente verfügbar ist (nicht nur gesperrt)
  const isComponentAvailable = (component: string) => {
    if (!seletedModel) return false;
    const count = Number(CABINET_ITEMS.find((ele: any) => ele.id == seletedModel?.id)?.childObjInfo?.[component]);
    return count > 0;
  };

  const hasDrawer = () => {
    return (
      Number(
        CABINET_ITEMS.find((ele: any) => ele.id == seletedModel?.id)?.childObjInfo?.Drawer
      ) > 0
    );
  };

  const isTabLocked = (tab: string) => {
    if (tab === 'Shelf') return !stepProgress.Frame;
    if (tab === 'Drawer') return !stepProgress.Shelf;
    if (tab === 'Door') {
      return hasDrawer() ? !stepProgress.Drawer : !stepProgress.Shelf;
    }
    return false;
  };

  const handleNavigation = (direction: number) => {
    const newIndex = (currentIndex + direction + images.length) % images.length;
    setCurrentIndex(newIndex);

    const categories = ['Base', 'Lux', 'Plus', 'Other'];
    setIsclickedMaterialCategory(categories[newIndex]);
  };

  const applyToAllBtnClick = async () => {
    setIsClickedApplyAll(true);

    // Aktuelles Material speichern
    const currentMaterial = {
      url: useBottomBarStore.getState().selectedMaterial,
      category: isclickedMaterialCategory === "Lux" ? "DAR LUX" :
        isclickedMaterialCategory === "Plus" ? "DAR PLUS" : "DAR BASE",
      name: `${materialKind || 'Default'} Material`,
      materialType: isclickedMaterialCategory === "Lux" ? "Cleaf" :
        isclickedMaterialCategory === "Plus" ? "Egger" : "Atlas"
    };

    // Modelle aktualisieren
    const updatedModels = placedModels.map((item: any) => {
      // Nur Modelle aktualisieren, die die aktuelle Komponente haben
      if (item.components && item.components.hasOwnProperty(selectedMesh)) {
        // Materials-Objekt initialisieren falls es nicht existiert
        if (!item.materials) item.materials = {};

        // Nur das Material für die aktuelle Komponente aktualisieren
        item.materials[selectedMesh] = {
          name: currentMaterial.name,
          url: currentMaterial.url,
          category: currentMaterial.category
        };

        // Komponenten-Flag setzen
        item.components[selectedMesh] = 1;
      }
      return item;
    });

    setPlacedModels(updatedModels);
    
    // Push to history with updated models
    setTimeout(() => {
      const indexState = useIndexStore.getState();
      const modelState = useModelStore.getState();
      const configState = useConfiguratorStore.getState();
      const currentPrice = (window as any).__COMPUTED_PRICE__ || computedPrice;

      // Get current cabinet positions
      const globalPositions = (window as any).GLOBAL_OBJECT_POSITIONS || {};
      const cabinetPositions = Object.entries(globalPositions).map(([uuid, pos]: [string, any]) => ({
        uuid,
        position: [pos.x, pos.y, pos.z] as [number, number, number]
      }));

      const stateSnapshot = {
        placedModels: JSON.parse(JSON.stringify(indexState.placedModels || [])),
        droppedModel: JSON.parse(JSON.stringify(modelState.droppedModel || [])),
        width: configState.width,
        height: configState.height,
        depth: configState.depth,
        roomSize: JSON.parse(JSON.stringify(configState.roomSize)),
        computedPrice: JSON.parse(JSON.stringify(currentPrice)),
        cabinetPositions: JSON.parse(JSON.stringify(cabinetPositions)),
        timestamp: Date.now()
      };

      pushToHistory(stateSnapshot);
    }, 100);

    // Preise für alle aktualisierten Komponenten aktualisieren
    for (let i = 0; i < droppedModel.length; i++) {
      const cabinetItem = CABINET_ITEMS.find((ele: any) => ele.id == droppedModel[i].id);
      const lowerMesh = selectedMesh.toLowerCase();
      const count = Number(cabinetItem?.childObjInfo[lowerMesh] || cabinetItem?.childObjInfo[selectedMesh] || 0);
      if (count > 0) { // Nur verarbeiten, wenn dieses Modell die Komponente hat
        const payload = {
          name: droppedModel[i].id,
          uuid: droppedModel[i].uuid,
          component: selectedMesh,
          count: count,
          material: currentMaterial.materialType
        };
        const predictedPrice = await getPrice(payload);
        predictedPrice.component && setComputedPrice((prev: any) => ({
          ...prev,
          Total: prev?.Total + predictedPrice?.subPrice,
          [predictedPrice?.component]: prev[predictedPrice?.component] + predictedPrice?.subPrice
        }));
      }
    }
  }

  const prevDroppedModelCount = useRef(droppedModel.length);

  const togglePanel = (panelName: string) => {
    if (activePanel === panelName) {
      setActivePanel(null);
      setClickedComponent("");
      setSelectedMesh("");
    } else {
      setActivePanel(panelName);

      // Frame automatisch auswählen wenn Color-Panel geöffnet wird
      if (panelName === 'color') {
        // ✅ WICHTIG: Erst ein Modell auswählen, dann Component auswählen
        if (droppedModel.length > 0 && !seletedModel) {
          const setSeletedModel = useModelStore.getState().setSeletedModel;
          setSeletedModel(droppedModel[droppedModel.length - 1]);
        }

        // Only try to select a component if we don't have one selected yet
        if (!selectedMesh) {
          // Kleine Verzögerung, damit seletedModel gesetzt ist
          setTimeout(() => {
            try {
              // Use our safe helper function that handles all the error checking
              const componentFound = safelySelectComponent("Frame");

              // If no component was found, at least show the color panel without a component
              if (!componentFound) {
                // We can still show the color panel, even without a component selected
              }
            } catch (error) {
              console.error('Error selecting component:', error);
              // Don't let this error block the panel from opening
            }
          }, 100); // Increased timeout to ensure model is fully loaded
        }
      }

      // Tour Event für Size-Anpassung
      if (panelName === 'size') {
        triggerTourEvent('tour:sizeAdjusted');
      }
    }
  };

  const getPriceDifferenceForCategory = async (category: string) => {
    if (!price.uuid || !price.component) return 0;

    // Aktueller Preis
    const currentPrice = computedPrice[price.component] || 0;

    // Neuen Preis für diese Kategorie berechnen
    const materialType = category === "Lux" ? "Cleaf" :
      category === "Plus" ? "Egger" : "Atlas";

    const newPriceData = await getPrice({
      ...price,
      material: materialType
    });

    const newPrice = newPriceData?.subPrice || 0;
    return newPrice - currentPrice;
  };

  /*
  const loadPriceDifferences = async () => {
    if (!price.uuid || !price.component) return;

    //const currentPrice = (computedPrice[price.component] || 0);
    const currentPrice = (computedPrice[price.component] || 0) / droppedModel.length;
    const differences: { [key: string]: number } = {};

    // Für jede Kategorie Preisdifferenz berechnen
    for (const category of ["Base", "Lux", "Plus"]) {
      const materialType = category === "Lux" ? "Cleaf" :
        category === "Plus" ? "Egger" : "Atlas";

      const newPriceData = await getPrice({
        ...price,
        material: materialType
      });

      const newPrice = newPriceData?.subPrice || 0;
      differences[category] = newPrice - currentPrice;
    }

    setPriceDifferences(differences);
  };
  */

  const loadPriceDifferences = async () => {
    if (!price.uuid || !price.component) return;

    //console.log("🔍 === DEBUG loadPriceDifferences START ===");

    // ✅ Aktuell gewähltes Material für dieses Cabinet ermitteln
    const selectedModel = placedModels.find((model: any) => model.uuid === price.uuid);
    let currentMaterialType = "Atlas"; // Default

    if (selectedModel?.materials?.[price.component]) {
      const materialCategory = selectedModel.materials[price.component].category;
      currentMaterialType = materialCategory === "DAR LUX" ? "Cleaf" :
        materialCategory === "DAR PLUS" ? "Egger" : "Atlas";
    }

    //console.log("🎯 Current Material Type:", currentMaterialType);

    // ✅ RICHTIG: Aktuellen Preis für DAS EINE spezifische Cabinet holen
    const currentCabinetData = await getPrice({
      ...price,
      material: currentMaterialType
    });

    const currentPrice = currentCabinetData?.subPrice || 0;

    //console.log("💰 Current Price (for this specific cabinet):", currentPrice);

    const differences: { [key: string]: number } = {};

    for (const category of ["Base", "Lux", "Plus"]) {
      const materialType = category === "Lux" ? "Cleaf" :
        category === "Plus" ? "Egger" : "Atlas";

      const newPriceData = await getPrice({
        ...price,
        material: materialType
      });

      const newPrice = newPriceData?.subPrice || 0;
      differences[category] = newPrice - currentPrice;

      //console.log(`🧮 ${category}: ${newPrice} - ${currentPrice} = ${differences[category]}`);
    }

    setPriceDifferences(differences);
    //console.log("🔍 === DEBUG loadPriceDifferences END ===");
  };

  // ✅ NEU: useEffect für Cabinet Placement überwachen
  useEffect(() => {
    if (droppedModel.length > 0) {
      triggerTourEvent('tour:cabinetPlaced');
    }
  }, [droppedModel.length]);


  useEffect(() => {
    const targetPrice = computedPrice?.Total || 0;
    if (targetPrice === animatedPrice) return;

    const startPrice = animatedPrice;
    const difference = targetPrice - startPrice;
    const duration = 800;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = startPrice + (difference * progress);

      setAnimatedPrice(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [computedPrice?.Total]);

  useEffect(() => {
    if (seletedModel) {
      setIconsVisible(true);
    } else {
      setIconsVisible(false);
      setActivePanel(null);
    }
  }, [seletedModel]);

  useEffect(() => {
    if (droppedModel.length > prevDroppedModelCount.current) {
      const sidebarR = document.querySelector('.sidebarR') as HTMLElement;
      const toggleBtn = document.querySelector('.toggleBtn') as HTMLElement;

      if (sidebarR && sidebarR.classList.contains('active')) {
        sidebarR.classList.remove('active');
      }

      if (toggleBtn && toggleBtn.classList.contains('active')) {
        toggleBtn.classList.remove('active');
      }

      setToggleBtn(false);
    }

    prevDroppedModelCount.current = droppedModel.length;
  }, [droppedModel.length, setToggleBtn]);

  /*useEffect(() => {
    if (shouldUpdatePrice && price.component) {
      setShouldUpdatePrice(false);
      fetchPriceUpdate();
    }
  }, [shouldUpdatePrice]);*/

  /*useEffect(() => {
    if (!isCreated) { setIsCreated(false); return; }
    fetchPriceCreate();
    setIsCreated(false);
  }, [isCreated]);*/

  const testRealPrice = async () => {
    if (droppedModel.length === 0) {
      alert("Erst Cabinet platzieren!");
      return;
    }

    try {
      // Mit echten Cabinet-Daten
      const realCabinet = droppedModel[0];

      // Echte Preis-Berechnung
      const result = await calculateCabinetPrice(realCabinet);

      // Preis setzen
      setComputedPrice({
        Total: result.total,
        Frame: result.components.Frame,
        Shelf: result.components.Shelf,
        Door: result.components.Door,
        Drawer: result.components.Drawer
      });

      alert(`Echter Preis gesetzt: ${result.total}KD`);

    } catch (error) {
      console.error("🔥 Real price error:", error);
      alert(`Fehler: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // ✅ DEBUG: Überwache computedPrice Änderungen
  useEffect(() => {
  }, [computedPrice]);

  useEffect(() => {
    const handleRecalculatePrices = async (event: any) => {
      if (droppedModel.length === 0) return;

      let newPrices: any = {
        Total: 0,
        Frame: 0,
        Drawer: 0,
        Shelf: 0,
        Door: 0
      };

      for (const cabinet of droppedModel) {
        const cabinetPriceData = await calculateCabinetPrice(cabinet);
        newPrices.Total += cabinetPriceData.total;
        newPrices.Frame += cabinetPriceData.components.Frame;
        newPrices.Drawer += cabinetPriceData.components.Drawer;
        newPrices.Shelf += cabinetPriceData.components.Shelf;
        newPrices.Door += cabinetPriceData.components.Door;
      }

      setComputedPrice(newPrices);
    };

    window.addEventListener('recalculatePrices', handleRecalculatePrices);
    return () => window.removeEventListener('recalculatePrices', handleRecalculatePrices);
  }, [droppedModel, placedModels]);

  // ✅ DEBUG: Überwache isCreated
  useEffect(() => {
    if (!isCreated) {
      return;
    }

    setTimeout(() => {
      fetchPriceCreate();
      setIsCreated(false);
    }, 100);

  }, [isCreated]); // ENTFERNE isLoading aus dependencies!

  useEffect(() => {
    if (!isDeleted) return
    fetchPriceDelete();
  }, [isDeleted]);

  /*useEffect(() => {
    if (droppedModel.length > 0) {
      //setIsSidebarOpen(true);

      // Auto-open color panel and select Frame
      //setActivePanel('color');

      // Set first model as selected if none selected
      if (droppedModel.length > 0) {
        const setSeletedModel = useModelStore.getState().setSeletedModel;
        setSeletedModel(droppedModel[droppedModel.length - 1]);
      }

      // Auto-select Frame
      if (!selectedMesh) {
        safelySelectComponent("Frame");
      }
    } else {
      setIsSidebarOpen(false);
    }
  }, [droppedModel.length]);*/

  /*useEffect(() => {
    if (droppedModel.length > 0 && activePanel !== 'color') {
      setActivePanel('color');

      // Frame automatisch vorauswählen
      if (!selectedMesh) {
        safelySelectComponent("Frame");
      }

      triggerTourEvent('tour:cabinetPlaced');
    }
  }, [droppedModel.length]);*/

  useEffect(() => {
    if (computedPrice?.Total !== prevPriceRef.current) {
      setTimeout(() => {
        prevPriceRef.current = computedPrice?.Total || 0;
      }, 600);
    }
  }, [computedPrice?.Total]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activePanel &&
        !sizeButtonRef.current?.contains(event.target as Node) &&
        !colorButtonRef.current?.contains(event.target as Node) &&
        !sizePanelRef.current?.contains(event.target as Node) &&
        !colorPanelRef.current?.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePanel]);

  useEffect(() => {
    if (activePanel === null) {
      setSelectedMesh("");
      setClickedComponent("");

      const setSeletedModel = useModelStore.getState().setSeletedModel;
      setSeletedModel(null);
      try {
        const setClickOutline = useModelStore.getState().setClickOutline;
        setClickOutline([]);
      } catch (e) {
        console.error("Fehler beim Zurücksetzen von clickOutline:", e);
      }

      try {
        const setShowCuboidCollider = useModelStore.getState().setShowCuboidCollider;
        setShowCuboidCollider([]);
      } catch (e) {
        console.error("Fehler beim Zurücksetzen von showCuboidCollider:", e);
      }
    }
  }, [activePanel]);

  useEffect(() => {
    if (seletedModel && activePanel === 'color' && !selectedMesh) {
      safelySelectComponent("Frame");
    }
  }, [seletedModel, activePanel]);

  useEffect(() => {
    function updateChatbotVisibility() {
      const chatbot = document.querySelector('.chatbot') as HTMLElement;
      const sidebar = document.querySelector('.sidebarR') as HTMLElement;

      if (chatbot && sidebar) {
        if (sidebar.classList.contains('active')) {
          chatbot.classList.add('hidden-chatbot');
        } else {
          chatbot.classList.remove('hidden-chatbot');
        }
      }
    }

    updateChatbotVisibility();

    const observer = new MutationObserver(() => {
      updateChatbotVisibility();
    });

    const sidebar = document.querySelector('.sidebarR');
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }

    // Aufräumen
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isclickedMaterialCategory && price.component) {
      const category = isclickedMaterialCategory === "Lux" ? "DAR LUX" :
        isclickedMaterialCategory === "Plus" ? "DAR PLUS" : "DAR BASE";
      loadMaterialPrices(category);
    }
  }, [isclickedMaterialCategory, price.component, selectedMesh]);

  useEffect(() => {
    if (price.component && selectedMesh) {
      loadPriceDifferences();
    }
  }, [price.component, selectedMesh]); // computedPrice entfernt - verursachte Endlos-Schleife

  useEffect(() => {
    if (seletedModel) {
      const available = ['Frame', 'Shelf', 'Drawer', 'Door'].filter(component => {
        const count = Number(CABINET_ITEMS.find((ele: any) => ele.id === seletedModel?.id)?.childObjInfo?.[component] || 0);
        return count > 0;
      });
      setAvailableComponents(available);
    }
  }, [seletedModel?.id, seletedModel?.uuid]);

  useEffect(() => {
    if (seletedModel) {
      const cabinetItem = CABINET_ITEMS.find((item: any) => item.id === seletedModel?.id);
    }
  }, [seletedModel?.id]);

  return (
    <>
      <ToastContainer />

      {/* Header Container */}
      <div className="header-container">
        <div className="price-container">
          <div className="price-label">
            {/* Safe access to letters with fallback for when selectedLan is not yet set */}
            {selectedLan && letters[selectedLan] ?
              (selectedLan === "English" ?
                `${letters[selectedLan].Total_Price || 'Total Price'}:` :
                `:${letters[selectedLan].Total_Price || 'السعر الاجمالي'}`
              ) : "Total Price:"}
          </div>
          <div className={`price-value ${computedPrice?.Total !== prevPriceRef.current ? 'updating' : ''}`}>
            <span>{animatedPrice}</span> <span>{selectedLan && letters[selectedLan] ? letters[selectedLan].KD || 'KD' : 'KD'}</span>
          </div>
        </div>
        <button className="payment-button" onClick={() => { handlePayBtn() }}>
          <span>
            {selectedLan && letters[selectedLan] ?
              letters[selectedLan].Finalize_Design_Payment || 'Finalize Design & Payment' :
              'Finalize Design & Payment'}
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="payment-icon">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
        </button>
      </div>

      {/* Icon Sidebar */}
      <div className={`icon-sidebar ${iconsVisible && seletedModel ? 'visible' : ''}`}>
        <div ref={sizeButtonRef} className={`icon-button size-button ${activePanel === 'size' ? 'active' : ''}`} onClick={() => togglePanel('size')}>
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15h2v2h-2v-2zm0-4h2v2h-2v-2zm2 8h-2v2c1 0 2-1 2-2zM13 3h2v2h-2V3zm8 4h2v2h-2V7zm0-4v2h2c0-1-1-2-2-2zM1 7h2v2H1V7zm16-4h2v2h-2V3zm0 16h2v2h-2v-2zM3 3C2 3 1 4 1 5h2V3zm6 0h2v2H9V3zM5 3h2v2H5V3zm-4 8v8c0 1.1.9 2 2 2h12V11H1zm2 8 2.5-3.21 1.79 2.15 2.5-3.22L13 19H3z"></path>
          </svg>
        </div>
        <div className={`icon-button color-button ${activePanel === 'color' ? 'active' : ''}`} onClick={() => {
          togglePanel('color');
          if (activePanel !== 'color') {
            setSelectedMesh("");
            setIsclickedMaterialCategory("Base");
            setCurrentIndex(0);
            setMaterialKind(`Metal`);
            setSelectedMaterial(MATERIAL_ITEMS[0].textures[0].textureSrc);

            // Frame automatisch vorauswählen wenn Panel geöffnet wird
            if (seletedModel && !selectedMesh) {
              setTimeout(() => {
                try {
                  // Use our safe helper function that handles all the error checking
                  const componentFound = safelySelectComponent("Frame");

                  // If no component was found, at least show the color panel without a component
                  if (!componentFound) {
                    // We can still show the color panel, even without a component selected
                  }
                } catch (error) {
                  console.error('Error selecting component:', error);
                  // Don't let this error block the panel from opening
                }
              }, 100); // Increased timeout to ensure model is fully loaded
            }
          }
        }}>
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"></path>
          </svg>
        </div>
      </div>

      {/* Size Panel */}
      <div ref={sizePanelRef} className={`sidebar-panel ${activePanel === 'size' ? 'active' : ''}`} id="sizePanel">
        <div className="panel-header">
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 15h2v2h-2v-2zm0-4h2v2h-2v-2zm2 8h-2v2c1 0 2-1 2-2zM13 3h2v2h-2V3zm8 4h2v2h-2V7zm0-4v2h2c0-1-1-2-2-2zM1 7h2v2H1V7zm16-4h2v2h-2V3zm0 16h2v2h-2v-2zM3 3C2 3 1 4 1 5h2V3zm6 0h2v2H9V3zM5 3h2v2H5V3zm-4 8v8c0 1.1.9 2 2 2h12V11H1zm2 8 2.5-3.21 1.79 2.15 2.5-3.22L13 19H3z"></path>
          </svg>
          {selectedLan && letters[selectedLan] ? letters[selectedLan].EACH_SIZE_MATTERS || "EACH SIZE MATTERS" : "EACH SIZE MATTERS"}
        </div>
        {droppedModel.length !== 0 && (
          <div className="slider-container">
            {/* 
            <div className={`slider-row ${selectedLan !== "English" ? "flex-row-reverse" : ""}`}>
              <span className="slider-label">{selectedLan && letters[selectedLan] ? letters[selectedLan].Width || "Width" : "Width"}</span>
              <div className="slider-input">
                <input
                  id="widthSlider"
                  type="range"
                  step={5}
                  min={80}
                  max={120}
                  value={width * 100}
                  className="range-slider"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newWidth = Number(e.target.value) / 100;
                    setWidth(newWidth);
                    debouncedPushToHistory();
                  }}
                />
              </div>
              <span className="slider-value">{Math.floor(width * 100 + 0.5)}</span>
            </div>
            */}

            <div className={`slider-row ${selectedLan === "Arabic" ? "rtl-reverse" : ""}`}>
              <span className="slider-label">{selectedLan && letters[selectedLan] ? letters[selectedLan].Height || "Height" : "Height"}</span>
              <div className="slider-input">
                <input
                  id="heightSlider"
                  type="range"
                  step={5}
                  min={210}
                  max={240}
                  value={height}
                  className="range-slider"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newHeight = Number(e.target.value);
                    setHeight(newHeight);
                    debouncedPushToHistory();
                  }}
                />
              </div>
              <span className="slider-value">{height}</span>
            </div>
            <div className={`slider-row ${selectedLan === "Arabic" ? "rtl-reverse" : ""}`}>
              <span className="slider-label">{selectedLan && letters[selectedLan] ? letters[selectedLan].Depth || "Depth" : "Depth"}</span>
              <div className="slider-input">
                <input
                  id="depthSlider"
                  type="range"
                  step={5}
                  min={45}
                  max={65}
                  value={depth}
                  className="range-slider"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newDepth = Number(e.target.value);
                    setDepth(newDepth);
                    debouncedPushToHistory();
                  }}
                />
              </div>
              <span className="slider-value">{depth}</span>
            </div>
          </div>
        )}
      </div>

      {/* Color Panel */}
      <div ref={colorPanelRef} className={`sidebar-panel ${activePanel === 'color' ? 'active' : ''}`} id="colorPanel">

        {droppedModel.length !== 0 && (
          <>
            <div className={`color-panel-content ${activeCategory ? 'expanded' : ''}`}>
              {/* Erste Spalte: Components */}
              <div className="component-tabs">
                {['Frame', 'Shelf', 'Drawer', 'Door'].map((component) => {
                  // Backend liefert lowercase Keys
                  const lowerComponent = component.toLowerCase();
                  const cabinetItem = CABINET_ITEMS.find((ele: any) => ele.id === seletedModel?.id);
                  const available = seletedModel && Number(cabinetItem?.childObjInfo?.[lowerComponent] || cabinetItem?.childObjInfo?.[component] || 0) > 0;
                  const locked = isTabLocked(component);

                  if (!available) return null;

                  return (
                    <div
                      key={component}
                      className={`component-tab ${selectedMesh === component ? "active" : ""} ${locked ? 'locked' : ''}`}
                      onClick={() => !locked && handleComponent(component)}
                      title={locked ? 'Please complete the previous step first' : ''}
                    >
                      <img
                        src={`/image/icon/${component.toLowerCase()}.svg`}
                        alt={selectedLan && letters[selectedLan] && letters[selectedLan][component] ? letters[selectedLan][component] : component}
                        className="tab-icon"
                        width={component === 'Frame' || component === 'Door' ? "30" : "24"}
                        height={component === 'Frame' || component === 'Door' ? "30" : "24"}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Zweite Spalte: Categories */}
              <div className="category-column">
                <button
                  className={`category-button-vertical ${activeCategory === "Base" ? "active" : ""} ${categoryHasMaterials("Base") ? "has-materials" : ""}`}
                  onClick={() => selectCategory('Base')}
                >
                  <img src={URLs.BASECATEGORY} alt="Base" style={{ width: '150px', height: 'auto' }} />
                  <p>"💰 Smart. Everyday Style."</p>
                </button>

                <button
                  className={`category-button-vertical ${activeCategory === "Plus" ? "active" : ""} ${categoryHasMaterials("Plus") ? "has-materials" : ""}`}
                  onClick={() => selectCategory('Plus')}
                >
                  <img src={URLs.PLUSCATEGORY} alt="Plus" style={{ width: '150px', height: 'auto' }} />
                  <p>"💰💰 Best-Selling. Trend-Ready."</p>
                </button>

                <button
                  className={`category-button-vertical ${activeCategory === "Lux" ? "active" : ""} ${categoryHasMaterials("Lux") ? "has-materials" : ""}`}
                  onClick={() => selectCategory('Lux')}
                >
                  <img src={URLs.LUXCATEGORY} alt="Lux" style={{ width: '150px', height: 'auto' }} />
                  <p>"💰💰💰 Premium. Signature Feel."</p>
                </button>
              </div>

              {/* Dritte Spalte: Materials */}
              <div className={`materials-column ${activeCategory ? 'slide-in' : ''}`}>
                <div className="color-grid">
                  {activeCategory === "Base" && MATERIAL_ITEMS.filter((item: any) => item.name === "DAR BASE")[0]?.textures?.filter((texture: any) => texture.isVisible === true).map((texture: any, index: number) => (
                    <div>
                      <button
                        className="apply-all-btn-above"
                        onClick={(e) => {
                          e.stopPropagation();
                          placedModels.forEach((model: { uuid: string }) => {
                            handleMaterialSelection(texture, "Atlas", "Base", model.uuid);
                          });
                        }}
                        title={t('apply_to_all_items', 'Apply this texture to all items')}
                      >
                        <i className="fas fa-layer-group"></i>
                        <span style={{ color: "#fff" }}>{t('apply_to_all', 'Apply to all')}</span>
                      </button>
                      <div className="material" key={index}>
                        <div className="material-item-container">
                          <img
                            src={texture.textureSrc}
                            className="color-item"
                            onClick={() => handleMaterialSelection(texture, "Atlas", "Base")}
                          />
                        </div>
                        <div
                          className={`material-info-icon ${isRTL ? 'rtl-info-icon' : ''}`}
                          title={t('view_material_details')}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add descriptive information for DAR BASE materials
                            setSelectedMaterialInfo({
                              ...texture,
                              category: "DAR BASE",
                              price: materialPrices[texture.textureSrc] || 0,
                              description: texture.description || t('base_material_description', 'DAR BASE offers economical and durable materials for everyday use. These materials provide reliable performance and a clean look for standard cabinetry.'),
                              features: texture.features || [],
                              specifications: {
                                material: texture.materialType || '_',
                                finish: texture.surfaceFinish || '_',
                                thickness: texture.thickness  || '_',
                                resistance: texture.resistance || '_',
                                application: texture.typicalApplication || '_'
                              }
                            });
                            setShowMaterialInfoModal(true);
                          }}
                        >
                          <i className="fas fa-info"></i>
                        </div>
                        <span>
                          {(() => {
                            const diff = priceDifferences["Base"] || 0;
                            return diff > 0 ? `+${diff}KD` : diff < 0 ? `${diff}KD` : '±0KD';
                          })()}
                        </span>
                      </div>
                    </div>

                  ))}

                  {activeCategory === "Lux" && MATERIAL_ITEMS.filter((item: any) => item.name === "DAR LUX")[0]?.textures?.filter((texture: any) => texture.isVisible === true).map((texture: any, index: number) => (
                    <div>
                      <button
                        className="apply-all-btn-above"
                        onClick={(e) => {
                          e.stopPropagation();
                          placedModels.forEach((model: { uuid: string }) => {
                            handleMaterialSelection(texture, "Cleaf", "Lux", model.uuid);
                          });
                        }}
                        title={t('apply_to_all_items', 'Apply this texture to all items')}
                      >
                        <i className="fas fa-layer-group"></i>
                        <span style={{ color: "#fff" }}>{t('apply_to_all', 'Apply to all')}</span>
                      </button>
                      <div className="material" key={index}>
                        <div className="material-item-container">
                          <img
                            src={texture.textureSrc}
                            className="color-item"
                            onClick={() => handleMaterialSelection(texture, "Cleaf", "Lux")}
                          />
                        </div>
                        <div
                          className={`material-info-icon ${isRTL ? 'rtl-info-icon' : ''}`}
                          title={t('view_material_details')}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add descriptive information for DAR LUX materials
                            setSelectedMaterialInfo({
                              ...texture,
                              category: "DAR LUX",
                              price: materialPrices[texture.textureSrc] || 0,
                              description: texture.description || t('lux_material_description', 'DAR LUX represents our premium line of high-end materials. These exclusive finishes offer superior quality and a sophisticated aesthetic for the discerning customer.'),
                              features: texture.features || [],
                              specifications: {
                                material: texture.materialType || '_',
                                finish: texture.surfaceFinish || '_',
                                thickness: texture.thickness || '_',
                                resistance: texture.resistance || '_',
                                application: texture.typicalApplication || '_'
                              }
                            });
                            setShowMaterialInfoModal(true);
                          }}
                        >
                          <i className="fas fa-info"></i>
                        </div>
                        <span>
                          {(() => {
                            const diff = priceDifferences["Lux"] || 0;
                            return diff > 0 ? `+${diff}KD` : diff < 0 ? `${diff}KD` : '±0KD';
                          })()}
                        </span>
                      </div>
                    </div>

                  ))}

                  {activeCategory === "Plus" && MATERIAL_ITEMS.filter((item: any) => item.name === "DAR PLUS")[0]?.textures?.filter((texture: any) => texture.isVisible === true).map((texture: any, index: number) => (
                    <div>
                      <button
                        className="apply-all-btn-above"
                        onClick={(e) => {
                          e.stopPropagation();
                          placedModels.forEach((model: { uuid: string }) => {
                            handleMaterialSelection(texture, "Egger", "Plus", model.uuid);
                          });
                        }}
                        title={t('apply_to_all_items', 'Apply this texture to all items')}
                      >
                        <i className="fas fa-layer-group"></i>
                        <span style={{ color: "#fff" }}>{t('apply_to_all', 'Apply to all')}</span>
                      </button>

                      <div className="material" key={index}>
                        <div className="material-item-container">
                          <img
                            src={texture.textureSrc}
                            className="color-item"
                            onClick={() => handleMaterialSelection(texture, "Egger", "Plus")}
                          />


                          <div
                            className={`material-info-icon ${isRTL ? 'rtl-info-icon' : ''}`}
                            title={t('view_material_details')}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add descriptive information for DAR PLUS materials
                              setSelectedMaterialInfo({
                                ...texture,
                                category: "DAR PLUS",
                                price: materialPrices[texture.textureSrc] || 0,
                                description: texture.description || t('plus_material_description', 'DAR PLUS offers mid-range materials with enhanced features and aesthetics. These materials provide an excellent balance of quality and value for your cabinetry needs.'),
                                features: texture.features || [],
                                specifications: {
                                  material: texture.materialType || '_',
                                  finish: texture.surfaceFinish || '_',
                                  thickness: texture.thickness || '_',
                                  resistance: texture.resistance || '_',
                                  application: texture.typicalApplication || '_'
                                }
                              });
                              setShowMaterialInfoModal(true);
                            }}
                          >
                            <i className="fas fa-info"></i>
                          </div>
                        </div>

                        <span>
                          {(() => {
                            const diff = priceDifferences["Plus"] || 0;
                            return diff > 0 ? `+${diff}KD` : diff < 0 ? `${diff}KD` : '±0KD';
                          })()}
                        </span>
                      </div>
                    </div>

                  ))}
                </div>
              </div>

              {/* Material Info Modal */}
              {showMaterialInfoModal && selectedMaterialInfo && (
                <MaterialInfoModal
                  show={showMaterialInfoModal}
                  onHide={() => setShowMaterialInfoModal(false)}
                  materialInfo={selectedMaterialInfo}
                />
              )}
            </div>
          </>
        )}
      </div>

      {isClickRoom && (
        <div className="room-dimention-overlay">
          {/* Room settings content - unverändert lassen */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-beetween",
              alignItems: "center",
            }}
          >
            <h4 className="roomDemensionTitle" >
              {selectedLan && letters[selectedLan] ? letters[selectedLan].ROOM_MEASUREMENT || "ROOM MEASUREMENT" : "ROOM MEASUREMENT"}
            </h4>
            <MdOutlineClose
              onClick={() => setIsClickRoom(false)}
              style={{
                cursor: "pointer",
              }}
              size={20}
            />
          </div>
          <hr className="priceMatterHrTag" />
          <Form className="roomDimensionFont">
            <div className=" d-flex align-items-center p-2">
              <label
                htmlFor="formPlaintextWidth"
                className="me-2"
                style={{ flex: "0 0 25%" }}
              >
                {selectedLan && letters[selectedLan] ? letters[selectedLan].Width || "Width" : "Width"}
              </label>
              <div style={{ flex: "0 0 40%" }}>
                <input
                  id="formPlaintextWidth"
                  type="range"
                  step={5}
                  min={300}
                  max={700}
                  className="range-slider"
                  value={roomSize.width}
                  onChange={(e: any) => {
                    setRoomSize({ ...roomSize, width: e.target.value });
                    debouncedPushToHistory();
                  }}
                />
              </div>
              <span
                style={{
                  borderRadius: "10px",
                  flex: "0 0 20%",
                  backgroundColor: "white",
                  marginLeft: "10px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {roomSize.width}
              </span>
            </div>
            &nbsp;
            <div className="seperateLine"></div>
            <div className=" d-flex align-items-center p-2">
              <label
                htmlFor="formPlaintextWidth"
                className="me-2"
                style={{ flex: "0 0 25%" }}
              >
                {selectedLan && letters[selectedLan] ? letters[selectedLan].Height || "Height" : "Height"}
              </label>
              <div style={{ flex: "0 0 40%" }}>
                <input
                  id="formPlaintextWidth"
                  type="range"
                  step={5}
                  min={270}
                  max={370}
                  className="range-slider"
                  value={roomSize.height}
                  onChange={(e: any) => {
                    setRoomSize({ ...roomSize, height: e.target.value });
                    debouncedPushToHistory();
                  }}
                />
              </div>
              <span
                style={{
                  borderRadius: "10px",
                  flex: "0 0 20%",
                  backgroundColor: "white",
                  marginLeft: "10px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {roomSize.height}
              </span>
            </div>&nbsp;
            <div className="seperateLine"></div>
            <div className=" d-flex align-items-center p-2">
              <label
                htmlFor="formPlaintextWidth"
                className="me-2"
                style={{ flex: "0 0 25%" }}
              >
                {selectedLan && letters[selectedLan] ? letters[selectedLan].Length || "Length" : "Length"}
              </label>
              <div style={{ flex: "0 0 40%" }}>
                <input
                  id="formPlaintextWidth"
                  type="range"
                  step={5}
                  min={300}
                  max={700}
                  className="range-slider"
                  value={roomSize.length}
                  onChange={(e) => {
                    setRoomSize({ ...roomSize, length: e.target.value });
                    debouncedPushToHistory();
                  }}
                />
              </div>
              <span
                style={{
                  borderRadius: "10px",
                  flex: "0 0 20%",
                  backgroundColor: "white",
                  marginLeft: "10px",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {roomSize.length}
              </span>
            </div>
          </Form>
        </div>
      )}

    </>
  );
}
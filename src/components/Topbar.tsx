import React, { FC } from 'react';
import { useModelStore } from "../store/modelSlice";
import { useBottomBarStore } from "../store/bottomBarSlice";
import { useTopBarStore } from "../store/topBarSlice";
import { URLs } from "../const/urls";
import { useThree } from "@react-three/fiber";
import { useIndexStore } from "../store/indexSlice";
import { useHistoryStore } from "../store/historyStore";
import { useConfiguratorStore } from "../store/configuratorSlice";
import { MdUndo, MdRedo } from "react-icons/md";
import "./Topbar.css";
import {
  ModelStoreState,
  IndexStoreState,
  TopBarStoreState
} from '../types/store.types';

const Topbar: FC = () => {
  let droppedModel = useModelStore((select: any) => select.droppedModel);
  const setDroppedModel = useModelStore((select: any) => select.setDroppedModel);
  const seletedModel = useModelStore((select: any) => select.seletedModel);
  const setIsDeleted = useTopBarStore((select: any) => select.setIsDeleted);
  const setClickOutline = useModelStore((select: any) => select.setClickOutline);
  const setClickedModel = useModelStore((select: any) => select.setClickedModel);
  const setShowCuboidCollider = useModelStore((select: any) => select.setShowCuboidCollider);
  const showCuboidCollider = useModelStore((select: any) => select.showCuboidCollider);
  const placedModels = useIndexStore((select: any) => select.placedModels);
  const setPlacedModels = useIndexStore((select: any) => select.setPlacedModels);

  // const { scene } = useThree();
  const handleClickDelBtn = () => {
    // setShowCuboidCollider(false);
    // droppedModel.findIndex((obj: any) => obj.position === selectedMesh.position) - 1;
    // showCuboidCollider.splice(droppedModel.findIndex((obj: any) => obj.position === selectedMesh.position), 1)
    // setShowCuboidCollider(showCuboidCollider);
    // scene.remove(scene.children[10].children[0].children[0].children[0].children[1]);
    droppedModel = droppedModel.filter((model: any) => model.position !== seletedModel.position);

    const newDroppedModel = droppedModel.filter(
      (model: any) => model.position !== seletedModel.position
    );
    
    const newPlacedModels = placedModels.filter(
      (model: any) => model.uuid !== seletedModel.uuid
    );
    
    setDroppedModel(newDroppedModel);
    setPlacedModels(newPlacedModels);
    
    setClickedModel(null);
    const formattedArray = Array(newDroppedModel.length).fill(false);
    setClickOutline(formattedArray);
    setIsDeleted(true);
  }
  // Get undo/redo capabilities from history store
  const { canUndo, canRedo, undo, redo } = useHistoryStore();

  // Get current state to track for history
  const width = useConfiguratorStore((state: any) => state.width);
  const height = useConfiguratorStore((state: any) => state.height);
  const depth = useConfiguratorStore((state: any) => state.depth);
  const roomSize = useConfiguratorStore((state: any) => state.roomSize);

  return (
    <div className="topbar">
      <div className="topbar-actions">
        <button 
          className={`action-button ${!canUndo ? 'disabled' : ''}`}
          onClick={undo}
          disabled={!canUndo}
          title="Undo"
        >
          <MdUndo size={24} />
        </button>
        <button
          className={`action-button ${!canRedo ? 'disabled' : ''}`}
          onClick={redo}
          disabled={!canRedo}
          title="Redo"
        >
          <MdRedo size={24} />
        </button>
        <img 
          src={URLs.DELETE_ICON} 
          alt="delete" 
          width={"80px"} 
          onClick={handleClickDelBtn} 
          style={{ cursor: "pointer" }} 
        />
      </div>
    </div>
  );
}

export default Topbar;

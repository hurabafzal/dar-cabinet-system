import React from 'react';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { useHistoryStore } from '../store/historyStore';
import './UndoRedoControls.css';

export const UndoRedoControls: React.FC = () => {
  const { 
    undoAction: undo, 
    redoAction: redo, 
    canUndoAction: canUndo, 
    canRedoAction: canRedo 
  } = useHistoryStore(state => ({
    undoAction: state.undo,
    redoAction: state.redo,
    canUndoAction: state.canUndo,
    canRedoAction: state.canRedo
  }));

  return (
    <div className="undo-redo-controls">
      <button 
        className="history-button"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <MdNavigateBefore size={24} />
      </button>
      <button 
        className="history-button"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
      >
        <MdNavigateNext size={24} />
      </button>
    </div>
  );
};
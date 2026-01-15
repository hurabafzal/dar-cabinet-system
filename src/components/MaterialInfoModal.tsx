import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from '../hooks/useTranslation';
import './MaterialInfoModal.css';

interface MaterialInfo {
  name: string;
  textureSrc: string;
  category: string;
  price?: number | null;
  description?: string;
  features?: string[];
  specifications?: {
    material?: string;
    finish?: string;
    thickness?: string;
    resistance?: string;
    application?: string;
  };
}

interface MaterialInfoModalProps {
  show: boolean;
  onHide: () => void;
  materialInfo: MaterialInfo;
}

const MaterialInfoModal: React.FC<MaterialInfoModalProps> = ({ 
  show, 
  onHide, 
  materialInfo 
}) => {
  
  const { t, isRTL } = useTranslation();
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });

  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  // Handle panning with mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setStartPanPosition({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPosition({
        x: e.clientX - startPanPosition.x,
        y: e.clientY - startPanPosition.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  // Format price display
  const formatPrice = (price?: number | null): string => {
    if (price === undefined || price === null) return t('price_not_available', { defaultValue: 'Price not available' });
    return `${price} KD`;
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      centered
      className={`material-info-modal ${isRTL ? 'rtl' : 'ltr'}`}
      size="lg"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {materialInfo.name} - {t(`category_${materialInfo.category.toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: materialInfo.category })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="material-info-content">
          <div className="material-image-container">
            <div 
              className="material-image-wrapper"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{
                cursor: zoomLevel > 1 ? 'grab' : 'default',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <img 
                src={materialInfo.textureSrc} 
                alt={materialInfo.name}
                style={{
                  transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
                  transformOrigin: 'center',
                  transition: isPanning ? 'none' : 'transform 0.2s',
                }}
                className="material-preview-image"
              />
            </div>
            <div className="zoom-controls">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="btn btn-outline-secondary"
              >
                <i className="fas fa-search-minus"></i> {t('zoom_out', { defaultValue: 'Zoom Out' })}
              </button>
             
              <button
                onClick={handleResetZoom}
                disabled={zoomLevel === 1 && position.x === 0 && position.y === 0}
                className="btn btn-outline-secondary"
              >
              <i className="fas fa-redo"></i> {t('reset', { defaultValue: 'Reset' })}

              </button>
              
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="btn btn-outline-secondary"
              >
                <i className="fas fa-search-plus"></i> {t('zoom_in', { defaultValue: 'Zoom In' })}
              </button>
            </div>
          </div>

          <div className="material-details">
            <h4>{t('material_details', { defaultValue: 'Material Details' })}</h4>
            <table className="details-table">
              <tbody>
                <tr>
                  <td>{t('name', { defaultValue: 'Name' })}:</td>
                  <td>{materialInfo.name}</td>
                </tr>
                <tr>
                  <td>{t('category', { defaultValue: 'Category' })}:</td>
                  <td>{t(`category_${materialInfo.category.toLowerCase().replace(/\s+/g, '_')}`, { defaultValue: materialInfo.category })}</td>
                </tr>
                <tr>
                  <td>{t('price', { defaultValue: 'Price' })}:</td>
                  <td>{formatPrice(materialInfo.price)}</td>
                </tr>
              </tbody>
            </table>
            
            {materialInfo.description && (
              <>
                <h5>{t('description', { defaultValue: 'Description' })}</h5>
                <p>{materialInfo.description}</p>
              </>
            )}
            
            {materialInfo.features && materialInfo.features.length > 0 && (
              <>
                <h5>{t('features', { defaultValue: 'Features' })}</h5>
                <ul>
                  {materialInfo.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </>
            )}
            
            {materialInfo.specifications && (
              <>
                <h5>{t('specifications', { defaultValue: 'Technical Specifications' })}</h5>
                <table className="specs-table">
                  <tbody>
                    {materialInfo.specifications.material && (
                      <tr>
                        <td>{t('spec_material', { defaultValue: 'Material Type' })}:</td>
                        <td>{materialInfo.specifications.material}</td>
                      </tr>
                    )}
                    {materialInfo.specifications.finish && (
                      <tr>
                        <td>{t('spec_finish', { defaultValue: 'Surface Finish' })}:</td>
                        <td>{materialInfo.specifications.finish}</td>
                      </tr>
                    )}
                    {materialInfo.specifications.thickness && (
                      <tr>
                        <td>{t('spec_thickness', { defaultValue: 'Thickness' })}:</td>
                        <td>{materialInfo.specifications.thickness}</td>
                      </tr>
                    )}
                    {materialInfo.specifications.resistance && (
                      <tr>
                        <td>{t('spec_resistance', { defaultValue: 'Resistance' })}:</td>
                        <td>{materialInfo.specifications.resistance}</td>
                      </tr>
                    )}
                    {materialInfo.specifications.application && (
                      <tr>
                        <td>{t('spec_application', { defaultValue: 'Typical Application' })}:</td>
                        <td>{materialInfo.specifications.application}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          onClick={onHide as () => void}
          className="btn btn-secondary"
        >
          {t('close', { defaultValue: 'Close' })}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default MaterialInfoModal;

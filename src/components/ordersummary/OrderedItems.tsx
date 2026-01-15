import React from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { useTranslation } from '../../hooks/useTranslation';

interface LineItem {
  itemId: string;
  amount: string;
  price: string | number;
  quantity: string;
  description: string;
  name: string;
  uuid?: string;
  [key: string]: any;
}

interface OrderedItemsProps {
  lineItems: LineItem[];
  orderData?: {
    fullModelData?: any[];
    designDetails?: {
      materials?: {
        materialDetails?: {
          textures?: any[];
        };
      };
    };
  };
}

const OrderedItems: React.FC<OrderedItemsProps> = ({ lineItems, orderData }) => {
  const { t } = useTranslation();
  // Render component materials function
  const renderComponentMaterials = (modelData: any, item: any) => {
    if (!modelData && !item) return null;

    return ["Frame", "Shelf", "Door", "Drawer"].map((componentName) => {
      // Get price from the item (added in Terms.tsx)
      const price = item?.[componentName.toLowerCase()]?.Price || 0;

      // ✅ PRIORITY 1: Try to get material from components (handleOrderConfirm structure)
      let materialInfo = null;
      let materialCategory = null;
      let materialName = null;

      if (modelData?.components?.[componentName]) {
        const comp = modelData.components[componentName];
        materialCategory = comp.materialCategory;
        materialName = comp.materialName || comp.textureName;
      }
      // ✅ PRIORITY 2: Try to get material from materials (useAutoSave structure)
      else if (modelData?.materials?.[componentName]) {
        materialInfo = modelData.materials[componentName];
        materialCategory = materialInfo.category;
        materialName = materialInfo.name;
      }

      // If no material information for this component
      if (!materialCategory) {
        return (
          <div key={componentName} className="d-flex align-items-center mb-1">
            <span className="fw-bold me-2">{componentName}:</span>
            <span className="me-2 small text-muted">Not configured</span>
            <span className="ms-auto">{price.toFixed(2)} KD</span>
          </div>
        );
      }

      // Display the material category and name
      // Only show materialName if it's different from materialCategory
      const displayName = (materialName && materialName !== materialCategory)
        ? `${materialCategory} - ${materialName}`
        : materialCategory;

      return (
        <div key={componentName} className="d-flex align-items-center mb-1">
          <span className="fw-bold me-2">{componentName}:</span>
          <span className="me-2 small">{displayName}</span>
          <span className="ms-auto">{price.toFixed(2)} KD</span>
        </div>
      );
    });
  };

  return (
    <div className="mb-4 flex-grow-1">
      <h5 className="border-bottom pb-2 mb-3">{t('ordered_items', 'Ordered Items')}</h5>
      <div className="items-container">
        {lineItems && lineItems.length > 0 ? (
          <ListGroup variant="flush">
            {lineItems.map((item: LineItem, itemIndex: number) => {
              const modelData = orderData?.fullModelData?.find((model: any) => model.uuid === item.uuid);
              
              return (
                <ListGroup.Item key={itemIndex} className="px-0 py-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6 className="fw-bold mb-1">{item.name}</h6>
                      <p className="small text-muted mb-1">{item.description}</p>
                      
                      {/* Material Details per Component */}
                      <div className="small text-muted">
                        {renderComponentMaterials(modelData, item)}
                      </div>
                    </div>
                    <div className="text-end">
                      <Badge bg="primary" pill className="d-block">
                        {item.price} KD
                      </Badge>
                    </div>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        ) : (
          <p className="text-muted">{t('no_items', 'No items in this order.')}</p>
        )}
      </div>
    </div>
  );
};

export default OrderedItems;
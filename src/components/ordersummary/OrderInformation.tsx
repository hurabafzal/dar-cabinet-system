import React from 'react';
import { Badge } from 'react-bootstrap';
import { useTranslation } from '../../hooks/useTranslation';

interface OrderInformationProps {
  orderInfo?: {
    orderId: string;
    orderStatus: string;
    orderDate: string;
    orderTime: string;
  };
}

const OrderInformation: React.FC<OrderInformationProps> = ({ orderInfo }) => {
  const { t } = useTranslation();
  if (!orderInfo) return null;

  return (
    <div className="mb-4">
      <h5 className="border-bottom pb-2 mb-3">{t('order_information', 'Order Information')}</h5>
      <div className="row g-2">
        <div className="col-6">
          <small className="text-muted d-block">{t('order_id', 'Order ID')}</small>
          <p className="mb-0 text-truncate small">{orderInfo.orderId}</p>
        </div>
        <div className="col-6">
          <small className="text-muted d-block">{t('status', 'Status')}</small>
          <p className="mb-0 small">
            <Badge bg="warning">{orderInfo.orderStatus}</Badge>
          </p>
        </div>
        <div className="col-6">
          <small className="text-muted d-block">{t('order_date', 'Order Date')}</small>
          <p className="mb-0 small">{orderInfo.orderDate}</p>
        </div>
        <div className="col-6">
          <small className="text-muted d-block">{t('order_time', 'Order Time')}</small>
          <p className="mb-0 small">{orderInfo.orderTime}</p>
        </div>
      </div>
    </div>
  );
};

export default OrderInformation;
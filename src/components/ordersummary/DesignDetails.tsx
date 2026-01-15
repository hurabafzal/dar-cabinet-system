import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface DesignDetailsProps {
  actualDesignId: string;
  designData: {
    createdAt: string;
    comments?: string;
  };
  orderData?: {
    designDetails?: {
      cabinetCount: number;
    };
  };
  formatDate: (dateString: string) => string;
}

const DesignDetails: React.FC<DesignDetailsProps> = ({
  actualDesignId,
  designData,
  orderData,
  formatDate
}) => {
  const { t } = useTranslation();
  return (
    <div className="mb-4">
      <h5 className="border-bottom pb-2 mb-3">{t('design_details', 'Design Details')}</h5>
      <div className="d-flex flex-column gap-1">
        <div>
          <small className="text-muted d-block">{t('design_id', 'Design ID')}</small>
          <p className="mb-0 small">{actualDesignId}</p>
        </div>
        <div>
          <small className="text-muted d-block">{t('creation_date', 'Created on')}</small>
          <p className="mb-0 small">{formatDate(designData.createdAt)}</p>
        </div>
        {orderData?.designDetails && (
          <div>
            <small className="text-muted d-block">{t('cabinet_count', 'Cabinet Count')}</small>
            <p className="mb-0 small">{orderData.designDetails.cabinetCount}</p>
          </div>
        )}
        {designData.comments && (
          <div>
            <small className="text-muted d-block">{t('comments', 'Comments')}</small>
            <p className="mb-0 small">{designData.comments}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignDetails;
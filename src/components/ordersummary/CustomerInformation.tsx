import React from 'react';
import { useTranslation } from '../../hooks/useTranslation';

interface CustomerInformationProps {
  customerInfo?: {
    fullName: string;
    phoneNumber: string;
    email: string;
  };
}

const CustomerInformation: React.FC<CustomerInformationProps> = ({ customerInfo }) => {
  const { t } = useTranslation();
  if (!customerInfo) return null;

  return (
    <div className="mb-4">
      <h5 className="border-bottom pb-2 mb-3">{t('customer_information', 'Customer Information')}</h5>
      <div className="d-flex flex-column gap-1">
        <div>
          <small className="text-muted d-block">{t('customer_name', 'Name')}</small>
          <p className="mb-0 small">{customerInfo.fullName}</p>
        </div>
        <div>
          <small className="text-muted d-block">{t('customer_phone', 'Phone')}</small>
          <p className="mb-0 small">{customerInfo.phoneNumber}</p>
        </div>
        <div>
          <small className="text-muted d-block">{t('customer_email', 'Email')}</small>
          <p className="mb-0 text-break small">{customerInfo.email}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerInformation;
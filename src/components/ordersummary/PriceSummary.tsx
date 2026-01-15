import React, { useState } from 'react';
import { Form, Alert } from 'react-bootstrap';
import { useTranslation } from '../../hooks/useTranslation';

// Hilfsfunktion für das Check-Icon
const CheckIcon = ({ color = 'currentColor' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

interface PriceSummaryProps {
  totalPrice: number;
  discountCode: {
    name: string;
    discount: number;
  };
  setDiscountCode: (code: { name: string; discount: number }) => void;
  ApplyDiscount: (name: string | null) => void;
  orderData?: {
    securityInfo?: {
      userIP: string;
    };
  };
  expressService?: boolean;
  setExpressService?: React.Dispatch<React.SetStateAction<boolean>>;
}

const PriceSummary: React.FC<PriceSummaryProps> = ({
  totalPrice,
  discountCode,
  setDiscountCode,
  ApplyDiscount,
  orderData,
  expressService = false,
  setExpressService
}) => {
  const { t } = useTranslation();
  // Berechnung basierend auf dem Originalpreis
  const originalPrice = discountCode.discount > 0 
    ? totalPrice / (1 - (discountCode.discount / 100)) 
    : totalPrice;
  
  const discountAmount = discountCode.discount > 0 
    ? originalPrice * (discountCode.discount / 100) 
    : 0;
  
  const priceAfterDiscount = originalPrice - discountAmount;
  
  const expressAmount = expressService ? priceAfterDiscount * 0.25 : 0;
  
  const finalTotal = priceAfterDiscount + expressAmount;
  
  // For display purposes only - the actual payment will be for the full amount
  const initialPayment = finalTotal;
  const remainingPayment = 0;

  // Express Service Features List
  const expressFeatures = [
    t('priority_production', 'Priority Production Queue'),
    t('expedited_manufacturing', 'Expedited Manufacturing'),
    t('faster_delivery', 'Faster Delivery Timeline'),
    t('dedicated_support', 'Dedicated Support Contact')
  ];

  // Custom Styling für Express Service (aus der ersten Variante)
  const expressServiceStyle = {
    backgroundColor: expressService ? '#0d5362' : '#f8f9fa',
    color: expressService ? 'white' : 'inherit',
    border: `2px solid #0d5362`,
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    boxShadow: expressService ? '0 4px 8px rgba(13, 83, 98, 0.3)' : 'none'
  };

  return (
    <div className="mt-auto">
      <div className="discount-section mb-3">
        <Form.Group className="mb-2">
          <Form.Label>{t('discount_code', 'Discount Code')}</Form.Label>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder={t('enter_code', 'Enter code')}
              value={discountCode.name}
              onChange={(e) => setDiscountCode({...discountCode, name: e.target.value})}
            />
            <button
              className="btn btn-outline-primary ms-2"
              onClick={() => ApplyDiscount(discountCode.name)}
            >
              {t('apply', 'Apply')}
            </button>
          </div>
        </Form.Group>
        {discountCode.discount > 0 && (
          <Alert variant="success" className="py-2 px-3 mb-2">
            <small>{t('discount_applied', 'Discount of')} {discountCode.discount}% {t('applied', 'applied!')}</small>
          </Alert>
        )}
      </div>
      
      {/* Express Service Option - Mix aus Design 1 und Inhalt 2 */}
      {setExpressService && (
        <div 
          style={expressServiceStyle}
          onClick={() => setExpressService(!expressService)}
          className="mb-4"
        >
          <div className="d-flex align-items-start">
            <div className="me-3 mt-1">
              <Form.Check
                type="checkbox"
                id="express-service-checkbox"
                checked={expressService}
                onChange={(e) => setExpressService(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex-grow-1">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div>
                  <span className="fw-bold fs-5">{t('express_service', 'DAR Express Service')}</span>
                  {expressService && (
                    <span 
                      className="ms-2 badge" 
                      style={{ 
                        backgroundColor: 'white', 
                        color: '#0d5362',
                        fontSize: '0.7rem',
                        padding: '0.25em 0.6em'
                      }}
                    >
                      {t('selected', 'SELECTED')}
                    </span>
                  )}
                </div>
              </div>
              
              <p className="mb-3" style={{ color: expressService ? 'rgba(255,255,255,0.9)' : 'inherit' }}>
                {t('expedited_description', 'Get expedited production and priority delivery for your order')}
              </p>
              
              {/* Features List */}
              <div className="mb-3">
                <div className="row">
                  {expressFeatures.map((feature, index) => (
                    <div key={index} className="col-12 col-sm-6 mb-1">
                      <div className="d-flex align-items-center">
                        <span 
                          className="me-2" 
                          style={{ 
                            color: expressService ? 'white' : '#0d5362',
                            display: 'inline-flex' 
                          }}
                        >
                          <CheckIcon color={expressService ? 'white' : '#0d5362'} />
                        </span>
                        <span 
                          className="small"
                          style={{ color: expressService ? 'rgba(255,255,255,0.9)' : 'inherit' }}
                        >
                          {feature}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Price Display */}
              <div className={`${expressService ? 'text-white' : 'text-primary'} fw-bold`}>
                +{(priceAfterDiscount * 0.25).toFixed(2)} KD (25% of total)
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="price-summary border-top pt-3">
        {/* Subtotal */}
        <div className="d-flex justify-content-between mb-2">
          <span>{t('subtotal', 'Subtotal')}:</span>
          <span>{originalPrice.toFixed(2)} KD</span>
        </div>
        
        {/* Discount, if applied */}
        {discountCode.discount > 0 && (
          <div className="d-flex justify-content-between mb-2">
            <span>{t('discount', 'Discount')} ({discountCode.discount}%):</span>
            <span className="text-danger">-{discountAmount.toFixed(2)} KD</span>
          </div>
        )}
        
        {/* Express Service, if activated */}
        {expressService && (
          <div className="d-flex justify-content-between mb-2 fw-bold" style={{ color: '#0d5362' }}>
            <span>{t('express_service', 'Express Service')} (25%):</span>
            <span>+{expressAmount.toFixed(2)} KD</span>
          </div>
        )}
        
        {/* Total amount */}
        <div className="d-flex justify-content-between fw-bold fs-5">
          <span>{t('total', 'Total Amount')}:</span>
          <span>{finalTotal.toFixed(2)} KD</span>
        </div>
        
        {/* Payment information */}
        <div className="d-flex justify-content-between mt-2 text-muted small">
          <span>{t('initial_payment', 'Initial Payment')}:</span>
          <span>{initialPayment.toFixed(2)} KD</span>
        </div>
        <div className="d-flex justify-content-between text-muted small">
          <span>{t('remaining_payment', 'Remaining Payment')}:</span>
          <span>{remainingPayment.toFixed(2)} KD</span>
        </div>
      </div>
      
      {/* Security Info */}
      {orderData?.securityInfo?.userIP && (
        <div className="mt-3 pt-3 border-top">
          <small className="text-muted">Order placed from IP: {orderData.securityInfo.userIP}</small>
        </div>
      )}
    </div>
  );
};

export default PriceSummary;
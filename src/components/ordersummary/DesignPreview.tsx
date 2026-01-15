import React from 'react';

interface DesignPreviewProps {
  screenshotUrl?: string;
  onImageClick: (imageUrl: string) => void;
  className?: string;
}

const DesignPreview: React.FC<DesignPreviewProps> = ({ 
  screenshotUrl, 
  onImageClick, 
  className = "" 
}) => {
  if (!screenshotUrl) return null;
  
  return (
    <div className={`mb-3 ${className}`}>
      <small className="text-muted d-block">Design Preview</small>
      <div 
        onClick={() => onImageClick(screenshotUrl)}
        style={{ cursor: 'pointer' }}
      >
        <img 
          src={screenshotUrl} 
          alt="Design Preview"
          className="img-fluid rounded border"
          style={{ 
            maxHeight: '200px', 
            objectFit: 'contain', 
            width: '100%',
            backgroundColor: '#f8f9fa'
          }}
        />
        <small className="text-muted d-block text-center mt-1">Click to enlarge</small>
      </div>
    </div>
  );
};

export default DesignPreview;
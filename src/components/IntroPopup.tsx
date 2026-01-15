import React, { useState, useEffect } from 'react';
import './IntroPopup.css';

interface IntroPopupProps {
  onClose: () => void;
  highlightSelector?: string; // CSS selector for element to highlight
  continuousPulse?: boolean; // If true, keeps pulsing even after popup closes
}

const IntroPopup: React.FC<IntroPopupProps> = ({ onClose, highlightSelector, continuousPulse = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Add highlight to specified element
    if (highlightSelector) {
      const element = document.querySelector(highlightSelector);
      if (element) {
        element.classList.add('highlighted-element');
        if (continuousPulse) {
          element.classList.add('pulse-continuous');
        }
      }
    }

    // Cleanup function
    return () => {
      if (highlightSelector && !continuousPulse) {
        const element = document.querySelector(highlightSelector);
        if (element) {
          element.classList.remove('highlighted-element');
          element.classList.remove('pulse-continuous');
        }
      }
    };
  }, [highlightSelector, continuousPulse]);

  const handleClose = () => {
    setIsVisible(false);
    
    // Remove highlight before closing (only if not continuous)
    if (highlightSelector && !continuousPulse) {
      const element = document.querySelector(highlightSelector);
      if (element) {
        element.classList.remove('highlighted-element');
        element.classList.remove('pulse-continuous');
      }
    }
    
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`intro-overlay ${isVisible ? 'fade-in' : 'fade-out'}`}
      onClick={handleClose}
    >
      <div 
        className={`intro-popup ${isVisible ? 'slide-in' : 'slide-out'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="intro-header">
          <div className="intro-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="intro-title">Quick Start</h2>
        </div>

        {/* Steps */}
        <div className="intro-steps">
          <div className="step-item">
            <div className="step-number">1</div>
            <span>Choose model</span>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <span>Drag to room</span>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <span>Customize materials</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="intro-buttons">
          <button className="btn-primary" onClick={handleClose}>
            Got it
          </button>
          <button className="btn-secondary" onClick={handleClose}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntroPopup;
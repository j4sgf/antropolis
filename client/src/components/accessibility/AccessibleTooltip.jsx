import React, { useState, useRef, useEffect } from 'react';
import { useAccessibility } from '../../store/AccessibilityContext';
import './AccessibleTooltip.css';

const AccessibleTooltip = ({ 
  children, 
  content, 
  position = 'top', 
  delay = 300,
  id,
  className = '',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showOnFocus, setShowOnFocus] = useState(false);
  const timeoutRef = useRef(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  
  const { settings } = useAccessibility();

  // Don't show tooltips if disabled in accessibility settings
  const shouldShowTooltip = settings.tooltipsEnabled && !disabled && content;

  const showTooltip = () => {
    if (!shouldShowTooltip) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setShowOnFocus(false);
  };

  const handleFocus = () => {
    setShowOnFocus(true);
    showTooltip();
  };

  const handleBlur = () => {
    hideTooltip();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      hideTooltip();
    }
  };

  // Position tooltip to avoid viewport edges
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !triggerRef.current) return;

    const tooltip = tooltipRef.current;
    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Reset positioning
    tooltip.style.left = '';
    tooltip.style.right = '';
    tooltip.style.top = '';
    tooltip.style.bottom = '';
    
    // Calculate position based on prop and available space
    let finalPosition = position;
    
    // Check if tooltip would go off screen and adjust
    switch (position) {
      case 'top':
        if (rect.top - tooltipRect.height < 10) {
          finalPosition = 'bottom';
        }
        break;
      case 'bottom':
        if (rect.bottom + tooltipRect.height > window.innerHeight - 10) {
          finalPosition = 'top';
        }
        break;
      case 'left':
        if (rect.left - tooltipRect.width < 10) {
          finalPosition = 'right';
        }
        break;
      case 'right':
        if (rect.right + tooltipRect.width > window.innerWidth - 10) {
          finalPosition = 'left';
        }
        break;
    }
    
    // Apply positioning
    switch (finalPosition) {
      case 'top':
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.marginBottom = '8px';
        break;
      case 'bottom':
        tooltip.style.top = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.marginTop = '8px';
        break;
      case 'left':
        tooltip.style.right = '100%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translateY(-50%)';
        tooltip.style.marginRight = '8px';
        break;
      case 'right':
        tooltip.style.left = '100%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translateY(-50%)';
        tooltip.style.marginLeft = '8px';
        break;
    }
    
    tooltip.setAttribute('data-position', finalPosition);
  }, [isVisible, position]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div 
      className={`accessible-tooltip-wrapper ${className}`}
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      aria-describedby={shouldShowTooltip && isVisible ? tooltipId : undefined}
    >
      {children}
      
      {shouldShowTooltip && isVisible && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          className={`accessible-tooltip ${showOnFocus ? 'focus-visible' : ''}`}
          role="tooltip"
          aria-live="polite"
        >
          <div className="tooltip-content">
            {typeof content === 'string' ? (
              <span>{content}</span>
            ) : (
              content
            )}
          </div>
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
};

export default AccessibleTooltip; 
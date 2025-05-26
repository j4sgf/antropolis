import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';

const TutorialOverlay = ({ children }) => {
  const { isActive, currentStep, getStepData } = useTutorial();
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [highlightRect, setHighlightRect] = useState(null);

  const stepData = currentStep ? getStepData(currentStep) : null;

  // Update highlighted element when step changes
  useEffect(() => {
    if (!isActive || !stepData?.target) {
      setHighlightedElement(null);
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const element = document.querySelector(stepData.target);
      if (element) {
        setHighlightedElement(element);
        const rect = element.getBoundingClientRect();
        setHighlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    };

    // Initial update
    updateHighlight();

    // Update on resize or scroll
    const handleUpdate = () => updateHighlight();
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [isActive, stepData, currentStep]);

  if (!isActive) {
    return children;
  }

  return (
    <div className="relative">
      {children}
      
      <AnimatePresence>
        {isActive && (
          <>
            {/* Dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 pointer-events-none"
              style={{ backdropFilter: 'blur(2px)' }}
            />
            
            {/* Highlight cutout */}
            {highlightRect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed z-50 pointer-events-none"
                style={{
                  top: highlightRect.top - 8,
                  left: highlightRect.left - 8,
                  width: highlightRect.width + 16,
                  height: highlightRect.height + 16,
                  boxShadow: `
                    0 0 0 4px rgba(59, 130, 246, 0.5),
                    0 0 0 8px rgba(59, 130, 246, 0.3),
                    0 0 20px rgba(59, 130, 246, 0.4)
                  `,
                  borderRadius: '8px',
                  background: 'transparent'
                }}
              >
                {/* Animated border */}
                <div className="absolute inset-0 rounded-lg border-2 border-blue-400 animate-pulse" />
                
                {/* Corner indicators */}
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TutorialOverlay; 
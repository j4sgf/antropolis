import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';

const TutorialTooltip = () => {
  const { 
    isActive, 
    currentStep, 
    getStepData, 
    nextStep, 
    previousStep, 
    skipTutorial,
    getProgressPercentage,
    getCurrentGroupSteps,
    completedSteps,
    settings
  } = useTutorial();

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Memoize stepData to prevent unnecessary re-renders
  const stepData = useMemo(() => {
    if (!currentStep) return null;
    const data = getStepData(currentStep);
    if (!data && currentStep) {
      console.log('🎓 TutorialTooltip: No step data for', currentStep);
    }
    return data;
  }, [currentStep]);
  
  // Debug render issues only
  if (isActive && currentStep && !stepData) {
    console.log('🎓 TutorialTooltip: Active tutorial but no step data for', currentStep);
  }
  
  // Log tutorial activation status
  console.log('🎓 TutorialTooltip render check:', {
    isActive,
    currentStep,
    hasStepData: !!stepData,
    stepDataType: typeof stepData
  });
  
  // Safety check to ensure stepData exists and has required properties
  if (!isActive || !currentStep || !stepData || typeof stepData !== 'object') {
    if (isActive && !currentStep) {
      console.warn('Tutorial is active but no current step defined');
    }
    if (isActive && currentStep && !stepData) {
      console.warn('Tutorial step data not available for step:', currentStep);
    }
    console.log('🎓 TutorialTooltip: Not rendering - safety check failed');
    return null;
  }
  const progressPercentage = getProgressPercentage();
  const currentGroupSteps = getCurrentGroupSteps();
  const currentStepIndex = currentGroupSteps.indexOf(currentStep);

  // Calculate tooltip position based on target element and preferred position
  useEffect(() => {
    
    if (!isActive || !stepData) {
      setTooltipVisible(false);
      return;
    }

    const calculatePosition = () => {
      
      if (!stepData.target) {
        // Always use non-blocking position at the bottom right for better UX
        setTooltipPosition({
          bottom: 20,
          right: 20,
          top: 'auto',
          left: 'auto'
        });
        setTooltipVisible(true);
        return;
      }

              const targetElement = document.querySelector(stepData.target);
        if (!targetElement) {
          // Try again after a short delay (page might still be loading)
          setTimeout(() => {
            const retryElement = document.querySelector(stepData.target);
            if (!retryElement) {
              // Use non-blocking position instead of center
              setTooltipPosition({
                bottom: 20,
                right: 20,
                top: 'auto',
                left: 'auto'
              });
              setTooltipVisible(true);
            } else {
              // Recalculate position with found element
              calculatePosition();
            }
          }, 1000);
          
          // Show non-blocking tooltip immediately instead of centered
          setTooltipPosition({
            bottom: 20,
            right: 20,
            top: 'auto',
            left: 'auto'
          });
          setTooltipVisible(true);
          return;
        }

      const rect = targetElement.getBoundingClientRect();
      const tooltipWidth = 400;
      const tooltipHeight = 200;
      const margin = 20;

      let top, left;

      // In non-blocking mode, intelligently position to avoid blocking the target
      if (settings?.nonBlocking) {
        // Try to position to the side first, then above/below
        const spaceRight = window.innerWidth - rect.right;
        const spaceLeft = rect.left;
        const spaceBottom = window.innerHeight - rect.bottom;
        const spaceTop = rect.top;
        
        if (spaceRight >= tooltipWidth + margin) {
          // Position to the right
          top = rect.top;
          left = rect.right + margin;
        } else if (spaceLeft >= tooltipWidth + margin) {
          // Position to the left
          top = rect.top;
          left = rect.left - tooltipWidth - margin;
        } else if (spaceBottom >= tooltipHeight + margin) {
          // Position below
          top = rect.bottom + margin;
          left = Math.max(margin, Math.min(rect.left, window.innerWidth - tooltipWidth - margin));
        } else if (spaceTop >= tooltipHeight + margin) {
          // Position above
          top = rect.top - tooltipHeight - margin;
          left = Math.max(margin, Math.min(rect.left, window.innerWidth - tooltipWidth - margin));
        } else {
          // Not enough space anywhere, position at bottom right corner
          top = window.innerHeight - tooltipHeight - margin;
          left = window.innerWidth - tooltipWidth - margin;
        }
      } else {
        // Legacy blocking positioning
        switch (stepData.position) {
          case 'top':
            top = rect.top - tooltipHeight - margin;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'bottom':
            top = rect.bottom + margin;
            left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
            break;
          case 'left':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.left - tooltipWidth - margin;
            break;
          case 'right':
            top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
            left = rect.right + margin;
            break;
          default:
            // Smart non-blocking positioning: prefer right side, then bottom right corner
            const hasSpaceRight = rect.right + tooltipWidth + margin < window.innerWidth;
            const hasSpaceBottom = rect.bottom + tooltipHeight + margin < window.innerHeight;
            
            if (hasSpaceRight) {
              // Position to the right of the target
              top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
              left = rect.right + margin;
            } else if (hasSpaceBottom) {
              // Position below and to the right
              top = rect.bottom + margin;
              left = Math.min(rect.left, window.innerWidth - tooltipWidth - margin);
            } else {
              // Fallback to bottom right corner
              setTooltipPosition({
                bottom: 20,
                right: 20,
                top: 'auto',
                left: 'auto'
              });
              setTooltipVisible(true);
              return;
            }
        }
      }

      // Ensure tooltip stays within viewport
      top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
      left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));

      setTooltipPosition({ top, left });
      setTooltipVisible(true);
    };

    calculatePosition();

    const handleResize = () => calculatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [isActive, currentStep, stepData?.target, stepData?.position]);

  if (!isActive || !stepData || !tooltipVisible) {
    return null;
  }

  const canGoBack = currentStepIndex > 0;
  const canSkip = stepData.canSkip !== false;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm"
        style={{
          top: tooltipPosition.top !== 'auto' ? tooltipPosition.top : undefined,
          left: tooltipPosition.left !== 'auto' ? tooltipPosition.left : undefined,
          bottom: tooltipPosition.bottom !== 'auto' ? tooltipPosition.bottom : undefined,
          right: tooltipPosition.right !== 'auto' ? tooltipPosition.right : undefined,
          minWidth: '280px',
          maxWidth: '320px'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{stepData.title}</h3>
            <div className="flex items-center space-x-2">
              {stepData.estimatedTime && (
                <span className="text-xs bg-blue-400 px-2 py-1 rounded-full">
                  {stepData.estimatedTime}
                </span>
              )}
              <button
                onClick={skipTutorial}
                className="text-blue-200 hover:text-white transition-colors"
                title="Skip tutorial"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-blue-400 rounded-full h-2">
              <motion.div
                className="bg-white rounded-full h-2"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 mb-4 leading-relaxed">
            {stepData.content}
          </p>
          
          {/* Show helpful message if target element isn't found */}
          {stepData.target && !document.querySelector(stepData.target) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center mb-2">
                <span className="text-blue-600 mr-2">ℹ️</span>
                <span className="text-sm font-medium text-blue-800">Navigation Hint</span>
              </div>
              <p className="text-sm text-blue-700">
                This step is designed for a specific page or element. The tutorial will guide you there automatically when you click "Next".
              </p>
            </div>
          )}

          {/* Rewards preview */}
          {stepData.rewards && typeof stepData.rewards === 'object' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center mb-2">
                <span className="text-yellow-600 mr-2">🎁</span>
                <span className="text-sm font-medium text-yellow-800">Rewards</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stepData.rewards).map(([key, value]) => {
                  // Handle different reward value types
                  let displayValue;
                  if (typeof value === 'object' && value !== null) {
                    // If it's an object like {food: 100, materials: 50}, show as multiple rewards
                    return Object.entries(value).map(([subKey, subValue]) => (
                      <span
                        key={`reward-${key}-${subKey}`}
                        className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                      >
                        +{subValue} {subKey}
                      </span>
                    ));
                  } else if (typeof value === 'boolean') {
                    // Handle boolean rewards (like bonuses)
                    displayValue = value ? '✓' : '✗';
                  } else {
                    // Handle numeric or string values
                    displayValue = value;
                  }
                  
                  return (
                    <span
                      key={`reward-${key}`}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full"
                    >
                      {typeof value === 'boolean' ? `${displayValue} ${key}` : `+${displayValue} ${key}`}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step indicator */}
          {currentGroupSteps && currentGroupSteps.length > 1 && (
            <div className="flex items-center justify-center mb-4">
              <div className="flex space-x-2">
                {currentGroupSteps.map((step, index) => (
                  <div
                    key={`step-indicator-${step}-${index}`}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStepIndex
                        ? 'bg-blue-500'
                        : completedSteps && completedSteps.includes(step)
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 rounded-b-lg flex justify-between items-center">
          <div className="flex space-x-2">
            {canGoBack && (
              <button
                onClick={previousStep}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
            )}
            {canSkip && (
              <button
                onClick={skipTutorial}
                className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip Tutorial
              </button>
            )}
          </div>
          
          <button
            onClick={nextStep}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            {currentStepIndex === currentGroupSteps.length - 1 ? 'Complete' : 'Next'}
            <span className="ml-1">→</span>
          </button>
        </div>

        {/* Pointer arrow */}
        {stepData.target && stepData.position && (
          <div
            className={`absolute w-0 h-0 ${
              stepData.position === 'top'
                ? 'border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white -bottom-2 left-1/2 transform -translate-x-1/2'
                : stepData.position === 'bottom'
                ? 'border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white -top-2 left-1/2 transform -translate-x-1/2'
                : stepData.position === 'left'
                ? 'border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-white -right-2 top-1/2 transform -translate-y-1/2'
                : stepData.position === 'right'
                ? 'border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-white -left-2 top-1/2 transform -translate-y-1/2'
                : ''
            }`}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialTooltip; 
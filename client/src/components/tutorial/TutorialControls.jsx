import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';

const TutorialControls = ({ className = '' }) => {
  const {
    isActive,
    currentStep,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    pauseTutorial,
    resumeTutorial,
    getStepData,
    getCurrentGroupSteps,
    completedSteps,
    TUTORIAL_STEPS
  } = useTutorial();

  const stepData = currentStep ? getStepData(currentStep) : null;
  const currentGroupSteps = getCurrentGroupSteps();
  const currentStepIndex = currentGroupSteps.indexOf(currentStep);
  const isLastStep = currentStep === TUTORIAL_STEPS.TUTORIAL_COMPLETE;
  const canGoBack = currentStepIndex > 0;
  const canSkip = stepData?.canSkip !== false;

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (event) => {
      // Don't trigger shortcuts if user is typing in an input
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (isLastStep) {
            completeTutorial();
          } else {
            nextStep();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          if (canGoBack) {
            previousStep();
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (canSkip) {
            skipTutorial();
          }
          break;
        case 'h':
        case 'H':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Show help modal or context-sensitive help
            console.log('Tutorial help requested');
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isActive, currentStep, canGoBack, canSkip, isLastStep, nextStep, previousStep, skipTutorial, completeTutorial]);

  // Listen for custom events from other components
  useEffect(() => {
    const handleTutorialNext = () => {
      if (isLastStep) {
        completeTutorial();
      } else {
        nextStep();
      }
    };

    const handleTutorialSkip = () => {
      if (canSkip) {
        skipTutorial();
      }
    };

    const handleTutorialHelp = () => {
      console.log('Tutorial help requested');
      // Could open a help modal or show context-sensitive help
    };

    window.addEventListener('tutorial:next', handleTutorialNext);
    window.addEventListener('tutorial:skip', handleTutorialSkip);
    window.addEventListener('tutorial:help', handleTutorialHelp);

    return () => {
      window.removeEventListener('tutorial:next', handleTutorialNext);
      window.removeEventListener('tutorial:skip', handleTutorialSkip);
      window.removeEventListener('tutorial:help', handleTutorialHelp);
    };
  }, [isActive, currentStep, canSkip, isLastStep, nextStep, skipTutorial, completeTutorial]);

  if (!isActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 ${className}`}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Back button */}
          <button
            onClick={previousStep}
            disabled={!canGoBack}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              canGoBack
                ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            title="Previous step (←)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>

          {/* Step indicator */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Step {currentStepIndex + 1} of {currentGroupSteps.length}
            </span>
            <div className="flex space-x-1">
              {currentGroupSteps.map((step, index) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStepIndex
                      ? 'bg-blue-500'
                      : completedSteps.includes(step)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Skip button */}
          {canSkip && (
            <button
              onClick={skipTutorial}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              title="Skip tutorial (Esc)"
            >
              Skip Tutorial
            </button>
          )}

          {/* Next/Complete button */}
          <button
            onClick={isLastStep ? completeTutorial : nextStep}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            title={isLastStep ? "Complete tutorial" : "Next step (→ or Enter)"}
          >
            <span>{isLastStep ? 'Complete Tutorial' : 'Next'}</span>
            {!isLastStep && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {isLastStep && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">←</kbd>
              <span>Back</span>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">→</kbd>
              <span>Next</span>
            </div>
            {canSkip && (
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
                <span>Skip</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">H</kbd>
              <span>Help</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialControls; 
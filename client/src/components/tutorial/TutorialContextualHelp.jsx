import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';

/**
 * TutorialContextualHelp - Displays contextual hints and guidance
 * Part of subtask 22.3: Tutorial Content and Flow Logic
 */
const TutorialContextualHelp = () => {
  const [activeHelp, setActiveHelp] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [helpHistory, setHelpHistory] = useState([]);
  const { isActive, currentStep, getStepData } = useTutorial();

  useEffect(() => {
    if (!isActive) {
      setActiveHelp(null);
      setIsVisible(false);
      return;
    }

    // Listen for contextual help events
    const handleContextualHelp = (event) => {
      const { id, message, action } = event.detail;
      
      // Don't show the same help twice in quick succession
      const recentHelp = helpHistory.find(h => h.id === id && Date.now() - h.timestamp < 60000);
      if (recentHelp) return;

      setActiveHelp({
        id,
        message,
        action,
        timestamp: Date.now()
      });
      setIsVisible(true);

      // Add to history
      setHelpHistory(prev => [...prev.slice(-5), { id, timestamp: Date.now() }]);

      // Execute the help action if provided
      if (action && typeof action === 'function') {
        setTimeout(action, 500);
      }

      // Auto-hide after 10 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    };

    window.addEventListener('tutorial:contextual-help', handleContextualHelp);
    
    return () => {
      window.removeEventListener('tutorial:contextual-help', handleContextualHelp);
    };
  }, [isActive, helpHistory]);

  // Generate step-specific helpful hints
  const generateStepHints = () => {
    const stepData = getStepData(currentStep);
    if (!stepData) return [];

    const hints = [];

    // Add completion criteria hint
    if (stepData.completionCriteria) {
      hints.push({
        type: 'completion',
        icon: '🎯',
        title: 'How to Continue',
        message: stepData.completionCriteria.description
      });
    }

    // Add step-specific tips
    if (stepData.tips && stepData.tips.length > 0) {
      hints.push({
        type: 'tips',
        icon: '💡',
        title: 'Pro Tips',
        message: stepData.tips[0] // Show first tip
      });
    }

    // Add help text if available
    if (stepData.helpText) {
      hints.push({
        type: 'help',
        icon: '❓',
        title: 'Need Help?',
        message: stepData.helpText
      });
    }

    return hints;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setActiveHelp(null);
  };

  const handleGetHelp = () => {
    // Show all available hints for current step
    const hints = generateStepHints();
    if (hints.length > 0) {
      setActiveHelp({
        id: `step-hints-${currentStep}`,
        message: hints.map(h => `${h.icon} **${h.title}**: ${h.message}`).join('\n\n'),
        isStepHelp: true,
        timestamp: Date.now()
      });
      setIsVisible(true);
    }
  };

  const handleSkipStep = () => {
    // Emit skip event for current step
    window.dispatchEvent(new CustomEvent('tutorial:skip-step', {
      detail: { step: currentStep }
    }));
    handleDismiss();
  };

  if (!isActive) return null;

  return (
    <>
      {/* Contextual Help Tooltip */}
      <AnimatePresence>
        {isVisible && activeHelp && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">💡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {activeHelp.isStepHelp ? 'Step Guide' : 'Helpful Hint'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {activeHelp.isStepHelp ? 'Available actions' : 'Contextual guidance'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Message */}
              <div className="mb-4">
                {activeHelp.message.split('\n\n').map((paragraph, index) => (
                  <p
                    key={index}
                    className={`text-sm text-gray-700 leading-relaxed ${
                      index > 0 ? 'mt-2' : ''
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: paragraph
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                >
                  Got it
                </button>
                {!activeHelp.isStepHelp && (
                  <button
                    onClick={handleGetHelp}
                    className="flex-1 px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                  >
                    More Help
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always-available Help Button */}
      <div className="fixed bottom-4 left-4 z-40">
        <motion.button
          onClick={handleGetHelp}
          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Get help with current step"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.button>
      </div>

      {/* Smart hints overlay - shows when user appears stuck */}
      <SmartHints
        currentStep={currentStep}
        onShowHelp={() => setIsVisible(true)}
        onDismiss={handleDismiss}
      />
    </>
  );
};

/**
 * SmartHints - Proactive hints based on user behavior
 */
const SmartHints = ({ currentStep, onShowHelp, onDismiss }) => {
  const [showSmartHint, setShowSmartHint] = useState(false);
  const [hintType, setHintType] = useState(null);
  const { getStepData } = useTutorial();

  useEffect(() => {
    let inactivityTimer;
    let mouseMovementTimer;
    let lastMouseMove = Date.now();

    const resetTimers = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (mouseMovementTimer) clearTimeout(mouseMovementTimer);
      
      // Check for inactivity after 15 seconds
      inactivityTimer = setTimeout(() => {
        const stepData = getStepData(currentStep);
        if (stepData && Date.now() - lastMouseMove > 15000) {
          setHintType('inactivity');
          setShowSmartHint(true);
        }
      }, 15000);
    };

    const handleMouseMove = () => {
      lastMouseMove = Date.now();
      setShowSmartHint(false);
      resetTimers();
    };

    const handleClick = () => {
      setShowSmartHint(false);
      resetTimers();
    };

    // Track mouse movement and clicks
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick);
    
    resetTimers();

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick);
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (mouseMovementTimer) clearTimeout(mouseMovementTimer);
    };
  }, [currentStep, getStepData]);

  if (!showSmartHint) return null;

  const getSmartHintContent = () => {
    const stepData = getStepData(currentStep);
    
    switch (hintType) {
      case 'inactivity':
        return {
          title: "Need assistance?",
          message: stepData?.helpText || "Click the help button if you need guidance with this step.",
          icon: "🤔"
        };
      default:
        return null;
    }
  };

  const hintContent = getSmartHintContent();
  if (!hintContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
    >
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{hintContent.icon}</span>
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800 mb-1">
              {hintContent.title}
            </h4>
            <p className="text-sm text-yellow-700">
              {hintContent.message}
            </p>
          </div>
        </div>
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => {
              setShowSmartHint(false);
              onShowHelp();
            }}
            className="flex-1 px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors"
          >
            Get Help
          </button>
          <button
            onClick={() => setShowSmartHint(false)}
            className="px-3 py-1.5 text-xs text-yellow-600 hover:text-yellow-800 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialContextualHelp; 
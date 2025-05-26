import { useEffect, useRef } from 'react';
import { useTutorial } from '../store/TutorialContext';
import { TUTORIAL_STEPS } from '../constants/tutorialConstants';

/**
 * Custom hook for triggering contextual tutorials
 * @param {string} feature - The feature identifier (e.g., 'hasVisitedCreateColony')
 * @param {string} tutorialStep - The tutorial step to trigger
 * @param {Object} options - Additional options
 */
export const useContextualTutorial = (feature, tutorialStep, options = {}) => {
  const { 
    shouldShowContextualHelp, 
    markFeatureDiscovered, 
    triggerContextualTutorial,
    isStepCompleted 
  } = useTutorial();
  
  const hasTriggered = useRef(false);
  const { delay = 1000, triggerOnMount = true } = options;

  useEffect(() => {
    if (!triggerOnMount || hasTriggered.current) return;

    const triggerTutorial = () => {
      console.log('🎓 Contextual Tutorial Check:', {
        feature,
        tutorialStep,
        shouldShow: shouldShowContextualHelp(feature),
        isStepCompleted: isStepCompleted(tutorialStep),
        hasTriggered: hasTriggered.current
      });

      // Check if we should show contextual help for this feature
      const shouldShow = shouldShowContextualHelp(feature);
      const stepCompleted = isStepCompleted(tutorialStep);
      
      if (shouldShow && !stepCompleted) {
        console.log('🎓 Triggering contextual tutorial:', tutorialStep, 'for feature:', feature);
        
        // Mark that user has encountered this feature
        markFeatureDiscovered(feature);
        
        // Trigger the contextual tutorial after a delay
        setTimeout(() => {
          triggerContextualTutorial(tutorialStep);
          hasTriggered.current = true;
          console.log('🎓 Contextual tutorial triggered:', tutorialStep);
        }, delay);
      } else {
        console.log('🎓 Contextual tutorial not triggered - conditions not met:', {
          shouldShow,
          stepCompleted,
          feature,
          tutorialStep
        });
      }
    };

    triggerTutorial();
  }, [feature, tutorialStep, shouldShowContextualHelp, markFeatureDiscovered, triggerContextualTutorial, isStepCompleted, delay, triggerOnMount]);

  // Return a function to manually trigger the tutorial
  const manualTrigger = () => {
    if (!hasTriggered.current && !isStepCompleted(tutorialStep)) {
      markFeatureDiscovered(feature);
      triggerContextualTutorial(tutorialStep);
      hasTriggered.current = true;
    }
  };

  return { manualTrigger };
};

/**
 * Hook specifically for page-level tutorials
 * Triggers when a user visits a page for the first time
 */
export const usePageTutorial = (pageName, tutorialStep, options = {}) => {
  console.log('🎓 usePageTutorial initialized:', { pageName, tutorialStep, options });
  return useContextualTutorial(`hasVisited${pageName}`, tutorialStep, {
    delay: 2000, // Give the page time to load
    ...options
  });
};

/**
 * Hook for action-based tutorials
 * Triggers when a user performs a specific action for the first time
 */
export const useActionTutorial = (actionName, tutorialStep, trigger, options = {}) => {
  const { 
    shouldShowContextualHelp, 
    markFeatureDiscovered, 
    triggerContextualTutorial,
    isStepCompleted 
  } = useTutorial();
  
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!trigger || hasTriggered.current) return;

    if (shouldShowContextualHelp(actionName) && !isStepCompleted(tutorialStep)) {
      markFeatureDiscovered(actionName);
      
      setTimeout(() => {
        triggerContextualTutorial(tutorialStep);
        hasTriggered.current = true;
      }, options.delay || 500);
    }
  }, [trigger, actionName, tutorialStep, shouldShowContextualHelp, markFeatureDiscovered, triggerContextualTutorial, isStepCompleted, options.delay]);
};

export default useContextualTutorial; 
import { useEffect, useRef, useCallback } from 'react';
import { useTutorial } from '../store/TutorialContext';

/**
 * useTutorialKeyboardNavigation - Enhanced keyboard navigation for tutorial
 * Part of subtask 22.5: Tutorial Settings and Accessibility Features
 */
export const useTutorialKeyboardNavigation = () => {
  const {
    isActive,
    nextStep,
    previousStep,
    skipTutorial,
    goToStep,
    currentStep,
    TUTORIAL_STEPS
  } = useTutorial();

  const isListeningRef = useRef(true);
  const lastKeyPressRef = useRef(Date.now());

  // Keyboard shortcuts configuration
  const shortcuts = {
    // Navigation
    'Space': () => nextStep(),
    'Enter': () => nextStep(),
    'ArrowRight': () => nextStep(),
    'ArrowDown': () => nextStep(),
    
    'Backspace': (e) => {
      e.preventDefault();
      previousStep();
    },
    'ArrowLeft': () => previousStep(),
    'ArrowUp': () => previousStep(),
    
    // Quick actions
    'Escape': () => skipTutorial(),
    'F1': (e) => {
      e.preventDefault();
      showContextualHelp();
    },
    '?': (e) => {
      if (e.shiftKey) {
        e.preventDefault();
        showContextualHelp();
      }
    },
    
    // Skip current step
    's': (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        skipCurrentStep();
      }
    },
    
    // Tutorial settings
    't': (e) => {
      if (e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        openTutorialSettings();
      }
    },
    
    // Jump to specific steps (for accessibility)
    '1': (e) => jumpToStepByNumber(e, 1),
    '2': (e) => jumpToStepByNumber(e, 2),
    '3': (e) => jumpToStepByNumber(e, 3),
    '4': (e) => jumpToStepByNumber(e, 4),
    '5': (e) => jumpToStepByNumber(e, 5),
    '6': (e) => jumpToStepByNumber(e, 6),
    '7': (e) => jumpToStepByNumber(e, 7),
    '8': (e) => jumpToStepByNumber(e, 8),
    '9': (e) => jumpToStepByNumber(e, 9),
    '0': (e) => jumpToStepByNumber(e, 10),
    
    // Repeat instructions
    'r': (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        repeatCurrentInstructions();
      }
    }
  };

  const jumpToStepByNumber = useCallback((e, stepNumber) => {
    if (e.altKey) {
      e.preventDefault();
      const steps = Object.values(TUTORIAL_STEPS);
      if (stepNumber <= steps.length) {
        const targetStep = steps[stepNumber - 1];
        goToStep(targetStep);
        announceStepChange(targetStep, stepNumber);
      }
    }
  }, [goToStep, TUTORIAL_STEPS]);

  const skipCurrentStep = useCallback(() => {
    if (currentStep) {
      // Emit skip event for current step
      window.dispatchEvent(new CustomEvent('tutorial:skip-step', {
        detail: { step: currentStep }
      }));
      
      // Announce action for screen readers
      announceAction('Step skipped');
    }
  }, [currentStep]);

  const showContextualHelp = useCallback(() => {
    // Emit help request event
    window.dispatchEvent(new CustomEvent('tutorial:help-requested', {
      detail: { step: currentStep, trigger: 'keyboard' }
    }));
    
    announceAction('Contextual help displayed');
  }, [currentStep]);

  const openTutorialSettings = useCallback(() => {
    // Emit settings request event
    window.dispatchEvent(new CustomEvent('tutorial:settings-requested', {
      detail: { trigger: 'keyboard' }
    }));
    
    announceAction('Tutorial settings opened');
  }, []);

  const repeatCurrentInstructions = useCallback(() => {
    // Emit instruction repeat event
    window.dispatchEvent(new CustomEvent('tutorial:repeat-instructions', {
      detail: { step: currentStep }
    }));
    
    announceAction('Instructions repeated');
  }, [currentStep]);

  const announceStepChange = useCallback((step, stepNumber) => {
    const message = `Jumped to step ${stepNumber}: ${step}`;
    announceToScreenReader(message);
  }, []);

  const announceAction = useCallback((action) => {
    announceToScreenReader(action);
  }, []);

  const announceToScreenReader = useCallback((message) => {
    // Create a live region announcement for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }, []);

  const handleKeyPress = useCallback((event) => {
    // Only handle shortcuts when tutorial is active and we're listening
    if (!isActive || !isListeningRef.current) return;

    // Prevent rapid key presses
    const now = Date.now();
    if (now - lastKeyPressRef.current < 200) return;
    lastKeyPressRef.current = now;

    // Don't interfere with form inputs
    const activeElement = document.activeElement;
    const isFormElement = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.isContentEditable
    );

    // Allow some shortcuts even in form elements
    const allowedInForms = ['F1', 'Escape'];
    if (isFormElement && !allowedInForms.includes(event.key)) {
      return;
    }

    // Get the handler for this key
    const handler = shortcuts[event.key];
    if (handler) {
      try {
        handler(event);
      } catch (error) {
        console.error('Error handling keyboard shortcut:', error);
      }
    }
  }, [isActive, shortcuts]);

  // Focus management for tutorial elements
  const focusNextTutorialElement = useCallback(() => {
    const tutorialElements = document.querySelectorAll('[data-tutorial-focusable]');
    const currentIndex = Array.from(tutorialElements).findIndex(el => el === document.activeElement);
    const nextIndex = (currentIndex + 1) % tutorialElements.length;
    
    if (tutorialElements[nextIndex]) {
      tutorialElements[nextIndex].focus();
      announceAction(`Focused on ${tutorialElements[nextIndex].getAttribute('aria-label') || 'tutorial element'}`);
    }
  }, [announceAction]);

  const focusPreviousTutorialElement = useCallback(() => {
    const tutorialElements = document.querySelectorAll('[data-tutorial-focusable]');
    const currentIndex = Array.from(tutorialElements).findIndex(el => el === document.activeElement);
    const prevIndex = currentIndex <= 0 ? tutorialElements.length - 1 : currentIndex - 1;
    
    if (tutorialElements[prevIndex]) {
      tutorialElements[prevIndex].focus();
      announceAction(`Focused on ${tutorialElements[prevIndex].getAttribute('aria-label') || 'tutorial element'}`);
    }
  }, [announceAction]);

  // Enhanced Tab navigation within tutorial
  const handleTabNavigation = useCallback((event) => {
    if (!isActive) return;

    const tutorialElements = document.querySelectorAll('[data-tutorial-focusable]');
    if (tutorialElements.length === 0) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      
      if (event.shiftKey) {
        focusPreviousTutorialElement();
      } else {
        focusNextTutorialElement();
      }
    }
  }, [isActive, focusNextTutorialElement, focusPreviousTutorialElement]);

  // Set up event listeners
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event) => {
      handleKeyPress(event);
      handleTabNavigation(event);
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Announce tutorial activation
    if (isActive) {
      announceToScreenReader('Tutorial mode activated. Press F1 for help, or use Space to continue.');
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, handleKeyPress, handleTabNavigation, announceToScreenReader]);

  // Focus management on step changes
  useEffect(() => {
    if (isActive && currentStep) {
      // Focus the main tutorial content when step changes
      setTimeout(() => {
        const tutorialMain = document.querySelector('[data-tutorial-main]');
        if (tutorialMain) {
          tutorialMain.focus();
        }
      }, 100);
    }
  }, [isActive, currentStep]);

  // Public API
  const setListening = useCallback((listening) => {
    isListeningRef.current = listening;
  }, []);

  const getAvailableShortcuts = useCallback(() => {
    return [
      { keys: 'Space / Enter', action: 'Next step' },
      { keys: 'Backspace / ←', action: 'Previous step' },
      { keys: 'Ctrl + S', action: 'Skip current step' },
      { keys: 'F1 / Shift + ?', action: 'Show help' },
      { keys: 'Escape', action: 'Exit tutorial' },
      { keys: 'Ctrl + R', action: 'Repeat instructions' },
      { keys: 'Ctrl + Shift + T', action: 'Tutorial settings' },
      { keys: 'Alt + 1-9', action: 'Jump to step number' },
      { keys: 'Tab', action: 'Navigate tutorial elements' }
    ];
  }, []);

  const announceCurrentStep = useCallback(() => {
    if (currentStep) {
      const stepIndex = Object.values(TUTORIAL_STEPS).indexOf(currentStep) + 1;
      const totalSteps = Object.values(TUTORIAL_STEPS).length;
      const message = `Step ${stepIndex} of ${totalSteps}: ${currentStep}`;
      announceToScreenReader(message);
    }
  }, [currentStep, TUTORIAL_STEPS, announceToScreenReader]);

  return {
    // Control functions
    setListening,
    announceCurrentStep,
    announceAction,
    announceToScreenReader,
    
    // Navigation functions
    focusNextTutorialElement,
    focusPreviousTutorialElement,
    
    // Information functions
    getAvailableShortcuts,
    
    // State
    isListening: isListeningRef.current,
    currentStep
  };
};

export default useTutorialKeyboardNavigation; 
import { useEffect, useCallback } from 'react';
import { useAccessibility } from '../store/AccessibilityContext';

const useKeyboardNavigation = () => {
  const { settings, announceToScreenReader } = useAccessibility();

  // Keyboard shortcuts mapping
  const shortcuts = {
    'Escape': () => {
      // Close the topmost modal or panel
      const modals = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (modals.length > 0) {
        const topModal = modals[modals.length - 1];
        const closeButton = topModal.querySelector('[aria-label*="Close"], [aria-label*="close"], .close-button, .modal-close');
        if (closeButton) {
          closeButton.click();
          announceToScreenReader('Modal closed', 'polite');
        }
      }
    },
    'Tab': (e) => {
      if (!settings.keyboardNavigation) return;
      
      // Handle focus trapping in modals
      const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (activeModal) {
        const focusableElements = activeModal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    'F1': (e) => {
      e.preventDefault();
      // Show help/shortcuts modal
      announceToScreenReader('Help modal opened', 'polite');
      // This would trigger help modal - to be implemented
    },
    'Alt+1': (e) => {
      e.preventDefault();
      // Focus on left panel
      const leftPanel = document.querySelector('.left-panel, [aria-label*="left panel"]');
      if (leftPanel) {
        leftPanel.focus();
        announceToScreenReader('Left panel focused', 'polite');
      }
    },
    'Alt+2': (e) => {
      e.preventDefault();
      // Focus on center panel (game view)
      const centerPanel = document.querySelector('.center-panel, [aria-label*="game view"], [aria-label*="simulation"]');
      if (centerPanel) {
        centerPanel.focus();
        announceToScreenReader('Game view focused', 'polite');
      }
    },
    'Alt+3': (e) => {
      e.preventDefault();
      // Focus on right panel
      const rightPanel = document.querySelector('.right-panel, [aria-label*="right panel"]');
      if (rightPanel) {
        rightPanel.focus();
        announceToScreenReader('Right panel focused', 'polite');
      }
    },
    'Ctrl+Shift+A': (e) => {
      e.preventDefault();
      // Open accessibility settings
      announceToScreenReader('Accessibility settings opened', 'polite');
      // This would trigger accessibility panel - to be implemented by parent component
      document.dispatchEvent(new CustomEvent('openAccessibilityPanel'));
    },
    'Space': (e) => {
      // Handle space key for custom elements
      const target = e.target;
      if (target.getAttribute('role') === 'button' && !target.disabled) {
        e.preventDefault();
        target.click();
      }
    },
    'Enter': (e) => {
      // Handle enter key for custom elements
      const target = e.target;
      if ((target.getAttribute('role') === 'button' || target.classList.contains('clickable')) && !target.disabled) {
        e.preventDefault();
        target.click();
      }
    }
  };

  // Arrow key navigation for game elements
  const handleArrowNavigation = useCallback((e) => {
    if (!settings.keyboardNavigation) return;

    const target = e.target;
    const gameBoard = target.closest('.game-board, .simulation-view, .center-panel');
    
    if (gameBoard && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      
      // Find navigable elements in the game board
      const navigableElements = gameBoard.querySelectorAll(
        '[tabindex]:not([tabindex="-1"]), .ant-unit, .resource-node, .structure, [role="gridcell"]'
      );
      
      if (navigableElements.length === 0) return;
      
      const currentIndex = Array.from(navigableElements).indexOf(document.activeElement);
      let nextIndex;
      
      // Calculate grid dimensions (assuming a grid layout)
      const gridContainer = gameBoard.querySelector('.grid-container, .tile-grid');
      const gridWidth = gridContainer ? 
        parseInt(getComputedStyle(gridContainer).getPropertyValue('--grid-columns') || '10') : 
        Math.ceil(Math.sqrt(navigableElements.length));
      
      switch (e.key) {
        case 'ArrowUp':
          nextIndex = currentIndex - gridWidth;
          break;
        case 'ArrowDown':
          nextIndex = currentIndex + gridWidth;
          break;
        case 'ArrowLeft':
          nextIndex = currentIndex - 1;
          break;
        case 'ArrowRight':
          nextIndex = currentIndex + 1;
          break;
        default:
          return;
      }
      
      // Wrap around or clamp to valid indices
      if (nextIndex >= 0 && nextIndex < navigableElements.length) {
        navigableElements[nextIndex].focus();
        
        // Announce the focused element
        const elementType = navigableElements[nextIndex].getAttribute('aria-label') || 
                           navigableElements[nextIndex].className.split(' ')[0] || 
                           'element';
        announceToScreenReader(`Focused on ${elementType}`, 'polite');
      }
    }
  }, [settings.keyboardNavigation, announceToScreenReader]);

  // Focus management utilities
  const focusUtils = {
    // Focus first focusable element in container
    focusFirst: (container) => {
      const focusable = container.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) {
        focusable.focus();
        return true;
      }
      return false;
    },

    // Focus last focusable element in container  
    focusLast: (container) => {
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus();
        return true;
      }
      return false;
    },

    // Check if element is focusable
    isFocusable: (element) => {
      if (element.disabled || element.getAttribute('tabindex') === '-1') {
        return false;
      }
      
      const focusableSelectors = [
        'button', 'a[href]', 'input', 'select', 'textarea', 
        '[tabindex]', '[contenteditable="true"]'
      ];
      
      return focusableSelectors.some(selector => element.matches(selector));
    },

    // Create focus trap for modals
    createFocusTrap: (container) => {
      const focusableElements = container.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return () => {};
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };
      
      container.addEventListener('keydown', handleTabKey);
      firstElement.focus();
      
      // Return cleanup function
      return () => {
        container.removeEventListener('keydown', handleTabKey);
      };
    }
  };

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (!settings.keyboardNavigation) return;

    // Create key combination string
    const keys = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.metaKey) keys.push('Meta');
    
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      keys.push(e.key);
    }
    
    const keyCombo = keys.join('+');
    
    // Execute shortcut if it exists
    if (shortcuts[keyCombo]) {
      shortcuts[keyCombo](e);
    }
    
    // Handle arrow navigation
    handleArrowNavigation(e);
  }, [settings.keyboardNavigation, handleArrowNavigation]);

  // Set up event listeners
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    document.addEventListener('keydown', handleKeyDown);
    
    // Add visual focus indicators
    document.body.classList.add('keyboard-navigation-enabled');
    
    // Skip to main content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--forest-primary, #38a169);
      color: white;
      padding: 8px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: 600;
      z-index: 10000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    if (!document.querySelector('.skip-link')) {
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('keyboard-navigation-enabled');
      
      const existingSkipLink = document.querySelector('.skip-link');
      if (existingSkipLink) {
        existingSkipLink.remove();
      }
    };
  }, [settings.keyboardNavigation, handleKeyDown]);

  // Add keyboard event listeners to specific elements
  const addKeyboardSupport = useCallback((element, options = {}) => {
    if (!element || !settings.keyboardNavigation) return;

    const {
      onActivate = () => element.click(),
      onEscape = () => {},
      preventScroll = false,
      role = 'button'
    } = options;

    // Make element focusable if not already
    if (!element.hasAttribute('tabindex') && !focusUtils.isFocusable(element)) {
      element.setAttribute('tabindex', '0');
    }

    // Set appropriate role
    if (!element.hasAttribute('role')) {
      element.setAttribute('role', role);
    }

    const handleElementKeyDown = (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          if (role === 'button' || element.classList.contains('clickable')) {
            e.preventDefault();
            onActivate(e);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onEscape(e);
          break;
        default:
          break;
      }
    };

    element.addEventListener('keydown', handleElementKeyDown);

    // Prevent scroll on space key for buttons
    if (preventScroll || role === 'button') {
      element.addEventListener('keypress', (e) => {
        if (e.key === ' ') {
          e.preventDefault();
        }
      });
    }

    // Return cleanup function
    return () => {
      element.removeEventListener('keydown', handleElementKeyDown);
    };
  }, [settings.keyboardNavigation, focusUtils]);

  return {
    addKeyboardSupport,
    focusUtils,
    shortcuts,
    isKeyboardNavigationEnabled: settings.keyboardNavigation
  };
};

export default useKeyboardNavigation; 
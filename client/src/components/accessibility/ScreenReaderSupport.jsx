import React, { useEffect, useRef } from 'react';
import { useAccessibility } from '../../store/AccessibilityContext';

const ScreenReaderSupport = ({ children }) => {
  const { settings, announceToScreenReader } = useAccessibility();
  const skipLinkRef = useRef(null);

  // Create and manage live regions for different announcement types
  useEffect(() => {
    // Create live regions if they don't exist
    const createLiveRegion = (id, ariaLive = 'polite', ariaAtomic = 'true') => {
      if (!document.getElementById(id)) {
        const liveRegion = document.createElement('div');
        liveRegion.id = id;
        liveRegion.setAttribute('aria-live', ariaLive);
        liveRegion.setAttribute('aria-atomic', ariaAtomic);
        liveRegion.setAttribute('aria-relevant', 'additions text');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
      }
    };

    // Create different live regions for different types of announcements
    createLiveRegion('screen-reader-announcements', 'polite', 'true');
    createLiveRegion('screen-reader-status', 'polite', 'false');
    createLiveRegion('screen-reader-alerts', 'assertive', 'true');
    createLiveRegion('screen-reader-game-state', 'polite', 'false');

    return () => {
      // Cleanup live regions on unmount
      ['screen-reader-announcements', 'screen-reader-status', 'screen-reader-alerts', 'screen-reader-game-state']
        .forEach(id => {
          const element = document.getElementById(id);
          if (element) {
            element.remove();
          }
        });
    };
  }, []);

  // Enhanced announcement function with different types
  const announceToScreenReaderEnhanced = (message, type = 'polite', region = 'announcements') => {
    if (!settings.screenReaderAnnouncements) return;

    const liveRegionId = `screen-reader-${region}`;
    const liveRegion = document.getElementById(liveRegionId);
    
    if (liveRegion) {
      // Update the aria-live attribute based on type
      liveRegion.setAttribute('aria-live', type);
      
      // Clear and set the message
      liveRegion.textContent = '';
      setTimeout(() => {
        liveRegion.textContent = message;
      }, 100);
    }
  };

  // Game-specific announcement functions
  const gameStateAnnouncements = {
    colonyCreated: (colonyName) => announceToScreenReaderEnhanced(
      `New colony "${colonyName}" has been created. You are now in the main game interface.`, 
      'polite', 'game-state'
    ),
    
    antAssigned: (antCount, role) => announceToScreenReaderEnhanced(
      `${antCount} ant${antCount > 1 ? 's' : ''} assigned to ${role} role`, 
      'polite', 'status'
    ),
    
    resourceDiscovered: (resource, amount) => announceToScreenReaderEnhanced(
      `Discovered ${amount} units of ${resource}`, 
      'polite', 'game-state'
    ),
    
    structureBuilt: (structureName) => announceToScreenReaderEnhanced(
      `${structureName} construction completed`, 
      'polite', 'game-state'
    ),
    
    battleStarted: (enemyType) => announceToScreenReaderEnhanced(
      `Battle initiated against ${enemyType}`, 
      'assertive', 'alerts'
    ),
    
    battleEnded: (result, casualties) => announceToScreenReaderEnhanced(
      `Battle ${result}. Casualties: ${casualties}`, 
      'assertive', 'alerts'
    ),
    
    panelToggled: (panel, state) => announceToScreenReaderEnhanced(
      `${panel} panel ${state}`, 
      'polite', 'status'
    ),
    
    modeChanged: (mode) => announceToScreenReaderEnhanced(
      `Game mode changed to ${mode}`, 
      'polite', 'status'
    ),
    
    error: (message) => announceToScreenReaderEnhanced(
      `Error: ${message}`, 
      'assertive', 'alerts'
    ),
    
    success: (message) => announceToScreenReaderEnhanced(
      `Success: ${message}`, 
      'polite', 'status'
    )
  };

  // Expose enhanced announcement functions globally
  useEffect(() => {
    window.screenReaderSupport = {
      announce: announceToScreenReaderEnhanced,
      game: gameStateAnnouncements
    };

    return () => {
      delete window.screenReaderSupport;
    };
  }, [settings.screenReaderAnnouncements]);

  // Skip navigation functionality
  const handleSkipToMain = (e) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content') || 
                       document.querySelector('main') || 
                       document.querySelector('.game-layout') ||
                       document.querySelector('.center-panel');
    
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView();
      announceToScreenReaderEnhanced('Skipped to main content', 'polite', 'status');
    }
  };

  const handleSkipToNavigation = (e) => {
    e.preventDefault();
    const navigation = document.querySelector('.control-bar') ||
                      document.querySelector('nav') ||
                      document.querySelector('.left-panel');
    
    if (navigation) {
      const firstFocusable = navigation.querySelector('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        firstFocusable.focus();
        announceToScreenReaderEnhanced('Skipped to navigation', 'polite', 'status');
      }
    }
  };

  if (!settings.screenReaderAnnouncements) {
    return children;
  }

  return (
    <>
      {/* Skip Navigation Links */}
      <div className="skip-navigation" aria-label="Skip navigation links">
        <a 
          href="#main-content"
          className="skip-link"
          onClick={handleSkipToMain}
          onFocus={() => announceToScreenReaderEnhanced('Skip to main content link focused', 'polite', 'status')}
        >
          Skip to main content
        </a>
        <a 
          href="#navigation"
          className="skip-link"
          onClick={handleSkipToNavigation}
          onFocus={() => announceToScreenReaderEnhanced('Skip to navigation link focused', 'polite', 'status')}
        >
          Skip to navigation
        </a>
      </div>

      {/* Main Content with Proper Landmark Structure */}
      <div 
        role="application" 
        aria-label="Antopolis - Ant Colony Simulation Game"
        aria-describedby="game-description"
      >
        {/* Hidden description for screen readers */}
        <div id="game-description" className="sr-only">
          Antopolis is a strategic ant colony simulation game. Use keyboard navigation or mouse to manage your colony, 
          assign ant roles, explore territory, and build structures. Press F1 for help or Ctrl+Shift+A for accessibility settings.
        </div>

        {/* Page Title for Screen Readers */}
        <h1 className="sr-only">Antopolis - Ant Colony Simulation</h1>

        {children}
      </div>

      {/* Keyboard Shortcuts Help - Hidden but accessible */}
      <div id="keyboard-shortcuts" className="sr-only" tabIndex="-1">
        <h2>Keyboard Shortcuts</h2>
        <dl>
          <dt>Tab / Shift+Tab</dt>
          <dd>Navigate between interface elements</dd>
          
          <dt>Enter / Space</dt>
          <dd>Activate buttons and controls</dd>
          
          <dt>Arrow Keys</dt>
          <dd>Navigate game board and menus</dd>
          
          <dt>Escape</dt>
          <dd>Close modals and cancel actions</dd>
          
          <dt>Ctrl+Q</dt>
          <dd>Toggle left panel (colony stats)</dd>
          
          <dt>Ctrl+E</dt>
          <dd>Toggle right panel (evolution tree)</dd>
          
          <dt>Ctrl+T</dt>
          <dd>Toggle theme (light/dark)</dd>
          
          <dt>Ctrl+Shift+A</dt>
          <dd>Open accessibility settings</dd>
          
          <dt>Alt+1</dt>
          <dd>Focus left panel</dd>
          
          <dt>Alt+2</dt>
          <dd>Focus center panel (game view)</dd>
          
          <dt>Alt+3</dt>
          <dd>Focus right panel</dd>
          
          <dt>F1</dt>
          <dd>Show help and shortcuts</dd>
        </dl>
      </div>
    </>
  );
};

// Utility functions for other components to use
export const announceGameEvent = (eventType, ...args) => {
  if (window.screenReaderSupport && window.screenReaderSupport.game[eventType]) {
    window.screenReaderSupport.game[eventType](...args);
  }
};

export const announceToScreenReader = (message, type = 'polite', region = 'announcements') => {
  if (window.screenReaderSupport && window.screenReaderSupport.announce) {
    window.screenReaderSupport.announce(message, type, region);
  }
};

export default ScreenReaderSupport; 
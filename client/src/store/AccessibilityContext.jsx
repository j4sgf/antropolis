import React, { createContext, useContext, useEffect, useState } from 'react';

// Color palettes for different types of color blindness
const COLOR_PALETTES = {
  default: {
    name: 'Default',
    description: 'Standard color scheme',
    colors: {
      '--color-primary': '#38a169',
      '--color-secondary': '#48bb78',
      '--color-accent': '#68d391',
      '--color-warning': '#ed8936',
      '--color-error': '#e53e3e',
      '--color-success': '#38a169',
      '--color-info': '#3182ce',
      '--forest-primary': '#38a169',
      '--forest-secondary': '#48bb78',
      '--earth-primary': '#8b4513',
      '--earth-secondary': '#a0522d',
    }
  },
  protanopia: {
    name: 'Protanopia Friendly',
    description: 'Red-blind friendly colors',
    colors: {
      '--color-primary': '#0066cc',
      '--color-secondary': '#4d94ff',
      '--color-accent': '#80b3ff',
      '--color-warning': '#ff9900',
      '--color-error': '#cc6600',
      '--color-success': '#0066cc',
      '--color-info': '#0066cc',
      '--forest-primary': '#0066cc',
      '--forest-secondary': '#4d94ff',
      '--earth-primary': '#996633',
      '--earth-secondary': '#cc9966',
    }
  },
  deuteranopia: {
    name: 'Deuteranopia Friendly',
    description: 'Green-blind friendly colors',
    colors: {
      '--color-primary': '#0066cc',
      '--color-secondary': '#4d94ff',
      '--color-accent': '#80b3ff',
      '--color-warning': '#ff9900',
      '--color-error': '#cc3300',
      '--color-success': '#0066cc',
      '--color-info': '#0066cc',
      '--forest-primary': '#0066cc',
      '--forest-secondary': '#4d94ff',
      '--earth-primary': '#996633',
      '--earth-secondary': '#cc9966',
    }
  },
  tritanopia: {
    name: 'Tritanopia Friendly',
    description: 'Blue-blind friendly colors',
    colors: {
      '--color-primary': '#cc3366',
      '--color-secondary': '#ff6699',
      '--color-accent': '#ff99cc',
      '--color-warning': '#ff6600',
      '--color-error': '#cc0000',
      '--color-success': '#cc3366',
      '--color-info': '#cc3366',
      '--forest-primary': '#cc3366',
      '--forest-secondary': '#ff6699',
      '--earth-primary': '#996633',
      '--earth-secondary': '#cc9966',
    }
  },
  highContrast: {
    name: 'High Contrast',
    description: 'Maximum contrast for low vision',
    colors: {
      '--color-primary': '#000000',
      '--color-secondary': '#333333',
      '--color-accent': '#666666',
      '--color-warning': '#ff0000',
      '--color-error': '#ff0000',
      '--color-success': '#000000',
      '--color-info': '#000000',
      '--forest-primary': '#000000',
      '--forest-secondary': '#333333',
      '--earth-primary': '#000000',
      '--earth-secondary': '#333333',
    }
  }
};

const TEXT_SIZES = {
  small: {
    name: 'Small',
    scale: 0.875,
    baseSize: '14px'
  },
  medium: {
    name: 'Medium',
    scale: 1,
    baseSize: '16px'
  },
  large: {
    name: 'Large',
    scale: 1.125,
    baseSize: '18px'
  },
  xlarge: {
    name: 'Extra Large',
    scale: 1.25,
    baseSize: '20px'
  }
};

const GAME_SPEEDS = {
  slow: {
    name: 'Slow',
    multiplier: 0.5,
    description: 'Half speed for careful observation'
  },
  normal: {
    name: 'Normal',
    multiplier: 1,
    description: 'Standard game speed'
  },
  fast: {
    name: 'Fast',
    multiplier: 2,
    description: 'Double speed for experienced players'
  }
};

const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage or use defaults
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }
    
    return {
      colorPalette: 'default',
      textSize: 'medium',
      gameSpeed: 'normal',
      highContrast: false,
      reducedMotion: false,
      keyboardNavigation: true,
      screenReaderAnnouncements: true,
      soundEnabled: true,
      captionsEnabled: false,
      tooltipsEnabled: true
    };
  });

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply color palette
    const palette = COLOR_PALETTES[settings.colorPalette] || COLOR_PALETTES.default;
    Object.entries(palette.colors).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Apply text size
    const textSize = TEXT_SIZES[settings.textSize] || TEXT_SIZES.medium;
    root.style.setProperty('--base-font-size', textSize.baseSize);
    root.style.setProperty('--text-scale', textSize.scale);

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Apply keyboard navigation class
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  // Detect user preferences
  useEffect(() => {
    const mediaQueries = [
      {
        query: '(prefers-reduced-motion: reduce)',
        setting: 'reducedMotion'
      },
      {
        query: '(prefers-contrast: high)',
        setting: 'highContrast'
      }
    ];

    mediaQueries.forEach(({ query, setting }) => {
      const mediaQuery = window.matchMedia(query);
      
      const handleChange = (e) => {
        if (e.matches) {
          setSettings(prev => ({ ...prev, [setting]: true }));
        }
      };

      handleChange(mediaQuery);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    });
  }, []);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings({
      colorPalette: 'default',
      textSize: 'medium',
      gameSpeed: 'normal',
      highContrast: false,
      reducedMotion: false,
      keyboardNavigation: true,
      screenReaderAnnouncements: true,
      soundEnabled: true,
      captionsEnabled: false,
      tooltipsEnabled: true
    });
  };

  const announceToScreenReader = (message, priority = 'polite') => {
    if (!settings.screenReaderAnnouncements) return;

    // Create or update live region for screen reader announcements
    let liveRegion = document.getElementById('screen-reader-announcements');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'screen-reader-announcements';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }
    
    // Clear and set the message
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
    }, 100);
  };

  const value = {
    settings,
    updateSetting,
    resetSettings,
    announceToScreenReader,
    COLOR_PALETTES,
    TEXT_SIZES,
    GAME_SPEEDS
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityContext; 
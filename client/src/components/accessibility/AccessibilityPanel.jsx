import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '../../store/AccessibilityContext';
import './AccessibilityPanel.css';

const AccessibilityPanel = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSetting,
    resetSettings,
    COLOR_PALETTES,
    TEXT_SIZES,
    GAME_SPEEDS,
    announceToScreenReader
  } = useAccessibility();

  const [activeTab, setActiveTab] = useState('visual');

  const handleSettingChange = (key, value) => {
    updateSetting(key, value);
    announceToScreenReader(`${key} changed to ${value}`, 'polite');
  };

  const tabs = [
    { id: 'visual', label: 'Visual', icon: '👁️' },
    { id: 'motion', label: 'Motion', icon: '🔄' },
    { id: 'audio', label: 'Audio', icon: '🔊' },
    { id: 'interaction', label: 'Interaction', icon: '⌨️' }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="accessibility-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-title"
      >
        <motion.div
          className="accessibility-panel"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="panel-header">
            <h2 id="accessibility-title" className="panel-title">
              <span className="title-icon" aria-hidden="true">♿</span>
              Accessibility Settings
            </h2>
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close accessibility settings"
            >
              ×
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
              >
                <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Visual Tab */}
            {activeTab === 'visual' && (
              <motion.div
                key="visual"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="tab-panel"
                id="panel-visual"
                role="tabpanel"
                aria-labelledby="visual-tab"
              >
                <h3>Visual Accessibility</h3>
                
                {/* Color Palette */}
                <div className="setting-group">
                  <label htmlFor="color-palette" className="setting-label">
                    Color Palette
                    <span className="setting-description">
                      Choose a color scheme optimized for different types of color vision
                    </span>
                  </label>
                  <div className="color-palette-grid">
                    {Object.entries(COLOR_PALETTES).map(([key, palette]) => (
                      <div
                        key={key}
                        className={`color-option ${settings.colorPalette === key ? 'selected' : ''}`}
                        onClick={() => handleSettingChange('colorPalette', key)}
                        role="button"
                        tabIndex={0}
                        aria-pressed={settings.colorPalette === key}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleSettingChange('colorPalette', key);
                          }
                        }}
                      >
                        <div className="color-preview">
                          <div
                            className="color-swatch primary"
                            style={{ backgroundColor: palette.colors['--forest-primary'] }}
                          />
                          <div
                            className="color-swatch secondary"
                            style={{ backgroundColor: palette.colors['--earth-primary'] }}
                          />
                          <div
                            className="color-swatch accent"
                            style={{ backgroundColor: palette.colors['--color-warning'] }}
                          />
                        </div>
                        <div className="color-info">
                          <span className="color-name">{palette.name}</span>
                          <span className="color-description">{palette.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Text Size */}
                <div className="setting-group">
                  <label htmlFor="text-size" className="setting-label">
                    Text Size
                    <span className="setting-description">
                      Adjust text size for better readability
                    </span>
                  </label>
                  <div className="text-size-options">
                    {Object.entries(TEXT_SIZES).map(([key, size]) => (
                      <button
                        key={key}
                        className={`text-size-button ${settings.textSize === key ? 'selected' : ''}`}
                        onClick={() => handleSettingChange('textSize', key)}
                        style={{ fontSize: size.baseSize }}
                        aria-pressed={settings.textSize === key}
                      >
                        {size.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* High Contrast */}
                <div className="setting-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <span className="setting-label">High Contrast Mode</span>
                      <span className="setting-description">
                        Increase contrast for better visibility
                      </span>
                    </div>
                    <button
                      className={`toggle-button ${settings.highContrast ? 'active' : ''}`}
                      onClick={() => handleSettingChange('highContrast', !settings.highContrast)}
                      aria-pressed={settings.highContrast}
                      aria-label="Toggle high contrast mode"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Motion Tab */}
            {activeTab === 'motion' && (
              <motion.div
                key="motion"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="tab-panel"
                id="panel-motion"
                role="tabpanel"
                aria-labelledby="motion-tab"
              >
                <h3>Motion & Animation</h3>
                
                {/* Reduced Motion */}
                <div className="setting-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <span className="setting-label">Reduce Motion</span>
                      <span className="setting-description">
                        Minimize animations and transitions to reduce motion sensitivity
                      </span>
                    </div>
                    <button
                      className={`toggle-button ${settings.reducedMotion ? 'active' : ''}`}
                      onClick={() => handleSettingChange('reducedMotion', !settings.reducedMotion)}
                      aria-pressed={settings.reducedMotion}
                      aria-label="Toggle reduced motion"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>
                </div>

                {/* Game Speed */}
                <div className="setting-group">
                  <label htmlFor="game-speed" className="setting-label">
                    Game Speed
                    <span className="setting-description">
                      Adjust the overall game speed for your comfort
                    </span>
                  </label>
                  <div className="speed-options">
                    {Object.entries(GAME_SPEEDS).map(([key, speed]) => (
                      <button
                        key={key}
                        className={`speed-button ${settings.gameSpeed === key ? 'selected' : ''}`}
                        onClick={() => handleSettingChange('gameSpeed', key)}
                        aria-pressed={settings.gameSpeed === key}
                      >
                        <span className="speed-name">{speed.name}</span>
                        <span className="speed-description">{speed.description}</span>
                        <span className="speed-multiplier">{speed.multiplier}x</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Audio Tab */}
            {activeTab === 'audio' && (
              <motion.div
                key="audio"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="tab-panel"
                id="panel-audio"
                role="tabpanel"
                aria-labelledby="audio-tab"
              >
                <h3>Audio & Sound</h3>
                
                {/* Sound Effects */}
                <div className="setting-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <span className="setting-label">Sound Effects</span>
                      <span className="setting-description">
                        Enable or disable game sound effects
                      </span>
                    </div>
                    <button
                      className={`toggle-button ${settings.soundEnabled ? 'active' : ''}`}
                      onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                      aria-pressed={settings.soundEnabled}
                      aria-label="Toggle sound effects"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>
                </div>

                {/* Screen Reader Announcements */}
                <div className="setting-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <span className="setting-label">Screen Reader Announcements</span>
                      <span className="setting-description">
                        Enable announcements for game state changes
                      </span>
                    </div>
                    <button
                      className={`toggle-button ${settings.screenReaderAnnouncements ? 'active' : ''}`}
                      onClick={() => handleSettingChange('screenReaderAnnouncements', !settings.screenReaderAnnouncements)}
                      aria-pressed={settings.screenReaderAnnouncements}
                      aria-label="Toggle screen reader announcements"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>
                </div>

                {/* Captions */}
                <div className="setting-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <span className="setting-label">Visual Event Captions</span>
                      <span className="setting-description">
                        Show text descriptions for visual game events
                      </span>
                    </div>
                    <button
                      className={`toggle-button ${settings.captionsEnabled ? 'active' : ''}`}
                      onClick={() => handleSettingChange('captionsEnabled', !settings.captionsEnabled)}
                      aria-pressed={settings.captionsEnabled}
                      aria-label="Toggle visual event captions"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Interaction Tab */}
            {activeTab === 'interaction' && (
              <motion.div
                key="interaction"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="tab-panel"
                id="panel-interaction"
                role="tabpanel"
                aria-labelledby="interaction-tab"
              >
                <h3>Interaction & Navigation</h3>
                
                {/* Keyboard Navigation */}
                <div className="setting-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <span className="setting-label">Enhanced Keyboard Navigation</span>
                      <span className="setting-description">
                        Enable keyboard shortcuts and focus indicators
                      </span>
                    </div>
                    <button
                      className={`toggle-button ${settings.keyboardNavigation ? 'active' : ''}`}
                      onClick={() => handleSettingChange('keyboardNavigation', !settings.keyboardNavigation)}
                      aria-pressed={settings.keyboardNavigation}
                      aria-label="Toggle keyboard navigation"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>
                </div>

                {/* Tooltips */}
                <div className="setting-group">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <span className="setting-label">Enhanced Tooltips</span>
                      <span className="setting-description">
                        Show detailed tooltips for all interactive elements
                      </span>
                    </div>
                    <button
                      className={`toggle-button ${settings.tooltipsEnabled ? 'active' : ''}`}
                      onClick={() => handleSettingChange('tooltipsEnabled', !settings.tooltipsEnabled)}
                      aria-pressed={settings.tooltipsEnabled}
                      aria-label="Toggle enhanced tooltips"
                    >
                      <span className="toggle-slider" />
                    </button>
                  </div>
                </div>

                {/* Keyboard Shortcuts Info */}
                <div className="setting-group">
                  <div className="info-section">
                    <h4>Keyboard Shortcuts</h4>
                    <div className="shortcuts-grid">
                      <div className="shortcut-item">
                        <kbd>Tab</kbd>
                        <span>Navigate between elements</span>
                      </div>
                      <div className="shortcut-item">
                        <kbd>Enter</kbd>
                        <span>Activate buttons and links</span>
                      </div>
                      <div className="shortcut-item">
                        <kbd>Space</kbd>
                        <span>Toggle checkboxes and buttons</span>
                      </div>
                      <div className="shortcut-item">
                        <kbd>Esc</kbd>
                        <span>Close modals and panels</span>
                      </div>
                      <div className="shortcut-item">
                        <kbd>Arrow Keys</kbd>
                        <span>Navigate game board</span>
                      </div>
                      <div className="shortcut-item">
                        <kbd>Ctrl + ?</kbd>
                        <span>Show all shortcuts</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="panel-footer">
            <button
              className="reset-button"
              onClick={() => {
                resetSettings();
                announceToScreenReader('Accessibility settings reset to defaults', 'polite');
              }}
            >
              Reset to Defaults
            </button>
            <button className="apply-button" onClick={onClose}>
              Apply & Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AccessibilityPanel; 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LeftPanel from './LeftPanel';
import CenterPanel from './CenterPanel';
import RightPanel from './RightPanel';
import AccessibilityPanel from '../accessibility/AccessibilityPanel';
import { useAccessibility } from '../../store/AccessibilityContext';
import useKeyboardNavigation from '../../hooks/useKeyboardNavigation';
import './GameLayout.css';

const GameLayout = ({ colonyId, colonyData }) => {
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeColonyData, setRealTimeColonyData] = useState(colonyData);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState(false);
  const [panelSizes, setPanelSizes] = useState({
    left: 320,
    right: 320
  });

  // Accessibility context and keyboard navigation
  const { settings, announceToScreenReader } = useAccessibility();
  const { addKeyboardSupport, focusUtils } = useKeyboardNavigation();

  // Handle colony data updates from LeftPanel
  const handleColonyUpdate = (updatedColonyData) => {
    setRealTimeColonyData(updatedColonyData);
  };
  
  // Handle accessibility panel custom event
  useEffect(() => {
    const handleOpenAccessibilityPanel = () => {
      setShowAccessibilityPanel(true);
    };

    document.addEventListener('openAccessibilityPanel', handleOpenAccessibilityPanel);
    return () => {
      document.removeEventListener('openAccessibilityPanel', handleOpenAccessibilityPanel);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle shortcuts when not typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'q':
        case 'Q':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setLeftPanelCollapsed(!leftPanelCollapsed);
          }
          break;
        case 'e':
        case 'E':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setRightPanelCollapsed(!rightPanelCollapsed);
          }
          break;
        case 't':
        case 'T':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setTheme(theme === 'light' ? 'dark' : 'light');
          }
          break;
        case 'f':
        case 'F':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Toggle fullscreen simulation view
            setLeftPanelCollapsed(true);
            setRightPanelCollapsed(true);
          }
          break;
        case 's':
        case 'S':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowSettingsModal(true);
          }
          break;
        case 'h':
        case 'H':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowHelpModal(true);
          }
          break;
        case 'i':
        case 'I':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            setShowStatsModal(true);
          }
          break;
        case 'Escape':
          // Close modals or restore panels if in fullscreen
          if (showSettingsModal || showHelpModal || showStatsModal) {
            setShowSettingsModal(false);
            setShowHelpModal(false);
            setShowStatsModal(false);
          } else if (leftPanelCollapsed && rightPanelCollapsed) {
            setLeftPanelCollapsed(false);
            setRightPanelCollapsed(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [leftPanelCollapsed, rightPanelCollapsed, theme, showSettingsModal, showHelpModal, showStatsModal]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Settings Modal Component
  const SettingsModal = () => (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowSettingsModal(false)}
    >
      <motion.div
        className="modal-content settings-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Game Settings</h2>
          <button onClick={() => setShowSettingsModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="setting-group">
            <label>Theme</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="setting-group">
            <label>Left Panel Width</label>
            <input
              type="range"
              min="250"
              max="400"
              value={panelSizes.left}
              onChange={(e) => setPanelSizes(prev => ({ ...prev, left: Number(e.target.value) }))}
            />
            <span>{panelSizes.left}px</span>
          </div>
          <div className="setting-group">
            <label>Right Panel Width</label>
            <input
              type="range"
              min="250"
              max="400"
              value={panelSizes.right}
              onChange={(e) => setPanelSizes(prev => ({ ...prev, right: Number(e.target.value) }))}
            />
            <span>{panelSizes.right}px</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Help Modal Component
  const HelpModal = () => (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowHelpModal(false)}
    >
      <motion.div
        className="modal-content help-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Keyboard Shortcuts & Help</h2>
          <button onClick={() => setShowHelpModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <div className="help-section">
            <h3>Panel Controls</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Ctrl+Q</kbd>
                <span>Toggle Left Panel</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+E</kbd>
                <span>Toggle Right Panel</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+F</kbd>
                <span>Fullscreen Simulation</span>
              </div>
            </div>
          </div>
          <div className="help-section">
            <h3>Simulation Controls</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Space</kbd>
                <span>Play/Pause Simulation</span>
              </div>
              <div className="shortcut-item">
                <kbd>+/-</kbd>
                <span>Zoom In/Out</span>
              </div>
              <div className="shortcut-item">
                <kbd>R</kbd>
                <span>Reset View</span>
              </div>
              <div className="shortcut-item">
                <kbd>G</kbd>
                <span>Toggle Grid</span>
              </div>
              <div className="shortcut-item">
                <kbd>P</kbd>
                <span>Toggle Ant Paths</span>
              </div>
            </div>
          </div>
          <div className="help-section">
            <h3>General</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Ctrl+T</kbd>
                <span>Toggle Theme</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+S</kbd>
                <span>Settings</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+H</kbd>
                <span>Help</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl+I</kbd>
                <span>Colony Stats</span>
              </div>
              <div className="shortcut-item">
                <kbd>Esc</kbd>
                <span>Close Modals/Exit Fullscreen</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // Stats Modal Component
  const StatsModal = () => (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowStatsModal(false)}
    >
      <motion.div
        className="modal-content stats-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Colony Statistics</h2>
          <button onClick={() => setShowStatsModal(false)}>×</button>
        </div>
        <div className="modal-body">
          {realTimeColonyData && (
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Population</h4>
                <div className="stat-value">{realTimeColonyData.population || 0}</div>
              </div>
              <div className="stat-card">
                <h4>Efficiency</h4>
                <div className="stat-value">{Math.round((realTimeColonyData.efficiency || 0.8) * 100)}%</div>
              </div>
              <div className="stat-card">
                <h4>Territory</h4>
                <div className="stat-value">75%</div>
              </div>
              <div className="stat-card">
                <h4>Resources</h4>
                <div className="stat-value">5 nodes</div>
              </div>
              <div className="stat-card">
                <h4>Structures</h4>
                <div className="stat-value">3 built</div>
              </div>
              <div className="stat-card">
                <h4>Growth Rate</h4>
                <div className="stat-value">+2.3%</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className={`game-layout ${theme}`} data-testid="game-layout">
      {/* Keyboard shortcuts info (can be toggled) */}
      <div className="shortcuts-help" title="Keyboard Shortcuts">
        <div className="shortcuts-list">
          <span>Ctrl+Q: Toggle Left Panel</span>
          <span>Ctrl+E: Toggle Right Panel</span>
          <span>Ctrl+T: Toggle Theme</span>
          <span>Ctrl+F: Fullscreen View</span>
          <span>Ctrl+H: Help</span>
          <span>Esc: Restore Panels</span>
        </div>
      </div>

      {/* Main layout grid */}
      <div 
        className={`layout-grid ${leftPanelCollapsed ? 'left-collapsed' : ''} ${rightPanelCollapsed ? 'right-collapsed' : ''}`}
        style={{
          '--left-panel-width': `${panelSizes.left}px`,
          '--right-panel-width': `${panelSizes.right}px`
        }}
      >
        {/* Left Panel - Colony Stats and Ant Assignments */}
        <AnimatePresence>
          {!leftPanelCollapsed && (
            <motion.div
              className="left-panel-container"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ width: panelSizes.left }}
            >
              <LeftPanel 
                colonyId={colonyId}
                colonyData={realTimeColonyData || colonyData}
                onCollapse={() => setLeftPanelCollapsed(true)}
                theme={theme}
                onColonyUpdate={handleColonyUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left Panel Toggle Button */}
        {leftPanelCollapsed && (
          <motion.button
            className="panel-toggle left-toggle"
            onClick={() => setLeftPanelCollapsed(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Show Left Panel (Ctrl+Q)"
          >
            <span className="toggle-icon">📊</span>
          </motion.button>
        )}

        {/* Center Panel - Simulation View */}
        <div className="center-panel-container">
          <CenterPanel 
            colonyId={colonyId}
            colonyData={realTimeColonyData || colonyData}
            isFullscreen={leftPanelCollapsed && rightPanelCollapsed}
            theme={theme}
            onToggleFullscreen={() => {
              if (leftPanelCollapsed && rightPanelCollapsed) {
                setLeftPanelCollapsed(false);
                setRightPanelCollapsed(false);
              } else {
                setLeftPanelCollapsed(true);
                setRightPanelCollapsed(true);
              }
            }}
          />
        </div>

        {/* Right Panel - Evolution Tree and Resources */}
        <AnimatePresence>
          {!rightPanelCollapsed && (
            <motion.div
              className="right-panel-container"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ width: panelSizes.right }}
            >
              <RightPanel 
                colonyId={colonyId}
                colonyData={realTimeColonyData || colonyData}
                onCollapse={() => setRightPanelCollapsed(true)}
                theme={theme}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Panel Toggle Button */}
        {rightPanelCollapsed && (
          <motion.button
            className="panel-toggle right-toggle"
            onClick={() => setRightPanelCollapsed(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Show Right Panel (Ctrl+E)"
          >
            <span className="toggle-icon">🌳</span>
          </motion.button>
        )}
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="control-group">
          <button
            className="control-btn"
            onClick={() => setShowSettingsModal(true)}
            title="Settings (Ctrl+S)"
          >
            ⚙️
          </button>
          <button
            className="control-btn"
            onClick={() => setShowHelpModal(true)}
            title="Help (Ctrl+H)"
          >
            ❓
          </button>
          <button
            className="control-btn"
            onClick={() => setShowStatsModal(true)}
            title="Colony Stats (Ctrl+I)"
          >
            📊
          </button>
          <button
            className="control-btn accessibility-btn"
            onClick={() => {
              setShowAccessibilityPanel(true);
              announceToScreenReader('Accessibility settings opened', 'polite');
            }}
            title="Accessibility Settings (Ctrl+Shift+A)"
            aria-label="Open accessibility settings"
          >
            ♿
          </button>
        </div>
        
        {/* Theme Toggle Button */}
        <motion.button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme (Ctrl+T)`}
        >
          <span className="theme-icon">
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
        </motion.button>
      </div>

      {/* Modal Overlays */}
      <AnimatePresence>
        {showSettingsModal && <SettingsModal />}
        {showHelpModal && <HelpModal />}
        {showStatsModal && <StatsModal />}
        {showAccessibilityPanel && (
          <AccessibilityPanel 
            isOpen={showAccessibilityPanel}
            onClose={() => {
              setShowAccessibilityPanel(false);
              announceToScreenReader('Accessibility settings closed', 'polite');
            }}
          />
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-content">
              <motion.div
                className="loading-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                🐜
              </motion.div>
              <p>Loading colony data...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameLayout; 
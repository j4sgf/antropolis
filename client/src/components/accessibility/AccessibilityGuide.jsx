import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccessibility } from '../../store/AccessibilityContext';
import './AccessibilityGuide.css';

const AccessibilityGuide = ({ isOpen, onClose }) => {
  const { settings } = useAccessibility();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: '♿' },
    { id: 'keyboard', label: 'Keyboard Navigation', icon: '⌨️' },
    { id: 'screen-reader', label: 'Screen Reader', icon: '🔊' },
    { id: 'visual', label: 'Visual Accessibility', icon: '👁️' },
    { id: 'testing', label: 'Testing Guide', icon: '🧪' },
    { id: 'support', label: 'Support & Feedback', icon: '💬' }
  ];

  if (!isOpen) return null;

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="guide-content">
            <h3>Accessibility in Antopolis</h3>
            <p>
              Antopolis is designed to be accessible to players with diverse abilities. 
              This guide covers the accessibility features available and how to use them effectively.
            </p>
            
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">🎨</div>
                <h4>Color Accessibility</h4>
                <p>Multiple color palettes including colorblind-friendly options</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">⌨️</div>
                <h4>Keyboard Navigation</h4>
                <p>Complete keyboard support with customizable shortcuts</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🔊</div>
                <h4>Screen Reader Support</h4>
                <p>Full compatibility with NVDA, JAWS, and VoiceOver</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h4>Responsive Design</h4>
                <p>Adapts to different screen sizes and devices</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">🔧</div>
                <h4>Customizable Interface</h4>
                <p>Adjustable text size, motion, and interaction preferences</p>
              </div>
              
              <div className="feature-card">
                <div className="feature-icon">💡</div>
                <h4>Enhanced Tooltips</h4>
                <p>Detailed descriptions for all game elements</p>
              </div>
            </div>

            <div className="wcag-compliance">
              <h4>WCAG 2.1 Compliance</h4>
              <p>
                Antopolis follows Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards:
              </p>
              <ul>
                <li><strong>Perceivable:</strong> Multiple color schemes and text size options</li>
                <li><strong>Operable:</strong> Full keyboard navigation and customizable controls</li>
                <li><strong>Understandable:</strong> Clear interface language and consistent navigation</li>
                <li><strong>Robust:</strong> Compatible with assistive technologies</li>
              </ul>
            </div>
          </div>
        );

      case 'keyboard':
        return (
          <div className="guide-content">
            <h3>Keyboard Navigation Guide</h3>
            
            <div className="keyboard-section">
              <h4>Basic Navigation</h4>
              <div className="shortcut-grid">
                <div className="shortcut-item">
                  <kbd>Tab</kbd>
                  <span>Move to next interactive element</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Shift + Tab</kbd>
                  <span>Move to previous interactive element</span>
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
                  <kbd>Escape</kbd>
                  <span>Close modals and menus</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Arrow Keys</kbd>
                  <span>Navigate game board and menus</span>
                </div>
              </div>
            </div>

            <div className="keyboard-section">
              <h4>Game-Specific Shortcuts</h4>
              <div className="shortcut-grid">
                <div className="shortcut-item">
                  <kbd>Ctrl + Q</kbd>
                  <span>Toggle left panel (colony stats)</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + E</kbd>
                  <span>Toggle right panel (evolution tree)</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + T</kbd>
                  <span>Toggle light/dark theme</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl + Shift + A</kbd>
                  <span>Open accessibility settings</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Alt + 1</kbd>
                  <span>Focus left panel</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Alt + 2</kbd>
                  <span>Focus center panel (game view)</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Alt + 3</kbd>
                  <span>Focus right panel</span>
                </div>
                <div className="shortcut-item">
                  <kbd>F1</kbd>
                  <span>Show help and shortcuts</span>
                </div>
              </div>
            </div>

            <div className="tips-section">
              <h4>Navigation Tips</h4>
              <ul>
                <li>Use Tab to move through interface elements in logical order</li>
                <li>Look for focus indicators (highlighted borders) to see where you are</li>
                <li>Use Arrow keys to navigate within game boards and grids</li>
                <li>Press Enter or Space to activate buttons and controls</li>
                <li>Use Escape to quickly close any open dialogs or menus</li>
              </ul>
            </div>
          </div>
        );

      case 'screen-reader':
        return (
          <div className="guide-content">
            <h3>Screen Reader Support</h3>
            
            <div className="sr-section">
              <h4>Supported Screen Readers</h4>
              <div className="sr-list">
                <div className="sr-item">
                  <strong>NVDA (Windows)</strong>
                  <p>Free, open-source screen reader with full game support</p>
                </div>
                <div className="sr-item">
                  <strong>JAWS (Windows)</strong>
                  <p>Professional screen reader with advanced features</p>
                </div>
                <div className="sr-item">
                  <strong>VoiceOver (macOS/iOS)</strong>
                  <p>Built-in Apple screen reader with gesture support</p>
                </div>
                <div className="sr-item">
                  <strong>TalkBack (Android)</strong>
                  <p>Google's screen reader for Android devices</p>
                </div>
              </div>
            </div>

            <div className="sr-section">
              <h4>Live Regions and Announcements</h4>
              <p>
                Antopolis uses ARIA live regions to announce important game events:
              </p>
              <ul>
                <li><strong>Game State Changes:</strong> Colony events, structure completion, battles</li>
                <li><strong>User Actions:</strong> Ant assignments, resource discoveries, panel toggles</li>
                <li><strong>Alerts:</strong> Errors, warnings, and critical notifications</li>
                <li><strong>Status Updates:</strong> Resource levels, population changes</li>
              </ul>
            </div>

            <div className="sr-section">
              <h4>Navigation Landmarks</h4>
              <p>The game interface uses semantic landmarks for easy navigation:</p>
              <ul>
                <li><strong>Main:</strong> Primary game interface and simulation view</li>
                <li><strong>Navigation:</strong> Control panels and menu areas</li>
                <li><strong>Complementary:</strong> Side panels with colony information</li>
                <li><strong>Region:</strong> Distinct game areas like evolution tree</li>
              </ul>
            </div>

            <div className="sr-section">
              <h4>Screen Reader Tips</h4>
              <ul>
                <li>Use landmark navigation to quickly move between game sections</li>
                <li>Listen for live region announcements during gameplay</li>
                <li>Use the elements list to find specific buttons or links</li>
                <li>Check heading structure for page organization</li>
                <li>Use table navigation commands for data grids</li>
              </ul>
            </div>
          </div>
        );

      case 'visual':
        return (
          <div className="guide-content">
            <h3>Visual Accessibility Features</h3>
            
            <div className="visual-section">
              <h4>Color Accessibility</h4>
              <p>Choose from colorblind-friendly palettes in accessibility settings:</p>
              <div className="palette-examples">
                <div className="palette-example">
                  <div className="palette-preview default"></div>
                  <div>
                    <strong>Default</strong>
                    <p>Standard color scheme with full spectrum</p>
                  </div>
                </div>
                <div className="palette-example">
                  <div className="palette-preview protanopia"></div>
                  <div>
                    <strong>Protanopia Friendly</strong>
                    <p>Red-blind friendly colors</p>
                  </div>
                </div>
                <div className="palette-example">
                  <div className="palette-preview deuteranopia"></div>
                  <div>
                    <strong>Deuteranopia Friendly</strong>
                    <p>Green-blind friendly colors</p>
                  </div>
                </div>
                <div className="palette-example">
                  <div className="palette-preview tritanopia"></div>
                  <div>
                    <strong>Tritanopia Friendly</strong>
                    <p>Blue-blind friendly colors</p>
                  </div>
                </div>
                <div className="palette-example">
                  <div className="palette-preview high-contrast"></div>
                  <div>
                    <strong>High Contrast</strong>
                    <p>Maximum contrast for low vision</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="visual-section">
              <h4>Text and Size Options</h4>
              <ul>
                <li><strong>Text Size:</strong> Small, Medium, Large, Extra Large options</li>
                <li><strong>Font Weight:</strong> Enhanced readability with appropriate font weights</li>
                <li><strong>Line Spacing:</strong> Optimized spacing for different text sizes</li>
                <li><strong>Focus Indicators:</strong> Clear visual focus indicators for keyboard navigation</li>
              </ul>
            </div>

            <div className="visual-section">
              <h4>Motion and Animation</h4>
              <ul>
                <li><strong>Reduced Motion:</strong> Minimizes animations for motion sensitivity</li>
                <li><strong>Game Speed:</strong> Adjustable simulation speed for comfortable viewing</li>
                <li><strong>Transition Control:</strong> Customizable animation durations</li>
              </ul>
            </div>

            <div className="visual-section">
              <h4>Contrast and Readability</h4>
              <p>All color combinations meet WCAG AA contrast requirements:</p>
              <ul>
                <li>Normal text: 4.5:1 contrast ratio minimum</li>
                <li>Large text: 3:1 contrast ratio minimum</li>
                <li>UI components: 3:1 contrast ratio minimum</li>
                <li>High contrast mode: Enhanced ratios for low vision</li>
              </ul>
            </div>
          </div>
        );

      case 'testing':
        return (
          <div className="guide-content">
            <h3>Accessibility Testing Guide</h3>
            
            <div className="testing-section">
              <h4>Keyboard Testing Checklist</h4>
              <div className="checklist">
                <label>
                  <input type="checkbox" />
                  All interactive elements are reachable via keyboard
                </label>
                <label>
                  <input type="checkbox" />
                  Tab order is logical and intuitive
                </label>
                <label>
                  <input type="checkbox" />
                  Focus indicators are clearly visible
                </label>
                <label>
                  <input type="checkbox" />
                  No keyboard traps (can always navigate away)
                </label>
                <label>
                  <input type="checkbox" />
                  Escape key closes modals and menus
                </label>
                <label>
                  <input type="checkbox" />
                  Arrow keys work for game board navigation
                </label>
                <label>
                  <input type="checkbox" />
                  Shortcuts work as documented
                </label>
              </div>
            </div>

            <div className="testing-section">
              <h4>Screen Reader Testing Checklist</h4>
              <div className="checklist">
                <label>
                  <input type="checkbox" />
                  All images have appropriate alt text
                </label>
                <label>
                  <input type="checkbox" />
                  Headings create logical document structure
                </label>
                <label>
                  <input type="checkbox" />
                  Interactive elements have accessible names
                </label>
                <label>
                  <input type="checkbox" />
                  Form labels are properly associated
                </label>
                <label>
                  <input type="checkbox" />
                  Status changes are announced
                </label>
                <label>
                  <input type="checkbox" />
                  Error messages are clear and helpful
                </label>
                <label>
                  <input type="checkbox" />
                  Live regions announce game events
                </label>
              </div>
            </div>

            <div className="testing-section">
              <h4>Visual Testing Checklist</h4>
              <div className="checklist">
                <label>
                  <input type="checkbox" />
                  Text contrast meets WCAG standards
                </label>
                <label>
                  <input type="checkbox" />
                  Color is not the only way to convey information
                </label>
                <label>
                  <input type="checkbox" />
                  Interface works at 200% zoom
                </label>
                <label>
                  <input type="checkbox" />
                  All colorblind palettes function correctly
                </label>
                <label>
                  <input type="checkbox" />
                  High contrast mode is usable
                </label>
                <label>
                  <input type="checkbox" />
                  Motion can be reduced or disabled
                </label>
                <label>
                  <input type="checkbox" />
                  Text size adjustments work properly
                </label>
              </div>
            </div>

            <div className="testing-section">
              <h4>Testing Tools</h4>
              <ul>
                <li><strong>axe DevTools:</strong> Browser extension for automated accessibility testing</li>
                <li><strong>WAVE:</strong> Web accessibility evaluation tool</li>
                <li><strong>Lighthouse:</strong> Built-in accessibility audit in Chrome DevTools</li>
                <li><strong>Colour Contrast Analyser:</strong> Test color combinations</li>
                <li><strong>NoCoffee:</strong> Vision impairment simulator</li>
              </ul>
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="guide-content">
            <h3>Support & Feedback</h3>
            
            <div className="support-section">
              <h4>Getting Help</h4>
              <p>
                If you encounter accessibility issues or need assistance, here are ways to get help:
              </p>
              <ul>
                <li><strong>In-Game Help:</strong> Press F1 for keyboard shortcuts and help</li>
                <li><strong>Accessibility Settings:</strong> Press Ctrl+Shift+A to open accessibility panel</li>
                <li><strong>GitHub Issues:</strong> Report bugs or request features on our repository</li>
                <li><strong>Email Support:</strong> Contact our accessibility team directly</li>
              </ul>
            </div>

            <div className="support-section">
              <h4>Feedback and Suggestions</h4>
              <p>
                Your feedback helps us improve accessibility. Please share:
              </p>
              <ul>
                <li>Accessibility barriers you encounter</li>
                <li>Features that work well for you</li>
                <li>Suggestions for improvements</li>
                <li>New accessibility features you'd like to see</li>
              </ul>
            </div>

            <div className="support-section">
              <h4>Accessibility Statement</h4>
              <p>
                We are committed to ensuring digital accessibility for people with diverse abilities. 
                We continually improve the user experience for everyone and apply relevant accessibility standards.
              </p>
              
              <h5>Conformance Status</h5>
              <p>
                Antopolis partially conforms to WCAG 2.1 Level AA. "Partially conforms" means that 
                some parts of the content do not fully conform to the accessibility standard.
              </p>
              
              <h5>Known Issues</h5>
              <ul>
                <li>Some complex game visualizations may not be fully described for screen readers</li>
                <li>Real-time simulation elements may update too frequently for some users</li>
                <li>Some third-party components may not meet all accessibility requirements</li>
              </ul>
            </div>

            <div className="support-section">
              <h4>Assessment and Updates</h4>
              <p>
                This accessibility statement was created on December 19, 2024. 
                It was last reviewed and updated on December 19, 2024.
              </p>
              <p>
                We assess the accessibility of Antopolis through:
              </p>
              <ul>
                <li>Self-evaluation using automated and manual testing</li>
                <li>User feedback from the accessibility community</li>
                <li>Regular reviews with accessibility experts</li>
                <li>Continuous monitoring and improvement</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="accessibility-guide-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="accessibility-guide-title"
      >
        <motion.div
          className="accessibility-guide"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="guide-header">
            <h2 id="accessibility-guide-title" className="guide-title">
              <span className="title-icon" aria-hidden="true">♿</span>
              Accessibility Guide
            </h2>
            <button
              className="close-button"
              onClick={onClose}
              aria-label="Close accessibility guide"
            >
              ×
            </button>
          </div>

          <div className="guide-body">
            {/* Navigation */}
            <nav className="guide-navigation" role="tablist" aria-label="Guide sections">
              {sections.map((section) => (
                <button
                  key={section.id}
                  className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                  role="tab"
                  aria-selected={activeSection === section.id}
                  aria-controls={`guide-panel-${section.id}`}
                >
                  <span className="nav-icon" aria-hidden="true">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="guide-content-wrapper"
              id={`guide-panel-${activeSection}`}
              role="tabpanel"
              aria-labelledby={`guide-tab-${activeSection}`}
            >
              {renderContent()}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="guide-footer">
            <p className="footer-note">
              For additional support or to report accessibility issues, 
              please contact our accessibility team or visit our GitHub repository.
            </p>
            <button className="close-guide-button" onClick={onClose}>
              Close Guide
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AccessibilityGuide; 
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';
import { useAccessibility } from '../../store/AccessibilityContext';

/**
 * TutorialSettings - Comprehensive tutorial settings and accessibility features
 * Part of subtask 22.5: Tutorial Settings and Accessibility Features
 */
const TutorialSettings = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [confirmAction, setConfirmAction] = useState(null);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  
  const { 
    settings: tutorialSettings, 
    updateSettings, 
    resetTutorial, 
    skipTutorial,
    completeTutorial,
    getProgressPercentage,
    isStepCompleted,
    TUTORIAL_STEPS
  } = useTutorial();

  const { 
    settings: accessibilitySettings,
    updateSettings: updateAccessibilitySettings 
  } = useAccessibility();

  const [localSettings, setLocalSettings] = useState({
    tutorial: { ...tutorialSettings },
    accessibility: { ...accessibilitySettings }
  });

  useEffect(() => {
    if (isOpen) {
      loadTutorialAnalytics();
    }
  }, [isOpen]);

  const loadTutorialAnalytics = async () => {
    try {
      // Load tutorial completion analytics
      const response = await fetch('/api/tutorial/analytics/funnel');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.warn('Failed to load tutorial analytics:', error);
    }
  };

  const handleSettingChange = (category, setting, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    setSettingsChanged(true);
  };

  const saveSettings = async () => {
    try {
      // Update tutorial settings
      updateSettings(localSettings.tutorial);
      
      // Update accessibility settings
      updateAccessibilitySettings(localSettings.accessibility);
      
      setSettingsChanged(false);
      
      // Show success message
      window.dispatchEvent(new CustomEvent('ui:show-success', {
        detail: { message: 'Tutorial settings saved successfully!' }
      }));
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      window.dispatchEvent(new CustomEvent('ui:show-error', {
        detail: { message: 'Failed to save settings. Please try again.' }
      }));
    }
  };

  const handleResetTutorial = async () => {
    try {
      resetTutorial();
      setConfirmAction(null);
      
      window.dispatchEvent(new CustomEvent('ui:show-success', {
        detail: { message: 'Tutorial progress reset successfully!' }
      }));
      
      onClose();
    } catch (error) {
      console.error('Failed to reset tutorial:', error);
    }
  };

  const handleSkipTutorial = async () => {
    try {
      skipTutorial();
      setConfirmAction(null);
      
      window.dispatchEvent(new CustomEvent('ui:show-success', {
        detail: { message: 'Tutorial skipped successfully!' }
      }));
      
      onClose();
    } catch (error) {
      console.error('Failed to skip tutorial:', error);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Escape') {
      onClose();
    } else if (event.key === 'Enter' && event.ctrlKey) {
      saveSettings();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'accessibility', name: 'Accessibility', icon: '♿' },
    { id: 'progress', name: 'Progress', icon: '📈' },
    { id: 'help', name: 'Help', icon: '❓' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🎓</span>
              <div>
                <h2 className="text-xl font-bold text-white">Tutorial Settings</h2>
                <p className="text-blue-100 text-sm">Customize your learning experience</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 h-full">
            <nav className="p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors mb-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {activeTab === 'general' && (
              <GeneralSettings
                settings={localSettings.tutorial}
                onChange={(setting, value) => handleSettingChange('tutorial', setting, value)}
                onResetTutorial={() => setConfirmAction('reset')}
                onSkipTutorial={() => setConfirmAction('skip')}
              />
            )}

            {activeTab === 'accessibility' && (
              <AccessibilitySettings
                settings={localSettings.accessibility}
                onChange={(setting, value) => handleSettingChange('accessibility', setting, value)}
              />
            )}

            {activeTab === 'progress' && (
              <ProgressTab
                getProgressPercentage={getProgressPercentage}
                isStepCompleted={isStepCompleted}
                TUTORIAL_STEPS={TUTORIAL_STEPS}
                analytics={analytics}
              />
            )}

            {activeTab === 'help' && (
              <HelpTab />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {settingsChanged && (
                <span className="text-amber-600">⚠️ You have unsaved changes</span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              >
                Cancel
              </button>
              {settingsChanged && (
                <button
                  onClick={saveSettings}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            💡 Use Ctrl+Enter to save quickly | Press Esc to close
          </div>
        </div>
      </motion.div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {confirmAction && (
          <ConfirmationModal
            action={confirmAction}
            onConfirm={confirmAction === 'reset' ? handleResetTutorial : handleSkipTutorial}
            onCancel={() => setConfirmAction(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * General Settings Tab
 */
const GeneralSettings = ({ settings, onChange, onResetTutorial, onSkipTutorial }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">General Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Show Tooltips</label>
              <p className="text-sm text-gray-500">Display helpful tooltips during the tutorial</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showTooltips}
                onChange={(e) => onChange('showTooltips', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Auto Progress</label>
              <p className="text-sm text-gray-500">Automatically advance to next step when conditions are met</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoProgress}
                onChange={(e) => onChange('autoProgress', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Skip Introduction</label>
              <p className="text-sm text-gray-500">Skip the welcome screen for future visits</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.skipIntroduction}
                onChange={(e) => onChange('skipIntroduction', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="font-medium text-gray-700 block mb-2">Reminder Frequency</label>
            <select
              value={settings.reminderFrequency}
              onChange={(e) => onChange('reminderFrequency', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="none">None</option>
              <option value="low">Low (Weekly)</option>
              <option value="normal">Normal (Every 3 days)</option>
              <option value="high">High (Daily)</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">How often to remind you to continue the tutorial</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutorial Actions</h3>
        
        <div className="space-y-3">
          <button
            onClick={onResetTutorial}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Restart Tutorial</span>
          </button>
          
          <button
            onClick={onSkipTutorial}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Skip Tutorial</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Accessibility Settings Tab
 */
const AccessibilitySettings = ({ settings, onChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accessibility Features</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">High Contrast Mode</label>
              <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => onChange('highContrast', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Reduce Motion</label>
              <p className="text-sm text-gray-500">Minimize animations and transitions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reduceMotion}
                onChange={(e) => onChange('reduceMotion', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Screen Reader Support</label>
              <p className="text-sm text-gray-500">Enhanced compatibility with screen readers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.screenReaderSupport}
                onChange={(e) => onChange('screenReaderSupport', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="font-medium text-gray-700 block mb-2">Text Size</label>
            <select
              value={settings.textSize}
              onChange={(e) => onChange('textSize', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div>
            <label className="font-medium text-gray-700 block mb-2">Color Palette</label>
            <select
              value={settings.colorPalette}
              onChange={(e) => onChange('colorPalette', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="default">Default</option>
              <option value="protanopia">Protanopia Friendly</option>
              <option value="deuteranopia">Deuteranopia Friendly</option>
              <option value="tritanopia">Tritanopia Friendly</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyboard Navigation</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Tutorial Shortcuts</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Next step:</span>
              <code className="bg-gray-200 px-2 py-1 rounded">Space / Enter</code>
            </div>
            <div className="flex justify-between">
              <span>Previous step:</span>
              <code className="bg-gray-200 px-2 py-1 rounded">Backspace</code>
            </div>
            <div className="flex justify-between">
              <span>Skip step:</span>
              <code className="bg-gray-200 px-2 py-1 rounded">Ctrl + S</code>
            </div>
            <div className="flex justify-between">
              <span>Help:</span>
              <code className="bg-gray-200 px-2 py-1 rounded">F1 / ?</code>
            </div>
            <div className="flex justify-between">
              <span>Exit tutorial:</span>
              <code className="bg-gray-200 px-2 py-1 rounded">Escape</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Progress Tab
 */
const ProgressTab = ({ getProgressPercentage, isStepCompleted, TUTORIAL_STEPS, analytics }) => {
  const completedSteps = Object.values(TUTORIAL_STEPS).filter(step => isStepCompleted(step));
  const totalSteps = Object.values(TUTORIAL_STEPS).length;
  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h3>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-gray-900">{progressPercentage}%</span>
            <span className="text-sm text-gray-600">{completedSteps.length} of {totalSteps} steps</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{completedSteps.length}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{totalSteps - completedSteps.length}</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {progressPercentage === 100 ? '🎉' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">
                {progressPercentage === 100 ? 'Complete!' : 'In Progress'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {analytics && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutorial Analytics</h3>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xl font-bold text-gray-900">{analytics.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">
                  {Math.round((completedSteps.length / analytics.totalUsers) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Avg Completion</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Help Tab
 */
const HelpTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Help</h3>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Need Immediate Help?</h4>
            <p className="text-blue-800 text-sm mb-3">
              Click the blue help button (?) in the bottom-left corner of your screen for context-sensitive assistance.
            </p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Show me where →
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">🎯 Stuck on a Step?</h4>
            <p className="text-green-800 text-sm mb-3">
              Each tutorial step has specific objectives. Check the task panel for detailed guidance and tips.
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">⌨️ Keyboard Users</h4>
            <p className="text-purple-800 text-sm mb-3">
              Navigate the tutorial using keyboard shortcuts. Press ? or F1 for a full list of available shortcuts.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
        
        <div className="space-y-3">
          <details className="bg-gray-50 rounded-lg">
            <summary className="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-100">
              Can I skip parts of the tutorial?
            </summary>
            <div className="p-3 pt-0 text-sm text-gray-600">
              Yes! Most tutorial sections can be skipped if you're already familiar with the features. 
              However, some core steps are required for game progression.
            </div>
          </details>

          <details className="bg-gray-50 rounded-lg">
            <summary className="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-100">
              How do I restart the tutorial?
            </summary>
            <div className="p-3 pt-0 text-sm text-gray-600">
              Use the "Restart Tutorial" button in the General settings tab. This will reset all progress 
              and start fresh from the beginning.
            </div>
          </details>

          <details className="bg-gray-50 rounded-lg">
            <summary className="p-3 cursor-pointer font-medium text-gray-700 hover:bg-gray-100">
              Are my tutorial rewards saved?
            </summary>
            <div className="p-3 pt-0 text-sm text-gray-600">
              Yes! All tutorial rewards are automatically saved to your account and will persist 
              even if you restart or skip parts of the tutorial.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

/**
 * Confirmation Modal
 */
const ConfirmationModal = ({ action, onConfirm, onCancel }) => {
  const actionConfig = {
    reset: {
      title: 'Reset Tutorial Progress',
      message: 'This will reset all your tutorial progress and start from the beginning. Your rewards will be kept.',
      confirmText: 'Reset Tutorial',
      icon: '🔄',
      color: 'yellow'
    },
    skip: {
      title: 'Skip Tutorial',
      message: 'This will mark the tutorial as complete and you can start playing immediately.',
      confirmText: 'Skip Tutorial',
      icon: '⏭️',
      color: 'gray'
    }
  };

  const config = actionConfig[action];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
      >
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-3xl">{config.icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{config.message}</p>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 bg-${config.color}-500 hover:bg-${config.color}-600 text-white rounded transition-colors`}
          >
            {config.confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TutorialSettings; 
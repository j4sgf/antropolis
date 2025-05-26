import React from 'react';
import { motion } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';

const TutorialPanel = ({ isMinimized = false, onToggleMinimize }) => {
  const {
    isActive,
    currentStep,
    currentGroup,
    getStepData,
    getProgressPercentage,
    getCurrentGroupSteps,
    completedSteps,
    TUTORIAL_GROUPS
  } = useTutorial();

  if (!isActive) {
    return null;
  }

  const stepData = currentStep ? getStepData(currentStep) : null;
  const progressPercentage = getProgressPercentage();
  const currentGroupSteps = getCurrentGroupSteps();
  const currentStepIndex = currentGroupSteps.indexOf(currentStep);

  const groupNames = {
    SETUP: 'Setup',
    UI_BASICS: 'Interface Basics',
    COLONY_MANAGEMENT: 'Colony Management',
    SIMULATION: 'Simulation',
    ADVANCED: 'Advanced Features',
    COMBAT: 'Combat',
    COMPLETION: 'Completion'
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-4 right-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-3"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
            ?
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {stepData?.title || 'Tutorial'}
            </div>
            <div className="text-xs text-gray-500">
              {progressPercentage}% complete
            </div>
          </div>
          <button
            onClick={onToggleMinimize}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 right-4 z-40 bg-white rounded-lg shadow-xl border border-gray-200 w-80"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
              ?
            </div>
            <div>
              <h3 className="font-semibold">Tutorial</h3>
              <p className="text-xs text-blue-100">{groupNames[currentGroup] || currentGroup}</p>
            </div>
          </div>
          <button
            onClick={onToggleMinimize}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>Overall Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-blue-400 rounded-full h-2">
            <motion.div
              className="bg-white rounded-full h-2"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Current step */}
      {stepData && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0 mt-1">
              {currentStepIndex + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {stepData.title}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {stepData.content}
              </p>
              
              {/* Rewards */}
              {stepData.rewards && (
                <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                  <div className="flex items-center mb-1">
                    <span className="text-yellow-600 text-xs mr-1">🎁</span>
                    <span className="text-xs font-medium text-yellow-800">Rewards</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(stepData.rewards).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded"
                      >
                        +{value} {key}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Group progress */}
      {currentGroupSteps.length > 1 && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">
              {groupNames[currentGroup]} Steps
            </span>
            <span className="text-xs text-gray-500">
              {currentStepIndex + 1} of {currentGroupSteps.length}
            </span>
          </div>
          
          <div className="space-y-2">
            {currentGroupSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(step);
              const isCurrent = index === currentStepIndex;
              const stepInfo = getStepData ? getStepData(step) : null;
              
              return (
                <div
                  key={step}
                  className={`flex items-center space-x-2 text-xs ${
                    isCurrent
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? 'bg-blue-100 text-blue-600'
                        : isCompleted
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className="flex-1 truncate">
                    {stepInfo?.title || step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="p-3 bg-gray-50 rounded-b-lg">
        <div className="flex justify-between items-center">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('tutorial:help'))}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Need help?
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('tutorial:skip'))}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('tutorial:next'))}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TutorialPanel; 
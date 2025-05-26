import React from 'react';
import { motion } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';

const TutorialStarter = ({ 
  children, 
  className = '',
  variant = 'button', // 'button', 'card', 'banner'
  startStep = null 
}) => {
  const { 
    startTutorial, 
    shouldShowTutorial, 
    isCompleted, 
    isSkipped,
    getProgressPercentage 
  } = useTutorial();

  const handleStartTutorial = () => {
    startTutorial(startStep);
  };

  const progressPercentage = getProgressPercentage();

  // Don't show if tutorial is completed
  if (isCompleted) {
    return null;
  }

  // Button variant
  if (variant === 'button') {
    return (
      <button
        onClick={handleStartTutorial}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors ${className}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{children || (isSkipped ? 'Resume Tutorial' : 'Start Tutorial')}</span>
      </button>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg cursor-pointer ${className}`}
        onClick={handleStartTutorial}
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">
              {isSkipped ? 'Resume Tutorial' : 'Learn Antopolis'}
            </h3>
            <p className="text-blue-100 text-sm">
              {isSkipped 
                ? `Continue from where you left off (${progressPercentage}% complete)`
                : 'Get started with a guided tour of all game features'
              }
            </p>
            {progressPercentage > 0 && !isSkipped && (
              <div className="mt-2">
                <div className="w-full bg-blue-400 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-blue-200 mt-1">{progressPercentage}% complete</p>
              </div>
            )}
          </div>
          <div className="text-blue-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        {children && (
          <div className="mt-4 text-sm text-blue-100">
            {children}
          </div>
        )}
      </motion.div>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-blue-500 text-white p-4 ${className}`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">
                {isSkipped ? 'Resume your tutorial' : 'New to Antopolis?'}
              </h4>
              <p className="text-sm text-blue-100">
                {isSkipped 
                  ? `Continue learning (${progressPercentage}% complete)`
                  : 'Take a guided tour to learn all the features'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {children}
            <button
              onClick={handleStartTutorial}
              className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
            >
              {isSkipped ? 'Resume' : 'Start Tutorial'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default TutorialStarter; 
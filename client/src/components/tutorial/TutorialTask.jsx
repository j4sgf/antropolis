import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';

/**
 * TutorialTask - Interactive task component for tutorial steps
 * Part of subtask 22.4: Interactive Tutorial Tasks and Rewards
 */
const TutorialTask = ({ task, onComplete, onSkip }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [currentObjective, setCurrentObjective] = useState(0);
  const [taskAttempts, setTaskAttempts] = useState(0);
  const { getStepData, canCompleteCurrentStep } = useTutorial();

  useEffect(() => {
    // Check task completion status periodically
    const checkCompletion = setInterval(() => {
      if (task && canCompleteCurrentStep()) {
        handleTaskCompletion();
      }
    }, 1000);

    return () => clearInterval(checkCompletion);
  }, [task, canCompleteCurrentStep]);

  useEffect(() => {
    // Track task attempts for analytics
    if (task) {
      setTaskAttempts(prev => prev + 1);
    }
  }, [task]);

  const handleTaskCompletion = async () => {
    if (isCompleting) return;
    
    setIsCompleting(true);
    
    // Animate completion progress
    for (let i = 0; i <= 100; i += 10) {
      setCompletionProgress(i);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Show completion feedback
    setTimeout(() => {
      onComplete?.(task);
    }, 500);
  };

  const getTaskType = () => {
    if (!task) return 'default';
    
    if (task.id.includes('colony')) return 'colony';
    if (task.id.includes('ant') || task.id.includes('role')) return 'ant';
    if (task.id.includes('forag') || task.id.includes('resource')) return 'resource';
    if (task.id.includes('build') || task.id.includes('structure')) return 'building';
    if (task.id.includes('battle') || task.id.includes('combat')) return 'combat';
    if (task.id.includes('evolution') || task.id.includes('tech')) return 'evolution';
    
    return 'default';
  };

  const getTaskIcon = () => {
    const type = getTaskType();
    const icons = {
      colony: '🏛️',
      ant: '🐜',
      resource: '🍄',
      building: '🏗️',
      combat: '⚔️',
      evolution: '🧬',
      default: '🎯'
    };
    return icons[type];
  };

  const getTaskColor = () => {
    const type = getTaskType();
    const colors = {
      colony: 'blue',
      ant: 'green',
      resource: 'yellow',
      building: 'purple',
      combat: 'red',
      evolution: 'indigo',
      default: 'gray'
    };
    return colors[type];
  };

  const getDifficultyIndicator = () => {
    if (!task?.estimatedTime) return null;
    
    const time = parseInt(task.estimatedTime);
    if (time <= 60) return { level: 'Easy', color: 'green' };
    if (time <= 120) return { level: 'Medium', color: 'yellow' };
    return { level: 'Advanced', color: 'red' };
  };

  const getObjectives = () => {
    if (!task?.detailedContent) return [];
    
    return task.detailedContent.map((content, index) => ({
      id: index,
      text: content.replace(/^[🔸🔹•]\s*/, ''),
      isCompleted: index < currentObjective,
      isCurrent: index === currentObjective
    }));
  };

  if (!task) return null;

  const color = getTaskColor();
  const difficulty = getDifficultyIndicator();
  const objectives = getObjectives();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white border-2 border-${color}-200 rounded-lg shadow-lg p-6 max-w-md mx-auto`}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-${color}-100 rounded-full flex items-center justify-center`}>
            <span className="text-2xl">{getTaskIcon()}</span>
          </div>
          <div>
            <h3 className={`font-bold text-${color}-900 text-lg`}>
              {task.title}
            </h3>
            {difficulty && (
              <span className={`text-xs px-2 py-1 rounded-full bg-${difficulty.color}-100 text-${difficulty.color}-800`}>
                {difficulty.level}
              </span>
            )}
          </div>
        </div>
        
        {task.canSkip && (
          <button
            onClick={() => onSkip?.(task)}
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            Skip
          </button>
        )}
      </div>

      {/* Task Description */}
      <div className="mb-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {task.content}
        </p>
      </div>

      {/* Objectives List */}
      {objectives.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">
            Objectives:
          </h4>
          <div className="space-y-2">
            {objectives.map((objective) => (
              <motion.div
                key={objective.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: objective.id * 0.1 }}
                className={`flex items-center space-x-3 p-2 rounded ${
                  objective.isCompleted
                    ? 'bg-green-50 border border-green-200'
                    : objective.isCurrent
                    ? `bg-${color}-50 border border-${color}-200`
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  objective.isCompleted
                    ? 'bg-green-500 text-white'
                    : objective.isCurrent
                    ? `bg-${color}-500 text-white`
                    : 'bg-gray-300'
                }`}>
                  {objective.isCompleted ? (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{objective.id + 1}</span>
                  )}
                </div>
                <span className={`text-sm ${
                  objective.isCompleted ? 'text-green-800 line-through' : 'text-gray-700'
                }`}>
                  {objective.text}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Progress */}
      {isCompleting && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Completing...</span>
            <span className="text-sm text-gray-500">{completionProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={`bg-${color}-500 h-2 rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${completionProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>
      )}

      {/* Help Text */}
      {task.helpText && (
        <div className={`p-3 bg-${color}-50 border border-${color}-200 rounded-lg mb-4`}>
          <div className="flex items-start space-x-2">
            <span className="text-lg">💡</span>
            <p className={`text-${color}-800 text-sm`}>
              {task.helpText}
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      {task.tips && task.tips.length > 0 && (
        <div className="mb-4">
          <button
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            onClick={() => setShowTips(!showTips)}
          >
            <span>💡 Show Tips</span>
            <svg className={`w-4 h-4 transition-transform ${showTips ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <AnimatePresence>
            {showTips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-1"
              >
                {task.tips.map((tip, index) => (
                  <p key={index} className="text-xs text-gray-600 pl-4 border-l-2 border-gray-200">
                    {tip}
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Task Actions */}
      <div className="flex space-x-2">
        {canCompleteCurrentStep() ? (
          <button
            onClick={handleTaskCompletion}
            disabled={isCompleting}
            className={`flex-1 bg-${color}-500 hover:bg-${color}-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center space-x-2`}
          >
            {isCompleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Completing...</span>
              </>
            ) : (
              <>
                <span>Complete Task</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        ) : (
          <div className={`flex-1 bg-gray-100 text-gray-500 font-medium py-2 px-4 rounded text-center`}>
            Follow instructions above
          </div>
        )}
      </div>

      {/* Task Metadata */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          {task.estimatedTime && (
            <span>⏱️ ~{task.estimatedTime}</span>
          )}
          {taskAttempts > 1 && (
            <span>🔄 Attempt {taskAttempts}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Hook for managing tutorial task state
export const useTutorialTask = () => {
  const [showTips, setShowTips] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  
  const recordTaskCompletion = (task, timeSpent) => {
    const completion = {
      taskId: task.id,
      completedAt: new Date().toISOString(),
      timeSpent,
      attempts: taskAttempts
    };
    
    setTaskHistory(prev => [...prev, completion]);
    
    // Send analytics data
    window.dispatchEvent(new CustomEvent('tutorial:task-completed', {
      detail: completion
    }));
  };

  return {
    showTips,
    setShowTips,
    taskHistory,
    recordTaskCompletion
  };
};

export default TutorialTask; 
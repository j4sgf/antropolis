import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './UpgradeSuccessNotification.css';

const UpgradeSuccessNotification = ({ 
  isVisible, 
  onClose, 
  onUndo, 
  tech, 
  remainingPoints,
  pointsSpent,
  undoTimeLimit = 10000 // 10 seconds
}) => {
  const [timeLeft, setTimeLeft] = useState(undoTimeLimit / 1000);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setTimeLeft(undoTimeLimit / 1000);
      setIsUndoing(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, undoTimeLimit);

    return () => {
      clearInterval(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [isVisible, undoTimeLimit, onClose]);

  if (!isVisible || !tech) return null;

  // Get category-specific icon and color
  const getCategoryData = () => {
    const categories = {
      physical: { icon: '💪', color: '#e74c3c', name: 'Physical' },
      specialized: { icon: '🎯', color: '#3498db', name: 'Specialized' },
      environmental: { icon: '🌍', color: '#27ae60', name: 'Environmental' },
      combat: { icon: '⚔️', color: '#e67e22', name: 'Combat' },
      efficiency: { icon: '⚡', color: '#9b59b6', name: 'Efficiency' }
    };
    return categories[tech.category] || { icon: '🧬', color: '#4CAF50', name: 'Evolution' };
  };

  const categoryData = getCategoryData();

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await onUndo(tech);
    } catch (error) {
      console.error('Failed to undo upgrade:', error);
      setIsUndoing(false);
    }
  };

  const progressPercentage = ((undoTimeLimit / 1000 - timeLeft) / (undoTimeLimit / 1000)) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="upgrade-success-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="upgrade-success-notification"
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          style={{ '--category-color': categoryData.color }}
        >
          {/* Celebration Effects */}
          <div className="celebration-effects">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="celebration-particle"
                style={{
                  '--angle': `${i * 30}deg`,
                  '--delay': `${i * 0.1}s`
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: [0, Math.cos(i * 30 * Math.PI / 180) * 100],
                  y: [0, Math.sin(i * 30 * Math.PI / 180) * 100]
                }}
                transition={{ 
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              >
                {i % 4 === 0 ? '✨' : i % 4 === 1 ? '🎉' : i % 4 === 2 ? '⭐' : '💫'}
              </motion.div>
            ))}
          </div>

          {/* Success Header */}
          <div className="success-header">
            <motion.div 
              className="success-icon"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", bounce: 0.4 }}
            >
              ✅
            </motion.div>
            <motion.h2 
              className="success-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Upgrade Successful!
            </motion.h2>
          </div>

          {/* Upgrade Details */}
          <motion.div 
            className="upgrade-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="tech-info">
              <div className="tech-icon-success">
                {categoryData.icon}
              </div>
              <div className="tech-text">
                <h3 className="tech-name">{tech.name}</h3>
                <span className="tech-category">{categoryData.name} Evolution</span>
              </div>
            </div>

            <div className="points-summary">
              <div className="points-spent">
                <span className="points-label">Points Spent:</span>
                <span className="points-value spent">-{pointsSpent}</span>
              </div>
              <div className="points-remaining">
                <span className="points-label">Remaining:</span>
                <span className="points-value remaining">{remainingPoints}</span>
              </div>
            </div>
          </motion.div>

          {/* Key Effects Preview */}
          <motion.div 
            className="key-effects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h4>New Abilities Unlocked:</h4>
            <div className="effects-preview">
              {Object.entries(tech.effects || {}).slice(0, 3).map(([key, value]) => {
                const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                const formattedValue = typeof value === 'boolean' 
                  ? (value ? 'Enabled' : 'Disabled')
                  : typeof value === 'number' && key.includes('bonus')
                  ? `+${value}%`
                  : typeof value === 'number' && key.includes('multiplier')
                  ? `×${value}`
                  : value;
                
                return (
                  <motion.div 
                    key={key}
                    className="effect-preview"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + Object.keys(tech.effects).indexOf(key) * 0.1 }}
                  >
                    <span className="effect-icon">🔹</span>
                    <span className="effect-text">{formattedKey}: {formattedValue}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Undo Section */}
          <motion.div 
            className="undo-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="undo-timer">
              <div className="timer-text">
                Undo available for {timeLeft} seconds
              </div>
              <div className="timer-progress">
                <motion.div 
                  className="progress-bar"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="undo-button"
                onClick={handleUndo}
                disabled={isUndoing || timeLeft <= 0}
              >
                {isUndoing ? (
                  <>
                    <span className="loading-spinner">🔄</span>
                    Undoing...
                  </>
                ) : (
                  <>
                    <span className="undo-icon">↶</span>
                    Undo Purchase
                  </>
                )}
              </button>
              
              <button 
                className="close-button"
                onClick={onClose}
              >
                <span className="close-icon">✓</span>
                Keep Upgrade
              </button>
            </div>
          </motion.div>

          {/* Auto-close Progress */}
          <div className="auto-close-indicator">
            <motion.div 
              className="auto-close-progress"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: undoTimeLimit / 1000, ease: "linear" }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeSuccessNotification; 
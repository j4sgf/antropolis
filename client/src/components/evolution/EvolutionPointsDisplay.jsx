import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './EvolutionPointsDisplay.css';

const EvolutionPointsDisplay = ({ points, showHistory = false, onHistoryToggle }) => {
  const [previousPoints, setPreviousPoints] = useState(points);
  const [pointChange, setPointChange] = useState(0);
  const [showChange, setShowChange] = useState(false);

  // Animate point changes
  useEffect(() => {
    if (points !== previousPoints) {
      const change = points - previousPoints;
      setPointChange(change);
      setShowChange(true);
      setPreviousPoints(points);

      // Hide change indicator after animation
      const timer = setTimeout(() => {
        setShowChange(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [points, previousPoints]);

  // Format large numbers
  const formatPoints = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  };

  // Get point tier for styling
  const getPointTier = () => {
    if (points >= 1000) return 'legendary';
    if (points >= 500) return 'epic';
    if (points >= 200) return 'rare';
    if (points >= 50) return 'uncommon';
    return 'common';
  };

  return (
    <div className={`evolution-points-display ${getPointTier()}`}>
      <div className="points-container">
        <div className="points-icon">
          🧬
        </div>
        
        <div className="points-info">
          <div className="points-label">Evolution Points</div>
          <motion.div 
            className="points-value"
            key={points}
            initial={{ scale: 1.2, color: '#4CAF50' }}
            animate={{ scale: 1, color: 'inherit' }}
            transition={{ duration: 0.3 }}
          >
            {formatPoints(points)}
          </motion.div>
        </div>

        {/* Point change indicator */}
        <AnimatePresence>
          {showChange && pointChange !== 0 && (
            <motion.div
              className={`point-change ${pointChange > 0 ? 'positive' : 'negative'}`}
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -30, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.8 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              {pointChange > 0 ? '+' : ''}{pointChange}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History toggle button */}
        {onHistoryToggle && (
          <button 
            className="history-toggle"
            onClick={onHistoryToggle}
            title="View evolution point history"
          >
            📊
          </button>
        )}
      </div>

      {/* Point tier indicator */}
      <div className="tier-indicator">
        <div className="tier-progress">
          <div className="tier-bar">
            <motion.div 
              className="tier-fill"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (points % 100))}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="tier-label">{getPointTier().toUpperCase()}</span>
        </div>
      </div>

      {/* Earning rate indicator (if available) */}
      <div className="earning-rate">
        <span className="rate-icon">⚡</span>
        <span className="rate-text">+{Math.floor(points / 10)} per hour</span>
      </div>
    </div>
  );
};

export default EvolutionPointsDisplay; 
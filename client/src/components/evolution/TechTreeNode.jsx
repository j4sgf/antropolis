import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './TechTreeNode.css';

const TechTreeNode = ({ 
  tech, 
  status, 
  isUnlocked, 
  canAfford, 
  isAvailable, 
  onClick, 
  onUnlock, 
  onClose,
  detailed = false 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get status-specific styling
  const getStatusClass = () => {
    if (isUnlocked) return 'unlocked';
    if (!isAvailable) return 'locked';
    if (!canAfford) return 'unaffordable';
    return 'available';
  };

  // Get category-specific icon
  const getCategoryIcon = () => {
    const icons = {
      physical: '💪',
      specialized: '🎯',
      environmental: '🌍',
      combat: '⚔️',
      efficiency: '⚡'
    };
    return icons[tech.category] || '🧬';
  };

  // Format effects for display
  const formatEffects = (effects) => {
    return Object.entries(effects).map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const formattedValue = typeof value === 'boolean' 
        ? (value ? 'Yes' : 'No')
        : typeof value === 'number' && key.includes('bonus')
        ? `+${value}%`
        : value;
      
      return { key: formattedKey, value: formattedValue };
    });
  };

  // Handle click action
  const handleClick = () => {
    if (onClick) {
      onClick(tech);
    }
  };

  // Handle unlock action
  const handleUnlock = (e) => {
    e.stopPropagation();
    if (onUnlock && isAvailable && canAfford && !isUnlocked) {
      onUnlock(tech.id);
    }
  };

  if (detailed) {
    // Detailed modal view
    return (
      <div className="tech-node-detailed">
        <div className="tech-header">
          <div className="tech-icon-large">
            {getCategoryIcon()}
          </div>
          <div className="tech-title-section">
            <h2 className="tech-name">{tech.name}</h2>
            <span className="tech-category">{tech.category}</span>
          </div>
          {onClose && (
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          )}
        </div>

        <div className="tech-description">
          <p>{tech.description}</p>
        </div>

        <div className="tech-cost">
          <span className="cost-label">Evolution Points Required:</span>
          <span className={`cost-value ${canAfford ? 'affordable' : 'expensive'}`}>
            {tech.required_research_points}
          </span>
        </div>

        {tech.prerequisite_techs && tech.prerequisite_techs.length > 0 && (
          <div className="tech-prerequisites">
            <h4>Prerequisites:</h4>
            <ul>
              {tech.prerequisite_techs.map(prereqId => (
                <li key={prereqId} className="prerequisite-item">
                  {prereqId} {/* In a real app, you'd fetch the tech name */}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tech.required_buildings && tech.required_buildings.length > 0 && (
          <div className="tech-buildings">
            <h4>Required Buildings:</h4>
            <ul>
              {tech.required_buildings.map(building => (
                <li key={building} className="building-item">
                  {building.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="tech-effects">
          <h4>Effects:</h4>
          <div className="effects-grid">
            {formatEffects(tech.effects).map(({ key, value }) => (
              <div key={key} className="effect-item">
                <span className="effect-name">{key}:</span>
                <span className="effect-value">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {tech.visual_changes && Object.keys(tech.visual_changes).length > 0 && (
          <div className="tech-visual-changes">
            <h4>Visual Changes:</h4>
            <div className="visual-changes-grid">
              {Object.entries(tech.visual_changes).map(([key, value]) => (
                <div key={key} className="visual-change-item">
                  <span className="change-name">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </span>
                  <span className="change-value">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="tech-actions">
          {isUnlocked ? (
            <div className="unlocked-status">
              <span className="status-icon">✅</span>
              <span>Technology Unlocked</span>
            </div>
          ) : !isAvailable ? (
            <div className="locked-status">
              <span className="status-icon">🔒</span>
              <span>Prerequisites Required</span>
            </div>
          ) : !canAfford ? (
            <div className="unaffordable-status">
              <span className="status-icon">💰</span>
              <span>Insufficient Evolution Points</span>
            </div>
          ) : (
            <button 
              className="unlock-button"
              onClick={handleUnlock}
            >
              <span className="unlock-icon">🧬</span>
              Unlock Technology
            </button>
          )}
        </div>
      </div>
    );
  }

  // Compact tree view
  return (
    <motion.div
      className={`tech-tree-node ${getStatusClass()}`}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="tech-node-content">
        <div className="tech-icon">
          {getCategoryIcon()}
        </div>
        
        <div className="tech-info">
          <h4 className="tech-name">{tech.name}</h4>
          <p className="tech-cost">{tech.required_research_points} EP</p>
        </div>

        <div className="tech-status-indicator">
          {isUnlocked && <span className="status-icon unlocked">✅</span>}
          {!isUnlocked && !isAvailable && <span className="status-icon locked">🔒</span>}
          {!isUnlocked && isAvailable && !canAfford && <span className="status-icon unaffordable">💰</span>}
          {!isUnlocked && isAvailable && canAfford && <span className="status-icon available">🧬</span>}
        </div>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="tech-tooltip"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="tooltip-content">
              <h5>{tech.name}</h5>
              <p>{tech.description}</p>
              <div className="tooltip-cost">
                Cost: {tech.required_research_points} Evolution Points
              </div>
              {tech.prerequisite_techs.length > 0 && (
                <div className="tooltip-prereqs">
                  Prerequisites: {tech.prerequisite_techs.length} tech(s)
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick unlock button for available techs */}
      {!isUnlocked && isAvailable && canAfford && (
        <motion.button
          className="quick-unlock-button"
          onClick={handleUnlock}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          🧬
        </motion.button>
      )}
    </motion.div>
  );
};

export default TechTreeNode; 
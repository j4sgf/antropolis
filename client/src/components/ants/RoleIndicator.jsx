import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './RoleIndicator.css';
import { roleData } from '../../data/roleData';

const RoleIndicator = ({ 
  role, 
  size = 'medium', 
  showTooltip = true, 
  showText = false,
  className = '',
  onClick 
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  
  // Get role configuration
  const roleConfig = roleData[role] || roleData.worker;
  
  // Size variants
  const sizeClasses = {
    small: 'role-indicator-small',
    medium: 'role-indicator-medium',
    large: 'role-indicator-large'
  };

  const handleMouseEnter = () => {
    if (showTooltip) {
      setShowTooltipState(true);
    }
  };

  const handleMouseLeave = () => {
    setShowTooltipState(false);
  };

  return (
    <div className={`role-indicator-container ${className}`}>
      <motion.div
        className={`role-indicator ${sizeClasses[size]} ${roleConfig.colorClass}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        <span className="role-icon">{roleConfig.icon}</span>
        {showText && (
          <span className="role-text">{roleConfig.name}</span>
        )}
      </motion.div>

      {/* Tooltip */}
      {showTooltip && showTooltipState && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="role-tooltip"
        >
          <div className="tooltip-header">
            <span className="tooltip-icon">{roleConfig.icon}</span>
            <h4 className="tooltip-title">{roleConfig.name}</h4>
          </div>
          
          <p className="tooltip-description">{roleConfig.description}</p>
          
          <div className="tooltip-details">
            <div className="tooltip-section">
              <h5>Benefits:</h5>
              <ul>
                {roleConfig.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
            
            <div className="tooltip-section">
              <h5>Trade-offs:</h5>
              <ul>
                {roleConfig.tradeoffs.map((tradeoff, index) => (
                  <li key={index}>{tradeoff}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="tooltip-stats">
            <div className="stat-row">
              <span className="stat-label">Efficiency:</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ width: `${roleConfig.stats.efficiency}%` }}
                />
              </div>
              <span className="stat-value">{roleConfig.stats.efficiency}%</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Specialization:</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ width: `${roleConfig.stats.specialization}%` }}
                />
              </div>
              <span className="stat-value">{roleConfig.stats.specialization}%</span>
            </div>
          </div>

          {roleConfig.subRoles && roleConfig.subRoles.length > 0 && (
            <div className="tooltip-subroles">
              <h5>Specializations:</h5>
              <div className="subrole-badges">
                {roleConfig.subRoles.map((subRole, index) => (
                  <span key={index} className="subrole-badge">
                    {subRole}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tooltip arrow */}
          <div className="tooltip-arrow" />
        </motion.div>
      )}
    </div>
  );
};

export default RoleIndicator; 
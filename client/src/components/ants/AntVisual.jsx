import React from 'react';
import { motion } from 'framer-motion';
import { antVisualConfig } from '../../data/antVisualConfig';

/**
 * AntVisual - Main component for rendering ants with distinct visual characteristics
 * Part of Task 15.1: Create Ant Type Base Styling Components
 */
const AntVisual = ({ 
  ant, 
  size = 'medium', 
  showStatus = true, 
  showTooltip = false,
  onClick,
  className = '' 
}) => {
  const config = antVisualConfig[ant.role] || antVisualConfig.worker;
  const sizeConfig = antVisualConfig.sizes[size];
  
  const antClasses = `
    ant-visual ant-${ant.role.toLowerCase()} ant-size-${size}
    ${config.baseClasses}
    ${sizeConfig.classes}
    ${className}
  `;

  const handleClick = () => {
    if (onClick) {
      onClick(ant);
    }
  };

  return (
    <motion.div
      className={`relative inline-block cursor-pointer ${antClasses}`}
      onClick={handleClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      title={showTooltip ? `${ant.role} ${ant.name || 'Ant'}` : undefined}
    >
      {/* Ant Body */}
      <AntBody 
        role={ant.role} 
        config={config} 
        size={sizeConfig}
        level={ant.level || 1}
        health={ant.health || 100}
      />
      
      {/* Status Indicators */}
      {showStatus && (
        <AntStatusIndicators 
          ant={ant} 
          config={config}
          size={sizeConfig}
        />
      )}
      
      {/* Evolution/Level Indicators */}
      {ant.level > 1 && (
        <AntLevelIndicator 
          level={ant.level} 
          config={config}
          size={sizeConfig}
        />
      )}
    </motion.div>
  );
};

/**
 * AntBody - Core ant body with role-specific characteristics
 */
const AntBody = ({ role, config, size, level, health }) => {
  const healthPercentage = Math.max(0, Math.min(100, health));
  const isInjured = healthPercentage < 70;
  
  return (
    <div className={`ant-body ${config.bodyClasses}`} style={{
      width: size.width,
      height: size.height,
      ...config.bodyStyle,
      opacity: isInjured ? 0.7 : 1
    }}>
      {/* Head */}
      <div className={`ant-head ${config.headClasses}`}>
        {/* Eyes */}
        <div className="ant-eyes">
          <div className="ant-eye left" />
          <div className="ant-eye right" />
        </div>
        
        {/* Antennae - more prominent for scouts */}
        <div className={`ant-antennae ${role === 'scout' ? 'ant-antennae-prominent' : ''}`}>
          <div className="antenna left" />
          <div className="antenna right" />
        </div>
        
        {/* Mandibles - larger for soldiers */}
        {role === 'soldier' && (
          <div className="ant-mandibles">
            <div className="mandible left" />
            <div className="mandible right" />
          </div>
        )}
      </div>
      
      {/* Thorax */}
      <div className={`ant-thorax ${config.thoraxClasses}`}>
        {/* Legs */}
        <div className="ant-legs">
          {[1, 2, 3].map(legPair => (
            <div key={legPair} className={`leg-pair pair-${legPair}`}>
              <div className="leg left" />
              <div className="leg right" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Abdomen */}
      <div className={`ant-abdomen ${config.abdomenClasses}`}>
        {/* Special role indicators */}
        {role === 'nurse' && (
          <div className="nurse-sac" title="Brood care specialist" />
        )}
        {role === 'forager' && (
          <div className="forager-markings" title="Food storage adaptation" />
        )}
        {role === 'builder' && (
          <div className="builder-plates" title="Construction adaptation" />
        )}
      </div>
      
      {/* Health indicator */}
      {isInjured && (
        <div className="ant-injury-overlay" style={{
          background: `linear-gradient(45deg, transparent 40%, rgba(220, 38, 38, 0.3) 50%, transparent 60%)`
        }} />
      )}
    </div>
  );
};

/**
 * AntStatusIndicators - Visual status indicators for ant state
 */
const AntStatusIndicators = ({ ant, config, size }) => {
  const indicators = [];
  
  // Activity status
  if (ant.status === 'busy') {
    indicators.push(
      <div key="busy" className="status-indicator status-busy" title="Busy">
        <div className="busy-spinner" />
      </div>
    );
  } else if (ant.status === 'idle') {
    indicators.push(
      <div key="idle" className="status-indicator status-idle" title="Idle">
        <div className="idle-dot" />
      </div>
    );
  }
  
  // Special states
  if (ant.isCarrying) {
    indicators.push(
      <div key="carrying" className="status-indicator status-carrying" title="Carrying items">
        📦
      </div>
    );
  }
  
  if (ant.stamina < 30) {
    indicators.push(
      <div key="tired" className="status-indicator status-tired" title="Tired">
        💤
      </div>
    );
  }
  
  if (ant.health < 50) {
    indicators.push(
      <div key="injured" className="status-indicator status-injured" title="Injured">
        🩹
      </div>
    );
  }
  
  return (
    <div className="ant-status-indicators">
      {indicators}
    </div>
  );
};

/**
 * AntLevelIndicator - Shows ant level/experience progression
 */
const AntLevelIndicator = ({ level, config, size }) => {
  return (
    <div className="ant-level-indicator" title={`Level ${level}`}>
      <div className="level-badge">
        {level}
      </div>
      {level >= 5 && (
        <div className="level-stars">
          {Array.from({ length: Math.min(3, Math.floor(level / 5)) }, (_, i) => (
            <span key={i} className="level-star">⭐</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AntVisual; 
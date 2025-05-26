import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStatusColor } from '../../data/antVisualConfig';

/**
 * AntStatusBadge - Comprehensive status indicator for ants
 * Part of Task 15.2: Implement Status and State Indicators
 */
const AntStatusBadge = ({ 
  ant, 
  position = 'top-right',
  showDetails = false,
  size = 'medium',
  onStatusClick
}) => {
  const statusConfig = getStatusColor(ant.status);
  
  const positionClasses = {
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  const sizeClasses = {
    small: 'w-4 h-4 text-xs',
    medium: 'w-6 h-6 text-sm',
    large: 'w-8 h-8 text-base'
  };

  const getStatusIcon = (status) => {
    const icons = {
      idle: '😴',
      busy: '⚡',
      working: '🔨',
      foraging: '🍯',
      building: '🏗️',
      fighting: '⚔️',
      resting: '💤',
      eating: '🍃',
      patrol: '👁️',
      nurturing: '🤱',
      injured: '🩹',
      dead: '💀',
      evolving: '✨',
      carrying: '📦'
    };
    return icons[status] || '❓';
  };

  const getHealthIndicator = (health) => {
    if (health >= 80) return { color: '#10b981', icon: '💚', label: 'Healthy' };
    if (health >= 60) return { color: '#f59e0b', icon: '💛', label: 'Minor injuries' };
    if (health >= 40) return { color: '#ef4444', icon: '🧡', label: 'Injured' };
    if (health >= 20) return { color: '#dc2626', icon: '❤️', label: 'Critically injured' };
    return { color: '#7f1d1d', icon: '💔', label: 'Near death' };
  };

  const getStaminaIndicator = (stamina) => {
    if (stamina >= 80) return { color: '#3b82f6', icon: '⚡', label: 'Energetic' };
    if (stamina >= 60) return { color: '#06b6d4', icon: '🔋', label: 'Good energy' };
    if (stamina >= 40) return { color: '#f59e0b', icon: '⚡', label: 'Tired' };
    if (stamina >= 20) return { color: '#ef4444', icon: '🔥', label: 'Exhausted' };
    return { color: '#dc2626', icon: '💤', label: 'Drained' };
  };

  const healthInfo = getHealthIndicator(ant.health || 100);
  const staminaInfo = getStaminaIndicator(ant.stamina || 100);

  return (
    <motion.div
      className={`absolute z-20 ${positionClasses[position]}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: 'spring' }}
    >
      {/* Main Status Badge */}
      <motion.div
        className={`
          ${sizeClasses[size]} rounded-full border-2 border-white shadow-lg cursor-pointer
          flex items-center justify-center font-bold relative overflow-hidden
        `}
        style={{
          backgroundColor: statusConfig.backgroundColor,
          color: statusConfig.color
        }}
        onClick={() => onStatusClick && onStatusClick(ant)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={`${ant.status} - Click for details`}
      >
        <StatusAnimation status={ant.status} />
        <span className="relative z-10">
          {getStatusIcon(ant.status)}
        </span>
      </motion.div>

      {/* Multi-State Indicators */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex gap-1">
              {/* Health Indicator */}
              <HealthIndicator 
                health={ant.health || 100} 
                info={healthInfo}
                size={size}
              />
              
              {/* Stamina Indicator */}
              <StaminaIndicator 
                stamina={ant.stamina || 100} 
                info={staminaInfo}
                size={size}
              />
              
              {/* Special State Indicators */}
              <SpecialStateIndicators ant={ant} size={size} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Health Warning */}
      {(ant.health < 30 || ant.stamina < 20) && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          title="Urgent attention needed!"
        />
      )}
    </motion.div>
  );
};

/**
 * StatusAnimation - Animated background based on status
 */
const StatusAnimation = ({ status }) => {
  const getAnimation = () => {
    switch (status) {
      case 'busy':
      case 'working':
        return {
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(59,130,246,0.3) 90deg, transparent 180deg)',
          animation: 'spin 2s linear infinite'
        };
      case 'fighting':
        return {
          background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)',
          animation: 'pulse 0.5s ease-in-out infinite alternate'
        };
      case 'evolving':
        return {
          background: 'linear-gradient(45deg, rgba(147,51,234,0.3), rgba(59,130,246,0.3), rgba(16,185,129,0.3))',
          animation: 'rainbow-shift 3s ease-in-out infinite'
        };
      default:
        return {};
    }
  };

  return (
    <div
      className="absolute inset-0 rounded-full"
      style={getAnimation()}
    />
  );
};

/**
 * HealthIndicator - Shows ant health status
 */
const HealthIndicator = ({ health, info, size }) => {
  const sizeClasses = {
    small: 'w-3 h-3 text-xs',
    medium: 'w-4 h-4 text-sm',
    large: 'w-5 h-5 text-base'
  };

  return (
    <motion.div
      className={`
        ${sizeClasses[size]} rounded-full border border-white shadow-sm
        flex items-center justify-content backdrop-blur-sm
      `}
      style={{ backgroundColor: `${info.color}20`, borderColor: info.color }}
      title={`Health: ${health}% - ${info.label}`}
      whileHover={{ scale: 1.1 }}
    >
      <span style={{ color: info.color }}>{info.icon}</span>
    </motion.div>
  );
};

/**
 * StaminaIndicator - Shows ant stamina/energy status
 */
const StaminaIndicator = ({ stamina, info, size }) => {
  const sizeClasses = {
    small: 'w-3 h-3 text-xs',
    medium: 'w-4 h-4 text-sm',
    large: 'w-5 h-5 text-base'
  };

  return (
    <motion.div
      className={`
        ${sizeClasses[size]} rounded-full border border-white shadow-sm
        flex items-center justify-center backdrop-blur-sm relative overflow-hidden
      `}
      style={{ backgroundColor: `${info.color}20`, borderColor: info.color }}
      title={`Stamina: ${stamina}% - ${info.label}`}
      whileHover={{ scale: 1.1 }}
    >
      {/* Stamina Fill Animation */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-500"
        style={{
          height: `${stamina}%`,
          backgroundColor: `${info.color}40`
        }}
      />
      <span className="relative z-10" style={{ color: info.color }}>
        {info.icon}
      </span>
    </motion.div>
  );
};

/**
 * SpecialStateIndicators - Shows special conditions and modifiers
 */
const SpecialStateIndicators = ({ ant, size }) => {
  const indicators = [];
  
  const sizeClasses = {
    small: 'w-3 h-3 text-xs',
    medium: 'w-4 h-4 text-sm',
    large: 'w-5 h-5 text-base'
  };

  // Carrying items
  if (ant.isCarrying) {
    indicators.push(
      <motion.div
        key="carrying"
        className={`
          ${sizeClasses[size]} rounded-full border border-white shadow-sm
          flex items-center justify-center bg-purple-100
        `}
        title="Carrying items"
        whileHover={{ scale: 1.1 }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        📦
      </motion.div>
    );
  }

  // Level up available
  if (ant.canLevelUp) {
    indicators.push(
      <motion.div
        key="levelup"
        className={`
          ${sizeClasses[size]} rounded-full border border-yellow-400 shadow-sm
          flex items-center justify-center bg-yellow-100
        `}
        title="Ready to level up!"
        whileHover={{ scale: 1.1 }}
        animate={{ 
          boxShadow: ['0 0 0 0 rgba(251, 191, 36, 0.7)', '0 0 0 10px rgba(251, 191, 36, 0)'],
          scale: [1, 1.05, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ⬆️
      </motion.div>
    );
  }

  // Disease/Poison
  if (ant.isPoisoned) {
    indicators.push(
      <motion.div
        key="poison"
        className={`
          ${sizeClasses[size]} rounded-full border border-green-600 shadow-sm
          flex items-center justify-center bg-green-100
        `}
        title="Poisoned"
        whileHover={{ scale: 1.1 }}
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        ☠️
      </motion.div>
    );
  }

  // Boost/Enhancement
  if (ant.hasBoost) {
    indicators.push(
      <motion.div
        key="boost"
        className={`
          ${sizeClasses[size]} rounded-full border border-blue-500 shadow-sm
          flex items-center justify-center bg-blue-100
        `}
        title="Enhanced abilities"
        whileHover={{ scale: 1.1 }}
        animate={{ 
          background: ['#dbeafe', '#bfdbfe', '#dbeafe'],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ✨
      </motion.div>
    );
  }

  return indicators;
};

export default AntStatusBadge; 
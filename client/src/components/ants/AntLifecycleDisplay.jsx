import React from 'react';
import { motion } from 'framer-motion';

/**
 * Visual representations for each lifecycle stage
 */
const LIFECYCLE_VISUALS = {
  egg: {
    emoji: '🥚',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-800',
    pulseColor: 'bg-yellow-200'
  },
  larva: {
    emoji: '🐛',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-800',
    pulseColor: 'bg-green-200'
  },
  pupa: {
    emoji: '🛡️',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-800',
    pulseColor: 'bg-blue-200'
  },
  adult: {
    emoji: '🐜',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-800',
    pulseColor: 'bg-gray-200'
  },
  dead: {
    emoji: '💀',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-800',
    pulseColor: 'bg-red-200'
  }
};

/**
 * Queen crown overlay
 */
const QueenCrown = () => (
  <motion.div
    className="absolute -top-2 -right-2 text-yellow-500 text-lg"
    initial={{ scale: 0, rotate: -45 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
  >
    👑
  </motion.div>
);

/**
 * Health bar component
 */
const HealthBar = ({ health, maxHealth = 100, compact = false }) => {
  const percentage = (health / maxHealth) * 100;
  const barColor = percentage > 70 ? 'bg-green-500' : 
                   percentage > 30 ? 'bg-yellow-500' : 'bg-red-500';
  
  if (compact) {
    return (
      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
        <div 
          className={`h-1 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
      <div 
        className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

/**
 * Lifecycle progress bar
 */
const LifecycleProgress = ({ stageProgress, stageDuration, status }) => {
  const percentage = stageDuration > 0 ? (stageProgress / stageDuration) * 100 : 0;
  const isGrowing = ['egg', 'larva', 'pupa'].includes(status);
  
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs opacity-75 mb-1">
        <span>{isGrowing ? 'Development' : 'Age'}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <motion.div 
          className={`h-1.5 rounded-full transition-all duration-1000 ${
            isGrowing ? 'bg-blue-500' : 'bg-purple-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
};

/**
 * Ant size indicator
 */
const SizeIndicator = ({ size, isQueen }) => {
  const sizeMultiplier = isQueen ? size * 1.2 : size;
  const transform = `scale(${sizeMultiplier})`;
  
  return { transform };
};

/**
 * Individual ant lifecycle display component
 */
const AntLifecycleDisplay = ({ 
  ant, 
  compact = false, 
  showProgress = true, 
  showHealth = true,
  onClick = null,
  className = ""
}) => {
  if (!ant || !ant.lifecycle) {
    return (
      <div className="text-gray-400 text-sm p-2">
        Invalid ant data
      </div>
    );
  }
  
  const { lifecycle, queen, health = 100 } = ant;
  const { status, age, maxAge, stageProgress, stageDuration, visualSize, description } = lifecycle;
  const isQueen = queen && queen.eggsLaid !== undefined;
  
  const visual = LIFECYCLE_VISUALS[status] || LIFECYCLE_VISUALS.adult;
  const sizeStyle = SizeIndicator({ size: visualSize, isQueen });
  
  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    },
    hover: { 
      scale: compact ? 1.05 : 1.02,
      transition: { duration: 0.2 }
    }
  };
  
  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
  
  if (compact) {
    return (
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        className={`relative ${visual.bgColor} ${visual.borderColor} border rounded-lg p-2 cursor-pointer ${className}`}
        onClick={() => onClick && onClick(ant)}
      >
        <div className="flex items-center space-x-2">
          <motion.div 
            className="text-2xl"
            style={sizeStyle}
            variants={status === 'egg' ? pulseVariants : {}}
            animate={status === 'egg' ? 'pulse' : ''}
          >
            {visual.emoji}
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium ${visual.textColor}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {isQueen && <span className="ml-1 text-yellow-600">👑</span>}
            </div>
            
            {showHealth && health < 100 && (
              <HealthBar health={health} compact={true} />
            )}
            
            {showProgress && (
              <div className="text-xs opacity-60 mt-1">
                Age: {age}/{maxAge}
              </div>
            )}
          </div>
        </div>
        
        {isQueen && <QueenCrown />}
      </motion.div>
    );
  }
  
  // Full display mode
  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      className={`relative ${visual.bgColor} ${visual.borderColor} border-2 rounded-xl p-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow ${className}`}
      onClick={() => onClick && onClick(ant)}
    >
      {/* Main content */}
      <div className="flex items-start space-x-4">
        {/* Ant visual */}
        <div className="flex-shrink-0">
          <motion.div 
            className="text-6xl"
            style={sizeStyle}
            variants={status === 'egg' ? pulseVariants : {}}
            animate={status === 'egg' ? 'pulse' : ''}
          >
            {visual.emoji}
          </motion.div>
        </div>
        
        {/* Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-lg font-semibold ${visual.textColor}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {isQueen && <span className="ml-2 text-yellow-600">Queen</span>}
            </h3>
            <div className="text-sm text-gray-500">
              ID: {ant.id.slice(0, 8)}...
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            {description}
          </p>
          
          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Age:</span> {age}/{maxAge} ticks
            </div>
            <div>
              <span className="font-medium">Health:</span> {health}/100
            </div>
            <div>
              <span className="font-medium">Size:</span> {(visualSize * 100).toFixed(0)}%
            </div>
            <div>
              <span className="font-medium">Food/tick:</span> {lifecycle.foodConsumption.toFixed(1)}
            </div>
          </div>
          
          {/* Queen specific information */}
          {isQueen && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="text-sm">
                <div><strong>Eggs Laid:</strong> {queen.eggsLaid}</div>
                <div><strong>Can Lay Egg:</strong> {queen.canProduceEgg ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}
          
          {/* Health bar */}
          {showHealth && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Health</span>
                <span>{health}/100</span>
              </div>
              <HealthBar health={health} />
            </div>
          )}
          
          {/* Lifecycle progress */}
          {showProgress && (
            <LifecycleProgress 
              stageProgress={stageProgress}
              stageDuration={stageDuration}
              status={status}
            />
          )}
        </div>
      </div>
      
      {/* Queen crown overlay */}
      {isQueen && <QueenCrown />}
      
      {/* Status badges */}
      <div className="absolute top-2 right-2 flex space-x-1">
        {lifecycle.canWork && (
          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Worker
          </div>
        )}
        {lifecycle.canMove && (
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Mobile
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AntLifecycleDisplay; 
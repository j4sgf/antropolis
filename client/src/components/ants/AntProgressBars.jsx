import React from 'react';
import { motion } from 'framer-motion';

/**
 * AntProgressBars - Progress bars for ant metrics
 * Part of Task 15.2: Implement Status and State Indicators
 */
const AntProgressBars = ({ 
  ant, 
  metrics = ['health', 'stamina', 'experience'],
  orientation = 'horizontal',
  size = 'medium',
  showLabels = true,
  showPercentages = true,
  className = ''
}) => {
  const sizeConfig = {
    small: {
      height: orientation === 'horizontal' ? 'h-1' : 'w-1',
      width: orientation === 'horizontal' ? 'w-16' : 'h-16',
      text: 'text-xs',
      spacing: 'gap-1'
    },
    medium: {
      height: orientation === 'horizontal' ? 'h-2' : 'w-2',
      width: orientation === 'horizontal' ? 'w-24' : 'h-24',
      text: 'text-sm',
      spacing: 'gap-2'
    },
    large: {
      height: orientation === 'horizontal' ? 'h-3' : 'w-3',
      width: orientation === 'horizontal' ? 'w-32' : 'h-32',
      text: 'text-base',
      spacing: 'gap-3'
    }
  };

  const config = sizeConfig[size];
  const containerClass = orientation === 'horizontal' 
    ? `flex flex-col ${config.spacing}` 
    : `flex flex-row-reverse ${config.spacing}`;

  return (
    <div className={`${containerClass} ${className}`}>
      {metrics.map(metric => (
        <ProgressBar
          key={metric}
          metric={metric}
          ant={ant}
          orientation={orientation}
          config={config}
          showLabels={showLabels}
          showPercentages={showPercentages}
        />
      ))}
    </div>
  );
};

/**
 * ProgressBar - Individual progress bar for a specific metric
 */
const ProgressBar = ({ 
  metric, 
  ant, 
  orientation, 
  config, 
  showLabels, 
  showPercentages 
}) => {
  const getMetricData = (metricName) => {
    const baseData = {
      health: {
        value: ant.health || 100,
        max: 100,
        label: 'Health',
        icon: '❤️',
        colors: {
          high: '#10b981', // Green
          medium: '#f59e0b', // Yellow
          low: '#ef4444', // Red
          critical: '#dc2626' // Dark red
        }
      },
      stamina: {
        value: ant.stamina || 100,
        max: 100,
        label: 'Stamina',
        icon: '⚡',
        colors: {
          high: '#3b82f6', // Blue
          medium: '#06b6d4', // Cyan
          low: '#f59e0b', // Yellow
          critical: '#ef4444' // Red
        }
      },
      experience: {
        value: ant.experience || 0,
        max: ant.experienceToNext || 100,
        label: 'Experience',
        icon: '✨',
        colors: {
          high: '#8b5cf6', // Purple
          medium: '#6366f1', // Indigo
          low: '#3b82f6', // Blue
          critical: '#6b7280' // Gray
        }
      },
      mood: {
        value: ant.mood || 50,
        max: 100,
        label: 'Mood',
        icon: '😊',
        colors: {
          high: '#10b981', // Green
          medium: '#f59e0b', // Yellow
          low: '#ef4444', // Red
          critical: '#7f1d1d' // Dark red
        }
      },
      hunger: {
        value: 100 - (ant.hunger || 0),
        max: 100,
        label: 'Satiety',
        icon: '🍃',
        colors: {
          high: '#10b981', // Green (well fed)
          medium: '#f59e0b', // Yellow
          low: '#ef4444', // Red (hungry)
          critical: '#dc2626' // Dark red (starving)
        }
      }
    };

    return baseData[metricName] || baseData.health;
  };

  const data = getMetricData(metric);
  const percentage = Math.max(0, Math.min(100, (data.value / data.max) * 100));
  
  const getColor = (percent) => {
    if (percent >= 75) return data.colors.high;
    if (percent >= 50) return data.colors.medium;
    if (percent >= 25) return data.colors.low;
    return data.colors.critical;
  };

  const color = getColor(percentage);
  const isVertical = orientation === 'vertical';

  return (
    <div className={`flex ${isVertical ? 'flex-col items-center' : 'items-center'} gap-1`}>
      {/* Label and Icon */}
      {showLabels && (
        <div className={`flex items-center gap-1 ${config.text}`}>
          <span>{data.icon}</span>
          <span className="font-medium text-gray-700">{data.label}</span>
          {showPercentages && (
            <span className="text-gray-500">
              ({Math.round(percentage)}%)
            </span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div 
        className={`
          relative bg-gray-200 rounded-full overflow-hidden
          ${isVertical ? config.width + ' ' + config.height : config.height + ' ' + config.width}
        `}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20" />
        
        {/* Progress Fill */}
        <motion.div
          className={`
            ${isVertical ? 'absolute bottom-0 left-0 right-0' : 'absolute top-0 left-0 bottom-0'}
            rounded-full relative overflow-hidden
          `}
          style={{ 
            backgroundColor: color,
            [isVertical ? 'height' : 'width']: `${percentage}%`
          }}
          initial={{ [isVertical ? 'height' : 'width']: 0 }}
          animate={{ [isVertical ? 'height' : 'width']: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          {/* Animated Shine Effect */}
          <motion.div
            className={`
              absolute inset-0 bg-gradient-to-${isVertical ? 't' : 'r'} 
              from-transparent via-white to-transparent opacity-30
            `}
            animate={{ 
              [isVertical ? 'y' : 'x']: ['-100%', '100%'] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              ease: 'linear' 
            }}
          />
          
          {/* Pulse Effect for Critical Values */}
          {percentage < 25 && (
            <motion.div
              className="absolute inset-0 bg-white"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Threshold Markers */}
        <ThresholdMarkers 
          isVertical={isVertical} 
          config={config}
          color={color}
        />
      </div>

      {/* Value Display */}
      {!showLabels && showPercentages && (
        <div className={`${config.text} text-gray-600 font-medium`}>
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

/**
 * ThresholdMarkers - Visual markers for important thresholds
 */
const ThresholdMarkers = ({ isVertical, config, color }) => {
  const thresholds = [25, 50, 75]; // Percentage thresholds
  
  return (
    <>
      {thresholds.map(threshold => (
        <div
          key={threshold}
          className={`
            absolute border-gray-400 opacity-30
            ${isVertical 
              ? `left-0 right-0 border-t` 
              : `top-0 bottom-0 border-l`
            }
          `}
          style={{
            [isVertical ? 'bottom' : 'left']: `${threshold}%`
          }}
        />
      ))}
    </>
  );
};

/**
 * CompactProgressRing - Circular progress indicator for space-constrained areas
 */
export const CompactProgressRing = ({ 
  value, 
  max = 100, 
  size = 40, 
  strokeWidth = 4,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showValue = true,
  icon = null,
  className = ''
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {icon ? (
          <span className="text-lg">{icon}</span>
        ) : showValue ? (
          <span className="text-xs font-bold text-gray-700">
            {Math.round(percentage)}%
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default AntProgressBars; 
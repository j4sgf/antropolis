import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAntConfig } from '../../data/antVisualConfig';
import AntProgressBars, { CompactProgressRing } from './AntProgressBars';

/**
 * AntTooltip - Comprehensive tooltip with detailed ant information
 * Part of Task 15.4: Add Ant Detail Tooltips and Information Display
 */
const AntTooltip = ({ 
  ant,
  isVisible,
  position = { x: 0, y: 0 },
  onClose,
  detailed = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const tooltipRef = useRef(null);
  
  const config = getAntConfig(ant.role);
  
  // Position calculation to keep tooltip in viewport
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      let newPos = { ...position };
      
      // Adjust horizontal position
      if (position.x + rect.width > viewport.width - 20) {
        newPos.x = position.x - rect.width - 10;
      }
      
      // Adjust vertical position
      if (position.y + rect.height > viewport.height - 20) {
        newPos.y = position.y - rect.height - 10;
      }
      
      setAdjustedPosition(newPos);
    }
  }, [isVisible, position]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={tooltipRef}
        className={`
          fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200
          ${detailed ? 'w-80 max-h-96' : 'w-64 max-h-80'}
          overflow-hidden ${className}
        `}
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y
        }}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <TooltipHeader ant={ant} config={config} onClose={onClose} />
        
        {/* Tabs for detailed view */}
        {detailed && (
          <TooltipTabs 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            ant={ant}
          />
        )}
        
        {/* Content */}
        <div className="overflow-y-auto max-h-64">
          {detailed ? (
            <DetailedContent ant={ant} activeTab={activeTab} config={config} />
          ) : (
            <QuickOverview ant={ant} config={config} />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * TooltipHeader - Header with ant name, role, and basic info
 */
const TooltipHeader = ({ ant, config, onClose }) => {
  return (
    <div 
      className="p-3 border-b border-gray-200"
      style={{ 
        background: `linear-gradient(135deg, ${config.colorScheme.primary}20, ${config.colorScheme.secondary}10)`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Ant Visual Indicator */}
          <div 
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-lg"
            style={{ 
              backgroundColor: config.colorScheme.primary,
              borderColor: config.colorScheme.secondary,
              color: 'white'
            }}
          >
            {getRoleEmoji(ant.role)}
          </div>
          
          <div>
            <h3 className="font-bold text-gray-800">
              {ant.name || `${ant.role} Ant`}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              Level {ant.level || 1} {ant.role}
            </p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * TooltipTabs - Tab navigation for detailed view
 */
const TooltipTabs = ({ activeTab, setActiveTab, ant }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'stats', label: 'Stats', icon: '💪' },
    { id: 'tasks', label: 'Tasks', icon: '📋' },
    { id: 'history', label: 'History', icon: '📜' }
  ];

  return (
    <div className="flex border-b border-gray-200">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            flex-1 px-2 py-2 text-xs font-medium transition-colors
            ${activeTab === tab.id 
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex flex-col items-center gap-1">
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

/**
 * QuickOverview - Compact overview for simple tooltip
 */
const QuickOverview = ({ ant, config }) => {
  return (
    <div className="p-3 space-y-3">
      {/* Status */}
      <StatusDisplay ant={ant} compact />
      
      {/* Health & Stamina */}
      <div className="flex gap-2">
        <CompactProgressRing
          value={ant.health || 100}
          color="#10b981"
          icon="❤️"
          size={32}
        />
        <CompactProgressRing
          value={ant.stamina || 100}
          color="#3b82f6"
          icon="⚡"
          size={32}
        />
        {ant.experience !== undefined && (
          <CompactProgressRing
            value={ant.experience || 0}
            max={ant.experienceToNext || 100}
            color="#8b5cf6"
            icon="✨"
            size={32}
          />
        )}
      </div>
      
      {/* Current Activity */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Current Activity</h4>
        <p className="text-xs text-gray-600">
          {getActivityDescription(ant)}
        </p>
      </div>
      
      {/* Traits */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-1">Traits</h4>
        <div className="flex flex-wrap gap-1">
          {config.traits.map(trait => (
            <span 
              key={trait}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * DetailedContent - Comprehensive content based on active tab
 */
const DetailedContent = ({ ant, activeTab, config }) => {
  switch (activeTab) {
    case 'overview':
      return <OverviewTab ant={ant} config={config} />;
    case 'stats':
      return <StatsTab ant={ant} />;
    case 'tasks':
      return <TasksTab ant={ant} />;
    case 'history':
      return <HistoryTab ant={ant} />;
    default:
      return <OverviewTab ant={ant} config={config} />;
  }
};

/**
 * OverviewTab - Detailed overview information
 */
const OverviewTab = ({ ant, config }) => {
  return (
    <div className="p-3 space-y-4">
      {/* Status & Activity */}
      <StatusDisplay ant={ant} />
      
      {/* Primary Metrics */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Metrics</h4>
        <AntProgressBars 
          ant={ant}
          metrics={['health', 'stamina', 'experience']}
          size="small"
          showLabels={false}
        />
      </div>
      
      {/* Skills Preview */}
      {ant.skills && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Skills</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(ant.skills).slice(0, 6).map(([skill, level]) => (
              <div key={skill} className="text-center">
                <div className="text-lg">{getSkillIcon(skill)}</div>
                <div className="text-xs text-gray-600">{skill}</div>
                <div className="text-xs font-medium">{level}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Equipment/Items */}
      {ant.equipment && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Equipment</h4>
          <div className="flex flex-wrap gap-1">
            {ant.equipment.map((item, index) => (
              <span 
                key={index}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                title={item.description}
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * StatsTab - Detailed statistics and abilities
 */
const StatsTab = ({ ant }) => {
  const stats = {
    health: ant.health || 100,
    stamina: ant.stamina || 100,
    strength: ant.strength || 50,
    agility: ant.agility || 50,
    intelligence: ant.intelligence || 50,
    charisma: ant.charisma || 50
  };

  return (
    <div className="p-3 space-y-3">
      <h4 className="font-medium text-gray-700">Attributes</h4>
      <AntProgressBars 
        ant={{ ...ant, ...stats }}
        metrics={Object.keys(stats)}
        size="small"
      />
      
      {/* Combat Stats */}
      {ant.combat && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Combat</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Attack: {ant.combat.attack || 0}</div>
            <div>Defense: {ant.combat.defense || 0}</div>
            <div>Speed: {ant.combat.speed || 0}</div>
            <div>Wins: {ant.combat.wins || 0}</div>
          </div>
        </div>
      )}
      
      {/* Work Efficiency */}
      {ant.efficiency && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Efficiency</h4>
          <div className="space-y-1 text-sm">
            {Object.entries(ant.efficiency).map(([task, value]) => (
              <div key={task} className="flex justify-between">
                <span className="capitalize">{task}:</span>
                <span>{value}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * TasksTab - Current and recent tasks
 */
const TasksTab = ({ ant }) => {
  return (
    <div className="p-3 space-y-3">
      {/* Current Task */}
      {ant.currentTask && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Current Task</h4>
          <div className="bg-blue-50 border border-blue-200 rounded p-2">
            <div className="font-medium text-blue-800">{ant.currentTask.name}</div>
            <div className="text-sm text-blue-600">{ant.currentTask.description}</div>
            {ant.currentTask.progress !== undefined && (
              <div className="mt-2">
                <div className="bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${ant.currentTask.progress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {ant.currentTask.progress}% complete
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Task Queue */}
      {ant.taskQueue?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Queued Tasks</h4>
          <div className="space-y-1">
            {ant.taskQueue.slice(0, 3).map((task, index) => (
              <div key={index} className="bg-gray-50 border rounded p-2">
                <div className="text-sm font-medium">{task.name}</div>
                <div className="text-xs text-gray-600">{task.description}</div>
              </div>
            ))}
            {ant.taskQueue.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{ant.taskQueue.length - 3} more tasks
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Recent Completions */}
      {ant.recentCompletions?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Recent Completions</h4>
          <div className="space-y-1">
            {ant.recentCompletions.slice(0, 3).map((task, index) => (
              <div key={index} className="bg-green-50 border border-green-200 rounded p-2">
                <div className="text-sm font-medium text-green-800">{task.name}</div>
                <div className="text-xs text-green-600">
                  Completed {formatTimeAgo(task.completedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * HistoryTab - Ant history and achievements
 */
const HistoryTab = ({ ant }) => {
  return (
    <div className="p-3 space-y-3">
      {/* Basic Info */}
      <div>
        <h4 className="font-medium text-gray-700 mb-2">Info</h4>
        <div className="space-y-1 text-sm">
          <div>Born: {formatDate(ant.birthDate)}</div>
          <div>Age: {ant.age || 'Unknown'} days</div>
          <div>Generation: {ant.generation || 1}</div>
        </div>
      </div>
      
      {/* Achievements */}
      {ant.achievements?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Achievements</h4>
          <div className="space-y-1">
            {ant.achievements.map((achievement, index) => (
              <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="text-sm font-medium text-yellow-800">
                  {achievement.icon} {achievement.name}
                </div>
                <div className="text-xs text-yellow-600">{achievement.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Notable Events */}
      {ant.notableEvents?.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-2">Notable Events</h4>
          <div className="space-y-1">
            {ant.notableEvents.slice(0, 5).map((event, index) => (
              <div key={index} className="text-sm">
                <div className="font-medium">{event.title}</div>
                <div className="text-xs text-gray-600">
                  {formatTimeAgo(event.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * StatusDisplay - Shows current status and conditions
 */
const StatusDisplay = ({ ant, compact = false }) => {
  const getStatusColor = (status) => {
    const colors = {
      idle: 'bg-gray-100 text-gray-700',
      busy: 'bg-blue-100 text-blue-700',
      working: 'bg-green-100 text-green-700',
      resting: 'bg-purple-100 text-purple-700',
      injured: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ant.status)}`}>
          {ant.status || 'idle'}
        </span>
        {ant.mood && (
          <span className="text-sm">{getMoodEmoji(ant.mood)}</span>
        )}
      </div>
      
      {!compact && (
        <p className="text-xs text-gray-600">
          {getActivityDescription(ant)}
        </p>
      )}
    </div>
  );
};

// Helper functions
const getRoleEmoji = (role) => {
  const emojis = {
    worker: '🐜',
    soldier: '⚔️',
    scout: '👁️',
    nurse: '🤱',
    forager: '🍯',
    builder: '🏗️',
    queen: '👑'
  };
  return emojis[role] || '🐜';
};

const getSkillIcon = (skill) => {
  const icons = {
    strength: '💪',
    speed: '⚡',
    intelligence: '🧠',
    endurance: '🛡️',
    stealth: '👤',
    leadership: '👑',
    construction: '🔨',
    foraging: '🔍'
  };
  return icons[skill] || '⭐';
};

const getMoodEmoji = (mood) => {
  if (mood >= 80) return '😊';
  if (mood >= 60) return '🙂';
  if (mood >= 40) return '😐';
  if (mood >= 20) return '😟';
  return '😢';
};

const getActivityDescription = (ant) => {
  if (ant.currentTask) {
    return `Working on: ${ant.currentTask.name}`;
  }
  if (ant.status === 'resting') {
    return 'Resting and recovering stamina';
  }
  if (ant.status === 'idle') {
    return 'Waiting for new tasks';
  }
  return `Currently ${ant.status}`;
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  if (diffMins > 0) return `${diffMins}m ago`;
  return 'Just now';
};

const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString();
};

export default AntTooltip; 
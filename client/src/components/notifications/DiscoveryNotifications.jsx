import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './DiscoveryNotifications.css';

const DISCOVERY_TYPES = {
  TILE_DISCOVERED: {
    icon: '🗺️',
    color: '#87CEEB',
    sound: 'discovery.wav',
    title: 'Area Explored',
    priority: 1
  },
  RESOURCE_CACHE: {
    icon: '💎',
    color: '#FFD700',
    sound: 'treasure.wav',
    title: 'Resource Cache Found',
    priority: 5
  },
  HIDDEN_ENEMY: {
    icon: '⚔️',
    color: '#FF4500',
    sound: 'danger.wav',
    title: 'Enemy Detected',
    priority: 10
  },
  NPC_NEST: {
    icon: '🏠',
    color: '#DDA0DD',
    sound: 'discovery.wav',
    title: 'Settlement Discovered',
    priority: 7
  },
  ENVIRONMENTAL_HAZARD: {
    icon: '⚠️',
    color: '#FF6347',
    sound: 'warning.wav',
    title: 'Hazard Detected',
    priority: 8
  },
  ANCIENT_RUINS: {
    icon: '🏛️',
    color: '#CD853F',
    sound: 'ancient.wav',
    title: 'Ancient Ruins Found',
    priority: 9
  },
  WATER_SOURCE: {
    icon: '💧',
    color: '#1E90FF',
    sound: 'water.wav',
    title: 'Water Source Located',
    priority: 6
  },
  SCOUT_EXHAUSTED: {
    icon: '😴',
    color: '#FFA500',
    sound: 'alert.wav',
    title: 'Scout Exhausted',
    priority: 4
  },
  EXPLORATION_MILESTONE: {
    icon: '🎯',
    color: '#32CD32',
    sound: 'achievement.wav',
    title: 'Exploration Milestone',
    priority: 6
  }
};

const DiscoveryNotifications = ({
  onClose,
  maxNotifications = 5,
  autoRemoveTime = 8000,
  enableSounds = true,
  enablePersistence = true
}) => {
  const [notifications, setNotifications] = useState([]);
  const [persistentDiscoveries, setPersistentDiscoveries] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSounds);
  
  const notificationIdRef = useRef(0);
  const audioContextRef = useRef(null);

  // Initialize audio context for sounds
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        setSoundEnabled(false);
      }
    }
  }, [soundEnabled]);

  // Add new notification
  const addNotification = (discovery) => {
    const id = notificationIdRef.current++;
    const discoveryType = DISCOVERY_TYPES[discovery.type] || DISCOVERY_TYPES.TILE_DISCOVERED;
    
    const notification = {
      id,
      ...discovery,
      ...discoveryType,
      timestamp: Date.now(),
      isNew: true
    };

    // Add to active notifications
    setNotifications(prev => {
      const updated = [notification, ...prev.slice(0, maxNotifications - 1)];
      return updated.sort((a, b) => b.priority - a.priority);
    });

    // Add to persistent history if enabled
    if (enablePersistence && discovery.type !== 'TILE_DISCOVERED') {
      setPersistentDiscoveries(prev => [notification, ...prev.slice(0, 49)]);
    }

    // Play notification sound
    if (soundEnabled && discoveryType.sound) {
      playNotificationSound(discoveryType.sound);
    }

    // Auto-remove notification
    setTimeout(() => {
      removeNotification(id);
    }, autoRemoveTime);

    return id;
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Play notification sound
  const playNotificationSound = async (soundFile) => {
    if (!audioContextRef.current || !soundEnabled) return;

    try {
      // Simple beep sound generation for demonstration
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Different frequencies for different discovery types
      const frequencies = {
        'discovery.wav': 440,
        'treasure.wav': 880,
        'danger.wav': 220,
        'warning.wav': 330,
        'ancient.wav': 660,
        'water.wav': 523,
        'alert.wav': 392,
        'achievement.wav': 1047
      };
      
      oscillator.frequency.setValueAtTime(
        frequencies[soundFile] || 440, 
        audioContextRef.current.currentTime
      );
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.5);
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  };

  // Format discovery message
  const formatDiscoveryMessage = (discovery) => {
    switch (discovery.type) {
      case 'RESOURCE_CACHE':
        return `Rich deposits found at (${Math.floor(discovery.x)}, ${Math.floor(discovery.y)})`;
      case 'HIDDEN_ENEMY':
        return `Hostile forces detected at (${Math.floor(discovery.x)}, ${Math.floor(discovery.y)})`;
      case 'NPC_NEST':
        return `Friendly settlement at (${Math.floor(discovery.x)}, ${Math.floor(discovery.y)})`;
      case 'ENVIRONMENTAL_HAZARD':
        return `Dangerous terrain at (${Math.floor(discovery.x)}, ${Math.floor(discovery.y)})`;
      case 'ANCIENT_RUINS':
        return `Mysterious ruins at (${Math.floor(discovery.x)}, ${Math.floor(discovery.y)})`;
      case 'WATER_SOURCE':
        return `Fresh water at (${Math.floor(discovery.x)}, ${Math.floor(discovery.y)})`;
      case 'SCOUT_EXHAUSTED':
        return `Scout ${discovery.scoutId || 'Unknown'} needs rest`;
      case 'EXPLORATION_MILESTONE':
        return `${discovery.percentage || 0}% of map explored`;
      case 'TILE_DISCOVERED':
      default:
        return `New area explored at (${Math.floor(discovery.x)}, ${Math.floor(discovery.y)})`;
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Expose addNotification method to parent components
  useEffect(() => {
    window.addDiscoveryNotification = addNotification;
    return () => {
      delete window.addDiscoveryNotification;
    };
  }, [maxNotifications, autoRemoveTime, soundEnabled, enablePersistence]);

  return (
    <div className="discovery-notifications">
      {/* Active notifications */}
      <div className="notifications-container">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`notification ${notification.type.toLowerCase()}`}
              style={{ borderColor: notification.color }}
            >
              <div className="notification-header">
                <span 
                  className="notification-icon"
                  style={{ color: notification.color }}
                >
                  {notification.icon}
                </span>
                <h4 className="notification-title">{notification.title}</h4>
                <button
                  className="notification-close"
                  onClick={() => removeNotification(notification.id)}
                >
                  ✕
                </button>
              </div>
              
              <div className="notification-content">
                <p className="notification-message">
                  {formatDiscoveryMessage(notification)}
                </p>
                
                {notification.details && (
                  <div className="notification-details">
                    {notification.details}
                  </div>
                )}
                
                <div className="notification-meta">
                  <span className="notification-time">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </span>
                  {notification.scoutId && (
                    <span className="notification-scout">
                      Scout: {notification.scoutId}
                    </span>
                  )}
                </div>
              </div>

              {/* Priority indicator */}
              <div 
                className="notification-priority"
                style={{ backgroundColor: notification.color }}
              >
                {notification.priority}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Controls */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="notification-controls"
          >
            <button
              onClick={clearAllNotifications}
              className="clear-all-btn"
            >
              Clear All ({notifications.length})
            </button>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`sound-toggle-btn ${soundEnabled ? 'enabled' : 'disabled'}`}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Discovery history toggle */}
      {persistentDiscoveries.length > 0 && (
        <button
          className="history-toggle-btn"
          onClick={() => setShowHistory(!showHistory)}
        >
          📜 History ({persistentDiscoveries.length})
        </button>
      )}

      {/* Discovery history panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="discovery-history"
          >
            <div className="history-header">
              <h3>🗂️ Discovery History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="history-close-btn"
              >
                ✕
              </button>
            </div>
            
            <div className="history-content">
              {persistentDiscoveries.map((discovery) => (
                <div
                  key={`history-${discovery.id}`}
                  className="history-item"
                  style={{ borderLeftColor: discovery.color }}
                >
                  <span 
                    className="history-icon"
                    style={{ color: discovery.color }}
                  >
                    {discovery.icon}
                  </span>
                  <div className="history-details">
                    <div className="history-title">{discovery.title}</div>
                    <div className="history-message">
                      {formatDiscoveryMessage(discovery)}
                    </div>
                    <div className="history-time">
                      {new Date(discovery.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification area indicator */}
      {notifications.length === 0 && !showHistory && (
        <div className="notification-hint">
          <span className="hint-icon">🔍</span>
          <span className="hint-text">Explore to discover new areas</span>
        </div>
      )}
    </div>
  );
};

// Helper hook for easy integration
export const useDiscoveryNotifications = () => {
  const addNotification = (discoveryData) => {
    if (window.addDiscoveryNotification) {
      return window.addDiscoveryNotification(discoveryData);
    }
    console.warn('Discovery notification system not initialized');
    return null;
  };

  const addTileDiscovery = (x, y, details = '') => {
    return addNotification({
      type: 'TILE_DISCOVERED',
      x,
      y,
      details
    });
  };

  const addResourceDiscovery = (x, y, resourceType = 'unknown') => {
    return addNotification({
      type: 'RESOURCE_CACHE',
      x,
      y,
      details: `${resourceType} deposits detected`
    });
  };

  const addEnemyDiscovery = (x, y, enemyType = 'unknown') => {
    return addNotification({
      type: 'HIDDEN_ENEMY',
      x,
      y,
      details: `${enemyType} forces spotted`
    });
  };

  const addMilestoneNotification = (percentage, tilesExplored) => {
    return addNotification({
      type: 'EXPLORATION_MILESTONE',
      percentage,
      details: `${tilesExplored} tiles discovered`,
      x: 0,
      y: 0
    });
  };

  const addScoutExhaustedNotification = (scoutId) => {
    return addNotification({
      type: 'SCOUT_EXHAUSTED',
      scoutId,
      x: 0,
      y: 0
    });
  };

  return {
    addNotification,
    addTileDiscovery,
    addResourceDiscovery,
    addEnemyDiscovery,
    addMilestoneNotification,
    addScoutExhaustedNotification
  };
};

export default DiscoveryNotifications; 
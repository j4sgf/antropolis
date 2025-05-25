import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Notification System - Handles toast notifications for events, conversions, and other game updates
 */
const NotificationSystem = ({ colonyId }) => {
  const [notifications, setNotifications] = useState([]);
  const [nextId, setNextId] = useState(1);

  // Notification types and their styling
  const notificationTypes = {
    event: {
      icon: '🎲',
      bgColor: 'bg-blue-500',
      borderColor: 'border-blue-600',
      textColor: 'text-blue-50'
    },
    conversion: {
      icon: '⚗️',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-600',
      textColor: 'text-green-50'
    },
    decay: {
      icon: '⚠️',
      bgColor: 'bg-orange-500',
      borderColor: 'border-orange-600',
      textColor: 'text-orange-50'
    },
    discovery: {
      icon: '🔍',
      bgColor: 'bg-purple-500',
      borderColor: 'border-purple-600',
      textColor: 'text-purple-50'
    },
    achievement: {
      icon: '🏆',
      bgColor: 'bg-yellow-500',
      borderColor: 'border-yellow-600',
      textColor: 'text-yellow-50'
    },
    error: {
      icon: '❌',
      bgColor: 'bg-red-500',
      borderColor: 'border-red-600',
      textColor: 'text-red-50'
    },
    success: {
      icon: '✅',
      bgColor: 'bg-green-500',
      borderColor: 'border-green-600',
      textColor: 'text-green-50'
    },
    info: {
      icon: 'ℹ️',
      bgColor: 'bg-gray-500',
      borderColor: 'border-gray-600',
      textColor: 'text-gray-50'
    }
  };

  /**
   * Add a new notification
   */
  const addNotification = useCallback((type, title, message, options = {}) => {
    const notification = {
      id: nextId,
      type,
      title,
      message,
      timestamp: Date.now(),
      duration: options.duration || 5000, // 5 seconds default
      persistent: options.persistent || false,
      data: options.data || null
    };

    setNotifications(prev => [notification, ...prev]);
    setNextId(prev => prev + 1);

    // Auto-remove notification after duration (unless persistent)
    if (!notification.persistent) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }, [nextId]);

  /**
   * Remove a notification
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Get notification styling
   */
  const getNotificationStyle = (type) => {
    return notificationTypes[type] || notificationTypes.info;
  };

  // Animation variants
  const notificationVariants = {
    initial: { 
      opacity: 0, 
      x: 300, 
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      x: 300, 
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  // Expose methods globally for other components to use
  useEffect(() => {
    window.notificationSystem = {
      addNotification,
      removeNotification,
      clearAllNotifications,
      
      // Convenience methods
      showEvent: (title, message, data) => addNotification('event', title, message, { data }),
      showConversion: (title, message, data) => addNotification('conversion', title, message, { data }),
      showDecay: (title, message, data) => addNotification('decay', title, message, { data }),
      showDiscovery: (title, message, data) => addNotification('discovery', title, message, { data }),
      showAchievement: (title, message, data) => addNotification('achievement', title, message, { data }),
      showError: (title, message) => addNotification('error', title, message),
      showSuccess: (title, message) => addNotification('success', title, message),
      showInfo: (title, message) => addNotification('info', title, message)
    };

    return () => {
      delete window.notificationSystem;
    };
  }, [addNotification, removeNotification, clearAllNotifications]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {/* Clear All Button (only show if notifications exist) */}
      {notifications.length > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={clearAllNotifications}
          className="w-full text-xs bg-gray-700 text-gray-200 px-3 py-1 rounded hover:bg-gray-600 transition-colors"
        >
          Clear All ({notifications.length})
        </motion.button>
      )}

      {/* Notifications */}
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => {
          const style = getNotificationStyle(notification.type);
          
          return (
            <motion.div
              key={notification.id}
              variants={notificationVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              className={`${style.bgColor} ${style.borderColor} ${style.textColor} border-l-4 rounded-lg p-4 shadow-lg cursor-pointer hover:shadow-xl transition-shadow`}
              onClick={() => removeNotification(notification.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="text-xl">{style.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      <span className="text-xs opacity-75">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm opacity-90 mt-1">{notification.message}</p>
                    
                    {/* Additional data display */}
                    {notification.data && (
                      <div className="mt-2 text-xs opacity-75">
                        {typeof notification.data === 'object' ? (
                          <div className="space-y-1">
                            {Object.entries(notification.data).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div>{String(notification.data)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>

              {/* Progress bar for duration (if not persistent) */}
              {!notification.persistent && (
                <motion.div
                  className="mt-2 h-1 bg-black bg-opacity-20 rounded overflow-hidden"
                >
                  <motion.div
                    className="h-full bg-white bg-opacity-50"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: notification.duration / 1000, ease: 'linear' }}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem; 
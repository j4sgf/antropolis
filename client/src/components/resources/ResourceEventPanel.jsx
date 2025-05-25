import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import resourceService from '../../services/resourceService';

/**
 * Resource Event Panel - Displays active events, conversions, and allows event management
 */
const ResourceEventPanel = ({ colonyId, onClose }) => {
  const [activeEvents, setActiveEvents] = useState([]);
  const [activeConversions, setActiveConversions] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [conversionRecipes, setConversionRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('events');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Event type icons and colors
  const eventTypeStyles = {
    positive: { icon: '🎉', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    negative: { icon: '⚠️', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    neutral: { icon: 'ℹ️', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    discovery: { icon: '🔍', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    weather: { icon: '🌦️', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' }
  };

  // Conversion status styles
  const conversionStatusStyles = {
    active: { icon: '⚗️', color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { icon: '✅', color: 'text-green-600', bg: 'bg-green-50' },
    failed: { icon: '❌', color: 'text-red-600', bg: 'bg-red-50' },
    paused: { icon: '⏸️', color: 'text-yellow-600', bg: 'bg-yellow-50' }
  };

  /**
   * Load all event and conversion data
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [events, conversions, types, recipes] = await Promise.all([
        resourceService.getActiveEvents(colonyId),
        resourceService.getActiveConversions(colonyId),
        resourceService.getRandomEventTypes(),
        resourceService.getConversionRecipes()
      ]);

      setActiveEvents(events);
      setActiveConversions(conversions);
      setEventTypes(types);
      setConversionRecipes(recipes);
    } catch (err) {
      setError('Failed to load event data: ' + err.message);
      console.error('Error loading event data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger a random event manually (for testing)
   */
  const triggerRandomEvent = async (eventType) => {
    try {
      const result = await resourceService.triggerRandomEvent(colonyId, eventType);
      
      // Show notification
      if (window.notificationSystem) {
        window.notificationSystem.showEvent(
          'Event Triggered!',
          `Manually triggered: ${result.eventType}`,
          { outcome: result.outcome }
        );
      }
      
      // Refresh data
      loadData();
    } catch (err) {
      console.error('Error triggering event:', err);
      if (window.notificationSystem) {
        window.notificationSystem.showError('Event Failed', err.message);
      }
    }
  };

  /**
   * Start a resource conversion
   */
  const startConversion = async (recipeId, quantity = 1) => {
    try {
      const result = await resourceService.startConversion(colonyId, {
        recipeId,
        quantity
      });
      
      // Show notification
      if (window.notificationSystem) {
        window.notificationSystem.showConversion(
          'Conversion Started',
          `Started converting resources using recipe ${recipeId}`,
          { conversionId: result.conversionId }
        );
      }
      
      // Refresh data
      loadData();
    } catch (err) {
      console.error('Error starting conversion:', err);
      if (window.notificationSystem) {
        window.notificationSystem.showError('Conversion Failed', err.message);
      }
    }
  };

  /**
   * Format time remaining
   */
  const formatTimeRemaining = (timestamp) => {
    const remaining = timestamp - Date.now();
    if (remaining <= 0) return 'Completed';
    
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  /**
   * Get event style based on type
   */
  const getEventStyle = (eventType) => {
    // Determine style based on event type characteristics
    if (eventType.includes('bonus') || eventType.includes('discovery')) {
      return eventTypeStyles.positive;
    } else if (eventType.includes('attack') || eventType.includes('decay')) {
      return eventTypeStyles.negative;
    } else if (eventType.includes('weather')) {
      return eventTypeStyles.weather;
    } else if (eventType.includes('discovery')) {
      return eventTypeStyles.discovery;
    } else {
      return eventTypeStyles.neutral;
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    loadData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [colonyId, autoRefresh]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resource events...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Resource Events & Conversions</h2>
              <p className="opacity-90">Colony #{colonyId}</p>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <span>Auto-refresh</span>
              </label>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'events', label: 'Active Events', count: activeEvents.length },
              { id: 'conversions', label: 'Conversions', count: activeConversions.length },
              { id: 'trigger', label: 'Trigger Events' },
              { id: 'recipes', label: 'Conversion Recipes', count: conversionRecipes.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {selectedTab === 'events' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Events ({activeEvents.length})</h3>
                <button
                  onClick={loadData}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Refresh
                </button>
              </div>
              
              {activeEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🕐</div>
                  <p>No active events at the moment</p>
                  <p className="text-sm">Events will appear here as they occur</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeEvents.map((event, index) => {
                    const style = getEventStyle(event.type);
                    return (
                      <motion.div
                        key={event.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${style.bg} ${style.border} border rounded-lg p-4`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="text-2xl">{style.icon}</div>
                            <div>
                              <h4 className={`font-semibold ${style.color}`}>
                                {event.title || event.type}
                              </h4>
                              <p className="text-gray-700 text-sm mt-1">
                                {event.description || 'Random event occurred'}
                              </p>
                              {event.effects && (
                                <div className="mt-2 text-xs text-gray-600">
                                  <strong>Effects:</strong> {JSON.stringify(event.effects)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {event.duration ? formatTimeRemaining(event.endTime) : 'Instant'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'conversions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Active Conversions ({activeConversions.length})</h3>
                <button
                  onClick={loadData}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Refresh
                </button>
              </div>
              
              {activeConversions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⚗️</div>
                  <p>No active conversions</p>
                  <p className="text-sm">Start a conversion from the Recipes tab</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeConversions.map((conversion, index) => {
                    const style = conversionStatusStyles[conversion.status] || conversionStatusStyles.active;
                    return (
                      <motion.div
                        key={conversion.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${style.bg} border rounded-lg p-4`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="text-2xl">{style.icon}</div>
                            <div>
                              <h4 className={`font-semibold ${style.color}`}>
                                {conversion.recipeName || `Recipe ${conversion.recipeId}`}
                              </h4>
                              <p className="text-gray-700 text-sm">
                                {conversion.inputResources} → {conversion.outputResources}
                              </p>
                              <div className="mt-2 text-xs text-gray-600">
                                Progress: {conversion.progress || 0}% | 
                                Efficiency: {conversion.efficiency || 100}%
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {conversion.completionTime ? formatTimeRemaining(conversion.completionTime) : 'Unknown'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'trigger' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Trigger Random Events (Testing)</h3>
              <p className="text-sm text-gray-600">
                Manually trigger events for testing purposes. This would normally happen automatically during gameplay.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'resource_bonus',
                  'predator_attack',
                  'weather_change',
                  'discovery',
                  'resource_decay',
                  'efficiency_boost'
                ].map((eventType) => (
                  <button
                    key={eventType}
                    onClick={() => triggerRandomEvent(eventType)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all text-sm font-medium"
                  >
                    {eventType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'recipes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Conversion Recipes</h3>
              
              {conversionRecipes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>No conversion recipes available</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {conversionRecipes.map((recipe, index) => (
                    <motion.div
                      key={recipe.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{recipe.name || `Recipe ${recipe.id}`}</h4>
                          <p className="text-sm text-gray-600">
                            {recipe.input} → {recipe.output}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            Efficiency: {recipe.efficiency || 100}% | 
                            Duration: {recipe.duration || 60}s
                          </div>
                        </div>
                        <button
                          onClick={() => startConversion(recipe.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Start
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResourceEventPanel; 
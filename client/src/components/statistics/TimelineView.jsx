import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import statisticsService from '../../services/statisticsService';

const TimelineView = ({ colonyId, timeline: initialTimeline, onRefresh }) => {
  const [timeline, setTimeline] = useState(initialTimeline || []);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    eventType: 'all',
    importanceLevel: 1,
    limit: 50
  });

  useEffect(() => {
    if (colonyId) {
      loadTimeline();
    }
  }, [colonyId, filters]);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const result = await statisticsService.getColonyTimeline(colonyId, {
        eventType: filters.eventType !== 'all' ? filters.eventType : undefined,
        importanceLevel: filters.importanceLevel,
        limit: filters.limit,
        orderDirection: 'desc'
      });

      if (result.success) {
        setTimeline(result.data.events || []);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType, eventSubtype) => {
    const iconMap = {
      milestone: '🏆',
      combat: eventSubtype === 'victory' ? '⚔️' : eventSubtype === 'defeat' ? '💀' : '⚔️',
      construction: '🏗️',
      population: '👥',
      resource: '🌾',
      discovery: '🔍',
      system: '⚙️',
      statistics: '📊'
    };
    return iconMap[eventType] || '📝';
  };

  const getEventColor = (importanceLevel) => {
    const colorMap = {
      1: 'border-gray-300 bg-gray-50',
      2: 'border-blue-300 bg-blue-50',
      3: 'border-yellow-300 bg-yellow-50',
      4: 'border-red-300 bg-red-50'
    };
    return colorMap[importanceLevel] || colorMap[1];
  };

  const getImportanceLabel = (level) => {
    const labels = {
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Critical'
    };
    return labels[level] || 'Unknown';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now - eventTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'milestone', label: 'Milestones' },
    { value: 'combat', label: 'Combat' },
    { value: 'construction', label: 'Construction' },
    { value: 'population', label: 'Population' },
    { value: 'resource', label: 'Resources' },
    { value: 'discovery', label: 'Discoveries' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-earth-50 p-4 rounded-lg border border-earth-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Event Type
            </label>
            <select
              value={filters.eventType}
              onChange={(e) => setFilters(prev => ({ ...prev, eventType: e.target.value }))}
              className="w-full border border-earth-300 rounded px-3 py-2"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Minimum Importance
            </label>
            <select
              value={filters.importanceLevel}
              onChange={(e) => setFilters(prev => ({ ...prev, importanceLevel: parseInt(e.target.value) }))}
              className="w-full border border-earth-300 rounded px-3 py-2"
            >
              <option value={1}>Low and above</option>
              <option value={2}>Medium and above</option>
              <option value={3}>High and above</option>
              <option value={4}>Critical only</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="w-full border border-earth-300 rounded px-3 py-2"
            >
              <option value={25}>25 events</option>
              <option value={50}>50 events</option>
              <option value={100}>100 events</option>
              <option value={200}>200 events</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={onRefresh}
            className="text-forest-600 hover:text-forest-800 text-sm"
          >
            🔄 Refresh Timeline
          </button>
          <span className="text-sm text-earth-600">
            Showing {timeline.length} events
          </span>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full"></div>
        </div>
      ) : timeline.length > 0 ? (
        <div className="space-y-4">
          {timeline.map((event, index) => (
            <motion.div
              key={event.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative pl-10 pb-4 ${
                index < timeline.length - 1 ? 'border-l-2 border-earth-200 ml-4' : ''
              }`}
            >
              {/* Timeline dot */}
              <div className={`absolute -left-3 top-2 w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs ${
                getEventColor(event.importance_level)
              }`}>
                {getEventIcon(event.event_type, event.event_subtype)}
              </div>

              {/* Event content */}
              <div className={`bg-white rounded-lg border p-4 shadow-sm ${getEventColor(event.importance_level)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-earth-800">{event.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded ${
                        event.importance_level >= 3 ? 'bg-yellow-200 text-yellow-800' :
                        event.importance_level >= 2 ? 'bg-blue-200 text-blue-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {getImportanceLabel(event.importance_level)}
                      </span>
                    </div>
                    
                    {event.description && (
                      <p className="text-earth-600 mb-2">{event.description}</p>
                    )}
                    
                    {/* Event metadata */}
                    <div className="flex flex-wrap gap-4 text-xs text-earth-500">
                      <span>Type: {event.event_type}</span>
                      {event.event_subtype && <span>Subtype: {event.event_subtype}</span>}
                      {event.game_tick > 0 && <span>Tick: {event.game_tick}</span>}
                      {event.location_x && event.location_y && (
                        <span>Location: ({event.location_x}, {event.location_y})</span>
                      )}
                    </div>
                    
                    {/* Event data */}
                    {event.event_data && Object.keys(event.event_data).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-earth-500 cursor-pointer hover:text-earth-700">
                          Show details
                        </summary>
                        <pre className="text-xs text-earth-600 mt-1 bg-earth-50 p-2 rounded overflow-auto">
                          {JSON.stringify(event.event_data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  
                  <div className="text-right text-xs text-earth-500 ml-4">
                    <div>{new Date(event.occurred_at).toLocaleDateString()}</div>
                    <div>{new Date(event.occurred_at).toLocaleTimeString()}</div>
                    <div className="mt-1 font-medium">{formatTimeAgo(event.occurred_at)}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-earth-500">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
          <p className="text-earth-400">
            Colony events will appear here as activities occur in your colony.
          </p>
        </div>
      )}
    </div>
  );
};

export default TimelineView; 
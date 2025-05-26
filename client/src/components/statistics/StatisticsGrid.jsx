import React from 'react';
import { motion } from 'framer-motion';

const StatisticsGrid = ({ statistics, formatValue, getIcon }) => {
  if (!statistics || !statistics.aggregated) {
    return (
      <div className="text-center py-8 text-earth-500">
        <p>📊 No statistics data available</p>
      </div>
    );
  }

  const { aggregated, live } = statistics;

  const getCategoryColor = (category) => {
    const colors = {
      population: 'from-blue-500 to-blue-600',
      resources: 'from-green-500 to-green-600',
      combat: 'from-red-500 to-red-600',
      construction: 'from-purple-500 to-purple-600',
      exploration: 'from-yellow-500 to-yellow-600',
      general: 'from-gray-500 to-gray-600'
    };
    return colors[category] || colors.general;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      population: '👥',
      resources: '🌾',
      combat: '⚔️',
      construction: '🏗️',
      exploration: '🗺️',
      general: '📊'
    };
    return icons[category] || icons.general;
  };

  const formatCategoryName = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatStatName = (statName) => {
    return statName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getTimeDifference = (lastUpdated) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-6">
      {/* Live Statistics Summary */}
      {live && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-lg p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Live Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(live.statistics).slice(0, 8).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold">{formatValue(value)}</div>
                <div className="text-forest-200 text-sm">{formatStatName(key)}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-forest-200 text-sm">
            Tracking uptime: {Math.floor((live.tracking.uptime || 0) / 60000)} minutes
          </div>
        </motion.div>
      )}

      {/* Category Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(aggregated).map(([category, stats], categoryIndex) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="bg-white rounded-lg shadow-lg border border-earth-200 overflow-hidden"
          >
            {/* Category Header */}
            <div className={`bg-gradient-to-r ${getCategoryColor(category)} text-white p-4`}>
              <h3 className="text-lg font-semibold flex items-center">
                <span className="mr-2 text-xl">{getCategoryIcon(category)}</span>
                {formatCategoryName(category)}
              </h3>
            </div>

            {/* Statistics */}
            <div className="p-4 space-y-3">
              {Object.entries(stats).map(([statType, statData]) => (
                <div key={statType} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2">{getIcon(statType)}</span>
                    <span className="text-earth-700 text-sm font-medium">
                      {formatStatName(statType)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-earth-900">
                      {formatValue(statData.value)}
                    </div>
                    {statData.lastUpdated && (
                      <div className="text-xs text-earth-500">
                        {getTimeDifference(statData.lastUpdated)}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {Object.keys(stats).length === 0 && (
                <div className="text-center py-4 text-earth-500">
                  <p className="text-sm">No {category} statistics yet</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Card */}
      {statistics.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-earth-50 to-earth-100 rounded-lg p-6 border border-earth-200"
        >
          <h3 className="text-xl font-bold text-earth-800 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-earth-800">
                {statistics.summary.totalRecords || 0}
              </div>
              <div className="text-earth-600 text-sm">Total Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-earth-800">
                {Object.keys(statistics.summary.categories || {}).length}
              </div>
              <div className="text-earth-600 text-sm">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-earth-800">
                {statistics.summary.firstRecorded ? 
                  Math.ceil((new Date() - new Date(statistics.summary.firstRecorded)) / (1000 * 60 * 60 * 24)) : 0}
              </div>
              <div className="text-earth-600 text-sm">Days Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-earth-800">
                {statistics.summary.lastRecorded ? 
                  getTimeDifference(statistics.summary.lastRecorded) : 'Never'}
              </div>
              <div className="text-earth-600 text-sm">Last Update</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {Object.keys(aggregated).length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 text-earth-500"
        >
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No Statistics Yet</h3>
          <p className="text-earth-400">
            Statistics will appear here as your colony grows and activities are tracked.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default StatisticsGrid; 
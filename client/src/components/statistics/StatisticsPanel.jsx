import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import statisticsService from '../../services/statisticsService';
import StatisticsChart from './StatisticsChart';
import StatisticsGrid from './StatisticsGrid';
import TimelineView from './TimelineView';

const StatisticsPanel = ({ colonyId, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [statistics, setStatistics] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('7d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (colonyId) {
      loadStatisticsData();
    }
  }, [colonyId, timeframe, selectedCategory]);

  const loadStatisticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load statistics
      const statsResult = await statisticsService.getColonyStatistics(colonyId, {
        timeframe,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });

      if (!statsResult.success) {
        throw new Error(statsResult.error);
      }

      setStatistics(statsResult.data);

      // Load timeline if on timeline tab
      if (activeTab === 'timeline') {
        const timelineResult = await statisticsService.getColonyTimeline(colonyId, {
          limit: 50,
          orderDirection: 'desc'
        });

        if (timelineResult.success) {
          setTimeline(timelineResult.data);
        }
      }

      // Load milestones if on milestones tab
      if (activeTab === 'milestones') {
        const milestonesResult = await statisticsService.getColonyMilestones(colonyId, {
          limit: 20
        });

        if (milestonesResult.success) {
          setMilestones(milestonesResult.data);
        }
      }

    } catch (err) {
      setError(err.message);
      console.error('Error loading statistics data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleExport = async (format) => {
    try {
      const result = await statisticsService.exportColonyData(colonyId, format, 'all');
      
      if (result.success) {
        const filename = `colony-${colonyId}-statistics.${format}`;
        statisticsService.downloadExportedData(result.data, filename, format);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to export data: ' + err.message);
    }
  };

  const formatStatValue = (value) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  };

  const getStatisticIcon = (statType) => {
    const iconMap = {
      population: '👥',
      food_harvested: '🌾',
      battles_won: '⚔️',
      structures_built: '🏗️',
      territory_explored: '🗺️'
    };
    return iconMap[statType] || '📊';
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      >
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-earth-700">Loading colony statistics...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-forest-800 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Colony Statistics</h2>
              <p className="text-forest-200">Colony ID: {colonyId}</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Timeframe Selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="bg-forest-700 text-white rounded px-3 py-1 border border-forest-600"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>

              {/* Export Button */}
              <div className="relative">
                <button className="bg-forest-600 hover:bg-forest-700 px-4 py-2 rounded text-sm transition-colors">
                  Export
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white text-earth-800 rounded shadow-lg border min-w-[120px] opacity-0 invisible hover:opacity-100 hover:visible transition-all">
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 hover:bg-earth-100"
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 hover:bg-earth-100"
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              <button
                onClick={onClose}
                className="text-forest-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'charts', label: 'Charts', icon: '📈' },
              { id: 'timeline', label: 'Timeline', icon: '📅' },
              { id: 'milestones', label: 'Milestones', icon: '🏆' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-forest-800'
                    : 'text-forest-200 hover:text-white hover:bg-forest-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>Error: {error}</p>
            </div>
          )}

          {activeTab === 'overview' && statistics && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StatisticsGrid 
                statistics={statistics} 
                formatValue={formatStatValue}
                getIcon={getStatisticIcon}
              />
            </motion.div>
          )}

          {activeTab === 'charts' && statistics && (
            <motion.div
              key="charts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  Category Filter:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-earth-300 rounded px-3 py-2"
                >
                  <option value="all">All Categories</option>
                  <option value="population">Population</option>
                  <option value="resources">Resources</option>
                  <option value="combat">Combat</option>
                  <option value="construction">Construction</option>
                  <option value="exploration">Exploration</option>
                </select>
              </div>
              <StatisticsChart 
                colonyId={colonyId}
                statistics={statistics}
                timeframe={timeframe}
                category={selectedCategory}
              />
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <TimelineView 
                colonyId={colonyId}
                timeline={timeline}
                onRefresh={() => loadStatisticsData()}
              />
            </motion.div>
          )}

          {activeTab === 'milestones' && (
            <motion.div
              key="milestones"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {milestones && milestones.length > 0 ? (
                milestones.map((milestone, index) => (
                  <div
                    key={milestone.id || index}
                    className="bg-gradient-to-r from-gold-100 to-gold-200 border border-gold-300 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gold-800 flex items-center">
                          🏆 {milestone.title}
                        </h4>
                        <p className="text-gold-700 mt-1">{milestone.description}</p>
                        {milestone.event_data && (
                          <div className="text-sm text-gold-600 mt-2">
                            <p>Threshold: {milestone.event_data.threshold_value}</p>
                            <p>Achieved: {milestone.event_data.achieved_value}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-gold-600">
                        <p>{new Date(milestone.occurred_at).toLocaleDateString()}</p>
                        <p>{new Date(milestone.occurred_at).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-earth-500">
                  <p>🏆 No milestones achieved yet</p>
                  <p className="text-sm mt-2">Keep growing your colony to unlock achievements!</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StatisticsPanel; 
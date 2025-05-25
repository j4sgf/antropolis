import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AntLifecycleDisplay from './AntLifecycleDisplay';

/**
 * API service for lifecycle management
 */
const lifecycleAPI = {
  getPopulation: async (colonyId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lifecycle/colony/${colonyId}/population`);
    if (!response.ok) throw new Error('Failed to fetch population data');
    return response.json();
  },
  
  getStatus: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lifecycle/status`);
    if (!response.ok) throw new Error('Failed to fetch lifecycle status');
    return response.json();
  },
  
  registerColony: async (colonyId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lifecycle/colony/${colonyId}/register`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to register colony');
    return response.json();
  },
  
  progressAnt: async (antId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lifecycle/ants/${antId}/progress`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to progress ant');
    return response.json();
  },
  
  promoteToQueen: async (antId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lifecycle/ants/queen/${antId}`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to promote ant to queen');
    return response.json();
  },
  
  layEgg: async (queenId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lifecycle/queen/${queenId}/egg`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to lay egg');
    return response.json();
  },
  
  simulate: async (colonyId, ticks = 10) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/lifecycle/simulate/${colonyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticks })
    });
    if (!response.ok) throw new Error('Failed to simulate lifecycle');
    return response.json();
  }
};

/**
 * Population statistics card
 */
const PopulationStatsCard = ({ title, stats, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    green: "bg-green-50 border-green-200 text-green-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    red: "bg-red-50 border-red-200 text-red-800"
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colorClasses[color]} border rounded-lg p-4`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="text-2xl">{icon}</div>
      </div>
      
      <div className="space-y-2">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="flex justify-between text-sm">
            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
            <span className="font-medium">{typeof value === 'number' ? value.toLocaleString() : value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/**
 * Quick action buttons
 */
const QuickActions = ({ colonyId, queens, onAction, disabled = false }) => {
  const actions = [
    {
      id: 'register',
      label: 'Register Colony',
      icon: '📝',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => onAction('register')
    },
    {
      id: 'simulate',
      label: 'Simulate 10 Ticks',
      icon: '⚡',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => onAction('simulate')
    }
  ];
  
  // Add queen-specific actions
  if (queens && queens.length > 0) {
    actions.push({
      id: 'layEgg',
      label: 'Lay Egg',
      icon: '🥚',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: () => onAction('layEgg', queens[0].id)
    });
  }
  
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.action}
          disabled={disabled}
          className={`${action.color} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

/**
 * Main population dashboard component
 */
const PopulationDashboard = ({ colonyId }) => {
  const [populationData, setPopulationData] = useState(null);
  const [lifecycleStatus, setLifecycleStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedAnt, setSelectedAnt] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  /**
   * Load population data
   */
  const loadData = async () => {
    try {
      setError(null);
      const [populationResult, statusResult] = await Promise.all([
        lifecycleAPI.getPopulation(colonyId),
        lifecycleAPI.getStatus()
      ]);
      
      setPopulationData(populationResult.data);
      setLifecycleStatus(statusResult.data);
    } catch (err) {
      setError(err.message);
      console.error('Error loading population data:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle quick actions
   */
  const handleAction = async (action, param = null) => {
    try {
      setError(null);
      
      switch (action) {
        case 'register':
          await lifecycleAPI.registerColony(colonyId);
          if (window.notificationSystem) {
            window.notificationSystem.showSuccess('Colony Registered', 'Colony registered for lifecycle management');
          }
          break;
          
        case 'simulate':
          const result = await lifecycleAPI.simulate(colonyId, 10);
          if (window.notificationSystem) {
            window.notificationSystem.showInfo('Simulation Complete', `Simulated 10 ticks for colony ${colonyId}`);
          }
          break;
          
        case 'layEgg':
          if (param) {
            await lifecycleAPI.layEgg(param);
            if (window.notificationSystem) {
              window.notificationSystem.showSuccess('Egg Laid', 'Queen successfully laid an egg');
            }
          }
          break;
          
        case 'progressAnt':
          if (param) {
            await lifecycleAPI.progressAnt(param);
            if (window.notificationSystem) {
              window.notificationSystem.showSuccess('Ant Progressed', 'Ant progressed to next lifecycle stage');
            }
          }
          break;
          
        case 'promoteQueen':
          if (param) {
            await lifecycleAPI.promoteToQueen(param);
            if (window.notificationSystem) {
              window.notificationSystem.showSuccess('Queen Promoted', 'Worker promoted to queen status');
            }
          }
          break;
      }
      
      // Refresh data after action
      loadData();
    } catch (err) {
      setError(err.message);
      if (window.notificationSystem) {
        window.notificationSystem.showError('Action Failed', err.message);
      }
    }
  };

  /**
   * Handle ant selection
   */
  const handleAntClick = (ant) => {
    setSelectedAnt(ant);
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Loading population data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-red-800 font-medium">Error Loading Population Data</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={loadData}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { population, lifecycle, ants = [] } = populationData || {};
  const queens = ants.filter(ant => ant.queen && ant.queen.eggsLaid !== undefined);
  const activeColony = lifecycleStatus?.colonies?.[colonyId];

  const views = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'ants', label: 'Individual Ants', icon: '🐜' },
    { id: 'queens', label: 'Queens', icon: '👑' },
    { id: 'lifecycle', label: 'Lifecycle System', icon: '⚙️' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Population Management</h2>
          <p className="text-gray-600">Colony #{colonyId}</p>
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
            onClick={loadData}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-4 border">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <QuickActions 
          colonyId={colonyId}
          queens={queens}
          onAction={handleAction}
          disabled={loading}
        />
      </div>

      {/* Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                selectedView === view.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{view.icon}</span>
              <span>{view.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedView === 'overview' && population && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PopulationStatsCard
                title="By Stage"
                stats={population.byStage}
                icon="🔄"
                color="blue"
              />
              
              <PopulationStatsCard
                title="By Type"
                stats={population.byType}
                icon="🎯"
                color="green"
              />
              
              <PopulationStatsCard
                title="General Stats"
                stats={{
                  total: population.total,
                  queens: population.queens,
                  averageAge: Math.round(population.averageAge),
                  foodConsumption: population.totalFoodConsumption.toFixed(1)
                }}
                icon="📈"
                color="purple"
              />
              
              {activeColony && (
                <PopulationStatsCard
                  title="Lifecycle System"
                  stats={{
                    registered: 'Yes',
                    lastTick: activeColony.lastProcessedTick,
                    foodPerTick: activeColony.resourceConsumption.foodPerTick.toFixed(1)
                  }}
                  icon="⚙️"
                  color="yellow"
                />
              )}
            </div>
          )}

          {selectedView === 'ants' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">All Ants ({ants.length})</h3>
                <div className="text-sm text-gray-600">
                  Click on an ant to view details and manage lifecycle
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ants.map((ant) => (
                  <AntLifecycleDisplay
                    key={ant.id}
                    ant={ant}
                    compact={true}
                    onClick={handleAntClick}
                  />
                ))}
              </div>
            </div>
          )}

          {selectedView === 'queens' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Queens ({queens.length})</h3>
                {queens.length === 0 && (
                  <div className="text-sm text-gray-600">
                    No queens found. Promote an adult worker to queen.
                  </div>
                )}
              </div>
              
              {queens.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {queens.map((queen) => (
                    <AntLifecycleDisplay
                      key={queen.id}
                      ant={queen}
                      compact={false}
                      onClick={handleAntClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">👑</div>
                  <p>No queens in this colony</p>
                  <p className="text-sm">Adult workers can be promoted to queens</p>
                </div>
              )}
            </div>
          )}

          {selectedView === 'lifecycle' && lifecycleStatus && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-4">Lifecycle System Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Global Statistics</h4>
                    <div className="space-y-1 text-sm">
                      <div>Total Ticks: {lifecycleStatus.global.totalTicks.toLocaleString()}</div>
                      <div>Ants Processed: {lifecycleStatus.global.antsProcessed.toLocaleString()}</div>
                      <div>Stage Progressions: {lifecycleStatus.global.stageProgressions}</div>
                      <div>Deaths: {lifecycleStatus.global.deaths}</div>
                      <div>Births: {lifecycleStatus.global.births}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Active Colonies</h4>
                    <div className="space-y-1 text-sm">
                      <div>Registered: {lifecycleStatus.activeColonies}</div>
                      <div>This Colony: {activeColony ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Configuration</h4>
                    <div className="space-y-1 text-sm">
                      <div>Tick Interval: {lifecycleStatus.config.TICK_INTERVAL}ms</div>
                      <div>Max Colony Size: {lifecycleStatus.config.MAX_COLONY_SIZE}</div>
                      <div>Queens Per Colony: {lifecycleStatus.config.QUEENS_PER_COLONY}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {activeColony && (
                <div className="bg-white rounded-lg p-6 border">
                  <h3 className="text-lg font-semibold mb-4">Colony Lifecycle Data</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PopulationStatsCard
                      title="Population by Stage"
                      stats={activeColony.populationStats}
                      icon="🔄"
                      color="blue"
                    />
                    
                    <PopulationStatsCard
                      title="Resource Consumption"
                      stats={{
                        foodPerTick: activeColony.resourceConsumption.foodPerTick.toFixed(2),
                        totalConsumed: activeColony.resourceConsumption.totalConsumed.toFixed(1),
                        lastProcessed: activeColony.lastProcessedTick
                      }}
                      icon="🍯"
                      color="yellow"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Selected Ant Modal */}
      {selectedAnt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAnt(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Ant Details</h3>
                <button
                  onClick={() => setSelectedAnt(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <AntLifecycleDisplay ant={selectedAnt} compact={false} />
              
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    handleAction('progressAnt', selectedAnt.id);
                    setSelectedAnt(null);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                >
                  Progress Stage
                </button>
                
                {selectedAnt.lifecycle.status === 'adult' && !selectedAnt.queen && (
                  <button
                    onClick={() => {
                      handleAction('promoteQueen', selectedAnt.id);
                      setSelectedAnt(null);
                    }}
                    className="bg-yellow-500 text-white px-4 py-2 rounded text-sm hover:bg-yellow-600"
                  >
                    Promote to Queen
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default PopulationDashboard; 
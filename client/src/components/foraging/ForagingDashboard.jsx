import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import TrailRenderer from './TrailRenderer'
import RouteOptimizer from './RouteOptimizer'
import ResourceIndicators from './ResourceIndicators'

function ForagingDashboard({ colonyId, colonyData }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [foragingStats, setForagingStats] = useState(null)
  const [timeOfDay, setTimeOfDay] = useState('day')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Get foraging statistics
  const fetchForagingStats = async () => {
    if (!colonyId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/foraging/colony/${colonyId}/statistics`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setForagingStats(result.data)
        }
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching foraging stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh stats
  useEffect(() => {
    fetchForagingStats()
    const interval = setInterval(fetchForagingStats, 3000)
    return () => clearInterval(interval)
  }, [colonyId])

  // Calculate time-of-day efficiency modifier
  const getTimeEfficiency = () => {
    const modifiers = {
      dawn: { efficiency: 0.85, description: 'Cool temperatures, moderate visibility' },
      day: { efficiency: 1.0, description: 'Optimal conditions for foraging' },
      dusk: { efficiency: 0.9, description: 'Good visibility, cooler temperatures' },
      night: { efficiency: 0.6, description: 'Poor visibility, reduced activity' }
    }
    return modifiers[timeOfDay] || modifiers.day
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'trails', label: '🗺️ Trail Map', icon: '🗺️' },
    { id: 'resources', label: '📍 Resource Scan', icon: '📍' },
    { id: 'optimization', label: '🎯 Route Optimizer', icon: '🎯' }
  ]

  return (
    <div className="foraging-dashboard space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-forest-800 flex items-center">
            <span className="text-2xl mr-3">🐜</span>
            Foraging Operations
          </h2>
          <p className="text-sm text-earth-600 mt-1">
            Monitor and optimize your colony's resource collection
          </p>
        </div>

        {/* Time of Day Control */}
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="font-medium text-earth-700">Time:</span>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="ml-2 px-3 py-1 border border-earth-300 rounded"
            >
              <option value="dawn">🌅 Dawn</option>
              <option value="day">☀️ Day</option>
              <option value="dusk">🌇 Dusk</option>
              <option value="night">🌙 Night</option>
            </select>
          </div>
          
          <div className="text-xs text-earth-600">
            Efficiency: {(getTimeEfficiency().efficiency * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      {foragingStats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-green-800 font-semibold">Active Foragers</div>
            <div className="text-2xl font-bold text-green-600">
              {foragingStats.ants?.byState?.foraging || 0}
            </div>
            <div className="text-xs text-green-600">
              {foragingStats.ants?.byState?.returning || 0} returning
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-blue-800 font-semibold">Trail Strength</div>
            <div className="text-2xl font-bold text-blue-600">
              {foragingStats.pheromones?.FOOD_TRAIL?.averageStrength?.toFixed(0) || 0}%
            </div>
            <div className="text-xs text-blue-600">
              {foragingStats.pheromones?.FOOD_TRAIL?.activeNodes || 0} nodes
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-yellow-800 font-semibold">Resources/Min</div>
            <div className="text-2xl font-bold text-yellow-600">
              {foragingStats.efficiency?.resourcesPerMinute?.toFixed(1) || 0}
            </div>
            <div className="text-xs text-yellow-600">
              {((foragingStats.efficiency?.resourcesPerMinute || 0) * getTimeEfficiency().efficiency).toFixed(1)} adjusted
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-purple-800 font-semibold">Map Coverage</div>
            <div className="text-2xl font-bold text-purple-600">
              {foragingStats.exploration?.coveragePercent?.toFixed(0) || 0}%
            </div>
            <div className="text-xs text-purple-600">
              {foragingStats.exploration?.exploredArea || 0} units²
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-earth-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-forest-700 shadow'
                : 'text-earth-600 hover:text-forest-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Time of Day Effects */}
            <div className="bg-earth-50 rounded-lg p-4">
              <h3 className="font-semibold text-forest-800 mb-3">
                🌅 Time of Day Effects
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium text-earth-700">Current Conditions</div>
                  <div className="text-sm text-earth-600">{getTimeEfficiency().description}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs">
                      <span>Foraging Efficiency</span>
                      <span>{(getTimeEfficiency().efficiency * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-earth-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-forest-600 h-2 rounded-full transition-all"
                        style={{ width: `${getTimeEfficiency().efficiency * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-earth-700">Best Times for:</div>
                  <div className="text-xs text-earth-600 space-y-1 mt-1">
                    <div>☀️ Resource Collection: Day (100%)</div>
                    <div>🌅 Exploration: Dawn (85%)</div>
                    <div>🌇 Trail Following: Dusk (90%)</div>
                    <div>🌙 Energy Conservation: Night (60%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Foraging Performance */}
            {foragingStats && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-earth-200">
                  <h3 className="font-semibold text-forest-800 mb-3">🐜 Ant Activity</h3>
                  <div className="space-y-2">
                    {Object.entries(foragingStats.ants?.byState || {}).map(([state, count]) => (
                      <div key={state} className="flex justify-between items-center">
                        <span className="text-sm capitalize text-earth-700">
                          {state.replace('_', ' ')}
                        </span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-earth-200">
                  <h3 className="font-semibold text-forest-800 mb-3">🧪 Pheromone Network</h3>
                  <div className="space-y-2">
                    {Object.entries(foragingStats.pheromones || {}).map(([type, data]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-earth-700">
                          {type.toLowerCase().replace('_', ' ')}
                        </span>
                        <span className="font-medium">
                          {data.averageStrength?.toFixed(0) || 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-medium">Failed to load foraging data</div>
                <div className="text-red-600 text-sm">{error}</div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'trails' && (
          <motion.div
            key="trails"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <TrailRenderer 
              colonyId={colonyId}
              centerX={colonyData?.x || 400}
              centerY={colonyData?.y || 300}
              viewRadius={200}
              refreshInterval={2000}
            />
          </motion.div>
        )}

        {activeTab === 'resources' && (
          <motion.div
            key="resources"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ResourceIndicators 
              colonyId={colonyId}
              centerX={colonyData?.x || 400}
              centerY={colonyData?.y || 300}
              scanRadius={300}
              refreshInterval={5000}
            />
          </motion.div>
        )}

        {activeTab === 'optimization' && (
          <motion.div
            key="optimization"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RouteOptimizer 
              colonyId={colonyId}
              onOptimizationComplete={(results) => {
                console.log('Optimization completed:', results)
                // Could trigger trail map refresh
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
          <div className="text-forest-600">Loading foraging data...</div>
        </div>
      )}
    </div>
  )
}

export default ForagingDashboard 
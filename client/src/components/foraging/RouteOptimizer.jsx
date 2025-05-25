import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function RouteOptimizer({ colonyId, onOptimizationComplete }) {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResults, setOptimizationResults] = useState(null)
  const [optimizationSettings, setOptimizationSettings] = useState({
    algorithm: 'ant_colony_optimization',
    weightDistance: 0.4,
    weightPheromone: 0.3,
    weightObstacles: 0.2,
    weightEfficiency: 0.1,
    iterations: 100,
    considerTimeOfDay: true
  })
  const [error, setError] = useState(null)
  const [routeHistory, setRouteHistory] = useState([])

  // Fetch existing route optimization history
  useEffect(() => {
    if (colonyId) {
      fetchRouteHistory()
    }
  }, [colonyId])

  const fetchRouteHistory = async () => {
    try {
      const response = await fetch(`/api/foraging/colony/${colonyId}/route-history`)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setRouteHistory(result.data || [])
        }
      }
    } catch (err) {
      console.error('Failed to fetch route history:', err)
    }
  }

  const runOptimization = async () => {
    if (!colonyId) return

    setIsOptimizing(true)
    setError(null)

    try {
      const response = await fetch(`/api/foraging/colony/${colonyId}/optimize-routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: optimizationSettings.algorithm,
          weights: {
            distance: optimizationSettings.weightDistance,
            pheromone: optimizationSettings.weightPheromone,
            obstacles: optimizationSettings.weightObstacles,
            efficiency: optimizationSettings.weightEfficiency
          },
          iterations: optimizationSettings.iterations,
          considerTimeOfDay: optimizationSettings.considerTimeOfDay
        })
      })

      if (!response.ok) {
        throw new Error('Optimization request failed')
      }

      const result = await response.json()
      if (result.success) {
        setOptimizationResults(result.data)
        setRouteHistory(prev => [result.data, ...prev.slice(0, 9)]) // Keep last 10
        
        if (onOptimizationComplete) {
          onOptimizationComplete(result.data)
        }
      } else {
        setError(result.error || 'Optimization failed')
      }
    } catch (err) {
      setError(err.message)
      console.error('Route optimization error:', err)
    } finally {
      setIsOptimizing(false)
    }
  }

  const applyOptimization = async () => {
    if (!optimizationResults) return

    try {
      const response = await fetch(`/api/foraging/colony/${colonyId}/apply-optimization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optimizationId: optimizationResults.id,
          newPheromonePattern: optimizationResults.recommendedPheromonePattern
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Show success feedback
          setOptimizationResults(prev => ({ ...prev, applied: true }))
        }
      }
    } catch (err) {
      console.error('Failed to apply optimization:', err)
    }
  }

  return (
    <div className="route-optimizer space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-forest-800 flex items-center">
          <span className="text-xl mr-2">🎯</span>
          Route Optimization
        </h3>
        <div className="text-xs text-earth-600">
          AI-powered foraging efficiency
        </div>
      </div>

      {/* Optimization Settings */}
      <div className="bg-earth-50 rounded-lg p-4 space-y-4">
        <h4 className="font-medium text-forest-700">Optimization Parameters</h4>
        
        {/* Algorithm Selection */}
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1">
            Algorithm
          </label>
          <select
            value={optimizationSettings.algorithm}
            onChange={(e) => setOptimizationSettings(prev => ({
              ...prev, 
              algorithm: e.target.value
            }))}
            className="w-full px-3 py-1 border border-earth-300 rounded text-sm"
          >
            <option value="ant_colony_optimization">Ant Colony Optimization (ACO)</option>
            <option value="a_star_enhanced">Enhanced A* with Pheromones</option>
            <option value="genetic_algorithm">Genetic Algorithm</option>
            <option value="simulated_annealing">Simulated Annealing</option>
          </select>
        </div>

        {/* Weight Sliders */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'weightDistance', label: 'Distance Priority', color: 'blue' },
            { key: 'weightPheromone', label: 'Pheromone Influence', color: 'green' },
            { key: 'weightObstacles', label: 'Obstacle Avoidance', color: 'red' },
            { key: 'weightEfficiency', label: 'Energy Efficiency', color: 'yellow' }
          ].map(({ key, label, color }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-earth-700 mb-1">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={optimizationSettings[key]}
                  onChange={(e) => setOptimizationSettings(prev => ({
                    ...prev,
                    [key]: parseFloat(e.target.value)
                  }))}
                  className={`flex-1 h-1 bg-${color}-200 rounded appearance-none`}
                />
                <span className="text-xs w-8 text-right">
                  {(optimizationSettings[key] * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Advanced Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-earth-700 mb-1">
              Iterations
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={optimizationSettings.iterations}
              onChange={(e) => setOptimizationSettings(prev => ({
                ...prev,
                iterations: parseInt(e.target.value)
              }))}
              className="w-full px-2 py-1 border border-earth-300 rounded text-sm"
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={optimizationSettings.considerTimeOfDay}
                onChange={(e) => setOptimizationSettings(prev => ({
                  ...prev,
                  considerTimeOfDay: e.target.checked
                }))}
              />
              Consider time-of-day effects
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={runOptimization}
          disabled={isOptimizing || !colonyId}
          className="flex-1 px-4 py-2 bg-forest-600 text-white rounded font-medium hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOptimizing ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Optimizing...
            </>
          ) : (
            <>🚀 Run Optimization</>
          )}
        </button>

        {optimizationResults && !optimizationResults.applied && (
          <button
            onClick={applyOptimization}
            className="px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
          >
            ✅ Apply Changes
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="text-red-800 text-sm font-medium">Optimization Failed</div>
          <div className="text-red-600 text-xs">{error}</div>
        </motion.div>
      )}

      {/* Optimization Results */}
      <AnimatePresence>
        {optimizationResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-green-800">
                🎯 Optimization Complete
              </h4>
              {optimizationResults.applied && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                  Applied
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-700">Efficiency Improvement</div>
                <div className="text-green-600">
                  +{optimizationResults.efficiencyGain?.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="font-medium text-green-700">Average Path Length</div>
                <div className="text-green-600">
                  {optimizationResults.averagePathLength?.toFixed(1)} units
                </div>
              </div>
              <div>
                <div className="font-medium text-green-700">Resource Discovery Time</div>
                <div className="text-green-600">
                  -{optimizationResults.timeReduction?.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="font-medium text-green-700">Energy Efficiency</div>
                <div className="text-green-600">
                  {optimizationResults.energyScore?.toFixed(1)}/10
                </div>
              </div>
            </div>

            {optimizationResults.recommendations && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="font-medium text-green-700 text-xs mb-1">Recommendations:</div>
                <ul className="text-xs text-green-600 space-y-1">
                  {optimizationResults.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route History */}
      {routeHistory.length > 0 && (
        <div className="bg-earth-50 rounded-lg p-4">
          <h4 className="font-medium text-earth-700 mb-3">Recent Optimizations</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {routeHistory.map((history, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-earth-600">
                  {new Date(history.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-green-600 font-medium">
                  +{history.efficiencyGain?.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RouteOptimizer 
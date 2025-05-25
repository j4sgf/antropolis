import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

const RESOURCE_TYPES = {
  LEAVES: { emoji: '🍃', color: '#4CAF50', name: 'Leaves' },
  FUNGUS: { emoji: '🍄', color: '#8D6E63', name: 'Fungus' },
  SEEDS: { emoji: '🌰', color: '#FF8F00', name: 'Seeds' },
  INSECT_REMAINS: { emoji: '🦗', color: '#795548', name: 'Insect Remains' },
  NECTAR: { emoji: '🍯', color: '#FFC107', name: 'Nectar' }
}

function ResourceIndicators({ 
  colonyId, 
  centerX = 400, 
  centerY = 300, 
  scanRadius = 300,
  refreshInterval = 5000,
  showResourceTypes = Object.keys(RESOURCE_TYPES)
}) {
  const [resourceAreas, setResourceAreas] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [timeOfDay, setTimeOfDay] = useState('day')
  const [error, setError] = useState(null)

  // Fetch resource-rich areas data
  const scanResourceAreas = async () => {
    if (!colonyId) return

    setIsScanning(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/foraging/colony/${colonyId}/resource-scan?` +
        `centerX=${centerX}&centerY=${centerY}&radius=${scanRadius}&` +
        `types=${showResourceTypes.join(',')}&timeOfDay=${timeOfDay}`
      )

      if (!response.ok) {
        throw new Error('Resource scan failed')
      }

      const result = await response.json()
      if (result.success) {
        setResourceAreas(result.data.areas || [])
        setScanResults(result.data.summary)
      } else {
        setError(result.error || 'Scan failed')
      }
    } catch (err) {
      setError(err.message)
      console.error('Resource scan error:', err)
    } finally {
      setIsScanning(false)
    }
  }

  // Auto-refresh scanning
  useEffect(() => {
    scanResourceAreas()
    const interval = setInterval(scanResourceAreas, refreshInterval)
    return () => clearInterval(interval)
  }, [colonyId, centerX, centerY, scanRadius, showResourceTypes, timeOfDay, refreshInterval])

  // Calculate richness level for display
  const getRichnessLevel = (density) => {
    if (density >= 80) return { level: 'Abundant', color: 'emerald', priority: 'high' }
    if (density >= 60) return { level: 'Rich', color: 'green', priority: 'medium' }
    if (density >= 40) return { level: 'Moderate', color: 'yellow', priority: 'medium' }
    if (density >= 20) return { level: 'Sparse', color: 'orange', priority: 'low' }
    return { level: 'Depleted', color: 'red', priority: 'low' }
  }

  // Calculate distance from colony center
  const getDistanceFromCenter = (x, y) => {
    return Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2))
  }

  return (
    <div className="resource-indicators space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-forest-800 flex items-center">
          <span className="text-xl mr-2">📍</span>
          Resource Hotspots
        </h3>
        <div className="flex items-center gap-2">
          {/* Time of Day Selector */}
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="text-xs px-2 py-1 border border-earth-300 rounded"
          >
            <option value="dawn">🌅 Dawn</option>
            <option value="day">☀️ Day</option>
            <option value="dusk">🌇 Dusk</option>
            <option value="night">🌙 Night</option>
          </select>
          
          <button
            onClick={scanResourceAreas}
            disabled={isScanning}
            className="px-3 py-1 bg-forest-600 text-white rounded text-xs hover:bg-forest-700 disabled:opacity-50"
          >
            {isScanning ? '⟳' : '🔍'} Scan
          </button>
        </div>
      </div>

      {/* Resource Type Filters */}
      <div className="bg-earth-50 rounded-lg p-3">
        <div className="text-sm font-medium text-earth-700 mb-2">Resource Types</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(RESOURCE_TYPES).map(([type, config]) => (
            <label key={type} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={showResourceTypes.includes(type)}
                onChange={(e) => {
                  // Note: Parent should handle this via props
                }}
                className="w-3 h-3"
              />
              <span>{config.emoji}</span>
              <span>{config.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Scan Summary */}
      {scanResults && (
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800 mb-2">
            📊 Scan Results ({scanResults.areasFound} areas found)
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="font-medium text-blue-700">Total Resources</div>
              <div className="text-blue-600">{scanResults.totalResources}</div>
            </div>
            <div>
              <div className="font-medium text-blue-700">Average Density</div>
              <div className="text-blue-600">{scanResults.averageDensity?.toFixed(1)}%</div>
            </div>
            <div>
              <div className="font-medium text-blue-700">Scan Efficiency</div>
              <div className="text-blue-600">
                {timeOfDay === 'day' ? 'High' : timeOfDay === 'night' ? 'Low' : 'Medium'}
              </div>
            </div>
            <div>
              <div className="font-medium text-blue-700">Best Resource Type</div>
              <div className="text-blue-600">
                {scanResults.dominantType ? 
                  RESOURCE_TYPES[scanResults.dominantType]?.emoji + ' ' + 
                  RESOURCE_TYPES[scanResults.dominantType]?.name 
                  : 'Mixed'
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm font-medium">Scan Error</div>
          <div className="text-red-600 text-xs">{error}</div>
        </div>
      )}

      {/* Resource Areas List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {resourceAreas.length === 0 && !isScanning ? (
          <div className="text-center py-8 text-earth-500">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm">No resource hotspots detected</div>
            <div className="text-xs">Try expanding scan radius or different time of day</div>
          </div>
        ) : (
          resourceAreas
            .sort((a, b) => {
              // Sort by priority (richness) then by distance
              const aPriority = getRichnessLevel(a.density).priority
              const bPriority = getRichnessLevel(b.density).priority
              if (aPriority !== bPriority) {
                const priorityOrder = { high: 3, medium: 2, low: 1 }
                return priorityOrder[bPriority] - priorityOrder[aPriority]
              }
              return getDistanceFromCenter(a.x, a.y) - getDistanceFromCenter(b.x, b.y)
            })
            .map((area, index) => {
              const richness = getRichnessLevel(area.density)
              const distance = getDistanceFromCenter(area.x, area.y)
              const resourceConfig = RESOURCE_TYPES[area.primaryType]

              return (
                <motion.div
                  key={`${area.x}-${area.y}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg border-l-4 bg-${richness.color}-50 border-${richness.color}-400`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{resourceConfig?.emoji || '📦'}</span>
                        <span className="font-medium text-sm">
                          {resourceConfig?.name || area.primaryType}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded bg-${richness.color}-200 text-${richness.color}-800`}>
                          {richness.level}
                        </span>
                      </div>
                      
                      <div className="text-xs text-earth-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Position:</span>
                          <span>({area.x}, {area.y})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span>{distance.toFixed(0)} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Density:</span>
                          <span>{area.density}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Quantity:</span>
                          <span>{area.estimatedQuantity}</span>
                        </div>
                      </div>

                      {/* Quality modifiers based on time of day */}
                      {area.timeModifiers && (
                        <div className="mt-2 text-xs">
                          <span className="font-medium text-earth-700">Time Effects:</span>
                          <div className="text-earth-600">
                            {area.timeModifiers.map((modifier, i) => (
                              <span key={i} className="ml-1">
                                {modifier}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1 ml-2">
                      <button 
                        className="text-xs px-2 py-1 bg-forest-600 text-white rounded hover:bg-forest-700"
                        onClick={() => {
                          // Could trigger "Send scouts" action
                          console.log('Scout area:', area)
                        }}
                      >
                        🐜 Scout
                      </button>
                      <button 
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => {
                          // Could trigger "Mark priority" action
                          console.log('Mark priority:', area)
                        }}
                      >
                        📌 Mark
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
        )}
      </div>

      {/* Loading indicator */}
      {isScanning && (
        <div className="text-center py-4">
          <div className="animate-spin text-2xl mb-2">🔍</div>
          <div className="text-sm text-earth-600">Scanning for resources...</div>
        </div>
      )}
    </div>
  )
}

export default ResourceIndicators 
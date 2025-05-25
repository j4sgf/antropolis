import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const PHEROMONE_COLORS = {
  FOOD_TRAIL: '#4CAF50',      // Green
  HOME_TRAIL: '#2196F3',      // Blue  
  EXPLORATION_TRAIL: '#FF9800', // Orange
  DANGER_TRAIL: '#F44336'     // Red
}

function TrailRenderer({ 
  colonyId, 
  centerX = 400, 
  centerY = 300, 
  viewRadius = 200,
  showTrailTypes = ['FOOD_TRAIL', 'HOME_TRAIL'],
  refreshInterval = 2000 
}) {
  const [pheromoneData, setPheromoneData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)

  // Fetch pheromone visualization data
  const fetchPheromoneData = async () => {
    if (!colonyId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/foraging/colony/${colonyId}/pheromones?` + 
        `centerX=${centerX}&centerY=${centerY}&radius=${viewRadius}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch pheromone data')
      }
      
      const result = await response.json()
      if (result.success) {
        // Filter by selected trail types
        const filteredData = result.data.filter(cell => 
          showTrailTypes.includes(cell.type)
        )
        setPheromoneData(filteredData)
      } else {
        setError(result.error || 'Unknown error')
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching pheromone data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh pheromone data
  useEffect(() => {
    fetchPheromoneData()
    
    const interval = setInterval(fetchPheromoneData, refreshInterval)
    return () => clearInterval(interval)
  }, [colonyId, centerX, centerY, viewRadius, showTrailTypes, refreshInterval])

  // Render pheromone trails on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || pheromoneData.length === 0) return

    const ctx = canvas.getContext('2d')
    const { width, height } = canvas

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Render each pheromone cell
    pheromoneData.forEach(cell => {
      // Convert world coordinates to canvas coordinates
      const canvasX = (cell.x - centerX + viewRadius) * (width / (viewRadius * 2))
      const canvasY = (cell.y - centerY + viewRadius) * (height / (viewRadius * 2))
      
      if (canvasX >= 0 && canvasX < width && canvasY >= 0 && canvasY < height) {
        ctx.fillStyle = `${PHEROMONE_COLORS[cell.type]}${Math.floor(cell.opacity * 255).toString(16).padStart(2, '0')}`
        
        const cellSize = (cell.cellSize * width) / (viewRadius * 2)
        ctx.fillRect(canvasX - cellSize/2, canvasY - cellSize/2, cellSize, cellSize)
      }
    })
  }, [pheromoneData, centerX, centerY, viewRadius])

  return (
    <div className="trail-renderer">
      {/* Trail Controls */}
      <div className="mb-4 p-3 bg-earth-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-forest-800">🗺️ Pheromone Trail Visualization</h4>
          <button
            onClick={fetchPheromoneData}
            disabled={isLoading}
            className="px-3 py-1 bg-forest-600 text-white rounded text-sm hover:bg-forest-700 disabled:opacity-50"
          >
            {isLoading ? '⟳' : '🔄'} Refresh
          </button>
        </div>

        {/* Trail Type Filters */}
        <div className="flex gap-2 flex-wrap">
          {Object.entries(PHEROMONE_COLORS).map(([type, color]) => (
            <label key={type} className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={showTrailTypes.includes(type)}
                onChange={(e) => {
                  const newTypes = e.target.checked 
                    ? [...showTrailTypes, type]
                    : showTrailTypes.filter(t => t !== type)
                  // Note: Parent component should handle this via props
                }}
                className="w-3 h-3"
              />
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: color }}
              />
              <span className="capitalize">
                {type.toLowerCase().replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Canvas for trail rendering */}
      <motion.div 
        className="relative border border-earth-300 rounded-lg overflow-hidden bg-earth-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-full"
          style={{ imageRendering: 'pixelated' }}
        />
        
        {/* Overlay information */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          View: {centerX},{centerY} (±{viewRadius})
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
            <div className="text-sm text-forest-600">Loading trails...</div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center">
            <div className="text-sm text-red-600 text-center p-4">
              <div className="font-medium">Failed to load trails</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {/* Trail statistics */}
        {pheromoneData.length > 0 && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {pheromoneData.length} trail segments
          </div>
        )}
      </motion.div>

      {/* Trail legend */}
      <div className="mt-3 text-xs text-earth-600">
        <div className="font-medium mb-1">Trail Types:</div>
        <div className="grid grid-cols-2 gap-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded"/>
            Food Trail - Leads to resources
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded"/>
            Home Trail - Back to colony
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-orange-500 rounded"/>
            Exploration - Scouting paths
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded"/>
            Danger Trail - Avoid areas
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrailRenderer 
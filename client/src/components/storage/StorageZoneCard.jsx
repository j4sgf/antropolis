import { motion } from 'framer-motion'
import { useState } from 'react'

function StorageZoneCard({ zone, resources, onResourceTransfer, onZoneUpdate }) {
  const [expanded, setExpanded] = useState(false)

  // Calculate zone utilization
  const totalQuantity = resources.reduce((sum, resource) => sum + resource.quantity, 0)
  const utilizationPercentage = zone.capacity > 0 ? (totalQuantity / zone.capacity) * 100 : 0
  const isNearFull = utilizationPercentage >= 80
  const isFull = utilizationPercentage >= 95

  // Get zone color classes
  const getZoneColorClasses = () => {
    const baseColors = {
      blue: 'border-blue-200 bg-blue-50',
      green: 'border-green-200 bg-green-50',
      yellow: 'border-yellow-200 bg-yellow-50',
      red: 'border-red-200 bg-red-50'
    }
    return baseColors[zone.color] || 'border-gray-200 bg-gray-50'
  }

  const getProgressBarColor = () => {
    if (isFull) return 'bg-red-500'
    if (isNearFull) return 'bg-yellow-500'
    
    const progressColors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500'
    }
    return progressColors[zone.color] || 'bg-gray-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-md border-2 transition-all duration-300 ${
        isFull ? 'border-red-300' : isNearFull ? 'border-yellow-300' : getZoneColorClasses()
      }`}
    >
      {/* Zone Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{zone.icon}</div>
            <div>
              <h4 className="font-semibold text-forest-800">{zone.displayName}</h4>
              <p className="text-sm text-earth-600">{zone.description}</p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-earth-600 hover:text-earth-800 transition-colors"
          >
            {expanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-earth-600">Capacity</span>
            <span className={`font-medium ${
              isFull ? 'text-red-600' : isNearFull ? 'text-yellow-600' : 'text-earth-800'
            }`}>
              {totalQuantity} / {zone.capacity}
            </span>
          </div>
          
          <div className="w-full h-2 bg-earth-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              transition={{ duration: 0.8 }}
              className={`h-full transition-colors ${getProgressBarColor()}`}
            />
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className={`${
              isFull ? 'text-red-600' : isNearFull ? 'text-yellow-600' : 'text-earth-500'
            }`}>
              {utilizationPercentage.toFixed(1)}% full
            </span>
            <span className="text-earth-500">
              {zone.capacity - totalQuantity} available
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-earth-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-forest-700">{resources.length}</div>
            <div className="text-xs text-earth-600">Resource Types</div>
          </div>
          <div className="bg-earth-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-forest-700">
              {resources.reduce((sum, r) => sum + r.reserved_quantity, 0)}
            </div>
            <div className="text-xs text-earth-600">Reserved</div>
          </div>
        </div>

        {/* Status Indicator */}
        {(isFull || isNearFull) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mt-3 p-2 rounded-lg text-center text-sm ${
              isFull 
                ? 'bg-red-100 text-red-800 border border-red-200' 
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}
          >
            {isFull ? '⚠️ Storage Full' : '⚠️ Near Capacity'}
          </motion.div>
        )}
      </div>

      {/* Expanded Resources List */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="border-t border-earth-200 p-4">
          <h5 className="font-medium text-earth-800 mb-3">Stored Resources</h5>
          
          {resources.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">📦</div>
              <p className="text-earth-600 text-sm">Zone is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {resources.map((resource, index) => (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-earth-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {resource.resource_type === 'LEAVES' ? '🍃' :
                       resource.resource_type === 'FUNGUS' ? '🍄' :
                       resource.resource_type === 'SEEDS' ? '🌰' :
                       resource.resource_type === 'INSECT_REMAINS' ? '🦗' :
                       resource.resource_type === 'NECTAR' ? '🍯' : '📦'}
                    </span>
                    <div>
                      <div className="font-medium text-earth-800 text-sm">
                        {resource.resource_type.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-earth-600">
                        Quality: {resource.quality.toFixed(1)}%
                        {resource.reserved_quantity > 0 && (
                          <span className="ml-2 text-orange-600">
                            ({resource.reserved_quantity} reserved)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-semibold text-earth-800">{resource.quantity}</div>
                      <div className="text-xs text-earth-600">units</div>
                    </div>
                    <button
                      onClick={() => onResourceTransfer(resource)}
                      className="text-forest-600 hover:text-forest-800 text-xs underline"
                    >
                      Transfer
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default StorageZoneCard 
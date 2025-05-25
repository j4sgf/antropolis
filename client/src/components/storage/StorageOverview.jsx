import { motion } from 'framer-motion'

function StorageOverview({ summary, totalResources, zones, onRefresh }) {
  // Calculate overall storage utilization
  const calculateOverallUtilization = () => {
    if (!summary) return { used: 0, total: 0, percentage: 0 }
    
    const totalCapacity = Object.values(zones).reduce((sum, zone) => sum + zone.capacity, 0)
    const totalUsed = summary.totalQuantity || 0
    
    return {
      used: totalUsed,
      total: totalCapacity,
      percentage: totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0
    }
  }

  // Get storage utilization by zone
  const getZoneUtilizations = () => {
    if (!summary?.byZone) return {}
    
    const utilizations = {}
    Object.entries(zones).forEach(([zoneName, zoneConfig]) => {
      const zoneData = summary.byZone[zoneName] || { totalQuantity: 0 }
      utilizations[zoneName] = {
        used: zoneData.totalQuantity || 0,
        capacity: zoneConfig.capacity,
        percentage: zoneConfig.capacity > 0 ? (zoneData.totalQuantity / zoneConfig.capacity) * 100 : 0
      }
    })
    
    return utilizations
  }

  // Get resource type breakdown
  const getResourceBreakdown = () => {
    if (!summary?.byType) return []
    
    return Object.entries(summary.byType).map(([type, data]) => ({
      type,
      quantity: data.totalQuantity || 0,
      averageQuality: data.averageQuality || 0,
      icon: type === 'LEAVES' ? '🍃' :
           type === 'FUNGUS' ? '🍄' :
           type === 'SEEDS' ? '🌰' :
           type === 'INSECT_REMAINS' ? '🦗' :
           type === 'NECTAR' ? '🍯' : '📦'
    })).sort((a, b) => b.quantity - a.quantity)
  }

  const overallUtilization = calculateOverallUtilization()
  const zoneUtilizations = getZoneUtilizations()
  const resourceBreakdown = getResourceBreakdown()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Storage Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-6 shadow-md border border-earth-200"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-forest-800">Storage Overview</h3>
          <button
            onClick={onRefresh}
            className="text-earth-600 hover:text-earth-800 transition-colors"
          >
            🔄
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-earth-600">Overall Capacity</span>
              <span className="text-sm font-medium text-earth-800">
                {overallUtilization.used} / {overallUtilization.total}
              </span>
            </div>
            <div className="w-full h-3 bg-earth-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallUtilization.percentage, 100)}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full transition-colors ${
                  overallUtilization.percentage >= 90 ? 'bg-red-500' :
                  overallUtilization.percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-earth-500">
                {overallUtilization.percentage.toFixed(1)}% full
              </span>
              <span className="text-xs text-earth-500">
                {overallUtilization.total - overallUtilization.used} available
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-earth-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-forest-700">{totalResources}</div>
              <div className="text-xs text-earth-600">Resource Types</div>
            </div>
            <div className="bg-earth-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-forest-700">{Object.keys(zones).length}</div>
              <div className="text-xs text-earth-600">Storage Zones</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Zone Utilization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg p-6 shadow-md border border-earth-200"
      >
        <h3 className="text-lg font-semibold text-forest-800 mb-4">Zone Utilization</h3>
        
        <div className="space-y-3">
          {Object.entries(zoneUtilizations).map(([zoneName, utilization]) => {
            const zone = zones[zoneName]
            return (
              <div key={zoneName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{zone.icon}</span>
                    <span className="text-sm font-medium text-earth-800">{zone.displayName}</span>
                  </div>
                  <span className="text-sm text-earth-600">
                    {utilization.used}/{utilization.capacity}
                  </span>
                </div>
                <div className="w-full h-2 bg-earth-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(utilization.percentage, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className={`h-full transition-colors ${
                      zone.color === 'blue' ? 'bg-blue-500' :
                      zone.color === 'green' ? 'bg-green-500' :
                      zone.color === 'yellow' ? 'bg-yellow-500' :
                      zone.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
                    }`}
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs text-earth-500">
                    {utilization.percentage.toFixed(1)}% full
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Resource Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg p-6 shadow-md border border-earth-200"
      >
        <h3 className="text-lg font-semibold text-forest-800 mb-4">Resource Breakdown</h3>
        
        {resourceBreakdown.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">📦</div>
            <p className="text-earth-600 text-sm">No resources stored</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resourceBreakdown.slice(0, 5).map((resource, index) => (
              <motion.div
                key={resource.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{resource.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-earth-800">
                      {resource.type.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-earth-600">
                      Quality: {resource.averageQuality.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-forest-700">
                    {resource.quantity}
                  </div>
                  <div className="text-xs text-earth-600">units</div>
                </div>
              </motion.div>
            ))}
            
            {resourceBreakdown.length > 5 && (
              <div className="text-center text-sm text-earth-500 pt-2 border-t border-earth-200">
                +{resourceBreakdown.length - 5} more resource types
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default StorageOverview 
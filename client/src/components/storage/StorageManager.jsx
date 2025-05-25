import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StorageZoneCard from './StorageZoneCard'
import ResourceTransferModal from './ResourceTransferModal'
import StorageOverview from './StorageOverview'
import AddResourceModal from './AddResourceModal'

function StorageManager({ colonyId }) {
  const [storageData, setStorageData] = useState(null)
  const [storageSummary, setStorageSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Modal states
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [addResourceModalOpen, setAddResourceModalOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  
  // View settings
  const [viewMode, setViewMode] = useState('zones') // 'zones' or 'resources'
  const [filterZone, setFilterZone] = useState('all')

  useEffect(() => {
    if (colonyId) {
      fetchStorageData()
      fetchStorageSummary()
    }
  }, [colonyId, refreshTrigger])

  const fetchStorageData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/resources/colony/${colonyId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch storage data')
      }
      
      const data = await response.json()
      setStorageData(data.data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching storage data:', err)
    }
  }

  const fetchStorageSummary = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/resources/colony/${colonyId}/storage`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch storage summary')
      }
      
      const data = await response.json()
      setStorageSummary(data.data)
    } catch (err) {
      console.error('Error fetching storage summary:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResourceTransfer = (resource) => {
    setSelectedResource(resource)
    setTransferModalOpen(true)
  }

  const handleTransferComplete = () => {
    setTransferModalOpen(false)
    setSelectedResource(null)
    triggerRefresh()
  }

  const handleAddResource = () => {
    setAddResourceModalOpen(true)
  }

  const handleAddResourceComplete = () => {
    setAddResourceModalOpen(false)
    triggerRefresh()
  }

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Group resources by storage zone
  const getResourcesByZone = () => {
    if (!storageData?.resources) return {}
    
    const grouped = {}
    storageData.resources.forEach(resource => {
      const zone = resource.storage_zone || 'general'
      if (!grouped[zone]) grouped[zone] = []
      grouped[zone].push(resource)
    })
    
    return grouped
  }

  // Get storage zone configurations
  const getStorageZones = () => {
    return {
      general: {
        name: 'general',
        displayName: 'General Storage',
        icon: '📦',
        color: 'blue',
        capacity: 500,
        description: 'Main storage area for common resources'
      },
      food_processing: {
        name: 'food_processing',
        displayName: 'Food Processing',
        icon: '🍃',
        color: 'green',
        capacity: 200,
        description: 'Specialized area for processing and preparing food'
      },
      nursery_supplies: {
        name: 'nursery_supplies',
        displayName: 'Nursery Supplies',
        icon: '🥚',
        color: 'yellow',
        capacity: 100,
        description: 'Resources dedicated to larvae and nursery care'
      },
      emergency_reserves: {
        name: 'emergency_reserves',
        displayName: 'Emergency Reserves',
        icon: '🔐',
        color: 'red',
        capacity: 150,
        description: 'Protected storage for emergency situations'
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-md border border-earth-200">
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-3xl mr-3"
          >
            📦
          </motion.div>
          <div className="text-lg text-earth-700">Loading storage data...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-md border border-red-200">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Storage Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={triggerRefresh}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const resourcesByZone = getResourcesByZone()
  const storageZones = getStorageZones()

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <StorageOverview 
        summary={storageSummary}
        totalResources={storageData?.count || 0}
        zones={storageZones}
        onRefresh={triggerRefresh}
      />

      {/* Controls */}
      <div className="bg-white rounded-lg p-6 shadow-md border border-earth-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-forest-800">Storage Management</h3>
            <div className="flex rounded-lg border border-earth-300 overflow-hidden">
              <button
                onClick={() => setViewMode('zones')}
                className={`px-3 py-1 text-sm transition-colors ${
                  viewMode === 'zones'
                    ? 'bg-forest-600 text-white'
                    : 'bg-white text-earth-600 hover:bg-earth-50'
                }`}
              >
                📦 Zones
              </button>
              <button
                onClick={() => setViewMode('resources')}
                className={`px-3 py-1 text-sm transition-colors ${
                  viewMode === 'resources'
                    ? 'bg-forest-600 text-white'
                    : 'bg-white text-earth-600 hover:bg-earth-50'
                }`}
              >
                📋 Resources
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {viewMode === 'resources' && (
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="px-3 py-2 border border-earth-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-500"
              >
                <option value="all">All Zones</option>
                {Object.values(storageZones).map(zone => (
                  <option key={zone.name} value={zone.name}>
                    {zone.displayName}
                  </option>
                ))}
              </select>
            )}
            
            <button
              onClick={handleAddResource}
              className="bg-forest-600 text-white px-4 py-2 rounded-md hover:bg-forest-700 transition-colors text-sm"
            >
              ➕ Add Resource
            </button>
            
            <button
              onClick={triggerRefresh}
              className="bg-earth-600 text-white px-4 py-2 rounded-md hover:bg-earth-700 transition-colors text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Storage Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'zones' ? (
          <motion.div
            key="zones"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {Object.values(storageZones).map(zone => (
              <StorageZoneCard
                key={zone.name}
                zone={zone}
                resources={resourcesByZone[zone.name] || []}
                onResourceTransfer={handleResourceTransfer}
                onZoneUpdate={triggerRefresh}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="resources"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg shadow-md border border-earth-200"
          >
            <div className="p-6">
              <h4 className="text-lg font-semibold text-forest-800 mb-4">Resource Inventory</h4>
              
              {storageData?.resources?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-earth-600">No resources in storage</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-earth-200">
                        <th className="text-left py-2 px-3 text-earth-700">Resource</th>
                        <th className="text-left py-2 px-3 text-earth-700">Quantity</th>
                        <th className="text-left py-2 px-3 text-earth-700">Quality</th>
                        <th className="text-left py-2 px-3 text-earth-700">Zone</th>
                        <th className="text-left py-2 px-3 text-earth-700">Status</th>
                        <th className="text-right py-2 px-3 text-earth-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageData?.resources
                        ?.filter(resource => filterZone === 'all' || resource.storage_zone === filterZone)
                        ?.map(resource => (
                        <motion.tr
                          key={resource.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-earth-100 hover:bg-earth-50"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">
                                {resource.resource_type === 'LEAVES' ? '🍃' :
                                 resource.resource_type === 'FUNGUS' ? '🍄' :
                                 resource.resource_type === 'SEEDS' ? '🌰' :
                                 resource.resource_type === 'INSECT_REMAINS' ? '🦗' :
                                 resource.resource_type === 'NECTAR' ? '🍯' : '📦'}
                              </span>
                              <div>
                                <div className="font-medium text-earth-800">
                                  {resource.resource_type.replace('_', ' ')}
                                </div>
                                {resource.reserved_quantity > 0 && (
                                  <div className="text-xs text-orange-600">
                                    {resource.reserved_quantity} reserved
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-earth-700">{resource.quantity}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm ${
                                resource.quality >= 80 ? 'text-green-600' :
                                resource.quality >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {resource.quality.toFixed(1)}%
                              </span>
                              <div className="w-12 h-2 bg-earth-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${
                                    resource.quality >= 80 ? 'bg-green-500' :
                                    resource.quality >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${resource.quality}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center space-x-1 bg-earth-100 text-earth-700 px-2 py-1 rounded-full text-xs">
                              <span>{storageZones[resource.storage_zone]?.icon || '📦'}</span>
                              <span>{storageZones[resource.storage_zone]?.displayName || 'Unknown'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {resource.reserved_quantity > 0 ? (
                              <span className="text-orange-600 text-sm">Partially Reserved</span>
                            ) : (
                              <span className="text-green-600 text-sm">Available</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleResourceTransfer(resource)}
                              className="text-forest-600 hover:text-forest-800 text-sm underline"
                            >
                              Transfer
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ResourceTransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        resource={selectedResource}
        zones={storageZones}
        colonyId={colonyId}
        onTransferComplete={handleTransferComplete}
      />

      <AddResourceModal
        isOpen={addResourceModalOpen}
        onClose={() => setAddResourceModalOpen(false)}
        colonyId={colonyId}
        zones={storageZones}
        onAddComplete={handleAddResourceComplete}
      />
    </div>
  )
}

export default StorageManager 
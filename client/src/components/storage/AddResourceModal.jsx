import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function AddResourceModal({ isOpen, onClose, colonyId, zones, onAddComplete }) {
  const [resourceType, setResourceType] = useState('')
  const [quantity, setQuantity] = useState('')
  const [quality, setQuality] = useState('100')
  const [storageZone, setStorageZone] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setResourceType('')
      setQuantity('')
      setQuality('100')
      setStorageZone('general')
      setError(null)
    }
  }, [isOpen])

  const handleAddResource = async () => {
    if (!resourceType || !quantity) {
      setError('Please fill in resource type and quantity')
      return
    }

    const quantityNum = parseInt(quantity)
    const qualityNum = parseFloat(quality)

    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantity must be a positive number')
      return
    }

    if (isNaN(qualityNum) || qualityNum < 0 || qualityNum > 100) {
      setError('Quality must be between 0 and 100')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/resources/colony/${colonyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_type: resourceType,
          quantity: quantityNum,
          quality: qualityNum,
          storage_zone: storageZone
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add resource')
      }

      // Success
      onAddComplete()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resourceTypes = [
    { value: 'LEAVES', label: 'Leaves', icon: '🍃', description: 'Basic food source and building material' },
    { value: 'FUNGUS', label: 'Fungus', icon: '🍄', description: 'Nutritious fungal food source' },
    { value: 'SEEDS', label: 'Seeds', icon: '🌰', description: 'High-energy food and planting material' },
    { value: 'INSECT_REMAINS', label: 'Insect Remains', icon: '🦗', description: 'Protein-rich food source' },
    { value: 'NECTAR', label: 'Nectar', icon: '🍯', description: 'Sweet, high-energy liquid food' }
  ]

  const getQualityColor = (quality) => {
    if (quality >= 80) return 'text-green-600'
    if (quality >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityLabel = (quality) => {
    if (quality >= 90) return 'Excellent'
    if (quality >= 80) return 'Good'
    if (quality >= 60) return 'Fair'
    if (quality >= 40) return 'Poor'
    return 'Very Poor'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-forest-800">Add Resource to Storage</h3>
              <button
                onClick={onClose}
                className="text-earth-600 hover:text-earth-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Resource Type Selection */}
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-3">
                  Resource Type
                </label>
                <div className="space-y-2">
                  {resourceTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        resourceType === type.value
                          ? 'border-forest-500 bg-forest-50'
                          : 'border-earth-200 hover:border-earth-300 hover:bg-earth-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resourceType"
                        value={type.value}
                        checked={resourceType === type.value}
                        onChange={(e) => setResourceType(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-xl mr-3">{type.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-earth-800">{type.label}</div>
                        <div className="text-sm text-earth-600">{type.description}</div>
                      </div>
                      {resourceType === type.value && (
                        <span className="text-forest-600">✓</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity..."
                  min="1"
                  className="w-full px-3 py-2 border border-earth-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-500"
                  disabled={loading}
                />
              </div>

              {/* Quality Input */}
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  Quality ({quality}%)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    min="0"
                    max="100"
                    step="5"
                    className="w-full h-2 bg-earth-200 rounded-lg appearance-none cursor-pointer"
                    disabled={loading}
                  />
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${getQualityColor(parseFloat(quality))}`}>
                      {getQualityLabel(parseFloat(quality))}
                    </span>
                    <div className="flex space-x-2">
                      {[50, 75, 90, 100].map((value) => (
                        <button
                          key={value}
                          onClick={() => setQuality(value.toString())}
                          className="px-2 py-1 text-xs bg-earth-100 text-earth-700 rounded hover:bg-earth-200 transition-colors"
                          disabled={loading}
                        >
                          {value}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Storage Zone Selection */}
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  Storage Zone
                </label>
                <select
                  value={storageZone}
                  onChange={(e) => setStorageZone(e.target.value)}
                  className="w-full px-3 py-2 border border-earth-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-500"
                  disabled={loading}
                >
                  {Object.entries(zones).map(([zoneName, zone]) => (
                    <option key={zoneName} value={zoneName}>
                      {zone.icon} {zone.displayName}
                    </option>
                  ))}
                </select>
                {zones[storageZone] && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">{zones[storageZone].description}</p>
                    <div className="mt-1 text-sm text-blue-600">
                      Capacity: {zones[storageZone].capacity} units
                    </div>
                  </div>
                )}
              </div>

              {/* Preview */}
              {resourceType && quantity && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4"
                >
                  <h4 className="font-medium text-green-800 mb-2">Preview</h4>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {resourceTypes.find(t => t.value === resourceType)?.icon}
                    </span>
                    <div>
                      <div className="font-medium text-green-800">
                        {quantity} {resourceTypes.find(t => t.value === resourceType)?.label}
                      </div>
                      <div className="text-sm text-green-600">
                        Quality: {quality}% • Zone: {zones[storageZone]?.displayName}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-3"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-earth-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-earth-100 text-earth-700 rounded-md hover:bg-earth-200 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddResource}
                  disabled={loading || !resourceType || !quantity}
                  className="flex-1 px-4 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Resource'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddResourceModal 
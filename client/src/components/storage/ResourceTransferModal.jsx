import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function ResourceTransferModal({ isOpen, onClose, resource, zones, colonyId, onTransferComplete }) {
  const [targetZone, setTargetZone] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && resource) {
      // Set default target zone (different from current zone)
      const availableZones = Object.keys(zones).filter(zone => zone !== resource.storage_zone)
      setTargetZone(availableZones[0] || '')
      setTransferAmount('')
      setError(null)
    }
  }, [isOpen, resource, zones])

  const handleTransfer = async () => {
    if (!resource || !targetZone || !transferAmount) {
      setError('Please fill in all fields')
      return
    }

    const amount = parseInt(transferAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Transfer amount must be a positive number')
      return
    }

    if (amount > resource.quantity) {
      setError('Transfer amount cannot exceed available quantity')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/resources/colony/${colonyId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_id: resource.id,
          target_zone: targetZone,
          amount: amount
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Transfer failed')
      }

      // Success
      onTransferComplete()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getResourceIcon = (resourceType) => {
    const icons = {
      'LEAVES': '🍃',
      'FUNGUS': '🍄',
      'SEEDS': '🌰',
      'INSECT_REMAINS': '🦗',
      'NECTAR': '🍯'
    }
    return icons[resourceType] || '📦'
  }

  const availableZones = Object.entries(zones).filter(([zoneName]) => zoneName !== resource?.storage_zone)

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
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-forest-800">Transfer Resource</h3>
              <button
                onClick={onClose}
                className="text-earth-600 hover:text-earth-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {resource && (
              <div className="space-y-6">
                {/* Resource Info */}
                <div className="bg-earth-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{getResourceIcon(resource.resource_type)}</span>
                    <div>
                      <h4 className="font-medium text-earth-800">
                        {resource.resource_type.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-earth-600">
                        Quality: {resource.quality.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-earth-600">Available:</span>
                      <span className="ml-2 font-medium text-earth-800">
                        {resource.quantity - resource.reserved_quantity}
                      </span>
                    </div>
                    <div>
                      <span className="text-earth-600">Current Zone:</span>
                      <span className="ml-2 font-medium text-earth-800">
                        {zones[resource.storage_zone]?.displayName || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {resource.reserved_quantity > 0 && (
                    <div className="mt-2 text-sm text-orange-600">
                      Note: {resource.reserved_quantity} units are reserved and cannot be transferred
                    </div>
                  )}
                </div>

                {/* Transfer Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-2">
                      Transfer to Zone
                    </label>
                    <select
                      value={targetZone}
                      onChange={(e) => setTargetZone(e.target.value)}
                      className="w-full px-3 py-2 border border-earth-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-500"
                      disabled={loading}
                    >
                      <option value="">Select target zone...</option>
                      {availableZones.map(([zoneName, zone]) => (
                        <option key={zoneName} value={zoneName}>
                          {zone.icon} {zone.displayName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-2">
                      Transfer Amount
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="Enter amount..."
                        min="1"
                        max={resource.quantity - resource.reserved_quantity}
                        className="flex-1 px-3 py-2 border border-earth-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-500"
                        disabled={loading}
                      />
                      <button
                        onClick={() => setTransferAmount((resource.quantity - resource.reserved_quantity).toString())}
                        className="px-3 py-2 bg-earth-100 text-earth-700 rounded-md hover:bg-earth-200 transition-colors text-sm"
                        disabled={loading}
                      >
                        Max
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-earth-500">
                      Maximum: {resource.quantity - resource.reserved_quantity} units
                    </div>
                  </div>

                  {/* Target Zone Info */}
                  {targetZone && zones[targetZone] && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{zones[targetZone].icon}</span>
                        <span className="font-medium text-blue-800">{zones[targetZone].displayName}</span>
                      </div>
                      <p className="text-sm text-blue-700">{zones[targetZone].description}</p>
                      <div className="mt-2 text-sm text-blue-600">
                        Capacity: {zones[targetZone].capacity} units
                      </div>
                    </div>
                  )}
                </div>

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
                    onClick={handleTransfer}
                    disabled={loading || !targetZone || !transferAmount}
                    className="flex-1 px-4 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Transferring...</span>
                      </div>
                    ) : (
                      'Transfer'
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ResourceTransferModal 
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import resourceService from '../../services/resourceService';

/**
 * Resource Status Panel - Shows current resource status with decay warnings and storage information
 */
const ResourceStatusPanel = ({ colonyId, compact = false }) => {
  const [resources, setResources] = useState([]);
  const [storageInfo, setStorageInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Resource type icons and colors
  const resourceTypes = {
    food: { icon: '🍯', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    wood: { icon: '🪵', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    stone: { icon: '🪨', color: 'text-gray-600', bgColor: 'bg-gray-50' },
    water: { icon: '💧', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    minerals: { icon: '💎', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    larvae: { icon: '🐛', color: 'text-green-600', bgColor: 'bg-green-50' },
    organic_matter: { icon: '🍂', color: 'text-green-600', bgColor: 'bg-green-50' }
  };

  // Quality level styling
  const qualityStyles = {
    excellent: { text: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' },
    good: { text: 'text-green-500', bg: 'bg-green-50', label: 'Good' },
    average: { text: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Average' },
    poor: { text: 'text-orange-600', bg: 'bg-orange-50', label: 'Poor' },
    spoiled: { text: 'text-red-600', bg: 'bg-red-50', label: 'Spoiled' }
  };

  /**
   * Load resource data
   */
  const loadResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resourceData, storageData] = await Promise.all([
        resourceService.getColonyResources(colonyId),
        resourceService.getColonyStorage(colonyId)
      ]);

      setResources(resourceData);
      setStorageInfo(storageData);
    } catch (err) {
      setError('Failed to load resources: ' + err.message);
      console.error('Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get quality level based on decay percentage
   */
  const getQualityLevel = (quality) => {
    if (quality >= 90) return 'excellent';
    if (quality >= 70) return 'good';
    if (quality >= 50) return 'average';
    if (quality >= 25) return 'poor';
    return 'spoiled';
  };

  /**
   * Calculate decay warning level
   */
  const getDecayWarning = (resource) => {
    const now = Date.now();
    const created = new Date(resource.created_at).getTime();
    const age = now - created;
    const decayRate = resource.decay_rate || 0.1; // % per hour
    const hoursOld = age / (1000 * 60 * 60);
    const expectedQuality = Math.max(0, 100 - (hoursOld * decayRate));
    
    if (expectedQuality <= 25) return 'critical';
    if (expectedQuality <= 50) return 'warning';
    if (expectedQuality <= 75) return 'caution';
    return 'good';
  };

  /**
   * Format time until critical decay
   */
  const getTimeUntilCritical = (resource) => {
    const decayRate = resource.decay_rate || 0.1;
    const currentQuality = resource.quality || 100;
    const hoursUntilCritical = (currentQuality - 25) / decayRate;
    
    if (hoursUntilCritical <= 0) return 'Critical now';
    if (hoursUntilCritical < 1) return `${Math.round(hoursUntilCritical * 60)}m`;
    if (hoursUntilCritical < 24) return `${Math.round(hoursUntilCritical)}h`;
    return `${Math.round(hoursUntilCritical / 24)}d`;
  };

  // Load data on component mount and set up refresh interval
  useEffect(() => {
    loadResources();
    const interval = setInterval(loadResources, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [colonyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading resources...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700 text-sm">{error}</div>
      </div>
    );
  }

  // Group resources by type
  const groupedResources = resources.reduce((groups, resource) => {
    const type = resource.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(resource);
    return groups;
  }, {});

  if (compact) {
    // Compact view for smaller spaces
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Resources</h3>
          <button
            onClick={loadResources}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
        </div>
        
        {Object.entries(groupedResources).map(([type, typeResources]) => {
          const totalQuantity = typeResources.reduce((sum, r) => sum + (r.quantity || 0), 0);
          const avgQuality = typeResources.reduce((sum, r) => sum + (r.quality || 100), 0) / typeResources.length;
          const resourceInfo = resourceTypes[type] || resourceTypes.food;
          const qualityLevel = getQualityLevel(avgQuality);
          const qualityStyle = qualityStyles[qualityLevel];
          
          return (
            <div key={type} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{resourceInfo.icon}</span>
                <span className="font-medium">{type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{totalQuantity}</span>
                <span className={`text-xs px-2 py-1 rounded ${qualityStyle.bg} ${qualityStyle.text}`}>
                  {Math.round(avgQuality)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Resource Status</h2>
        <button
          onClick={loadResources}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* Storage Summary */}
      {storageInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(storageInfo).map(([zoneType, info]) => (
            <div key={zoneType} className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700">
                {zoneType.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-lg font-bold">
                {info.used}/{info.capacity}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(info.used / info.capacity) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource Groups */}
      {Object.entries(groupedResources).map(([type, typeResources]) => {
        const resourceInfo = resourceTypes[type] || resourceTypes.food;
        const totalQuantity = typeResources.reduce((sum, r) => sum + (r.quantity || 0), 0);
        
        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${resourceInfo.bgColor} rounded-lg p-4`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{resourceInfo.icon}</span>
                <div>
                  <h3 className={`font-semibold ${resourceInfo.color}`}>
                    {type.replace('_', ' ').toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Total: {totalQuantity} units | {typeResources.length} batches
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Resource Batches */}
            <div className="grid gap-2">
              {typeResources.map((resource, index) => {
                const qualityLevel = getQualityLevel(resource.quality || 100);
                const qualityStyle = qualityStyles[qualityLevel];
                const decayWarning = getDecayWarning(resource);
                const timeUntilCritical = getTimeUntilCritical(resource);
                
                return (
                  <div
                    key={resource.id || index}
                    className={`bg-white rounded-lg p-3 border ${
                      decayWarning === 'critical' ? 'border-red-300' :
                      decayWarning === 'warning' ? 'border-orange-300' :
                      decayWarning === 'caution' ? 'border-yellow-300' :
                      'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">
                            {resource.quantity} units
                          </div>
                          <div className="text-xs text-gray-500">
                            Zone: {resource.storage_zone || 'Unknown'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded text-xs ${qualityStyle.bg} ${qualityStyle.text}`}>
                          {qualityStyle.label} ({Math.round(resource.quality || 100)}%)
                        </div>
                        
                        {decayWarning !== 'good' && (
                          <div className={`px-2 py-1 rounded text-xs ${
                            decayWarning === 'critical' ? 'bg-red-100 text-red-700' :
                            decayWarning === 'warning' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {timeUntilCritical}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Quality Progress Bar */}
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (resource.quality || 100) >= 75 ? 'bg-green-500' :
                            (resource.quality || 100) >= 50 ? 'bg-yellow-500' :
                            (resource.quality || 100) >= 25 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${resource.quality || 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* Empty State */}
      {Object.keys(groupedResources).length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📦</div>
          <p>No resources found</p>
          <p className="text-sm">Resources will appear here as your colony gathers them</p>
        </div>
      )}
    </div>
  );
};

export default ResourceStatusPanel; 
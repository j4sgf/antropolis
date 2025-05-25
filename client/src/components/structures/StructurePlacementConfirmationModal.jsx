import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StructurePlacementConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  structureType, 
  position, 
  colonyId,
  colonyResources = {} 
}) => {
  const [structureData, setStructureData] = useState(null);
  const [resourceValidation, setResourceValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && structureType && position) {
      validatePlacement();
    }
  }, [isOpen, structureType, position, colonyId]);

  const validatePlacement = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get structure types data
      const structuresResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/structures/types`
      );
      
      if (!structuresResponse.ok) {
        throw new Error('Failed to fetch structure data');
      }
      
      const structuresData = await structuresResponse.json();
      const structure = structuresData.data[structureType];
      setStructureData(structure);

      // Validate placement
      const validationResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/colonies/${colonyId}/structures/validate-placement`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: structureType,
            position_x: position.x,
            position_y: position.y
          }),
        }
      );

      if (!validationResponse.ok) {
        throw new Error('Failed to validate placement');
      }

      const validationData = await validationResponse.json();
      setResourceValidation(validationData.data);

    } catch (err) {
      setError(err.message);
      console.error('Error validating placement:', err);
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (resourceType) => {
    const icons = {
      'food': '🍯',
      'water': '💧',
      'wood': '🪵',
      'stone': '🪨',
      'minerals': '💎'
    };
    return icons[resourceType] || '📦';
  };

  const getStructureIcon = (structureType) => {
    const icons = {
      'FOOD_STORAGE': '🏪',
      'WATER_RESERVOIR': '💧',
      'MINERAL_STOCKPILE': '⛏️',
      'NURSERY': '🍼',
      'FARM_CHAMBER': '🍄',
      'WORKSHOP': '🔨',
      'GUARD_POST': '🏰',
      'BARRICADE': '🚧',
      'TUNNEL_SYSTEM': '🕳️',
      'LABORATORY': '🔬',
      'QUEEN_CHAMBER': '👑',
      'COMMUNICATION_HUB': '📡'
    };
    return icons[structureType] || '🏗️';
  };

  const canAfford = (costs) => {
    return Object.entries(costs).every(([resource, amount]) => {
      const available = colonyResources[resource] || 0;
      return available >= amount;
    });
  };

  const handleConfirm = () => {
    if (resourceValidation?.can_place && structureData) {
      onConfirm({
        type: structureType,
        position: position,
        structure: structureData
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-forest-800">Confirm Structure Placement</h3>
            <button
              onClick={onClose}
              className="text-earth-600 hover:text-earth-800 transition-colors text-xl"
            >
              ×
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-3xl"
              >
                🏗️
              </motion.div>
              <div className="ml-3 text-lg text-forest-700">Validating placement...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-500">⚠️</span>
                <span className="text-red-700 font-medium">Validation Error</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Structure Information */}
          {structureData && !loading && (
            <div className="space-y-4">
              {/* Structure Header */}
              <div className="flex items-center space-x-4 p-4 bg-earth-50 rounded-lg border">
                <div className="text-4xl">
                  {getStructureIcon(structureType)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-forest-800 text-lg">
                    {structureData.name}
                  </h4>
                  <p className="text-earth-600 text-sm">
                    {structureData.description}
                  </p>
                  <div className="text-earth-500 text-sm mt-1">
                    Position: ({position.x}, {position.y})
                  </div>
                </div>
              </div>

              {/* Placement Validation */}
              {resourceValidation && (
                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border ${
                    resourceValidation.placement_valid 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className={resourceValidation.placement_valid ? 'text-green-500' : 'text-red-500'}>
                        {resourceValidation.placement_valid ? '✅' : '❌'}
                      </span>
                      <span className={`font-medium ${
                        resourceValidation.placement_valid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        Placement {resourceValidation.placement_valid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    {resourceValidation.placement_error && (
                      <p className="text-red-600 text-sm mt-1">
                        {resourceValidation.placement_error}
                      </p>
                    )}
                  </div>

                  <div className={`p-3 rounded-lg border ${
                    resourceValidation.resources_sufficient 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className={resourceValidation.resources_sufficient ? 'text-green-500' : 'text-red-500'}>
                        {resourceValidation.resources_sufficient ? '✅' : '❌'}
                      </span>
                      <span className={`font-medium ${
                        resourceValidation.resources_sufficient ? 'text-green-800' : 'text-red-800'
                      }`}>
                        Resources {resourceValidation.resources_sufficient ? 'Sufficient' : 'Insufficient'}
                      </span>
                    </div>
                    {resourceValidation.resource_error && (
                      <p className="text-red-600 text-sm mt-1">
                        {resourceValidation.resource_error}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Resource Cost Breakdown */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-800 mb-3">Resource Cost Breakdown</h5>
                <div className="space-y-2">
                  {Object.entries(structureData.base_cost || {}).map(([resource, amount]) => {
                    const available = colonyResources[resource] || 0;
                    const sufficient = available >= amount;
                    const remaining = available - amount;
                    
                    return (
                      <div
                        key={resource}
                        className={`flex items-center justify-between p-2 rounded border ${
                          sufficient
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {getResourceIcon(resource)}
                          </span>
                          <span className="font-medium capitalize text-sm">
                            {resource}
                          </span>
                        </div>
                        <div className="text-right text-sm">
                          <div className={`font-medium ${sufficient ? 'text-green-700' : 'text-red-700'}`}>
                            Cost: {amount}
                          </div>
                          <div className="text-earth-600">
                            Available: {available}
                          </div>
                          <div className={`text-xs ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            After: {remaining >= 0 ? remaining : 'Insufficient'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Construction Details */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h5 className="font-medium text-yellow-800 mb-3">Construction Details</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Construction Time:</span>
                    <span className="font-medium">{structureData.construction_time} ticks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Workers Required:</span>
                    <span className="font-medium">{structureData.required_workers || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700">Max Level:</span>
                    <span className="font-medium">{structureData.max_level}</span>
                  </div>
                </div>
              </div>

              {/* Structure Effects Preview */}
              {structureData.effects && Object.keys(structureData.effects).length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h5 className="font-medium text-purple-800 mb-3">Structure Effects</h5>
                  <div className="space-y-1 text-sm">
                    {Object.entries(structureData.effects).map(([effect, value]) => (
                      <div key={effect} className="flex justify-between">
                        <span className="text-purple-700 capitalize">
                          {effect.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-medium text-purple-800">
                          {typeof value === 'number' 
                            ? (value < 1 ? `${(value * 100).toFixed(0)}%` : `+${value}`)
                            : value
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-earth-500 text-white py-3 px-4 rounded-lg hover:bg-earth-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!resourceValidation?.can_place || loading}
                  className="flex-1 bg-forest-600 text-white py-3 px-4 rounded-lg hover:bg-forest-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '🔄' : '🏗️'} Build Structure
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StructurePlacementConfirmationModal; 
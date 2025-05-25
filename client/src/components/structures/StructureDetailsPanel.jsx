import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StructureDetailsPanel = ({ structure, colonyId, onStructureUpdate, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState(1);
  const [repairAmount, setRepairAmount] = useState(10);

  useEffect(() => {
    if (structure) {
      setWorkers(1); // Reset to default
      setRepairAmount(Math.min(10, structure.status.max_health - structure.status.health));
    }
  }, [structure]);

  if (!structure) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg border border-earth-200 p-6 text-center"
      >
        <div className="text-4xl mb-4">🏗️</div>
        <h3 className="text-lg font-semibold text-earth-800 mb-2">
          No Structure Selected
        </h3>
        <p className="text-earth-600">
          Click on a structure in the map to view details and manage it
        </p>
      </motion.div>
    );
  }

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

  const getHealthColor = (health, maxHealth) => {
    const percentage = (health / maxHealth) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const handleAction = async (action, payload = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/colonies/${colonyId}/structures/${structure.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            ...payload
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Action failed');
      }

      const data = await response.json();
      
      if (onStructureUpdate) {
        onStructureUpdate(data.data.structure);
      }

    } catch (err) {
      setError(err.message);
      console.error('Error performing action:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemolish = async () => {
    if (!confirm('Are you sure you want to demolish this structure? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/colonies/${colonyId}/structures/${structure.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to demolish structure');
      }

      if (onStructureUpdate) {
        onStructureUpdate(null); // Remove structure
      }
      
      if (onClose) {
        onClose();
      }

    } catch (err) {
      setError(err.message);
      console.error('Error demolishing structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const isUnderConstruction = structure.status.construction_progress < 100;
  const canUpgrade = structure.status.level < 5 && structure.status.is_active;
  const needsRepair = structure.status.health < structure.status.max_health;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-lg border border-earth-200 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="text-3xl mr-3">
            {getStructureIcon(structure.type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-forest-800">
              {structure.name}
            </h3>
            <p className="text-earth-600 text-sm">
              Level {structure.status.level} • Position ({structure.position.x}, {structure.position.y})
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-earth-400 hover:text-earth-600 transition-colors text-xl"
        >
          ×
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4"
        >
          <div className="text-red-800 font-medium text-sm">{error}</div>
        </motion.div>
      )}

      {/* Status Section */}
      <div className="mb-6">
        <h4 className="font-medium text-earth-800 mb-3">Status</h4>
        
        {/* Health Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-earth-600">Health</span>
            <span className={`font-medium ${getHealthColor(structure.status.health, structure.status.max_health)}`}>
              {structure.status.health}/{structure.status.max_health}
            </span>
          </div>
          <div className="w-full bg-earth-200 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full transition-all duration-300 ${
                structure.status.health >= structure.status.max_health * 0.8 ? 'bg-green-500' :
                structure.status.health >= structure.status.max_health * 0.5 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${(structure.status.health / structure.status.max_health) * 100}%` }}
            />
          </div>
        </div>

        {/* Construction Progress */}
        {isUnderConstruction && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-earth-600">Construction</span>
              <span className="font-medium text-blue-600">
                {structure.status.construction_progress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-earth-200 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(structure.status.construction_progress)}`}
                initial={{ width: 0 }}
                animate={{ width: `${structure.status.construction_progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Active Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-earth-600">Status</span>
          <span className={`font-medium px-2 py-1 rounded-full text-xs ${
            structure.status.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {structure.status.is_active ? 'Active' : 'Under Construction'}
          </span>
        </div>
      </div>

      {/* Effects Section */}
      {structure.effects && Object.keys(structure.effects).length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-earth-800 mb-3">Effects</h4>
          <div className="space-y-2">
            {Object.entries(structure.effects).map(([effect, value]) => (
              <div key={effect} className="flex justify-between items-center text-sm">
                <span className="text-earth-600 capitalize">
                  {effect.replace(/_/g, ' ')}
                </span>
                <span className="font-medium text-forest-600">
                  +{value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-earth-800">Actions</h4>

        {/* Worker Assignment (for construction) */}
        {isUnderConstruction && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-blue-800">Assign Workers</span>
              <span className="text-blue-600 text-sm">Speed up construction</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max="10"
                value={workers}
                onChange={(e) => setWorkers(parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleAction('assign_workers', { workers })}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '🔄' : '👷'} Assign Workers
              </button>
            </div>
          </div>
        )}

        {/* Repair */}
        {needsRepair && structure.status.is_active && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-yellow-800">Repair Structure</span>
              <span className="text-yellow-600 text-sm">Restore health</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                min="1"
                max={structure.status.max_health - structure.status.health}
                value={repairAmount}
                onChange={(e) => setRepairAmount(parseInt(e.target.value))}
                className="w-20 px-3 py-2 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <button
                onClick={() => handleAction('repair', { health_amount: repairAmount })}
                disabled={loading}
                className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '🔄' : '🔧'} Repair
              </button>
            </div>
          </div>
        )}

        {/* Upgrade */}
        {canUpgrade && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-green-800">Upgrade Structure</span>
              <span className="text-green-600 text-sm">Level {structure.status.level} → {structure.status.level + 1}</span>
            </div>
            <button
              onClick={() => handleAction('upgrade')}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '🔄' : '⬆️'} Upgrade Structure
            </button>
          </div>
        )}

        {/* Demolish */}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-red-800">Demolish Structure</span>
            <span className="text-red-600 text-sm">Permanent removal</span>
          </div>
          <button
            onClick={handleDemolish}
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '🔄' : '💥'} Demolish
          </button>
        </div>
      </div>

      {/* Cost Information */}
      {structure.costs && (
        <div className="mt-6 p-4 bg-earth-50 border border-earth-200 rounded-lg">
          <h4 className="font-medium text-earth-800 mb-3">Cost Information</h4>
          
          {/* Build Cost */}
          {structure.costs.build_cost && Object.keys(structure.costs.build_cost).length > 0 && (
            <div className="mb-3">
              <div className="text-sm text-earth-600 mb-1">Build Cost:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(structure.costs.build_cost).map(([resource, amount]) => (
                  <div key={resource} className="flex items-center text-xs bg-white border border-earth-200 rounded px-2 py-1">
                    <span className="mr-1">{getResourceIcon(resource)}</span>
                    <span className="font-medium">{amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Cost */}
          {structure.costs.maintenance_cost && Object.keys(structure.costs.maintenance_cost).length > 0 && (
            <div>
              <div className="text-sm text-earth-600 mb-1">Maintenance Cost:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(structure.costs.maintenance_cost).map(([resource, amount]) => (
                  <div key={resource} className="flex items-center text-xs bg-white border border-earth-200 rounded px-2 py-1">
                    <span className="mr-1">{getResourceIcon(resource)}</span>
                    <span className="font-medium">{amount}/turn</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default StructureDetailsPanel; 
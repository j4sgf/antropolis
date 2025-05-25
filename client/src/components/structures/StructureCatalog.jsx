import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StructureCatalog = ({ colonyId, onStructureSelect, selectedStructureType }) => {
  const [structureTypes, setStructureTypes] = useState({});
  const [colonyResources, setColonyResources] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([fetchStructureTypes(), fetchColonyResources()])
      .then(() => setLoading(false))
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [colonyId]);

  const fetchStructureTypes = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/structures/types`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch structure types');
      }
      
      const data = await response.json();
      setStructureTypes(data.data.types);
    } catch (err) {
      console.error('Error fetching structure types:', err);
      throw err;
    }
  };

  const fetchColonyResources = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/resources/colony/${colonyId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch colony resources');
      }
      
      const data = await response.json();
      
      // Convert array to object for easier lookup
      const resourceMap = {};
      data.data.resources.forEach(resource => {
        resourceMap[resource.resource_type] = resource.amount;
      });
      setColonyResources(resourceMap);
    } catch (err) {
      console.error('Error fetching colony resources:', err);
      // Set empty resources instead of throwing
      setColonyResources({});
    }
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

  const canAfford = (costs) => {
    return Object.entries(costs).every(([resource, amount]) => {
      const available = colonyResources[resource] || 0;
      return available >= amount;
    });
  };

  const getAffordabilityColor = (costs) => {
    return canAfford(costs) ? 'text-green-600' : 'text-red-600';
  };

  const handleStructureSelect = (structureType) => {
    if (selectedStructureType === structureType) {
      // Deselect if already selected
      onStructureSelect(null);
    } else {
      onStructureSelect(structureType);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-3xl"
        >
          🏗️
        </motion.div>
        <div className="ml-3 text-lg text-forest-700">Loading structures...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800 font-medium mb-2">Failed to load structures</div>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  const structureCategories = {
    'Storage': ['FOOD_STORAGE', 'WATER_RESERVOIR', 'MINERAL_STOCKPILE'],
    'Production': ['NURSERY', 'FARM_CHAMBER', 'WORKSHOP'],
    'Defense': ['GUARD_POST', 'BARRICADE', 'TUNNEL_SYSTEM'],
    'Special': ['LABORATORY', 'QUEEN_CHAMBER', 'COMMUNICATION_HUB']
  };

  return (
    <div className="bg-white rounded-lg border border-earth-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-forest-800">Structure Catalog</h3>
          <p className="text-earth-600 text-sm">
            Choose a structure to place on your colony map
          </p>
        </div>
        {selectedStructureType && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-forest-100 border border-forest-300 rounded-lg px-3 py-2"
          >
            <div className="text-sm text-forest-800">
              Selected: <span className="font-medium">{selectedStructureType}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Structure Categories */}
      <div className="space-y-6">
        {Object.entries(structureCategories).map(([category, types]) => (
          <div key={category}>
            <h4 className="text-md font-medium text-earth-800 mb-3 flex items-center">
              <span className="mr-2">
                {category === 'Storage' && '📦'}
                {category === 'Production' && '🏭'}
                {category === 'Defense' && '🛡️'}
                {category === 'Special' && '✨'}
              </span>
              {category} Structures
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {types.map(structureType => {
                const structure = structureTypes[structureType];
                if (!structure) return null;

                const isSelected = selectedStructureType === structureType;
                const affordable = canAfford(structure.base_cost);

                return (
                  <motion.div
                    key={structureType}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStructureSelect(structureType)}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${isSelected
                        ? 'border-forest-500 bg-forest-50 shadow-lg'
                        : affordable
                          ? 'border-earth-200 bg-white hover:border-earth-300 hover:shadow-md'
                          : 'border-red-200 bg-red-50 opacity-75 cursor-not-allowed'
                      }
                    `}
                  >
                    {/* Structure Header */}
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-3">
                        {getStructureIcon(structureType)}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-earth-800 text-sm leading-tight">
                          {structure.name}
                        </h5>
                        <div className="text-xs text-earth-600 mt-1">
                          Level {structure.max_level} max
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 bg-forest-500 rounded-full flex items-center justify-center text-white text-xs"
                        >
                          ✓
                        </motion.div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-earth-600 mb-3 line-clamp-2">
                      {structure.description}
                    </p>

                    {/* Resource Costs */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-earth-700 mb-1">
                        Base Cost:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(structure.base_cost).map(([resource, amount]) => {
                          const available = colonyResources[resource] || 0;
                          const sufficient = available >= amount;
                          
                          return (
                            <div
                              key={resource}
                              className={`flex items-center text-xs px-2 py-1 rounded-full border ${
                                sufficient
                                  ? 'bg-green-50 border-green-200 text-green-700'
                                  : 'bg-red-50 border-red-200 text-red-700'
                              }`}
                            >
                              <span className="mr-1">
                                {getResourceIcon(resource)}
                              </span>
                              <span className="font-medium">
                                {amount}
                              </span>
                              <span className="text-xs opacity-75 ml-1">
                                ({available})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Effects Preview */}
                    <div className="border-t border-earth-200 pt-2">
                      <div className="text-xs font-medium text-earth-700 mb-1">
                        Effects:
                      </div>
                      <div className="text-xs text-earth-600">
                        {Object.entries(structure.effects).slice(0, 2).map(([effect, value], index) => (
                          <div key={effect} className="flex justify-between">
                            <span className="capitalize">
                              {effect.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-medium text-forest-600">
                              +{value}
                            </span>
                          </div>
                        ))}
                        {Object.keys(structure.effects).length > 2 && (
                          <div className="text-xs text-earth-500 italic">
                            +{Object.keys(structure.effects).length - 2} more...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Construction Time */}
                    <div className="mt-2 text-xs text-earth-500">
                      🕒 Build time: {structure.construction_time} ticks
                    </div>

                    {/* Affordability Status */}
                    {!affordable && (
                      <div className="mt-2 text-xs text-red-600 font-medium">
                        Insufficient resources
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Resource Summary */}
      <div className="mt-6 p-4 bg-earth-50 border border-earth-200 rounded-lg">
        <h4 className="text-sm font-medium text-earth-800 mb-2">
          Colony Resources
        </h4>
        <div className="flex flex-wrap gap-3">
          {Object.entries(colonyResources).map(([resource, amount]) => (
            <div key={resource} className="flex items-center text-sm">
              <span className="mr-1">{getResourceIcon(resource)}</span>
              <span className="capitalize text-earth-600 mr-1">{resource}:</span>
              <span className="font-medium text-earth-800">{amount}</span>
            </div>
          ))}
          {Object.keys(colonyResources).length === 0 && (
            <div className="text-sm text-earth-600 italic">
              No resources data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StructureCatalog; 
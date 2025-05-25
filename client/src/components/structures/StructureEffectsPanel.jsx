import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const StructureEffectsPanel = ({ colonyId }) => {
  const [effects, setEffects] = useState(null);
  const [bonusBreakdown, setBonusBreakdown] = useState([]);
  const [maintenanceInfo, setMaintenanceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStructureEffects();
    const interval = setInterval(fetchStructureEffects, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [colonyId]);

  const fetchStructureEffects = async () => {
    if (!colonyId) return;

    try {
      setLoading(true);
      
      // Fetch colony effects
      const effectsResponse = await fetch(`/api/structures/colonies/${colonyId}/effects`);
      const effectsData = await effectsResponse.json();
      
      // Fetch bonus breakdown
      const bonusResponse = await fetch(`/api/structures/colonies/${colonyId}/bonus-breakdown`);
      const bonusData = await bonusResponse.json();
      
      // Fetch maintenance info
      const maintenanceResponse = await fetch(`/api/structures/colonies/${colonyId}/maintenance`, {
        method: 'POST'
      });
      const maintenanceData = await maintenanceResponse.json();

      if (effectsData.success) {
        setEffects(effectsData.data.effects);
      }
      if (bonusData.success) {
        setBonusBreakdown(bonusData.data.structures);
      }
      if (maintenanceData.success) {
        setMaintenanceInfo(maintenanceData.data);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching structure effects:', err);
      setError('Failed to load structure effects');
    } finally {
      setLoading(false);
    }
  };

  const handleRepairStructure = async (structureId) => {
    try {
      const response = await fetch(`/api/structures/colonies/${colonyId}/structures/${structureId}/repair`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repairAmount: 25 })
      });
      
      if (response.ok) {
        fetchStructureEffects(); // Refresh data
      }
    } catch (err) {
      console.error('Error repairing structure:', err);
    }
  };

  const formatEffectValue = (value, effectType) => {
    if (typeof value !== 'number') return value;
    
    // Percentage effects
    if (effectType.includes('bonus') || effectType.includes('speed') || effectType.includes('reduction')) {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    // Capacity effects
    if (effectType.includes('capacity')) {
      return `+${value}`;
    }
    
    // Production effects
    if (effectType.includes('production')) {
      return `+${value}/day`;
    }
    
    // Range effects
    if (effectType.includes('range') || effectType.includes('detection')) {
      return `${value} tiles`;
    }
    
    return value.toString();
  };

  const getEffectIcon = (effectType) => {
    const iconMap = {
      food_production: '🌾',
      capacity_bonus: '📦',
      construction_speed: '🔨',
      research_speed: '🔬',
      birth_rate_bonus: '🐣',
      defense_bonus: '🛡️',
      detection_range: '👁️',
      movement_speed: '⚡',
      colony_morale: '😊',
      queen_health: '👑'
    };
    return iconMap[effectType] || '⚙️';
  };

  const getHealthColor = (healthPercentage) => {
    if (healthPercentage >= 75) return 'text-green-600';
    if (healthPercentage >= 50) return 'text-yellow-600';
    if (healthPercentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  const getHealthBarColor = (healthPercentage) => {
    if (healthPercentage >= 75) return 'bg-green-500';
    if (healthPercentage >= 50) return 'bg-yellow-500';
    if (healthPercentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading && !effects) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={fetchStructureEffects}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { id: 'overview', label: 'Effects Overview', icon: '📊' },
            { id: 'structures', label: 'Structure Details', icon: '🏗️' },
            { id: 'maintenance', label: 'Maintenance', icon: '🔧' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Effects Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Colony Structure Effects
                </h3>
                
                {effects && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Structure Count Summary */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Total Structures</p>
                          <p className="text-2xl font-bold text-blue-900">{effects.total_structures}</p>
                        </div>
                        <div className="text-blue-500 text-2xl">🏗️</div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 font-medium">Active Structures</p>
                          <p className="text-2xl font-bold text-green-900">{effects.active_structures}</p>
                        </div>
                        <div className="text-green-500 text-2xl">✅</div>
                      </div>
                    </div>

                    {effects.damaged_structures > 0 && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-red-600 font-medium">Damaged Structures</p>
                            <p className="text-2xl font-bold text-red-900">{effects.damaged_structures}</p>
                          </div>
                          <div className="text-red-500 text-2xl">⚠️</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Active Effects Grid */}
                {effects && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(effects)
                      .filter(([key, value]) => 
                        typeof value === 'number' && 
                        value > 0 && 
                        !['total_structures', 'active_structures', 'damaged_structures'].includes(key)
                      )
                      .map(([effectType, value]) => (
                        <motion.div
                          key={effectType}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <span className="text-lg mr-2">{getEffectIcon(effectType)}</span>
                                <p className="text-sm font-medium text-gray-900 capitalize">
                                  {effectType.replace(/_/g, ' ')}
                                </p>
                              </div>
                              <p className="text-lg font-bold text-blue-600">
                                {formatEffectValue(value, effectType)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                    ))}
                  </div>
                )}

                {/* Special Abilities */}
                {effects && effects.special_abilities && effects.special_abilities.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Special Abilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {effects.special_abilities.map((ability, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                        >
                          ⭐ {ability.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Structure Details Tab */}
          {activeTab === 'structures' && (
            <motion.div
              key="structures"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Individual Structure Bonuses
              </h3>
              
              <div className="space-y-4">
                {bonusBreakdown.map((structure) => (
                  <motion.div
                    key={structure.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{structure.name}</h4>
                        <p className="text-sm text-gray-600">Level {structure.level}</p>
                      </div>
                      
                      {/* Health Bar */}
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${getHealthColor(structure.healthPercentage)}`}>
                              {structure.health}/{structure.maxHealth} HP
                            </span>
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${getHealthBarColor(structure.healthPercentage)}`}
                                style={{ width: `${structure.healthPercentage}%` }}
                              />
                            </div>
                          </div>
                          {structure.healthPercentage < 100 && (
                            <button
                              onClick={() => handleRepairStructure(structure.id)}
                              className="mt-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Repair
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Effects Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(structure.effects).map(([effectType, effectData]) => (
                        <div key={effectType} className="bg-gray-50 p-2 rounded">
                          <div className="flex items-center mb-1">
                            <span className="text-sm mr-1">{getEffectIcon(effectType)}</span>
                            <p className="text-xs text-gray-600 capitalize">
                              {effectType.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-blue-600">
                            {formatEffectValue(effectData.effectiveValue, effectType)}
                          </p>
                          {effectData.healthReduction > 0 && (
                            <p className="text-xs text-orange-600">
                              (-{effectData.healthReduction}% from damage)
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Special Abilities */}
                    {structure.specialAbilities.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {structure.specialAbilities.map((ability, index) => (
                            <span
                              key={index}
                              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                structure.isFullyEffective 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {structure.isFullyEffective ? '⭐' : '💤'} {ability.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <motion.div
              key="maintenance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Structure Maintenance
              </h3>
              
              {maintenanceInfo && (
                <div className="space-y-6">
                  {/* Maintenance Requirements */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">Daily Maintenance Requirements</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(maintenanceInfo.maintenanceRequired)
                        .filter(([_, amount]) => amount > 0)
                        .map(([resource, amount]) => {
                          const available = maintenanceInfo.resourcesAvailable[resource] || 0;
                          const canAfford = maintenanceInfo.canAffordMaintenance[resource];
                          
                          return (
                            <div key={resource} className="text-center">
                              <div className={`text-2xl mb-1 ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                                {canAfford ? '✅' : '❌'}
                              </div>
                              <p className="text-sm font-medium capitalize">{resource}</p>
                              <p className="text-xs text-gray-600">
                                {amount} required
                              </p>
                              <p className="text-xs text-gray-600">
                                {available} available
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Maintenance Results */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Maintenance Status</h4>
                    <div className="space-y-2">
                      {maintenanceInfo.maintenanceResults.map((result, index) => (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-3 rounded ${
                            result.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="mr-2">
                              {result.status === 'success' ? '✅' : '⚠️'}
                            </span>
                            <span>
                              {result.message || `${result.structureName} degrading`}
                            </span>
                          </div>
                          {result.degradationDamage && (
                            <span className="text-sm">
                              -{result.degradationDamage} HP
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StructureEffectsPanel; 
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StructureMap from './StructureMap';
import StructureCatalog from './StructureCatalog';
import StructureDetailsPanel from './StructureDetailsPanel';
import StructureEffectsPanel from './StructureEffectsPanel';

const StructuresDashboard = ({ colonyId, colonyData }) => {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedStructureType, setSelectedStructureType] = useState(null);
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [constructionStats, setConstructionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (colonyId) {
      fetchConstructionStats();
    }
  }, [colonyId]);

  const fetchConstructionStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/colonies/${colonyId}/structures/construction-stats`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch construction stats');
      }
      
      const data = await response.json();
      setConstructionStats(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching construction stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStructureTypeSelect = (structureType) => {
    setSelectedStructureType(structureType);
    setSelectedStructure(null); // Clear structure details when selecting a type to place
    setActiveTab('map'); // Switch to map for placement
  };

  const handleStructureSelect = (structure) => {
    setSelectedStructure(structure);
    setSelectedStructureType(null); // Clear placement mode when selecting an existing structure
  };

  const handleStructureUpdate = (updatedStructure) => {
    if (updatedStructure) {
      setSelectedStructure(updatedStructure);
    } else {
      setSelectedStructure(null);
    }
    // Refresh construction stats
    fetchConstructionStats();
  };

  const tabs = [
    { id: 'map', label: 'Colony Map', icon: '🗺️' },
    { id: 'catalog', label: 'Build Structures', icon: '🏗️' },
    { id: 'manage', label: 'Manage', icon: '⚙️' },
    { id: 'effects', label: 'Effects', icon: '✨' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Construction Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-earth-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-forest-800">Colony Structures</h2>
            <p className="text-earth-600">
              Build and manage structures to expand your colony's capabilities
            </p>
          </div>
          <div className="text-4xl">🏛️</div>
        </div>

        {/* Construction Stats */}
        {constructionStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-forest-50 border border-forest-200 rounded-lg">
              <div className="text-2xl font-bold text-forest-600">
                {constructionStats.activeProjects || 0}
              </div>
              <div className="text-sm text-earth-600">Active Projects</div>
            </div>
            <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {constructionStats.totalWorkersAssigned || 0}
              </div>
              <div className="text-sm text-earth-600">Workers Assigned</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {constructionStats.averageProgress?.toFixed(1) || '0.0'}%
              </div>
              <div className="text-sm text-earth-600">Avg Progress</div>
            </div>
            <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {constructionStats.estimatedCompletion 
                  ? new Date(constructionStats.estimatedCompletion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-earth-600">Next Completion</div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800 font-medium text-sm">{error}</div>
          </div>
        )}
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg border border-earth-200 overflow-hidden"
      >
        <div className="flex border-b border-earth-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center py-4 px-6 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-forest-50 text-forest-700 border-b-2 border-forest-500'
                  : 'text-earth-600 hover:text-earth-800 hover:bg-earth-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Indicators */}
        <div className="p-4 bg-earth-50 border-b border-earth-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              {selectedStructureType && (
                <div className="flex items-center text-blue-600">
                  <span className="mr-2">🏗️</span>
                  <span>Placement Mode: <strong>{selectedStructureType}</strong></span>
                </div>
              )}
              {selectedStructure && (
                <div className="flex items-center text-green-600">
                  <span className="mr-2">🎯</span>
                  <span>Selected: <strong>{selectedStructure.name}</strong></span>
                </div>
              )}
              {!selectedStructureType && !selectedStructure && (
                <div className="flex items-center text-earth-600">
                  <span className="mr-2">📋</span>
                  <span>Ready for structure management</span>
                </div>
              )}
            </div>
            <div className="text-earth-500">
              Colony: {colonyData?.name || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Map */}
                <div className="lg:col-span-2">
                  <StructureMap
                    colonyId={colonyId}
                    selectedStructureType={selectedStructureType}
                    onStructureSelect={handleStructureSelect}
                    refreshTrigger={refreshTrigger}
                  />
                </div>

                {/* Structure Details Panel */}
                <div>
                  <AnimatePresence mode="wait">
                    <StructureDetailsPanel
                      key={selectedStructure?.id || 'no-structure'}
                      structure={selectedStructure}
                      colonyId={colonyId}
                      onStructureUpdate={handleStructureUpdate}
                      onClose={() => setSelectedStructure(null)}
                    />
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeTab === 'catalog' && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <StructureCatalog
                  colonyId={colonyId}
                  selectedStructureType={selectedStructureType}
                  onStructureSelect={handleStructureTypeSelect}
                  onStructurePlaced={() => setRefreshTrigger(prev => prev + 1)}
                />
              </motion.div>
            )}

            {activeTab === 'manage' && (
              <motion.div
                key="manage"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Construction Projects */}
                <div className="bg-white border border-earth-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-forest-800 mb-4">
                    🚧 Active Construction Projects
                  </h3>
                  
                  {constructionStats?.projects && constructionStats.projects.length > 0 ? (
                    <div className="space-y-4">
                      {constructionStats.projects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-earth-50 border border-earth-200 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">🏗️</div>
                            <div>
                              <div className="font-medium text-earth-800">
                                {project.type}
                              </div>
                              <div className="text-sm text-earth-600">
                                Workers: {project.workersAssigned} • 
                                Started: {new Date(project.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {project.progress.toFixed(1)}%
                            </div>
                            <div className="text-xs text-earth-500">
                              ETA: {project.estimatedCompletion 
                                ? new Date(project.estimatedCompletion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                : 'Unknown'
                              }
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-earth-600">
                      <div className="text-4xl mb-2">🏗️</div>
                      <div>No active construction projects</div>
                      <div className="text-sm">Start building structures to see them here</div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white border border-earth-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-forest-800 mb-4">
                    ⚡ Quick Actions
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveTab('catalog');
                        setSelectedStructureType('FOOD_STORAGE');
                      }}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left hover:bg-yellow-100 transition-colors"
                    >
                      <div className="text-2xl mb-2">🏪</div>
                      <div className="font-medium text-yellow-800">Build Storage</div>
                      <div className="text-sm text-yellow-600">Expand resource capacity</div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveTab('catalog');
                        setSelectedStructureType('GUARD_POST');
                      }}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg text-left hover:bg-red-100 transition-colors"
                    >
                      <div className="text-2xl mb-2">🏰</div>
                      <div className="font-medium text-red-800">Build Defense</div>
                      <div className="text-sm text-red-600">Protect your colony</div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveTab('catalog');
                        setSelectedStructureType('NURSERY');
                      }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg text-left hover:bg-green-100 transition-colors"
                    >
                      <div className="text-2xl mb-2">🍼</div>
                      <div className="font-medium text-green-800">Build Nursery</div>
                      <div className="text-sm text-green-600">Increase population growth</div>
                    </motion.button>
                  </div>
                </div>

                {/* Structure Effects Summary */}
                <div className="bg-white border border-earth-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-forest-800 mb-4">
                    📊 Colony Bonuses
                  </h3>
                  <div className="text-center py-8 text-earth-600">
                    <div className="text-4xl mb-2">📈</div>
                    <div>Structure effects coming soon</div>
                    <div className="text-sm">Active structures will provide bonuses to your colony</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'effects' && (
              <motion.div
                key="effects"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <StructureEffectsPanel colonyId={colonyId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default StructuresDashboard; 
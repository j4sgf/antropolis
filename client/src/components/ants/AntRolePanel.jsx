import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AntRolePanel.css';

// Available ant roles with their configurations
const ANT_ROLES = {
  WORKER: { 
    id: 'worker', 
    name: 'Worker', 
    icon: '👷', 
    color: 'bg-amber-100 text-amber-800',
    description: 'General colony maintenance and basic tasks'
  },
  SOLDIER: { 
    id: 'soldier', 
    name: 'Soldier', 
    icon: '⚔️', 
    color: 'bg-red-100 text-red-800',
    description: 'Defense and combat specialists'
  },
  SCOUT: { 
    id: 'scout', 
    name: 'Scout', 
    icon: '🔍', 
    color: 'bg-blue-100 text-blue-800',
    description: 'Exploration and threat detection'
  },
  NURSE: { 
    id: 'nurse', 
    name: 'Nurse', 
    icon: '🩺', 
    color: 'bg-green-100 text-green-800',
    description: 'Larvae care and colony health'
  },
  BUILDER: { 
    id: 'builder', 
    name: 'Builder', 
    icon: '🔨', 
    color: 'bg-orange-100 text-orange-800',
    description: 'Construction and infrastructure'
  },
  FORAGER: { 
    id: 'forager', 
    name: 'Forager', 
    icon: '🌾', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Resource gathering and collection'
  }
};

const AntRolePanel = ({ 
  isOpen, 
  onClose, 
  colonyId, 
  ants = [], 
  onRoleUpdate 
}) => {
  const [selectedAnt, setSelectedAnt] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedAnts, setSelectedAnts] = useState(new Set());

  // Filter ants based on current filter
  const filteredAnts = ants.filter(ant => {
    if (filter === 'all') return true;
    return ant.role === filter;
  });

  // Handle ant selection
  const handleAntSelect = (ant) => {
    if (batchMode) {
      const newSelected = new Set(selectedAnts);
      if (newSelected.has(ant.id)) {
        newSelected.delete(ant.id);
      } else {
        newSelected.add(ant.id);
      }
      setSelectedAnts(newSelected);
    } else {
      setSelectedAnt(ant);
      setSelectedRole(ant.role);
    }
  };

  // Toggle batch mode
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedAnts(new Set());
    setSelectedAnt(null);
  };

  // Handle role assignment
  const handleRoleAssignment = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      if (batchMode && selectedAnts.size > 0) {
        await onRoleUpdate(Array.from(selectedAnts), selectedRole);
        setSelectedAnts(new Set());
      } else if (selectedAnt) {
        await onRoleUpdate([selectedAnt.id], selectedRole);
        setSelectedAnt(null);
      }
      setSelectedRole('');
    } catch (error) {
      console.error('Failed to update ant roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="ant-role-panel-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="ant-role-panel"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="ant-role-panel-header">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐜</span>
              <h2 className="text-xl font-bold text-forest-800">
                Ant Role Management
              </h2>
              <button
                onClick={() => {/* Help modal */}}
                className="ml-auto p-2 text-earth-600 hover:text-forest-800 transition-colors"
                title="Help"
              >
                ❓
              </button>
            </div>
            <button
              onClick={onClose}
              className="ant-role-panel-close"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>

          <div className="ant-role-panel-content">
            {/* Controls */}
            <div className="ant-role-panel-controls">
              <div className="flex gap-4 items-center mb-4">
                <div className="flex gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={batchMode}
                      onChange={toggleBatchMode}
                      className="rounded border-earth-300"
                    />
                    <span className="text-sm font-medium">Batch Mode</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <label className="text-sm font-medium">Filter:</label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-3 py-1 border border-earth-300 rounded-md text-sm"
                  >
                    <option value="all">All Ants</option>
                    {Object.values(ANT_ROLES).map(role => (
                      <option key={role.id} value={role.id}>
                        {role.icon} {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(batchMode && selectedAnts.size > 0) || selectedAnt ? (
                  <div className="flex gap-2 items-center ml-auto">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="px-3 py-1 border border-earth-300 rounded-md text-sm"
                    >
                      <option value="">Select Role</option>
                      {Object.values(ANT_ROLES).map(role => (
                        <option key={role.id} value={role.id}>
                          {role.icon} {role.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleRoleAssignment}
                      disabled={!selectedRole || isLoading}
                      className="px-4 py-1 bg-forest-600 text-white rounded-md hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isLoading ? 'Assigning...' : 'Assign Role'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Role Categories */}
            <div className="ant-role-categories">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {Object.values(ANT_ROLES).map(role => {
                  const count = ants.filter(ant => ant.role === role.id).length;
                  return (
                    <motion.div
                      key={role.id}
                      whileHover={{ scale: 1.02 }}
                      className={`ant-role-category ${role.color}`}
                    >
                      <div className="text-2xl mb-2">{role.icon}</div>
                      <div className="font-semibold">{role.name}</div>
                      <div className="text-sm opacity-75">{count} ants</div>
                      <div className="text-xs mt-1">{role.description}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Ant List */}
            <div className="ant-list-container">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-forest-800">
                  Colony Ants ({filteredAnts.length})
                </h3>
                {batchMode && selectedAnts.size > 0 && (
                  <span className="text-sm text-blue-600">
                    {selectedAnts.size} selected
                  </span>
                )}
              </div>

              <div className="ant-list">
                {filteredAnts.length === 0 ? (
                  <div className="text-center py-8 text-earth-500">
                    No ants found for the selected filter.
                  </div>
                ) : (
                  filteredAnts.map(ant => {
                    const role = ANT_ROLES[ant.role?.toUpperCase()] || ANT_ROLES.WORKER;
                    const isSelected = batchMode ? selectedAnts.has(ant.id) : selectedAnt?.id === ant.id;
                    
                    return (
                      <motion.div
                        key={ant.id}
                        whileHover={{ scale: 1.01 }}
                        className={`ant-list-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleAntSelect(ant)}
                      >
                        <div className="flex items-center gap-3">
                          {batchMode && (
                            <input
                              type="checkbox"
                              checked={selectedAnts.has(ant.id)}
                              onChange={() => handleAntSelect(ant)}
                              className="rounded border-earth-300"
                            />
                          )}
                          <div className="text-xl">{role.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium">Ant #{ant.id}</div>
                            <div className="text-sm text-earth-600">{role.name}</div>
                            {ant.experience && (
                              <div className="text-xs text-earth-500">
                                Exp: {ant.experience} | Efficiency: {ant.efficiency || 'N/A'}%
                              </div>
                            )}
                          </div>
                          <div className={`ant-role-badge ${role.color}`}>
                            {role.name}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AntRolePanel; 
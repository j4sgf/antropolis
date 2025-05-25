import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import colonyService from '../../services/colonyService';
import roleAssignmentService from '../../services/roleAssignmentService';
import './LeftPanel.css';

const LeftPanel = ({ colonyId, colonyData, onCollapse, theme, onColonyUpdate }) => {
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [antStats, setAntStats] = useState(null);
  const [roleDistribution, setRoleDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  // Role configuration with icons and colors
  const roleConfig = {
    worker: { icon: '👷', color: '#8b5a2b', label: 'Workers' },
    soldier: { icon: '⚔️', color: '#dc2626', label: 'Soldiers' },
    scout: { icon: '🔍', color: '#2563eb', label: 'Scouts' },
    nurse: { icon: '🏥', color: '#16a34a', label: 'Nurses' },
    builder: { icon: '🔨', color: '#ea580c', label: 'Builders' },
    forager: { icon: '🌿', color: '#65a30d', label: 'Foragers' }
  };

  // Load colony data and stats
  useEffect(() => {
    if (colonyId) {
      loadColonyData();
      // Set up periodic refresh
      const interval = setInterval(loadColonyData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [colonyId]);

  const loadColonyData = async () => {
    try {
      setError(null);
      
      // Fetch colony stats, ant stats, and role distribution in parallel
      const [colonyResponse, antResponse, roleResponse] = await Promise.all([
        colonyService.getColony(colonyId, true),
        colonyService.getColonyAntStats(colonyId),
        roleAssignmentService.getRoleDistribution(colonyId)
      ]);

      setRealTimeStats(colonyResponse.data);
      setAntStats(antResponse.data);
      setRoleDistribution(roleResponse);
      
      // Update parent colony data if callback provided
      if (onColonyUpdate) {
        onColonyUpdate(colonyResponse.data);
      }
    } catch (err) {
      console.error('Error loading colony data:', err);
      setError('Failed to load colony data');
    } finally {
      setLoading(false);
    }
  };

  // Handle role assignment changes
  const handleRoleChange = async (role, change) => {
    if (updating) return;

    try {
      setUpdating(true);
      setError(null);

      // Get current ants to find ones to reassign
      const ants = await roleAssignmentService.getColonyAnts(colonyId, false);
      
      if (change > 0) {
        // Find ants with other roles to convert
        const availableAnts = ants.filter(ant => 
          ant.role !== role && 
          ant.status === 'adult' &&
          !['queen'].includes(ant.role) // Don't reassign queens
        );
        
        if (availableAnts.length === 0) {
          throw new Error('No ants available for reassignment');
        }

        // Reassign the first available ant
        const antToReassign = availableAnts[0];
        await roleAssignmentService.updateAntRole(colonyId, antToReassign.id, role);
      } else {
        // Find ants with this role to convert to worker
        const roleAnts = ants.filter(ant => 
          ant.role === role && 
          ant.status === 'adult'
        );
        
        if (roleAnts.length === 0) {
          throw new Error(`No ${role}s available to reassign`);
        }

        // Reassign to worker (default role)
        const antToReassign = roleAnts[0];
        await roleAssignmentService.updateAntRole(colonyId, antToReassign.id, 'worker');
      }

      // Refresh data after successful assignment
      await loadColonyData();
    } catch (err) {
      console.error('Error changing ant role:', err);
      setError(err.message || 'Failed to change ant assignment');
    } finally {
      setUpdating(false);
    }
  };

  // Handle quick actions
  const handleEmergencyRally = async () => {
    try {
      setUpdating(true);
      // Convert 50% of workers to soldiers temporarily
      const ants = await roleAssignmentService.getColonyAnts(colonyId, false);
      const workers = ants.filter(ant => ant.role === 'worker' && ant.status === 'adult');
      const toConvert = workers.slice(0, Math.floor(workers.length * 0.5));
      
      if (toConvert.length > 0) {
        await roleAssignmentService.batchUpdateAntRoles(
          colonyId, 
          toConvert.map(ant => ant.id), 
          'soldier'
        );
        await loadColonyData();
      }
    } catch (err) {
      setError('Failed to rally ants');
    } finally {
      setUpdating(false);
    }
  };

  const handleAutoOptimize = async () => {
    try {
      setUpdating(true);
      // Get role recommendations and apply them
      const recommendations = await roleAssignmentService.getRoleRecommendations(colonyId);
      // Implementation would apply the recommendations
      await loadColonyData();
    } catch (err) {
      setError('Failed to optimize assignments');
    } finally {
      setUpdating(false);
    }
  };

  // Calculate colony stats
  const colonyStats = realTimeStats ? {
    population: realTimeStats.population || 0,
    territory: `${((realTimeStats.territory_size || 100) / 100).toFixed(1)} km²`,
    efficiency: Math.round((realTimeStats.efficiency || 0.8) * 100),
    morale: Math.round((realTimeStats.morale || 0.9) * 100),
    resources: {
      food: realTimeStats.food_storage || 0,
      materials: realTimeStats.material_storage || 0,
      larvae: antStats?.egg_count || 0
    }
  } : null;

  if (loading) {
    return (
      <div className={`left-panel ${theme}`}>
        <div className="panel-header">
          <div className="header-content">
            <h2 className="panel-title">📊 Colony Control</h2>
            <button className="collapse-button" onClick={onCollapse}>←</button>
          </div>
        </div>
        <div className="panel-content">
          <div className="loading-state">
            <div className="loading-spinner">🐜</div>
            <p>Loading colony data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`left-panel ${theme}`}>
      {/* Panel Header */}
      <div className="panel-header">
        <div className="header-content">
          <h2 className="panel-title">
            <span className="title-icon">📊</span>
            Colony Control
          </h2>
          <button 
            className="collapse-button"
            onClick={onCollapse}
            title="Collapse Panel (Ctrl+Q)"
          >
            ←
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div 
          className="error-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          ⚠️ {error}
          <button onClick={() => setError(null)}>×</button>
        </motion.div>
      )}

      {/* Panel Content */}
      <div className="panel-content">
        {/* Colony Overview Stats */}
        <motion.section 
          className="stats-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="section-title">
            <span className="section-icon">🏛️</span>
            Colony Overview
          </h3>
          
          {colonyStats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🐜</div>
                <div className="stat-content">
                  <div className="stat-value">{colonyStats.population}</div>
                  <div className="stat-label">Population</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">🗺️</div>
                <div className="stat-content">
                  <div className="stat-value">{colonyStats.territory}</div>
                  <div className="stat-label">Territory</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-content">
                  <div className="stat-value">{colonyStats.efficiency}%</div>
                  <div className="stat-label">Efficiency</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">😊</div>
                <div className="stat-content">
                  <div className="stat-value">{colonyStats.morale}%</div>
                  <div className="stat-label">Morale</div>
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* Resource Summary */}
        <motion.section 
          className="resources-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="section-title">
            <span className="section-icon">📦</span>
            Resources
          </h3>
          
          {colonyStats && (
            <div className="resource-list">
              <div className="resource-item">
                <span className="resource-icon">🍯</span>
                <span className="resource-name">Food</span>
                <span className="resource-value">{colonyStats.resources.food}</span>
              </div>
              <div className="resource-item">
                <span className="resource-icon">🪨</span>
                <span className="resource-name">Materials</span>
                <span className="resource-value">{colonyStats.resources.materials}</span>
              </div>
              <div className="resource-item">
                <span className="resource-icon">🥚</span>
                <span className="resource-name">Larvae</span>
                <span className="resource-value">{colonyStats.resources.larvae}</span>
              </div>
            </div>
          )}
        </motion.section>

        {/* Ant Role Assignments */}
        <motion.section 
          className="roles-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="section-title">
            <span className="section-icon">👥</span>
            Ant Assignments
            {updating && <span className="updating-indicator">🔄</span>}
          </h3>
          
          <div className="roles-list">
            {Object.entries(roleConfig).map(([roleType, config], index) => {
              const count = roleDistribution[roleType] || 0;
              const maxCount = Math.floor((colonyStats?.population || 0) * 0.3); // Max 30% per role
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <motion.div 
                  key={roleType}
                  className="role-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="role-header">
                    <span className="role-icon" style={{ color: config.color }}>
                      {config.icon}
                    </span>
                    <span className="role-name">{config.label}</span>
                    <span className="role-count">{count}/{maxCount}</span>
                  </div>
                  
                  <div className="role-progress">
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: config.color 
                      }}
                    />
                  </div>
                  
                  <div className="role-controls">
                    <button 
                      className="role-button decrease"
                      disabled={count <= 0 || updating}
                      onClick={() => handleRoleChange(roleType, -1)}
                      title={`Decrease ${config.label.toLowerCase()}`}
                    >
                      −
                    </button>
                    <button 
                      className="role-button increase"
                      disabled={count >= maxCount || updating}
                      onClick={() => handleRoleChange(roleType, 1)}
                      title={`Increase ${config.label.toLowerCase()}`}
                    >
                      +
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section 
          className="actions-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="section-title">
            <span className="section-icon">⚡</span>
            Quick Actions
          </h3>
          
          <div className="action-buttons">
            <button 
              className="action-button primary"
              onClick={handleEmergencyRally}
              disabled={updating}
            >
              <span className="button-icon">🚨</span>
              Emergency Rally
            </button>
            <button 
              className="action-button secondary"
              onClick={handleAutoOptimize}
              disabled={updating}
            >
              <span className="button-icon">🔄</span>
              Auto-Optimize
            </button>
            <button 
              className="action-button secondary"
              onClick={loadColonyData}
              disabled={updating}
            >
              <span className="button-icon">📊</span>
              Refresh Data
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default LeftPanel; 
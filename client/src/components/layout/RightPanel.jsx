import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './RightPanel.css';

const RightPanel = ({ colonyId, colonyData, onCollapse, theme }) => {
  const [selectedUpgrade, setSelectedUpgrade] = useState(null);
  const [activeTab, setActiveTab] = useState('evolution'); // 'evolution' or 'resources'

  // Mock evolution tree data
  const mockEvolutionTree = {
    available: [
      {
        id: 'enhanced_foraging',
        name: 'Enhanced Foraging',
        description: 'Increase food gathering efficiency by 25%',
        cost: { research: 50, materials: 30 },
        icon: '🌿',
        category: 'economy',
        unlocked: true,
        level: 1,
        maxLevel: 3
      },
      {
        id: 'soldier_training',
        name: 'Soldier Training',
        description: 'Improve soldier combat effectiveness',
        cost: { research: 75, food: 40 },
        icon: '⚔️',
        category: 'military',
        unlocked: true,
        level: 0,
        maxLevel: 5
      },
      {
        id: 'advanced_architecture',
        name: 'Advanced Architecture',
        description: 'Build more efficient structures',
        cost: { research: 100, materials: 80 },
        icon: '🏗️',
        category: 'infrastructure',
        unlocked: false,
        level: 0,
        maxLevel: 3,
        requirements: ['enhanced_foraging']
      }
    ],
    completed: [
      {
        id: 'basic_farming',
        name: 'Basic Farming',
        description: 'Foundation of agricultural knowledge',
        icon: '🌱',
        category: 'economy',
        level: 1
      }
    ]
  };

  // Mock resource management data
  const mockResourceData = {
    current: {
      food: 850,
      materials: 320,
      research: 125,
      energy: 200
    },
    production: {
      food: 45,
      materials: 12,
      research: 8,
      energy: 25
    },
    consumption: {
      food: 30,
      materials: 5,
      research: 0,
      energy: 15
    },
    storage: {
      food: 1200,
      materials: 500,
      research: 300,
      energy: 400
    }
  };

  const handleUpgradeSelect = (upgrade) => {
    setSelectedUpgrade(upgrade);
  };

  const handleUpgradeResearch = (upgradeId) => {
    console.log(`Starting research for ${upgradeId}`);
    // Here would be the actual upgrade logic
  };

  const renderEvolutionTree = () => (
    <div className="evolution-content">
      {/* Available Upgrades */}
      <div className="upgrades-section">
        <h4 className="subsection-title">
          <span className="subsection-icon">🔬</span>
          Available Research
        </h4>
        
        <div className="upgrades-grid">
          {mockEvolutionTree.available.map((upgrade, index) => (
            <motion.div
              key={upgrade.id}
              className={`upgrade-card ${upgrade.category} ${!upgrade.unlocked ? 'locked' : ''} ${selectedUpgrade?.id === upgrade.id ? 'selected' : ''}`}
              onClick={() => upgrade.unlocked && handleUpgradeSelect(upgrade)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={upgrade.unlocked ? { scale: 1.02, y: -2 } : {}}
            >
              <div className="upgrade-header">
                <span className="upgrade-icon">{upgrade.icon}</span>
                <div className="upgrade-info">
                  <div className="upgrade-name">{upgrade.name}</div>
                  <div className="upgrade-level">
                    Level {upgrade.level}/{upgrade.maxLevel}
                  </div>
                </div>
                {!upgrade.unlocked && (
                  <span className="locked-indicator">🔒</span>
                )}
              </div>
              
              <div className="upgrade-description">
                {upgrade.description}
              </div>
              
              <div className="upgrade-cost">
                {Object.entries(upgrade.cost).map(([resource, amount]) => (
                  <span key={resource} className={`cost-item ${resource}`}>
                    {resource === 'food' && '🍯'}
                    {resource === 'materials' && '🪨'}
                    {resource === 'research' && '🔬'}
                    {amount}
                  </span>
                ))}
              </div>
              
              {upgrade.unlocked && (
                <button 
                  className="research-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpgradeResearch(upgrade.id);
                  }}
                >
                  Research
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Completed Upgrades */}
      <div className="completed-section">
        <h4 className="subsection-title">
          <span className="subsection-icon">✅</span>
          Completed Research
        </h4>
        
        <div className="completed-list">
          {mockEvolutionTree.completed.map((upgrade) => (
            <div key={upgrade.id} className="completed-item">
              <span className="completed-icon">{upgrade.icon}</span>
              <span className="completed-name">{upgrade.name}</span>
              <span className="completed-level">Lv.{upgrade.level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResourceManagement = () => (
    <div className="resource-content">
      {/* Resource Overview */}
      <div className="resource-overview">
        <h4 className="subsection-title">
          <span className="subsection-icon">📊</span>
          Resource Overview
        </h4>
        
        <div className="resource-cards">
          {Object.entries(mockResourceData.current).map(([resource, amount]) => {
            const production = mockResourceData.production[resource] || 0;
            const consumption = mockResourceData.consumption[resource] || 0;
            const storage = mockResourceData.storage[resource] || 0;
            const net = production - consumption;
            
            return (
              <div key={resource} className={`resource-card ${resource}`}>
                <div className="resource-header">
                  <span className="resource-icon">
                    {resource === 'food' && '🍯'}
                    {resource === 'materials' && '🪨'}
                    {resource === 'research' && '🔬'}
                    {resource === 'energy' && '⚡'}
                  </span>
                  <span className="resource-name">
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </span>
                </div>
                
                <div className="resource-amount">
                  {amount} / {storage}
                </div>
                
                <div className="resource-bar">
                  <div 
                    className="resource-fill"
                    style={{ width: `${(amount / storage) * 100}%` }}
                  />
                </div>
                
                <div className={`resource-net ${net >= 0 ? 'positive' : 'negative'}`}>
                  {net >= 0 ? '+' : ''}{net}/turn
                </div>
                
                <div className="resource-details">
                  <span className="production">+{production}</span>
                  <span className="consumption">-{consumption}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource Actions */}
      <div className="resource-actions">
        <h4 className="subsection-title">
          <span className="subsection-icon">⚙️</span>
          Management Actions
        </h4>
        
        <div className="action-grid">
          <button className="management-button trade">
            <span className="action-icon">🔄</span>
            <div className="action-content">
              <div className="action-name">Trade Resources</div>
              <div className="action-desc">Exchange with allies</div>
            </div>
          </button>
          
          <button className="management-button optimize">
            <span className="action-icon">⚡</span>
            <div className="action-content">
              <div className="action-name">Auto-Optimize</div>
              <div className="action-desc">Balance production</div>
            </div>
          </button>
          
          <button className="management-button storage">
            <span className="action-icon">📦</span>
            <div className="action-content">
              <div className="action-name">Expand Storage</div>
              <div className="action-desc">Increase capacity</div>
            </div>
          </button>
          
          <button className="management-button emergency">
            <span className="action-icon">🚨</span>
            <div className="action-content">
              <div className="action-name">Emergency Mode</div>
              <div className="action-desc">Conserve resources</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`right-panel ${theme}`}>
      {/* Panel Header */}
      <div className="panel-header">
        <div className="header-content">
          <h2 className="panel-title">
            <span className="title-icon">🌳</span>
            Evolution & Resources
          </h2>
          <button 
            className="collapse-button"
            onClick={onCollapse}
            title="Collapse Panel (Ctrl+E)"
          >
            →
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'evolution' ? 'active' : ''}`}
          onClick={() => setActiveTab('evolution')}
        >
          <span className="tab-icon">🧬</span>
          Evolution Tree
        </button>
        <button 
          className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          <span className="tab-icon">📊</span>
          Resources
        </button>
      </div>

      {/* Panel Content */}
      <div className="panel-content">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'evolution' ? renderEvolutionTree() : renderResourceManagement()}
        </motion.div>
      </div>

      {/* Upgrade Details Modal */}
      {selectedUpgrade && (
        <motion.div 
          className="upgrade-details"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="details-header">
            <h4>{selectedUpgrade.name}</h4>
            <button 
              className="close-details"
              onClick={() => setSelectedUpgrade(null)}
            >
              ×
            </button>
          </div>
          
          <div className="details-content">
            <p><strong>Description:</strong> {selectedUpgrade.description}</p>
            <p><strong>Category:</strong> {selectedUpgrade.category}</p>
            <p><strong>Current Level:</strong> {selectedUpgrade.level}/{selectedUpgrade.maxLevel}</p>
            
            <div className="cost-breakdown">
              <strong>Research Cost:</strong>
              {Object.entries(selectedUpgrade.cost).map(([resource, amount]) => (
                <span key={resource} className="cost-detail">
                  {resource}: {amount}
                </span>
              ))}
            </div>
            
            {selectedUpgrade.requirements && (
              <div className="requirements">
                <strong>Requirements:</strong>
                {selectedUpgrade.requirements.map(req => (
                  <span key={req} className="requirement">{req}</span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RightPanel; 
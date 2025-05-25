import React from 'react';
import { motion } from 'framer-motion';
import TechTreeNode from './TechTreeNode';
import TechTreeConnection from './TechTreeConnection';
import './TechTreePath.css';

const TechTreePath = ({ 
  category, 
  technologies, 
  unlockedTechs, 
  evolutionPoints, 
  onTechSelect, 
  onTechUnlock 
}) => {
  // Calculate node positions based on prerequisites and tier
  const calculateNodePositions = (techs) => {
    const positions = {};
    const tiers = {};
    
    // First pass: determine tiers (depth from root)
    const calculateTier = (techId, visited = new Set()) => {
      if (visited.has(techId)) return 0; // Circular dependency protection
      visited.add(techId);
      
      const tech = techs.find(t => t.id === techId);
      if (!tech || tech.prerequisite_techs.length === 0) {
        return 0;
      }
      
      const maxPrereqTier = Math.max(
        ...tech.prerequisite_techs.map(prereqId => calculateTier(prereqId, new Set(visited)))
      );
      
      return maxPrereqTier + 1;
    };
    
    // Calculate tiers for all technologies
    techs.forEach(tech => {
      tiers[tech.id] = calculateTier(tech.id);
    });
    
    // Group technologies by tier
    const tierGroups = {};
    Object.entries(tiers).forEach(([techId, tier]) => {
      if (!tierGroups[tier]) tierGroups[tier] = [];
      tierGroups[tier].push(techId);
    });
    
    // Position nodes
    const nodeSpacing = { x: 250, y: 150 };
    const startX = 100;
    const startY = 100;
    
    Object.entries(tierGroups).forEach(([tier, techIds]) => {
      const tierNum = parseInt(tier);
      const techCount = techIds.length;
      const tierStartY = startY + (techCount - 1) * nodeSpacing.y / 2;
      
      techIds.forEach((techId, index) => {
        positions[techId] = {
          x: startX + tierNum * nodeSpacing.x,
          y: tierStartY - index * nodeSpacing.y
        };
      });
    });
    
    return positions;
  };

  const nodePositions = calculateNodePositions(technologies);

  // Check if a technology is available (prerequisites met)
  const isTechAvailable = (tech) => {
    return tech.prerequisite_techs.every(prereqId => unlockedTechs.includes(prereqId));
  };

  // Check if a technology can be afforded
  const canAffordTech = (tech) => {
    return evolutionPoints >= tech.required_research_points;
  };

  // Get tech status
  const getTechStatus = (tech) => {
    if (unlockedTechs.includes(tech.id)) return 'unlocked';
    if (!isTechAvailable(tech)) return 'locked';
    if (!canAffordTech(tech)) return 'unaffordable';
    return 'available';
  };

  // Generate connections between technologies
  const generateConnections = () => {
    const connections = [];
    
    technologies.forEach(tech => {
      tech.prerequisite_techs.forEach(prereqId => {
        const prereqTech = technologies.find(t => t.id === prereqId);
        if (prereqTech && nodePositions[tech.id] && nodePositions[prereqId]) {
          connections.push({
            from: nodePositions[prereqId],
            to: nodePositions[tech.id],
            fromTech: prereqTech,
            toTech: tech,
            isActive: unlockedTechs.includes(prereqId)
          });
        }
      });
    });
    
    return connections;
  };

  const connections = generateConnections();

  // Calculate container dimensions
  const containerDimensions = () => {
    if (Object.keys(nodePositions).length === 0) {
      return { width: 800, height: 600 };
    }
    
    const positions = Object.values(nodePositions);
    const minX = Math.min(...positions.map(p => p.x)) - 100;
    const maxX = Math.max(...positions.map(p => p.x)) + 200;
    const minY = Math.min(...positions.map(p => p.y)) - 100;
    const maxY = Math.max(...positions.map(p => p.y)) + 200;
    
    return {
      width: Math.max(800, maxX - minX),
      height: Math.max(600, maxY - minY),
      offsetX: -minX,
      offsetY: -minY
    };
  };

  const dimensions = containerDimensions();

  return (
    <div className="tech-tree-path">
      <div 
        className="tech-tree-canvas"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          position: 'relative'
        }}
      >
        {/* Render connections first (behind nodes) */}
        <svg 
          className="tech-tree-connections"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          {connections.map((connection, index) => (
            <TechTreeConnection
              key={`${connection.fromTech.id}-${connection.toTech.id}`}
              from={{
                x: connection.from.x + dimensions.offsetX + 75, // Node center offset
                y: connection.from.y + dimensions.offsetY + 75
              }}
              to={{
                x: connection.to.x + dimensions.offsetX + 75,
                y: connection.to.y + dimensions.offsetY + 75
              }}
              isActive={connection.isActive}
              fromTech={connection.fromTech}
              toTech={connection.toTech}
            />
          ))}
        </svg>

        {/* Render technology nodes */}
        {technologies.map((tech, index) => {
          const position = nodePositions[tech.id];
          if (!position) return null;

          const status = getTechStatus(tech);
          
          return (
            <motion.div
              key={tech.id}
              className="tech-node-container"
              style={{
                position: 'absolute',
                left: position.x + dimensions.offsetX,
                top: position.y + dimensions.offsetY
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <TechTreeNode
                tech={tech}
                status={status}
                isUnlocked={unlockedTechs.includes(tech.id)}
                canAfford={canAffordTech(tech)}
                isAvailable={isTechAvailable(tech)}
                onClick={() => onTechSelect(tech)}
                onUnlock={() => onTechUnlock(tech.id)}
              />
            </motion.div>
          );
        })}

        {/* Category background decoration */}
        <div className={`category-background ${category}`}>
          <div className="category-pattern"></div>
        </div>
      </div>

      {/* Category info panel */}
      <div className="category-info">
        <h3 className="category-title">
          {category.charAt(0).toUpperCase() + category.slice(1)} Evolution Path
        </h3>
        <div className="category-stats">
          <div className="stat">
            <span className="stat-label">Available:</span>
            <span className="stat-value">
              {technologies.filter(tech => isTechAvailable(tech) && !unlockedTechs.includes(tech.id)).length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Unlocked:</span>
            <span className="stat-value">
              {technologies.filter(tech => unlockedTechs.includes(tech.id)).length}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{technologies.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechTreePath; 
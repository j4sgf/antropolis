/**
 * VisibilityService for managing fog-of-war mechanics for AI colonies
 * Handles visibility calculations, exploration tracking, and information discovery
 */

class VisibilityService {
  constructor() {
    this.visibilityMaps = new Map(); // Store visibility data per colony
    this.visibilityRanges = {
      base: 5,        // Base visibility range
      scout: 8,       // Scout unit visibility range
      watchtower: 12, // Watchtower visibility range
      outpost: 6      // Outpost visibility range
    };
    this.fogDecayRate = 0.1; // Rate at which unexplored areas become "foggier"
  }

  /**
   * Initialize visibility map for a colony
   */
  initializeColonyVisibility(colonyId, basePosition) {
    const visibilityData = {
      colonyId: colonyId,
      basePosition: basePosition,
      exploredTiles: new Set(),
      visibleTiles: new Set(),
      lastUpdate: new Date(),
      discoveredResources: [],
      discoveredEnemies: [],
      discoveredFeatures: [],
      fogOfWar: new Map() // Tracks fog levels for tiles
    };

    this.visibilityMaps.set(colonyId, visibilityData);
    
    // Initially visible area around base
    this.updateVisibilityAroundPosition(colonyId, basePosition, this.visibilityRanges.base);
    
    return visibilityData;
  }

  /**
   * Update visibility around a position
   */
  updateVisibilityAroundPosition(colonyId, position, range) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return;
    }

    const visibleTiles = this.calculateVisibleTiles(position, range);
    
    // Add newly visible tiles
    visibleTiles.forEach(tile => {
      const tileKey = `${tile.x},${tile.y}`;
      visibilityData.visibleTiles.add(tileKey);
      visibilityData.exploredTiles.add(tileKey);
      
      // Remove fog from visible tiles
      visibilityData.fogOfWar.set(tileKey, 0);
    });

    visibilityData.lastUpdate = new Date();
  }

  /**
   * Calculate visible tiles from a position
   */
  calculateVisibleTiles(center, range) {
    const visibleTiles = [];
    
    for (let x = center.x - range; x <= center.x + range; x++) {
      for (let y = center.y - range; y <= center.y + range; y++) {
        const distance = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
        
        if (distance <= range) {
          // Apply line-of-sight calculation (simplified)
          if (this.hasLineOfSight(center, { x, y })) {
            visibleTiles.push({ x, y, distance });
          }
        }
      }
    }
    
    return visibleTiles;
  }

  /**
   * Simple line-of-sight calculation
   */
  hasLineOfSight(from, to) {
    // Simplified implementation - in reality, this would check for terrain obstacles
    const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));
    
    // Assume clear line of sight for now
    // In a full implementation, this would raycast and check for blocking terrain
    return true;
  }

  /**
   * Process scout exploration
   */
  processScoutExploration(colonyId, scoutPositions, explorationData = {}) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return { error: 'Colony visibility data not found' };
    }

    const explorationResults = {
      newTilesExplored: 0,
      discoveries: [],
      intelligence: [],
      updatedVisibility: false
    };

    // Process each scout position
    scoutPositions.forEach(position => {
      const scoutRange = this.visibilityRanges.scout;
      const previousTileCount = visibilityData.exploredTiles.size;
      
      // Update visibility around scout
      this.updateVisibilityAroundPosition(colonyId, position, scoutRange);
      
      // Check for discoveries at this position
      const discoveries = this.checkForDiscoveries(colonyId, position, explorationData);
      explorationResults.discoveries.push(...discoveries);
      
      // Calculate new tiles explored
      const newTileCount = visibilityData.exploredTiles.size;
      explorationResults.newTilesExplored += (newTileCount - previousTileCount);
    });

    explorationResults.updatedVisibility = explorationResults.newTilesExplored > 0;
    
    return explorationResults;
  }

  /**
   * Check for discoveries at a position
   */
  checkForDiscoveries(colonyId, position, explorationData) {
    const discoveries = [];
    const visibilityData = this.visibilityMaps.get(colonyId);
    
    // Check for resources
    if (explorationData.resources) {
      explorationData.resources.forEach(resource => {
        if (this.isPositionNear(position, resource.location, 2)) {
          const discovery = {
            type: 'resource',
            resource_type: resource.type,
            location: resource.location,
            abundance: resource.abundance,
            discovered_at: new Date(),
            discoverer: 'scout'
          };
          
          discoveries.push(discovery);
          visibilityData.discoveredResources.push(discovery);
        }
      });
    }

    // Check for enemy activities
    if (explorationData.enemies) {
      explorationData.enemies.forEach(enemy => {
        if (this.isPositionNear(position, enemy.location, this.visibilityRanges.scout)) {
          const intelligence = {
            type: 'enemy_sighting',
            enemy_id: enemy.id,
            location: enemy.location,
            unit_count: enemy.unit_count,
            activity_type: enemy.activity,
            discovered_at: new Date(),
            discoverer: 'scout'
          };
          
          discoveries.push(intelligence);
          visibilityData.discoveredEnemies.push(intelligence);
        }
      });
    }

    // Check for terrain features
    if (explorationData.terrain_features) {
      explorationData.terrain_features.forEach(feature => {
        if (this.isPositionNear(position, feature.location, 1)) {
          const featureDiscovery = {
            type: 'terrain_feature',
            feature_type: feature.type,
            location: feature.location,
            strategic_value: feature.strategic_value,
            discovered_at: new Date(),
            discoverer: 'scout'
          };
          
          discoveries.push(featureDiscovery);
          visibilityData.discoveredFeatures.push(featureDiscovery);
        }
      });
    }

    return discoveries;
  }

  /**
   * Check if position is near target location
   */
  isPositionNear(position, target, range) {
    const distance = Math.sqrt(
      Math.pow(position.x - target.x, 2) + 
      Math.pow(position.y - target.y, 2)
    );
    return distance <= range;
  }

  /**
   * Update fog of war for unexplored areas
   */
  updateFogOfWar(colonyId) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return;
    }

    const currentTime = new Date();
    const timeDelta = (currentTime - visibilityData.lastUpdate) / (1000 * 60 * 60); // Hours

    // Increase fog for tiles that haven't been visited recently
    visibilityData.fogOfWar.forEach((fogLevel, tileKey) => {
      if (!visibilityData.visibleTiles.has(tileKey)) {
        const newFogLevel = Math.min(1.0, fogLevel + this.fogDecayRate * timeDelta);
        visibilityData.fogOfWar.set(tileKey, newFogLevel);
      }
    });
  }

  /**
   * Get current visibility status for a colony
   */
  getVisibilityStatus(colonyId) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return null;
    }

    return {
      colonyId: colonyId,
      exploredTilesCount: visibilityData.exploredTiles.size,
      visibleTilesCount: visibilityData.visibleTiles.size,
      discoveredResourcesCount: visibilityData.discoveredResources.length,
      discoveredEnemiesCount: visibilityData.discoveredEnemies.length,
      discoveredFeaturesCount: visibilityData.discoveredFeatures.length,
      lastUpdate: visibilityData.lastUpdate,
      fogCoverage: this.calculateFogCoverage(visibilityData)
    };
  }

  /**
   * Calculate fog coverage percentage
   */
  calculateFogCoverage(visibilityData) {
    if (visibilityData.fogOfWar.size === 0) {
      return 1.0; // 100% fog if no tiles explored
    }

    let totalFog = 0;
    visibilityData.fogOfWar.forEach(fogLevel => {
      totalFog += fogLevel;
    });

    return totalFog / visibilityData.fogOfWar.size;
  }

  /**
   * Check if a position is visible to a colony
   */
  isPositionVisible(colonyId, position) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return false;
    }

    const tileKey = `${position.x},${position.y}`;
    return visibilityData.visibleTiles.has(tileKey);
  }

  /**
   * Check if a position has been explored by a colony
   */
  isPositionExplored(colonyId, position) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return false;
    }

    const tileKey = `${position.x},${position.y}`;
    return visibilityData.exploredTiles.has(tileKey);
  }

  /**
   * Get fog level at a position
   */
  getFogLevel(colonyId, position) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return 1.0; // Maximum fog
    }

    const tileKey = `${position.x},${position.y}`;
    return visibilityData.fogOfWar.get(tileKey) || 1.0;
  }

  /**
   * Add a watchtower and update visibility
   */
  addWatchtower(colonyId, position) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return false;
    }

    // Watchtowers provide extended visibility
    this.updateVisibilityAroundPosition(colonyId, position, this.visibilityRanges.watchtower);
    
    return true;
  }

  /**
   * Add an outpost and update visibility
   */
  addOutpost(colonyId, position) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return false;
    }

    // Outposts provide moderate visibility
    this.updateVisibilityAroundPosition(colonyId, position, this.visibilityRanges.outpost);
    
    return true;
  }

  /**
   * Get all discovered resources for a colony
   */
  getDiscoveredResources(colonyId) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return [];
    }

    return visibilityData.discoveredResources;
  }

  /**
   * Get all discovered enemies for a colony
   */
  getDiscoveredEnemies(colonyId) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return [];
    }

    return visibilityData.discoveredEnemies;
  }

  /**
   * Get unexplored areas near a position
   */
  getUnexploredAreas(colonyId, center, radius) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return [];
    }

    const unexploredAreas = [];
    
    for (let x = center.x - radius; x <= center.x + radius; x++) {
      for (let y = center.y - radius; y <= center.y + radius; y++) {
        const distance = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
        
        if (distance <= radius) {
          const tileKey = `${x},${y}`;
          
          if (!visibilityData.exploredTiles.has(tileKey)) {
            unexploredAreas.push({
              x: x,
              y: y,
              distance: distance,
              priority: this.calculateExplorationPriority({ x, y }, center, visibilityData)
            });
          }
        }
      }
    }

    // Sort by priority
    unexploredAreas.sort((a, b) => b.priority - a.priority);
    
    return unexploredAreas;
  }

  /**
   * Calculate exploration priority for a position
   */
  calculateExplorationPriority(position, center, visibilityData) {
    let priority = 0.5;

    // Distance factor (closer is better)
    const distance = Math.sqrt(
      Math.pow(position.x - center.x, 2) + 
      Math.pow(position.y - center.y, 2)
    );
    priority += Math.max(0, 1 - (distance / 20));

    // Adjacent to explored areas gets higher priority
    const adjacentExplored = this.countAdjacentExploredTiles(position, visibilityData);
    priority += adjacentExplored * 0.1;

    // Strategic positions (like corners or edges) get bonus
    if (this.isStrategicPosition(position)) {
      priority += 0.2;
    }

    return Math.min(1.0, priority);
  }

  /**
   * Count adjacent explored tiles
   */
  countAdjacentExploredTiles(position, visibilityData) {
    const adjacentPositions = [
      { x: position.x + 1, y: position.y },
      { x: position.x - 1, y: position.y },
      { x: position.x, y: position.y + 1 },
      { x: position.x, y: position.y - 1 }
    ];

    let count = 0;
    adjacentPositions.forEach(adj => {
      const tileKey = `${adj.x},${adj.y}`;
      if (visibilityData.exploredTiles.has(tileKey)) {
        count++;
      }
    });

    return count;
  }

  /**
   * Check if position is strategic
   */
  isStrategicPosition(position) {
    // Simple heuristic - positions at regular intervals or specific coordinates
    return (position.x % 5 === 0 && position.y % 5 === 0) ||
           (Math.abs(position.x) > 15 || Math.abs(position.y) > 15);
  }

  /**
   * Export visibility data for a colony
   */
  exportVisibilityData(colonyId) {
    const visibilityData = this.visibilityMaps.get(colonyId);
    if (!visibilityData) {
      return null;
    }

    return {
      colonyId: colonyId,
      basePosition: visibilityData.basePosition,
      exploredTiles: Array.from(visibilityData.exploredTiles),
      visibleTiles: Array.from(visibilityData.visibleTiles),
      discoveredResources: visibilityData.discoveredResources,
      discoveredEnemies: visibilityData.discoveredEnemies,
      discoveredFeatures: visibilityData.discoveredFeatures,
      fogOfWar: Object.fromEntries(visibilityData.fogOfWar),
      lastUpdate: visibilityData.lastUpdate
    };
  }

  /**
   * Clear visibility data for a colony
   */
  clearColonyVisibility(colonyId) {
    return this.visibilityMaps.delete(colonyId);
  }
}

// Create singleton instance
const visibilityService = new VisibilityService();

module.exports = visibilityService; 
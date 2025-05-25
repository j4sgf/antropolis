/**
 * ExplorationManager class for tracking tile exploration state
 * Manages explored/unexplored status, discovery events, and memory decay
 */

class ExplorationManager {
  constructor() {
    this.explorationMaps = new Map(); // Store exploration data per colony
    this.globalDiscoveries = new Map(); // Global discoveries that can be found by any colony
    this.discoveryTypes = {
      RESOURCE_CACHE: 'resource_cache',
      HIDDEN_ENEMY: 'hidden_enemy', 
      NPC_NEST: 'npc_nest',
      ENVIRONMENTAL_HAZARD: 'environmental_hazard',
      ANCIENT_RUINS: 'ancient_ruins',
      WATER_SOURCE: 'water_source'
    };
    
    this.config = {
      memoryDecayRate: 0.01, // Rate at which tiles become unexplored again
      memoryDecayThreshold: 72, // Hours before decay starts
      maxMemoryRetention: 168, // Hours before complete memory loss (7 days)
      discoveryProbabilities: {
        [this.discoveryTypes.RESOURCE_CACHE]: 0.15,
        [this.discoveryTypes.HIDDEN_ENEMY]: 0.08, 
        [this.discoveryTypes.NPC_NEST]: 0.05,
        [this.discoveryTypes.ENVIRONMENTAL_HAZARD]: 0.12,
        [this.discoveryTypes.ANCIENT_RUINS]: 0.03,
        [this.discoveryTypes.WATER_SOURCE]: 0.10
      }
    };
  }

  /**
   * Initialize exploration map for a colony
   */
  initializeColonyExploration(colonyId, mapWidth, mapHeight, basePosition) {
    const explorationData = {
      colonyId: colonyId,
      mapWidth: mapWidth,
      mapHeight: mapHeight,
      basePosition: basePosition,
      exploredTiles: new Map(), // tileKey -> { exploredAt, lastVisited, discoveryType }
      visibleTiles: new Set(), // Currently visible tiles
      memoryDecayMap: new Map(), // tileKey -> decayLevel (0-1)
      totalExploredArea: 0,
      explorationHistory: [], // Track exploration milestones
      lastUpdate: new Date()
    };

    this.explorationMaps.set(colonyId, explorationData);
    
    // Initially explored area around base (3x3 grid)
    this.setExploredArea(colonyId, basePosition.x, basePosition.y, 1);
    
    return explorationData;
  }

  /**
   * Get exploration status for a specific tile
   */
  getExplorationStatus(colonyId, x, y) {
    const explorationData = this.explorationMaps.get(colonyId);
    if (!explorationData) {
      return { explored: false, visible: false, memoryDecay: 1.0 };
    }

    const tileKey = `${x},${y}`;
    const exploredInfo = explorationData.exploredTiles.get(tileKey);
    const isVisible = explorationData.visibleTiles.has(tileKey);
    const memoryDecay = explorationData.memoryDecayMap.get(tileKey) || 1.0;

    return {
      explored: !!exploredInfo,
      visible: isVisible,
      exploredAt: exploredInfo?.exploredAt || null,
      lastVisited: exploredInfo?.lastVisited || null,
      discoveryType: exploredInfo?.discoveryType || null,
      memoryDecay: memoryDecay,
      fogLevel: this.calculateFogLevel(exploredInfo, isVisible, memoryDecay)
    };
  }

  /**
   * Set a tile as explored
   */
  setExplored(colonyId, x, y, discoveryType = null) {
    const explorationData = this.explorationMaps.get(colonyId);
    if (!explorationData) {
      return false;
    }

    const tileKey = `${x},${y}`;
    const currentTime = new Date();
    const wasExplored = explorationData.exploredTiles.has(tileKey);

    // Update exploration data
    explorationData.exploredTiles.set(tileKey, {
      exploredAt: explorationData.exploredTiles.get(tileKey)?.exploredAt || currentTime,
      lastVisited: currentTime,
      discoveryType: discoveryType
    });

    // Reset memory decay for this tile
    explorationData.memoryDecayMap.set(tileKey, 0);

    // Update total explored area if this is a new tile
    if (!wasExplored) {
      explorationData.totalExploredArea++;
      
      // Record exploration milestone
      if (explorationData.totalExploredArea % 50 === 0) {
        explorationData.explorationHistory.push({
          milestone: explorationData.totalExploredArea,
          timestamp: currentTime,
          location: { x, y }
        });
      }
    }

    explorationData.lastUpdate = currentTime;
    return true;
  }

  /**
   * Set an area as explored (circular or square)
   */
  setExploredArea(colonyId, centerX, centerY, radius, shape = 'circular') {
    const explorationData = this.explorationMaps.get(colonyId);
    if (!explorationData) {
      return [];
    }

    const exploredTiles = [];
    const radiusSquared = radius * radius;

    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        // Check if tile is within map bounds
        if (x < 0 || x >= explorationData.mapWidth || 
            y < 0 || y >= explorationData.mapHeight) {
          continue;
        }

        let shouldExplore = false;
        
        if (shape === 'circular') {
          const distanceSquared = (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY);
          shouldExplore = distanceSquared <= radiusSquared;
        } else if (shape === 'square') {
          shouldExplore = Math.abs(x - centerX) <= radius && Math.abs(y - centerY) <= radius;
        }

        if (shouldExplore) {
          this.setExplored(colonyId, x, y);
          exploredTiles.push({ x, y });
        }
      }
    }

    return exploredTiles;
  }

  /**
   * Calculate visible tiles based on scout positions and ranges
   */
  calculateVisibleTiles(colonyId, scoutPositions = []) {
    const explorationData = this.explorationMaps.get(colonyId);
    if (!explorationData) {
      return [];
    }

    // Clear current visible tiles
    explorationData.visibleTiles.clear();
    
    // Add base visibility area
    const baseRange = 3;
    const baseVisibleTiles = this.getCircularArea(
      explorationData.basePosition.x,
      explorationData.basePosition.y,
      baseRange,
      explorationData.mapWidth,
      explorationData.mapHeight
    );

    baseVisibleTiles.forEach(({ x, y }) => {
      explorationData.visibleTiles.add(`${x},${y}`);
      this.setExplored(colonyId, x, y);
    });

    // Add scout visibility areas
    scoutPositions.forEach(scout => {
      const scoutRange = scout.visibilityRange || 5;
      const scoutVisibleTiles = this.getCircularArea(
        scout.x,
        scout.y,
        scoutRange,
        explorationData.mapWidth,
        explorationData.mapHeight
      );

      scoutVisibleTiles.forEach(({ x, y }) => {
        explorationData.visibleTiles.add(`${x},${y}`);
        this.setExplored(colonyId, x, y);
      });
    });

    explorationData.lastUpdate = new Date();
    return Array.from(explorationData.visibleTiles).map(tileKey => {
      const [x, y] = tileKey.split(',').map(Number);
      return { x, y };
    });
  }

  /**
   * Get circular area of tiles
   */
  getCircularArea(centerX, centerY, radius, mapWidth, mapHeight) {
    const tiles = [];
    const radiusSquared = radius * radius;

    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        // Check bounds
        if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
          continue;
        }

        // Check if within circular range
        const distanceSquared = (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY);
        if (distanceSquared <= radiusSquared) {
          tiles.push({ x, y });
        }
      }
    }

    return tiles;
  }

  /**
   * Calculate fog level for a tile (0 = no fog, 1 = full fog)
   */
  calculateFogLevel(exploredInfo, isVisible, memoryDecay) {
    if (isVisible) {
      return 0; // No fog for currently visible tiles
    }

    if (!exploredInfo) {
      return 1; // Full fog for unexplored tiles
    }

    // Partial fog based on memory decay
    return Math.min(0.7, memoryDecay * 0.7); // Max 70% fog for previously explored areas
  }

  /**
   * Process memory decay for all tiles
   */
  processMemoryDecay(colonyId) {
    const explorationData = this.explorationMaps.get(colonyId);
    if (!explorationData) {
      return;
    }

    const currentTime = new Date();
    const decayThresholdMs = this.config.memoryDecayThreshold * 60 * 60 * 1000;
    const maxRetentionMs = this.config.maxMemoryRetention * 60 * 60 * 1000;

    let tilesDecayed = 0;
    let tilesLost = 0;

    explorationData.exploredTiles.forEach((tileInfo, tileKey) => {
      // Skip currently visible tiles
      if (explorationData.visibleTiles.has(tileKey)) {
        explorationData.memoryDecayMap.set(tileKey, 0);
        return;
      }

      const timeSinceVisit = currentTime - new Date(tileInfo.lastVisited);
      
      if (timeSinceVisit > decayThresholdMs) {
        const decayProgress = (timeSinceVisit - decayThresholdMs) / (maxRetentionMs - decayThresholdMs);
        const decayLevel = Math.min(1.0, decayProgress);
        
        explorationData.memoryDecayMap.set(tileKey, decayLevel);
        tilesDecayed++;

        // Remove completely decayed tiles
        if (decayLevel >= 1.0) {
          explorationData.exploredTiles.delete(tileKey);
          explorationData.memoryDecayMap.delete(tileKey);
          explorationData.totalExploredArea--;
          tilesLost++;
        }
      }
    });

    explorationData.lastUpdate = currentTime;
    
    return {
      tilesDecayed,
      tilesLost,
      totalExplored: explorationData.totalExploredArea
    };
  }

  /**
   * Get exploration statistics for a colony
   */
  getExplorationStats(colonyId) {
    const explorationData = this.explorationMaps.get(colonyId);
    if (!explorationData) {
      return null;
    }

    const totalMapTiles = explorationData.mapWidth * explorationData.mapHeight;
    const explorationPercentage = (explorationData.totalExploredArea / totalMapTiles) * 100;
    
    // Count tiles by decay level
    const decayStats = {
      fresh: 0, // 0-25% decay
      fading: 0, // 25-75% decay  
      lost: 0 // 75%+ decay
    };

    explorationData.memoryDecayMap.forEach(decayLevel => {
      if (decayLevel < 0.25) decayStats.fresh++;
      else if (decayLevel < 0.75) decayStats.fading++;
      else decayStats.lost++;
    });

    return {
      colonyId,
      totalExploredTiles: explorationData.totalExploredArea,
      totalMapTiles,
      explorationPercentage: parseFloat(explorationPercentage.toFixed(2)),
      currentlyVisible: explorationData.visibleTiles.size,
      memoryDecayStats: decayStats,
      explorationMilestones: explorationData.explorationHistory.length,
      lastUpdate: explorationData.lastUpdate
    };
  }

  /**
   * Export exploration data for save/load
   */
  exportExplorationData(colonyId) {
    const explorationData = this.explorationMaps.get(colonyId);
    if (!explorationData) {
      return null;
    }

    return {
      colonyId: explorationData.colonyId,
      mapWidth: explorationData.mapWidth,
      mapHeight: explorationData.mapHeight,
      basePosition: explorationData.basePosition,
      exploredTiles: Object.fromEntries(explorationData.exploredTiles),
      visibleTiles: Array.from(explorationData.visibleTiles),
      memoryDecayMap: Object.fromEntries(explorationData.memoryDecayMap),
      totalExploredArea: explorationData.totalExploredArea,
      explorationHistory: explorationData.explorationHistory,
      lastUpdate: explorationData.lastUpdate
    };
  }

  /**
   * Import exploration data from save/load
   */
  importExplorationData(explorationData) {
    const colonyId = explorationData.colonyId;
    
    const importedData = {
      colonyId: explorationData.colonyId,
      mapWidth: explorationData.mapWidth,
      mapHeight: explorationData.mapHeight,
      basePosition: explorationData.basePosition,
      exploredTiles: new Map(Object.entries(explorationData.exploredTiles || {})),
      visibleTiles: new Set(explorationData.visibleTiles || []),
      memoryDecayMap: new Map(Object.entries(explorationData.memoryDecayMap || {})),
      totalExploredArea: explorationData.totalExploredArea || 0,
      explorationHistory: explorationData.explorationHistory || [],
      lastUpdate: new Date(explorationData.lastUpdate)
    };

    this.explorationMaps.set(colonyId, importedData);
    return importedData;
  }
}

module.exports = ExplorationManager; 
/**
 * Tile class representing a single map tile
 * Contains terrain type, resources, obstacles, and entities
 */

// Terrain types enumeration
const TERRAIN_TYPES = {
  GRASS: 'grass',
  SAND: 'sand',
  WATER: 'water', 
  ROCK: 'rock',
  DIRT: 'dirt',
  FERTILE_SOIL: 'fertile_soil',
  SWAMP: 'swamp',
  FOREST: 'forest',
  MOUNTAINS: 'mountains',
  PLAINS: 'plains'
};

// Resource types that can be found on tiles
const TILE_RESOURCE_TYPES = {
  FOOD: 'food',
  WATER: 'water',
  WOOD: 'wood',
  STONE: 'stone',
  MINERALS: 'minerals',
  NECTAR: 'nectar',
  SEEDS: 'seeds'
};

// Obstacle types
const OBSTACLE_TYPES = {
  ROCK: 'rock',
  TREE: 'tree',
  BUSH: 'bush',
  WATER_BODY: 'water_body',
  DEBRIS: 'debris'
};

class Tile {
  constructor(x, y, terrainType = TERRAIN_TYPES.GRASS) {
    this.x = x;
    this.y = y;
    this.terrainType = terrainType;
    
    // Resources available on this tile
    this.resources = new Map(); // resource_type -> { amount, quality, lastUpdated }
    
    // Obstacles on this tile
    this.obstacles = []; // array of { type, size, durability }
    
    // Entities present on this tile (ants, structures, etc.)
    this.entities = new Set();
    
    // Tile properties
    this.elevation = 0; // Height for 3D effects
    this.moisture = 0; // Moisture level (0-1)
    this.temperature = 0; // Temperature (-1 to 1, where 0 is moderate)
    this.fertility = 0; // How good for plant growth (0-1)
    
    // Exploration and visibility
    this.isExplored = false;
    this.isVisible = false;
    this.lastVisited = null;
    
    // Movement and pathfinding
    this.movementCost = this.getBaseMoveoCost();
    this.isPassable = this.calculatePassability();
    
    // Map generation metadata
    this.generationData = {
      seed: null,
      noiseValue: 0,
      biome: null
    };
  }

  /**
   * Get base movement cost for this terrain type
   */
  getBaseMoveoCost() {
    const movementCosts = {
      [TERRAIN_TYPES.GRASS]: 1,
      [TERRAIN_TYPES.SAND]: 1.5,
      [TERRAIN_TYPES.WATER]: 3,
      [TERRAIN_TYPES.ROCK]: 2,
      [TERRAIN_TYPES.DIRT]: 1,
      [TERRAIN_TYPES.FERTILE_SOIL]: 0.8,
      [TERRAIN_TYPES.SWAMP]: 2.5,
      [TERRAIN_TYPES.FOREST]: 1.2,
      [TERRAIN_TYPES.MOUNTAINS]: 2.5,
      [TERRAIN_TYPES.PLAINS]: 0.9
    };
    return movementCosts[this.terrainType] || 1;
  }

  /**
   * Calculate if tile is passable based on terrain and obstacles
   */
  calculatePassability() {
    // Water and mountains are generally not passable for most ants
    if (this.terrainType === TERRAIN_TYPES.WATER || 
        this.terrainType === TERRAIN_TYPES.MOUNTAINS) {
      return false;
    }
    
    // Check for blocking obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.type === OBSTACLE_TYPES.ROCK && obstacle.size > 2) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Add a resource to this tile
   */
  addResource(resourceType, amount, quality = 1.0) {
    if (!TILE_RESOURCE_TYPES[resourceType.toUpperCase()]) {
      throw new Error(`Invalid resource type: ${resourceType}`);
    }
    
    const existing = this.resources.get(resourceType);
    if (existing) {
      existing.amount += amount;
      existing.quality = (existing.quality + quality) / 2; // Average quality
      existing.lastUpdated = new Date();
    } else {
      this.resources.set(resourceType, {
        amount: amount,
        quality: quality,
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Remove resource from this tile
   */
  removeResource(resourceType, amount) {
    const resource = this.resources.get(resourceType);
    if (resource) {
      resource.amount = Math.max(0, resource.amount - amount);
      if (resource.amount === 0) {
        this.resources.delete(resourceType);
      }
      return true;
    }
    return false;
  }

  /**
   * Get total resources on this tile
   */
  getTotalResources() {
    let total = 0;
    for (const resource of this.resources.values()) {
      total += resource.amount;
    }
    return total;
  }

  /**
   * Add an obstacle to this tile
   */
  addObstacle(obstacleType, size = 1, durability = 100) {
    if (!OBSTACLE_TYPES[obstacleType.toUpperCase()]) {
      throw new Error(`Invalid obstacle type: ${obstacleType}`);
    }
    
    this.obstacles.push({
      type: obstacleType,
      size: size,
      durability: durability,
      id: `${obstacleType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
    // Recalculate passability
    this.isPassable = this.calculatePassability();
    this.movementCost = this.getBaseMoveoCost() + (this.obstacles.length * 0.2);
  }

  /**
   * Remove an obstacle by ID
   */
  removeObstacle(obstacleId) {
    const index = this.obstacles.findIndex(obs => obs.id === obstacleId);
    if (index !== -1) {
      this.obstacles.splice(index, 1);
      this.isPassable = this.calculatePassability();
      this.movementCost = this.getBaseMoveoCost() + (this.obstacles.length * 0.2);
      return true;
    }
    return false;
  }

  /**
   * Add an entity to this tile
   */
  addEntity(entity) {
    this.entities.add(entity);
  }

  /**
   * Remove an entity from this tile
   */
  removeEntity(entity) {
    return this.entities.delete(entity);
  }

  /**
   * Check if tile has specific entity type
   */
  hasEntityType(entityType) {
    for (const entity of this.entities) {
      if (entity.type === entityType) {
        return true;
      }
    }
    return false;
  }

  /**
   * Mark tile as explored
   */
  explore() {
    this.isExplored = true;
    this.lastVisited = new Date();
  }

  /**
   * Set tile visibility
   */
  setVisible(visible) {
    this.isVisible = visible;
    if (visible) {
      this.explore();
    }
  }

  /**
   * Get terrain-based fertility modifier
   */
  getFertilityModifier() {
    const fertilityModifiers = {
      [TERRAIN_TYPES.GRASS]: 0.8,
      [TERRAIN_TYPES.SAND]: 0.2,
      [TERRAIN_TYPES.WATER]: 0,
      [TERRAIN_TYPES.ROCK]: 0.1,
      [TERRAIN_TYPES.DIRT]: 0.6,
      [TERRAIN_TYPES.FERTILE_SOIL]: 1.0,
      [TERRAIN_TYPES.SWAMP]: 0.7,
      [TERRAIN_TYPES.FOREST]: 0.9,
      [TERRAIN_TYPES.MOUNTAINS]: 0.3,
      [TERRAIN_TYPES.PLAINS]: 0.7
    };
    return fertilityModifiers[this.terrainType] || 0.5;
  }

  /**
   * Calculate natural resource regeneration rate
   */
  getResourceRegenerationRate(resourceType) {
    const baseRate = {
      [TILE_RESOURCE_TYPES.FOOD]: 0.1,
      [TILE_RESOURCE_TYPES.WATER]: 0.05,
      [TILE_RESOURCE_TYPES.WOOD]: 0.02,
      [TILE_RESOURCE_TYPES.STONE]: 0,
      [TILE_RESOURCE_TYPES.MINERALS]: 0,
      [TILE_RESOURCE_TYPES.NECTAR]: 0.15,
      [TILE_RESOURCE_TYPES.SEEDS]: 0.08
    };
    
    const terrainModifier = this.getFertilityModifier();
    const moistureModifier = this.moisture;
    
    return (baseRate[resourceType] || 0) * terrainModifier * (1 + moistureModifier);
  }

  /**
   * Update tile state (resource regeneration, decay, etc.)
   */
  update(deltaTime = 1) {
    // Resource regeneration
    for (const [resourceType, resource] of this.resources) {
      const regenRate = this.getResourceRegenerationRate(resourceType);
      if (regenRate > 0) {
        resource.amount += regenRate * deltaTime;
        resource.amount = Math.min(resource.amount, this.getMaxResourceCapacity(resourceType));
      }
    }
    
    // Quality decay over time
    for (const resource of this.resources.values()) {
      const timeSinceUpdate = Date.now() - resource.lastUpdated;
      const daysSinceUpdate = timeSinceUpdate / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 1) {
        resource.quality = Math.max(0.1, resource.quality - (daysSinceUpdate * 0.01));
      }
    }
  }

  /**
   * Get maximum resource capacity for this tile
   */
  getMaxResourceCapacity(resourceType) {
    const baseCapacity = {
      [TILE_RESOURCE_TYPES.FOOD]: 100,
      [TILE_RESOURCE_TYPES.WATER]: 50,
      [TILE_RESOURCE_TYPES.WOOD]: 200,
      [TILE_RESOURCE_TYPES.STONE]: 500,
      [TILE_RESOURCE_TYPES.MINERALS]: 300,
      [TILE_RESOURCE_TYPES.NECTAR]: 80,
      [TILE_RESOURCE_TYPES.SEEDS]: 60
    };
    
    return (baseCapacity[resourceType] || 50) * (1 + this.fertility);
  }

  /**
   * Convert tile to JSON for serialization
   */
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      terrainType: this.terrainType,
      resources: Object.fromEntries(this.resources),
      obstacles: this.obstacles,
      entities: Array.from(this.entities),
      elevation: this.elevation,
      moisture: this.moisture,
      temperature: this.temperature,
      fertility: this.fertility,
      isExplored: this.isExplored,
      isVisible: this.isVisible,
      lastVisited: this.lastVisited,
      movementCost: this.movementCost,
      isPassable: this.isPassable,
      generationData: this.generationData
    };
  }

  /**
   * Create tile from JSON data
   */
  static fromJSON(data) {
    const tile = new Tile(data.x, data.y, data.terrainType);
    
    // Restore resources
    if (data.resources) {
      for (const [resourceType, resourceData] of Object.entries(data.resources)) {
        tile.resources.set(resourceType, {
          ...resourceData,
          lastUpdated: new Date(resourceData.lastUpdated)
        });
      }
    }
    
    // Restore other properties
    tile.obstacles = data.obstacles || [];
    tile.entities = new Set(data.entities || []);
    tile.elevation = data.elevation || 0;
    tile.moisture = data.moisture || 0;
    tile.temperature = data.temperature || 0;
    tile.fertility = data.fertility || 0;
    tile.isExplored = data.isExplored || false;
    tile.isVisible = data.isVisible || false;
    tile.lastVisited = data.lastVisited ? new Date(data.lastVisited) : null;
    tile.movementCost = data.movementCost || tile.getBaseMoveoCost();
    tile.isPassable = data.isPassable !== undefined ? data.isPassable : tile.calculatePassability();
    tile.generationData = data.generationData || { seed: null, noiseValue: 0, biome: null };
    
    return tile;
  }
}

module.exports = {
  Tile,
  TERRAIN_TYPES,
  TILE_RESOURCE_TYPES,
  OBSTACLE_TYPES
}; 
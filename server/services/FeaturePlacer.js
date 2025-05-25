/**
 * FeaturePlacer class for distributing resources, obstacles, and environmental features
 * Implements algorithms for balanced resource placement and feature distribution
 */

const { TERRAIN_TYPES, TILE_RESOURCE_TYPES, OBSTACLE_TYPES } = require('../models/Tile');

class FeaturePlacer {
  constructor(seed = Date.now(), difficulty = 'medium') {
    this.seed = seed;
    this.difficulty = difficulty;
    this.randomSeed = seed;
    
    this.config = {
      // Resource placement parameters
      resourceDensity: {
        easy: 1.5,
        medium: 1.0,
        hard: 0.7
      },
      
      // Minimum distances between features
      minDistances: {
        enemyColonies: 15,
        largeResources: 5,
        waterBodies: 8
      },
      
      // Resource probability by terrain type
      resourceProbabilities: {
        [TERRAIN_TYPES.GRASS]: {
          [TILE_RESOURCE_TYPES.FOOD]: 0.3,
          [TILE_RESOURCE_TYPES.SEEDS]: 0.2,
          [TILE_RESOURCE_TYPES.WATER]: 0.1
        },
        [TERRAIN_TYPES.FOREST]: {
          [TILE_RESOURCE_TYPES.FOOD]: 0.4,
          [TILE_RESOURCE_TYPES.WOOD]: 0.6,
          [TILE_RESOURCE_TYPES.NECTAR]: 0.3,
          [TILE_RESOURCE_TYPES.SEEDS]: 0.4
        },
        [TERRAIN_TYPES.FERTILE_SOIL]: {
          [TILE_RESOURCE_TYPES.FOOD]: 0.5,
          [TILE_RESOURCE_TYPES.SEEDS]: 0.6,
          [TILE_RESOURCE_TYPES.NECTAR]: 0.2
        },
        [TERRAIN_TYPES.WATER]: {
          [TILE_RESOURCE_TYPES.WATER]: 1.0
        },
        [TERRAIN_TYPES.ROCK]: {
          [TILE_RESOURCE_TYPES.STONE]: 0.7,
          [TILE_RESOURCE_TYPES.MINERALS]: 0.3
        },
        [TERRAIN_TYPES.MOUNTAINS]: {
          [TILE_RESOURCE_TYPES.STONE]: 0.8,
          [TILE_RESOURCE_TYPES.MINERALS]: 0.5
        },
        [TERRAIN_TYPES.SAND]: {
          [TILE_RESOURCE_TYPES.MINERALS]: 0.2
        },
        [TERRAIN_TYPES.SWAMP]: {
          [TILE_RESOURCE_TYPES.WATER]: 0.8,
          [TILE_RESOURCE_TYPES.FOOD]: 0.2
        },
        [TERRAIN_TYPES.PLAINS]: {
          [TILE_RESOURCE_TYPES.FOOD]: 0.25,
          [TILE_RESOURCE_TYPES.SEEDS]: 0.15
        },
        [TERRAIN_TYPES.DIRT]: {
          [TILE_RESOURCE_TYPES.FOOD]: 0.2,
          [TILE_RESOURCE_TYPES.STONE]: 0.1
        }
      },
      
      // Obstacle probabilities by terrain type
      obstacleProbabilities: {
        [TERRAIN_TYPES.FOREST]: {
          [OBSTACLE_TYPES.TREE]: 0.4,
          [OBSTACLE_TYPES.BUSH]: 0.3
        },
        [TERRAIN_TYPES.ROCK]: {
          [OBSTACLE_TYPES.ROCK]: 0.6
        },
        [TERRAIN_TYPES.MOUNTAINS]: {
          [OBSTACLE_TYPES.ROCK]: 0.8
        },
        [TERRAIN_TYPES.GRASS]: {
          [OBSTACLE_TYPES.BUSH]: 0.1,
          [OBSTACLE_TYPES.ROCK]: 0.05
        },
        [TERRAIN_TYPES.PLAINS]: {
          [OBSTACLE_TYPES.BUSH]: 0.08
        },
        [TERRAIN_TYPES.SAND]: {
          [OBSTACLE_TYPES.DEBRIS]: 0.1
        }
      },
      
      // Resource amount ranges
      resourceAmounts: {
        [TILE_RESOURCE_TYPES.FOOD]: { min: 20, max: 80 },
        [TILE_RESOURCE_TYPES.WATER]: { min: 15, max: 60 },
        [TILE_RESOURCE_TYPES.WOOD]: { min: 30, max: 100 },
        [TILE_RESOURCE_TYPES.STONE]: { min: 50, max: 200 },
        [TILE_RESOURCE_TYPES.MINERALS]: { min: 25, max: 150 },
        [TILE_RESOURCE_TYPES.NECTAR]: { min: 10, max: 40 },
        [TILE_RESOURCE_TYPES.SEEDS]: { min: 15, max: 60 }
      }
    };
  }

  /**
   * Seeded random number generator
   */
  seededRandom() {
    const x = Math.sin(this.randomSeed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Get random integer in range using seeded random
   */
  randomInt(min, max) {
    return Math.floor(this.seededRandom() * (max - min + 1)) + min;
  }

  /**
   * Get random float in range using seeded random
   */
  randomFloat(min, max) {
    return this.seededRandom() * (max - min) + min;
  }

  /**
   * Check if position is at minimum distance from existing features
   */
  isValidPlacement(x, y, mapGrid, featureType, existingFeatures = []) {
    const minDistance = this.config.minDistances[featureType] || 0;
    
    for (const feature of existingFeatures) {
      const distance = Math.sqrt((x - feature.x) ** 2 + (y - feature.y) ** 2);
      if (distance < minDistance) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Place food sources with appropriate density based on terrain
   */
  placeFoodSources(mapGrid) {
    const densityMultiplier = this.config.resourceDensity[this.difficulty];
    const placedResources = [];
    
    for (let y = 0; y < mapGrid.height; y++) {
      for (let x = 0; x < mapGrid.width; x++) {
        const tile = mapGrid.getTile(x, y);
        const terrainProbs = this.config.resourceProbabilities[tile.terrainType];
        
        if (!terrainProbs) continue;
        
        // Check each resource type for this terrain
        for (const [resourceType, probability] of Object.entries(terrainProbs)) {
          const adjustedProb = probability * densityMultiplier * tile.fertility;
          
          if (this.seededRandom() < adjustedProb) {
            const amounts = this.config.resourceAmounts[resourceType];
            const amount = this.randomInt(amounts.min, amounts.max);
            const quality = this.randomFloat(0.7, 1.0);
            
            tile.addResource(resourceType, amount, quality);
            placedResources.push({ x, y, type: resourceType, amount });
          }
        }
      }
    }
    
    console.log(`Placed ${placedResources.length} resource deposits`);
    return placedResources;
  }

  /**
   * Place obstacles with configurable density
   */
  placeObstacles(mapGrid) {
    const densityMultiplier = this.config.resourceDensity[this.difficulty];
    const placedObstacles = [];
    
    for (let y = 0; y < mapGrid.height; y++) {
      for (let x = 0; x < mapGrid.width; x++) {
        const tile = mapGrid.getTile(x, y);
        const terrainProbs = this.config.obstacleProbabilities[tile.terrainType];
        
        if (!terrainProbs) continue;
        
        // Check each obstacle type for this terrain
        for (const [obstacleType, probability] of Object.entries(terrainProbs)) {
          if (this.seededRandom() < probability * densityMultiplier) {
            const size = this.randomInt(1, 3);
            const durability = this.randomInt(50, 150);
            
            tile.addObstacle(obstacleType, size, durability);
            placedObstacles.push({ x, y, type: obstacleType, size });
          }
        }
      }
    }
    
    console.log(`Placed ${placedObstacles.length} obstacles`);
    return placedObstacles;
  }

  /**
   * Generate water bodies using flood fill algorithm
   */
  generateWaterBodies(mapGrid, numLakes = null) {
    if (!numLakes) {
      const mapSize = mapGrid.width * mapGrid.height;
      numLakes = Math.floor(mapSize / 2000) + this.randomInt(1, 3);
    }
    
    const waterBodies = [];
    const existingWater = mapGrid.findTilesByTerrain(TERRAIN_TYPES.WATER);
    
    for (let i = 0; i < numLakes; i++) {
      // Find a suitable location for a lake
      let attempts = 0;
      let centerX, centerY;
      
      do {
        centerX = this.randomInt(5, mapGrid.width - 5);
        centerY = this.randomInt(5, mapGrid.height - 5);
        attempts++;
      } while (!this.isValidPlacement(centerX, centerY, mapGrid, 'waterBodies', waterBodies) && attempts < 50);
      
      if (attempts >= 50) continue;
      
      // Create lake using flood fill
      const lakeSize = this.randomInt(3, 8);
      const lake = this.createLake(mapGrid, centerX, centerY, lakeSize);
      
      if (lake.length > 0) {
        waterBodies.push({ x: centerX, y: centerY, size: lake.length });
      }
    }
    
    console.log(`Generated ${waterBodies.length} water bodies`);
    return waterBodies;
  }

  /**
   * Create a lake using flood fill algorithm
   */
  createLake(mapGrid, centerX, centerY, maxSize) {
    const lakeTiles = [];
    const queue = [{ x: centerX, y: centerY }];
    const visited = new Set();
    
    while (queue.length > 0 && lakeTiles.length < maxSize) {
      const { x, y } = queue.shift();
      const key = `${x},${y}`;
      
      if (visited.has(key) || !mapGrid.isValidCoordinate(x, y)) {
        continue;
      }
      
      visited.add(key);
      const tile = mapGrid.getTile(x, y);
      
      // Convert tile to water if it's not already water or mountains
      if (tile.terrainType !== TERRAIN_TYPES.WATER && 
          tile.terrainType !== TERRAIN_TYPES.MOUNTAINS) {
        
        tile.terrainType = TERRAIN_TYPES.WATER;
        tile.addResource(TILE_RESOURCE_TYPES.WATER, 100, 1.0);
        lakeTiles.push({ x, y });
        
        // Add neighbors to queue with probability
        const neighbors = [
          { x: x + 1, y }, { x: x - 1, y },
          { x, y: y + 1 }, { x, y: y - 1 }
        ];
        
        for (const neighbor of neighbors) {
          if (!visited.has(`${neighbor.x},${neighbor.y}`) && 
              this.seededRandom() < 0.6) {
            queue.push(neighbor);
          }
        }
      }
    }
    
    return lakeTiles;
  }

  /**
   * Generate rivers connecting water bodies
   */
  generateRivers(mapGrid, waterBodies) {
    const rivers = [];
    
    for (let i = 0; i < waterBodies.length - 1; i++) {
      const start = waterBodies[i];
      const end = waterBodies[i + 1];
      
      // Create river path
      const riverPath = this.createRiverPath(mapGrid, start.x, start.y, end.x, end.y);
      if (riverPath.length > 0) {
        rivers.push(riverPath);
      }
    }
    
    console.log(`Generated ${rivers.length} rivers`);
    return rivers;
  }

  /**
   * Create a river path between two points
   */
  createRiverPath(mapGrid, startX, startY, endX, endY) {
    const path = [];
    let currentX = startX;
    let currentY = startY;
    
    while (currentX !== endX || currentY !== endY) {
      // Move towards target with some randomness
      const deltaX = endX - currentX;
      const deltaY = endY - currentY;
      
      let moveX = 0;
      let moveY = 0;
      
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        moveX = deltaX > 0 ? 1 : -1;
        if (this.seededRandom() < 0.3) {
          moveY = deltaY > 0 ? 1 : (deltaY < 0 ? -1 : 0);
        }
      } else {
        moveY = deltaY > 0 ? 1 : -1;
        if (this.seededRandom() < 0.3) {
          moveX = deltaX > 0 ? 1 : (deltaX < 0 ? -1 : 0);
        }
      }
      
      currentX += moveX;
      currentY += moveY;
      
      if (mapGrid.isValidCoordinate(currentX, currentY)) {
        const tile = mapGrid.getTile(currentX, currentY);
        if (tile.terrainType !== TERRAIN_TYPES.MOUNTAINS) {
          tile.terrainType = TERRAIN_TYPES.WATER;
          tile.addResource(TILE_RESOURCE_TYPES.WATER, 50, 0.9);
          path.push({ x: currentX, y: currentY });
        }
      }
      
      // Prevent infinite loops
      if (path.length > mapGrid.width + mapGrid.height) {
        break;
      }
    }
    
    return path;
  }

  /**
   * Place enemy colonies at strategic locations
   */
  placeEnemyColonies(mapGrid, playerStartX, playerStartY, numEnemies = null) {
    if (!numEnemies) {
      const difficultySettings = { easy: 1, medium: 2, hard: 3 };
      numEnemies = difficultySettings[this.difficulty] || 2;
    }
    
    const enemyColonies = [];
    const attempts = numEnemies * 10; // Max attempts
    
    for (let i = 0; i < attempts && enemyColonies.length < numEnemies; i++) {
      const x = this.randomInt(0, mapGrid.width - 1);
      const y = this.randomInt(0, mapGrid.height - 1);
      
      // Check distance from player start
      const distanceFromPlayer = Math.sqrt((x - playerStartX) ** 2 + (y - playerStartY) ** 2);
      if (distanceFromPlayer < this.config.minDistances.enemyColonies) {
        continue;
      }
      
      // Check distance from other enemy colonies
      if (!this.isValidPlacement(x, y, mapGrid, 'enemyColonies', enemyColonies)) {
        continue;
      }
      
      const tile = mapGrid.getTile(x, y);
      
      // Ensure tile is suitable for a colony
      if (tile.isPassable && tile.terrainType !== TERRAIN_TYPES.WATER) {
        enemyColonies.push({ x, y, type: 'enemy_colony' });
        
        // Mark the tile
        tile.addEntity({ type: 'enemy_colony', id: `enemy_${enemyColonies.length}` });
      }
    }
    
    console.log(`Placed ${enemyColonies.length} enemy colonies`);
    return enemyColonies;
  }

  /**
   * Balance resource distribution across the map
   */
  balanceResources(mapGrid) {
    const stats = mapGrid.getStatistics();
    const resourceDistribution = stats.resourceDistribution;
    
    // Calculate target distribution based on map size
    const totalTiles = mapGrid.width * mapGrid.height;
    const targetResourceTiles = Math.floor(totalTiles * 0.15); // 15% of tiles should have resources
    
    // Add resources to sparse areas
    for (const [resourceType, data] of Object.entries(resourceDistribution)) {
      const currentTiles = data.tiles;
      const target = Math.floor(targetResourceTiles * 0.1); // 10% of resource tiles per type
      
      if (currentTiles < target) {
        this.addResourcesInSparseAreas(mapGrid, resourceType, target - currentTiles);
      }
    }
    
    console.log('Resource balancing completed');
  }

  /**
   * Add resources in areas that are sparse
   */
  addResourcesInSparseAreas(mapGrid, resourceType, numToAdd) {
    const candidates = [];
    
    // Find suitable tiles for this resource type
    for (let y = 0; y < mapGrid.height; y++) {
      for (let x = 0; x < mapGrid.width; x++) {
        const tile = mapGrid.getTile(x, y);
        const terrainProbs = this.config.resourceProbabilities[tile.terrainType];
        
        if (terrainProbs && terrainProbs[resourceType] && !tile.resources.has(resourceType)) {
          candidates.push({ x, y, tile });
        }
      }
    }
    
    // Randomly select tiles to add resources
    for (let i = 0; i < Math.min(numToAdd, candidates.length); i++) {
      const candidate = candidates[this.randomInt(0, candidates.length - 1)];
      const amounts = this.config.resourceAmounts[resourceType];
      const amount = this.randomInt(amounts.min, amounts.max);
      const quality = this.randomFloat(0.6, 0.9);
      
      candidate.tile.addResource(resourceType, amount, quality);
    }
  }

  /**
   * Prevent feature overlap and maintain playability
   */
  validatePlacement(mapGrid) {
    const issues = [];
    
    // Ensure player spawn area is clear
    const centerX = Math.floor(mapGrid.width / 2);
    const centerY = Math.floor(mapGrid.height / 2);
    const spawnRadius = 3;
    
    for (let dy = -spawnRadius; dy <= spawnRadius; dy++) {
      for (let dx = -spawnRadius; dx <= spawnRadius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (mapGrid.isValidCoordinate(x, y)) {
          const tile = mapGrid.getTile(x, y);
          
          if (!tile.isPassable) {
            tile.terrainType = TERRAIN_TYPES.GRASS;
            tile.obstacles = [];
            tile.isPassable = true;
            tile.movementCost = 1;
            issues.push(`Cleared spawn area at (${x}, ${y})`);
          }
        }
      }
    }
    
    // Ensure there are pathways between major features
    this.ensureConnectivity(mapGrid);
    
    if (issues.length > 0) {
      console.log(`Fixed ${issues.length} placement issues`);
    }
    
    return issues;
  }

  /**
   * Ensure map connectivity by creating pathways
   */
  ensureConnectivity(mapGrid) {
    const centerX = Math.floor(mapGrid.width / 2);
    const centerY = Math.floor(mapGrid.height / 2);
    
    // Create pathways to map edges
    const pathways = [
      { startX: centerX, startY: centerY, endX: 0, endY: centerY }, // West
      { startX: centerX, startY: centerY, endX: mapGrid.width - 1, endY: centerY }, // East
      { startX: centerX, startY: centerY, endX: centerX, endY: 0 }, // North
      { startX: centerX, startY: centerY, endX: centerX, endY: mapGrid.height - 1 } // South
    ];
    
    for (const pathway of pathways) {
      this.createPathway(mapGrid, pathway.startX, pathway.startY, pathway.endX, pathway.endY);
    }
  }

  /**
   * Create a clear pathway between two points
   */
  createPathway(mapGrid, startX, startY, endX, endY) {
    const path = mapGrid.findPath(startX, startY, endX, endY);
    
    if (!path) {
      // Force create pathway if no path exists
      let currentX = startX;
      let currentY = startY;
      
      while (currentX !== endX || currentY !== endY) {
        const deltaX = endX - currentX;
        const deltaY = endY - currentY;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          currentX += deltaX > 0 ? 1 : -1;
        } else {
          currentY += deltaY > 0 ? 1 : -1;
        }
        
        if (mapGrid.isValidCoordinate(currentX, currentY)) {
          const tile = mapGrid.getTile(currentX, currentY);
          if (!tile.isPassable) {
            if (tile.terrainType !== TERRAIN_TYPES.WATER) {
              tile.terrainType = TERRAIN_TYPES.DIRT;
            }
            tile.obstacles = [];
            tile.isPassable = true;
            tile.movementCost = tile.getBaseMoveoCost();
          }
        }
      }
    }
  }

  /**
   * Place all features on the map
   */
  placeAllFeatures(mapGrid, playerStartX = null, playerStartY = null) {
    console.log('Starting feature placement...');
    
    // Set default player start position if not provided
    if (playerStartX === null || playerStartY === null) {
      playerStartX = Math.floor(mapGrid.width / 2);
      playerStartY = Math.floor(mapGrid.height / 2);
    }
    
    // Place features in order
    const placedResources = this.placeFoodSources(mapGrid);
    const placedObstacles = this.placeObstacles(mapGrid);
    const waterBodies = this.generateWaterBodies(mapGrid);
    const rivers = this.generateRivers(mapGrid, waterBodies);
    const enemyColonies = this.placeEnemyColonies(mapGrid, playerStartX, playerStartY);
    
    // Balance and validate
    this.balanceResources(mapGrid);
    const issues = this.validatePlacement(mapGrid);
    
    const summary = {
      resources: placedResources.length,
      obstacles: placedObstacles.length,
      waterBodies: waterBodies.length,
      rivers: rivers.length,
      enemyColonies: enemyColonies.length,
      issues: issues.length
    };
    
    console.log('Feature placement completed:', summary);
    return summary;
  }
}

module.exports = { FeaturePlacer }; 
/**
 * TerrainGenerator class for generating natural-looking terrain using Perlin noise
 * Maps noise values to different terrain types with configurable parameters
 */

const { createNoise2D, createNoise3D } = require('simplex-noise');
const { TERRAIN_TYPES } = require('../models/Tile');

class TerrainGenerator {
  constructor(seed = Date.now()) {
    this.seed = seed;
    this.config = {
      // Primary terrain noise parameters
      scale: 0.1,           // Overall noise scale (smaller = more zoomed in)
      octaves: 4,           // Number of noise layers
      persistence: 0.5,     // How much each octave contributes
      lacunarity: 2.0,      // Frequency multiplier between octaves
      
      // Moisture and temperature noise parameters
      moistureScale: 0.08,
      temperatureScale: 0.12,
      elevationScale: 0.15,
      
      // Terrain thresholds for noise value mapping
      terrainThresholds: {
        [TERRAIN_TYPES.WATER]: -0.5,         // Very low values
        [TERRAIN_TYPES.SWAMP]: -0.3,         // Low values
        [TERRAIN_TYPES.SAND]: -0.1,          // Below sea level
        [TERRAIN_TYPES.PLAINS]: 0.1,         // Low elevation
        [TERRAIN_TYPES.GRASS]: 0.3,          // Medium elevation
        [TERRAIN_TYPES.FERTILE_SOIL]: 0.4,   // Medium-high elevation
        [TERRAIN_TYPES.FOREST]: 0.5,         // High moisture + medium elevation
        [TERRAIN_TYPES.DIRT]: 0.6,           // High elevation
        [TERRAIN_TYPES.ROCK]: 0.75,          // Very high elevation
        [TERRAIN_TYPES.MOUNTAINS]: 0.85      // Extreme elevation
      },
      
      // Biome parameters
      temperatureRange: { min: -1, max: 1 },
      moistureRange: { min: 0, max: 1 },
      elevationRange: { min: -1, max: 1 }
    };
    
    // Initialize noise functions with seed
    this.elevationNoise = createNoise2D(() => this.seededRandom());
    this.moistureNoise = createNoise2D(() => this.seededRandom());
    this.temperatureNoise = createNoise2D(() => this.seededRandom());
    this.detailNoise = createNoise2D(() => this.seededRandom());
    
    // Reset random seed for consistent generation
    this.randomSeed = seed;
  }

  /**
   * Seeded random number generator
   */
  seededRandom() {
    const x = Math.sin(this.randomSeed++) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generate octave noise (fractal noise)
   */
  generateOctaveNoise(noiseFunc, x, y, scale, octaves, persistence, lacunarity) {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += noiseFunc(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue; // Normalize to [-1, 1]
  }

  /**
   * Generate elevation value for a given coordinate
   */
  getElevation(x, y) {
    return this.generateOctaveNoise(
      this.elevationNoise,
      x, y,
      this.config.elevationScale,
      this.config.octaves,
      this.config.persistence,
      this.config.lacunarity
    );
  }

  /**
   * Generate moisture value for a given coordinate
   */
  getMoisture(x, y) {
    const moisture = this.generateOctaveNoise(
      this.moistureNoise,
      x, y,
      this.config.moistureScale,
      this.config.octaves - 1,
      this.config.persistence,
      this.config.lacunarity
    );
    
    // Normalize to [0, 1]
    return (moisture + 1) * 0.5;
  }

  /**
   * Generate temperature value for a given coordinate
   */
  getTemperature(x, y) {
    return this.generateOctaveNoise(
      this.temperatureNoise,
      x, y,
      this.config.temperatureScale,
      this.config.octaves - 2,
      this.config.persistence,
      this.config.lacunarity
    );
  }

  /**
   * Get detail noise for small-scale terrain variation
   */
  getDetailNoise(x, y) {
    return this.generateOctaveNoise(
      this.detailNoise,
      x, y,
      this.config.scale * 3,
      2,
      0.3,
      2.5
    );
  }

  /**
   * Determine terrain type based on elevation, moisture, and temperature
   */
  getTerrainType(x, y) {
    const elevation = this.getElevation(x, y);
    const moisture = this.getMoisture(x, y);
    const temperature = this.getTemperature(x, y);
    const detail = this.getDetailNoise(x, y);
    
    // Combine factors for final terrain determination
    const combinedValue = elevation + (detail * 0.1);
    
    // Water bodies (very low elevation)
    if (combinedValue < this.config.terrainThresholds[TERRAIN_TYPES.WATER]) {
      return TERRAIN_TYPES.WATER;
    }
    
    // Swamps (low elevation + high moisture)
    if (combinedValue < this.config.terrainThresholds[TERRAIN_TYPES.SWAMP] && moisture > 0.7) {
      return TERRAIN_TYPES.SWAMP;
    }
    
    // Sand/desert (low elevation or high temperature + low moisture)
    if ((combinedValue < this.config.terrainThresholds[TERRAIN_TYPES.SAND]) ||
        (temperature > 0.5 && moisture < 0.3)) {
      return TERRAIN_TYPES.SAND;
    }
    
    // Mountains (very high elevation)
    if (combinedValue > this.config.terrainThresholds[TERRAIN_TYPES.MOUNTAINS]) {
      return TERRAIN_TYPES.MOUNTAINS;
    }
    
    // Rock (high elevation)
    if (combinedValue > this.config.terrainThresholds[TERRAIN_TYPES.ROCK]) {
      return TERRAIN_TYPES.ROCK;
    }
    
    // Forest (medium-high elevation + high moisture)
    if (combinedValue > this.config.terrainThresholds[TERRAIN_TYPES.FOREST] && 
        moisture > 0.6 && temperature > -0.3) {
      return TERRAIN_TYPES.FOREST;
    }
    
    // Fertile soil (good conditions for growth)
    if (combinedValue > this.config.terrainThresholds[TERRAIN_TYPES.FERTILE_SOIL] && 
        moisture > 0.4 && moisture < 0.8 && 
        temperature > -0.2 && temperature < 0.6) {
      return TERRAIN_TYPES.FERTILE_SOIL;
    }
    
    // Dirt (medium elevation, moderate conditions)
    if (combinedValue > this.config.terrainThresholds[TERRAIN_TYPES.DIRT]) {
      return TERRAIN_TYPES.DIRT;
    }
    
    // Grass (medium elevation)
    if (combinedValue > this.config.terrainThresholds[TERRAIN_TYPES.GRASS]) {
      return TERRAIN_TYPES.GRASS;
    }
    
    // Plains (low-medium elevation)
    if (combinedValue > this.config.terrainThresholds[TERRAIN_TYPES.PLAINS]) {
      return TERRAIN_TYPES.PLAINS;
    }
    
    // Default to grass
    return TERRAIN_TYPES.GRASS;
  }

  /**
   * Get biome information for a coordinate
   */
  getBiome(x, y) {
    const elevation = this.getElevation(x, y);
    const moisture = this.getMoisture(x, y);
    const temperature = this.getTemperature(x, y);
    
    let biome = 'temperate';
    
    if (temperature < -0.5) {
      biome = 'arctic';
    } else if (temperature > 0.5) {
      if (moisture < 0.3) {
        biome = 'desert';
      } else {
        biome = 'tropical';
      }
    } else if (moisture > 0.7) {
      biome = 'wetland';
    } else if (elevation > 0.6) {
      biome = 'highland';
    }
    
    return biome;
  }

  /**
   * Apply terrain smoothing to reduce harsh boundaries
   */
  smoothTerrain(mapGrid, iterations = 1) {
    for (let iter = 0; iter < iterations; iter++) {
      const changes = [];
      
      for (let y = 1; y < mapGrid.height - 1; y++) {
        for (let x = 1; x < mapGrid.width - 1; x++) {
          const currentTile = mapGrid.getTile(x, y);
          const neighbors = mapGrid.getNeighbors(x, y);
          
          // Count terrain types in neighborhood
          const terrainCounts = {};
          for (const neighbor of neighbors) {
            if (neighbor) {
              terrainCounts[neighbor.terrainType] = 
                (terrainCounts[neighbor.terrainType] || 0) + 1;
            }
          }
          
          // Find most common terrain type
          let maxCount = 0;
          let dominantTerrain = currentTile.terrainType;
          for (const [terrain, count] of Object.entries(terrainCounts)) {
            if (count > maxCount) {
              maxCount = count;
              dominantTerrain = terrain;
            }
          }
          
          // Apply smoothing if dominant terrain is significantly more common
          if (maxCount >= 5 && dominantTerrain !== currentTile.terrainType) {
            // Don't smooth water into land or vice versa too aggressively
            const currentIsWater = currentTile.terrainType === TERRAIN_TYPES.WATER;
            const dominantIsWater = dominantTerrain === TERRAIN_TYPES.WATER;
            
            if (currentIsWater === dominantIsWater || maxCount >= 6) {
              changes.push({ x, y, terrain: dominantTerrain });
            }
          }
        }
      }
      
      // Apply changes
      for (const change of changes) {
        const tile = mapGrid.getTile(change.x, change.y);
        tile.terrainType = change.terrain;
      }
    }
  }

  /**
   * Generate terrain for an entire map grid
   */
  generateTerrain(mapGrid) {
    console.log(`Generating terrain with seed: ${this.seed}`);
    
    for (let y = 0; y < mapGrid.height; y++) {
      for (let x = 0; x < mapGrid.width; x++) {
        const tile = mapGrid.getTile(x, y);
        
        // Generate terrain type
        tile.terrainType = this.getTerrainType(x, y);
        
        // Set environmental properties
        tile.elevation = this.getElevation(x, y);
        tile.moisture = this.getMoisture(x, y);
        tile.temperature = this.getTemperature(x, y);
        tile.fertility = this.calculateFertility(tile.moisture, tile.temperature, tile.elevation);
        
        // Store generation data
        tile.generationData.seed = this.seed;
        tile.generationData.noiseValue = tile.elevation;
        tile.generationData.biome = this.getBiome(x, y);
        
        // Recalculate movement properties
        tile.movementCost = tile.getBaseMoveoCost();
        tile.isPassable = tile.calculatePassability();
      }
    }
    
    // Apply smoothing
    this.smoothTerrain(mapGrid, 2);
    
    // Update map metadata
    mapGrid.metadata.seed = this.seed;
    mapGrid.metadata.lastModified = new Date();
    
    console.log('Terrain generation completed');
  }

  /**
   * Calculate fertility based on environmental factors
   */
  calculateFertility(moisture, temperature, elevation) {
    // Optimal conditions for fertility
    const optimalMoisture = 0.6;
    const optimalTemperature = 0.2;
    const optimalElevation = 0.2;
    
    // Calculate distance from optimal conditions
    const moistureFactor = 1 - Math.abs(moisture - optimalMoisture) / optimalMoisture;
    const temperatureFactor = 1 - Math.abs(temperature - optimalTemperature) / (optimalTemperature + 0.5);
    const elevationFactor = 1 - Math.abs(elevation - optimalElevation) / (optimalElevation + 0.5);
    
    // Combine factors (weighted average)
    const fertility = (moistureFactor * 0.4 + temperatureFactor * 0.3 + elevationFactor * 0.3);
    
    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, fertility));
  }

  /**
   * Get terrain distribution statistics
   */
  getTerrainDistribution(mapGrid) {
    const distribution = {};
    const total = mapGrid.width * mapGrid.height;
    
    for (let y = 0; y < mapGrid.height; y++) {
      for (let x = 0; x < mapGrid.width; x++) {
        const terrain = mapGrid.getTile(x, y).terrainType;
        distribution[terrain] = (distribution[terrain] || 0) + 1;
      }
    }
    
    // Convert to percentages
    for (const terrain in distribution) {
      distribution[terrain] = {
        count: distribution[terrain],
        percentage: (distribution[terrain] / total * 100).toFixed(1)
      };
    }
    
    return distribution;
  }

  /**
   * Update configuration parameters
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Create a visualization helper for debugging
   */
  createVisualization(mapGrid) {
    const visualization = {
      ascii: '',
      colorMap: {},
      legend: {}
    };
    
    // Define ASCII characters for each terrain type
    const terrainChars = {
      [TERRAIN_TYPES.WATER]: '~',
      [TERRAIN_TYPES.SAND]: '.',
      [TERRAIN_TYPES.GRASS]: '"',
      [TERRAIN_TYPES.FOREST]: 'T',
      [TERRAIN_TYPES.MOUNTAINS]: '^',
      [TERRAIN_TYPES.ROCK]: '#',
      [TERRAIN_TYPES.SWAMP]: '&',
      [TERRAIN_TYPES.PLAINS]: '-',
      [TERRAIN_TYPES.DIRT]: ':',
      [TERRAIN_TYPES.FERTILE_SOIL]: '*'
    };
    
    // Generate ASCII map
    for (let y = 0; y < mapGrid.height; y++) {
      for (let x = 0; x < mapGrid.width; x++) {
        const terrain = mapGrid.getTile(x, y).terrainType;
        visualization.ascii += terrainChars[terrain] || '?';
      }
      visualization.ascii += '\n';
    }
    
    visualization.legend = terrainChars;
    return visualization;
  }
}

module.exports = { TerrainGenerator }; 
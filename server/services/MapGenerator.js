/**
 * MapGenerator class that orchestrates the entire map generation process
 * Provides seed-based generation for reproducible maps
 */

const { MapGrid } = require('../models/MapGrid');
const { TerrainGenerator } = require('./TerrainGenerator');
const { FeaturePlacer } = require('./FeaturePlacer');
const { TERRAIN_TYPES } = require('../models/Tile');

class SeededRandom {
  constructor(seed) {
    this.seed = seed;
    this.current = seed;
  }

  next() {
    const x = Math.sin(this.current++) * 10000;
    return x - Math.floor(x);
  }

  integer(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min, max) {
    return this.next() * (max - min) + min;
  }

  boolean(probability = 0.5) {
    return this.next() < probability;
  }
}

class MapGenerator {
  constructor() {
    this.config = {
      // Default map generation parameters
      defaultMapSize: { width: 100, height: 100 },
      minMapSize: { width: 20, height: 20 },
      maxMapSize: { width: 500, height: 500 },
      
      // Generation phases
      phases: [
        'initialization',
        'terrain_generation', 
        'feature_placement',
        'validation',
        'finalization'
      ],
      
      // Difficulty presets
      difficultyPresets: {
        easy: {
          resourceDensity: 1.5,
          enemyColonies: 1,
          obstaclesDensity: 0.7,
          mapComplexity: 0.8
        },
        medium: {
          resourceDensity: 1.0,
          enemyColonies: 2,
          obstaclesDensity: 1.0,
          mapComplexity: 1.0
        },
        hard: {
          resourceDensity: 0.7,
          enemyColonies: 3,
          obstaclesDensity: 1.3,
          mapComplexity: 1.2
        }
      }
    };
  }

  /**
   * Validate and normalize seed input
   */
  normalizeSeed(seed) {
    if (seed === null || seed === undefined) {
      return Date.now();
    }
    
    if (typeof seed === 'string') {
      // Convert string to number using hash
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    }
    
    if (typeof seed === 'number') {
      return Math.abs(Math.floor(seed));
    }
    
    // Default fallback
    return Date.now();
  }

  /**
   * Validate map dimensions
   */
  validateDimensions(width, height) {
    const errors = [];
    
    if (width < this.config.minMapSize.width || width > this.config.maxMapSize.width) {
      errors.push(`Width must be between ${this.config.minMapSize.width} and ${this.config.maxMapSize.width}`);
    }
    
    if (height < this.config.minMapSize.height || height > this.config.maxMapSize.height) {
      errors.push(`Height must be between ${this.config.minMapSize.height} and ${this.config.maxMapSize.height}`);
    }
    
    if (errors.length > 0) {
      throw new Error(`Invalid map dimensions: ${errors.join(', ')}`);
    }
    
    return { width, height };
  }

  /**
   * Generate a complete map with the given parameters
   */
  async generateMap(options = {}) {
    const startTime = Date.now();
    
    // Parse and validate options
    const {
      seed = Date.now(),
      width = this.config.defaultMapSize.width,
      height = this.config.defaultMapSize.height,
      difficulty = 'medium',
      playerStartX = Math.floor(width / 2),
      playerStartY = Math.floor(height / 2),
      customConfig = {},
      onProgress = null
    } = options;
    
    console.log('Starting map generation with options:', {
      seed, width, height, difficulty, playerStart: { x: playerStartX, y: playerStartY }
    });
    
    try {
      // Validate inputs
      const normalizedSeed = this.normalizeSeed(seed);
      const dimensions = this.validateDimensions(width, height);
      
      // Initialize progress tracking
      const progress = {
        phase: 'initialization',
        progress: 0,
        totalPhases: this.config.phases.length,
        currentPhase: 0,
        startTime,
        estimatedTime: null
      };
      
      if (onProgress) onProgress(progress);
      
      // Phase 1: Initialize map grid
      progress.phase = 'initialization';
      progress.currentPhase = 1;
      progress.progress = 20;
      if (onProgress) onProgress(progress);
      
      const mapGrid = new MapGrid(dimensions.width, dimensions.height);
      mapGrid.metadata.seed = normalizedSeed;
      mapGrid.metadata.difficulty = difficulty;
      mapGrid.metadata.generationStart = new Date();
      
      // Phase 2: Generate terrain
      progress.phase = 'terrain_generation';
      progress.currentPhase = 2;
      progress.progress = 40;
      if (onProgress) onProgress(progress);
      
      const terrainGenerator = new TerrainGenerator(normalizedSeed);
      
      // Apply custom terrain configuration
      if (customConfig.terrain) {
        terrainGenerator.updateConfig(customConfig.terrain);
      }
      
      terrainGenerator.generateTerrain(mapGrid);
      
      // Phase 3: Place features
      progress.phase = 'feature_placement';
      progress.currentPhase = 3;
      progress.progress = 70;
      if (onProgress) onProgress(progress);
      
      const featurePlacer = new FeaturePlacer(normalizedSeed, difficulty);
      const featureSummary = featurePlacer.placeAllFeatures(mapGrid, playerStartX, playerStartY);
      
      // Phase 4: Validation
      progress.phase = 'validation';
      progress.currentPhase = 4;
      progress.progress = 90;
      if (onProgress) onProgress(progress);
      
      const validationResults = this.validateGeneratedMap(mapGrid, playerStartX, playerStartY);
      
      // Phase 5: Finalization
      progress.phase = 'finalization';
      progress.currentPhase = 5;
      progress.progress = 100;
      if (onProgress) onProgress(progress);
      
      const endTime = Date.now();
      const generationTime = endTime - startTime;
      
      // Finalize metadata
      mapGrid.metadata.generationEnd = new Date();
      mapGrid.metadata.generationTime = generationTime;
      mapGrid.metadata.featureSummary = featureSummary;
      mapGrid.metadata.validationResults = validationResults;
      mapGrid.metadata.playerStart = { x: playerStartX, y: playerStartY };
      
      const result = {
        mapGrid,
        seed: normalizedSeed,
        generationTime,
        statistics: mapGrid.getStatistics(),
        featureSummary,
        validationResults,
        metadata: mapGrid.metadata
      };
      
      console.log(`Map generation completed in ${generationTime}ms`);
      console.log('Generation statistics:', result.statistics);
      
      return result;
      
    } catch (error) {
      console.error('Map generation failed:', error);
      throw new Error(`Map generation failed: ${error.message}`);
    }
  }

  /**
   * Validate the generated map for playability
   */
  validateGeneratedMap(mapGrid, playerStartX, playerStartY) {
    const issues = [];
    const warnings = [];
    
    // Check player spawn area
    const spawnTile = mapGrid.getTile(playerStartX, playerStartY);
    if (!spawnTile.isPassable) {
      issues.push('Player spawn location is not passable');
    }
    
    // Check map connectivity
    const passableTiles = mapGrid.findPassableTiles();
    if (passableTiles.length < mapGrid.width * mapGrid.height * 0.5) {
      warnings.push('Less than 50% of map is passable');
    }
    
    // Check resource distribution
    const stats = mapGrid.getStatistics();
    const resourceTiles = stats.tilesWithResources;
    const totalTiles = stats.totalTiles;
    const resourceRatio = resourceTiles / totalTiles;
    
    if (resourceRatio < 0.1) {
      warnings.push('Very low resource density detected');
    } else if (resourceRatio > 0.4) {
      warnings.push('Very high resource density detected');
    }
    
    // Check for isolated areas
    const reachableTiles = this.findReachableTiles(mapGrid, playerStartX, playerStartY);
    const reachabilityRatio = reachableTiles.size / passableTiles.length;
    
    if (reachabilityRatio < 0.8) {
      warnings.push('Some areas may be unreachable from player start');
    }
    
    // Check terrain distribution
    const terrainDist = stats.terrainDistribution;
    const waterRatio = (terrainDist[TERRAIN_TYPES.WATER]?.count || 0) / totalTiles;
    
    if (waterRatio > 0.6) {
      warnings.push('Map may have too much water');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      reachabilityRatio,
      resourceRatio,
      waterRatio
    };
  }

  /**
   * Find all tiles reachable from a starting position
   */
  findReachableTiles(mapGrid, startX, startY) {
    const reachable = new Set();
    const queue = [{ x: startX, y: startY }];
    
    while (queue.length > 0) {
      const { x, y } = queue.shift();
      const key = `${x},${y}`;
      
      if (reachable.has(key) || !mapGrid.isValidCoordinate(x, y)) {
        continue;
      }
      
      const tile = mapGrid.getTile(x, y);
      if (!tile.isPassable) {
        continue;
      }
      
      reachable.add(key);
      
      // Add neighbors to queue
      const neighbors = mapGrid.getCardinalNeighbors(x, y);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!reachable.has(neighborKey)) {
          queue.push({ x: neighbor.x, y: neighbor.y });
        }
      }
    }
    
    return reachable;
  }

  /**
   * Extract seed from existing map
   */
  extractSeed(mapGrid) {
    return mapGrid.metadata.seed || null;
  }

  /**
   * Generate multiple map variations with the same base seed
   */
  async generateVariations(baseSeed, count = 3, options = {}) {
    const variations = [];
    const normalizedBaseSeed = this.normalizeSeed(baseSeed);
    
    for (let i = 0; i < count; i++) {
      const variationSeed = normalizedBaseSeed + i * 1000;
      
      try {
        const result = await this.generateMap({
          ...options,
          seed: variationSeed
        });
        
        variations.push({
          variation: i + 1,
          seed: variationSeed,
          ...result
        });
      } catch (error) {
        console.error(`Failed to generate variation ${i + 1}:`, error);
      }
    }
    
    return variations;
  }

  /**
   * Create a quick preview of a map (reduced detail for fast generation)
   */
  async generatePreview(seed, width = 50, height = 50) {
    const previewOptions = {
      seed,
      width,
      height,
      difficulty: 'medium',
      customConfig: {
        terrain: {
          octaves: 2, // Reduced detail
          scale: 0.15
        }
      }
    };
    
    const result = await this.generateMap(previewOptions);
    
    // Create ASCII visualization for preview
    const terrainGen = new TerrainGenerator(this.normalizeSeed(seed));
    const visualization = terrainGen.createVisualization(result.mapGrid);
    
    return {
      ...result,
      visualization,
      isPreview: true
    };
  }

  /**
   * Get recommended map size based on difficulty and player count
   */
  getRecommendedMapSize(difficulty = 'medium', playerCount = 1) {
    const baseSize = {
      easy: { width: 80, height: 80 },
      medium: { width: 100, height: 100 },
      hard: { width: 120, height: 120 }
    };
    
    const difficultySize = baseSize[difficulty] || baseSize.medium;
    
    // Scale based on player count
    const scaleFactor = Math.sqrt(playerCount);
    
    return {
      width: Math.floor(difficultySize.width * scaleFactor),
      height: Math.floor(difficultySize.height * scaleFactor)
    };
  }

  /**
   * Generate a random seed string for sharing
   */
  generateSeedString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Estimate generation time based on map parameters
   */
  estimateGenerationTime(width, height, difficulty = 'medium') {
    const totalTiles = width * height;
    
    // Base time estimation (in milliseconds)
    const baseTimePerTile = 0.1;
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.3
    };
    
    const multiplier = difficultyMultiplier[difficulty] || 1.0;
    const estimatedTime = totalTiles * baseTimePerTile * multiplier;
    
    return Math.max(1000, Math.floor(estimatedTime)); // Minimum 1 second
  }

  /**
   * Create a map from existing data (deserialization)
   */
  createMapFromData(mapData) {
    try {
      const mapGrid = MapGrid.fromJSON(mapData);
      
      return {
        mapGrid,
        seed: mapGrid.metadata.seed,
        statistics: mapGrid.getStatistics(),
        metadata: mapGrid.metadata
      };
    } catch (error) {
      throw new Error(`Failed to create map from data: ${error.message}`);
    }
  }

  /**
   * Clone an existing map with a new seed
   */
  async cloneMapWithNewSeed(originalMap, newSeed) {
    const originalMetadata = originalMap.metadata;
    
    const options = {
      seed: newSeed,
      width: originalMap.width,
      height: originalMap.height,
      difficulty: originalMetadata.difficulty || 'medium',
      playerStartX: originalMetadata.playerStart?.x || Math.floor(originalMap.width / 2),
      playerStartY: originalMetadata.playerStart?.y || Math.floor(originalMap.height / 2)
    };
    
    return await this.generateMap(options);
  }
}

module.exports = { MapGenerator, SeededRandom }; 
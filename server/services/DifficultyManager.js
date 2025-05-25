/**
 * DifficultyManager class for managing difficulty scaling and performance optimization
 * Provides presets and progressive scaling for campaign mode
 */

class DifficultyManager {
  constructor() {
    this.presets = {
      EASY: {
        name: 'Easy',
        description: 'Relaxed gameplay with abundant resources',
        settings: {
          // Resource settings
          resourceDensity: 1.8,
          resourceQuality: 1.2,
          resourceRegenRate: 1.5,
          
          // Enemy settings
          enemyColonies: 1,
          enemyAggression: 0.5,
          enemyGrowthRate: 0.7,
          
          // Environment settings
          obstaclesDensity: 0.6,
          environmentalHazards: 0.3,
          weatherSeverity: 0.4,
          
          // Map complexity
          terrainComplexity: 0.8,
          mapConnectivity: 1.2,
          
          // Player advantages
          startingResources: 1.5,
          constructionSpeed: 1.3,
          antLifespan: 1.2,
          
          // UI and assistance
          hintSystem: true,
          autoSave: true,
          pauseOnLowHealth: true
        }
      },
      
      MEDIUM: {
        name: 'Medium',
        description: 'Balanced challenge for average players',
        settings: {
          // Resource settings
          resourceDensity: 1.0,
          resourceQuality: 1.0,
          resourceRegenRate: 1.0,
          
          // Enemy settings
          enemyColonies: 2,
          enemyAggression: 0.8,
          enemyGrowthRate: 1.0,
          
          // Environment settings
          obstaclesDensity: 1.0,
          environmentalHazards: 0.6,
          weatherSeverity: 0.6,
          
          // Map complexity
          terrainComplexity: 1.0,
          mapConnectivity: 1.0,
          
          // Player advantages
          startingResources: 1.0,
          constructionSpeed: 1.0,
          antLifespan: 1.0,
          
          // UI and assistance
          hintSystem: false,
          autoSave: true,
          pauseOnLowHealth: false
        }
      },
      
      HARD: {
        name: 'Hard',
        description: 'Challenging gameplay for experienced players',
        settings: {
          // Resource settings
          resourceDensity: 0.7,
          resourceQuality: 0.8,
          resourceRegenRate: 0.8,
          
          // Enemy settings
          enemyColonies: 3,
          enemyAggression: 1.2,
          enemyGrowthRate: 1.3,
          
          // Environment settings
          obstaclesDensity: 1.4,
          environmentalHazards: 1.0,
          weatherSeverity: 0.9,
          
          // Map complexity
          terrainComplexity: 1.2,
          mapConnectivity: 0.8,
          
          // Player advantages
          startingResources: 0.8,
          constructionSpeed: 0.9,
          antLifespan: 0.9,
          
          // UI and assistance
          hintSystem: false,
          autoSave: false,
          pauseOnLowHealth: false
        }
      },
      
      NIGHTMARE: {
        name: 'Nightmare',
        description: 'Extreme challenge for expert players',
        settings: {
          // Resource settings
          resourceDensity: 0.5,
          resourceQuality: 0.6,
          resourceRegenRate: 0.6,
          
          // Enemy settings
          enemyColonies: 4,
          enemyAggression: 1.5,
          enemyGrowthRate: 1.6,
          
          // Environment settings
          obstaclesDensity: 1.8,
          environmentalHazards: 1.5,
          weatherSeverity: 1.2,
          
          // Map complexity
          terrainComplexity: 1.5,
          mapConnectivity: 0.6,
          
          // Player advantages
          startingResources: 0.6,
          constructionSpeed: 0.7,
          antLifespan: 0.7,
          
          // UI and assistance
          hintSystem: false,
          autoSave: false,
          pauseOnLowHealth: false
        }
      }
    };
    
    this.campaignProgression = {
      // How difficulty scales with campaign progress
      baseProgression: 0.05, // 5% increase per level
      maxProgression: 2.0,   // Cap at 200% of base difficulty
      
      // Specific progression curves for different aspects
      progressionCurves: {
        enemyStrength: 0.08,
        resourceScarcity: 0.06,
        environmentalDifficulty: 0.04,
        mapComplexity: 0.03
      }
    };
  }

  /**
   * Get difficulty preset by name
   */
  getPreset(difficultyName) {
    const presetKey = difficultyName.toUpperCase();
    if (!this.presets[presetKey]) {
      throw new Error(`Unknown difficulty preset: ${difficultyName}`);
    }
    return { ...this.presets[presetKey] };
  }

  /**
   * Calculate progressive difficulty for campaign mode
   */
  calculateCampaignDifficulty(baseDifficulty, campaignLevel, missionNumber = 1) {
    const basePreset = this.getPreset(baseDifficulty);
    const settings = { ...basePreset.settings };
    
    // Calculate overall progression multiplier
    const progressionLevel = (campaignLevel - 1) + (missionNumber - 1) * 0.5;
    const progressionMultiplier = Math.min(
      1 + (progressionLevel * this.campaignProgression.baseProgression),
      this.campaignProgression.maxProgression
    );
    
    // Apply progressive scaling to specific settings
    const curves = this.campaignProgression.progressionCurves;
    
    // Enemy difficulty scaling
    settings.enemyColonies = Math.min(6, Math.floor(settings.enemyColonies * (1 + progressionLevel * curves.enemyStrength)));
    settings.enemyAggression *= (1 + progressionLevel * curves.enemyStrength);
    settings.enemyGrowthRate *= (1 + progressionLevel * curves.enemyStrength);
    
    // Resource scarcity scaling
    settings.resourceDensity *= (1 - progressionLevel * curves.resourceScarcity * 0.1);
    settings.resourceQuality *= (1 - progressionLevel * curves.resourceScarcity * 0.05);
    settings.resourceRegenRate *= (1 - progressionLevel * curves.resourceScarcity * 0.08);
    
    // Environmental difficulty scaling
    settings.obstaclesDensity *= (1 + progressionLevel * curves.environmentalDifficulty);
    settings.environmentalHazards *= (1 + progressionLevel * curves.environmentalDifficulty);
    settings.weatherSeverity *= (1 + progressionLevel * curves.environmentalDifficulty);
    
    // Map complexity scaling
    settings.terrainComplexity *= (1 + progressionLevel * curves.mapComplexity);
    settings.mapConnectivity *= (1 - progressionLevel * curves.mapComplexity * 0.1);
    
    // Ensure values stay within reasonable bounds
    this.clampSettings(settings);
    
    return {
      name: `${basePreset.name} (Campaign Level ${campaignLevel})`,
      description: `Progressive difficulty for campaign level ${campaignLevel}`,
      settings,
      progressionMultiplier,
      campaignLevel,
      missionNumber
    };
  }

  /**
   * Clamp settings to reasonable bounds
   */
  clampSettings(settings) {
    // Resource settings bounds
    settings.resourceDensity = Math.max(0.1, Math.min(3.0, settings.resourceDensity));
    settings.resourceQuality = Math.max(0.3, Math.min(2.0, settings.resourceQuality));
    settings.resourceRegenRate = Math.max(0.2, Math.min(2.0, settings.resourceRegenRate));
    
    // Enemy settings bounds
    settings.enemyColonies = Math.max(0, Math.min(8, Math.floor(settings.enemyColonies)));
    settings.enemyAggression = Math.max(0.1, Math.min(3.0, settings.enemyAggression));
    settings.enemyGrowthRate = Math.max(0.3, Math.min(3.0, settings.enemyGrowthRate));
    
    // Environment settings bounds
    settings.obstaclesDensity = Math.max(0.1, Math.min(3.0, settings.obstaclesDensity));
    settings.environmentalHazards = Math.max(0, Math.min(2.0, settings.environmentalHazards));
    settings.weatherSeverity = Math.max(0, Math.min(2.0, settings.weatherSeverity));
    
    // Map complexity bounds
    settings.terrainComplexity = Math.max(0.5, Math.min(2.0, settings.terrainComplexity));
    settings.mapConnectivity = Math.max(0.3, Math.min(2.0, settings.mapConnectivity));
    
    // Player advantage bounds
    settings.startingResources = Math.max(0.3, Math.min(2.0, settings.startingResources));
    settings.constructionSpeed = Math.max(0.5, Math.min(2.0, settings.constructionSpeed));
    settings.antLifespan = Math.max(0.5, Math.min(2.0, settings.antLifespan));
  }

  /**
   * Create custom difficulty by blending presets
   */
  createCustomDifficulty(basePreset, customizations = {}) {
    const base = this.getPreset(basePreset);
    const settings = { ...base.settings };
    
    // Apply customizations
    for (const [key, value] of Object.entries(customizations)) {
      if (settings.hasOwnProperty(key)) {
        settings[key] = value;
      }
    }
    
    this.clampSettings(settings);
    
    return {
      name: 'Custom',
      description: 'Custom difficulty settings',
      settings,
      isCustom: true,
      basePreset
    };
  }

  /**
   * Analyze player performance to suggest difficulty adjustments
   */
  analyzePerformance(gameStats) {
    const suggestions = [];
    
    // Analyze completion time
    if (gameStats.completionTime && gameStats.targetTime) {
      const timeRatio = gameStats.completionTime / gameStats.targetTime;
      if (timeRatio < 0.5) {
        suggestions.push({
          type: 'increase_difficulty',
          reason: 'Completed mission much faster than expected',
          priority: 'high'
        });
      } else if (timeRatio > 2.0) {
        suggestions.push({
          type: 'decrease_difficulty',
          reason: 'Took much longer than expected to complete',
          priority: 'medium'
        });
      }
    }
    
    // Analyze resource management
    if (gameStats.resourceEfficiency < 0.4) {
      suggestions.push({
        type: 'increase_resources',
        reason: 'Poor resource efficiency indicates scarcity',
        priority: 'medium'
      });
    } else if (gameStats.resourceEfficiency > 0.9) {
      suggestions.push({
        type: 'decrease_resources',
        reason: 'Very high resource efficiency indicates abundance',
        priority: 'low'
      });
    }
    
    // Analyze deaths and failures
    if (gameStats.antDeaths > gameStats.totalAnts * 0.7) {
      suggestions.push({
        type: 'decrease_difficulty',
        reason: 'High ant mortality rate',
        priority: 'high'
      });
    }
    
    // Analyze construction success
    if (gameStats.failedConstructions > gameStats.totalConstructions * 0.3) {
      suggestions.push({
        type: 'increase_resources',
        reason: 'Many failed constructions due to resource constraints',
        priority: 'medium'
      });
    }
    
    return suggestions;
  }

  /**
   * Auto-adjust difficulty based on performance
   */
  autoAdjustDifficulty(currentDifficulty, performanceAnalysis) {
    const adjustments = {};
    
    for (const suggestion of performanceAnalysis) {
      switch (suggestion.type) {
        case 'increase_difficulty':
          adjustments.enemyAggression = (adjustments.enemyAggression || 1) * 1.1;
          adjustments.resourceDensity = (adjustments.resourceDensity || 1) * 0.95;
          break;
          
        case 'decrease_difficulty':
          adjustments.enemyAggression = (adjustments.enemyAggression || 1) * 0.9;
          adjustments.resourceDensity = (adjustments.resourceDensity || 1) * 1.05;
          break;
          
        case 'increase_resources':
          adjustments.resourceDensity = (adjustments.resourceDensity || 1) * 1.1;
          adjustments.resourceQuality = (adjustments.resourceQuality || 1) * 1.05;
          break;
          
        case 'decrease_resources':
          adjustments.resourceDensity = (adjustments.resourceDensity || 1) * 0.9;
          adjustments.resourceQuality = (adjustments.resourceQuality || 1) * 0.95;
          break;
      }
    }
    
    return this.createCustomDifficulty(currentDifficulty.name || 'MEDIUM', adjustments);
  }

  /**
   * Get available difficulty presets
   */
  getAvailablePresets() {
    return Object.keys(this.presets).map(key => ({
      key,
      name: this.presets[key].name,
      description: this.presets[key].description
    }));
  }

  /**
   * Validate difficulty settings
   */
  validateSettings(settings) {
    const errors = [];
    const warnings = [];
    
    // Check for extreme values
    if (settings.resourceDensity < 0.2) {
      warnings.push('Very low resource density may make the game unplayable');
    }
    if (settings.enemyColonies > 6) {
      warnings.push('Very high enemy count may impact performance');
    }
    if (settings.enemyAggression > 2.0) {
      warnings.push('Very high enemy aggression may be overwhelming');
    }
    
    // Check for invalid values
    if (settings.resourceDensity <= 0) {
      errors.push('Resource density must be greater than 0');
    }
    if (settings.enemyColonies < 0) {
      errors.push('Enemy colonies cannot be negative');
    }
    
    return { errors, warnings, isValid: errors.length === 0 };
  }
}

/**
 * PerformanceOptimizer class for optimizing map generation performance
 */
class PerformanceOptimizer {
  constructor() {
    this.config = {
      // Performance thresholds
      maxGenerationTime: 10000, // 10 seconds
      targetFrameRate: 60,
      maxMemoryUsage: 500, // MB
      
      // Optimization strategies
      strategies: {
        chunkedGeneration: true,
        webWorkers: false, // Disabled for Node.js backend
        caching: true,
        progressiveDetail: true,
        memoryOptimization: true
      },
      
      // Cache settings
      cache: {
        maxSize: 50, // Number of cached maps
        ttl: 1000 * 60 * 30 // 30 minutes
      }
    };
    
    this.cache = new Map();
    this.statistics = {
      generationsCompleted: 0,
      totalGenerationTime: 0,
      averageGenerationTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  /**
   * Optimize map generation based on parameters
   */
  optimizeGeneration(mapParams) {
    const optimizedParams = { ...mapParams };
    const totalTiles = mapParams.width * mapParams.height;
    
    // Adjust detail based on map size
    if (totalTiles > 50000) { // Large maps
      optimizedParams.terrainOctaves = Math.max(2, optimizedParams.terrainOctaves || 4);
      optimizedParams.chunkSize = 50;
    } else if (totalTiles > 10000) { // Medium maps
      optimizedParams.terrainOctaves = Math.max(3, optimizedParams.terrainOctaves || 4);
      optimizedParams.chunkSize = 25;
    } else { // Small maps
      optimizedParams.chunkSize = 10;
    }
    
    // Enable chunked generation for large maps
    if (totalTiles > 25000) {
      optimizedParams.useChunkedGeneration = true;
    }
    
    return optimizedParams;
  }

  /**
   * Generate map in chunks to prevent UI freezing
   */
  async generateChunked(mapGrid, generator, chunkSize = 25, onProgress = null) {
    const totalChunks = Math.ceil(mapGrid.width / chunkSize) * Math.ceil(mapGrid.height / chunkSize);
    let completedChunks = 0;
    
    for (let chunkY = 0; chunkY < mapGrid.height; chunkY += chunkSize) {
      for (let chunkX = 0; chunkX < mapGrid.width; chunkX += chunkSize) {
        const endX = Math.min(chunkX + chunkSize, mapGrid.width);
        const endY = Math.min(chunkY + chunkSize, mapGrid.height);
        
        // Process chunk
        for (let y = chunkY; y < endY; y++) {
          for (let x = chunkX; x < endX; x++) {
            // Apply generation logic to this tile
            const tile = mapGrid.getTile(x, y);
            if (tile && generator) {
              // Update tile with generator logic
              tile.terrainType = generator.getTerrainType(x, y);
              tile.elevation = generator.getElevation(x, y);
              tile.moisture = generator.getMoisture(x, y);
              tile.temperature = generator.getTemperature(x, y);
            }
          }
        }
        
        completedChunks++;
        
        // Report progress
        if (onProgress) {
          onProgress({
            chunksCompleted: completedChunks,
            totalChunks,
            progress: (completedChunks / totalChunks) * 100
          });
        }
        
        // Yield control periodically
        if (completedChunks % 10 === 0) {
          await new Promise(resolve => setImmediate(resolve));
        }
      }
    }
    
    return mapGrid;
  }

  /**
   * Cache management
   */
  getCachedMap(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.cache.ttl) {
      this.statistics.cacheHits++;
      return cached.data;
    }
    
    this.statistics.cacheMisses++;
    if (cached) {
      this.cache.delete(cacheKey); // Remove expired entry
    }
    return null;
  }

  setCachedMap(cacheKey, mapData) {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.config.cache.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(cacheKey, {
      data: mapData,
      timestamp: Date.now()
    });
  }

  generateCacheKey(params) {
    const keyParams = {
      seed: params.seed,
      width: params.width,
      height: params.height,
      difficulty: params.difficulty
    };
    return JSON.stringify(keyParams);
  }

  /**
   * Memory optimization utilities
   */
  optimizeMemoryUsage() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Clear old cache entries
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.cache.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get performance statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      cacheSize: this.cache.size,
      cacheHitRate: this.statistics.cacheHits / (this.statistics.cacheHits + this.statistics.cacheMisses) || 0
    };
  }

  /**
   * Update statistics after generation
   */
  updateStatistics(generationTime) {
    this.statistics.generationsCompleted++;
    this.statistics.totalGenerationTime += generationTime;
    this.statistics.averageGenerationTime = 
      this.statistics.totalGenerationTime / this.statistics.generationsCompleted;
  }

  /**
   * Estimate performance impact
   */
  estimatePerformanceImpact(mapParams) {
    const totalTiles = mapParams.width * mapParams.height;
    const complexity = mapParams.difficulty === 'hard' ? 1.5 : 1.0;
    
    const estimatedTime = totalTiles * 0.1 * complexity; // ms
    const memoryUsage = totalTiles * 0.001; // MB
    
    const recommendations = [];
    
    if (estimatedTime > this.config.maxGenerationTime) {
      recommendations.push('Consider using chunked generation for large maps');
    }
    
    if (memoryUsage > this.config.maxMemoryUsage) {
      recommendations.push('Memory usage may be high, consider reducing map size');
    }
    
    return {
      estimatedTime,
      estimatedMemory: memoryUsage,
      recommendations
    };
  }
}

module.exports = { DifficultyManager, PerformanceOptimizer }; 
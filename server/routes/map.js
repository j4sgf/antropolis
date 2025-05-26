/**
 * Map generation API routes
 * Provides endpoints for procedural map generation, seed management, and performance monitoring
 */

const express = require('express');
const router = express.Router();
const { MapGenerator } = require('../services/MapGenerator');
const { DifficultyManager, PerformanceOptimizer } = require('../services/DifficultyManager');

// Initialize services
const mapGenerator = new MapGenerator();
const difficultyManager = new DifficultyManager();
const performanceOptimizer = new PerformanceOptimizer();

/**
 * Generate a new map (GET version for quick testing)
 * GET /api/map/generate
 */
router.get('/generate', async (req, res) => {
  try {
    const {
      seed = 'test-seed-' + Date.now(),
      size = 50,
      difficulty = 'medium'
    } = req.query;

    console.log('GET Map generation request:', { seed, size, difficulty });

    // Simple map generation for testing
    const result = {
      seed,
      width: parseInt(size),
      height: parseInt(size),
      difficulty,
      cells: Array(parseInt(size)).fill(null).map((_, y) => 
        Array(parseInt(size)).fill(null).map((_, x) => ({
          x, y,
          terrain: Math.random() > 0.7 ? 'obstacle' : 'passable',
          resources: Math.random() > 0.9 ? { type: 'food', amount: Math.floor(Math.random() * 50) } : null
        }))
      ),
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: result,
      fromCache: false,
      generationTime: Math.floor(Math.random() * 500)
    });

  } catch (error) {
    console.error('Map generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate a new map (full POST version)
 * POST /api/map/generate
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      seed,
      width = 100,
      height = 100,
      difficulty = 'medium',
      playerStartX,
      playerStartY,
      customConfig = {},
      useCache = true
    } = req.body;

    console.log('Map generation request:', { seed, width, height, difficulty });

    // Check cache first
    let cacheKey = null;
    if (useCache) {
      cacheKey = performanceOptimizer.generateCacheKey({ seed, width, height, difficulty });
      const cachedMap = performanceOptimizer.getCachedMap(cacheKey);
      
      if (cachedMap) {
        return res.json({
          success: true,
          data: cachedMap,
          fromCache: true
        });
      }
    }

    // Optimize generation parameters
    const optimizedParams = performanceOptimizer.optimizeGeneration({
      seed, width, height, difficulty, customConfig
    });

    // Generate the map
    const startTime = Date.now();
    const result = await mapGenerator.generateMap({
      seed,
      width,
      height,
      difficulty,
      playerStartX,
      playerStartY,
      customConfig: optimizedParams,
      onProgress: (progress) => {
        // Could emit progress via WebSocket in the future
        console.log(`Generation progress: ${progress.phase} - ${progress.progress}%`);
      }
    });

    const generationTime = Date.now() - startTime;
    performanceOptimizer.updateStatistics(generationTime);

    // Cache the result
    if (useCache && cacheKey) {
      performanceOptimizer.setCachedMap(cacheKey, result);
    }

    res.json({
      success: true,
      data: result,
      fromCache: false,
      generationTime
    });

  } catch (error) {
    console.error('Map generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate a map preview (reduced detail)
 * POST /api/map/preview
 */
router.post('/preview', async (req, res) => {
  try {
    const { seed, width = 50, height = 50 } = req.body;

    const result = await mapGenerator.generatePreview(seed, width, height);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Map preview error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate map variations
 * POST /api/map/variations
 */
router.post('/variations', async (req, res) => {
  try {
    const { 
      baseSeed, 
      count = 3, 
      width = 100, 
      height = 100, 
      difficulty = 'medium' 
    } = req.body;

    const variations = await mapGenerator.generateVariations(baseSeed, count, {
      width,
      height,
      difficulty
    });

    res.json({
      success: true,
      data: {
        baseSeed,
        variations
      }
    });

  } catch (error) {
    console.error('Map variations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get recommended map size
 * GET /api/map/recommended-size
 */
router.get('/recommended-size', (req, res) => {
  try {
    const { difficulty = 'medium', playerCount = 1 } = req.query;

    const recommendedSize = mapGenerator.getRecommendedMapSize(difficulty, parseInt(playerCount));

    res.json({
      success: true,
      data: recommendedSize
    });

  } catch (error) {
    console.error('Recommended size error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate a random seed string
 * GET /api/map/random-seed
 */
router.get('/random-seed', (req, res) => {
  try {
    const { length = 8 } = req.query;

    const seedString = mapGenerator.generateSeedString(parseInt(length));

    res.json({
      success: true,
      data: { seed: seedString }
    });

  } catch (error) {
    console.error('Random seed error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Estimate generation time
 * POST /api/map/estimate
 */
router.post('/estimate', (req, res) => {
  try {
    const { width, height, difficulty = 'medium' } = req.body;

    const estimatedTime = mapGenerator.estimateGenerationTime(width, height, difficulty);
    const performanceImpact = performanceOptimizer.estimatePerformanceImpact({
      width, height, difficulty
    });

    res.json({
      success: true,
      data: {
        estimatedTime,
        ...performanceImpact
      }
    });

  } catch (error) {
    console.error('Estimation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get difficulty presets
 * GET /api/map/difficulty/presets
 */
router.get('/difficulty/presets', (req, res) => {
  try {
    const presets = difficultyManager.getAvailablePresets();

    res.json({
      success: true,
      data: presets
    });

  } catch (error) {
    console.error('Difficulty presets error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get specific difficulty preset
 * GET /api/map/difficulty/:preset
 */
router.get('/difficulty/:preset', (req, res) => {
  try {
    const { preset } = req.params;

    const difficulty = difficultyManager.getPreset(preset);

    res.json({
      success: true,
      data: difficulty
    });

  } catch (error) {
    console.error('Difficulty preset error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Calculate campaign difficulty
 * POST /api/map/difficulty/campaign
 */
router.post('/difficulty/campaign', (req, res) => {
  try {
    const { baseDifficulty, campaignLevel, missionNumber = 1 } = req.body;

    const campaignDifficulty = difficultyManager.calculateCampaignDifficulty(
      baseDifficulty, 
      campaignLevel, 
      missionNumber
    );

    res.json({
      success: true,
      data: campaignDifficulty
    });

  } catch (error) {
    console.error('Campaign difficulty error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create custom difficulty
 * POST /api/map/difficulty/custom
 */
router.post('/difficulty/custom', (req, res) => {
  try {
    const { basePreset, customizations = {} } = req.body;

    const customDifficulty = difficultyManager.createCustomDifficulty(basePreset, customizations);

    res.json({
      success: true,
      data: customDifficulty
    });

  } catch (error) {
    console.error('Custom difficulty error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Validate difficulty settings
 * POST /api/map/difficulty/validate
 */
router.post('/difficulty/validate', (req, res) => {
  try {
    const { settings } = req.body;

    const validation = difficultyManager.validateSettings(settings);

    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Difficulty validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze player performance
 * POST /api/map/difficulty/analyze
 */
router.post('/difficulty/analyze', (req, res) => {
  try {
    const { gameStats } = req.body;

    const analysis = difficultyManager.analyzePerformance(gameStats);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Performance analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Auto-adjust difficulty based on performance
 * POST /api/map/difficulty/auto-adjust
 */
router.post('/difficulty/auto-adjust', (req, res) => {
  try {
    const { currentDifficulty, performanceAnalysis } = req.body;

    const adjustedDifficulty = difficultyManager.autoAdjustDifficulty(
      currentDifficulty,
      performanceAnalysis
    );

    res.json({
      success: true,
      data: adjustedDifficulty
    });

  } catch (error) {
    console.error('Auto-adjust difficulty error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get performance statistics
 * GET /api/map/performance/stats
 */
router.get('/performance/stats', (req, res) => {
  try {
    const stats = performanceOptimizer.getStatistics();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Performance stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clear performance cache
 * POST /api/map/performance/clear-cache
 */
router.post('/performance/clear-cache', (req, res) => {
  try {
    performanceOptimizer.cache.clear();
    performanceOptimizer.optimizeMemoryUsage();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create map from existing data
 * POST /api/map/from-data
 */
router.post('/from-data', (req, res) => {
  try {
    const { mapData } = req.body;

    const result = mapGenerator.createMapFromData(mapData);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Create map from data error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clone existing map with new seed
 * POST /api/map/clone
 */
router.post('/clone', async (req, res) => {
  try {
    const { originalMap, newSeed } = req.body;

    const result = await mapGenerator.cloneMapWithNewSeed(originalMap, newSeed);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Clone map error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export map data for sharing
 * POST /api/map/export
 */
router.post('/export', (req, res) => {
  try {
    const { mapGrid } = req.body;

    const exportData = {
      metadata: mapGrid.metadata,
      seed: mapGrid.metadata.seed,
      width: mapGrid.width,
      height: mapGrid.height,
      statistics: mapGrid.getStatistics(),
      exportTimestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    res.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Export map error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get map tile data
 * GET /api/map/:id/tile/:x/:y
 */
router.get('/:id/tile/:x/:y', async (req, res) => {
  try {
    const { id, x, y } = req.params;
    
    // In a real implementation, you would load the map from database
    // For now, we'll return an error indicating the map needs to be loaded first
    
    res.status(404).json({
      success: false,
      error: 'Map not found. Generate or load a map first.'
    });

  } catch (error) {
    console.error('Get tile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 * GET /api/map/health
 */
router.get('/health', (req, res) => {
  const stats = performanceOptimizer.getStatistics();
  
  res.json({
    success: true,
    status: 'healthy',
    uptime: process.uptime(),
    performance: stats,
    memory: {
      used: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      total: process.memoryUsage().heapTotal / 1024 / 1024 // MB
    }
  });
});

module.exports = router; 
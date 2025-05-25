const ExplorationManager = require('../services/ExplorationManager');
const Colony = require('../models/Colony');

// Initialize exploration manager
const explorationManager = new ExplorationManager();

/**
 * Initialize exploration for a colony
 * POST /api/exploration/:colonyId/initialize
 */
const initializeExploration = async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { mapWidth = 100, mapHeight = 100, basePosition } = req.body;

    // Validate colony exists
    const colony = await Colony.findById(colonyId);
    if (!colony) {
      return res.status(404).json({
        success: false,
        error: 'Colony not found'
      });
    }

    // Use colony position if basePosition not provided
    const base = basePosition || { x: colony.base_x || 50, y: colony.base_y || 50 };

    // Initialize exploration
    const explorationData = explorationManager.initializeColonyExploration(
      colonyId,
      mapWidth,
      mapHeight,
      base
    );

    console.log(`Initialized exploration for colony ${colonyId} at ${base.x}, ${base.y}`);

    res.json({
      success: true,
      data: {
        colonyId,
        basePosition: base,
        mapDimensions: { width: mapWidth, height: mapHeight },
        initialExploredArea: explorationData.totalExploredArea,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error initializing exploration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize exploration'
    });
  }
};

/**
 * Get exploration status for a colony
 * GET /api/exploration/:colonyId/status
 */
const getExplorationStatus = async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { includeDetails = false } = req.query;

    // Get exploration statistics
    const stats = explorationManager.getExplorationStats(colonyId);
    if (!stats) {
      return res.status(404).json({
        success: false,
        error: 'No exploration data found for colony'
      });
    }

    let responseData = { stats };

    // Include detailed tile information if requested
    if (includeDetails === 'true') {
      const explorationData = explorationManager.exportExplorationData(colonyId);
      if (explorationData) {
        responseData.exploredTiles = explorationData.exploredTiles;
        responseData.visibleTiles = explorationData.visibleTiles;
        responseData.memoryDecayMap = explorationData.memoryDecayMap;
      }
    }

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error getting exploration status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get exploration status'
    });
  }
};

/**
 * Update scout positions and calculate visibility
 * POST /api/exploration/:colonyId/update-scouts
 */
const updateScoutPositions = async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { scoutPositions = [] } = req.body;

    // Validate scout positions
    const validScouts = scoutPositions.filter(scout => 
      scout && typeof scout.x === 'number' && typeof scout.y === 'number'
    );

    // Calculate new visible tiles based on scout positions
    const visibleTiles = explorationManager.calculateVisibleTiles(colonyId, validScouts);

    // Get updated stats
    const stats = explorationManager.getExplorationStats(colonyId);

    res.json({
      success: true,
      data: {
        visibleTiles,
        scoutCount: validScouts.length,
        newlyExploredTiles: visibleTiles.length,
        stats
      }
    });

  } catch (error) {
    console.error('Error updating scout positions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update scout positions'
    });
  }
};

/**
 * Set specific tiles as explored
 * POST /api/exploration/:colonyId/explore-tiles
 */
const exploreTiles = async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { tiles = [], discoveryType = null } = req.body;

    // Validate tiles
    const validTiles = tiles.filter(tile => 
      tile && typeof tile.x === 'number' && typeof tile.y === 'number'
    );

    if (validTiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid tiles provided'
      });
    }

    // Mark tiles as explored
    const exploredCount = validTiles.reduce((count, tile) => {
      const success = explorationManager.setExplored(colonyId, tile.x, tile.y, discoveryType);
      return count + (success ? 1 : 0);
    }, 0);

    // Get updated stats
    const stats = explorationManager.getExplorationStats(colonyId);

    res.json({
      success: true,
      data: {
        tilesExplored: exploredCount,
        totalTiles: validTiles.length,
        discoveryType,
        stats
      }
    });

  } catch (error) {
    console.error('Error exploring tiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to explore tiles'
    });
  }
};

/**
 * Set an area as explored (circular or square)
 * POST /api/exploration/:colonyId/explore-area
 */
const exploreArea = async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { centerX, centerY, radius = 3, shape = 'circular' } = req.body;

    // Validate parameters
    if (typeof centerX !== 'number' || typeof centerY !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid center coordinates'
      });
    }

    // Explore the area
    const exploredTiles = explorationManager.setExploredArea(
      colonyId, 
      centerX, 
      centerY, 
      radius, 
      shape
    );

    // Get updated stats
    const stats = explorationManager.getExplorationStats(colonyId);

    res.json({
      success: true,
      data: {
        centerPosition: { x: centerX, y: centerY },
        radius,
        shape,
        tilesExplored: exploredTiles.length,
        exploredTiles,
        stats
      }
    });

  } catch (error) {
    console.error('Error exploring area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to explore area'
    });
  }
};

/**
 * Process memory decay for a colony
 * POST /api/exploration/:colonyId/process-decay
 */
const processMemoryDecay = async (req, res) => {
  try {
    const { colonyId } = req.params;

    // Process memory decay
    const decayResult = explorationManager.processMemoryDecay(colonyId);
    
    if (!decayResult) {
      return res.status(404).json({
        success: false,
        error: 'No exploration data found for colony'
      });
    }

    // Get updated stats
    const stats = explorationManager.getExplorationStats(colonyId);

    res.json({
      success: true,
      data: {
        decayResult,
        stats
      }
    });

  } catch (error) {
    console.error('Error processing memory decay:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process memory decay'
    });
  }
};

/**
 * Get exploration data for a specific tile
 * GET /api/exploration/:colonyId/tile/:x/:y
 */
const getTileExploration = async (req, res) => {
  try {
    const { colonyId, x, y } = req.params;
    
    const tileX = parseInt(x);
    const tileY = parseInt(y);
    
    if (isNaN(tileX) || isNaN(tileY)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tile coordinates'
      });
    }

    // Get exploration status for the tile
    const explorationStatus = explorationManager.getExplorationStatus(colonyId, tileX, tileY);

    res.json({
      success: true,
      data: {
        position: { x: tileX, y: tileY },
        ...explorationStatus
      }
    });

  } catch (error) {
    console.error('Error getting tile exploration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tile exploration data'
    });
  }
};

/**
 * Export exploration data for save/backup
 * GET /api/exploration/:colonyId/export
 */
const exportExplorationData = async (req, res) => {
  try {
    const { colonyId } = req.params;

    const explorationData = explorationManager.exportExplorationData(colonyId);
    
    if (!explorationData) {
      return res.status(404).json({
        success: false,
        error: 'No exploration data found for colony'
      });
    }

    res.json({
      success: true,
      data: explorationData
    });

  } catch (error) {
    console.error('Error exporting exploration data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export exploration data'
    });
  }
};

/**
 * Import exploration data from save/backup
 * POST /api/exploration/:colonyId/import
 */
const importExplorationData = async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { explorationData } = req.body;

    if (!explorationData || explorationData.colonyId !== colonyId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid exploration data'
      });
    }

    // Import the data
    const importedData = explorationManager.importExplorationData(explorationData);

    res.json({
      success: true,
      data: {
        imported: true,
        colonyId: importedData.colonyId,
        totalExploredTiles: importedData.totalExploredArea,
        lastUpdate: importedData.lastUpdate
      }
    });

  } catch (error) {
    console.error('Error importing exploration data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import exploration data'
    });
  }
};

module.exports = {
  initializeExploration,
  getExplorationStatus,
  updateScoutPositions,
  exploreTiles,
  exploreArea,
  processMemoryDecay,
  getTileExploration,
  exportExplorationData,
  importExplorationData
}; 
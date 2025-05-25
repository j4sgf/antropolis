const express = require('express');
const { LifecycleManager, LifecycleEvents, LifecycleConfig } = require('../services/LifecycleManager');
const Ant = require('../models/Ant');
const Colony = require('../models/Colony');

const router = express.Router();

// Global lifecycle manager instance
let lifecycleManager = null;

/**
 * Initialize lifecycle manager (call this when server starts)
 */
function initializeLifecycleManager() {
  if (!lifecycleManager) {
    lifecycleManager = new LifecycleManager();
    console.log('🚀 Lifecycle Manager initialized');
  }
  return lifecycleManager;
}

/**
 * Get lifecycle manager instance
 */
function getLifecycleManager() {
  if (!lifecycleManager) {
    return initializeLifecycleManager();
  }
  return lifecycleManager;
}

// ===== LIFECYCLE MANAGEMENT ROUTES =====

/**
 * GET /api/lifecycle/status
 * Get overall lifecycle system status and statistics
 */
router.get('/status', (req, res) => {
  try {
    const manager = getLifecycleManager();
    const statistics = manager.getStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting lifecycle status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lifecycle status'
    });
  }
});

/**
 * POST /api/lifecycle/colony/:colonyId/register
 * Register a colony for lifecycle management
 */
router.post('/colony/:colonyId/register', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    // Validate colony exists
    const colonyResult = await Colony.findById(colonyId);
    if (!colonyResult.data) {
      return res.status(404).json({
        success: false,
        error: 'Colony not found'
      });
    }
    
    const manager = getLifecycleManager();
    manager.registerColony(colonyId);
    
    res.json({
      success: true,
      message: `Colony ${colonyId} registered for lifecycle management`,
      data: { colonyId }
    });
  } catch (error) {
    console.error('Error registering colony for lifecycle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register colony for lifecycle management'
    });
  }
});

/**
 * DELETE /api/lifecycle/colony/:colonyId/unregister
 * Unregister a colony from lifecycle management
 */
router.delete('/colony/:colonyId/unregister', (req, res) => {
  try {
    const { colonyId } = req.params;
    const manager = getLifecycleManager();
    manager.unregisterColony(colonyId);
    
    res.json({
      success: true,
      message: `Colony ${colonyId} unregistered from lifecycle management`,
      data: { colonyId }
    });
  } catch (error) {
    console.error('Error unregistering colony from lifecycle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister colony from lifecycle management'
    });
  }
});

/**
 * GET /api/lifecycle/colony/:colonyId/population
 * Get detailed population statistics for a colony
 */
router.get('/colony/:colonyId/population', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    // Get all ants in colony
    const antsResult = await Ant.findByColonyId(colonyId);
    if (!antsResult.data) {
      return res.status(404).json({
        success: false,
        error: 'Colony not found or no ants'
      });
    }
    
    // Calculate population statistics
    const ants = antsResult.data;
    const populationStats = {
      total: ants.length,
      byStage: {
        eggs: ants.filter(ant => ant.status === 'egg').length,
        larvae: ants.filter(ant => ant.status === 'larva').length,
        pupae: ants.filter(ant => ant.status === 'pupa').length,
        adults: ants.filter(ant => ant.status === 'adult').length,
        dead: ants.filter(ant => ant.status === 'dead').length
      },
      byType: {},
      queens: ants.filter(ant => ant.is_queen).length,
      averageAge: ants.reduce((sum, ant) => sum + ant.age_in_ticks, 0) / ants.length || 0,
      totalFoodConsumption: ants.reduce((sum, ant) => sum + ant.getFoodConsumptionRate(), 0)
    };
    
    // Count by type
    ants.forEach(ant => {
      if (ant.status === 'adult') {
        populationStats.byType[ant.type] = (populationStats.byType[ant.type] || 0) + 1;
      }
    });
    
    // Get lifecycle manager stats if colony is registered
    const manager = getLifecycleManager();
    const lifecycleStats = manager.getStatistics();
    const colonyLifecycleData = lifecycleStats.colonies[colonyId] || null;
    
    res.json({
      success: true,
      data: {
        colonyId,
        population: populationStats,
        lifecycle: colonyLifecycleData,
        ants: ants.map(ant => ant.toJSON())
      }
    });
  } catch (error) {
    console.error('Error getting colony population:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get colony population'
    });
  }
});

// ===== ANT LIFECYCLE ROUTES =====

/**
 * GET /api/lifecycle/ants/stages
 * Get lifecycle stage definitions
 */
router.get('/ants/stages', (req, res) => {
  try {
    const stages = Ant.getLifecycleStages();
    const queenProperties = Ant.getQueenProperties();
    
    res.json({
      success: true,
      data: {
        stages,
        queenProperties,
        config: LifecycleConfig
      }
    });
  } catch (error) {
    console.error('Error getting lifecycle stages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lifecycle stages'
    });
  }
});

/**
 * POST /api/lifecycle/ants/:antId/progress
 * Manually progress an ant to next lifecycle stage (for testing)
 */
router.post('/ants/:antId/progress', async (req, res) => {
  try {
    const { antId } = req.params;
    
    const antResult = await Ant.findById(antId);
    if (!antResult.data) {
      return res.status(404).json({
        success: false,
        error: 'Ant not found'
      });
    }
    
    const ant = antResult.data;
    const oldStage = ant.status;
    
    if (ant.canProgressStage()) {
      const progressed = ant.progressToNextStage();
      if (progressed) {
        await ant.updateDatabase({
          status: ant.status,
          stage_entry_time: ant.stage_entry_time,
          health: ant.health,
          energy: ant.energy
        });
        
        res.json({
          success: true,
          message: `Ant progressed from ${oldStage} to ${ant.status}`,
          data: {
            antId,
            oldStage,
            newStage: ant.status,
            ant: ant.toJSON()
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Ant cannot progress to next stage'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: 'Ant is not ready to progress to next stage'
      });
    }
  } catch (error) {
    console.error('Error progressing ant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to progress ant'
    });
  }
});

/**
 * POST /api/lifecycle/ants/queen/:antId
 * Promote an adult worker ant to queen status
 */
router.post('/ants/queen/:antId', async (req, res) => {
  try {
    const { antId } = req.params;
    
    const antResult = await Ant.findById(antId);
    if (!antResult.data) {
      return res.status(404).json({
        success: false,
        error: 'Ant not found'
      });
    }
    
    const ant = antResult.data;
    
    if (ant.status !== 'adult') {
      return res.status(400).json({
        success: false,
        error: 'Only adult ants can become queens'
      });
    }
    
    if (ant.is_queen) {
      return res.status(400).json({
        success: false,
        error: 'Ant is already a queen'
      });
    }
    
    // Promote to queen
    await ant.updateDatabase({
      is_queen: true,
      type: 'queen',
      eggs_laid: 0,
      last_egg_production: 0,
      max_age_in_ticks: ant.calculateMaxAge()
    });
    
    res.json({
      success: true,
      message: `Ant ${antId} promoted to queen`,
      data: {
        antId,
        ant: ant.toJSON()
      }
    });
  } catch (error) {
    console.error('Error promoting ant to queen:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to promote ant to queen'
    });
  }
});

/**
 * POST /api/lifecycle/queen/:queenId/egg
 * Force queen to lay an egg (for testing)
 */
router.post('/queen/:queenId/egg', async (req, res) => {
  try {
    const { queenId } = req.params;
    
    const queenResult = await Ant.findById(queenId);
    if (!queenResult.data) {
      return res.status(404).json({
        success: false,
        error: 'Queen not found'
      });
    }
    
    const queen = queenResult.data;
    
    if (!queen.is_queen) {
      return res.status(400).json({
        success: false,
        error: 'Ant is not a queen'
      });
    }
    
    // Force egg production
    const eggData = queen.produceEgg();
    if (eggData) {
      const eggResult = await Ant.create(eggData);
      if (eggResult.data) {
        // Update queen
        await queen.updateDatabase({
          eggs_laid: queen.eggs_laid,
          last_egg_production: queen.last_egg_production
        });
        
        res.json({
          success: true,
          message: `Queen ${queenId} laid an egg`,
          data: {
            queenId,
            eggId: eggResult.data.id,
            egg: eggResult.data.toJSON(),
            queen: queen.toJSON()
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to create egg'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: 'Queen cannot produce egg right now'
      });
    }
  } catch (error) {
    console.error('Error making queen lay egg:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to make queen lay egg'
    });
  }
});

// ===== CONFIGURATION ROUTES =====

/**
 * GET /api/lifecycle/config
 * Get current lifecycle configuration
 */
router.get('/config', (req, res) => {
  try {
    res.json({
      success: true,
      data: LifecycleConfig
    });
  } catch (error) {
    console.error('Error getting lifecycle config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get lifecycle configuration'
    });
  }
});

/**
 * PUT /api/lifecycle/config
 * Update lifecycle configuration
 */
router.put('/config', (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration data'
      });
    }
    
    const manager = getLifecycleManager();
    manager.updateConfig(config);
    
    res.json({
      success: true,
      message: 'Lifecycle configuration updated',
      data: LifecycleConfig
    });
  } catch (error) {
    console.error('Error updating lifecycle config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update lifecycle configuration'
    });
  }
});

// ===== SIMULATION ROUTES =====

/**
 * POST /api/lifecycle/simulate/:colonyId
 * Run lifecycle simulation for a specific duration
 */
router.post('/simulate/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { ticks = 10 } = req.body;
    
    const manager = getLifecycleManager();
    
    // Temporarily register colony if not already registered
    const wasRegistered = manager.activeColonies.has(colonyId);
    if (!wasRegistered) {
      manager.registerColony(colonyId);
    }
    
    const events = [];
    const startStats = manager.getStatistics();
    
    // Run simulation for specified ticks
    for (let i = 0; i < ticks; i++) {
      await manager.processColonyLifecycle(colonyId);
    }
    
    const endStats = manager.getStatistics();
    
    // Unregister if we temporarily registered
    if (!wasRegistered) {
      manager.unregisterColony(colonyId);
    }
    
    res.json({
      success: true,
      message: `Simulated ${ticks} ticks for colony ${colonyId}`,
      data: {
        ticks,
        startStats: startStats.colonies[colonyId],
        endStats: endStats.colonies[colonyId],
        globalStats: endStats.global
      }
    });
  } catch (error) {
    console.error('Error running lifecycle simulation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run lifecycle simulation'
    });
  }
});

// Export router and manager functions
module.exports = {
  router,
  initializeLifecycleManager,
  getLifecycleManager
}; 
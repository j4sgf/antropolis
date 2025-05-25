const express = require('express');
const router = express.Router();
const ForagingManager = require('../models/ForagingManager');
const Ant = require('../models/Ant');
const Resource = require('../models/Resource');

// Global foraging manager instance (in production, this would be per-game-instance)
let globalForagingManager = null;

// Initialize foraging manager
function getForagingManager() {
  if (!globalForagingManager) {
    globalForagingManager = new ForagingManager(1000, 1000);
    console.log('🐜 Initialized global foraging manager');
  }
  return globalForagingManager;
}

// Initialize foraging for a colony
router.post('/colonies/:colonyId/initialize', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const foragingManager = getForagingManager();
    
    const result = await foragingManager.initializeColony(parseInt(colonyId));
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error initializing colony foraging:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize colony foraging'
    });
  }
});

// Get foraging statistics
router.get('/statistics', (req, res) => {
  try {
    const foragingManager = getForagingManager();
    const stats = foragingManager.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting foraging statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get foraging statistics'
    });
  }
});

// Get foraging statistics history
router.get('/statistics/history', (req, res) => {
  try {
    const { ticks = 10 } = req.query;
    const foragingManager = getForagingManager();
    const history = foragingManager.getStatisticsHistory(parseInt(ticks));
    
    res.json({
      success: true,
      data: {
        history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('Error getting foraging statistics history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get foraging statistics history'
    });
  }
});

// Get pheromone visualization data
router.get('/pheromones', (req, res) => {
  try {
    const { x, y, radius = 200, minStrength = 15 } = req.query;
    
    if (!x || !y) {
      return res.status(400).json({
        success: false,
        error: 'Center coordinates (x, y) are required'
      });
    }
    
    const foragingManager = getForagingManager();
    const visualData = foragingManager.getPheromoneVisualization(
      parseFloat(x),
      parseFloat(y),
      parseFloat(radius),
      parseFloat(minStrength)
    );
    
    res.json({
      success: true,
      data: {
        pheromones: visualData,
        center: { x: parseFloat(x), y: parseFloat(y) },
        radius: parseFloat(radius),
        minStrength: parseFloat(minStrength),
        count: visualData.length
      }
    });
  } catch (error) {
    console.error('Error getting pheromone visualization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pheromone visualization'
    });
  }
});

// Add ant to foraging system
router.post('/ants', async (req, res) => {
  try {
    const { colony_id, type = 'worker', x, y } = req.body;
    
    if (!colony_id || !x || !y) {
      return res.status(400).json({
        success: false,
        error: 'Colony ID and position (x, y) are required'
      });
    }
    
    const foragingManager = getForagingManager();
    
    const antData = {
      colony_id: parseInt(colony_id),
      type,
      x: parseFloat(x),
      y: parseFloat(y),
      state: 'idle',
      health: 100,
      energy: 100
    };
    
    const result = await foragingManager.addAnt(antData);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.status(201).json({
      success: true,
      data: result.ant.toJSON()
    });
  } catch (error) {
    console.error('Error adding ant to foraging system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add ant to foraging system'
    });
  }
});

// Get detailed ant information
router.get('/ants/:antId', (req, res) => {
  try {
    const { antId } = req.params;
    const foragingManager = getForagingManager();
    
    const details = foragingManager.getAntDetails(parseInt(antId));
    
    if (details.error) {
      return res.status(404).json({
        success: false,
        error: details.error
      });
    }
    
    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error('Error getting ant details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ant details'
    });
  }
});

// Remove ant from foraging system
router.delete('/ants/:antId', (req, res) => {
  try {
    const { antId } = req.params;
    const foragingManager = getForagingManager();
    
    const result = foragingManager.removeAnt(parseInt(antId));
    
    if (result.error) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error removing ant from foraging system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove ant from foraging system'
    });
  }
});

// Place scent marker (player interaction)
router.post('/scent-marker', (req, res) => {
  try {
    const { x, y, type = 'FOOD_TRAIL', strength = 200 } = req.body;
    
    if (!x || !y) {
      return res.status(400).json({
        success: false,
        error: 'Position (x, y) is required'
      });
    }
    
    const foragingManager = getForagingManager();
    const result = foragingManager.placeScentMarker(
      parseFloat(x),
      parseFloat(y),
      type,
      parseFloat(strength)
    );
    
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error placing scent marker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place scent marker'
    });
  }
});

// Clear pheromone area (player interaction)
router.post('/clear-pheromones', (req, res) => {
  try {
    const { x, y, radius = 20 } = req.body;
    
    if (!x || !y) {
      return res.status(400).json({
        success: false,
        error: 'Position (x, y) is required'
      });
    }
    
    const foragingManager = getForagingManager();
    const result = foragingManager.clearPheromoneArea(
      parseFloat(x),
      parseFloat(y),
      parseFloat(radius)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error clearing pheromone area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear pheromone area'
    });
  }
});

// Manual simulation tick (for testing)
router.post('/tick', async (req, res) => {
  try {
    const { tick } = req.body;
    const currentTick = tick || Date.now();
    
    const foragingManager = getForagingManager();
    const result = await foragingManager.tick(currentTick);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error processing foraging tick:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process foraging tick'
    });
  }
});

// Reset foraging system (for testing)
router.post('/reset', (req, res) => {
  try {
    const foragingManager = getForagingManager();
    const result = foragingManager.reset();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error resetting foraging system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset foraging system'
    });
  }
});

// Get ant states and types
router.get('/config/ant-types', (req, res) => {
  try {
    const states = Ant.getAntStates();
    const types = Ant.getAntTypes();
    
    res.json({
      success: true,
      data: {
        states,
        types
      }
    });
  } catch (error) {
    console.error('Error getting ant configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ant configuration'
    });
  }
});

// Get pheromone types configuration
router.get('/config/pheromone-types', (req, res) => {
  try {
    const PheromoneMap = require('../models/PheromoneMap');
    const pheromoneTypes = PheromoneMap.getPheromoneTypes();
    
    res.json({
      success: true,
      data: {
        pheromoneTypes
      }
    });
  } catch (error) {
    console.error('Error getting pheromone configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pheromone configuration'
    });
  }
});

// Get foraging system status
router.get('/status', (req, res) => {
  try {
    const foragingManager = getForagingManager();
    const stats = foragingManager.getStatistics();
    
    res.json({
      success: true,
      data: {
        initialized: true,
        status: 'active',
        lastTick: stats.tick,
        activeColonies: stats.colonies.active,
        totalAnts: stats.ants.total,
        mapResources: stats.resources.mapNodes,
        pheromoneActivity: stats.pheromones.activeCells
      }
    });
  } catch (error) {
    console.error('Error getting foraging system status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get foraging system status',
      data: {
        initialized: false,
        status: 'error'
      }
    });
  }
});

/**
 * GET /api/foraging/colony/:colonyId/statistics
 * Get foraging statistics for a colony
 */
router.get('/colony/:colonyId/statistics', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    // Initialize colony if not already done
    await foragingManager.initializeColony(colonyId);
    
    const stats = foragingManager.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting foraging statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get foraging statistics'
    });
  }
});

/**
 * GET /api/foraging/colony/:colonyId/pheromones
 * Get pheromone visualization data for a colony
 */
router.get('/colony/:colonyId/pheromones', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { 
      centerX = 400, 
      centerY = 300, 
      radius = 200,
      minStrength = 15 
    } = req.query;

    // Initialize colony if not already done
    await foragingManager.initializeColony(colonyId);
    
    const pheromoneData = foragingManager.getPheromoneVisualization(
      parseInt(centerX),
      parseInt(centerY),
      parseInt(radius),
      parseInt(minStrength)
    );
    
    res.json({
      success: true,
      data: pheromoneData
    });
  } catch (error) {
    console.error('Error getting pheromone data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pheromone visualization data'
    });
  }
});

/**
 * GET /api/foraging/colony/:colonyId/resource-scan
 * Scan for resource-rich areas around a position
 */
router.get('/colony/:colonyId/resource-scan', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { 
      centerX = 400, 
      centerY = 300, 
      radius = 300,
      types = 'LEAVES,FUNGUS,SEEDS,INSECT_REMAINS,NECTAR',
      timeOfDay = 'day'
    } = req.query;

    // Initialize colony if not already done
    await foragingManager.initializeColony(colonyId);
    
    // Mock resource scanning implementation
    const resourceTypes = types.split(',');
    const areas = [];
    const numAreas = Math.floor(Math.random() * 8) + 3; // 3-10 areas
    
    for (let i = 0; i < numAreas; i++) {
      // Generate random position within scan radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * parseInt(radius);
      const x = parseInt(centerX) + Math.cos(angle) * distance;
      const y = parseInt(centerY) + Math.sin(angle) * distance;
      
      const primaryType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const density = Math.random() * 100;
      const baseQuantity = Math.floor(density * 2 + 10);
      
      // Time of day modifiers
      let timeModifiers = [];
      let adjustedQuantity = baseQuantity;
      
      switch (timeOfDay) {
        case 'dawn':
          if (primaryType === 'NECTAR') {
            timeModifiers.push('+15% nectar freshness');
            adjustedQuantity *= 1.15;
          }
          break;
        case 'day':
          timeModifiers.push('Optimal visibility');
          adjustedQuantity *= 1.0;
          break;
        case 'dusk':
          if (primaryType === 'INSECT_REMAINS') {
            timeModifiers.push('+10% insect activity');
            adjustedQuantity *= 1.1;
          }
          break;
        case 'night':
          timeModifiers.push('-20% visibility');
          adjustedQuantity *= 0.8;
          if (primaryType === 'FUNGUS') {
            timeModifiers.push('+25% fungus growth');
            adjustedQuantity *= 1.25;
          }
          break;
      }
      
      areas.push({
        x: Math.round(x),
        y: Math.round(y),
        primaryType,
        density: Math.round(density),
        estimatedQuantity: Math.round(adjustedQuantity),
        timeModifiers: timeModifiers.length > 0 ? timeModifiers : null
      });
    }
    
    // Calculate summary statistics
    const totalResources = areas.reduce((sum, area) => sum + area.estimatedQuantity, 0);
    const averageDensity = areas.reduce((sum, area) => sum + area.density, 0) / areas.length;
    
    // Find dominant resource type
    const typeCounts = {};
    areas.forEach(area => {
      typeCounts[area.primaryType] = (typeCounts[area.primaryType] || 0) + 1;
    });
    const dominantType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b
    );
    
    const summary = {
      areasFound: areas.length,
      totalResources,
      averageDensity,
      dominantType,
      scanRadius: parseInt(radius),
      timeOfDay
    };
    
    res.json({
      success: true,
      data: {
        areas: areas.sort((a, b) => b.density - a.density), // Sort by density
        summary
      }
    });
  } catch (error) {
    console.error('Error scanning for resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan for resources'
    });
  }
});

/**
 * POST /api/foraging/colony/:colonyId/optimize-routes
 * Run route optimization algorithms
 */
router.post('/colony/:colonyId/optimize-routes', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { 
      algorithm = 'ant_colony_optimization',
      weights = {},
      iterations = 100,
      considerTimeOfDay = true 
    } = req.body;

    // Initialize colony if not already done
    await foragingManager.initializeColony(colonyId);
    
    // Mock optimization implementation
    // In a real implementation, this would run actual optimization algorithms
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // Simulate processing time
    
    const optimizationResults = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      algorithm,
      timestamp: new Date().toISOString(),
      efficiencyGain: Math.random() * 25 + 5, // 5-30% improvement
      averagePathLength: Math.random() * 50 + 100, // 100-150 units
      timeReduction: Math.random() * 20 + 10, // 10-30% time reduction
      energyScore: Math.random() * 3 + 7, // 7-10 out of 10
      iterations: parseInt(iterations),
      weights,
      considerTimeOfDay,
      recommendations: [
        'Strengthen food trails near resource cluster at (350, 280)',
        'Reduce exploration pheromones in depleted eastern sector',
        'Increase scout activity during dawn hours for nectar discovery'
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      recommendedPheromonePattern: {
        // Mock pheromone adjustments
        foodTrailBoosts: [
          { x: 350, y: 280, strength: 180 },
          { x: 420, y: 310, strength: 150 }
        ],
        explorationReductions: [
          { x: 600, y: 400, reduction: 0.5 }
        ]
      }
    };
    
    res.json({
      success: true,
      data: optimizationResults
    });
  } catch (error) {
    console.error('Error running route optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run route optimization'
    });
  }
});

/**
 * POST /api/foraging/colony/:colonyId/apply-optimization
 * Apply optimization results to the pheromone map
 */
router.post('/colony/:colonyId/apply-optimization', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { optimizationId, newPheromonePattern } = req.body;

    // Initialize colony if not already done
    await foragingManager.initializeColony(colonyId);
    
    // Apply pheromone pattern changes
    if (newPheromonePattern) {
      // Apply food trail boosts
      if (newPheromonePattern.foodTrailBoosts) {
        newPheromonePattern.foodTrailBoosts.forEach(boost => {
          foragingManager.pheromoneMap.layPheromone(
            boost.x, 
            boost.y, 
            'FOOD_TRAIL', 
            boost.strength
          );
        });
      }
      
      // Apply exploration reductions
      if (newPheromonePattern.explorationReductions) {
        newPheromonePattern.explorationReductions.forEach(reduction => {
          const currentStrength = foragingManager.pheromoneMap.getPheromoneStrength(
            reduction.x, 
            reduction.y, 
            'EXPLORATION_TRAIL'
          );
          const newStrength = currentStrength * (1 - reduction.reduction);
          
          // Clear and re-lay with reduced strength
          foragingManager.pheromoneMap.layPheromone(
            reduction.x, 
            reduction.y, 
            'EXPLORATION_TRAIL', 
            newStrength - currentStrength
          );
        });
      }
    }
    
    console.log(`✅ Applied optimization ${optimizationId} for colony ${colonyId}`);
    
    res.json({
      success: true,
      data: {
        optimizationId,
        appliedAt: new Date().toISOString(),
        changesApplied: {
          foodTrailBoosts: newPheromonePattern?.foodTrailBoosts?.length || 0,
          explorationReductions: newPheromonePattern?.explorationReductions?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error applying optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply optimization'
    });
  }
});

/**
 * GET /api/foraging/colony/:colonyId/route-history
 * Get optimization history for a colony
 */
router.get('/colony/:colonyId/route-history', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    // Mock history data
    const history = [
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        efficiencyGain: 18.5,
        algorithm: 'ant_colony_optimization'
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        efficiencyGain: 12.3,
        algorithm: 'a_star_enhanced'
      },
      {
        timestamp: new Date(Date.now() - 300000).toISOString(),
        efficiencyGain: 21.7,
        algorithm: 'genetic_algorithm'
      }
    ];
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting route history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get route history'
    });
  }
});

/**
 * POST /api/foraging/colony/:colonyId/scent-marker
 * Place a player scent marker (for minimal player interaction)
 */
router.post('/colony/:colonyId/scent-marker', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { x, y, type = 'FOOD_TRAIL', strength = 200 } = req.body;

    // Initialize colony if not already done
    await foragingManager.initializeColony(colonyId);
    
    const result = foragingManager.placeScentMarker(
      parseInt(x), 
      parseInt(y), 
      type, 
      parseInt(strength)
    );
    
    if (result.success) {
      res.json({
        success: true,
        data: result
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error placing scent marker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place scent marker'
    });
  }
});

/**
 * DELETE /api/foraging/colony/:colonyId/clear-area
 * Clear pheromones in an area (for player path blocking)
 */
router.delete('/colony/:colonyId/clear-area', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { x, y, radius = 20 } = req.body;

    // Initialize colony if not already done
    await foragingManager.initializeColony(colonyId);
    
    const result = foragingManager.clearPheromoneArea(
      parseInt(x), 
      parseInt(y), 
      parseInt(radius)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error clearing pheromone area:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear pheromone area'
    });
  }
});

module.exports = router; 
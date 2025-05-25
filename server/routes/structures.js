const express = require('express');
const router = express.Router();
const Structure = require('../models/Structure');
const ConstructionManager = require('../services/ConstructionManager');
const StructureEventManager = require('../services/StructureEventManager');
const { handleDatabaseError } = require('../config/database');

/**
 * GET /api/structures/types
 * Get all available structure types and their properties
 */
router.get('/types', (req, res) => {
  try {
    const structureTypes = Structure.getStructureTypes();
    
    res.json({
      success: true,
      data: {
        types: structureTypes,
        count: Object.keys(structureTypes).length
      }
    });
  } catch (error) {
    console.error('Error getting structure types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve structure types'
    });
  }
});

/**
 * GET /api/structures/types/:type
 * Get details for a specific structure type
 */
router.get('/types/:type', (req, res) => {
  try {
    const { type } = req.params;
    const structureTypes = Structure.getStructureTypes();
    const structureType = structureTypes[type.toUpperCase()];
    
    if (!structureType) {
      return res.status(404).json({
        success: false,
        error: 'Structure type not found'
      });
    }
    
    res.json({
      success: true,
      data: structureType
    });
  } catch (error) {
    console.error('Error getting structure type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve structure type'
    });
  }
});

/**
 * GET /api/colonies/:colonyId/structures
 * Get all structures for a specific colony
 */
router.get('/colonies/:colonyId/structures', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { active_only } = req.query;
    
    const result = await Structure.findByColonyId(colonyId);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    let structures = result.data;
    
    // Filter by active status if requested
    if (active_only === 'true') {
      structures = structures.filter(structure => structure.is_active);
    }
    
    // Get construction stats
    const constructionStats = ConstructionManager.getConstructionStats(colonyId);
    
    res.json({
      success: true,
      data: {
        structures: structures.map(s => s.toJSON()),
        construction: constructionStats,
        total_count: structures.length,
        active_count: structures.filter(s => s.is_active).length
      }
    });
  } catch (error) {
    console.error('Error getting colony structures:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve colony structures'
    });
  }
});

/**
 * GET /api/colonies/:colonyId/structures/:structureId
 * Get details for a specific structure
 */
router.get('/colonies/:colonyId/structures/:structureId', async (req, res) => {
  try {
    const { structureId } = req.params;
    
    const result = await Structure.findById(structureId);
    
    if (result.error) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
    
    // Get construction project if in progress
    const constructionProject = ConstructionManager.getProject(structureId);
    
    res.json({
      success: true,
      data: {
        structure: result.data.toJSON(),
        construction: constructionProject
      }
    });
  } catch (error) {
    console.error('Error getting structure details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve structure details'
    });
  }
});

/**
 * POST /api/colonies/:colonyId/structures
 * Start construction of a new structure
 */
router.post('/colonies/:colonyId/structures', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { type, position_x, position_y, level = 1, workers_assigned = 1 } = req.body;
    
    // Validate required fields
    if (!type || position_x === undefined || position_y === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, position_x, position_y'
      });
    }
    
    // Validate structure type
    const structureTypes = Structure.getStructureTypes();
    if (!structureTypes[type.toUpperCase()]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid structure type'
      });
    }
    
    // Check if position is available
    const placementCheck = await Structure.canPlaceAt(
      colonyId, 
      position_x, 
      position_y, 
      1, 
      1
    );
    
    if (placementCheck.error || !placementCheck.data) {
      return res.status(400).json({
        success: false,
        error: placementCheck.error || 'Position is not available'
      });
    }
    
    // Validate resources
    const resourceCheck = await ConstructionManager.validateConstructionResources(
      colonyId, 
      type.toUpperCase(), 
      level
    );
    
    if (!resourceCheck.success) {
      return res.status(400).json({
        success: false,
        error: resourceCheck.error,
        data: resourceCheck.data
      });
    }
    
    // Create structure in database
    const structureResult = await Structure.build(
      colonyId,
      type.toUpperCase(),
      position_x,
      position_y,
      level
    );
    
    if (structureResult.error) {
      // Rollback resource consumption if structure creation fails
      console.error('Structure creation failed, should rollback resources:', structureResult.error);
      return res.status(400).json({
        success: false,
        error: structureResult.error
      });
    }
    
    // Consume resources
    const consumeResult = await ConstructionManager.consumeConstructionResources(
      colonyId,
      type.toUpperCase(),
      level
    );
    
    if (!consumeResult.success) {
      // Rollback structure creation if resource consumption fails
      await structureResult.data.demolish();
      return res.status(400).json({
        success: false,
        error: consumeResult.error
      });
    }
    
    // Start construction project
    const constructionResult = await ConstructionManager.startConstruction(
      colonyId,
      structureResult.data.id,
      type.toUpperCase(),
      level,
      workers_assigned
    );
    
    if (!constructionResult.success) {
      // Cleanup structure if construction fails
      await structureResult.data.demolish();
      return res.status(400).json({
        success: false,
        error: constructionResult.error
      });
    }
    
    // Trigger structure built event
    StructureEventManager.triggerStructureBuilt({
      colonyId,
      structureId: structureResult.data.id,
      structureName: structureResult.data.name,
      structureType: type.toUpperCase(),
      level,
      position: { x: position_x, y: position_y },
      workersAssigned: workers_assigned
    });
    
    res.status(201).json({
      success: true,
      data: {
        structure: structureResult.data.toJSON(),
        construction: constructionResult.data,
        resources_consumed: consumeResult.data.consumed
      }
    });
  } catch (error) {
    console.error('Error starting structure construction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start structure construction'
    });
  }
});

/**
 * PUT /api/colonies/:colonyId/structures/:structureId
 * Update structure (repair, assign workers, etc.)
 */
router.put('/colonies/:colonyId/structures/:structureId', async (req, res) => {
  try {
    const { structureId } = req.params;
    const { action, workers, health_amount } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required (assign_workers, repair, upgrade)'
      });
    }
    
    const structureResult = await Structure.findById(structureId);
    if (structureResult.error) {
      return res.status(404).json({
        success: false,
        error: structureResult.error
      });
    }
    
    const structure = structureResult.data;
    let result;
    
    switch (action) {
      case 'assign_workers':
        if (workers === undefined) {
          return res.status(400).json({
            success: false,
            error: 'Worker count is required for worker assignment'
          });
        }
        
        result = await ConstructionManager.assignWorkers(structureId, workers);
        break;
        
      case 'repair':
        if (health_amount === undefined) {
          return res.status(400).json({
            success: false,
            error: 'Health amount is required for repair'
          });
        }
        
        result = await structure.repair(health_amount);
        break;
        
      case 'upgrade':
        // Check if upgrade is possible
        const upgradeCheck = await ConstructionManager.validateConstructionResources(
          structure.colony_id,
          structure.building_type,
          structure.level + 1
        );
        
        if (!upgradeCheck.success) {
          return res.status(400).json({
            success: false,
            error: upgradeCheck.error,
            data: upgradeCheck.data
          });
        }
        
        // Consume upgrade resources
        const consumeResult = await ConstructionManager.consumeConstructionResources(
          structure.colony_id,
          structure.building_type,
          structure.level + 1
        );
        
        if (!consumeResult.success) {
          return res.status(400).json({
            success: false,
            error: consumeResult.error
          });
        }
        
        // Start upgrade
        result = await structure.upgrade();
        
        if (result.data) {
          // Start construction project for upgrade
          await ConstructionManager.startConstruction(
            structureId,
            structure.colony_id,
            structure.building_type,
            1 // Default worker assignment
          );
        }
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Supported actions: assign_workers, repair, upgrade'
        });
    }
    
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: {
        structure: result.data ? result.data.toJSON() : structure.toJSON(),
        action_performed: action
      }
    });
  } catch (error) {
    console.error('Error updating structure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update structure'
    });
  }
});

/**
 * DELETE /api/colonies/:colonyId/structures/:structureId
 * Demolish a structure
 */
router.delete('/colonies/:colonyId/structures/:structureId', async (req, res) => {
  try {
    const { structureId } = req.params;
    
    // Cancel construction if in progress
    await ConstructionManager.cancelConstruction(structureId);
    
    const result = await Structure.findById(structureId);
    if (result.error) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }
    
    const demolishResult = await result.data.demolish();
    
    if (demolishResult.error) {
      return res.status(500).json({
        success: false,
        error: demolishResult.error
      });
    }
    
    res.json({
      success: true,
      data: demolishResult.data
    });
  } catch (error) {
    console.error('Error demolishing structure:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to demolish structure'
    });
  }
});

/**
 * GET /api/colonies/:colonyId/structures/effects
 * Get total colony effects from all active structures
 */
router.get('/colonies/:colonyId/structures/effects', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    const result = await Structure.getTotalColonyEffects(colonyId);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: {
        total_effects: result.data,
        calculated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error calculating colony effects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate colony effects'
    });
  }
});

/**
 * POST /api/colonies/:colonyId/structures/validate-placement
 * Validate if a structure can be placed at a specific position
 */
router.post('/colonies/:colonyId/structures/validate-placement', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { type, position_x, position_y, width = 1, height = 1 } = req.body;
    
    if (!type || position_x === undefined || position_y === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Structure type and position are required'
      });
    }
    
    // Check placement validity
    const placementResult = await Structure.canPlaceAt(
      colonyId,
      position_x,
      position_y,
      width,
      height
    );
    
    // Check resource requirements
    const resourceResult = await ConstructionManager.validateConstructionResources(
      colonyId,
      type.toUpperCase(),
      1
    );
    
    res.json({
      success: true,
      data: {
        can_place: placementResult.data && resourceResult.success,
        placement_valid: placementResult.data,
        placement_error: placementResult.error,
        resources_sufficient: resourceResult.success,
        resource_error: resourceResult.error,
        resource_requirements: resourceResult.data
      }
    });
  } catch (error) {
    console.error('Error validating structure placement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate structure placement'
    });
  }
});

/**
 * GET /api/colonies/:colonyId/structures/construction-stats
 * Get construction statistics for a colony
 */
router.get('/colonies/:colonyId/structures/construction-stats', (req, res) => {
  try {
    const { colonyId } = req.params;
    const stats = ConstructionManager.getConstructionStats(colonyId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting construction stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve construction statistics'
    });
  }
});

/**
 * POST /api/structures/construction/process-tick
 * Manual trigger for construction processing (for testing)
 */
router.post('/construction/process-tick', async (req, res) => {
  try {
    const completedProjects = await ConstructionManager.processConstructionTick();
    
    res.json({
      success: true,
      data: {
        completed_projects: completedProjects,
        processed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing construction tick:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process construction tick'
    });
  }
});

/**
 * GET /api/structures/construction/status
 * Get global construction system status
 */
router.get('/construction/status', (req, res) => {
  try {
    const allProjects = ConstructionManager.getAllProjects();
    
    res.json({
      success: true,
      data: {
        active_projects: allProjects,
        total_projects: allProjects.length,
        colonies_with_construction: new Set(allProjects.map(p => p.colonyId)).size,
        system_running: ConstructionManager.processingInterval !== null
      }
    });
  } catch (error) {
    console.error('Error getting construction status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get construction system status'
    });
  }
});

// Get colony structure effects and bonuses
router.get('/colonies/:colonyId/effects', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    const effectsManager = require('../services/StructureEffectsManager');
    const result = await effectsManager.calculateColonyEffects(colonyId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        colonyId,
        effects: result.data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting colony effects:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get detailed structure bonus breakdown
router.get('/colonies/:colonyId/bonus-breakdown', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    const effectsManager = require('../services/StructureEffectsManager');
    const result = await effectsManager.getStructureBonusBreakdown(colonyId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        colonyId,
        structures: result.data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting bonus breakdown:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Apply effects to colony stats
router.post('/colonies/:colonyId/apply-effects', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    const effectsManager = require('../services/StructureEffectsManager');
    const result = await effectsManager.applyEffectsToColony(colonyId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Colony effects applied successfully'
    });
  } catch (error) {
    console.error('Error applying colony effects:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Apply damage to colony structures
router.post('/colonies/:colonyId/damage', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const damageEvent = req.body;
    
    const effectsManager = require('../services/StructureEffectsManager');
    const result = await effectsManager.applyStructureDamage(colonyId, damageEvent);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Damage applied to structures'
    });
  } catch (error) {
    console.error('Error applying structure damage:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Process structure maintenance
router.post('/colonies/:colonyId/maintenance', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    const effectsManager = require('../services/StructureEffectsManager');
    const result = await effectsManager.processStructureMaintenance(colonyId);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Structure maintenance processed'
    });
  } catch (error) {
    console.error('Error processing maintenance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Repair specific structure
router.post('/colonies/:colonyId/structures/:structureId/repair', async (req, res) => {
  try {
    const { colonyId, structureId } = req.params;
    const { repairAmount = 25 } = req.body;
    
    const structure = await Structure.findById(structureId);
    if (structure.error) {
      return res.status(404).json({
        success: false,
        error: 'Structure not found'
      });
    }

    if (structure.data.colony_id !== colonyId) {
      return res.status(403).json({
        success: false,
        error: 'Structure does not belong to this colony'
      });
    }

    const oldHealth = structure.data.health;
    const result = await structure.data.repair(repairAmount);
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Trigger structure repaired event
    StructureEventManager.triggerStructureRepaired({
      colonyId,
      structureId,
      structureName: structure.data.name,
      structureType: structure.data.building_type,
      repairAmount,
      oldHealth,
      newHealth: result.data.health
    });

    res.json({
      success: true,
      data: result.data.toJSON(),
      message: `Structure repaired by ${repairAmount} health points`
    });
  } catch (error) {
    console.error('Error repairing structure:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Damage specific structure
router.post('/colonies/:colonyId/structures/:structureId/damage', async (req, res) => {
  try {
    const { colonyId, structureId } = req.params;
    const { damageAmount = 10 } = req.body;
    
    const structure = await Structure.findById(structureId);
    if (structure.error) {
      return res.status(404).json({
        success: false,
        error: 'Structure not found'
      });
    }

    if (structure.data.colony_id !== colonyId) {
      return res.status(403).json({
        success: false,
        error: 'Structure does not belong to this colony'
      });
    }

    const oldHealth = structure.data.health;
    const result = await structure.data.takeDamage(damageAmount);
    if (result.error) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Trigger structure damaged event
    StructureEventManager.triggerStructureDamaged({
      colonyId,
      structureId,
      structureName: structure.data.name,
      structureType: structure.data.building_type,
      damageAmount,
      oldHealth,
      newHealth: result.data.health,
      reason: 'manual'
    });

    res.json({
      success: true,
      data: result.data.toJSON(),
      message: `Structure took ${damageAmount} damage`
    });
  } catch (error) {
    console.error('Error damaging structure:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router; 
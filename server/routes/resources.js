const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const ColonyResource = require('../models/ColonyResource');
const Colony = require('../models/Colony');
const { ResourceEventManager, ConversionRecipes, RandomEvents } = require('../services/ResourceEventManager');

// Get all resource types configuration
router.get('/types', async (req, res) => {
  try {
    const resourceTypes = Resource.getResourceTypes();
    const storageZones = ColonyResource.getStorageZones();
    
    res.json({
      success: true,
      data: {
        resourceTypes,
        storageZones
      }
    });
  } catch (error) {
    console.error('Error fetching resource types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource types'
    });
  }
});

// Get resources in a specific area of the map
router.get('/map', async (req, res) => {
  try {
    const { x, y, radius = 50 } = req.query;
    
    if (!x || !y) {
      return res.status(400).json({
        success: false,
        error: 'Position coordinates (x, y) are required'
      });
    }

    const result = await Resource.findInArea(
      parseFloat(x), 
      parseFloat(y), 
      parseFloat(radius)
    );

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const resources = result.data.map(resource => resource.toJSON());
    
    res.json({
      success: true,
      data: {
        resources,
        area: { x: parseFloat(x), y: parseFloat(y), radius: parseFloat(radius) },
        count: resources.length
      }
    });
  } catch (error) {
    console.error('Error fetching map resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch map resources'
    });
  }
});

// Get specific resource by ID
router.get('/map/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Resource.findById(id);
    
    if (result.error) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data.toJSON()
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resource'
    });
  }
});

// Create new resource on map
router.post('/map', async (req, res) => {
  try {
    const { type, quantity, location_x, location_y, spawn_rate } = req.body;
    
    if (!type || !location_x || !location_y) {
      return res.status(400).json({
        success: false,
        error: 'Resource type and location are required'
      });
    }

    const resourceData = {
      type,
      quantity: quantity || 50,
      location_x: parseFloat(location_x),
      location_y: parseFloat(location_y),
      spawn_rate: spawn_rate || 1.0,
      quality: 100
    };

    const result = await Resource.create(resourceData);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data.toJSON()
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create resource'
    });
  }
});

// Generate random resources in an area
router.post('/map/generate', async (req, res) => {
  try {
    const { center_x, center_y, radius = 100, count = 20 } = req.body;
    
    if (!center_x || !center_y) {
      return res.status(400).json({
        success: false,
        error: 'Center coordinates are required'
      });
    }

    const result = await Resource.generateInArea(
      parseFloat(center_x),
      parseFloat(center_y),
      parseFloat(radius),
      parseInt(count)
    );

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const resources = result.data.map(resource => resource.toJSON());
    
    res.status(201).json({
      success: true,
      data: {
        resources,
        generated: resources.length,
        area: { 
          center_x: parseFloat(center_x), 
          center_y: parseFloat(center_y), 
          radius: parseFloat(radius) 
        }
      }
    });
  } catch (error) {
    console.error('Error generating resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate resources'
    });
  }
});

// Harvest resource from map
router.post('/map/:id/harvest', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, colony_id } = req.body;
    
    if (!amount || !colony_id) {
      return res.status(400).json({
        success: false,
        error: 'Harvest amount and colony ID are required'
      });
    }

    // Find the resource
    const resourceResult = await Resource.findById(id);
    if (resourceResult.error) {
      return res.status(404).json({
        success: false,
        error: resourceResult.error
      });
    }

    const resource = resourceResult.data;
    const harvestAmount = Math.min(parseInt(amount), resource.quantity);

    if (harvestAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No resources available to harvest'
      });
    }

    // Harvest from map resource
    const harvestResult = await resource.harvest(harvestAmount);
    if (harvestResult.error) {
      return res.status(500).json({
        success: false,
        error: harvestResult.error
      });
    }

    // Add to colony storage
    const addResult = await ColonyResource.addToColony(
      colony_id, 
      resource.type, 
      harvestAmount, 
      resource.quality
    );

    if (addResult.error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to add resources to colony storage'
      });
    }

    res.json({
      success: true,
      data: {
        harvested: harvestAmount,
        resourceType: resource.type,
        quality: resource.quality,
        mapResource: harvestResult.data.toJSON(),
        colonyResource: addResult.data.toJSON()
      }
    });
  } catch (error) {
    console.error('Error harvesting resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to harvest resource'
    });
  }
});

// Get colony storage summary
router.get('/colony/:colonyId/storage', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    const result = await ColonyResource.getStorageSummary(colonyId);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching colony storage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch colony storage'
    });
  }
});

// Get specific colony resources
router.get('/colony/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { type, zone } = req.query;
    
    let result;
    
    if (type) {
      result = await ColonyResource.findByColonyAndType(colonyId, type, zone);
      if (result.data) {
        result.data = [result.data];
      } else {
        result.data = [];
      }
    } else {
      result = await ColonyResource.findByColonyId(colonyId);
    }

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const resources = result.data.map(resource => resource.toJSON());
    
    res.json({
      success: true,
      data: {
        resources,
        count: resources.length
      }
    });
  } catch (error) {
    console.error('Error fetching colony resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch colony resources'
    });
  }
});

// Add resources to colony storage
router.post('/colony/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { resource_type, quantity, quality = 100, storage_zone = 'general' } = req.body;
    
    if (!resource_type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Resource type and quantity are required'
      });
    }

    const result = await ColonyResource.addToColony(
      colonyId,
      resource_type,
      parseInt(quantity),
      parseFloat(quality),
      storage_zone
    );

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      data: result.data.toJSON()
    });
  } catch (error) {
    console.error('Error adding resources to colony:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add resources to colony'
    });
  }
});

// Transfer resources between storage zones
router.post('/colony/:colonyId/transfer', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { resource_id, target_zone, amount } = req.body;
    
    if (!resource_id || !target_zone) {
      return res.status(400).json({
        success: false,
        error: 'Resource ID and target zone are required'
      });
    }

    const resourceResult = await ColonyResource.findById(resource_id);
    if (resourceResult.error) {
      return res.status(404).json({
        success: false,
        error: resourceResult.error
      });
    }

    const resource = resourceResult.data;
    
    // Verify resource belongs to this colony
    if (resource.colony_id !== parseInt(colonyId)) {
      return res.status(403).json({
        success: false,
        error: 'Resource does not belong to this colony'
      });
    }

    const result = await resource.moveToZone(target_zone, amount ? parseInt(amount) : null);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data.toJSON()
    });
  } catch (error) {
    console.error('Error transferring resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to transfer resources'
    });
  }
});

// Reserve resources for tasks
router.post('/colony/:colonyId/reserve', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { resource_id, amount } = req.body;
    
    if (!resource_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Resource ID and amount are required'
      });
    }

    const resourceResult = await ColonyResource.findById(resource_id);
    if (resourceResult.error) {
      return res.status(404).json({
        success: false,
        error: resourceResult.error
      });
    }

    const resource = resourceResult.data;
    
    // Verify resource belongs to this colony
    if (resource.colony_id !== parseInt(colonyId)) {
      return res.status(403).json({
        success: false,
        error: 'Resource does not belong to this colony'
      });
    }

    const result = await resource.reserveQuantity(parseInt(amount));
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data.toJSON()
    });
  } catch (error) {
    console.error('Error reserving resources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reserve resources'
    });
  }
});

// Apply decay to all colony resources
router.post('/colony/:colonyId/decay', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    const resourcesResult = await ColonyResource.findByColonyId(colonyId);
    if (resourcesResult.error) {
      return res.status(500).json({
        success: false,
        error: resourcesResult.error
      });
    }

    const decayResults = [];
    for (const resource of resourcesResult.data) {
      const result = await resource.applyDecay();
      if (result.data) {
        decayResults.push({
          resourceId: resource.id,
          type: resource.resource_type,
          oldQuality: resource.quality,
          newQuality: result.data.quality,
          decayAmount: resource.quality - result.data.quality
        });
      }
    }

    res.json({
      success: true,
      data: {
        processedResources: decayResults.length,
        decayResults
      }
    });
  } catch (error) {
    console.error('Error applying decay:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply decay to resources'
    });
  }
});

// Delete colony resource
router.delete('/colony/:colonyId/:resourceId', async (req, res) => {
  try {
    const { colonyId, resourceId } = req.params;
    
    const resourceResult = await ColonyResource.findById(resourceId);
    if (resourceResult.error) {
      return res.status(404).json({
        success: false,
        error: resourceResult.error
      });
    }

    const resource = resourceResult.data;
    
    // Verify resource belongs to this colony
    if (resource.colony_id !== parseInt(colonyId)) {
      return res.status(403).json({
        success: false,
        error: 'Resource does not belong to this colony'
      });
    }

    const result = await resource.delete();
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error deleting colony resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete colony resource'
    });
  }
});

// Update map resource (regeneration, quality changes)
router.put('/map/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const resourceResult = await Resource.findById(id);
    if (resourceResult.error) {
      return res.status(404).json({
        success: false,
        error: resourceResult.error
      });
    }

    const result = await resourceResult.data.update(updateData);
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data.toJSON()
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update resource'
    });
  }
});

// Regenerate map resource
router.post('/map/:id/regenerate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const resourceResult = await Resource.findById(id);
    if (resourceResult.error) {
      return res.status(404).json({
        success: false,
        error: resourceResult.error
      });
    }

    const result = await resourceResult.data.regenerate();
    
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data.toJSON()
    });
  } catch (error) {
    console.error('Error regenerating resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate resource'
    });
  }
});

// ===== RESOURCE EVENTS AND CONVERSION ROUTES =====

// Initialize global resource event manager (in production, this would be per-game-session)
let globalEventManager = null;

function getEventManager() {
  if (!globalEventManager) {
    globalEventManager = new ResourceEventManager({
      enableRandomEvents: true,
      eventCheckInterval: 60000, // 1 minute for testing
      decayCheckInterval: 300000, // 5 minutes for testing
      conversionCheckInterval: 30000 // 30 seconds for testing
    });
  }
  return globalEventManager;
}

// Get available conversion recipes
router.get('/conversions/recipes', (req, res) => {
  try {
    res.json({
      success: true,
      data: ConversionRecipes
    });
  } catch (error) {
    console.error('Error getting conversion recipes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversion recipes'
    });
  }
});

// Get random event configurations
router.get('/events/types', (req, res) => {
  try {
    res.json({
      success: true,
      data: RandomEvents
    });
  } catch (error) {
    console.error('Error getting random events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get random event types'
    });
  }
});

// Start a resource conversion
router.post('/colony/:colonyId/conversions/start', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { recipeId, workerIds = [] } = req.body;
    
    if (!recipeId) {
      return res.status(400).json({
        success: false,
        error: 'Recipe ID is required'
      });
    }
    
    const eventManager = getEventManager();
    const result = await eventManager.startConversion(colonyId, recipeId, workerIds);
    
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
    console.error('Error starting conversion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start conversion'
    });
  }
});

// Get active conversions for a colony
router.get('/colony/:colonyId/conversions/active', (req, res) => {
  try {
    const { colonyId } = req.params;
    const eventManager = getEventManager();
    const activeConversions = eventManager.getActiveConversions(colonyId);
    
    res.json({
      success: true,
      data: activeConversions
    });
  } catch (error) {
    console.error('Error getting active conversions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active conversions'
    });
  }
});

// Trigger a random event manually (for testing)
router.post('/colony/:colonyId/events/trigger', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { eventType } = req.body;
    
    if (!eventType || !RandomEvents[eventType.toUpperCase()]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type'
      });
    }
    
    const eventManager = getEventManager();
    const colony = { id: colonyId, x: 500, y: 500, name: 'Test Colony' };
    const event = await eventManager.triggerRandomEvent(eventType.toUpperCase(), colony);
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error triggering random event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to trigger random event'
    });
  }
});

// Get active events for a colony
router.get('/colony/:colonyId/events/active', (req, res) => {
  try {
    const { colonyId } = req.params;
    const eventManager = getEventManager();
    const activeEvents = eventManager.getActiveEvents(colonyId);
    
    res.json({
      success: true,
      data: activeEvents
    });
  } catch (error) {
    console.error('Error getting active events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get active events'
    });
  }
});

// Force resource decay check for a colony
router.post('/colony/:colonyId/decay/process', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const eventManager = getEventManager();
    
    await eventManager.processColonyResourceDecay(colonyId);
    
    res.json({
      success: true,
      message: 'Resource decay processed successfully'
    });
  } catch (error) {
    console.error('Error processing resource decay:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process resource decay'
    });
  }
});

// Get resource event manager statistics
router.get('/events/stats', (req, res) => {
  try {
    const eventManager = getEventManager();
    const stats = eventManager.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting event stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get event statistics'
    });
  }
});

// Simulate resource events for testing
router.post('/colony/:colonyId/events/simulate', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { duration = 60 } = req.body; // Duration in seconds
    
    const eventManager = getEventManager();
    const colony = { id: colonyId, x: 500, y: 500, name: 'Test Colony' };
    
    // Trigger multiple random events for testing
    const events = [];
    const eventTypes = Object.keys(RandomEvents);
    
    for (let i = 0; i < 3; i++) {
      const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const event = await eventManager.triggerRandomEvent(randomEventType, colony);
      if (event) events.push(event);
    }
    
    res.json({
      success: true,
      data: {
        message: `Simulated ${events.length} random events for ${duration} seconds`,
        events: events
      }
    });
  } catch (error) {
    console.error('Error simulating events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate events'
    });
  }
});

module.exports = router; 
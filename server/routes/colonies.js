const express = require('express');
const router = express.Router();
const Colony = require('../models/Colony');
const { Ant } = require('../models/Ant');

// Get all colonies for a user (for testing, we'll use a hardcoded user ID)
router.get('/', async (req, res) => {
  try {
    // In a real app, you'd get this from authentication
    const userId = req.query.user_id || '00000000-0000-0000-0000-000000000001';
    
    const result = await Colony.findByUserId(userId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      data: result.data,
      count: result.data.length
    });
  } catch (error) {
    console.error('Error fetching colonies:', error);
    res.status(500).json({ error: 'Failed to fetch colonies' });
  }
});

// Get a specific colony with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const includeDetails = req.query.details === 'true';
    
    let result;
    if (includeDetails) {
      result = await Colony.findWithDetails(id);
    } else {
      result = await Colony.findById(id);
    }
    
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching colony:', error);
    res.status(500).json({ error: 'Failed to fetch colony' });
  }
});

// Create a new colony
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      color,
      difficulty_level,
      user_id
    } = req.body;
    
    // Validation
    if (!name || !user_id) {
      return res.status(400).json({ 
        error: 'Colony name and user_id are required' 
      });
    }
    
    // Generate a unique map seed
    const map_seed = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const colonyData = {
      user_id,
      name,
      description,
      color,
      difficulty_level: difficulty_level || 'medium',
      map_seed
    };
    
    const result = await Colony.create(colonyData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    const colony = result.data;
    
    // Create initial ants for the colony
    const initialAnts = [
      { colony_id: colony.id, name: 'Queen', role: 'nurse', status: 'adult' },
      { colony_id: colony.id, name: 'Worker-1', role: 'worker', status: 'adult' },
      { colony_id: colony.id, name: 'Worker-2', role: 'worker', status: 'adult' },
      { colony_id: colony.id, name: 'Forager-1', role: 'forager', status: 'adult' },
      { colony_id: colony.id, name: 'Soldier-1', role: 'soldier', status: 'adult' }
    ];
    
    // Create initial ants
    for (const antData of initialAnts) {
      await Ant.create(antData);
    }
    
    res.status(201).json({
      success: true,
      data: colony,
      message: 'Colony created successfully with initial ants'
    });
  } catch (error) {
    console.error('Error creating colony:', error);
    res.status(500).json({ error: 'Failed to create colony' });
  }
});

// Update a colony
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.created_at;
    delete updateData.updated_at;
    
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      return res.status(404).json({ error: colonyResult.error });
    }
    
    const result = await colonyResult.data.update(updateData);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      data: result.data,
      message: 'Colony updated successfully'
    });
  } catch (error) {
    console.error('Error updating colony:', error);
    res.status(500).json({ error: 'Failed to update colony' });
  }
});

// Delete a colony
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      return res.status(404).json({ error: colonyResult.error });
    }
    
    const result = await colonyResult.data.delete();
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      message: 'Colony deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting colony:', error);
    res.status(500).json({ error: 'Failed to delete colony' });
  }
});

// Get colony ants
router.get('/:id/ants', async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.query;
    
    // Check if colony exists
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      return res.status(404).json({ error: colonyResult.error });
    }
    
    const filters = {};
    if (role) filters.role = role;
    if (status) filters.status = status;
    
    const result = await Ant.findByColonyId(id, filters);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      data: result.data,
      count: result.data.length
    });
  } catch (error) {
    console.error('Error fetching colony ants:', error);
    res.status(500).json({ error: 'Failed to fetch colony ants' });
  }
});

// Get colony ant statistics
router.get('/:id/ants/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if colony exists
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      return res.status(404).json({ error: colonyResult.error });
    }
    
    const result = await Ant.getColonyStats(id);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching ant stats:', error);
    res.status(500).json({ error: 'Failed to fetch ant statistics' });
  }
});

// Simulate colony tick (advance time)
router.post('/:id/tick', async (req, res) => {
  try {
    const { id } = req.params;
    
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      return res.status(404).json({ error: colonyResult.error });
    }
    
    const colony = colonyResult.data;
    
    // Increment colony tick
    const tickResult = await colony.incrementTick();
    if (tickResult.error) {
      return res.status(400).json({ error: tickResult.error });
    }
    
    // Age all ants in the colony
    const antsResult = await Ant.findByColonyId(id);
    if (!antsResult.error) {
      for (const ant of antsResult.data) {
        await ant.age();
      }
    }
    
    // Get updated colony with stats
    const updatedResult = await Colony.findWithDetails(id);
    
    res.json({
      success: true,
      data: updatedResult.data,
      message: `Colony tick ${tickResult.data.total_ticks} completed`
    });
  } catch (error) {
    console.error('Error processing colony tick:', error);
    res.status(500).json({ error: 'Failed to process colony tick' });
  }
});

module.exports = router; 
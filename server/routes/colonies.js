const express = require('express');
const router = express.Router();
const Colony = require('../models/Colony');
const Ant = require('../models/Ant');

// Temporary in-memory storage for mock colonies (since we're not using a real database)
const mockColonies = new Map();

// Create a default test colony for development
const createDefaultColony = () => {
  const defaultColony = {
    id: 'test-colony-001',
    user_id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Colony',
    description: 'A test colony for development and UI testing',
    color: '#4CAF50',
    difficulty_level: 'medium',
    species: 'leaf-cutter',
    environment: 'forest',
    queen_name: 'Queen Test',
    map_seed: 'map_test_001',
    population: 25,
    type: 'leaf-cutter',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockColonies.set(defaultColony.id, defaultColony);
  console.log('🧪 Default test colony created:', defaultColony.id);
};

// Create default colony on startup
createDefaultColony();

// Get all colonies for a user (for testing, we'll use a hardcoded user ID)
router.get('/', async (req, res) => {
  try {
    // In a real app, you'd get this from authentication
    const userId = req.query.user_id || '00000000-0000-0000-0000-000000000001';
    
    console.log('📋 Getting colonies for user:', userId);
    
    // Get colonies from memory storage
    const colonies = Array.from(mockColonies.values()).filter(colony => 
      colony.user_id === userId || colony.user_id.startsWith('default-user-')
    );
    
    console.log('🔍 Found colonies:', colonies.length);
    
    res.json({
      success: true,
      data: colonies,
      count: colonies.length
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
    
    console.log('🔍 Looking for colony:', id);
    console.log('💾 Available colonies:', Array.from(mockColonies.keys()));
    
    // Check memory storage first
    const colony = mockColonies.get(id);
    
    if (colony) {
      console.log('✅ Found colony in memory:', colony.name);
      res.json({
        success: true,
        data: colony
      });
      return;
    }
    
    console.log('❌ Colony not found in memory storage');
    
    res.status(404).json({ 
      error: 'Colony not found',
      availableColonies: Array.from(mockColonies.keys()),
      searchedId: id
    });
  } catch (error) {
    console.error('Error fetching colony:', error);
    res.status(500).json({ error: 'Failed to fetch colony' });
  }
});

// Create a new colony
router.post('/', async (req, res) => {
  try {
    console.log('🐜 Colony creation request received');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Content-Type:', req.get('Content-Type'));
    
    const {
      name,
      description,
      color,
      difficulty_level,
      user_id,
      species,
      environment,
      queen_name,
      starting_resources
    } = req.body;
    
    console.log('🔍 Extracted fields:', { name, description, color, difficulty_level, user_id, species, environment, queen_name });
    
    // Validation
    if (!name) {
      console.log('❌ Validation failed: Missing name');
      return res.status(400).json({ 
        error: 'Colony name is required',
        received: { name, user_id }
      });
    }
    
    // Use a default user_id if not provided (for development)
    const finalUserId = user_id || 'default-user-' + Date.now();
    
    // Generate a unique colony ID and map seed
    const colonyId = `colony-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const map_seed = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const colonyData = {
      id: colonyId,
      user_id: finalUserId,
      name,
      description: description || `A ${species || 'ant'} colony in the ${environment || 'wilderness'}`,
      color: color || '#4CAF50',
      difficulty_level: difficulty_level || 'medium',
      species: species || 'leaf-cutter',
      environment: environment || 'forest',
      queen_name: queen_name || 'Queen ' + name,
      map_seed,
      population: 5,
      type: species || 'leaf-cutter',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ Colony data prepared:', JSON.stringify(colonyData, null, 2));
    
    // Store in memory for mock database
    mockColonies.set(colonyId, colonyData);
    console.log('💾 Colony stored in memory with ID:', colonyId);
    console.log('📊 Total colonies in storage:', mockColonies.size);
    console.log('🗂️  Available colony IDs:', Array.from(mockColonies.keys()));
    
    console.log('🎉 Colony created successfully (mock)');
    
    res.status(201).json({
      success: true,
      data: colonyData,
      message: 'Colony created successfully with initial ants'
    });
    
  } catch (error) {
    console.error('💥 Error creating colony:', error);
    console.error('📊 Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create colony',
      details: error.message,
      timestamp: new Date().toISOString()
    });
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
    
    console.log('🐜 Getting ants for colony:', id);
    
    // Check if colony exists in memory storage
    const colony = mockColonies.get(id);
    if (!colony) {
      console.log('❌ Colony not found for ants:', id);
      return res.status(404).json({ error: 'Colony not found' });
    }
    
    console.log('✅ Found colony for ants:', colony.name);
    
    // Mock ants data for now
    const mockAnts = [
      { id: 1, colony_id: id, name: 'Queen ' + colony.name, role: 'nurse', status: 'adult', health: 100 },
      { id: 2, colony_id: id, name: 'Worker-1', role: 'worker', status: 'adult', health: 85 },
      { id: 3, colony_id: id, name: 'Worker-2', role: 'worker', status: 'adult', health: 92 },
      { id: 4, colony_id: id, name: 'Forager-1', role: 'forager', status: 'adult', health: 78 },
      { id: 5, colony_id: id, name: 'Soldier-1', role: 'soldier', status: 'adult', health: 95 }
    ];
    
    // Apply filters if provided
    let filteredAnts = mockAnts;
    if (role) filteredAnts = filteredAnts.filter(ant => ant.role === role);
    if (status) filteredAnts = filteredAnts.filter(ant => ant.status === status);
    
    res.json({
      success: true,
      data: filteredAnts,
      count: filteredAnts.length
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
    
    console.log('📊 Getting ant stats for colony:', id);
    
    // Check if colony exists in memory storage
    const colony = mockColonies.get(id);
    if (!colony) {
      console.log('❌ Colony not found for ant stats:', id);
      return res.status(404).json({ error: 'Colony not found' });
    }
    
    console.log('✅ Found colony for ant stats:', colony.name);

    // Mock ant statistics for now
    const mockStats = {
      total: 156,
      roles: {
        worker: { count: 45, percentage: 28.8, status: 'active' },
        forager: { count: 32, percentage: 20.5, status: 'active' },
        soldier: { count: 28, percentage: 17.9, status: 'active' },
        nurse: { count: 25, percentage: 16.0, status: 'active' },
        scout: { count: 18, percentage: 11.5, status: 'active' },
        architect: { count: 8, percentage: 5.1, status: 'active' }
      },
      efficiency: {
        overall: 87.5,
        foraging: 92.3,
        construction: 84.1,
        defense: 89.7,
        nursery: 85.2
      },
      mood: 'content',
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockStats
    });
  } catch (error) {
    console.error('Error fetching ant statistics:', error);
    res.status(500).json({ error: 'Failed to fetch ant statistics' });
  }
});

// Get colony resources
router.get('/:id/resources', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🏪 Getting resources for colony:', id);
    
    // Check if colony exists in memory storage
    const colony = mockColonies.get(id);
    if (!colony) {
      console.log('❌ Colony not found for resources:', id);
      return res.status(404).json({ error: 'Colony not found' });
    }
    
    console.log('✅ Found colony for resources:', colony.name);

    // Mock colony resources for now
    const mockResources = {
      storage: {
        food: { current: 2450, capacity: 5000, efficiency: 0.89 },
        wood: { current: 1820, capacity: 3000, efficiency: 0.76 },
        stone: { current: 890, capacity: 2000, efficiency: 0.92 },
        leaves: { current: 1240, capacity: 2500, efficiency: 0.84 }
      },
      production: {
        food: { rate: 45.2, trend: 'increasing' },
        wood: { rate: 23.8, trend: 'stable' },
        stone: { rate: 12.5, trend: 'decreasing' },
        leaves: { rate: 34.1, trend: 'increasing' }
      },
      consumption: {
        food: { rate: 38.7, trend: 'stable' },
        wood: { rate: 15.2, trend: 'stable' },
        stone: { rate: 8.9, trend: 'stable' },
        leaves: { rate: 12.3, trend: 'stable' }
      },
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockResources
    });
  } catch (error) {
    console.error('Error fetching colony resources:', error);
    res.status(500).json({ error: 'Failed to fetch colony resources' });
  }
});

// Simulate colony tick
router.post('/:id/tick', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('⏰ Processing tick for colony:', id);
    
    // Check if colony exists in memory storage
    const colony = mockColonies.get(id);
    if (!colony) {
      console.log('❌ Colony not found for tick:', id);
      return res.status(404).json({ error: 'Colony not found' });
    }
    
    console.log('✅ Found colony for tick:', colony.name);

    // Mock simulation tick response
    const mockTickResult = {
      tick: Date.now(),
      events: [
        { type: 'resource_gathered', message: 'Foragers collected 15 units of food', timestamp: new Date().toISOString() },
        { type: 'ant_born', message: 'New worker ant hatched in nursery', timestamp: new Date().toISOString() }
      ],
      population: {
        total: 156,
        born: 2,
        died: 0
      },
      resources: {
        food: { change: +12.5 },
        wood: { change: +8.3 },
        stone: { change: +3.7 },
        leaves: { change: +5.1 }
      },
      nextTick: Date.now() + 1000
    };

    res.json({
      success: true,
      data: mockTickResult
    });
  } catch (error) {
    console.error('Error simulating colony tick:', error);
    res.status(500).json({ error: 'Failed to simulate colony tick' });
  }
});

module.exports = router; 
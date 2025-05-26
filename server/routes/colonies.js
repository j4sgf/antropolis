const express = require('express');
const router = express.Router();
const Colony = require('../models/Colony');
const Ant = require('../models/Ant');

// Temporary in-memory storage for mock colonies (since we're not using a real database)
const mockColonies = new Map();

// Note: Mock colonies are no longer needed since we're using the database
// createDefaultColony function removed to prevent UUID conflicts

// Get all colonies for a user (for testing, we'll use a hardcoded user ID)
router.get('/', async (req, res) => {
  try {
    // In a real app, you'd get this from authentication
    const userId = req.query.user_id || '00000000-0000-0000-0000-000000000001';
    
    console.log('📋 Getting colonies for user:', userId);
    
    // Get colonies from database
    const result = await Colony.findByUserId(userId);
    
    if (result.error) {
      console.error('❌ Database error fetching colonies:', result.error);
      return res.status(500).json({ error: 'Failed to fetch colonies from database' });
    }
    
    const colonies = result.data || [];
    console.log('🔍 Found colonies in database:', colonies.length);
    
    // Also add any colonies from memory storage for backward compatibility
    const memoryColonies = Array.from(mockColonies.values()).filter(colony => 
      colony.user_id === userId || colony.user_id.startsWith('default-user-')
    );
    
    // Combine database and memory colonies (avoid duplicates)
    const allColonies = [...colonies];
    memoryColonies.forEach(memoryColony => {
      if (!allColonies.find(dbColony => dbColony.id === memoryColony.id)) {
        allColonies.push(memoryColony);
      }
    });
    
    console.log('🔍 Total colonies (DB + memory):', allColonies.length);
    
    res.json({
      success: true,
      data: allColonies,
      count: allColonies.length
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
    
    // Check database first
    const result = await Colony.findById(id);
    
    if (!result.error && result.data) {
      console.log('✅ Found colony in database:', result.data.name);
      res.json({
        success: true,
        data: result.data
      });
      return;
    }
    
    // Check memory storage as fallback
    console.log('💾 Available colonies in memory:', Array.from(mockColonies.keys()));
    const colony = mockColonies.get(id);
    
    if (colony) {
      console.log('✅ Found colony in memory:', colony.name);
      res.json({
        success: true,
        data: colony
      });
      return;
    }
    
    console.log('❌ Colony not found in database or memory storage');
    
    res.status(404).json({ 
      error: 'Colony not found',
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
    
    // Use a default user_id if not provided (use the test user from population script)
    const finalUserId = user_id || '00000000-0000-0000-0000-000000000001';
    
    // Generate map seed (keeping this as string for compatibility)
    const map_seed = `map_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const colonyData = {
      // Remove id field - let database generate UUID
      user_id: finalUserId,
      name,
      description: description || `A colony in the wilderness`,
      color: color || '#4CAF50',
      difficulty_level: difficulty_level || 'medium',
      map_seed,
      population: 5,
      is_active: true,
      evolution_points: 0
      // Remove created_at and updated_at - let database set these
    };
    
    console.log('✅ Colony data prepared:', JSON.stringify(colonyData, null, 2));
    
    // Use the database to create the colony
    const result = await Colony.create(colonyData);
    
    if (result.error) {
      console.error('❌ Database error creating colony:', result.error);
      return res.status(400).json({ 
        error: 'Failed to create colony in database',
        details: result.error 
      });
    }
    
    const createdColony = result.data;
    console.log('💾 Colony stored in database with ID:', createdColony.id);
    
    // Create initial ants for the colony
    console.log('🐣 Creating initial ants for colony...');
    const initialAnts = [
      {
        colony_id: createdColony.id,
        name: 'Queen ' + createdColony.name,
        type: 'queen',
        role: 'nurse',
        status: 'adult',
        is_queen: true,
        health: 100,
        energy: 100,
        position_x: 0,
        position_y: 0
      },
      {
        colony_id: createdColony.id,
        name: 'Worker-1',
        type: 'worker',
        role: 'worker',
        status: 'adult',
        health: 85,
        energy: 90,
        position_x: 1,
        position_y: 0
      },
      {
        colony_id: createdColony.id,
        name: 'Worker-2',
        type: 'worker',
        role: 'worker',
        status: 'adult',
        health: 92,
        energy: 85,
        position_x: 0,
        position_y: 1
      },
      {
        colony_id: createdColony.id,
        name: 'Forager-1',
        type: 'worker',
        role: 'forager',
        status: 'adult',
        health: 78,
        energy: 95,
        position_x: -1,
        position_y: 0
      },
      {
        colony_id: createdColony.id,
        name: 'Soldier-1',
        type: 'worker',
        role: 'soldier',
        status: 'adult',
        health: 95,
        energy: 80,
        position_x: 0,
        position_y: -1
      }
    ];
    
    // Create ants in database
    for (const antData of initialAnts) {
      const antResult = await Ant.create(antData);
      if (antResult.error) {
        console.error('⚠️ Failed to create ant:', antResult.error);
      } else {
        console.log('✅ Created ant:', antResult.data.name);
      }
    }
    
    // Also store in memory for backward compatibility with existing mock logic
    mockColonies.set(createdColony.id, createdColony);
    console.log('📊 Total colonies in storage:', mockColonies.size);
    
    console.log('🎉 Colony created successfully in database with initial ants');
    
    res.status(201).json({
      success: true,
      data: createdColony,
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
    
    // First verify colony exists in database
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      console.log('❌ Colony not found for ants:', id);
      return res.status(404).json({ error: 'Colony not found' });
    }
    
    console.log('✅ Found colony for ants:', colonyResult.data.name);
    
    // Get ants from database
    const antsResult = await Ant.findByColonyId(id);
    if (antsResult.error) {
      console.error('❌ Error fetching ants:', antsResult.error);
      return res.status(500).json({ error: 'Failed to fetch colony ants' });
    }
    
    let ants = antsResult.data || [];
    
    // Apply filters if provided
    if (role) {
      ants = ants.filter(ant => ant.type === role);
    }
    if (status) {
      ants = ants.filter(ant => ant.status === status);
    }
    
    console.log(`✅ Found ${ants.length} ants for colony ${colonyResult.data.name}`);
    
    res.json({
      success: true,
      data: ants.map(ant => ant.toJSON()),
      count: ants.length
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
    
    // First verify colony exists in database
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      // Check memory storage as fallback
      const colony = mockColonies.get(id);
      if (!colony) {
        console.log('❌ Colony not found for ant stats:', id);
        return res.status(404).json({ error: 'Colony not found' });
      }
      console.log('✅ Found colony in memory for ant stats:', colony.name);
    } else {
      console.log('✅ Found colony in database for ant stats:', colonyResult.data.name);
    }
    
    // Get ants from database to calculate real statistics
    const antsResult = await Ant.findByColonyId(id);
    if (antsResult.error) {
      console.error('❌ Error fetching ants for stats:', antsResult.error);
      return res.status(500).json({ error: 'Failed to fetch colony ants for statistics' });
    }
    
    const ants = antsResult.data || [];
    
    // Calculate real statistics from actual ants
    const total = ants.length;
    const roleStats = {};
    
    // Count ants by role
    ants.forEach(ant => {
      const role = ant.role || 'worker';
      if (!roleStats[role]) {
        roleStats[role] = { count: 0, percentage: 0, status: 'active' };
      }
      roleStats[role].count++;
    });
    
    // Calculate percentages
    Object.keys(roleStats).forEach(role => {
      roleStats[role].percentage = total > 0 ? (roleStats[role].count / total * 100) : 0;
    });
    
    // Calculate efficiency based on ant health and energy
    const avgHealth = total > 0 ? ants.reduce((sum, ant) => sum + ant.health, 0) / total : 0;
    const avgEnergy = total > 0 ? ants.reduce((sum, ant) => sum + ant.energy, 0) / total : 0;
    const overallEfficiency = (avgHealth + avgEnergy) / 2;
    
    const stats = {
      total,
      roles: roleStats,
      efficiency: {
        overall: Math.round(overallEfficiency * 10) / 10,
        foraging: Math.round((avgEnergy * 0.9 + avgHealth * 0.1) * 10) / 10,
        construction: Math.round((avgHealth * 0.7 + avgEnergy * 0.3) * 10) / 10,
        defense: Math.round((avgHealth * 0.8 + avgEnergy * 0.2) * 10) / 10,
        nursery: Math.round((avgHealth * 0.6 + avgEnergy * 0.4) * 10) / 10
      },
      mood: overallEfficiency > 80 ? 'content' : overallEfficiency > 60 ? 'neutral' : 'stressed',
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching ant statistics:', error);
    res.status(500).json({ error: 'Failed to fetch ant statistics' });
  }
});

// Get colony role distribution
router.get('/:id/role-distribution', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📊 Getting role distribution for colony:', id);
    
    // First verify colony exists in database
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      // Check memory storage as fallback
      const colony = mockColonies.get(id);
      if (!colony) {
        console.log('❌ Colony not found for role distribution:', id);
        return res.status(404).json({ error: 'Colony not found' });
      }
      console.log('✅ Found colony in memory for role distribution:', colony.name);
    } else {
      console.log('✅ Found colony in database for role distribution:', colonyResult.data.name);
    }
    
    // Get ants from database to calculate role distribution
    const antsResult = await Ant.findByColonyId(id);
    if (antsResult.error) {
      console.error('❌ Error fetching ants for role distribution:', antsResult.error);
      return res.status(500).json({ error: 'Failed to fetch colony ants for role distribution' });
    }
    
    const ants = antsResult.data || [];
    
    // Calculate role distribution
    const distribution = {};
    const total = ants.length;
    
    // Count ants by role
    ants.forEach(ant => {
      const role = ant.role || 'worker';
      if (!distribution[role]) {
        distribution[role] = {
          count: 0,
          percentage: 0,
          ants: []
        };
      }
      distribution[role].count++;
      distribution[role].ants.push({
        id: ant.id,
        name: ant.name,
        health: ant.health,
        energy: ant.energy,
        experience: ant.experience
      });
    });
    
    // Calculate percentages
    Object.keys(distribution).forEach(role => {
      distribution[role].percentage = total > 0 ? Math.round((distribution[role].count / total * 100) * 10) / 10 : 0;
    });
    
    console.log('✅ Role distribution calculated:', distribution);

    res.json({
      success: true,
      distribution,
      total,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching role distribution:', error);
    res.status(500).json({ error: 'Failed to fetch role distribution' });
  }
});

// Get colony role recommendations
router.get('/:id/role-recommendations', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('💡 Getting role recommendations for colony:', id);
    
    // First verify colony exists in database
    const colonyResult = await Colony.findById(id);
    if (colonyResult.error) {
      // Check memory storage as fallback
      const colony = mockColonies.get(id);
      if (!colony) {
        console.log('❌ Colony not found for role recommendations:', id);
        return res.status(404).json({ error: 'Colony not found' });
      }
    }
    
    // Get ants from database to calculate recommendations
    const antsResult = await Ant.findByColonyId(id);
    if (antsResult.error) {
      console.error('❌ Error fetching ants for role recommendations:', antsResult.error);
      return res.status(500).json({ error: 'Failed to fetch colony ants for recommendations' });
    }
    
    const ants = antsResult.data || [];
    const total = ants.length;
    
    // Calculate current role distribution
    const currentRoles = {};
    ants.forEach(ant => {
      const role = ant.role || 'worker';
      currentRoles[role] = (currentRoles[role] || 0) + 1;
    });
    
    // Generate recommendations based on colony size and current distribution
    const recommendations = {};
    
    if (total > 0) {
      // Ideal distribution for small colonies (5-20 ants)
      const idealDistribution = {
        worker: Math.max(1, Math.floor(total * 0.4)), // 40%
        forager: Math.max(1, Math.floor(total * 0.3)), // 30%
        soldier: Math.max(1, Math.floor(total * 0.15)), // 15%
        nurse: Math.max(1, Math.floor(total * 0.1)), // 10%
        scout: Math.max(0, Math.floor(total * 0.05)) // 5%
      };
      
      // Compare current vs ideal and generate recommendations
      Object.keys(idealDistribution).forEach(role => {
        const current = currentRoles[role] || 0;
        const ideal = idealDistribution[role];
        const difference = ideal - current;
        
        if (difference !== 0) {
          recommendations[role] = {
            current,
            recommended: ideal,
            difference,
            priority: Math.abs(difference) > 1 ? 'high' : 'medium',
            reason: difference > 0 
              ? `Need ${difference} more ${role}${difference > 1 ? 's' : ''} for optimal efficiency`
              : `Consider reassigning ${Math.abs(difference)} ${role}${Math.abs(difference) > 1 ? 's' : ''} to other roles`
          };
        }
      });
    }
    
    console.log('✅ Role recommendations calculated:', recommendations);

    res.json({
      success: true,
      recommendations,
      currentDistribution: currentRoles,
      totalAnts: total,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching role recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch role recommendations' });
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
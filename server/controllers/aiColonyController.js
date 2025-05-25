/**
 * AI Colony Controller
 * Handles CRUD operations and AI logic for enemy colonies
 */

const { AIColony } = require('../models/AIColony');
const { AI_STATES, PERSONALITY_TRAITS } = require('../constants/AI');
const ExplorationManager = require('../services/ExplorationManager');
const VisibilityService = require('../services/VisibilityService');
const ScoutBehavior = require('../services/ai/units/ScoutBehavior');
const ColonyMemory = require('../services/ai/ColonyMemory');

// Initialize services
const explorationManager = new ExplorationManager();
const scoutBehavior = new ScoutBehavior();

/**
 * Create a new AI colony
 * POST /api/ai-colonies
 */
const createAIColony = async (req, res) => {
  try {
    const {
      name,
      map_seed,
      base_x,
      base_y,
      personality,
      difficulty_level = 'medium',
      aggression_level,
      expansion_drive,
      growth_rate,
      military_focus
    } = req.body;

    // Validate required fields
    if (!name || !map_seed || base_x === undefined || base_y === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, map_seed, base_x, base_y'
      });
    }

    // Validate personality if provided
    if (personality && !Object.values(PERSONALITY_TRAITS).includes(personality)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid personality trait'
      });
    }

    const colonyData = {
      name,
      map_seed,
      base_x,
      base_y,
      personality: personality || PERSONALITY_TRAITS.OPPORTUNIST,
      difficulty_level,
      aggression_level: aggression_level || Math.random(),
      expansion_drive: expansion_drive || Math.random(),
      growth_rate: growth_rate || (0.8 + Math.random() * 0.4),
      military_focus: military_focus || Math.random(),
      population: 20 + Math.floor(Math.random() * 30), // Random starting population 20-50
      max_population: 100 + Math.floor(Math.random() * 100), // Random max 100-200
      food_storage: 50 + Math.floor(Math.random() * 100), // Random starting food 50-150
      territory_size: 3 + Math.floor(Math.random() * 3) // Random territory 3-6
    };

    const result = await AIColony.create(colonyData);

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
    console.error('Error creating AI colony:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get all AI colonies
 * GET /api/ai-colonies
 */
const getAIColonies = async (req, res) => {
  try {
    const { active_only = false } = req.query;

    let result;
    if (active_only === 'true') {
      result = await AIColony.getActiveAIColonies();
    } else {
      // For now, we'll use the active colonies method as the base
      // In a full implementation, we might add a getAll method
      result = await AIColony.getActiveAIColonies();
    }

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data.map(colony => colony.toJSON()),
      count: result.data.length
    });

  } catch (error) {
    console.error('Error fetching AI colonies:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get AI colony by ID
 * GET /api/ai-colonies/:id
 */
const getAIColonyById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await AIColony.findById(id);

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
    console.error('Error fetching AI colony:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update AI colony
 * PUT /api/ai-colonies/:id
 */
const updateAIColony = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove readonly fields
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.is_ai;

    // Find the colony first
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;
    const result = await colony.update(updateData);

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
    console.error('Error updating AI colony:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Delete AI colony
 * DELETE /api/ai-colonies/:id
 */
const deleteAIColony = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the colony first
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;
    const result = await colony.delete();

    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'AI colony deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting AI colony:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Make AI decision for a colony
 * POST /api/ai-colonies/:id/decide
 */
const makeAIDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { game_state = {} } = req.body;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Skip decision making if on cooldown
    if (colony.decision_cooldown > 0) {
      return res.json({
        success: true,
        data: {
          decision: null,
          reason: 'on_cooldown',
          cooldown_remaining: colony.decision_cooldown
        }
      });
    }

    // Make strategic decision
    const decision = colony.makeStrategicDecision(game_state);

    // Update the colony with the decision
    if (decision) {
      await colony.update({
        last_decision: decision,
        decision_cooldown: decision.cooldown || 5
      });
    }

    res.json({
      success: true,
      data: {
        decision,
        colony_state: colony.ai_state,
        threat_level: colony.threat_level
      }
    });

  } catch (error) {
    console.error('Error making AI decision:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Change AI colony state
 * POST /api/ai-colonies/:id/change-state
 */
const changeAIState = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_state, reason = '' } = req.body;

    // Validate state
    if (!Object.values(AI_STATES).includes(new_state)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid AI state'
      });
    }

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Attempt state change
    const success = colony.changeState(new_state, reason);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state transition'
      });
    }

    // Update in database
    await colony.update({
      ai_state: colony.ai_state,
      last_decision: colony.last_decision
    });

    res.json({
      success: true,
      data: {
        old_state: colony.last_decision.from,
        new_state: colony.ai_state,
        reason: reason
      }
    });

  } catch (error) {
    console.error('Error changing AI state:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update threat level for AI colony
 * POST /api/ai-colonies/:id/update-threat
 */
const updateThreatLevel = async (req, res) => {
  try {
    const { id } = req.params;
    const { nearby_enemies = [], recent_attacks = [] } = req.body;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Update threat level
    const newThreatLevel = colony.updateThreatLevel(nearby_enemies, recent_attacks);

    // Update in database
    await colony.update({
      threat_level: newThreatLevel
    });

    res.json({
      success: true,
      data: {
        threat_level: newThreatLevel,
        nearby_enemies_count: nearby_enemies.length,
        recent_attacks_count: recent_attacks.length
      }
    });

  } catch (error) {
    console.error('Error updating threat level:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Add memory to AI colony
 * POST /api/ai-colonies/:id/memory
 */
const addMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, data'
      });
    }

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Store memory
    colony.storeMemory(type, data);

    // Update in database
    await colony.update({
      memory: colony.memory
    });

    res.json({
      success: true,
      data: {
        type,
        memory_count: colony.memory[type].length
      }
    });

  } catch (error) {
    console.error('Error adding memory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Process AI tick for all colonies
 * POST /api/ai-colonies/tick
 */
const processAITick = async (req, res) => {
  try {
    const { game_state = {} } = req.body;

    // Get all active AI colonies
    const result = await AIColony.getActiveAIColonies();
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const colonies = result.data;
    const tickResults = [];

    // Process each colony
    for (const colony of colonies) {
      try {
        // Decrement decision cooldown
        if (colony.decision_cooldown > 0) {
          colony.decision_cooldown--;
        }

        // Make decision if not on cooldown
        let decision = null;
        if (colony.decision_cooldown <= 0) {
          decision = colony.makeStrategicDecision(game_state);
        }

        // Update colony
        await colony.update({
          decision_cooldown: colony.decision_cooldown,
          last_decision: decision || colony.last_decision,
          total_ticks: colony.total_ticks + 1,
          last_tick: new Date().toISOString()
        });

        tickResults.push({
          colony_id: colony.id,
          state: colony.ai_state,
          decision: decision,
          threat_level: colony.threat_level,
          population: colony.population
        });

      } catch (error) {
        console.error(`Error processing tick for colony ${colony.id}:`, error);
        tickResults.push({
          colony_id: colony.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        processed_colonies: colonies.length,
        tick_results: tickResults
      }
    });

  } catch (error) {
    console.error('Error processing AI tick:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get AI colony statistics
 * GET /api/ai-colonies/stats
 */
const getAIColonyStats = async (req, res) => {
  try {
    const result = await AIColony.getActiveAIColonies();
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const colonies = result.data;
    
    // Calculate statistics
    const stats = {
      total_colonies: colonies.length,
      personalities: {},
      states: {},
      average_population: 0,
      average_threat_level: 0,
      total_population: 0
    };

    let totalPopulation = 0;
    let totalThreatLevel = 0;

    colonies.forEach(colony => {
      // Count personalities
      stats.personalities[colony.personality] = 
        (stats.personalities[colony.personality] || 0) + 1;
      
      // Count states
      stats.states[colony.ai_state] = 
        (stats.states[colony.ai_state] || 0) + 1;
      
      // Accumulate totals
      totalPopulation += colony.population;
      totalThreatLevel += colony.threat_level;
    });

    stats.total_population = totalPopulation;
    stats.average_population = colonies.length > 0 ? totalPopulation / colonies.length : 0;
    stats.average_threat_level = colonies.length > 0 ? totalThreatLevel / colonies.length : 0;

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting AI colony stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Process growth for a specific AI colony
 * POST /api/ai-colonies/:id/process-growth
 */
const processColonyGrowth = async (req, res) => {
  try {
    const { id } = req.params;
    const { game_state = {} } = req.body;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Process growth
    const growthResult = colony.processGrowth(game_state);

    if (!growthResult) {
      return res.json({
        success: true,
        data: {
          growth_processed: false,
          reason: 'No time elapsed since last growth tick'
        }
      });
    }

    // Update colony in database
    await colony.update({
      population: colony.population,
      food_storage: colony.food_storage,
      wood_storage: colony.wood_storage,
      stone_storage: colony.stone_storage,
      minerals_storage: colony.minerals_storage,
      water_storage: colony.water_storage,
      territory_size: colony.territory_size,
      infrastructure_level: colony.infrastructure_level,
      development_phase: colony.development_phase,
      growth_history: colony.growth_history,
      last_growth_tick: colony.last_growth_tick,
      memory: colony.memory
    });

    res.json({
      success: true,
      data: {
        growth_processed: true,
        growth: growthResult.growth,
        changes: growthResult.changes,
        new_phase: growthResult.new_phase,
        colony_state: {
          population: colony.population,
          territory_size: colony.territory_size,
          development_phase: colony.development_phase
        }
      }
    });

  } catch (error) {
    console.error('Error processing colony growth:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get growth projection for AI colony
 * GET /api/ai-colonies/:id/growth-projection
 */
const getGrowthProjection = async (req, res) => {
  try {
    const { id } = req.params;
    const { ticks = 10 } = req.query;
    const { game_state = {} } = req.body;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Get growth projection
    const projection = colony.getGrowthProjection(parseInt(ticks), game_state);

    res.json({
      success: true,
      data: {
        projection: projection,
        current_state: {
          population: colony.population,
          territory_size: colony.territory_size,
          development_phase: colony.development_phase,
          total_ticks: colony.total_ticks
        }
      }
    });

  } catch (error) {
    console.error('Error getting growth projection:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get growth efficiency analysis for AI colony
 * GET /api/ai-colonies/:id/growth-efficiency
 */
const getGrowthEfficiency = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Get growth efficiency analysis
    const efficiency = colony.getGrowthEfficiency();

    res.json({
      success: true,
      data: {
        efficiency: efficiency,
        colony_state: {
          population: colony.population,
          territory_size: colony.territory_size,
          threat_level: colony.threat_level,
          development_phase: colony.development_phase
        }
      }
    });

  } catch (error) {
    console.error('Error getting growth efficiency:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Process growth for all AI colonies (batch operation)
 * POST /api/ai-colonies/process-all-growth
 */
const processAllColonyGrowth = async (req, res) => {
  try {
    const { game_state = {} } = req.body;

    // Get all active AI colonies
    const result = await AIColony.getActiveAIColonies();
    if (result.error) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    const colonies = result.data;
    const growthResults = [];

    // Process growth for each colony
    for (const colony of colonies) {
      try {
        const growthResult = colony.processGrowth(game_state);
        
        if (growthResult) {
          // Update colony in database
          await colony.update({
            population: colony.population,
            food_storage: colony.food_storage,
            wood_storage: colony.wood_storage,
            stone_storage: colony.stone_storage,
            minerals_storage: colony.minerals_storage,
            water_storage: colony.water_storage,
            territory_size: colony.territory_size,
            infrastructure_level: colony.infrastructure_level,
            development_phase: colony.development_phase,
            growth_history: colony.growth_history,
            last_growth_tick: colony.last_growth_tick,
            memory: colony.memory
          });
        }

        growthResults.push({
          colony_id: colony.id,
          name: colony.name,
          growth_processed: !!growthResult,
          population: colony.population,
          territory_size: colony.territory_size,
          development_phase: colony.development_phase,
          growth_summary: growthResult ? {
            population_growth: growthResult.growth.population,
            territory_growth: growthResult.growth.territory,
            total_resource_growth: Object.values(growthResult.growth.resources).reduce((sum, val) => sum + val, 0)
          } : null
        });

      } catch (error) {
        console.error(`Error processing growth for colony ${colony.id}:`, error);
        growthResults.push({
          colony_id: colony.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        processed_colonies: colonies.length,
        growth_results: growthResults
      }
    });

  } catch (error) {
    console.error('Error processing all colony growth:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update difficulty scaling for AI colony
 * POST /api/ai-colonies/:id/update-difficulty
 */
const updateDifficultyScaling = async (req, res) => {
  try {
    const { id } = req.params;
    const { difficulty_level, player_performance_data = {} } = req.body;

    // Validate difficulty level
    const validDifficulties = ['easy', 'medium', 'hard', 'nightmare'];
    if (difficulty_level && !validDifficulties.includes(difficulty_level)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level'
      });
    }

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Calculate new difficulty modifiers based on player performance
    const difficultyModifiers = calculateDifficultyModifiers(player_performance_data);

    // Update colony
    const updateData = {};
    if (difficulty_level) {
      updateData.difficulty_level = difficulty_level;
    }
    
    updateData.difficulty_modifier = difficultyModifiers.overall;
    updateData.growth_rate = colony.growth_rate * difficultyModifiers.growth;
    updateData.resource_efficiency = colony.resource_efficiency * difficultyModifiers.efficiency;
    updateData.aggression_level = Math.min(1.0, colony.aggression_level * difficultyModifiers.aggression);

    await colony.update(updateData);

    res.json({
      success: true,
      data: {
        old_difficulty: colony.difficulty_level,
        new_difficulty: difficulty_level || colony.difficulty_level,
        modifiers: difficultyModifiers,
        updated_properties: updateData
      }
    });

  } catch (error) {
    console.error('Error updating difficulty scaling:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Calculate difficulty modifiers based on player performance
 */
function calculateDifficultyModifiers(playerPerformance) {
  const modifiers = {
    growth: 1.0,
    efficiency: 1.0,
    aggression: 1.0,
    overall: 1.0
  };

  // Player performance factors
  const winRate = playerPerformance.win_rate || 0.5;
  const averageGameLength = playerPerformance.average_game_length || 100;
  const resourceEfficiency = playerPerformance.resource_efficiency || 1.0;
  const expansionRate = playerPerformance.expansion_rate || 1.0;

  // Adjust based on win rate
  if (winRate > 0.7) {
    // Player is winning too much - increase AI difficulty
    modifiers.growth *= 1.3;
    modifiers.efficiency *= 1.2;
    modifiers.aggression *= 1.4;
  } else if (winRate < 0.3) {
    // Player is losing too much - decrease AI difficulty
    modifiers.growth *= 0.8;
    modifiers.efficiency *= 0.9;
    modifiers.aggression *= 0.7;
  }

  // Adjust based on game length
  if (averageGameLength < 50) {
    // Games are too short - make AI more defensive
    modifiers.aggression *= 0.8;
    modifiers.growth *= 1.1;
  } else if (averageGameLength > 200) {
    // Games are too long - make AI more aggressive
    modifiers.aggression *= 1.2;
    modifiers.efficiency *= 1.1;
  }

  // Adjust based on player efficiency
  if (resourceEfficiency > 1.2) {
    // Player is very efficient - boost AI efficiency
    modifiers.efficiency *= 1.3;
  } else if (resourceEfficiency < 0.8) {
    // Player is inefficient - reduce AI efficiency
    modifiers.efficiency *= 0.9;
  }

  // Calculate overall modifier
  modifiers.overall = (modifiers.growth + modifiers.efficiency + modifiers.aggression) / 3;

  return modifiers;
}

/**
 * Plan exploration strategy for AI colony
 * POST /api/ai-colonies/:id/plan-exploration
 */
const planExplorationStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    const { game_state = {} } = req.body;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Plan exploration strategy
    const strategy = explorationManager.planExplorationStrategy(colony, game_state);

    // Initialize visibility if not already done
    let visibilityStatus = VisibilityService.getVisibilityStatus(colony.id);
    if (!visibilityStatus) {
      VisibilityService.initializeColonyVisibility(colony.id, { x: colony.base_x, y: colony.base_y });
      visibilityStatus = VisibilityService.getVisibilityStatus(colony.id);
    }

    res.json({
      success: true,
      data: {
        strategy: strategy,
        visibility_status: visibilityStatus,
        colony_info: {
          id: colony.id,
          name: colony.name,
          population: colony.population,
          personality: colony.personality,
          threat_level: colony.threat_level
        }
      }
    });

  } catch (error) {
    console.error('Error planning exploration strategy:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Create and launch scout mission
 * POST /api/ai-colonies/:id/launch-scout-mission
 */
const launchScoutMission = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignment, game_state = {} } = req.body;

    if (!assignment) {
      return res.status(400).json({
        success: false,
        error: 'Scout assignment data required'
      });
    }

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Create scout mission
    const mission = scoutBehavior.createScoutMission(assignment, colony);
    
    // Plan route for the mission
    mission.route = scoutBehavior.planScoutRoute(mission, game_state);

    // Store mission in colony memory
    const colonyMemory = new ColonyMemory(colony.id);
    const missionMemoryId = colonyMemory.storeMemory('scout_missions', {
      mission_id: mission.id,
      type: mission.type,
      objective: mission.objective,
      scouts_assigned: mission.scouts_assigned,
      status: 'active',
      created_at: mission.created_at
    });

    res.json({
      success: true,
      data: {
        mission: mission,
        mission_memory_id: missionMemoryId,
        route_info: {
          total_waypoints: mission.route.waypoints.length,
          estimated_time: mission.route.estimated_time,
          risk_level: mission.route.risk_level,
          pathfinding_mode: mission.route.pathfinding_mode
        }
      }
    });

  } catch (error) {
    console.error('Error launching scout mission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Execute scout mission step
 * POST /api/ai-colonies/:id/execute-scout-step
 */
const executeScoutStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { mission, current_tick, game_state = {} } = req.body;

    if (!mission) {
      return res.status(400).json({
        success: false,
        error: 'Mission data required'
      });
    }

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Execute scout step
    const stepResult = scoutBehavior.executeScoutStep(mission, current_tick, game_state);

    // Process discoveries through visibility service
    if (stepResult.discoveries.length > 0) {
      const scoutPositions = [mission.current_position];
      const explorationData = {
        resources: stepResult.discoveries.filter(d => d.type === 'resource'),
        terrain_features: stepResult.discoveries.filter(d => d.type === 'terrain_feature')
      };
      
      const visibilityResult = VisibilityService.processScoutExploration(
        colony.id, 
        scoutPositions, 
        explorationData
      );
      
      stepResult.visibility_updated = visibilityResult.updatedVisibility;
      stepResult.new_tiles_explored = visibilityResult.newTilesExplored;
    }

    // Store discoveries in colony memory
    if (stepResult.discoveries.length > 0 || stepResult.intelligence.length > 0) {
      const colonyMemory = new ColonyMemory(colony.id);
      
      stepResult.discoveries.forEach(discovery => {
        const category = discovery.type === 'resource' ? 'discovered_resources' : 'terrain_features';
        colonyMemory.storeMemory(category, discovery);
      });
      
      stepResult.intelligence.forEach(intel => {
        colonyMemory.storeMemory('enemy_movements', intel);
      });
    }

    // Update mission in memory if completed
    if (stepResult.step_completed) {
      const colonyMemory = new ColonyMemory(colony.id);
      const missionMemories = colonyMemory.getMemories('scout_missions', {
        limit: 50
      });
      
      const missionMemory = missionMemories.find(m => m.mission_id === mission.id);
      if (missionMemory) {
        colonyMemory.updateMemory(missionMemory.id, {
          status: 'completed',
          completion_time: new Date().toISOString(),
          success_rate: scoutBehavior.calculateMissionSuccess(mission)
        });
      }
    }

    res.json({
      success: true,
      data: {
        step_result: stepResult,
        mission_status: {
          id: mission.id,
          state: mission.state,
          progress: mission.progress,
          current_position: mission.current_position
        }
      }
    });

  } catch (error) {
    console.error('Error executing scout step:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get colony visibility status
 * GET /api/ai-colonies/:id/visibility
 */
const getColonyVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Get visibility status
    let visibilityStatus = VisibilityService.getVisibilityStatus(colony.id);
    
    if (!visibilityStatus) {
      // Initialize visibility if not present
      VisibilityService.initializeColonyVisibility(colony.id, { x: colony.base_x, y: colony.base_y });
      visibilityStatus = VisibilityService.getVisibilityStatus(colony.id);
    }

    // Get discovered resources and enemies
    const discoveredResources = VisibilityService.getDiscoveredResources(colony.id);
    const discoveredEnemies = VisibilityService.getDiscoveredEnemies(colony.id);

    res.json({
      success: true,
      data: {
        visibility_status: visibilityStatus,
        discovered_resources: discoveredResources,
        discovered_enemies: discoveredEnemies,
        fog_of_war_enabled: true
      }
    });

  } catch (error) {
    console.error('Error getting colony visibility:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get unexplored areas for colony
 * GET /api/ai-colonies/:id/unexplored-areas
 */
const getUnexploredAreas = async (req, res) => {
  try {
    const { id } = req.params;
    const { radius = 15 } = req.query;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;
    const center = { x: colony.base_x, y: colony.base_y };

    // Get unexplored areas
    const unexploredAreas = VisibilityService.getUnexploredAreas(
      colony.id, 
      center, 
      parseInt(radius)
    );

    res.json({
      success: true,
      data: {
        center: center,
        search_radius: parseInt(radius),
        unexplored_areas: unexploredAreas,
        total_unexplored: unexploredAreas.length
      }
    });

  } catch (error) {
    console.error('Error getting unexplored areas:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get colony memory information
 * GET /api/ai-colonies/:id/memory
 */
const getColonyMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, limit = 20 } = req.query;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;
    const colonyMemory = new ColonyMemory(colony.id);

    let memories;
    if (category) {
      // Get memories from specific category
      memories = colonyMemory.getMemories(category, { limit: parseInt(limit) });
    } else {
      // Get memory statistics
      memories = colonyMemory.getMemoryStats();
    }

    res.json({
      success: true,
      data: {
        colony_id: colony.id,
        category: category || 'all',
        memories: memories
      }
    });

  } catch (error) {
    console.error('Error getting colony memory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Search colony memories
 * POST /api/ai-colonies/:id/search-memory
 */
const searchColonyMemory = async (req, res) => {
  try {
    const { id } = req.params;
    const { search_criteria = {} } = req.body;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;
    const colonyMemory = new ColonyMemory(colony.id);

    // Search memories
    const searchResults = colonyMemory.searchMemories(search_criteria);

    res.json({
      success: true,
      data: {
        colony_id: colony.id,
        search_criteria: search_criteria,
        results: searchResults,
        total_results: searchResults.length
      }
    });

  } catch (error) {
    console.error('Error searching colony memory:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update fog of war for colony
 * POST /api/ai-colonies/:id/update-fog-of-war
 */
const updateFogOfWar = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Update fog of war
    VisibilityService.updateFogOfWar(colony.id);

    // Get updated visibility status
    const visibilityStatus = VisibilityService.getVisibilityStatus(colony.id);

    res.json({
      success: true,
      data: {
        colony_id: colony.id,
        fog_updated: true,
        visibility_status: visibilityStatus
      }
    });

  } catch (error) {
    console.error('Error updating fog of war:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Process exploration results
 * POST /api/ai-colonies/:id/process-exploration-results
 */
const processExplorationResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { exploration_data = {} } = req.body;

    // Find the colony
    const findResult = await AIColony.findById(id);
    if (findResult.error) {
      return res.status(404).json({
        success: false,
        error: findResult.error
      });
    }

    const colony = findResult.data;

    // Process exploration results through exploration manager
    const results = explorationManager.processExplorationResults(colony, exploration_data);

    // Update colony memory with new discoveries
    const colonyMemory = new ColonyMemory(colony.id);
    
    results.discoveries.forEach(discovery => {
      const category = discovery.type === 'resource' ? 'discovered_resources' : 'terrain_features';
      colonyMemory.storeMemory(category, discovery);
    });
    
    results.intelligence.forEach(intel => {
      colonyMemory.storeMemory('enemy_movements', intel);
    });

    // Update threat level if new threats discovered
    if (results.threat_assessments.length > 0) {
      const maxThreat = Math.max(...results.threat_assessments.map(t => t.threat_level || 0));
      if (maxThreat > colony.threat_level) {
        await colony.update({ threat_level: maxThreat });
      }
    }

    res.json({
      success: true,
      data: {
        colony_id: colony.id,
        results: results,
        memory_updates: {
          discoveries_stored: results.discoveries.length,
          intelligence_stored: results.intelligence.length
        }
      }
    });

  } catch (error) {
    console.error('Error processing exploration results:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Process player action for adaptive behavior
 */
const processPlayerAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId, actionData, gameContext } = req.body;

    if (!playerId || !actionData) {
      return res.status(400).json({ 
        error: 'Player ID and action data are required' 
      });
    }

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const adaptationResult = await colony.processPlayerAction(playerId, actionData, gameContext);

    res.json({
      success: true,
      adaptationResult: adaptationResult,
      colonyId: id,
      currentStrategy: colony.current_strategy,
      adaptationLevel: colony.adaptation_level
    });

  } catch (error) {
    console.error('Error processing player action:', error);
    res.status(500).json({ error: 'Failed to process player action' });
  }
};

/**
 * Evaluate attack triggers for a colony against targets
 */
const evaluateAttackTriggers = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetInfo, gameState } = req.body;

    if (!targetInfo) {
      return res.status(400).json({ 
        error: 'Target information is required' 
      });
    }

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const triggerResult = await colony.evaluateAttackTriggers(targetInfo, gameState || {});

    res.json({
      success: true,
      triggerResult: triggerResult,
      colonyId: id,
      currentThreatLevel: colony.threat_level
    });

  } catch (error) {
    console.error('Error evaluating attack triggers:', error);
    res.status(500).json({ error: 'Failed to evaluate attack triggers' });
  }
};

/**
 * Implement counter-strategy against a player
 */
const implementCounterStrategy = async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId, gameContext } = req.body;

    if (!playerId) {
      return res.status(400).json({ 
        error: 'Player ID is required' 
      });
    }

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const counterResult = await colony.implementCounterStrategy(playerId, gameContext || {});

    res.json({
      success: true,
      counterResult: counterResult,
      colonyId: id,
      currentStrategy: colony.current_strategy
    });

  } catch (error) {
    console.error('Error implementing counter-strategy:', error);
    res.status(500).json({ error: 'Failed to implement counter-strategy' });
  }
};

/**
 * Get player threat assessment
 */
const getPlayerThreatAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId } = req.params;

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const threatAssessment = colony.getPlayerThreatAssessment(playerId);

    res.json({
      success: true,
      threatAssessment: threatAssessment,
      colonyId: id,
      playerId: playerId
    });

  } catch (error) {
    console.error('Error getting threat assessment:', error);
    res.status(500).json({ error: 'Failed to get threat assessment' });
  }
};

/**
 * Get player behavior summary
 */
const getPlayerBehaviorSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId } = req.params;

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const behaviorSummary = colony.getPlayerBehaviorSummary(playerId);

    res.json({
      success: true,
      behaviorSummary: behaviorSummary,
      colonyId: id,
      playerId: playerId
    });

  } catch (error) {
    console.error('Error getting behavior summary:', error);
    res.status(500).json({ error: 'Failed to get behavior summary' });
  }
};

/**
 * Get adaptation status
 */
const getAdaptationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const adaptationStatus = colony.getAdaptationStatus();

    res.json({
      success: true,
      adaptationStatus: adaptationStatus,
      colonyId: id,
      currentStrategy: colony.current_strategy,
      adaptationLevel: colony.adaptation_level,
      lastAdaptation: colony.last_adaptation
    });

  } catch (error) {
    console.error('Error getting adaptation status:', error);
    res.status(500).json({ error: 'Failed to get adaptation status' });
  }
};

/**
 * Get trigger analysis
 */
const getTriggerAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const triggerAnalysis = colony.getTriggerAnalysis();

    res.json({
      success: true,
      triggerAnalysis: triggerAnalysis,
      colonyId: id
    });

  } catch (error) {
    console.error('Error getting trigger analysis:', error);
    res.status(500).json({ error: 'Failed to get trigger analysis' });
  }
};

/**
 * Get counter-strategy analysis
 */
const getCounterStrategyAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const counterStrategyAnalysis = colony.getCounterStrategyAnalysis();

    res.json({
      success: true,
      counterStrategyAnalysis: counterStrategyAnalysis,
      colonyId: id
    });

  } catch (error) {
    console.error('Error getting counter-strategy analysis:', error);
    res.status(500).json({ error: 'Failed to get counter-strategy analysis' });
  }
};

/**
 * Force adaptation for testing purposes
 */
const forceAdaptation = async (req, res) => {
  try {
    const { id } = req.params;
    const { playerId, reason } = req.body;

    if (!playerId) {
      return res.status(400).json({ 
        error: 'Player ID is required' 
      });
    }

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const adaptationResult = await colony.adaptiveStrategy.forceAdaptation(
      id, 
      playerId, 
      reason || 'forced_test_adaptation'
    );

    // Apply the adaptation if successful
    if (adaptationResult.adapted) {
      await colony.applyAdaptedStrategy(adaptationResult, playerId);
    }

    res.json({
      success: true,
      adaptationResult: adaptationResult,
      colonyId: id,
      forced: true
    });

  } catch (error) {
    console.error('Error forcing adaptation:', error);
    res.status(500).json({ error: 'Failed to force adaptation' });
  }
};

/**
 * Get comprehensive AI behavior analytics
 */
const getAIBehaviorAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const colony = await AIColony.findById(id);
    if (!colony) {
      return res.status(404).json({ error: 'AI Colony not found' });
    }

    const analytics = {
      colonyInfo: {
        id: colony.id,
        name: colony.name,
        personality: colony.personality,
        difficulty_level: colony.difficulty_level,
        current_strategy: colony.current_strategy,
        adaptation_level: colony.adaptation_level,
        threat_level: colony.threat_level
      },
      adaptationStatus: colony.getAdaptationStatus(),
      triggerAnalysis: colony.getTriggerAnalysis(),
      counterStrategyAnalysis: colony.getCounterStrategyAnalysis(),
      performanceMetrics: {
        total_ticks: colony.total_ticks,
        successful_attacks: colony.successful_attacks,
        failed_attacks: colony.failed_attacks,
        attack_success_rate: colony.total_attacks > 0 ? 
          colony.successful_attacks / (colony.successful_attacks + colony.failed_attacks) : 0,
        resources_gathered: colony.resources_gathered,
        territory_gained: colony.territory_gained
      },
      behaviorParameters: {
        aggression_level: colony.aggression_level,
        expansion_drive: colony.expansion_drive,
        military_focus: colony.military_focus,
        resource_efficiency: colony.resource_efficiency,
        adaptive_learning_rate: colony.adaptive_learning_rate
      }
    };

    res.json({
      success: true,
      analytics: analytics,
      colonyId: id,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting AI behavior analytics:', error);
    res.status(500).json({ error: 'Failed to get AI behavior analytics' });
  }
};

module.exports = {
  createAIColony,
  getAIColonies,
  getAIColonyById,
  updateAIColony,
  deleteAIColony,
  makeAIDecision,
  changeAIState,
  updateThreatLevel,
  addMemory,
  processAITick,
  getAIColonyStats,
  // New growth and difficulty endpoints
  processColonyGrowth,
  getGrowthProjection,
  getGrowthEfficiency,
  processAllColonyGrowth,
  updateDifficultyScaling,
  planExplorationStrategy,
  launchScoutMission,
  executeScoutStep,
  getColonyVisibility,
  getUnexploredAreas,
  getColonyMemory,
  searchColonyMemory,
  updateFogOfWar,
  processExplorationResults,
  processPlayerAction,
  evaluateAttackTriggers,
  implementCounterStrategy,
  getPlayerThreatAssessment,
  getPlayerBehaviorSummary,
  getAdaptationStatus,
  getTriggerAnalysis,
  getCounterStrategyAnalysis,
  forceAdaptation,
  getAIBehaviorAnalytics
}; 
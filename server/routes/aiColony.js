/**
 * AI Colony Routes
 * Provides REST API endpoints for AI colony management and behavior
 */

const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/aiColonyController');

/**
 * @route   POST /api/ai-colonies
 * @desc    Create a new AI colony
 * @access  Public (in production, this would be restricted)
 * @body    {
 *            name: string,
 *            map_seed: string,
 *            base_x: number,
 *            base_y: number,
 *            personality?: string,
 *            difficulty_level?: string,
 *            aggression_level?: number,
 *            expansion_drive?: number,
 *            growth_rate?: number,
 *            military_focus?: number
 *          }
 */
router.post('/', createAIColony);

/**
 * @route   GET /api/ai-colonies
 * @desc    Get all AI colonies
 * @access  Public
 * @query   active_only: boolean
 */
router.get('/', getAIColonies);

/**
 * @route   GET /api/ai-colonies/stats
 * @desc    Get AI colony statistics
 * @access  Public
 */
router.get('/stats', getAIColonyStats);

/**
 * @route   POST /api/ai-colonies/tick
 * @desc    Process AI tick for all colonies
 * @access  Public
 * @body    { game_state?: object }
 */
router.post('/tick', processAITick);

/**
 * @route   GET /api/ai-colonies/:id
 * @desc    Get AI colony by ID
 * @access  Public
 * @param   id: string - Colony ID
 */
router.get('/:id', getAIColonyById);

/**
 * @route   PUT /api/ai-colonies/:id
 * @desc    Update AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { [field]: any } - Fields to update
 */
router.put('/:id', updateAIColony);

/**
 * @route   DELETE /api/ai-colonies/:id
 * @desc    Delete AI colony
 * @access  Public
 * @param   id: string - Colony ID
 */
router.delete('/:id', deleteAIColony);

/**
 * @route   POST /api/ai-colonies/:id/decide
 * @desc    Make AI decision for a colony
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { game_state?: object }
 */
router.post('/:id/decide', makeAIDecision);

/**
 * @route   POST /api/ai-colonies/:id/change-state
 * @desc    Change AI colony state
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { new_state: string, reason?: string }
 */
router.post('/:id/change-state', changeAIState);

/**
 * @route   POST /api/ai-colonies/:id/update-threat
 * @desc    Update threat level for AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { nearby_enemies?: array, recent_attacks?: array }
 */
router.post('/:id/update-threat', updateThreatLevel);

/**
 * @route   POST /api/ai-colonies/:id/memory
 * @desc    Add memory to AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { type: string, data: object }
 */
router.post('/:id/memory', addMemory);

/**
 * @route   POST /api/ai-colonies/process-all-growth
 * @desc    Process growth for all AI colonies
 * @access  Public
 * @body    { game_state?: object }
 */
router.post('/process-all-growth', processAllColonyGrowth);

/**
 * @route   POST /api/ai-colonies/:id/process-growth
 * @desc    Process growth for a specific AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { game_state?: object }
 */
router.post('/:id/process-growth', processColonyGrowth);

/**
 * @route   GET /api/ai-colonies/:id/growth-projection
 * @desc    Get growth projection for AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @query   ticks: number - Number of ticks to project
 * @body    { game_state?: object }
 */
router.get('/:id/growth-projection', getGrowthProjection);

/**
 * @route   GET /api/ai-colonies/:id/growth-efficiency
 * @desc    Get growth efficiency analysis for AI colony
 * @access  Public
 * @param   id: string - Colony ID
 */
router.get('/:id/growth-efficiency', getGrowthEfficiency);

/**
 * @route   POST /api/ai-colonies/:id/update-difficulty
 * @desc    Update difficulty scaling for AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { difficulty_level?: string, player_performance_data?: object }
 */
router.post('/:id/update-difficulty', updateDifficultyScaling);

/**
 * @route   POST /api/ai-colonies/:id/plan-exploration
 * @desc    Plan exploration strategy for AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { game_state?: object }
 */
router.post('/:id/plan-exploration', planExplorationStrategy);

/**
 * @route   POST /api/ai-colonies/:id/launch-scout-mission
 * @desc    Create and launch scout mission for AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { assignment: object, game_state?: object }
 */
router.post('/:id/launch-scout-mission', launchScoutMission);

/**
 * @route   POST /api/ai-colonies/:id/execute-scout-step
 * @desc    Execute a step in a scout mission
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { mission: object, current_tick: number, game_state?: object }
 */
router.post('/:id/execute-scout-step', executeScoutStep);

/**
 * @route   GET /api/ai-colonies/:id/visibility
 * @desc    Get visibility status and fog-of-war information for AI colony
 * @access  Public
 * @param   id: string - Colony ID
 */
router.get('/:id/visibility', getColonyVisibility);

/**
 * @route   GET /api/ai-colonies/:id/unexplored-areas
 * @desc    Get unexplored areas around AI colony
 * @access  Public
 * @param   id: string - Colony ID
 * @query   radius: number - Search radius (default: 15)
 */
router.get('/:id/unexplored-areas', getUnexploredAreas);

/**
 * @route   GET /api/ai-colonies/:id/memory
 * @desc    Get colony memory information
 * @access  Public
 * @param   id: string - Colony ID
 * @query   category: string - Memory category to retrieve
 * @query   limit: number - Maximum number of memories to return (default: 20)
 */
router.get('/:id/memory', getColonyMemory);

/**
 * @route   POST /api/ai-colonies/:id/search-memory
 * @desc    Search colony memories with criteria
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { search_criteria: object }
 */
router.post('/:id/search-memory', searchColonyMemory);

/**
 * @route   POST /api/ai-colonies/:id/update-fog-of-war
 * @desc    Update fog-of-war for AI colony
 * @access  Public
 * @param   id: string - Colony ID
 */
router.post('/:id/update-fog-of-war', updateFogOfWar);

/**
 * @route   POST /api/ai-colonies/:id/process-exploration-results
 * @desc    Process exploration results and update colony memory
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { exploration_data: object }
 */
router.post('/:id/process-exploration-results', processExplorationResults);

/**
 * @route   POST /api/ai-colonies/:id/process-player-action
 * @desc    Process player action for adaptive behavior
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { playerId: string, actionData: object, gameContext?: object }
 */
router.post('/:id/process-player-action', processPlayerAction);

/**
 * @route   POST /api/ai-colonies/:id/evaluate-attack-triggers
 * @desc    Evaluate attack triggers for a colony against targets
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { targetInfo: object, gameState?: object }
 */
router.post('/:id/evaluate-attack-triggers', evaluateAttackTriggers);

/**
 * @route   POST /api/ai-colonies/:id/implement-counter-strategy
 * @desc    Implement counter-strategy against a player
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { playerId: string, gameContext?: object }
 */
router.post('/:id/implement-counter-strategy', implementCounterStrategy);

/**
 * @route   GET /api/ai-colonies/:id/player/:playerId/threat-assessment
 * @desc    Get player threat assessment
 * @access  Public
 * @param   id: string - Colony ID
 * @param   playerId: string - Player ID
 */
router.get('/:id/player/:playerId/threat-assessment', getPlayerThreatAssessment);

/**
 * @route   GET /api/ai-colonies/:id/player/:playerId/behavior-summary
 * @desc    Get player behavior summary
 * @access  Public
 * @param   id: string - Colony ID
 * @param   playerId: string - Player ID
 */
router.get('/:id/player/:playerId/behavior-summary', getPlayerBehaviorSummary);

/**
 * @route   GET /api/ai-colonies/:id/adaptation-status
 * @desc    Get adaptation status
 * @access  Public
 * @param   id: string - Colony ID
 */
router.get('/:id/adaptation-status', getAdaptationStatus);

/**
 * @route   GET /api/ai-colonies/:id/trigger-analysis
 * @desc    Get attack trigger analysis
 * @access  Public
 * @param   id: string - Colony ID
 */
router.get('/:id/trigger-analysis', getTriggerAnalysis);

/**
 * @route   GET /api/ai-colonies/:id/counter-strategy-analysis
 * @desc    Get counter-strategy effectiveness analysis
 * @access  Public
 * @param   id: string - Colony ID
 */
router.get('/:id/counter-strategy-analysis', getCounterStrategyAnalysis);

/**
 * @route   POST /api/ai-colonies/:id/force-adaptation
 * @desc    Force adaptation for testing purposes
 * @access  Public
 * @param   id: string - Colony ID
 * @body    { playerId: string, reason?: string }
 */
router.post('/:id/force-adaptation', forceAdaptation);

/**
 * @route   GET /api/ai-colonies/:id/behavior-analytics
 * @desc    Get comprehensive AI behavior analytics
 * @access  Public
 * @param   id: string - Colony ID
 */
router.get('/:id/behavior-analytics', getAIBehaviorAnalytics);

module.exports = router; 
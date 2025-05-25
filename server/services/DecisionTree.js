/**
 * DecisionTree class for AI colony decision making
 * Evaluates game conditions and returns appropriate actions
 */

const { AI_STATES, PERSONALITY_TRAITS } = require('../constants/AI');

class DecisionTree {
  constructor() {
    this.conditions = new Map();
    this.actions = new Map();
    this.strategies = new Map();
    
    // Initialize decision tree structure
    this.initializeDecisionTree();
  }

  /**
   * Initialize the decision tree with conditions and actions
   */
  initializeDecisionTree() {
    // Resource-based conditions
    this.addCondition('low_food', (colony, gameState) => colony.food_storage < 50);
    this.addCondition('high_food', (colony, gameState) => colony.food_storage > 200);
    this.addCondition('medium_food', (colony, gameState) => colony.food_storage >= 50 && colony.food_storage <= 200);
    
    // Population-based conditions
    this.addCondition('low_population', (colony, gameState) => colony.population < 30);
    this.addCondition('high_population', (colony, gameState) => colony.population > 80);
    this.addCondition('can_grow', (colony, gameState) => colony.population < colony.max_population);
    
    // Threat-based conditions
    this.addCondition('high_threat', (colony, gameState) => colony.threat_level > 0.7);
    this.addCondition('medium_threat', (colony, gameState) => colony.threat_level > 0.3 && colony.threat_level <= 0.7);
    this.addCondition('low_threat', (colony, gameState) => colony.threat_level <= 0.3);
    
    // Territory and exploration conditions
    this.addCondition('unexplored_areas', (colony, gameState) => colony.scouted_areas.length < 10);
    this.addCondition('has_target', (colony, gameState) => colony.target_colony_id !== null);
    this.addCondition('territory_small', (colony, gameState) => colony.territory_size < 5);
    
    // Time-based conditions
    this.addCondition('early_game', (colony, gameState) => colony.total_ticks < 100);
    this.addCondition('mid_game', (colony, gameState) => colony.total_ticks >= 100 && colony.total_ticks < 500);
    this.addCondition('late_game', (colony, gameState) => colony.total_ticks >= 500);
    
    // Initialize actions
    this.initializeActions();
  }

  /**
   * Initialize available actions
   */
  initializeActions() {
    // Resource gathering actions
    this.addAction('gather_food', {
      priority: 0.8,
      cost: 10,
      cooldown: 3,
      requirements: ['low_food'],
      effects: { food_storage: 30 }
    });

    this.addAction('gather_wood', {
      priority: 0.6,
      cost: 15,
      cooldown: 4,
      requirements: [],
      effects: { wood_storage: 25 }
    });

    this.addAction('gather_stone', {
      priority: 0.5,
      cost: 20,
      cooldown: 5,
      requirements: [],
      effects: { stone_storage: 20 }
    });

    // Population and growth actions
    this.addAction('grow_population', {
      priority: 0.7,
      cost: 50,
      cooldown: 10,
      requirements: ['high_food', 'can_grow'],
      effects: { population: 5 }
    });

    this.addAction('build_infrastructure', {
      priority: 0.6,
      cost: 100,
      cooldown: 15,
      requirements: ['medium_food'],
      effects: { max_population: 10, territory_size: 1 }
    });

    // Military actions
    this.addAction('build_defenses', {
      priority: 0.8,
      cost: 80,
      cooldown: 12,
      requirements: ['medium_threat'],
      effects: { defense_rating: 0.2 }
    });

    this.addAction('train_soldiers', {
      priority: 0.7,
      cost: 60,
      cooldown: 8,
      requirements: ['high_food'],
      effects: { military_strength: 0.3 }
    });

    this.addAction('launch_attack', {
      priority: 0.9,
      cost: 150,
      cooldown: 20,
      requirements: ['has_target', 'high_population'],
      effects: { reputation: 0.1 }
    });

    // Exploration actions
    this.addAction('send_scouts', {
      priority: 0.6,
      cost: 30,
      cooldown: 8,
      requirements: ['unexplored_areas'],
      effects: { scouted_areas: 2 }
    });

    this.addAction('establish_outpost', {
      priority: 0.5,
      cost: 120,
      cooldown: 25,
      requirements: ['territory_small', 'high_food'],
      effects: { territory_size: 2 }
    });

    // State transition actions
    this.addAction('transition_to_growth', {
      priority: 0.7,
      cost: 0,
      cooldown: 2,
      requirements: ['high_food', 'low_threat'],
      effects: { state_change: AI_STATES.GROWING }
    });

    this.addAction('transition_to_defense', {
      priority: 0.9,
      cost: 0,
      cooldown: 1,
      requirements: ['high_threat'],
      effects: { state_change: AI_STATES.DEFENDING }
    });

    this.addAction('transition_to_attack', {
      priority: 0.8,
      cost: 0,
      cooldown: 3,
      requirements: ['has_target', 'high_population'],
      effects: { state_change: AI_STATES.ATTACKING }
    });

    this.addAction('transition_to_exploration', {
      priority: 0.6,
      cost: 5,
      cooldown: 5,
      requirements: ['unexplored_areas', 'medium_food'],
      effects: { state_change: AI_STATES.EXPLORING }
    });
  }

  /**
   * Add a condition to the decision tree
   */
  addCondition(name, evaluator) {
    this.conditions.set(name, evaluator);
  }

  /**
   * Add an action to the decision tree
   */
  addAction(name, actionData) {
    this.actions.set(name, actionData);
  }

  /**
   * Evaluate a condition
   */
  evaluateCondition(conditionName, colony, gameState) {
    const condition = this.conditions.get(conditionName);
    if (!condition) {
      console.warn(`Unknown condition: ${conditionName}`);
      return false;
    }
    return condition(colony, gameState);
  }

  /**
   * Get all available actions for the current game state
   */
  getAvailableActions(colony, gameState) {
    const availableActions = [];

    for (const [actionName, actionData] of this.actions) {
      // Check if all requirements are met
      const requirementsMet = actionData.requirements.every(req => 
        this.evaluateCondition(req, colony, gameState)
      );

      if (requirementsMet) {
        availableActions.push({
          name: actionName,
          ...actionData
        });
      }
    }

    return availableActions;
  }

  /**
   * Make a decision based on current colony state and game conditions
   */
  makeDecision(colony, gameState = {}) {
    // Get all available actions
    const availableActions = this.getAvailableActions(colony, gameState);

    if (availableActions.length === 0) {
      return null;
    }

    // Filter actions the colony can afford
    const affordableActions = availableActions.filter(action => 
      colony.food_storage >= (action.cost || 0)
    );

    if (affordableActions.length === 0) {
      return null;
    }

    // Score actions based on priority and personality
    const scoredActions = affordableActions.map(action => ({
      ...action,
      score: this.scoreAction(action, colony, gameState)
    }));

    // Sort by score and return the best action
    scoredActions.sort((a, b) => b.score - a.score);
    return scoredActions[0];
  }

  /**
   * Score an action based on colony personality and current conditions
   */
  scoreAction(action, colony, gameState) {
    let score = action.priority || 0.5;

    // Apply personality modifiers
    score *= this.getPersonalityModifier(action, colony.personality);

    // Apply state-specific modifiers
    score *= this.getStateModifier(action, colony.ai_state);

    // Apply threat level modifiers
    score *= this.getThreatModifier(action, colony.threat_level);

    // Apply urgency modifiers based on resources
    score *= this.getUrgencyModifier(action, colony);

    // Add some randomness for unpredictability (±10%)
    score *= (0.9 + Math.random() * 0.2);

    return Math.max(0, score);
  }

  /**
   * Get personality-based score modifier
   */
  getPersonalityModifier(action, personality) {
    const modifiers = {
      [PERSONALITY_TRAITS.AGGRESSIVE]: {
        'launch_attack': 1.4,
        'train_soldiers': 1.3,
        'gather_food': 0.8,
        'build_defenses': 0.9
      },
      [PERSONALITY_TRAITS.DEFENSIVE]: {
        'build_defenses': 1.4,
        'build_infrastructure': 1.3,
        'launch_attack': 0.7,
        'send_scouts': 0.8
      },
      [PERSONALITY_TRAITS.EXPANSIONIST]: {
        'send_scouts': 1.4,
        'establish_outpost': 1.3,
        'gather_food': 1.2,
        'build_defenses': 0.8
      },
      [PERSONALITY_TRAITS.BUILDER]: {
        'build_infrastructure': 1.4,
        'grow_population': 1.3,
        'gather_wood': 1.2,
        'gather_stone': 1.2
      },
      [PERSONALITY_TRAITS.MILITANT]: {
        'train_soldiers': 1.4,
        'launch_attack': 1.3,
        'build_defenses': 1.2,
        'gather_food': 1.1
      },
      [PERSONALITY_TRAITS.OPPORTUNIST]: {
        // Balanced approach - no strong modifiers
      }
    };

    const personalityModifiers = modifiers[personality] || {};
    return personalityModifiers[action.name] || 1.0;
  }

  /**
   * Get state-based score modifier
   */
  getStateModifier(action, currentState) {
    const stateModifiers = {
      [AI_STATES.GATHERING]: {
        'gather_food': 1.3,
        'gather_wood': 1.2,
        'gather_stone': 1.1,
        'launch_attack': 0.5
      },
      [AI_STATES.GROWING]: {
        'grow_population': 1.4,
        'build_infrastructure': 1.3,
        'gather_food': 1.1,
        'launch_attack': 0.6
      },
      [AI_STATES.DEFENDING]: {
        'build_defenses': 1.4,
        'train_soldiers': 1.3,
        'gather_food': 1.1,
        'send_scouts': 0.7
      },
      [AI_STATES.ATTACKING]: {
        'launch_attack': 1.4,
        'train_soldiers': 1.2,
        'gather_food': 1.1,
        'build_infrastructure': 0.6
      },
      [AI_STATES.EXPLORING]: {
        'send_scouts': 1.4,
        'establish_outpost': 1.2,
        'gather_food': 1.1,
        'build_defenses': 0.8
      }
    };

    const currentStateModifiers = stateModifiers[currentState] || {};
    return currentStateModifiers[action.name] || 1.0;
  }

  /**
   * Get threat-based score modifier
   */
  getThreatModifier(action, threatLevel) {
    if (threatLevel > 0.7) {
      // High threat - prioritize defense and military
      const highThreatModifiers = {
        'build_defenses': 1.4,
        'train_soldiers': 1.3,
        'transition_to_defense': 1.5,
        'gather_food': 1.1,
        'send_scouts': 0.6,
        'establish_outpost': 0.5
      };
      return highThreatModifiers[action.name] || 1.0;
    } else if (threatLevel > 0.3) {
      // Medium threat - balanced approach
      const mediumThreatModifiers = {
        'build_defenses': 1.2,
        'train_soldiers': 1.1,
        'gather_food': 1.1
      };
      return mediumThreatModifiers[action.name] || 1.0;
    } else {
      // Low threat - focus on growth and expansion
      const lowThreatModifiers = {
        'grow_population': 1.3,
        'build_infrastructure': 1.2,
        'send_scouts': 1.2,
        'establish_outpost': 1.1,
        'build_defenses': 0.8
      };
      return lowThreatModifiers[action.name] || 1.0;
    }
  }

  /**
   * Get urgency modifier based on resource levels
   */
  getUrgencyModifier(action, colony) {
    let modifier = 1.0;

    // Food urgency
    if (colony.food_storage < 30) {
      if (action.name === 'gather_food') modifier *= 1.5;
      if (action.name.includes('build') || action.name.includes('train')) modifier *= 0.6;
    }

    // Population urgency
    if (colony.population < 20) {
      if (action.name === 'grow_population') modifier *= 1.4;
      if (action.name === 'launch_attack') modifier *= 0.5;
    }

    // Territory urgency
    if (colony.territory_size < 3) {
      if (action.name === 'establish_outpost') modifier *= 1.3;
      if (action.name === 'send_scouts') modifier *= 1.2;
    }

    return modifier;
  }

  /**
   * Get decision explanation for debugging
   */
  getDecisionExplanation(colony, gameState, decision) {
    if (!decision) {
      return 'No valid actions available or insufficient resources';
    }

    const conditions = [];
    
    // Check which conditions are currently true
    for (const [conditionName, evaluator] of this.conditions) {
      if (evaluator(colony, gameState)) {
        conditions.push(conditionName);
      }
    }

    return {
      action: decision.name,
      score: decision.score,
      priority: decision.priority,
      cost: decision.cost,
      active_conditions: conditions,
      personality: colony.personality,
      state: colony.ai_state,
      threat_level: colony.threat_level,
      food_storage: colony.food_storage,
      population: colony.population
    };
  }
}

module.exports = DecisionTree; 
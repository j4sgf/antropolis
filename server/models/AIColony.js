/**
 * AIColony class for AI-controlled enemy colonies
 * Extends the base Colony class with AI-specific behavior and state management
 */

const Colony = require('./Colony');
const { supabase, handleDatabaseError } = require('../config/database');
const DecisionTree = require('../services/DecisionTree');
const ResourceStrategy = require('../services/strategies/ResourceStrategy');
const DefenseStrategy = require('../services/strategies/DefenseStrategy');
const AttackStrategy = require('../services/strategies/AttackStrategy');
const GrowthStrategy = require('../services/strategies/GrowthStrategy');
const GrowthCalculator = require('../services/GrowthCalculator');
const ExplorationManager = require('../services/ExplorationManager');
const VisibilityService = require('../services/VisibilityService');
const ColonyMemory = require('../services/ai/ColonyMemory');
const PlayerMonitor = require('../services/ai/PlayerMonitor');
const AdaptiveStrategy = require('../services/ai/AdaptiveStrategy');
const TriggerConditions = require('../services/ai/TriggerConditions');
const CounterStrategies = require('../services/ai/CounterStrategies');
const AIEventService = require('../services/AIEventService');

// AI Colony states
const AI_STATES = {
  GATHERING: 'gathering',
  DEFENDING: 'defending', 
  ATTACKING: 'attacking',
  GROWING: 'growing',
  EXPLORING: 'exploring',
  IDLE: 'idle'
};

// Personality traits that affect AI behavior
const PERSONALITY_TRAITS = {
  AGGRESSIVE: 'aggressive',     // Attacks more frequently
  DEFENSIVE: 'defensive',       // Focuses on defense and growth
  EXPANSIONIST: 'expansionist', // Prioritizes territory expansion
  OPPORTUNIST: 'opportunist',   // Adapts based on circumstances
  MILITANT: 'militant',         // Military-focused approach
  BUILDER: 'builder'            // Infrastructure and development focused
};

class AIColony extends Colony {
  constructor(data = {}) {
    super(data);
    
    // AI-specific properties
    this.is_ai = true;
    this.ai_state = data.ai_state || AI_STATES.GATHERING;
    this.personality = data.personality || PERSONALITY_TRAITS.OPPORTUNIST;
    this.difficulty_level = data.difficulty_level || 'medium';
    
    // AI behavior parameters
    this.aggression_level = data.aggression_level || Math.random();
    this.expansion_drive = data.expansion_drive || Math.random();
    this.growth_rate = data.growth_rate || (0.8 + Math.random() * 0.4);
    this.military_focus = data.military_focus || Math.random();
    this.resource_efficiency = data.resource_efficiency || (0.8 + Math.random() * 0.4);
    
    // AI state management
    this.threat_level = data.threat_level || 0.0;
    this.decision_cooldown = data.decision_cooldown || 0;
    this.last_decision = data.last_decision || null;
    this.target_colony_id = data.target_colony_id || null;
    
    // AI memory and learning
    this.memory = data.memory || {
      discovered_resources: [],
      enemy_movements: [],
      battle_history: [],
      territory_changes: []
    };
    this.scouted_areas = data.scouted_areas || [];
    this.known_enemies = data.known_enemies || [];
    
    // Exploration-specific properties
    this.active_scout_missions = data.active_scout_missions || [];
    this.exploration_priorities = data.exploration_priorities || [];
    this.last_exploration_update = data.last_exploration_update || null;
    this.visibility_range = data.visibility_range || 5;
    this.exploration_budget = data.exploration_budget || 0.2; // Percentage of population for scouting
    
    // Adaptive Strategy properties
    this.current_strategy = data.current_strategy || 'balanced';
    this.adaptation_level = data.adaptation_level || 0.5;
    this.last_adaptation = data.last_adaptation || null;
    this.tracked_players = data.tracked_players || [];
    this.counter_strategies = data.counter_strategies || {};
    this.attack_trigger_state = data.attack_trigger_state || {};
    this.adaptive_learning_rate = data.adaptive_learning_rate || 0.1;
    
    // Performance tracking
    this.total_ticks = data.total_ticks || 0;
    this.successful_attacks = data.successful_attacks || 0;
    this.failed_attacks = data.failed_attacks || 0;
    this.resources_gathered = data.resources_gathered || 0;
    this.territory_gained = data.territory_gained || 0;
    this.last_tick = data.last_tick || null;
    
    // Growth tracking
    this.growth_history = data.growth_history || [];
    this.last_growth_tick = data.last_growth_tick || 0;
    this.infrastructure_level = data.infrastructure_level || 0;
    this.development_phase = data.development_phase || 'early';
    
    // Initialize AI systems
    this.decisionTree = new DecisionTree();
    this.resourceStrategy = new ResourceStrategy();
    this.defenseStrategy = new DefenseStrategy();
    this.attackStrategy = new AttackStrategy();
    this.growthStrategy = new GrowthStrategy();
    this.growthCalculator = new GrowthCalculator();
    this.explorationManager = new ExplorationManager();
    this.colonyMemory = new ColonyMemory(this.id);
    
    // Initialize adaptive strategy components
    this.playerMonitor = new PlayerMonitor();
    this.adaptiveStrategy = new AdaptiveStrategy();
    this.triggerConditions = new TriggerConditions();
    this.counterStrategies = new CounterStrategies();
    this.eventService = new AIEventService();
    
    // State transition rules
    this.stateTransitions = this.initializeStateTransitions();
    
    // Initialize adaptive components
    this.initializeAdaptiveComponents();
  }

  /**
   * Initialize adaptive strategy components
   */
  initializeAdaptiveComponents() {
    // Initialize adaptive strategy tracking
    this.adaptiveStrategy.initializeColony(this.id, this.current_strategy);
    
    // Initialize trigger conditions tracking
    this.triggerConditions.initializeColony(this.id);
    
    // Initialize counter strategies tracking
    this.counterStrategies.initializeColony(this.id);
    
    // Subscribe to AI events for this colony
    this.subscribeToEvents();
  }

  /**
   * Subscribe to relevant AI events
   */
  subscribeToEvents() {
    // Subscribe to strategy changes
    this.eventService.subscribe('ai_strategy_changed', (event) => {
      if (event.colonyId === this.id) {
        this.onStrategyChanged(event);
      }
    }, `colony_${this.id}_strategy`);
    
    // Subscribe to attack triggers
    this.eventService.subscribe('ai_attack_launched', (event) => {
      if (event.colonyId === this.id) {
        this.onAttackLaunched(event);
      }
    }, `colony_${this.id}_attack`);
    
    // Subscribe to adaptation events
    this.eventService.subscribe('ai_adaptation_triggered', (event) => {
      if (event.colonyId === this.id) {
        this.onAdaptationTriggered(event);
      }
    }, `colony_${this.id}_adaptation`);
  }

  /**
   * Process player action and adapt accordingly
   */
  async processPlayerAction(playerId, actionData, gameContext = {}) {
    try {
      // Record player action in monitor
      this.playerMonitor.recordAction(playerId, actionData);
      
      // Check if adaptation is needed
      const adaptationResult = await this.adaptiveStrategy.adaptToPlayer(
        this.id, 
        playerId, 
        gameContext
      );
      
      if (adaptationResult.adapted) {
        // Apply the new strategy
        await this.applyAdaptedStrategy(adaptationResult, playerId);
        
        // Trigger adaptation event
        this.eventService.addEvent('ai_adaptation_triggered', {
          colonyId: this.id,
          playerId: playerId,
          oldBehavior: adaptationResult.oldStrategy,
          newBehavior: adaptationResult.newStrategy,
          triggerReason: adaptationResult.reasoning,
          noticeable: adaptationResult.adaptationLevel > 0.6,
          intensity: adaptationResult.adaptationLevel
        }, 'medium', this.id);
      }
      
      return adaptationResult;
      
    } catch (error) {
      console.error('Error processing player action:', error);
      return { adapted: false, error: error.message };
    }
  }

  /**
   * Apply adapted strategy to colony behavior
   */
  async applyAdaptedStrategy(adaptationResult, playerId) {
    const oldStrategy = this.current_strategy;
    this.current_strategy = adaptationResult.newStrategy;
    this.adaptation_level = adaptationResult.adaptationLevel;
    this.last_adaptation = new Date();
    
    // Update behavior parameters based on new strategy
    this.updateBehaviorParameters(adaptationResult.changes);
    
    // Trigger strategy change event
    this.eventService.addEvent('ai_strategy_changed', {
      colonyId: this.id,
      oldStrategy: oldStrategy,
      newStrategy: this.current_strategy,
      reasoning: adaptationResult.reasoning,
      adaptationLevel: this.adaptation_level,
      targetPlayer: playerId
    }, 'high', this.id);
    
    // Save changes
    await this.update({
      current_strategy: this.current_strategy,
      adaptation_level: this.adaptation_level,
      last_adaptation: this.last_adaptation
    });
  }

  /**
   * Update behavior parameters based on strategy changes
   */
  updateBehaviorParameters(changes) {
    if (changes.behaviorModifications) {
      const mods = changes.behaviorModifications;
      
      if (mods.aggressionModifier !== undefined) {
        this.aggression_level = Math.max(0.1, Math.min(0.9, 
          this.aggression_level + mods.aggressionModifier));
      }
      
      if (mods.expansionModifier !== undefined) {
        this.expansion_drive = Math.max(0.1, Math.min(0.9, 
          this.expansion_drive + mods.expansionModifier));
      }
      
      if (mods.riskTolerance !== undefined) {
        // Update risk tolerance in decision making
        this.risk_tolerance = mods.riskTolerance;
      }
      
      if (mods.resourceAllocation) {
        // Update resource allocation preferences
        this.resource_allocation_preferences = mods.resourceAllocation;
      }
    }
  }

  /**
   * Evaluate attack triggers against a target
   */
  async evaluateAttackTriggers(targetInfo, gameState) {
    try {
      const colonyState = this.getColonyState();
      
      const triggerResult = this.triggerConditions.evaluateAttackTriggers(
        this.id,
        targetInfo,
        gameState,
        colonyState
      );
      
      return triggerResult;
      
    } catch (error) {
      console.error('Error evaluating attack triggers:', error);
      return { shouldAttack: false, reason: 'Error in trigger evaluation' };
    }
  }

  /**
   * Select and implement counter-strategy against a player
   */
  async implementCounterStrategy(playerId, gameContext = {}) {
    try {
      const playerBehavior = this.playerMonitor.getPlayerBehaviorSummary(playerId);
      
      if (!playerBehavior) {
        return { success: false, reason: 'Insufficient player data' };
      }
      
      const counterResult = await this.counterStrategies.selectCounterStrategy(
        this.id,
        playerId,
        playerBehavior,
        gameContext
      );
      
      // Apply counter-strategy implementation
      await this.applyCounterStrategyImplementation(counterResult.implementation);
      
      return counterResult;
      
    } catch (error) {
      console.error('Error implementing counter-strategy:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply counter-strategy implementation to colony
   */
  async applyCounterStrategyImplementation(implementation) {
    // Apply resource allocations
    if (implementation.resourceAllocations) {
      this.resource_allocation_preferences = implementation.resourceAllocations;
    }
    
    // Apply behavior modifications
    if (implementation.behaviorModifications) {
      this.updateBehaviorParameters({ behaviorModifications: implementation.behaviorModifications });
    }
    
    // Execute immediate actions
    if (implementation.immediateActions) {
      for (const action of implementation.immediateActions) {
        await this.executeCounterAction(action);
      }
    }
  }

  /**
   * Execute a counter-strategy action
   */
  async executeCounterAction(action) {
    switch (action) {
      case 'identify_economic_targets':
        await this.identifyEconomicTargets();
        break;
      case 'prepare_raid_forces':
        await this.prepareRaidForces();
        break;
      case 'strengthen_defensive_positions':
        await this.strengthenDefensivePositions();
        break;
      case 'train_mobile_units':
        await this.trainMobileUnits();
        break;
      case 'identify_strategic_positions':
        await this.identifyStrategicPositions();
        break;
      default:
        console.log(`Executing counter action: ${action}`);
    }
  }

  /**
   * Get current colony state for decision making
   */
  getColonyState() {
    return {
      position: { x: this.x || 0, y: this.y || 0 },
      resources: {
        food: this.food_storage || 0,
        wood: this.wood_storage || 0,
        stone: this.stone_storage || 0,
        minerals: this.mineral_storage || 0,
        water: this.water_storage || 0
      },
      totalResources: (this.food_storage || 0) + (this.wood_storage || 0) + 
                     (this.stone_storage || 0) + (this.mineral_storage || 0) + 
                     (this.water_storage || 0),
      militaryCapacity: this.military_capacity || 100,
      usedMilitaryCapacity: this.used_military_capacity || 0,
      territorySize: this.territory_size || 10,
      personality: { type: this.personality },
      aggression_level: this.aggression_level,
      expansion_drive: this.expansion_drive,
      military_focus: this.military_focus,
      economicGrowthRate: this.getEconomicGrowthRate(),
      tradeDisruption: this.getTradeDisruption(),
      maintenanceBurden: this.getMaintenanceBurden()
    };
  }

  /**
   * Calculate economic growth rate
   */
  getEconomicGrowthRate() {
    // Simplified calculation - in real implementation would be more complex
    const recentGrowth = this.growth_history.slice(-5);
    if (recentGrowth.length === 0) return 0.05;
    
    const avgGrowth = recentGrowth.reduce((sum, g) => sum + (g.growth_rate || 0), 0) / recentGrowth.length;
    return avgGrowth / 100; // Convert to decimal
  }

  /**
   * Calculate trade disruption level
   */
  getTradeDisruption() {
    // Placeholder - would calculate based on trade route status
    return Math.random() * 0.3; // 0-30% disruption
  }

  /**
   * Calculate maintenance burden
   */
  getMaintenanceBurden() {
    // Placeholder - would calculate based on infrastructure costs vs income
    const totalResources = this.getColonyState().totalResources;
    const infrastructureCost = this.infrastructure_level * 10;
    return Math.min(0.9, infrastructureCost / Math.max(1, totalResources));
  }

  /**
   * Get player threat assessment
   */
  getPlayerThreatAssessment(playerId) {
    return this.playerMonitor.getThreatAssessment(playerId);
  }

  /**
   * Get player behavior summary
   */
  getPlayerBehaviorSummary(playerId) {
    return this.playerMonitor.getPlayerBehaviorSummary(playerId);
  }

  /**
   * Get adaptation status
   */
  getAdaptationStatus() {
    return this.adaptiveStrategy.getAdaptationStatus(this.id);
  }

  /**
   * Get trigger analysis
   */
  getTriggerAnalysis() {
    return this.triggerConditions.getTriggerAnalysis(this.id);
  }

  /**
   * Get counter-strategy analysis
   */
  getCounterStrategyAnalysis() {
    return this.counterStrategies.getCounterStrategyAnalysis(this.id);
  }

  /**
   * Process AI tick - enhanced with adaptive behavior
   */
  async processAITick(gameState = {}) {
    try {
      this.total_ticks++;
      this.last_tick = new Date();
      
      // Standard AI processing
      const decision = this.makeStrategicDecision(gameState);
      
      // Check for player interactions and adapt
      await this.checkPlayerInteractions(gameState);
      
      // Evaluate attack opportunities
      await this.evaluateAttackOpportunities(gameState);
      
      // Process growth
      this.processGrowth(gameState);
      
      // Process exploration
      await this.executeExploration(gameState);
      
      // Update threat assessments
      this.updateThreatAssessments(gameState);
      
      return decision;
      
    } catch (error) {
      console.error('Error processing AI tick:', error);
      return this.makeBasicDecision(gameState);
    }
  }

  /**
   * Check for player interactions and trigger adaptations
   */
  async checkPlayerInteractions(gameState) {
    if (!gameState.players) return;
    
    for (const player of gameState.players) {
      // Check if player has taken actions that might trigger adaptation
      if (player.recentActions && player.recentActions.length > 0) {
        for (const action of player.recentActions) {
          await this.processPlayerAction(player.id, action, gameState);
        }
      }
    }
  }

  /**
   * Evaluate attack opportunities using trigger conditions
   */
  async evaluateAttackOpportunities(gameState) {
    if (!gameState.targetCandidates) return;
    
    for (const target of gameState.targetCandidates) {
      const triggerResult = await this.evaluateAttackTriggers(target, gameState);
      
      if (triggerResult.shouldAttack) {
        // Record potential attack
        this.triggerConditions.recordAttackLaunch(
          this.id, 
          triggerResult.attackType, 
          target
        );
        
        // Trigger attack event
        this.eventService.addEvent('ai_attack_launched', {
          colonyId: this.id,
          targetId: target.targetId,
          attackType: triggerResult.attackType,
          forces: this.estimateAttackForces(triggerResult.attackType),
          reasoning: triggerResult.reasons.join('; '),
          confidence: triggerResult.confidence,
          urgency: triggerResult.urgency
        }, triggerResult.urgency > 0.7 ? 'critical' : 'high', this.id);
        
        // Break after first attack opportunity (one attack at a time)
        break;
      }
    }
  }

  /**
   * Update threat assessments for tracked players
   */
  updateThreatAssessments(gameState) {
    if (!gameState.players) return;
    
    for (const player of gameState.players) {
      const threatAssessment = this.getPlayerThreatAssessment(player.id);
      
      if (threatAssessment && Math.abs(threatAssessment.threat_level - this.threat_level) > 0.1) {
        const oldThreatLevel = this.threat_level;
        this.threat_level = Math.max(this.threat_level, threatAssessment.threat_level);
        
        // Trigger threat level change event
        this.eventService.addEvent('ai_threat_level_changed', {
          colonyId: this.id,
          oldThreatLevel: oldThreatLevel,
          newThreatLevel: this.threat_level,
          targetId: player.id,
          reasons: threatAssessment.reasoning
        }, this.threat_level > 0.7 ? 'high' : 'medium', this.id);
      }
    }
  }

  /**
   * Estimate attack forces for a given attack type
   */
  estimateAttackForces(attackType) {
    const baseForce = this.used_military_capacity || 0;
    const multipliers = {
      raid: 0.2,
      skirmish: 0.4,
      assault: 0.6,
      siege: 0.8,
      campaign: 1.0
    };
    
    return Math.floor(baseForce * (multipliers[attackType] || 0.5));
  }

  /**
   * Event handlers
   */
  onStrategyChanged(event) {
    console.log(`Colony ${this.id} strategy changed: ${event.data.oldStrategy} -> ${event.data.newStrategy}`);
  }

  onAttackLaunched(event) {
    console.log(`Colony ${this.id} launched attack: ${event.data.attackType} on ${event.data.targetId}`);
  }

  onAdaptationTriggered(event) {
    console.log(`Colony ${this.id} adapted in response to player ${event.data.playerId}`);
  }

  // Placeholder methods for counter-strategy actions
  async identifyEconomicTargets() {
    console.log(`Colony ${this.id} identifying economic targets`);
  }

  async prepareRaidForces() {
    console.log(`Colony ${this.id} preparing raid forces`);
  }

  async strengthenDefensivePositions() {
    console.log(`Colony ${this.id} strengthening defensive positions`);
  }

  async trainMobileUnits() {
    console.log(`Colony ${this.id} training mobile units`);
  }

  async identifyStrategicPositions() {
    console.log(`Colony ${this.id} identifying strategic positions`);
  }

  /**
   * Initialize valid state transitions
   */
  initializeStateTransitions() {
    return {
      [AI_STATES.IDLE]: [AI_STATES.GATHERING, AI_STATES.EXPLORING, AI_STATES.GROWING],
      [AI_STATES.GATHERING]: [AI_STATES.GROWING, AI_STATES.DEFENDING, AI_STATES.EXPLORING, AI_STATES.IDLE],
      [AI_STATES.GROWING]: [AI_STATES.GATHERING, AI_STATES.DEFENDING, AI_STATES.ATTACKING, AI_STATES.EXPLORING],
      [AI_STATES.EXPLORING]: [AI_STATES.GATHERING, AI_STATES.GROWING, AI_STATES.DEFENDING, AI_STATES.ATTACKING],
      [AI_STATES.DEFENDING]: [AI_STATES.GATHERING, AI_STATES.ATTACKING, AI_STATES.GROWING],
      [AI_STATES.ATTACKING]: [AI_STATES.DEFENDING, AI_STATES.GATHERING, AI_STATES.GROWING, AI_STATES.IDLE]
    };
  }

  /**
   * Make a strategic decision using the decision tree and strategies
   */
  makeStrategicDecision(gameState = {}) {
    try {
      // Use decision tree for basic action selection
      const basicDecision = this.decisionTree.makeDecision(this, gameState);
      
      // Get strategic recommendations from specialized strategies
      const resourceStrategy = this.resourceStrategy.determineGatheringStrategy(this, gameState);
      const defenseStrategy = this.defenseStrategy.determineDefenseStrategy(this, gameState);
      const attackStrategy = this.attackStrategy.determineAttackStrategy(this, gameState);
      const growthStrategy = this.growthStrategy.determineGrowthStrategy(this, gameState);
      
      // Combine strategies into a comprehensive decision
      const strategicDecision = this.combineStrategies({
        basic: basicDecision,
        resource: resourceStrategy,
        defense: defenseStrategy,
        attack: attackStrategy,
        growth: growthStrategy
      }, gameState);
      
      // Store decision in memory
      this.storeMemory('decisions', {
        timestamp: new Date().toISOString(),
        decision: strategicDecision,
        state: this.ai_state,
        threat_level: this.threat_level
      });
      
      return strategicDecision;
      
    } catch (error) {
      console.error('Error making strategic decision:', error);
      return this.makeBasicDecision(gameState);
    }
  }

  /**
   * Combine multiple strategies into a single decision
   */
  combineStrategies(strategies, gameState) {
    const decision = {
      type: 'strategic',
      primary_action: null,
      secondary_actions: [],
      resource_focus: null,
      military_action: null,
      growth_focus: null,
      reasoning: [],
      confidence: 0.5,
      cooldown: 5,
      from: this.ai_state,
      to: this.ai_state
    };

    // Determine primary action based on current state and threat level
    if (this.threat_level > 0.7) {
      // High threat - prioritize defense
      decision.primary_action = strategies.defense.defensivePosture === 'fortress' ? 'build_defenses' : 'train_soldiers';
      decision.military_action = strategies.defense;
      decision.reasoning.push('High threat level prioritizes defensive actions');
      
      // Consider state transition to defending
      if (this.ai_state !== AI_STATES.DEFENDING) {
        decision.to = AI_STATES.DEFENDING;
      }
      
    } else if (this.ai_state === AI_STATES.ATTACKING && strategies.attack.targetColony) {
      // Currently attacking - continue with attack strategy
      decision.primary_action = 'launch_attack';
      decision.military_action = strategies.attack;
      decision.reasoning.push('Continuing active attack strategy');
      
    } else if (this.food_storage < 50) {
      // Low food - prioritize resource gathering
      decision.primary_action = 'gather_food';
      decision.resource_focus = strategies.resource.primaryResource;
      decision.reasoning.push('Critical food shortage requires immediate gathering');
      
      // Consider state transition to gathering
      if (this.ai_state !== AI_STATES.GATHERING) {
        decision.to = AI_STATES.GATHERING;
      }
      
    } else {
      // Normal conditions - use growth strategy
      decision.primary_action = this.getGrowthAction(strategies.growth);
      decision.growth_focus = strategies.growth.primaryFocus;
      decision.reasoning.push(`Growth strategy focuses on ${strategies.growth.primaryFocus}`);
      
      // Consider state transition based on growth focus
      if (strategies.growth.primaryFocus === 'military' && this.ai_state !== AI_STATES.DEFENDING) {
        decision.to = AI_STATES.DEFENDING;
      } else if (strategies.growth.primaryFocus === 'territory' && this.ai_state !== AI_STATES.EXPLORING) {
        decision.to = AI_STATES.EXPLORING;
      } else if (this.ai_state !== AI_STATES.GROWING) {
        decision.to = AI_STATES.GROWING;
      }
    }

    // Add secondary actions
    decision.secondary_actions = this.getSecondaryActions(strategies, decision.primary_action);

    // Set resource focus if not already set
    if (!decision.resource_focus) {
      decision.resource_focus = strategies.resource.primaryResource;
    }

    // Calculate confidence based on strategy alignment
    decision.confidence = this.calculateDecisionConfidence(strategies, decision);

    // Add strategy-specific reasoning
    decision.reasoning.push(...strategies.resource.reasoning.slice(0, 2));
    decision.reasoning.push(...strategies.growth.reasoning.slice(0, 2));

    return decision;
  }

  /**
   * Get primary action based on growth strategy
   */
  getGrowthAction(growthStrategy) {
    switch (growthStrategy.primaryFocus) {
      case 'population':
        return 'grow_population';
      case 'territory':
        return 'send_scouts';
      case 'military':
        return 'train_soldiers';
      case 'infrastructure':
        return 'build_infrastructure';
      case 'technology':
        return 'research_technology';
      default:
        return 'gather_food';
    }
  }

  /**
   * Get secondary actions to complement the primary action
   */
  getSecondaryActions(strategies, primaryAction) {
    const secondaryActions = [];

    // Always consider resource gathering as secondary if not primary
    if (!primaryAction.includes('gather')) {
      secondaryActions.push(`gather_${strategies.resource.secondaryResource}`);
    }

    // Add defensive actions if threat level is moderate
    if (this.threat_level > 0.3 && !primaryAction.includes('defense') && !primaryAction.includes('soldiers')) {
      secondaryActions.push('build_defenses');
    }

    // Add exploration if territory is small
    if (this.territory_size < 6 && !primaryAction.includes('scout')) {
      secondaryActions.push('send_scouts');
    }

    return secondaryActions.slice(0, 2); // Limit to 2 secondary actions
  }

  /**
   * Calculate decision confidence based on strategy alignment
   */
  calculateDecisionConfidence(strategies, decision) {
    let confidence = 0.5;

    // Increase confidence if strategies align
    if (strategies.resource.primaryResource === decision.resource_focus) {
      confidence += 0.1;
    }

    // Increase confidence based on resource availability
    if (this.food_storage > 100) {
      confidence += 0.1;
    }

    // Decrease confidence if under threat but not defending
    if (this.threat_level > 0.5 && decision.to !== AI_STATES.DEFENDING) {
      confidence -= 0.2;
    }

    // Increase confidence if decision matches personality
    if (this.personality === PERSONALITY_TRAITS.AGGRESSIVE && decision.primary_action.includes('attack')) {
      confidence += 0.2;
    } else if (this.personality === PERSONALITY_TRAITS.DEFENSIVE && decision.primary_action.includes('defense')) {
      confidence += 0.2;
    } else if (this.personality === PERSONALITY_TRAITS.BUILDER && decision.primary_action.includes('build')) {
      confidence += 0.2;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Fallback basic decision making
   */
  makeBasicDecision(gameState) {
    const decision = {
      type: 'basic',
      primary_action: 'gather_food',
      reasoning: ['Fallback to basic decision making'],
      confidence: 0.3,
      cooldown: 3,
      from: this.ai_state,
      to: this.ai_state
    };

    // Simple decision logic
    if (this.food_storage < 30) {
      decision.primary_action = 'gather_food';
      decision.reasoning = ['Critical food shortage'];
    } else if (this.threat_level > 0.7) {
      decision.primary_action = 'build_defenses';
      decision.reasoning = ['High threat level'];
      decision.to = AI_STATES.DEFENDING;
    } else if (this.population < this.max_population * 0.8) {
      decision.primary_action = 'grow_population';
      decision.reasoning = ['Population below capacity'];
      decision.to = AI_STATES.GROWING;
    }

    return decision;
  }

  /**
   * State machine for AI behavior
   */
  getValidStateTransitions() {
    const transitions = {
      [AI_STATES.IDLE]: [AI_STATES.GATHERING, AI_STATES.EXPLORING, AI_STATES.GROWING],
      [AI_STATES.GATHERING]: [AI_STATES.GROWING, AI_STATES.DEFENDING, AI_STATES.ATTACKING, AI_STATES.EXPLORING],
      [AI_STATES.GROWING]: [AI_STATES.GATHERING, AI_STATES.DEFENDING, AI_STATES.EXPLORING],
      [AI_STATES.DEFENDING]: [AI_STATES.GATHERING, AI_STATES.ATTACKING, AI_STATES.GROWING],
      [AI_STATES.ATTACKING]: [AI_STATES.GATHERING, AI_STATES.DEFENDING, AI_STATES.GROWING],
      [AI_STATES.EXPLORING]: [AI_STATES.GATHERING, AI_STATES.GROWING, AI_STATES.DEFENDING]
    };
    
    return transitions[this.ai_state] || [AI_STATES.GATHERING];
  }

  /**
   * Change AI state with validation
   */
  changeState(newState, reason = '') {
    const validTransitions = this.getValidStateTransitions();
    
    if (!validTransitions.includes(newState)) {
      console.log(`Invalid state transition from ${this.ai_state} to ${newState} for colony ${this.id}`);
      return false;
    }
    
    const oldState = this.ai_state;
    this.ai_state = newState;
    this.last_decision = {
      action: 'state_change',
      from: oldState,
      to: newState,
      reason: reason,
      timestamp: new Date().toISOString()
    };
    
    console.log(`AI Colony ${this.id} changed state: ${oldState} -> ${newState} (${reason})`);
    return true;
  }

  /**
   * Calculate resource priority based on current needs and personality
   */
  calculateResourcePriority(resourceType) {
    const basePriority = this.resource_priorities[resourceType] || 0.5;
    const personalityModifier = this.getPersonalityModifier(resourceType);
    const needsModifier = this.getResourceNeedsModifier(resourceType);
    
    return Math.min(1.0, basePriority * personalityModifier * needsModifier);
  }

  /**
   * Get personality-based modifier for resource priorities
   */
  getPersonalityModifier(resourceType) {
    switch (this.personality) {
      case PERSONALITY_TRAITS.AGGRESSIVE:
        return resourceType === 'food' ? 1.2 : (resourceType === 'minerals' ? 1.1 : 1.0);
      case PERSONALITY_TRAITS.DEFENSIVE:
        return resourceType === 'stone' ? 1.3 : (resourceType === 'wood' ? 1.2 : 1.0);
      case PERSONALITY_TRAITS.EXPANSIONIST:
        return resourceType === 'food' ? 1.3 : (resourceType === 'water' ? 1.2 : 1.0);
      case PERSONALITY_TRAITS.BUILDER:
        return resourceType === 'wood' ? 1.4 : (resourceType === 'stone' ? 1.3 : 1.0);
      case PERSONALITY_TRAITS.MILITANT:
        return resourceType === 'minerals' ? 1.4 : (resourceType === 'food' ? 1.2 : 1.0);
      default:
        return 1.0;
    }
  }

  /**
   * Get modifier based on current resource needs
   */
  getResourceNeedsModifier(resourceType) {
    // This would integrate with the colony's current resource levels
    // For now, return a base modifier
    return 1.0 + (Math.random() * 0.4 - 0.2); // ±20% variation
  }

  /**
   * Update threat level based on nearby enemy activities
   */
  updateThreatLevel(nearbyEnemies = [], recentAttacks = []) {
    let threatScore = 0;
    
    // Factor in nearby enemy colonies
    nearbyEnemies.forEach(enemy => {
      const distance = Math.sqrt(
        Math.pow(enemy.base_x - this.base_x, 2) + 
        Math.pow(enemy.base_y - this.base_y, 2)
      );
      const threatContribution = Math.max(0, 1 - (distance / 20)); // Threat decreases with distance
      threatScore += threatContribution * (enemy.population / 100);
    });
    
    // Factor in recent attacks
    const recentAttackThreat = recentAttacks.length * 0.1;
    threatScore += recentAttackThreat;
    
    // Personality affects threat perception
    const personalityMultiplier = this.personality === PERSONALITY_TRAITS.AGGRESSIVE ? 0.8 : 
                                  this.personality === PERSONALITY_TRAITS.DEFENSIVE ? 1.2 : 1.0;
    
    this.threat_level = Math.min(1.0, threatScore * personalityMultiplier);
    return this.threat_level;
  }

  /**
   * Store a memory of an important event
   */
  storeMemory(type, data) {
    if (!this.memory[type]) {
      this.memory[type] = [];
    }
    
    this.memory[type].push({
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Limit memory size to prevent unbounded growth
    const maxMemorySize = 50;
    if (this.memory[type].length > maxMemorySize) {
      this.memory[type] = this.memory[type].slice(-maxMemorySize);
    }
  }

  /**
   * Create a new AI colony
   */
  static async create(colonyData) {
    try {
      // Ensure AI-specific fields are set
      const aiColonyData = {
        ...colonyData,
        is_ai: true,
        ai_state: colonyData.ai_state || AI_STATES.GATHERING,
        personality: colonyData.personality || PERSONALITY_TRAITS.OPPORTUNIST,
        aggression_level: colonyData.aggression_level || Math.random(),
        expansion_drive: colonyData.expansion_drive || Math.random(),
        growth_rate: colonyData.growth_rate || (0.8 + Math.random() * 0.4),
        military_focus: colonyData.military_focus || Math.random(),
        resource_efficiency: colonyData.resource_efficiency || (0.8 + Math.random() * 0.4),
        creation_time: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ai_colonies')
        .insert([aiColonyData])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'creating AI colony');
      }

      return { data: new AIColony(data) };
    } catch (err) {
      return handleDatabaseError(err, 'creating AI colony');
    }
  }

  /**
   * Find AI colony by ID
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('ai_colonies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { error: 'AI Colony not found' };
        }
        return handleDatabaseError(error, 'finding AI colony');
      }

      return { data: new AIColony(data) };
    } catch (err) {
      return handleDatabaseError(err, 'finding AI colony');
    }
  }

  /**
   * Get all active AI colonies for the game simulation
   */
  static async getActiveAIColonies() {
    try {
      const { data, error } = await supabase
        .from('ai_colonies')
        .select('*')
        .eq('is_active', true)
        .order('last_ai_update', { ascending: true });

      if (error) {
        return handleDatabaseError(error, 'finding active AI colonies');
      }

      const colonies = data.map(colony => new AIColony(colony));
      return { data: colonies };
    } catch (err) {
      return handleDatabaseError(err, 'finding active AI colonies');
    }
  }

  /**
   * Update AI colony with new data
   */
  async update(updateData) {
    try {
      const { data, error } = await supabase
        .from('ai_colonies')
        .update({
          ...updateData,
          last_ai_update: new Date().toISOString()
        })
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'updating AI colony');
      }

      // Update this instance with new data
      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'updating AI colony');
    }
  }

  /**
   * Process growth for the colony
   */
  processGrowth(gameState = {}) {
    try {
      // Calculate time delta since last growth
      const currentTick = this.total_ticks;
      const timeDelta = currentTick - this.last_growth_tick;
      
      if (timeDelta <= 0) {
        return null; // No time has passed
      }

      // Calculate growth
      const growth = this.growthCalculator.calculateGrowth(this, timeDelta, gameState);
      
      // Apply growth to colony
      const changes = this.growthCalculator.applyGrowth(this, growth);
      
      // Update growth tracking
      this.last_growth_tick = currentTick;
      this.growth_history.push({
        tick: currentTick,
        growth: growth,
        changes: changes,
        timestamp: new Date().toISOString()
      });
      
      // Limit growth history size
      if (this.growth_history.length > 100) {
        this.growth_history = this.growth_history.slice(-100);
      }
      
      // Update development phase
      this.updateDevelopmentPhase();
      
      // Store growth in memory
      this.storeMemory('growth_events', {
        tick: currentTick,
        population_growth: growth.population,
        resource_growth: Object.values(growth.resources).reduce((sum, val) => sum + val, 0),
        territory_growth: growth.territory,
        reasoning: growth.reasoning
      });
      
      return {
        growth: growth,
        changes: changes,
        new_phase: this.development_phase
      };
      
    } catch (error) {
      console.error('Error processing growth for colony', this.id, ':', error);
      return null;
    }
  }

  /**
   * Update development phase based on current colony state
   */
  updateDevelopmentPhase() {
    const population = this.population;
    const territorySize = this.territory_size;
    const totalTicks = this.total_ticks;
    
    let newPhase = 'early';
    
    if (population >= 150 || territorySize >= 15 || totalTicks >= 500) {
      newPhase = 'dominance';
    } else if (population >= 80 || territorySize >= 8 || totalTicks >= 200) {
      newPhase = 'consolidation';
    } else if (population >= 40 || territorySize >= 4 || totalTicks >= 50) {
      newPhase = 'expansion';
    }
    
    if (newPhase !== this.development_phase) {
      const oldPhase = this.development_phase;
      this.development_phase = newPhase;
      
      this.storeMemory('phase_transitions', {
        old_phase: oldPhase,
        new_phase: newPhase,
        population: population,
        territory_size: territorySize,
        total_ticks: totalTicks
      });
    }
  }

  /**
   * Get growth projection for future planning
   */
  getGrowthProjection(ticks = 10, gameState = {}) {
    return this.growthCalculator.projectGrowth(this, ticks, gameState);
  }

  /**
   * Get current growth efficiency
   */
  getGrowthEfficiency() {
    const modifiers = this.growthCalculator.calculateGrowthModifiers(this, {});
    return {
      overall_efficiency: modifiers.overall,
      factors: modifiers,
      bottlenecks: this.identifyGrowthBottlenecks(),
      recommendations: this.getGrowthRecommendations()
    };
  }

  /**
   * Identify current growth bottlenecks
   */
  identifyGrowthBottlenecks() {
    const bottlenecks = [];
    
    // Population bottlenecks
    if (this.population >= this.max_population * 0.9) {
      bottlenecks.push('Population approaching housing capacity');
    }
    
    // Resource bottlenecks
    if (this.food_storage < 50) {
      bottlenecks.push('Critical food shortage limiting growth');
    }
    
    if ((this.wood_storage || 0) < 100 && (this.stone_storage || 0) < 100) {
      bottlenecks.push('Insufficient construction materials for expansion');
    }
    
    // Threat bottlenecks
    if (this.threat_level > 0.7) {
      bottlenecks.push('High threat level forcing defensive posture');
    }
    
    // Territory bottlenecks
    if (this.territory_size >= 20) {
      bottlenecks.push('Large territory becoming difficult to manage');
    }
    
    return bottlenecks;
  }

  /**
   * Get growth recommendations
   */
  getGrowthRecommendations() {
    const recommendations = [];
    const efficiency = this.getGrowthEfficiency();
    
    if (efficiency.overall_efficiency < 0.8) {
      recommendations.push('Consider reducing threat level through diplomatic or military means');
    }
    
    if (this.food_storage > 200 && this.population < this.max_population * 0.8) {
      recommendations.push('Abundant food allows for rapid population growth');
    }
    
    if (this.territory_size < 8 && this.threat_level < 0.3) {
      recommendations.push('Safe environment suitable for territorial expansion');
    }
    
    if ((this.wood_storage || 0) > 150 && (this.stone_storage || 0) > 150) {
      recommendations.push('Strong resource position enables infrastructure development');
    }
    
    return recommendations;
  }

  /**
   * Plan exploration activities for the colony
   */
  planExploration(gameState = {}) {
    try {
      // Get exploration strategy from exploration manager
      const strategy = this.explorationManager.planExplorationStrategy(this, gameState);
      
      // Update exploration priorities
      this.exploration_priorities = strategy.primary_objectives;
      
      // Initialize visibility if needed
      this.initializeVisibility();
      
      // Store exploration plan in memory
      this.colonyMemory.storeMemory('strategic_positions', {
        exploration_plan: strategy,
        planning_date: new Date().toISOString(),
        colony_state: this.ai_state,
        population: this.population,
        threat_level: this.threat_level
      });
      
      return strategy;
      
    } catch (error) {
      console.error('Error planning exploration for colony', this.id, ':', error);
      return null;
    }
  }

  /**
   * Execute exploration activities
   */
  executeExploration(gameState = {}) {
    try {
      const explorationResults = {
        missions_launched: 0,
        missions_completed: 0,
        new_discoveries: [],
        intelligence_gathered: [],
        updated_threat_level: this.threat_level
      };

      // Check if we should explore based on current state and resources
      if (!this.shouldExplore()) {
        return explorationResults;
      }

      // Get current exploration strategy
      const strategy = this.planExploration(gameState);
      if (!strategy) {
        return explorationResults;
      }

      // Process active scout missions
      const missionResults = this.processScoutMissions(gameState);
      explorationResults.missions_completed = missionResults.completed_missions;
      explorationResults.new_discoveries.push(...missionResults.discoveries);
      explorationResults.intelligence_gathered.push(...missionResults.intelligence);

      // Launch new scout missions if capacity allows
      const newMissions = this.launchNewScoutMissions(strategy, gameState);
      explorationResults.missions_launched = newMissions.length;

      // Update visibility and memory with discoveries
      this.processExplorationDiscoveries(explorationResults.new_discoveries);

      // Update threat level based on intelligence
      if (explorationResults.intelligence_gathered.length > 0) {
        const newThreatLevel = this.assessThreatFromIntelligence(explorationResults.intelligence_gathered);
        if (newThreatLevel !== this.threat_level) {
          explorationResults.updated_threat_level = newThreatLevel;
          this.threat_level = newThreatLevel;
        }
      }

      this.last_exploration_update = new Date().toISOString();
      
      return explorationResults;
      
    } catch (error) {
      console.error('Error executing exploration for colony', this.id, ':', error);
      return { missions_launched: 0, missions_completed: 0, new_discoveries: [], intelligence_gathered: [] };
    }
  }

  /**
   * Check if colony should explore
   */
  shouldExplore() {
    // Don't explore if population is too low
    if (this.population < 20) {
      return false;
    }

    // Don't explore if under heavy threat
    if (this.threat_level > 0.8 && this.ai_state === AI_STATES.DEFENDING) {
      return false;
    }

    // Always explore if in exploring state
    if (this.ai_state === AI_STATES.EXPLORING) {
      return true;
    }

    // Explore based on personality
    if (this.personality === PERSONALITY_TRAITS.EXPANSIONIST) {
      return Math.random() < 0.8;
    } else if (this.personality === PERSONALITY_TRAITS.OPPORTUNIST) {
      return Math.random() < 0.6;
    } else if (this.personality === PERSONALITY_TRAITS.DEFENSIVE) {
      return Math.random() < 0.3;
    }

    return Math.random() < 0.5;
  }

  /**
   * Process active scout missions
   */
  processScoutMissions(gameState = {}) {
    const results = {
      completed_missions: 0,
      discoveries: [],
      intelligence: []
    };

    // Process each active mission
    this.active_scout_missions = this.active_scout_missions.filter(mission => {
      // Execute mission step (this would be handled by ScoutBehavior)
      mission.actual_duration++;
      mission.progress = Math.min(1.0, mission.actual_duration / mission.estimated_duration);

      // Check if mission is complete
      if (mission.progress >= 1.0 || mission.state === 'returning') {
        // Mission completed - process results
        results.completed_missions++;
        results.discoveries.push(...(mission.discoveries || []));
        results.intelligence.push(...(mission.intelligence || []));

        // Store mission completion in memory
        this.colonyMemory.storeMemory('scout_missions', {
          mission_id: mission.id,
          status: 'completed',
          completion_time: new Date().toISOString(),
          discoveries_count: mission.discoveries?.length || 0,
          intelligence_count: mission.intelligence?.length || 0
        });

        return false; // Remove completed mission
      }

      return true; // Keep active mission
    });

    return results;
  }

  /**
   * Launch new scout missions based on strategy
   */
  launchNewScoutMissions(strategy, gameState = {}) {
    const newMissions = [];
    const availableScouts = Math.floor(this.population * this.exploration_budget);
    const currentScouts = this.active_scout_missions.reduce((sum, mission) => sum + mission.scouts_assigned, 0);
    const freeScouts = availableScouts - currentScouts;

    if (freeScouts <= 0) {
      return newMissions;
    }

    // Launch missions for high-priority objectives
    for (const assignment of strategy.scout_assignments) {
      if (assignment.scouts_assigned <= freeScouts) {
        const mission = {
          id: `scout_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: assignment.assignment_type,
          objective: assignment.objective_id,
          scouts_assigned: assignment.scouts_assigned,
          target_coordinates: assignment.target_coordinates,
          estimated_duration: assignment.estimated_duration,
          actual_duration: 0,
          progress: 0,
          state: 'active',
          discoveries: [],
          intelligence: [],
          created_at: new Date().toISOString()
        };

        this.active_scout_missions.push(mission);
        newMissions.push(mission);

        // Update available scouts
        const remainingScouts = freeScouts - assignment.scouts_assigned;
        if (remainingScouts <= 0) break;
      }
    }

    return newMissions;
  }

  /**
   * Process exploration discoveries
   */
  processExplorationDiscoveries(discoveries) {
    discoveries.forEach(discovery => {
      // Store in appropriate memory category
      let category = 'terrain_features';
      if (discovery.type === 'resource') {
        category = 'discovered_resources';
      } else if (discovery.type === 'enemy_activity') {
        category = 'enemy_movements';
      }

      this.colonyMemory.storeMemory(category, discovery);

      // Update scouted areas
      if (discovery.location && !this.scouted_areas.some(area => 
        Math.abs(area.x - discovery.location.x) < 2 && Math.abs(area.y - discovery.location.y) < 2
      )) {
        this.scouted_areas.push({
          x: discovery.location.x,
          y: discovery.location.y,
          discovered_at: new Date().toISOString(),
          discovery_type: discovery.type
        });
      }

      // Update visibility service
      if (discovery.location) {
        VisibilityService.updateVisibilityAroundPosition(this.id, discovery.location, 3);
      }
    });
  }

  /**
   * Assess threat level from intelligence
   */
  assessThreatFromIntelligence(intelligence) {
    let maxThreat = this.threat_level;

    intelligence.forEach(intel => {
      if (intel.type === 'enemy_activity' && intel.threat_level) {
        maxThreat = Math.max(maxThreat, intel.threat_level);
      } else if (intel.type === 'safety_assessment' && intel.threats_detected) {
        maxThreat = Math.max(maxThreat, 0.6);
      }
    });

    return maxThreat;
  }

  /**
   * Initialize visibility for the colony
   */
  initializeVisibility() {
    const visibilityStatus = VisibilityService.getVisibilityStatus(this.id);
    if (!visibilityStatus) {
      VisibilityService.initializeColonyVisibility(this.id, { x: this.base_x, y: this.base_y });
    }
  }

  /**
   * Get exploration efficiency
   */
  getExplorationEfficiency() {
    const recentMissions = this.colonyMemory.getMemories('scout_missions', { limit: 10 });
    const completedMissions = recentMissions.filter(m => m.status === 'completed');
    
    const efficiency = {
      mission_success_rate: completedMissions.length / Math.max(1, recentMissions.length),
      discoveries_per_mission: completedMissions.reduce((sum, m) => sum + (m.discoveries_count || 0), 0) / Math.max(1, completedMissions.length),
      active_missions: this.active_scout_missions.length,
      total_explored_tiles: VisibilityService.getVisibilityStatus(this.id)?.exploredTilesCount || 0,
      scout_budget_utilization: this.active_scout_missions.reduce((sum, m) => sum + m.scouts_assigned, 0) / Math.floor(this.population * this.exploration_budget)
    };

    return efficiency;
  }

  /**
   * Get visibility status
   */
  getVisibilityStatus() {
    return VisibilityService.getVisibilityStatus(this.id);
  }

  /**
   * Search colony memory
   */
  searchMemory(criteria) {
    return this.colonyMemory.searchMemories(criteria);
  }

  /**
   * Get memories by category
   */
  getMemoriesByCategory(category, filters = {}) {
    return this.colonyMemory.getMemories(category, filters);
  }

  /**
   * Convert to JSON including exploration-specific properties
   */
  toJSON() {
    return {
      ...super.toJSON(),
      is_ai: this.is_ai,
      ai_state: this.ai_state,
      personality: this.personality,
      difficulty_level: this.difficulty_level,
      aggression_level: this.aggression_level,
      expansion_drive: this.expansion_drive,
      growth_rate: this.growth_rate,
      military_focus: this.military_focus,
      resource_efficiency: this.resource_efficiency,
      resource_priorities: this.resource_priorities,
      base_x: this.base_x,
      base_y: this.base_y,
      controlled_tiles: this.controlled_tiles,
      scouted_areas: this.scouted_areas,
      last_decision: this.last_decision,
      decision_cooldown: this.decision_cooldown,
      target_colony_id: this.target_colony_id,
      threat_level: this.threat_level,
      memory: this.memory,
      last_ai_update: this.last_ai_update,
      creation_time: this.creation_time,
      difficulty_modifier: this.difficulty_modifier,
      // Growth-related properties
      growth_history: this.growth_history,
      last_growth_tick: this.last_growth_tick,
      infrastructure_level: this.infrastructure_level,
      development_phase: this.development_phase,
      // Exploration-related properties
      active_scout_missions: this.active_scout_missions,
      exploration_priorities: this.exploration_priorities,
      last_exploration_update: this.last_exploration_update,
      visibility_range: this.visibility_range,
      exploration_budget: this.exploration_budget
    };
  }
}

module.exports = { 
  AIColony, 
  AI_STATES, 
  PERSONALITY_TRAITS 
}; 
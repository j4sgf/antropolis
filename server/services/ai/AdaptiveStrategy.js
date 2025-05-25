/**
 * AdaptiveStrategy class for adjusting AI colony behavior based on player actions
 * Works with PlayerMonitor to create dynamic, responsive AI opponents
 */

const PlayerMonitor = require('./PlayerMonitor');

class AdaptiveStrategy {
  constructor() {
    this.playerMonitor = new PlayerMonitor();
    this.adaptationHistory = new Map(); // Track strategy changes per colony
    this.adaptationCooldown = 300000; // 5 minutes cooldown between major adaptations
    this.strategyTypes = [
      'defensive',
      'aggressive',
      'economic',
      'expansion',
      'guerrilla',
      'balanced',
      'counter_specific'
    ];
    this.adaptationIntensity = {
      low: 0.2,
      medium: 0.5,
      high: 0.8,
      extreme: 1.0
    };
  }

  /**
   * Initialize adaptation tracking for a colony
   */
  initializeColony(colonyId, baseStrategy = 'balanced') {
    if (!this.adaptationHistory.has(colonyId)) {
      this.adaptationHistory.set(colonyId, {
        colonyId: colonyId,
        baseStrategy: baseStrategy,
        currentStrategy: baseStrategy,
        adaptationLevel: 0.5,
        lastAdaptation: null,
        adaptationCount: 0,
        successfulAdaptations: 0,
        playerAdaptations: new Map(),
        strategicMemory: [],
        adaptationTriggers: []
      });
    }
    return this.adaptationHistory.get(colonyId);
  }

  /**
   * Analyze player behavior and adapt colony strategy accordingly
   */
  async adaptToPlayer(colonyId, playerId, gameContext = {}) {
    const colonyData = this.initializeColony(colonyId);
    const playerBehavior = this.playerMonitor.getPlayerBehaviorSummary(playerId);
    
    if (!playerBehavior) {
      return {
        adapted: false,
        reason: 'Insufficient player data for adaptation'
      };
    }

    // Check cooldown
    if (this.isInCooldown(colonyData)) {
      return {
        adapted: false,
        reason: 'Adaptation cooldown active',
        nextAdaptationAvailable: new Date(colonyData.lastAdaptation.getTime() + this.adaptationCooldown)
      };
    }

    // Evaluate need for adaptation
    const adaptationNeed = this.evaluateAdaptationNeed(colonyData, playerBehavior, gameContext);
    
    if (adaptationNeed.score < 0.3) {
      return {
        adapted: false,
        reason: 'Current strategy sufficient',
        adaptationNeed: adaptationNeed
      };
    }

    // Generate new strategy
    const newStrategy = this.generateAdaptedStrategy(colonyData, playerBehavior, adaptationNeed, gameContext);
    
    // Apply adaptation
    const adaptationResult = this.applyStrategicAdaptation(colonyData, newStrategy, adaptationNeed);
    
    // Record the adaptation
    this.recordAdaptation(colonyData, playerId, newStrategy, adaptationResult);
    
    return {
      adapted: true,
      oldStrategy: colonyData.currentStrategy,
      newStrategy: newStrategy.type,
      adaptationLevel: adaptationResult.intensity,
      reasoning: newStrategy.reasoning,
      changes: adaptationResult.changes,
      confidence: newStrategy.confidence
    };
  }

  /**
   * Check if colony is in adaptation cooldown
   */
  isInCooldown(colonyData) {
    if (!colonyData.lastAdaptation) return false;
    return (new Date() - colonyData.lastAdaptation) < this.adaptationCooldown;
  }

  /**
   * Evaluate how much the colony needs to adapt
   */
  evaluateAdaptationNeed(colonyData, playerBehavior, gameContext) {
    let needScore = 0;
    const factors = [];

    // Factor 1: Player threat level
    const threatAssessment = this.playerMonitor.getThreatAssessment(playerBehavior.playerId);
    if (threatAssessment.threat_level > 0.7) {
      needScore += 0.3;
      factors.push('High player threat detected');
    }

    // Factor 2: Strategy mismatch
    const strategyEffectiveness = this.evaluateStrategyEffectiveness(colonyData.currentStrategy, playerBehavior);
    if (strategyEffectiveness < 0.4) {
      needScore += 0.4;
      factors.push('Current strategy ineffective against player style');
    }

    // Factor 3: Player adaptation resistance
    if (playerBehavior.metrics.adaptation_resistance > 0.7) {
      needScore += 0.2;
      factors.push('Player shows consistent patterns - opportunity for counter-strategy');
    }

    // Factor 4: Time since last adaptation
    if (colonyData.lastAdaptation) {
      const timeSinceAdaptation = (new Date() - colonyData.lastAdaptation) / (1000 * 60 * 60); // Hours
      if (timeSinceAdaptation > 1) {
        needScore += Math.min(0.2, timeSinceAdaptation * 0.05);
        factors.push('Sufficient time elapsed for strategy reassessment');
      }
    }

    // Factor 5: Game context changes
    if (gameContext.majorEventOccurred || gameContext.powerShiftDetected) {
      needScore += 0.3;
      factors.push('Significant game state changes detected');
    }

    return {
      score: Math.min(1.0, needScore),
      factors: factors,
      threatLevel: threatAssessment.threat_level,
      strategyEffectiveness: strategyEffectiveness
    };
  }

  /**
   * Evaluate how effective current strategy is against player
   */
  evaluateStrategyEffectiveness(currentStrategy, playerBehavior) {
    const playstyle = playerBehavior.playstyle;
    const metrics = playerBehavior.metrics;

    // Strategy effectiveness matrix
    const effectiveness = {
      defensive: {
        aggressive_military: 0.7, // Good against aggressive players
        defensive_turtle: 0.3, // Poor against other defensive players
        economic_focused: 0.4, // Mediocre against economic players
        rapid_expander: 0.6, // Good against expanders
        balanced_strategic: 0.5,
        cautious_explorer: 0.4,
        adaptive_opportunist: 0.4
      },
      aggressive: {
        aggressive_military: 0.5, // Even match
        defensive_turtle: 0.3, // Poor against turtles
        economic_focused: 0.8, // Excellent against economic players
        rapid_expander: 0.6, // Good against expanders
        balanced_strategic: 0.6,
        cautious_explorer: 0.7,
        adaptive_opportunist: 0.4
      },
      economic: {
        aggressive_military: 0.2, // Poor against aggressive
        defensive_turtle: 0.6, // Good against turtles
        economic_focused: 0.4, // Mediocre against same type
        rapid_expander: 0.5, // Even match
        balanced_strategic: 0.6,
        cautious_explorer: 0.7,
        adaptive_opportunist: 0.5
      },
      expansion: {
        aggressive_military: 0.4, // Vulnerable to aggression
        defensive_turtle: 0.8, // Excellent against turtles
        economic_focused: 0.6, // Good against economic
        rapid_expander: 0.3, // Poor against other expanders
        balanced_strategic: 0.5,
        cautious_explorer: 0.6,
        adaptive_opportunist: 0.5
      },
      guerrilla: {
        aggressive_military: 0.6, // Good hit-and-run against aggression
        defensive_turtle: 0.4, // Mediocre against defense
        economic_focused: 0.7, // Good harassment of economic
        rapid_expander: 0.8, // Excellent against spread-out expansion
        balanced_strategic: 0.5,
        cautious_explorer: 0.6,
        adaptive_opportunist: 0.7
      },
      balanced: {
        aggressive_military: 0.5,
        defensive_turtle: 0.5,
        economic_focused: 0.5,
        rapid_expander: 0.5,
        balanced_strategic: 0.5,
        cautious_explorer: 0.5,
        adaptive_opportunist: 0.6
      }
    };

    return effectiveness[currentStrategy]?.[playstyle] || 0.5;
  }

  /**
   * Generate a new adapted strategy
   */
  generateAdaptedStrategy(colonyData, playerBehavior, adaptationNeed, gameContext) {
    const playstyle = playerBehavior.playstyle;
    const patterns = playerBehavior.patterns;
    const metrics = playerBehavior.metrics;

    // Counter-strategies based on player playstyle
    const counterStrategies = {
      aggressive_military: [
        { type: 'defensive', weight: 0.4, reason: 'Fortify against aggression' },
        { type: 'guerrilla', weight: 0.3, reason: 'Hit-and-run tactics' },
        { type: 'economic', weight: 0.2, reason: 'Out-resource the aggressor' },
        { type: 'expansion', weight: 0.1, reason: 'Expand away from conflict' }
      ],
      defensive_turtle: [
        { type: 'expansion', weight: 0.5, reason: 'Exploit defensive inactivity' },
        { type: 'economic', weight: 0.3, reason: 'Build economic advantage' },
        { type: 'aggressive', weight: 0.2, reason: 'Force defensive player to react' }
      ],
      economic_focused: [
        { type: 'aggressive', weight: 0.6, reason: 'Strike before economic advantage grows' },
        { type: 'guerrilla', weight: 0.3, reason: 'Disrupt economic operations' },
        { type: 'expansion', weight: 0.1, reason: 'Compete for resources' }
      ],
      rapid_expander: [
        { type: 'guerrilla', weight: 0.4, reason: 'Target spread-out positions' },
        { type: 'aggressive', weight: 0.3, reason: 'Strike weak expansion points' },
        { type: 'defensive', weight: 0.2, reason: 'Force overextension' },
        { type: 'economic', weight: 0.1, reason: 'Build concentrated strength' }
      ],
      balanced_strategic: [
        { type: 'counter_specific', weight: 0.4, reason: 'Adapt to specific patterns' },
        { type: 'aggressive', weight: 0.3, reason: 'Force specific responses' },
        { type: 'guerrilla', weight: 0.3, reason: 'Create unpredictability' }
      ],
      cautious_explorer: [
        { type: 'aggressive', weight: 0.5, reason: 'Punish cautious expansion' },
        { type: 'expansion', weight: 0.3, reason: 'Race for territory' },
        { type: 'guerrilla', weight: 0.2, reason: 'Harass exploration efforts' }
      ],
      adaptive_opportunist: [
        { type: 'counter_specific', weight: 0.6, reason: 'Counter current adaptations' },
        { type: 'balanced', weight: 0.4, reason: 'Maintain strategic flexibility' }
      ]
    };

    // Get potential strategies
    const potentialStrategies = counterStrategies[playstyle] || [
      { type: 'balanced', weight: 1.0, reason: 'Default adaptive strategy' }
    ];

    // Adjust weights based on patterns
    patterns.forEach(pattern => {
      potentialStrategies.forEach(strategy => {
        switch (pattern.type) {
          case 'military_preparation':
            if (strategy.type === 'defensive' || strategy.type === 'guerrilla') {
              strategy.weight *= 1.3;
            }
            break;
          case 'expansion_pressure':
            if (strategy.type === 'aggressive' || strategy.type === 'guerrilla') {
              strategy.weight *= 1.2;
            }
            break;
          case 'resource_hoarding':
            if (strategy.type === 'aggressive' || strategy.type === 'expansion') {
              strategy.weight *= 1.2;
            }
            break;
        }
      });
    });

    // Select strategy based on weights
    const totalWeight = potentialStrategies.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedStrategy = potentialStrategies[0];
    for (const strategy of potentialStrategies) {
      random -= strategy.weight;
      if (random <= 0) {
        selectedStrategy = strategy;
        break;
      }
    }

    // Generate specific strategy parameters
    const strategyDetails = this.generateStrategyDetails(selectedStrategy.type, playerBehavior, adaptationNeed);

    return {
      type: selectedStrategy.type,
      reasoning: selectedStrategy.reason,
      confidence: Math.min(0.9, adaptationNeed.score * 1.2),
      details: strategyDetails,
      targetedPatterns: patterns.map(p => p.type),
      playerStyleCounter: playstyle
    };
  }

  /**
   * Generate specific details for a strategy type
   */
  generateStrategyDetails(strategyType, playerBehavior, adaptationNeed) {
    const metrics = playerBehavior.metrics;
    const intensity = adaptationNeed.score > 0.7 ? 'high' : adaptationNeed.score > 0.5 ? 'medium' : 'low';

    const strategies = {
      defensive: {
        priority: 'defense',
        resourceAllocation: { military: 0.4, defense: 0.4, economy: 0.2 },
        unitFocus: ['defensive_units', 'ranged_units'],
        buildingPriority: ['walls', 'towers', 'barracks'],
        aggressionModifier: -0.3,
        expansionModifier: -0.4,
        riskTolerance: 0.2
      },
      aggressive: {
        priority: 'attack',
        resourceAllocation: { military: 0.6, offense: 0.3, economy: 0.1 },
        unitFocus: ['attack_units', 'fast_units'],
        buildingPriority: ['barracks', 'weapon_forge', 'stables'],
        aggressionModifier: 0.4,
        expansionModifier: 0.2,
        riskTolerance: 0.8
      },
      economic: {
        priority: 'economy',
        resourceAllocation: { economy: 0.6, military: 0.2, infrastructure: 0.2 },
        unitFocus: ['worker_units', 'trader_units'],
        buildingPriority: ['resource_buildings', 'trade_posts', 'warehouses'],
        aggressionModifier: -0.2,
        expansionModifier: 0.1,
        riskTolerance: 0.3
      },
      expansion: {
        priority: 'territory',
        resourceAllocation: { expansion: 0.4, military: 0.3, infrastructure: 0.3 },
        unitFocus: ['scout_units', 'settler_units', 'fast_units'],
        buildingPriority: ['outposts', 'roads', 'resource_extractors'],
        aggressionModifier: 0.1,
        expansionModifier: 0.6,
        riskTolerance: 0.6
      },
      guerrilla: {
        priority: 'harassment',
        resourceAllocation: { military: 0.5, mobility: 0.3, stealth: 0.2 },
        unitFocus: ['fast_units', 'stealth_units', 'raider_units'],
        buildingPriority: ['scout_posts', 'hidden_bases', 'escape_routes'],
        aggressionModifier: 0.3,
        expansionModifier: -0.1,
        riskTolerance: 0.7
      },
      balanced: {
        priority: 'adaptive',
        resourceAllocation: { military: 0.3, economy: 0.3, infrastructure: 0.4 },
        unitFocus: ['versatile_units', 'support_units'],
        buildingPriority: ['mixed_development'],
        aggressionModifier: 0.0,
        expansionModifier: 0.0,
        riskTolerance: 0.5
      }
    };

    const baseStrategy = strategies[strategyType] || strategies.balanced;
    
    // Adjust based on intensity
    const intensityMultiplier = this.adaptationIntensity[intensity];
    Object.keys(baseStrategy).forEach(key => {
      if (key.includes('Modifier')) {
        baseStrategy[key] *= intensityMultiplier;
      }
    });

    // Add player-specific adjustments
    baseStrategy.playerCounters = {
      aggressiveness: Math.max(0.1, 1.0 - metrics.aggressiveness),
      militaryFocus: metrics.military_focus > 0.6 ? 'defensive_focus' : 'offensive_opportunity',
      economicFocus: metrics.economic_focus > 0.6 ? 'economic_pressure' : 'military_advantage'
    };

    return baseStrategy;
  }

  /**
   * Apply the strategic adaptation to colony behavior
   */
  applyStrategicAdaptation(colonyData, newStrategy, adaptationNeed) {
    const previousStrategy = colonyData.currentStrategy;
    const intensity = adaptationNeed.score;

    // Update colony strategy
    colonyData.currentStrategy = newStrategy.type;
    colonyData.adaptationLevel = intensity;
    colonyData.lastAdaptation = new Date();
    colonyData.adaptationCount++;

    // Track changes made
    const changes = {
      strategyChange: {
        from: previousStrategy,
        to: newStrategy.type,
        intensity: intensity
      },
      behaviorModifications: newStrategy.details,
      implementationTimestamp: new Date()
    };

    // Add to strategic memory
    colonyData.strategicMemory.push({
      timestamp: new Date(),
      trigger: adaptationNeed.factors,
      oldStrategy: previousStrategy,
      newStrategy: newStrategy.type,
      reasoning: newStrategy.reasoning,
      confidence: newStrategy.confidence
    });

    // Limit memory size
    if (colonyData.strategicMemory.length > 10) {
      colonyData.strategicMemory.shift();
    }

    return {
      success: true,
      intensity: intensity,
      changes: changes,
      newBehaviorProfile: newStrategy.details
    };
  }

  /**
   * Record the adaptation for analysis and learning
   */
  recordAdaptation(colonyData, playerId, newStrategy, adaptationResult) {
    // Record player-specific adaptation
    if (!colonyData.playerAdaptations.has(playerId)) {
      colonyData.playerAdaptations.set(playerId, []);
    }

    const playerAdaptations = colonyData.playerAdaptations.get(playerId);
    playerAdaptations.push({
      timestamp: new Date(),
      strategy: newStrategy.type,
      reasoning: newStrategy.reasoning,
      confidence: newStrategy.confidence,
      intensity: adaptationResult.intensity
    });

    // Limit player-specific memory
    if (playerAdaptations.length > 5) {
      playerAdaptations.shift();
    }
  }

  /**
   * Get current adaptation status for a colony
   */
  getAdaptationStatus(colonyId) {
    const colonyData = this.adaptationHistory.get(colonyId);
    if (!colonyData) {
      return null;
    }

    return {
      colonyId: colonyId,
      currentStrategy: colonyData.currentStrategy,
      baseStrategy: colonyData.baseStrategy,
      adaptationLevel: colonyData.adaptationLevel,
      lastAdaptation: colonyData.lastAdaptation,
      adaptationCount: colonyData.adaptationCount,
      successRate: colonyData.adaptationCount > 0 ? 
        colonyData.successfulAdaptations / colonyData.adaptationCount : 0,
      inCooldown: this.isInCooldown(colonyData),
      strategicMemory: colonyData.strategicMemory.slice(-3), // Last 3 adaptations
      playerAdaptationCounts: Array.from(colonyData.playerAdaptations.entries())
        .map(([playerId, adaptations]) => ({ playerId, count: adaptations.length }))
    };
  }

  /**
   * Force an immediate adaptation (bypasses cooldown)
   */
  forceAdaptation(colonyId, playerId, reason = 'forced_adaptation') {
    const colonyData = this.adaptationHistory.get(colonyId);
    if (!colonyData) {
      return { success: false, reason: 'Colony not initialized' };
    }

    // Temporarily bypass cooldown
    const originalLastAdaptation = colonyData.lastAdaptation;
    colonyData.lastAdaptation = null;

    // Perform adaptation
    const result = this.adaptToPlayer(colonyId, playerId, { forcedAdaptation: true, reason: reason });

    // Restore original timestamp if adaptation failed
    if (!result.adapted) {
      colonyData.lastAdaptation = originalLastAdaptation;
    }

    return result;
  }
}

module.exports = AdaptiveStrategy; 
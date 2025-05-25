/**
 * TriggerConditions class for determining when AI colonies should initiate attacks
 * Evaluates multiple factors to decide optimal timing for military actions
 */

class TriggerConditions {
  constructor() {
    this.triggerTypes = [
      'resource_threshold',
      'territory_proximity',
      'time_based',
      'player_weakness',
      'strategic_opportunity',
      'defensive_necessity',
      'economic_pressure',
      'diplomatic_situation'
    ];
    
    this.triggerWeights = {
      resource_threshold: 0.25,
      territory_proximity: 0.20,
      time_based: 0.15,
      player_weakness: 0.30,
      strategic_opportunity: 0.25,
      defensive_necessity: 0.35,
      economic_pressure: 0.15,
      diplomatic_situation: 0.10
    };

    this.cooldownPeriods = {
      raid: 180000,     // 3 minutes
      skirmish: 300000, // 5 minutes
      assault: 600000,  // 10 minutes
      siege: 1200000,   // 20 minutes
      campaign: 1800000 // 30 minutes
    };

    this.attackHistory = new Map(); // Track attack timing per colony
  }

  /**
   * Initialize trigger tracking for a colony
   */
  initializeColony(colonyId) {
    if (!this.attackHistory.has(colonyId)) {
      this.attackHistory.set(colonyId, {
        colonyId: colonyId,
        lastAttacks: [],
        triggerHistory: [],
        suppressedTriggers: [],
        aggressionLevel: 0.5,
        wariness: 0.3,
        opportunismLevel: 0.5
      });
    }
    return this.attackHistory.get(colonyId);
  }

  /**
   * Evaluate all trigger conditions and determine if attack should be launched
   */
  evaluateAttackTriggers(colonyId, targetInfo, gameState, colonyState) {
    const colonyData = this.initializeColony(colonyId);
    const triggerEvaluations = {};
    let totalTriggerScore = 0;
    let activeReasons = [];

    // Evaluate each trigger type
    for (const triggerType of this.triggerTypes) {
      const evaluation = this.evaluateTriggerType(triggerType, colonyId, targetInfo, gameState, colonyState);
      triggerEvaluations[triggerType] = evaluation;
      
      if (evaluation.triggered) {
        const weight = this.triggerWeights[triggerType] || 0.1;
        totalTriggerScore += evaluation.intensity * weight;
        activeReasons.push(evaluation.reason);
      }
    }

    // Apply personality and state modifiers
    totalTriggerScore = this.applyPersonalityModifiers(totalTriggerScore, colonyState);
    totalTriggerScore = this.applyCooldownModifiers(totalTriggerScore, colonyData);

    // Determine recommended attack type
    const recommendedAttack = this.determineAttackType(totalTriggerScore, triggerEvaluations, colonyState);

    const result = {
      shouldAttack: totalTriggerScore >= 0.6,
      triggerScore: totalTriggerScore,
      attackType: recommendedAttack.type,
      confidence: recommendedAttack.confidence,
      urgency: this.calculateUrgency(triggerEvaluations),
      reasons: activeReasons,
      triggerBreakdown: triggerEvaluations,
      cooldownStatus: this.getCooldownStatus(colonyData),
      recommendedDelay: recommendedAttack.delay
    };

    // Record the evaluation
    this.recordTriggerEvaluation(colonyData, result);

    return result;
  }

  /**
   * Evaluate a specific trigger type
   */
  evaluateTriggerType(triggerType, colonyId, targetInfo, gameState, colonyState) {
    switch (triggerType) {
      case 'resource_threshold':
        return this.evaluateResourceThreshold(colonyState, targetInfo);
      case 'territory_proximity':
        return this.evaluateTerritoryProximity(colonyState, targetInfo, gameState);
      case 'time_based':
        return this.evaluateTimeBased(colonyId, gameState);
      case 'player_weakness':
        return this.evaluatePlayerWeakness(targetInfo, gameState);
      case 'strategic_opportunity':
        return this.evaluateStrategicOpportunity(colonyState, targetInfo, gameState);
      case 'defensive_necessity':
        return this.evaluateDefensiveNecessity(colonyState, targetInfo, gameState);
      case 'economic_pressure':
        return this.evaluateEconomicPressure(colonyState, gameState);
      case 'diplomatic_situation':
        return this.evaluateDiplomaticSituation(colonyState, targetInfo, gameState);
      default:
        return { triggered: false, intensity: 0, reason: 'Unknown trigger type' };
    }
  }

  /**
   * Evaluate resource threshold triggers
   */
  evaluateResourceThreshold(colonyState, targetInfo) {
    const resources = colonyState.resources || {};
    const militaryCapacity = colonyState.military_capacity || 100;
    const usedCapacity = colonyState.used_military_capacity || 0;
    
    let intensity = 0;
    const reasons = [];

    // Resource abundance trigger
    const totalResources = Object.values(resources).reduce((sum, amount) => sum + amount, 0);
    if (totalResources > 1000) {
      intensity += 0.3;
      reasons.push('Abundant resources available for military action');
    }

    // Military capacity trigger
    const militaryUtilization = usedCapacity / militaryCapacity;
    if (militaryUtilization > 0.8) {
      intensity += 0.4;
      reasons.push('High military capacity ready for deployment');
    }

    // Resource imbalance trigger (too much of certain resources)
    const avgResource = totalResources / Object.keys(resources).length;
    Object.entries(resources).forEach(([type, amount]) => {
      if (amount > avgResource * 2) {
        intensity += 0.1;
        reasons.push(`Excess ${type} resources could fund military operations`);
      }
    });

    // Target resource evaluation
    if (targetInfo.estimatedResources > colonyState.totalResources * 1.5) {
      intensity += 0.3;
      reasons.push('Target has significantly more resources');
    }

    return {
      triggered: intensity > 0.2,
      intensity: Math.min(1.0, intensity),
      reason: reasons.join('; ') || 'Resource conditions not met',
      factors: {
        totalResources: totalResources,
        militaryUtilization: militaryUtilization,
        targetResourceRatio: targetInfo.estimatedResources / (colonyState.totalResources || 1)
      }
    };
  }

  /**
   * Evaluate territory proximity triggers
   */
  evaluateTerritoryProximity(colonyState, targetInfo, gameState) {
    const colonyPosition = colonyState.position || { x: 0, y: 0 };
    const targetPosition = targetInfo.position || { x: 0, y: 0 };
    
    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(targetPosition.x - colonyPosition.x, 2) + 
      Math.pow(targetPosition.y - colonyPosition.y, 2)
    );

    let intensity = 0;
    const reasons = [];

    // Close proximity trigger
    if (distance < 50) {
      intensity += 0.6;
      reasons.push('Target is in immediate proximity');
    } else if (distance < 100) {
      intensity += 0.3;
      reasons.push('Target is within medium range');
    }

    // Territory expansion pressure
    if (targetInfo.territorySize > colonyState.territorySize) {
      intensity += 0.2;
      reasons.push('Target has larger territory');
    }

    // Border tension
    if (targetInfo.borderTension > 0.6) {
      intensity += 0.3;
      reasons.push('High border tension detected');
    }

    // Strategic position value
    if (targetInfo.strategicValue > 0.7) {
      intensity += 0.2;
      reasons.push('Target holds strategically valuable position');
    }

    return {
      triggered: intensity > 0.2,
      intensity: Math.min(1.0, intensity),
      reason: reasons.join('; ') || 'Territory factors insufficient',
      factors: {
        distance: distance,
        territoryRatio: targetInfo.territorySize / (colonyState.territorySize || 1),
        borderTension: targetInfo.borderTension,
        strategicValue: targetInfo.strategicValue
      }
    };
  }

  /**
   * Evaluate time-based triggers
   */
  evaluateTimeBased(colonyId, gameState) {
    const colonyData = this.attackHistory.get(colonyId);
    const gameTime = gameState.currentTime || new Date();
    const gameDuration = gameState.gameDuration || 0; // Minutes since game start
    
    let intensity = 0;
    const reasons = [];

    // Early game aggression window
    if (gameDuration >= 15 && gameDuration <= 45) {
      intensity += 0.3;
      reasons.push('Early aggression window active');
    }

    // Late game pressure
    if (gameDuration > 120) {
      intensity += 0.2;
      reasons.push('Late game - increased aggression');
    }

    // Time since last attack
    if (colonyData.lastAttacks.length > 0) {
      const lastAttack = colonyData.lastAttacks[colonyData.lastAttacks.length - 1];
      const timeSinceLastAttack = gameTime - lastAttack.timestamp;
      const minutes = timeSinceLastAttack / (1000 * 60);
      
      if (minutes > 30) {
        intensity += 0.2;
        reasons.push('Sufficient time elapsed since last military action');
      }
    } else {
      // No previous attacks - first strike opportunity
      intensity += 0.1;
      reasons.push('No previous attacks - opportunity for first strike');
    }

    // Rhythmic attack patterns (create unpredictability)
    const attackPattern = Math.sin(gameDuration / 20) * 0.1;
    intensity += Math.max(0, attackPattern);

    return {
      triggered: intensity > 0.1,
      intensity: Math.min(1.0, intensity),
      reason: reasons.join('; ') || 'Time factors insufficient',
      factors: {
        gameDuration: gameDuration,
        timeSinceLastAttack: colonyData.lastAttacks.length > 0 ? 
          (gameTime - colonyData.lastAttacks[colonyData.lastAttacks.length - 1].timestamp) / (1000 * 60) : null,
        attackCount: colonyData.lastAttacks.length
      }
    };
  }

  /**
   * Evaluate player weakness triggers
   */
  evaluatePlayerWeakness(targetInfo, gameState) {
    let intensity = 0;
    const reasons = [];

    // Military weakness
    if (targetInfo.militaryStrength < 0.4) {
      intensity += 0.5;
      reasons.push('Target has weak military forces');
    }

    // Resource shortage
    if (targetInfo.resourceShortage > 0.6) {
      intensity += 0.3;
      reasons.push('Target experiencing resource shortages');
    }

    // Recent losses
    if (targetInfo.recentLosses > 0.3) {
      intensity += 0.4;
      reasons.push('Target has suffered recent losses');
    }

    // Defensive gaps
    if (targetInfo.defensiveGaps && targetInfo.defensiveGaps.length > 0) {
      intensity += 0.3;
      reasons.push('Defensive vulnerabilities identified');
    }

    // Distraction (fighting others)
    if (targetInfo.currentlyFighting) {
      intensity += 0.4;
      reasons.push('Target is engaged in other conflicts');
    }

    // Economic instability
    if (targetInfo.economicInstability > 0.5) {
      intensity += 0.2;
      reasons.push('Target economy is unstable');
    }

    return {
      triggered: intensity > 0.2,
      intensity: Math.min(1.0, intensity),
      reason: reasons.join('; ') || 'Target shows no significant weaknesses',
      factors: {
        militaryStrength: targetInfo.militaryStrength,
        resourceShortage: targetInfo.resourceShortage,
        recentLosses: targetInfo.recentLosses,
        currentlyFighting: targetInfo.currentlyFighting,
        economicInstability: targetInfo.economicInstability
      }
    };
  }

  /**
   * Evaluate strategic opportunity triggers
   */
  evaluateStrategicOpportunity(colonyState, targetInfo, gameState) {
    let intensity = 0;
    const reasons = [];

    // Resource gain potential
    const resourceGainPotential = targetInfo.estimatedResources / Math.max(1, colonyState.totalResources || 1);
    if (resourceGainPotential > 1.5) {
      intensity += 0.3;
      reasons.push('High resource gain potential');
    }

    // Strategic position acquisition
    if (targetInfo.strategicValue > 0.7) {
      intensity += 0.3;
      reasons.push('Strategic position can be acquired');
    }

    // Technology or advantage gain
    if (targetInfo.technologicalAdvantage) {
      intensity += 0.2;
      reasons.push('Can capture advanced technology');
    }

    // Elimination opportunity (weak opponent)
    if (targetInfo.eliminationPotential > 0.7) {
      intensity += 0.4;
      reasons.push('Opportunity to eliminate opponent');
    }

    // Alliance disruption
    if (targetInfo.allianceDisruption > 0.5) {
      intensity += 0.2;
      reasons.push('Attack could disrupt enemy alliances');
    }

    return {
      triggered: intensity > 0.2,
      intensity: Math.min(1.0, intensity),
      reason: reasons.join('; ') || 'No significant strategic opportunities',
      factors: {
        resourceGainPotential: resourceGainPotential,
        strategicValue: targetInfo.strategicValue,
        eliminationPotential: targetInfo.eliminationPotential,
        technologicalAdvantage: targetInfo.technologicalAdvantage
      }
    };
  }

  /**
   * Evaluate defensive necessity triggers
   */
  evaluateDefensiveNecessity(colonyState, targetInfo, gameState) {
    let intensity = 0;
    const reasons = [];

    // Imminent threat
    if (targetInfo.threatLevel > 0.7) {
      intensity += 0.6;
      reasons.push('High threat level detected - preemptive action needed');
    }

    // Military buildup by target
    if (targetInfo.militaryBuildup > 0.6) {
      intensity += 0.4;
      reasons.push('Target is building military forces');
    }

    // Aggressive expansion toward colony
    if (targetInfo.expansionTowardColony > 0.5) {
      intensity += 0.5;
      reasons.push('Target expanding toward our territory');
    }

    // Resource competition
    if (targetInfo.resourceCompetition > 0.6) {
      intensity += 0.3;
      reasons.push('Competition for critical resources');
    }

    // Alliance threats
    if (targetInfo.allianceThreat > 0.5) {
      intensity += 0.3;
      reasons.push('Enemy alliance forming against us');
    }

    return {
      triggered: intensity > 0.3,
      intensity: Math.min(1.0, intensity),
      reason: reasons.join('; ') || 'No immediate defensive threats',
      factors: {
        threatLevel: targetInfo.threatLevel,
        militaryBuildup: targetInfo.militaryBuildup,
        expansionTowardColony: targetInfo.expansionTowardColony,
        resourceCompetition: targetInfo.resourceCompetition
      }
    };
  }

  /**
   * Evaluate economic pressure triggers
   */
  evaluateEconomicPressure(colonyState, gameState) {
    let intensity = 0;
    const reasons = [];

    // Resource scarcity
    const resources = colonyState.resources || {};
    const totalResources = Object.values(resources).reduce((sum, amount) => sum + amount, 0);
    
    if (totalResources < 200) {
      intensity += 0.4;
      reasons.push('Low resource reserves - raid needed');
    }

    // Economic stagnation
    if (colonyState.economicGrowthRate < 0.02) {
      intensity += 0.3;
      reasons.push('Economic stagnation - need external resources');
    }

    // Trade route disruption
    if (colonyState.tradeDisruption > 0.5) {
      intensity += 0.2;
      reasons.push('Trade routes disrupted');
    }

    // Maintenance costs
    if (colonyState.maintenanceBurden > 0.7) {
      intensity += 0.2;
      reasons.push('High maintenance costs strain economy');
    }

    return {
      triggered: intensity > 0.2,
      intensity: Math.min(1.0, intensity),
      reason: reasons.join('; ') || 'Economic situation stable',
      factors: {
        totalResources: totalResources,
        economicGrowthRate: colonyState.economicGrowthRate,
        tradeDisruption: colonyState.tradeDisruption,
        maintenanceBurden: colonyState.maintenanceBurden
      }
    };
  }

  /**
   * Evaluate diplomatic situation triggers
   */
  evaluateDiplomaticSituation(colonyState, targetInfo, gameState) {
    let intensity = 0;
    const reasons = [];

    // Deteriorating relations
    if (targetInfo.relationshipStatus < -0.5) {
      intensity += 0.3;
      reasons.push('Relations have deteriorated significantly');
    }

    // Alliance opportunities
    if (targetInfo.enemiesOfTarget && targetInfo.enemiesOfTarget.length > 0) {
      intensity += 0.2;
      reasons.push('Potential allies against target available');
    }

    // Diplomatic isolation of target
    if (targetInfo.diplomaticIsolation > 0.6) {
      intensity += 0.2;
      reasons.push('Target is diplomatically isolated');
    }

    // Recent betrayals or conflicts
    if (targetInfo.recentBetrayal) {
      intensity += 0.3;
      reasons.push('Recent betrayal justifies action');
    }

    return {
      triggered: intensity > 0.1,
      intensity: Math.min(1.0, intensity),
      reason: reasons.join('; ') || 'Diplomatic situation neutral',
      factors: {
        relationshipStatus: targetInfo.relationshipStatus,
        diplomaticIsolation: targetInfo.diplomaticIsolation,
        recentBetrayal: targetInfo.recentBetrayal
      }
    };
  }

  /**
   * Apply personality modifiers to trigger score
   */
  applyPersonalityModifiers(triggerScore, colonyState) {
    const personality = colonyState.personality || {};
    let modifier = 1.0;

    // Aggressive personalities increase trigger sensitivity
    if (personality.type === 'AGGRESSIVE') {
      modifier *= 1.3;
    } else if (personality.type === 'DEFENSIVE') {
      modifier *= 0.7;
    } else if (personality.type === 'OPPORTUNIST') {
      modifier *= 1.1;
    }

    // Aggression level modifier
    const aggressionLevel = colonyState.aggression_level || 0.5;
    modifier *= (0.5 + aggressionLevel);

    return triggerScore * modifier;
  }

  /**
   * Apply cooldown modifiers to trigger score
   */
  applyCooldownModifiers(triggerScore, colonyData) {
    if (colonyData.lastAttacks.length === 0) {
      return triggerScore;
    }

    const lastAttack = colonyData.lastAttacks[colonyData.lastAttacks.length - 1];
    const timeSinceLastAttack = new Date() - lastAttack.timestamp;
    const requiredCooldown = this.cooldownPeriods[lastAttack.type] || 300000;

    if (timeSinceLastAttack < requiredCooldown) {
      const cooldownRatio = timeSinceLastAttack / requiredCooldown;
      return triggerScore * cooldownRatio;
    }

    return triggerScore;
  }

  /**
   * Determine the type and scale of attack to recommend
   */
  determineAttackType(triggerScore, triggerEvaluations, colonyState) {
    const militaryCapacity = colonyState.used_military_capacity || 0;
    const confidence = Math.min(0.9, triggerScore);

    if (triggerScore >= 0.8 && militaryCapacity > 0.7) {
      return {
        type: 'campaign',
        confidence: confidence,
        delay: 0,
        description: 'Large-scale military campaign'
      };
    } else if (triggerScore >= 0.7) {
      return {
        type: 'siege',
        confidence: confidence,
        delay: 60000, // 1 minute preparation
        description: 'Siege operation'
      };
    } else if (triggerScore >= 0.6) {
      return {
        type: 'assault',
        confidence: confidence,
        delay: 30000, // 30 seconds preparation
        description: 'Coordinated assault'
      };
    } else if (triggerScore >= 0.4) {
      return {
        type: 'skirmish',
        confidence: confidence,
        delay: 15000, // 15 seconds preparation
        description: 'Limited skirmish'
      };
    } else {
      return {
        type: 'raid',
        confidence: confidence,
        delay: 5000, // 5 seconds preparation
        description: 'Quick raid'
      };
    }
  }

  /**
   * Calculate urgency level
   */
  calculateUrgency(triggerEvaluations) {
    let urgency = 0;

    if (triggerEvaluations.defensive_necessity?.triggered) {
      urgency += triggerEvaluations.defensive_necessity.intensity * 0.5;
    }

    if (triggerEvaluations.strategic_opportunity?.triggered) {
      urgency += triggerEvaluations.strategic_opportunity.intensity * 0.3;
    }

    if (triggerEvaluations.player_weakness?.triggered) {
      urgency += triggerEvaluations.player_weakness.intensity * 0.4;
    }

    return Math.min(1.0, urgency);
  }

  /**
   * Get cooldown status for all attack types
   */
  getCooldownStatus(colonyData) {
    const status = {};
    const now = new Date();

    Object.keys(this.cooldownPeriods).forEach(attackType => {
      const lastAttackOfType = colonyData.lastAttacks
        .filter(attack => attack.type === attackType)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (lastAttackOfType) {
        const timeSince = now - lastAttackOfType.timestamp;
        const cooldownPeriod = this.cooldownPeriods[attackType];
        const remainingCooldown = Math.max(0, cooldownPeriod - timeSince);

        status[attackType] = {
          available: remainingCooldown === 0,
          remainingCooldown: remainingCooldown,
          lastUsed: lastAttackOfType.timestamp
        };
      } else {
        status[attackType] = {
          available: true,
          remainingCooldown: 0,
          lastUsed: null
        };
      }
    });

    return status;
  }

  /**
   * Record a trigger evaluation for analysis
   */
  recordTriggerEvaluation(colonyData, evaluation) {
    colonyData.triggerHistory.push({
      timestamp: new Date(),
      triggerScore: evaluation.triggerScore,
      shouldAttack: evaluation.shouldAttack,
      attackType: evaluation.attackType,
      reasons: evaluation.reasons,
      urgency: evaluation.urgency
    });

    // Limit history size
    if (colonyData.triggerHistory.length > 20) {
      colonyData.triggerHistory.shift();
    }
  }

  /**
   * Record an actual attack launch
   */
  recordAttackLaunch(colonyId, attackType, targetInfo) {
    const colonyData = this.initializeColony(colonyId);
    
    colonyData.lastAttacks.push({
      timestamp: new Date(),
      type: attackType,
      target: targetInfo.targetId,
      targetPosition: targetInfo.position
    });

    // Limit attack history
    if (colonyData.lastAttacks.length > 10) {
      colonyData.lastAttacks.shift();
    }
  }

  /**
   * Get trigger analysis for a colony
   */
  getTriggerAnalysis(colonyId) {
    const colonyData = this.attackHistory.get(colonyId);
    if (!colonyData) {
      return null;
    }

    return {
      colonyId: colonyId,
      totalAttacks: colonyData.lastAttacks.length,
      attackFrequency: this.calculateAttackFrequency(colonyData),
      triggerPatterns: this.analyzeTriggerPatterns(colonyData),
      aggressionTrend: this.calculateAggressionTrend(colonyData),
      cooldownStatuses: this.getCooldownStatus(colonyData),
      recentTriggers: colonyData.triggerHistory.slice(-5)
    };
  }

  /**
   * Calculate attack frequency metrics
   */
  calculateAttackFrequency(colonyData) {
    if (colonyData.lastAttacks.length < 2) {
      return { averageInterval: null, frequency: 0 };
    }

    const intervals = [];
    for (let i = 1; i < colonyData.lastAttacks.length; i++) {
      const interval = colonyData.lastAttacks[i].timestamp - colonyData.lastAttacks[i-1].timestamp;
      intervals.push(interval);
    }

    const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const frequency = intervals.length / (averageInterval / (1000 * 60)); // Attacks per minute

    return {
      averageInterval: averageInterval,
      frequency: frequency,
      totalIntervals: intervals.length
    };
  }

  /**
   * Analyze patterns in trigger activations
   */
  analyzeTriggerPatterns(colonyData) {
    const patterns = {};
    
    colonyData.triggerHistory.forEach(trigger => {
      trigger.reasons.forEach(reason => {
        patterns[reason] = (patterns[reason] || 0) + 1;
      });
    });

    return Object.entries(patterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({
        reason: reason,
        frequency: count,
        percentage: (count / colonyData.triggerHistory.length) * 100
      }));
  }

  /**
   * Calculate aggression trend over time
   */
  calculateAggressionTrend(colonyData) {
    if (colonyData.triggerHistory.length < 3) {
      return 'insufficient_data';
    }

    const recentScores = colonyData.triggerHistory.slice(-5).map(t => t.triggerScore);
    const olderScores = colonyData.triggerHistory.slice(-10, -5).map(t => t.triggerScore);

    if (olderScores.length === 0) {
      return 'insufficient_data';
    }

    const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;

    const trend = recentAvg - olderAvg;

    if (trend > 0.1) {
      return 'increasing';
    } else if (trend < -0.1) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }
}

module.exports = TriggerConditions; 
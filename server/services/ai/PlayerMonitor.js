/**
 * PlayerMonitor class for tracking and analyzing player behavior patterns
 * Used by AI colonies to adapt their strategies based on player actions
 */

class PlayerMonitor {
  constructor() {
    this.playerProfiles = new Map(); // Store behavior profiles per player
    this.recentActions = new Map(); // Store recent actions per player
    this.behaviorPatterns = new Map(); // Store identified patterns per player
    this.actionCategories = [
      'resource_gathering',
      'territory_expansion',
      'military_buildup',
      'trading',
      'exploration',
      'diplomacy',
      'technology_research',
      'defensive_actions'
    ];
    this.patternDetectionWindow = 50; // Number of recent actions to analyze
    this.analysisInterval = 10; // Analyze patterns every N actions
  }

  /**
   * Initialize monitoring for a new player
   */
  initializePlayer(playerId) {
    if (!this.playerProfiles.has(playerId)) {
      this.playerProfiles.set(playerId, {
        playerId: playerId,
        totalActions: 0,
        actionCounts: {},
        sessionStartTime: new Date(),
        lastActivityTime: new Date(),
        playstyle: 'unknown',
        aggressiveness: 0.5,
        expansion_tendency: 0.5,
        economic_focus: 0.5,
        military_focus: 0.5,
        risk_tolerance: 0.5,
        adaptation_resistance: 0.5
      });

      this.recentActions.set(playerId, []);
      this.behaviorPatterns.set(playerId, []);
      
      // Initialize action counts
      const profile = this.playerProfiles.get(playerId);
      this.actionCategories.forEach(category => {
        profile.actionCounts[category] = 0;
      });
    }

    return this.playerProfiles.get(playerId);
  }

  /**
   * Record a player action
   */
  recordAction(playerId, actionData) {
    const profile = this.initializePlayer(playerId);
    const recentActions = this.recentActions.get(playerId);
    
    const action = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      type: actionData.type,
      category: this.categorizeAction(actionData),
      context: actionData.context || {},
      location: actionData.location || null,
      resources_involved: actionData.resources_involved || [],
      target: actionData.target || null,
      success: actionData.success !== undefined ? actionData.success : true,
      intensity: actionData.intensity || 1.0 // Scale of action impact
    };

    // Add to recent actions
    recentActions.push(action);
    
    // Maintain recent actions window
    if (recentActions.length > this.patternDetectionWindow) {
      recentActions.shift();
    }

    // Update profile statistics
    profile.totalActions++;
    profile.actionCounts[action.category]++;
    profile.lastActivityTime = new Date();

    // Trigger pattern analysis periodically
    if (profile.totalActions % this.analysisInterval === 0) {
      this.analyzePlayerBehavior(playerId);
    }

    return action.id;
  }

  /**
   * Categorize an action into predefined categories
   */
  categorizeAction(actionData) {
    const type = actionData.type.toLowerCase();
    
    if (type.includes('gather') || type.includes('harvest') || type.includes('mine')) {
      return 'resource_gathering';
    } else if (type.includes('expand') || type.includes('settle') || type.includes('claim')) {
      return 'territory_expansion';
    } else if (type.includes('train') || type.includes('recruit') || type.includes('military')) {
      return 'military_buildup';
    } else if (type.includes('trade') || type.includes('exchange') || type.includes('market')) {
      return 'trading';
    } else if (type.includes('scout') || type.includes('explore') || type.includes('discover')) {
      return 'exploration';
    } else if (type.includes('ally') || type.includes('treaty') || type.includes('negotiate')) {
      return 'diplomacy';
    } else if (type.includes('research') || type.includes('technology') || type.includes('upgrade')) {
      return 'technology_research';
    } else if (type.includes('defend') || type.includes('fortify') || type.includes('wall')) {
      return 'defensive_actions';
    }
    
    // Default to resource gathering if unclear
    return 'resource_gathering';
  }

  /**
   * Analyze player behavior and update profile
   */
  analyzePlayerBehavior(playerId) {
    const profile = this.playerProfiles.get(playerId);
    const recentActions = this.recentActions.get(playerId);
    
    if (!profile || recentActions.length < 5) {
      return null;
    }

    // Calculate behavior metrics
    const metrics = this.calculateBehaviorMetrics(profile, recentActions);
    
    // Update profile with new metrics
    profile.aggressiveness = metrics.aggressiveness;
    profile.expansion_tendency = metrics.expansion_tendency;
    profile.economic_focus = metrics.economic_focus;
    profile.military_focus = metrics.military_focus;
    profile.risk_tolerance = metrics.risk_tolerance;
    
    // Determine playstyle
    profile.playstyle = this.identifyPlaystyle(metrics);
    
    // Detect behavior patterns
    const patterns = this.detectBehaviorPatterns(recentActions);
    this.behaviorPatterns.set(playerId, patterns);
    
    return {
      profile: profile,
      metrics: metrics,
      patterns: patterns
    };
  }

  /**
   * Calculate behavior metrics from action data
   */
  calculateBehaviorMetrics(profile, recentActions) {
    const totalActions = profile.totalActions;
    const actionCounts = profile.actionCounts;
    
    // Calculate focus percentages
    const militaryPercentage = (actionCounts.military_buildup + actionCounts.defensive_actions) / totalActions;
    const economicPercentage = (actionCounts.resource_gathering + actionCounts.trading) / totalActions;
    const expansionPercentage = (actionCounts.territory_expansion + actionCounts.exploration) / totalActions;
    
    // Analyze recent action intensity and patterns
    const recentMilitaryActions = recentActions.filter(a => 
      a.category === 'military_buildup' || a.category === 'defensive_actions'
    ).length;
    
    const recentAggressiveActions = recentActions.filter(a => 
      a.type.includes('attack') || a.type.includes('raid') || a.intensity > 0.7
    ).length;

    const recentRiskyActions = recentActions.filter(a => 
      a.context.risk_level > 0.6 || a.type.includes('aggressive')
    ).length;

    // Calculate metrics (0-1 scale)
    const metrics = {
      aggressiveness: Math.min(1.0, (recentAggressiveActions / Math.max(1, recentActions.length)) + (militaryPercentage * 0.5)),
      expansion_tendency: Math.min(1.0, expansionPercentage + (recentActions.filter(a => a.category === 'territory_expansion').length / Math.max(1, recentActions.length))),
      economic_focus: Math.min(1.0, economicPercentage),
      military_focus: Math.min(1.0, militaryPercentage + (recentMilitaryActions / Math.max(1, recentActions.length))),
      risk_tolerance: Math.min(1.0, recentRiskyActions / Math.max(1, recentActions.length)),
      adaptation_resistance: this.calculateAdaptationResistance(recentActions)
    };

    return metrics;
  }

  /**
   * Calculate how resistant the player is to changing strategies
   */
  calculateAdaptationResistance(recentActions) {
    if (recentActions.length < 10) {
      return 0.5; // Default neutral resistance
    }

    // Analyze action diversity over time
    const actionTypes = new Set(recentActions.map(a => a.type));
    const categoryDistribution = {};
    
    recentActions.forEach(action => {
      categoryDistribution[action.category] = (categoryDistribution[action.category] || 0) + 1;
    });

    // High resistance = low diversity, consistent patterns
    const diversity = actionTypes.size / recentActions.length;
    const maxCategory = Math.max(...Object.values(categoryDistribution));
    const dominance = maxCategory / recentActions.length;

    // Higher dominance and lower diversity = higher resistance to change
    return Math.min(1.0, dominance * 1.5 - diversity);
  }

  /**
   * Identify player's primary playstyle
   */
  identifyPlaystyle(metrics) {
    const { aggressiveness, expansion_tendency, economic_focus, military_focus, risk_tolerance } = metrics;
    
    // Aggressive military player
    if (aggressiveness > 0.7 && military_focus > 0.6) {
      return 'aggressive_military';
    }
    
    // Defensive turtle player
    if (military_focus > 0.5 && expansion_tendency < 0.3 && risk_tolerance < 0.4) {
      return 'defensive_turtle';
    }
    
    // Economic focused player
    if (economic_focus > 0.6 && military_focus < 0.3) {
      return 'economic_focused';
    }
    
    // Rapid expansion player
    if (expansion_tendency > 0.6 && risk_tolerance > 0.5) {
      return 'rapid_expander';
    }
    
    // Balanced strategic player
    if (Math.abs(aggressiveness - 0.5) < 0.2 && Math.abs(expansion_tendency - 0.5) < 0.2) {
      return 'balanced_strategic';
    }
    
    // Explorer/scout player
    if (expansion_tendency > 0.5 && risk_tolerance < 0.5) {
      return 'cautious_explorer';
    }
    
    return 'adaptive_opportunist';
  }

  /**
   * Detect behavioral patterns in recent actions
   */
  detectBehaviorPatterns(recentActions) {
    const patterns = [];
    
    if (recentActions.length < 5) {
      return patterns;
    }

    // Pattern 1: Resource hoarding
    const resourceActions = recentActions.filter(a => a.category === 'resource_gathering');
    if (resourceActions.length > recentActions.length * 0.6) {
      patterns.push({
        type: 'resource_hoarding',
        confidence: resourceActions.length / recentActions.length,
        description: 'Player is focusing heavily on resource accumulation',
        predictedBehavior: 'major_expansion_or_military_buildup'
      });
    }

    // Pattern 2: Military buildup sequence
    const militarySequence = this.findActionSequence(recentActions, ['military_buildup', 'defensive_actions'], 3);
    if (militarySequence.length > 0) {
      patterns.push({
        type: 'military_preparation',
        confidence: 0.8,
        description: 'Player is preparing for military action',
        predictedBehavior: 'imminent_attack_or_defense'
      });
    }

    // Pattern 3: Expansion pressure
    const expansionActions = recentActions.filter(a => a.category === 'territory_expansion');
    if (expansionActions.length >= 3) {
      patterns.push({
        type: 'expansion_pressure',
        confidence: expansionActions.length / 5,
        description: 'Player is aggressively expanding territory',
        predictedBehavior: 'territorial_conflict_likely'
      });
    }

    // Pattern 4: Defensive posturing
    const defensiveActions = recentActions.filter(a => a.category === 'defensive_actions');
    if (defensiveActions.length > recentActions.length * 0.4) {
      patterns.push({
        type: 'defensive_preparation',
        confidence: defensiveActions.length / recentActions.length,
        description: 'Player is strengthening defenses',
        predictedBehavior: 'expecting_attack_or_turtle_strategy'
      });
    }

    // Pattern 5: Trading focus
    const tradingActions = recentActions.filter(a => a.category === 'trading');
    if (tradingActions.length > recentActions.length * 0.3) {
      patterns.push({
        type: 'trade_focused',
        confidence: tradingActions.length / recentActions.length,
        description: 'Player is prioritizing economic growth through trade',
        predictedBehavior: 'peaceful_economic_expansion'
      });
    }

    // Pattern 6: Hit-and-run tactics
    const raidPattern = this.detectRaidPattern(recentActions);
    if (raidPattern.detected) {
      patterns.push({
        type: 'hit_and_run_tactics',
        confidence: raidPattern.confidence,
        description: 'Player employs quick strike tactics',
        predictedBehavior: 'continued_harassment_attacks'
      });
    }

    return patterns;
  }

  /**
   * Find sequences of specific action categories
   */
  findActionSequence(actions, categories, minLength) {
    const sequences = [];
    let currentSequence = [];
    
    actions.forEach((action, index) => {
      if (categories.includes(action.category)) {
        currentSequence.push({ action, index });
      } else {
        if (currentSequence.length >= minLength) {
          sequences.push([...currentSequence]);
        }
        currentSequence = [];
      }
    });
    
    // Check final sequence
    if (currentSequence.length >= minLength) {
      sequences.push(currentSequence);
    }
    
    return sequences;
  }

  /**
   * Detect hit-and-run raid patterns
   */
  detectRaidPattern(recentActions) {
    let raidCount = 0;
    let quickWithdrawals = 0;
    
    for (let i = 0; i < recentActions.length - 1; i++) {
      const current = recentActions[i];
      const next = recentActions[i + 1];
      
      // Look for attack followed by retreat/withdrawal
      if (current.type.includes('attack') || current.type.includes('raid')) {
        raidCount++;
        
        if (next.type.includes('retreat') || next.type.includes('withdraw') || 
            next.category === 'defensive_actions') {
          quickWithdrawals++;
        }
      }
    }
    
    const confidence = raidCount > 0 ? quickWithdrawals / raidCount : 0;
    
    return {
      detected: confidence > 0.6 && raidCount >= 2,
      confidence: confidence,
      raidCount: raidCount,
      withdrawalRate: confidence
    };
  }

  /**
   * Get player behavior summary
   */
  getPlayerBehaviorSummary(playerId) {
    const profile = this.playerProfiles.get(playerId);
    const patterns = this.behaviorPatterns.get(playerId) || [];
    const recentActions = this.recentActions.get(playerId) || [];
    
    if (!profile) {
      return null;
    }
    
    return {
      playerId: playerId,
      playstyle: profile.playstyle,
      metrics: {
        aggressiveness: profile.aggressiveness,
        expansion_tendency: profile.expansion_tendency,
        economic_focus: profile.economic_focus,
        military_focus: profile.military_focus,
        risk_tolerance: profile.risk_tolerance,
        adaptation_resistance: profile.adaptation_resistance
      },
      activity: {
        totalActions: profile.totalActions,
        sessionDuration: (new Date() - profile.sessionStartTime) / (1000 * 60), // Minutes
        actionsPerMinute: profile.totalActions / Math.max(1, (new Date() - profile.sessionStartTime) / (1000 * 60)),
        lastActivity: profile.lastActivityTime
      },
      patterns: patterns,
      recentActionCount: recentActions.length,
      predictedNextAction: this.predictNextAction(playerId)
    };
  }

  /**
   * Predict player's next likely action
   */
  predictNextAction(playerId) {
    const profile = this.playerProfiles.get(playerId);
    const patterns = this.behaviorPatterns.get(playerId) || [];
    const recentActions = this.recentActions.get(playerId) || [];
    
    if (!profile || recentActions.length === 0) {
      return null;
    }

    // Base prediction on recent patterns
    const prediction = {
      category: 'resource_gathering', // Default
      confidence: 0.3,
      reasoning: 'Default fallback prediction'
    };

    // Check for active patterns
    const highConfidencePattern = patterns.find(p => p.confidence > 0.7);
    if (highConfidencePattern) {
      prediction.reasoning = `Following ${highConfidencePattern.type} pattern`;
      prediction.confidence = highConfidencePattern.confidence;
      
      switch (highConfidencePattern.predictedBehavior) {
        case 'imminent_attack_or_defense':
          prediction.category = 'military_buildup';
          break;
        case 'major_expansion_or_military_buildup':
          prediction.category = profile.military_focus > 0.5 ? 'military_buildup' : 'territory_expansion';
          break;
        case 'territorial_conflict_likely':
          prediction.category = 'territory_expansion';
          break;
        case 'expecting_attack_or_turtle_strategy':
          prediction.category = 'defensive_actions';
          break;
        case 'peaceful_economic_expansion':
          prediction.category = 'trading';
          break;
      }
    } else {
      // Predict based on playstyle
      switch (profile.playstyle) {
        case 'aggressive_military':
          prediction.category = Math.random() > 0.5 ? 'military_buildup' : 'territory_expansion';
          prediction.confidence = 0.6;
          break;
        case 'defensive_turtle':
          prediction.category = 'defensive_actions';
          prediction.confidence = 0.7;
          break;
        case 'economic_focused':
          prediction.category = Math.random() > 0.3 ? 'resource_gathering' : 'trading';
          prediction.confidence = 0.6;
          break;
        case 'rapid_expander':
          prediction.category = 'territory_expansion';
          prediction.confidence = 0.7;
          break;
      }
    }

    return prediction;
  }

  /**
   * Get threat assessment for a player
   */
  getThreatAssessment(playerId) {
    const profile = this.playerProfiles.get(playerId);
    const patterns = this.behaviorPatterns.get(playerId) || [];
    
    if (!profile) {
      return { threat_level: 0.5, reasoning: 'Unknown player' };
    }

    let threatLevel = 0.5; // Base threat level
    const reasons = [];

    // Factor in aggressiveness
    threatLevel += (profile.aggressiveness - 0.5) * 0.4;
    if (profile.aggressiveness > 0.7) {
      reasons.push('High aggressiveness detected');
    }

    // Factor in military focus
    threatLevel += (profile.military_focus - 0.5) * 0.3;
    if (profile.military_focus > 0.6) {
      reasons.push('Strong military focus');
    }

    // Factor in patterns
    patterns.forEach(pattern => {
      switch (pattern.type) {
        case 'military_preparation':
          threatLevel += 0.3 * pattern.confidence;
          reasons.push('Military buildup detected');
          break;
        case 'expansion_pressure':
          threatLevel += 0.2 * pattern.confidence;
          reasons.push('Aggressive expansion detected');
          break;
        case 'hit_and_run_tactics':
          threatLevel += 0.25 * pattern.confidence;
          reasons.push('Raiding pattern identified');
          break;
      }
    });

    // Cap threat level
    threatLevel = Math.max(0.1, Math.min(0.95, threatLevel));

    return {
      threat_level: threatLevel,
      confidence: Math.min(0.9, profile.totalActions / 50), // More actions = higher confidence
      reasoning: reasons.length > 0 ? reasons.join(', ') : 'Standard threat assessment',
      recommendations: this.generateThreatRecommendations(threatLevel, patterns)
    };
  }

  /**
   * Generate recommendations based on threat assessment
   */
  generateThreatRecommendations(threatLevel, patterns) {
    const recommendations = [];

    if (threatLevel > 0.7) {
      recommendations.push('Increase defensive posture');
      recommendations.push('Monitor for imminent attacks');
      recommendations.push('Consider preemptive defensive measures');
    } else if (threatLevel > 0.5) {
      recommendations.push('Maintain moderate defensive stance');
      recommendations.push('Monitor military activities');
    } else {
      recommendations.push('Standard monitoring sufficient');
      recommendations.push('Focus on economic/expansion goals');
    }

    // Pattern-specific recommendations
    patterns.forEach(pattern => {
      switch (pattern.type) {
        case 'military_preparation':
          recommendations.push('Prepare for potential conflict');
          break;
        case 'expansion_pressure':
          recommendations.push('Secure key territorial positions');
          break;
        case 'hit_and_run_tactics':
          recommendations.push('Strengthen perimeter defenses');
          break;
      }
    });

    return recommendations;
  }
}

module.exports = PlayerMonitor; 
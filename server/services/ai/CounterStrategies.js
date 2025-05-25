/**
 * CounterStrategies class for selecting and implementing counter-strategies
 * against specific player behaviors and tactical patterns
 */

const AdaptiveStrategy = require('./AdaptiveStrategy');
const TriggerConditions = require('./TriggerConditions');

class CounterStrategies {
  constructor() {
    this.adaptiveStrategy = new AdaptiveStrategy();
    this.triggerConditions = new TriggerConditions();
    
    this.counterStrategyTypes = [
      'mirror_strategy',      // Copy successful player tactics
      'direct_counter',       // Direct opposition to player strategy
      'flanking_maneuver',    // Indirect approach to player weaknesses
      'economic_warfare',     // Target player's economy
      'psychological_pressure', // Create stress and uncertainty
      'territorial_denial',   // Control key areas
      'hit_and_run',         // Quick strikes and retreats
      'overwhelming_force',   // Concentrated power attacks
      'defensive_attrition',  // Wear down aggressive players
      'technology_race',      // Focus on advancement
      'alliance_disruption',  // Break player partnerships
      'adaptive_chaos'        // Unpredictable mixed tactics
    ];

    this.strategyDatabase = new Map(); // Store successful counter-strategies
    this.playerCounters = new Map();   // Track what works against specific players
    this.effectivenessMetrics = new Map(); // Measure strategy success
  }

  /**
   * Initialize counter-strategy tracking for a colony
   */
  initializeColony(colonyId) {
    if (!this.strategyDatabase.has(colonyId)) {
      this.strategyDatabase.set(colonyId, {
        colonyId: colonyId,
        appliedStrategies: [],
        successfulCounters: [],
        failedCounters: [],
        adaptationHistory: [],
        specialization: null,
        learningRate: 0.1
      });
    }
    return this.strategyDatabase.get(colonyId);
  }

  /**
   * Select and implement the best counter-strategy against a player
   */
  async selectCounterStrategy(colonyId, playerId, playerBehavior, gameContext) {
    const colonyData = this.initializeColony(colonyId);
    
    // Analyze player's current strategy and patterns
    const playerAnalysis = this.analyzePlayerStrategy(playerBehavior, gameContext);
    
    // Generate potential counter-strategies
    const potentialCounters = this.generateCounterOptions(playerAnalysis, colonyData);
    
    // Evaluate effectiveness of each option
    const evaluatedCounters = this.evaluateCounterEffectiveness(potentialCounters, playerBehavior, colonyData);
    
    // Select the best counter-strategy
    const selectedCounter = this.selectOptimalCounter(evaluatedCounters, colonyData);
    
    // Implement the counter-strategy
    const implementation = await this.implementCounterStrategy(colonyId, playerId, selectedCounter, gameContext);
    
    // Record the application
    this.recordCounterApplication(colonyData, selectedCounter, implementation);
    
    return {
      counterStrategy: selectedCounter,
      implementation: implementation,
      reasoning: selectedCounter.reasoning,
      expectedEffectiveness: selectedCounter.effectiveness,
      alternativeOptions: evaluatedCounters.slice(1, 4) // Top 3 alternatives
    };
  }

  /**
   * Analyze player's current strategy and identify key patterns
   */
  analyzePlayerStrategy(playerBehavior, gameContext) {
    const analysis = {
      primaryStrategy: playerBehavior.playstyle,
      activePatterns: playerBehavior.patterns || [],
      strengths: [],
      weaknesses: [],
      predictedActions: [],
      exploitableGaps: [],
      adaptationLevel: playerBehavior.metrics?.adaptation_resistance || 0.5
    };

    // Identify strengths based on playstyle
    switch (playerBehavior.playstyle) {
      case 'aggressive_military':
        analysis.strengths.push('strong_military', 'quick_decisive_action', 'pressure_tactics');
        analysis.weaknesses.push('resource_drain', 'defensive_gaps', 'overextension');
        break;
      case 'defensive_turtle':
        analysis.strengths.push('strong_defense', 'resource_accumulation', 'patience');
        analysis.weaknesses.push('slow_expansion', 'predictability', 'missed_opportunities');
        break;
      case 'economic_focused':
        analysis.strengths.push('resource_advantage', 'long_term_thinking', 'efficiency');
        analysis.weaknesses.push('military_weakness', 'slow_response', 'vulnerable_economy');
        break;
      case 'rapid_expander':
        analysis.strengths.push('territory_control', 'resource_access', 'strategic_positioning');
        analysis.weaknesses.push('thin_defenses', 'resource_strain', 'coordination_difficulties');
        break;
      case 'balanced_strategic':
        analysis.strengths.push('adaptability', 'well_rounded', 'strategic_thinking');
        analysis.weaknesses.push('lacks_specialization', 'slower_development', 'resource_division');
        break;
    }

    // Analyze behavioral patterns for additional insights
    playerBehavior.patterns?.forEach(pattern => {
      switch (pattern.type) {
        case 'military_preparation':
          analysis.predictedActions.push('imminent_attack', 'territorial_expansion');
          analysis.exploitableGaps.push('economic_focus_reduced', 'diplomatic_neglect');
          break;
        case 'resource_hoarding':
          analysis.predictedActions.push('major_expansion', 'technology_upgrade');
          analysis.exploitableGaps.push('current_weakness', 'delayed_action');
          break;
        case 'expansion_pressure':
          analysis.predictedActions.push('continued_expansion', 'resource_competition');
          analysis.exploitableGaps.push('defensive_weakening', 'overextension_risk');
          break;
        case 'hit_and_run_tactics':
          analysis.predictedActions.push('harassment_attacks', 'evasive_maneuvers');
          analysis.exploitableGaps.push('lack_of_commitment', 'territory_abandonment');
          break;
      }
    });

    return analysis;
  }

  /**
   * Generate potential counter-strategy options
   */
  generateCounterOptions(playerAnalysis, colonyData) {
    const options = [];
    const primaryStrategy = playerAnalysis.primaryStrategy;
    const patterns = playerAnalysis.activePatterns;

    // Primary counter-strategies based on player's main approach
    const primaryCounters = this.getPrimaryCounters(primaryStrategy);
    options.push(...primaryCounters);

    // Pattern-specific counters
    patterns.forEach(pattern => {
      const patternCounters = this.getPatternCounters(pattern.type);
      options.push(...patternCounters);
    });

    // Weakness exploitation strategies
    playerAnalysis.weaknesses.forEach(weakness => {
      const exploitationStrategies = this.getWeaknessExploitationStrategies(weakness);
      options.push(...exploitationStrategies);
    });

    // Learning-based strategies (from previous encounters)
    const historicalCounters = this.getHistoricallyEffectiveCounters(colonyData, playerAnalysis);
    options.push(...historicalCounters);

    // Adaptive chaos if player shows high adaptation
    if (playerAnalysis.adaptationLevel > 0.7) {
      options.push(this.generateAdaptiveChaosStrategy());
    }

    return this.deduplicateOptions(options);
  }

  /**
   * Get primary counter-strategies for each playstyle
   */
  getPrimaryCounters(playstyle) {
    const counters = {
      aggressive_military: [
        {
          type: 'defensive_attrition',
          approach: 'fortify_and_counter',
          description: 'Build strong defenses and counter-attack when aggressor overextends',
          tacticalFocus: ['defensive_positioning', 'resource_conservation', 'opportunistic_strikes']
        },
        {
          type: 'economic_warfare',
          approach: 'resource_disruption',
          description: 'Target economic infrastructure to starve military production',
          tacticalFocus: ['raid_economy', 'block_resources', 'technological_advantage']
        },
        {
          type: 'hit_and_run',
          approach: 'mobility_harassment',
          description: 'Use mobility to harass and avoid direct confrontation',
          tacticalFocus: ['fast_units', 'guerrilla_tactics', 'retreat_routes']
        }
      ],
      defensive_turtle: [
        {
          type: 'territorial_denial',
          approach: 'expansion_blockade',
          description: 'Control key territories to force defensive player to react',
          tacticalFocus: ['strategic_positions', 'resource_control', 'pressure_application']
        },
        {
          type: 'economic_warfare',
          approach: 'resource_competition',
          description: 'Compete for resources and force economic decisions',
          tacticalFocus: ['resource_domination', 'trade_disruption', 'economic_pressure']
        },
        {
          type: 'overwhelming_force',
          approach: 'concentrated_assault',
          description: 'Build superior force and break defensive positions',
          tacticalFocus: ['force_concentration', 'siege_capabilities', 'breakthrough_tactics']
        }
      ],
      economic_focused: [
        {
          type: 'direct_counter',
          approach: 'military_pressure',
          description: 'Apply early military pressure before economic advantage grows',
          tacticalFocus: ['early_aggression', 'economic_disruption', 'time_pressure']
        },
        {
          type: 'hit_and_run',
          approach: 'economic_harassment',
          description: 'Disrupt economic operations with quick strikes',
          tacticalFocus: ['target_workers', 'resource_raids', 'infrastructure_damage']
        },
        {
          type: 'technology_race',
          approach: 'competitive_advancement',
          description: 'Compete in technological development to match economic growth',
          tacticalFocus: ['research_focus', 'technological_advantages', 'efficiency_improvements']
        }
      ],
      rapid_expander: [
        {
          type: 'flanking_maneuver',
          approach: 'exploit_overextension',
          description: 'Target weak points in expanded territory',
          tacticalFocus: ['weak_settlements', 'supply_line_attacks', 'isolated_targets']
        },
        {
          type: 'hit_and_run',
          approach: 'harassment_campaign',
          description: 'Constantly harass expanded positions to force defensive concentration',
          tacticalFocus: ['mobile_raids', 'multiple_targets', 'coordination_disruption']
        },
        {
          type: 'territorial_denial',
          approach: 'key_position_control',
          description: 'Control strategic positions to limit further expansion',
          tacticalFocus: ['chokepoints', 'resource_denial', 'expansion_blocking']
        }
      ],
      balanced_strategic: [
        {
          type: 'adaptive_chaos',
          approach: 'unpredictable_tactics',
          description: 'Use unpredictable mixed tactics to prevent adaptation',
          tacticalFocus: ['strategy_switching', 'misdirection', 'tactical_surprise']
        },
        {
          type: 'mirror_strategy',
          approach: 'competitive_matching',
          description: 'Match balanced approach with superior execution',
          tacticalFocus: ['efficiency_superiority', 'tactical_refinement', 'strategic_patience']
        },
        {
          type: 'overwhelming_force',
          approach: 'decisive_superiority',
          description: 'Build decisive advantage in one area to break balance',
          tacticalFocus: ['specialization_advantage', 'concentrated_strength', 'decisive_action']
        }
      ]
    };

    return counters[playstyle] || [this.generateAdaptiveChaosStrategy()];
  }

  /**
   * Get counter-strategies for specific behavioral patterns
   */
  getPatternCounters(patternType) {
    const patternCounters = {
      military_preparation: [
        {
          type: 'psychological_pressure',
          approach: 'force_premature_action',
          description: 'Create pressure to force early, unprepared military action',
          tacticalFocus: ['threat_display', 'false_targets', 'time_pressure']
        },
        {
          type: 'defensive_attrition',
          approach: 'preparation_counter',
          description: 'Prepare defenses to make military buildup ineffective',
          tacticalFocus: ['defensive_superiority', 'fortification', 'counter_preparation']
        }
      ],
      resource_hoarding: [
        {
          type: 'direct_counter',
          approach: 'immediate_pressure',
          description: 'Strike before hoarded resources can be utilized',
          tacticalFocus: ['time_pressure', 'immediate_action', 'prevent_utilization']
        },
        {
          type: 'economic_warfare',
          approach: 'resource_disruption',
          description: 'Disrupt resource collection to prevent further hoarding',
          tacticalFocus: ['resource_raids', 'worker_harassment', 'supply_disruption']
        }
      ],
      expansion_pressure: [
        {
          type: 'territorial_denial',
          approach: 'expansion_blocking',
          description: 'Block key expansion routes and territories',
          tacticalFocus: ['strategic_positioning', 'route_control', 'expansion_prevention']
        },
        {
          type: 'flanking_maneuver',
          approach: 'overextension_exploitation',
          description: 'Target weak points created by rapid expansion',
          tacticalFocus: ['weak_settlements', 'overextended_lines', 'supply_vulnerabilities']
        }
      ],
      hit_and_run_tactics: [
        {
          type: 'territorial_denial',
          approach: 'area_control',
          description: 'Control key areas to limit hit-and-run effectiveness',
          tacticalFocus: ['area_denial', 'movement_restriction', 'defensive_networks']
        },
        {
          type: 'overwhelming_force',
          approach: 'decisive_engagement',
          description: 'Force decisive engagements that favor concentrated force',
          tacticalFocus: ['force_concentration', 'engagement_forcing', 'mobility_counters']
        }
      ]
    };

    return patternCounters[patternType] || [];
  }

  /**
   * Get strategies to exploit specific weaknesses
   */
  getWeaknessExploitationStrategies(weakness) {
    const exploitationStrategies = {
      resource_drain: [
        {
          type: 'economic_warfare',
          approach: 'accelerate_drain',
          description: 'Force continued resource expenditure to accelerate depletion',
          tacticalFocus: ['force_military_spending', 'resource_competition', 'economic_pressure']
        }
      ],
      defensive_gaps: [
        {
          type: 'flanking_maneuver',
          approach: 'gap_exploitation',
          description: 'Target and exploit identified defensive weaknesses',
          tacticalFocus: ['weak_point_attacks', 'breakthrough_tactics', 'defensive_penetration']
        }
      ],
      overextension: [
        {
          type: 'hit_and_run',
          approach: 'multiple_target_harassment',
          description: 'Attack multiple overextended positions simultaneously',
          tacticalFocus: ['simultaneous_attacks', 'coordination_disruption', 'force_dispersion']
        }
      ],
      military_weakness: [
        {
          type: 'direct_counter',
          approach: 'military_superiority',
          description: 'Exploit military weakness with direct military action',
          tacticalFocus: ['military_advantage', 'force_application', 'tactical_superiority']
        }
      ],
      predictability: [
        {
          type: 'adaptive_chaos',
          approach: 'unpredictable_response',
          description: 'Use unpredictable tactics against predictable behavior',
          tacticalFocus: ['strategy_variation', 'tactical_surprise', 'behavioral_disruption']
        }
      ]
    };

    return exploitationStrategies[weakness] || [];
  }

  /**
   * Get historically effective counter-strategies
   */
  getHistoricallyEffectiveCounters(colonyData, playerAnalysis) {
    const historicalCounters = [];
    
    // Find successful strategies from history
    colonyData.successfulCounters.forEach(counter => {
      if (counter.targetPlaystyle === playerAnalysis.primaryStrategy) {
        historicalCounters.push({
          ...counter.strategy,
          type: 'historical_success',
          approach: counter.approach,
          description: `Previously successful strategy: ${counter.description}`,
          tacticalFocus: counter.tacticalFocus,
          historicalEffectiveness: counter.effectiveness
        });
      }
    });

    return historicalCounters;
  }

  /**
   * Generate adaptive chaos strategy for highly adaptive players
   */
  generateAdaptiveChaosStrategy() {
    const chaosTactics = [
      'random_strategy_switching',
      'misdirection_campaigns',
      'false_buildup_patterns',
      'unexpected_alliances',
      'tactical_feints',
      'resource_cycling',
      'unit_composition_variation'
    ];

    return {
      type: 'adaptive_chaos',
      approach: 'unpredictable_adaptation',
      description: 'Use constantly changing tactics to prevent player adaptation',
      tacticalFocus: chaosTactics,
      unpredictabilityLevel: 0.9
    };
  }

  /**
   * Remove duplicate counter-strategy options
   */
  deduplicateOptions(options) {
    const seen = new Set();
    return options.filter(option => {
      const key = `${option.type}_${option.approach}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Evaluate effectiveness of counter-strategy options
   */
  evaluateCounterEffectiveness(options, playerBehavior, colonyData) {
    return options.map(option => {
      let effectiveness = 0.5; // Base effectiveness
      
      // Evaluate based on player's adaptation resistance
      const adaptationResistance = playerBehavior.metrics?.adaptation_resistance || 0.5;
      if (option.type === 'adaptive_chaos' && adaptationResistance > 0.7) {
        effectiveness += 0.3;
      }

      // Evaluate based on player's current focus
      const militaryFocus = playerBehavior.metrics?.military_focus || 0.5;
      if (option.type === 'economic_warfare' && militaryFocus > 0.7) {
        effectiveness += 0.2;
      }

      // Historical success modifier
      if (option.historicalEffectiveness) {
        effectiveness += option.historicalEffectiveness * 0.3;
      }

      // Risk vs reward calculation
      const riskLevel = this.calculateStrategyRisk(option);
      const rewardPotential = this.calculateRewardPotential(option, playerBehavior);
      effectiveness += (rewardPotential - riskLevel) * 0.2;

      // Resource availability check
      const resourceFeasibility = this.checkResourceFeasibility(option, colonyData);
      effectiveness *= resourceFeasibility;

      return {
        ...option,
        effectiveness: Math.max(0.1, Math.min(0.95, effectiveness)),
        riskLevel: riskLevel,
        rewardPotential: rewardPotential,
        feasibility: resourceFeasibility
      };
    }).sort((a, b) => b.effectiveness - a.effectiveness);
  }

  /**
   * Calculate risk level for a strategy
   */
  calculateStrategyRisk(strategy) {
    const riskFactors = {
      overwhelming_force: 0.8,
      direct_counter: 0.6,
      flanking_maneuver: 0.4,
      hit_and_run: 0.3,
      economic_warfare: 0.3,
      defensive_attrition: 0.2,
      territorial_denial: 0.4,
      adaptive_chaos: 0.5,
      psychological_pressure: 0.3,
      technology_race: 0.2,
      mirror_strategy: 0.3
    };

    return riskFactors[strategy.type] || 0.5;
  }

  /**
   * Calculate reward potential for a strategy
   */
  calculateRewardPotential(strategy, playerBehavior) {
    let potential = 0.5;

    // Higher reward for exploiting weaknesses
    if (strategy.approach?.includes('exploitation') || strategy.approach?.includes('weakness')) {
      potential += 0.3;
    }

    // Bonus for targeting player's weak areas
    const militaryFocus = playerBehavior.metrics?.military_focus || 0.5;
    if (strategy.type === 'economic_warfare' && militaryFocus > 0.6) {
      potential += 0.2;
    }

    // Pattern matching bonus
    playerBehavior.patterns?.forEach(pattern => {
      if (strategy.description.toLowerCase().includes(pattern.type.replace('_', ' '))) {
        potential += 0.1;
      }
    });

    return Math.max(0.1, Math.min(0.9, potential));
  }

  /**
   * Check if strategy is feasible with current resources
   */
  checkResourceFeasibility(strategy, colonyData) {
    // Simplified feasibility check - in real implementation would check actual resources
    const resourceRequirements = {
      overwhelming_force: 0.8,
      technology_race: 0.7,
      economic_warfare: 0.6,
      territorial_denial: 0.6,
      defensive_attrition: 0.5,
      hit_and_run: 0.4,
      flanking_maneuver: 0.4,
      adaptive_chaos: 0.5,
      direct_counter: 0.6,
      psychological_pressure: 0.3,
      mirror_strategy: 0.5
    };

    const requirement = resourceRequirements[strategy.type] || 0.5;
    const availability = 0.7; // Placeholder - would check actual colony resources

    return Math.min(1.0, availability / requirement);
  }

  /**
   * Select the optimal counter-strategy
   */
  selectOptimalCounter(evaluatedCounters, colonyData) {
    if (evaluatedCounters.length === 0) {
      return this.generateAdaptiveChaosStrategy();
    }

    // Add some randomness to prevent total predictability
    const topStrategies = evaluatedCounters.slice(0, 3);
    const weights = topStrategies.map((strategy, index) => 
      strategy.effectiveness * Math.pow(0.8, index)
    );
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < topStrategies.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        const selected = topStrategies[i];
        selected.reasoning = this.generateStrategyReasoning(selected, evaluatedCounters);
        return selected;
      }
    }

    // Fallback to top strategy
    const selected = evaluatedCounters[0];
    selected.reasoning = this.generateStrategyReasoning(selected, evaluatedCounters);
    return selected;
  }

  /**
   * Generate reasoning for strategy selection
   */
  generateStrategyReasoning(selectedStrategy, allOptions) {
    const reasons = [];

    reasons.push(`Selected ${selectedStrategy.type} with ${(selectedStrategy.effectiveness * 100).toFixed(1)}% effectiveness`);
    
    if (selectedStrategy.historicalEffectiveness) {
      reasons.push('Previously successful against similar player behavior');
    }

    if (selectedStrategy.riskLevel < 0.4) {
      reasons.push('Low risk approach preferred');
    } else if (selectedStrategy.rewardPotential > 0.7) {
      reasons.push('High reward potential justifies elevated risk');
    }

    if (allOptions.length > 1) {
      const secondBest = allOptions[1];
      const advantage = selectedStrategy.effectiveness - secondBest.effectiveness;
      if (advantage > 0.2) {
        reasons.push('Clear effectiveness advantage over alternatives');
      } else {
        reasons.push('Slight edge over alternative strategies');
      }
    }

    return reasons.join('; ');
  }

  /**
   * Implement the selected counter-strategy
   */
  async implementCounterStrategy(colonyId, playerId, strategy, gameContext) {
    const implementation = {
      strategyType: strategy.type,
      tacticalFocus: strategy.tacticalFocus,
      immediateActions: [],
      phaseActions: {},
      resourceAllocations: {},
      behaviorModifications: {},
      timeline: this.generateImplementationTimeline(strategy)
    };

    // Generate specific implementation details based on strategy type
    switch (strategy.type) {
      case 'economic_warfare':
        implementation.immediateActions = [
          'identify_economic_targets',
          'prepare_raid_forces',
          'gather_economic_intelligence'
        ];
        implementation.resourceAllocations = {
          military: 0.4,
          intelligence: 0.2,
          mobility: 0.3,
          defense: 0.1
        };
        break;

      case 'defensive_attrition':
        implementation.immediateActions = [
          'strengthen_defensive_positions',
          'prepare_counter_attack_forces',
          'establish_early_warning_systems'
        ];
        implementation.resourceAllocations = {
          defense: 0.5,
          military: 0.3,
          intelligence: 0.1,
          economy: 0.1
        };
        break;

      case 'hit_and_run':
        implementation.immediateActions = [
          'train_mobile_units',
          'identify_vulnerable_targets',
          'establish_retreat_routes'
        ];
        implementation.resourceAllocations = {
          mobility: 0.4,
          military: 0.3,
          intelligence: 0.2,
          stealth: 0.1
        };
        break;

      case 'territorial_denial':
        implementation.immediateActions = [
          'identify_strategic_positions',
          'deploy_control_forces',
          'establish_forward_bases'
        ];
        implementation.resourceAllocations = {
          expansion: 0.4,
          military: 0.3,
          infrastructure: 0.2,
          defense: 0.1
        };
        break;

      case 'adaptive_chaos':
        implementation.immediateActions = [
          'prepare_multiple_unit_types',
          'establish_flexible_command_structure',
          'develop_misdirection_plans'
        ];
        implementation.resourceAllocations = {
          military: 0.3,
          intelligence: 0.2,
          flexibility: 0.3,
          deception: 0.2
        };
        break;

      default:
        // Generic implementation
        implementation.immediateActions = [
          'analyze_current_situation',
          'prepare_strategic_response',
          'monitor_player_reactions'
        ];
        implementation.resourceAllocations = {
          military: 0.4,
          economy: 0.3,
          intelligence: 0.2,
          infrastructure: 0.1
        };
    }

    // Apply behavior modifications to colony
    implementation.behaviorModifications = this.generateBehaviorModifications(strategy);

    return implementation;
  }

  /**
   * Generate implementation timeline
   */
  generateImplementationTimeline(strategy) {
    const timeline = {
      immediate: { duration: '0-5 minutes', actions: [] },
      short_term: { duration: '5-15 minutes', actions: [] },
      medium_term: { duration: '15-45 minutes', actions: [] },
      long_term: { duration: '45+ minutes', actions: [] }
    };

    // Populate timeline based on strategy
    timeline.immediate.actions = ['begin_strategy_implementation', 'initial_resource_allocation'];
    timeline.short_term.actions = ['deploy_tactical_changes', 'monitor_player_response'];
    timeline.medium_term.actions = ['evaluate_strategy_effectiveness', 'adjust_approach'];
    timeline.long_term.actions = ['assess_strategic_outcome', 'plan_next_adaptation'];

    return timeline;
  }

  /**
   * Generate behavior modifications for colony
   */
  generateBehaviorModifications(strategy) {
    const modifications = {
      aggressionLevel: 0,
      defensivePosture: 0,
      economicFocus: 0,
      expansionDrive: 0,
      riskTolerance: 0,
      adaptationRate: 0
    };

    switch (strategy.type) {
      case 'economic_warfare':
        modifications.aggressionLevel = 0.3;
        modifications.economicFocus = -0.2;
        modifications.riskTolerance = 0.2;
        break;
      case 'defensive_attrition':
        modifications.defensivePosture = 0.4;
        modifications.aggressionLevel = -0.2;
        modifications.riskTolerance = -0.3;
        break;
      case 'hit_and_run':
        modifications.aggressionLevel = 0.2;
        modifications.riskTolerance = 0.3;
        modifications.adaptationRate = 0.2;
        break;
      case 'territorial_denial':
        modifications.expansionDrive = 0.3;
        modifications.aggressionLevel = 0.1;
        modifications.defensivePosture = 0.2;
        break;
      case 'adaptive_chaos':
        modifications.adaptationRate = 0.5;
        modifications.riskTolerance = 0.2;
        break;
    }

    return modifications;
  }

  /**
   * Record counter-strategy application for learning
   */
  recordCounterApplication(colonyData, strategy, implementation) {
    colonyData.appliedStrategies.push({
      timestamp: new Date(),
      strategy: strategy,
      implementation: implementation,
      effectiveness: null, // To be filled later
      outcome: 'pending'
    });

    // Limit history size
    if (colonyData.appliedStrategies.length > 20) {
      colonyData.appliedStrategies.shift();
    }
  }

  /**
   * Update strategy effectiveness based on outcomes
   */
  updateStrategyEffectiveness(colonyId, strategyId, effectiveness, outcome) {
    const colonyData = this.strategyDatabase.get(colonyId);
    if (!colonyData) return;

    // Find and update the strategy
    const strategy = colonyData.appliedStrategies.find(s => s.strategyId === strategyId);
    if (strategy) {
      strategy.effectiveness = effectiveness;
      strategy.outcome = outcome;

      // Move to success or failure list
      if (effectiveness > 0.6) {
        colonyData.successfulCounters.push(strategy);
      } else if (effectiveness < 0.4) {
        colonyData.failedCounters.push(strategy);
      }

      // Update learning rate
      colonyData.learningRate = Math.min(0.3, colonyData.learningRate + 0.01);
    }
  }

  /**
   * Get counter-strategy analysis for a colony
   */
  getCounterStrategyAnalysis(colonyId) {
    const colonyData = this.strategyDatabase.get(colonyId);
    if (!colonyData) return null;

    return {
      colonyId: colonyId,
      totalStrategiesApplied: colonyData.appliedStrategies.length,
      successfulStrategies: colonyData.successfulCounters.length,
      failedStrategies: colonyData.failedCounters.length,
      successRate: colonyData.appliedStrategies.length > 0 ? 
        colonyData.successfulCounters.length / colonyData.appliedStrategies.length : 0,
      learningRate: colonyData.learningRate,
      specialization: colonyData.specialization,
      recentStrategies: colonyData.appliedStrategies.slice(-5),
      mostEffectiveStrategies: colonyData.successfulCounters
        .sort((a, b) => b.effectiveness - a.effectiveness)
        .slice(0, 3)
    };
  }
}

module.exports = CounterStrategies; 
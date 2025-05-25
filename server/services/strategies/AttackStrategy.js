/**
 * AttackStrategy class for AI colony offensive operations
 * Implements intelligent attack planning with target selection and force calculation
 */

const { PERSONALITY_TRAITS } = require('../../models/AIColony');

class AttackStrategy {
  constructor() {
    this.attackTypes = ['raid', 'siege', 'blitz', 'harassment', 'conquest'];
    this.unitRoles = ['assault', 'support', 'siege', 'scout', 'reserve'];
    this.targetPriorities = new Map();
    
    this.initializeAttackData();
  }

  /**
   * Initialize attack strategy data
   */
  initializeAttackData() {
    // Target priority weights
    this.targetPriorities.set('weak_colony', 1.0);
    this.targetPriorities.set('resource_rich', 0.9);
    this.targetPriorities.set('strategic_position', 0.8);
    this.targetPriorities.set('isolated_colony', 0.7);
    this.targetPriorities.set('rival_colony', 0.6);
  }

  /**
   * Determine optimal attack strategy for a colony
   */
  determineAttackStrategy(colony, gameState = {}) {
    const strategy = {
      attackType: null,
      targetColony: null,
      forceComposition: {},
      attackPlan: {},
      timeline: {},
      reasoning: []
    };

    // Find potential targets
    const potentialTargets = this.identifyPotentialTargets(colony, gameState);
    
    if (potentialTargets.length === 0) {
      strategy.reasoning.push('No suitable targets identified for attack');
      return strategy;
    }

    // Select best target
    strategy.targetColony = this.selectBestTarget(colony, potentialTargets);
    
    // Determine attack type
    strategy.attackType = this.determineAttackType(colony, strategy.targetColony);
    
    // Plan force composition
    strategy.forceComposition = this.planForceComposition(colony, strategy.targetColony, strategy.attackType);
    
    // Create attack plan
    strategy.attackPlan = this.createAttackPlan(colony, strategy.targetColony, strategy.attackType);
    
    // Plan timeline
    strategy.timeline = this.planAttackTimeline(colony, strategy);
    
    // Generate reasoning
    strategy.reasoning = this.generateAttackReasoning(colony, strategy);
    
    return strategy;
  }

  /**
   * Identify potential attack targets
   */
  identifyPotentialTargets(colony, gameState) {
    const targets = [];
    
    // Mock target identification - in real implementation, this would query game state
    const mockTargets = [
      {
        id: 'enemy_1',
        name: 'Rival Colony Alpha',
        distance: 15,
        population: 45,
        military_strength: 0.3,
        resources: { food: 120, wood: 80, stone: 60 },
        defenses: 0.4,
        threat_level: 0.2,
        coordinates: { x: colony.base_x + 10, y: colony.base_y + 5 }
      },
      {
        id: 'enemy_2',
        name: 'Fortress Colony Beta',
        distance: 25,
        population: 80,
        military_strength: 0.7,
        resources: { food: 200, wood: 150, stone: 180 },
        defenses: 0.8,
        threat_level: 0.6,
        coordinates: { x: colony.base_x - 15, y: colony.base_y + 12 }
      },
      {
        id: 'enemy_3',
        name: 'Weak Outpost Gamma',
        distance: 8,
        population: 25,
        military_strength: 0.1,
        resources: { food: 60, wood: 40, stone: 20 },
        defenses: 0.2,
        threat_level: 0.1,
        coordinates: { x: colony.base_x + 5, y: colony.base_y - 8 }
      }
    ];

    // Filter targets based on colony capabilities and personality
    for (const target of mockTargets) {
      const viability = this.assessTargetViability(colony, target);
      if (viability.viable) {
        targets.push({
          ...target,
          viability: viability
        });
      }
    }

    return targets;
  }

  /**
   * Assess if a target is viable for attack
   */
  assessTargetViability(colony, target) {
    const assessment = {
      viable: false,
      score: 0,
      factors: {},
      risks: [],
      benefits: []
    };

    // Distance factor (closer is better, but not too close)
    const distanceFactor = target.distance > 5 && target.distance < 30 ? 
      Math.max(0, 1 - (target.distance / 30)) : 0.2;
    assessment.factors.distance = distanceFactor;

    // Strength comparison
    const ourStrength = colony.population * (colony.military_focus || 0.3);
    const theirStrength = target.population * target.military_strength;
    const strengthRatio = ourStrength / (theirStrength + 1);
    assessment.factors.strength_ratio = Math.min(2.0, strengthRatio);

    // Resource potential
    const resourceValue = Object.values(target.resources).reduce((sum, val) => sum + val, 0);
    const resourceFactor = Math.min(1.0, resourceValue / 500);
    assessment.factors.resource_potential = resourceFactor;

    // Defense assessment
    const defenseFactor = Math.max(0.1, 1 - target.defenses);
    assessment.factors.defense_weakness = defenseFactor;

    // Calculate overall score
    assessment.score = (
      assessment.factors.distance * 0.2 +
      assessment.factors.strength_ratio * 0.4 +
      assessment.factors.resource_potential * 0.2 +
      assessment.factors.defense_weakness * 0.2
    );

    // Apply personality modifiers
    assessment.score *= this.getPersonalityAttackModifier(colony.personality, target);

    // Determine viability
    assessment.viable = assessment.score > 0.5;

    // Identify risks and benefits
    if (strengthRatio < 1.2) {
      assessment.risks.push('Insufficient military advantage');
    }
    if (target.distance > 20) {
      assessment.risks.push('Long supply lines');
    }
    if (target.defenses > 0.6) {
      assessment.risks.push('Strong enemy defenses');
    }

    if (resourceValue > 300) {
      assessment.benefits.push('Rich resource target');
    }
    if (target.military_strength < 0.3) {
      assessment.benefits.push('Weak military opposition');
    }
    if (target.distance < 15) {
      assessment.benefits.push('Close proximity for quick strikes');
    }

    return assessment;
  }

  /**
   * Get personality-based attack modifier
   */
  getPersonalityAttackModifier(personality, target) {
    switch (personality) {
      case PERSONALITY_TRAITS.AGGRESSIVE:
        return 1.3; // Always more likely to attack
      case PERSONALITY_TRAITS.MILITANT:
        return target.military_strength > 0.5 ? 1.4 : 1.1; // Prefers challenging targets
      case PERSONALITY_TRAITS.OPPORTUNIST:
        return target.defenses < 0.4 ? 1.3 : 0.8; // Prefers easy targets
      case PERSONALITY_TRAITS.EXPANSIONIST:
        return target.distance < 20 ? 1.2 : 0.9; // Prefers nearby expansion
      case PERSONALITY_TRAITS.DEFENSIVE:
        return 0.7; // Less likely to attack
      case PERSONALITY_TRAITS.BUILDER:
        return 0.8; // Prefers building over attacking
      default:
        return 1.0;
    }
  }

  /**
   * Select the best target from available options
   */
  selectBestTarget(colony, targets) {
    if (targets.length === 0) return null;

    // Sort targets by viability score
    const sortedTargets = targets.sort((a, b) => b.viability.score - a.viability.score);
    
    // Apply some randomness to prevent predictability
    const topTargets = sortedTargets.slice(0, Math.min(3, sortedTargets.length));
    const randomIndex = Math.floor(Math.random() * topTargets.length);
    
    return topTargets[randomIndex];
  }

  /**
   * Determine the type of attack to use
   */
  determineAttackType(colony, target) {
    const ourStrength = colony.population * (colony.military_focus || 0.3);
    const theirStrength = target.population * target.military_strength;
    const strengthRatio = ourStrength / (theirStrength + 1);

    // Consider distance, strength, and defenses
    if (target.defenses > 0.7) {
      return 'siege'; // Strong defenses require siege
    } else if (strengthRatio > 2.0 && target.distance < 15) {
      return 'blitz'; // Quick overwhelming attack
    } else if (strengthRatio < 1.5) {
      return 'harassment'; // Guerrilla tactics
    } else if (target.distance > 20) {
      return 'raid'; // Hit and run
    } else {
      return 'conquest'; // Standard conquest
    }
  }

  /**
   * Plan force composition for the attack
   */
  planForceComposition(colony, target, attackType) {
    const composition = {
      assault_units: 0,
      support_units: 0,
      siege_units: 0,
      scout_units: 0,
      reserve_units: 0,
      total_units: 0
    };

    const availableForces = Math.floor(colony.population * (colony.military_focus || 0.3) * 0.8); // 80% of military
    
    switch (attackType) {
      case 'blitz':
        composition.assault_units = Math.floor(availableForces * 0.6);
        composition.support_units = Math.floor(availableForces * 0.2);
        composition.scout_units = Math.floor(availableForces * 0.1);
        composition.reserve_units = Math.floor(availableForces * 0.1);
        break;
        
      case 'siege':
        composition.assault_units = Math.floor(availableForces * 0.3);
        composition.siege_units = Math.floor(availableForces * 0.4);
        composition.support_units = Math.floor(availableForces * 0.2);
        composition.reserve_units = Math.floor(availableForces * 0.1);
        break;
        
      case 'raid':
        composition.assault_units = Math.floor(availableForces * 0.4);
        composition.scout_units = Math.floor(availableForces * 0.3);
        composition.support_units = Math.floor(availableForces * 0.2);
        composition.reserve_units = Math.floor(availableForces * 0.1);
        break;
        
      case 'harassment':
        composition.assault_units = Math.floor(availableForces * 0.3);
        composition.scout_units = Math.floor(availableForces * 0.4);
        composition.support_units = Math.floor(availableForces * 0.2);
        composition.reserve_units = Math.floor(availableForces * 0.1);
        break;
        
      case 'conquest':
        composition.assault_units = Math.floor(availableForces * 0.4);
        composition.support_units = Math.floor(availableForces * 0.3);
        composition.siege_units = Math.floor(availableForces * 0.1);
        composition.scout_units = Math.floor(availableForces * 0.1);
        composition.reserve_units = Math.floor(availableForces * 0.1);
        break;
    }

    composition.total_units = Object.values(composition).reduce((sum, count) => sum + count, 0);
    
    return composition;
  }

  /**
   * Create detailed attack plan
   */
  createAttackPlan(colony, target, attackType) {
    const plan = {
      phases: [],
      objectives: [],
      contingencies: [],
      supply_requirements: {},
      success_criteria: {}
    };

    // Define phases based on attack type
    switch (attackType) {
      case 'blitz':
        plan.phases = [
          { name: 'reconnaissance', duration: 1, description: 'Scout enemy positions' },
          { name: 'approach', duration: 1, description: 'Move forces into position' },
          { name: 'assault', duration: 2, description: 'Overwhelming attack on all fronts' },
          { name: 'consolidation', duration: 1, description: 'Secure captured territory' }
        ];
        break;
        
      case 'siege':
        plan.phases = [
          { name: 'preparation', duration: 3, description: 'Build siege equipment and gather supplies' },
          { name: 'encirclement', duration: 2, description: 'Surround enemy colony' },
          { name: 'siege', duration: 5, description: 'Maintain siege pressure' },
          { name: 'assault', duration: 2, description: 'Final assault on weakened defenses' },
          { name: 'occupation', duration: 2, description: 'Occupy and secure territory' }
        ];
        break;
        
      case 'raid':
        plan.phases = [
          { name: 'infiltration', duration: 1, description: 'Sneak forces close to target' },
          { name: 'strike', duration: 1, description: 'Quick hit on key targets' },
          { name: 'extraction', duration: 1, description: 'Withdraw with captured resources' }
        ];
        break;
        
      case 'harassment':
        plan.phases = [
          { name: 'positioning', duration: 2, description: 'Position forces around enemy territory' },
          { name: 'harassment', duration: 4, description: 'Continuous small attacks and raids' },
          { name: 'exploitation', duration: 2, description: 'Exploit weakened enemy state' }
        ];
        break;
        
      case 'conquest':
        plan.phases = [
          { name: 'buildup', duration: 2, description: 'Gather forces and supplies' },
          { name: 'advance', duration: 2, description: 'Advance on enemy territory' },
          { name: 'battle', duration: 3, description: 'Main battle for control' },
          { name: 'cleanup', duration: 2, description: 'Eliminate remaining resistance' },
          { name: 'integration', duration: 3, description: 'Integrate captured territory' }
        ];
        break;
    }

    // Define objectives
    plan.objectives = [
      'Neutralize enemy military forces',
      'Capture key resource areas',
      'Minimize own casualties',
      'Secure strategic positions'
    ];

    if (attackType === 'raid') {
      plan.objectives = [
        'Capture valuable resources',
        'Disrupt enemy operations',
        'Avoid prolonged engagement',
        'Return safely to base'
      ];
    }

    // Define contingencies
    plan.contingencies = [
      { trigger: 'Heavy casualties (>30%)', response: 'Tactical withdrawal' },
      { trigger: 'Enemy reinforcements', response: 'Accelerate timeline or retreat' },
      { trigger: 'Supply line disruption', response: 'Switch to raid tactics' },
      { trigger: 'Unexpected strong defenses', response: 'Adapt to siege tactics' }
    ];

    // Calculate supply requirements
    plan.supply_requirements = {
      food: plan.phases.reduce((sum, phase) => sum + phase.duration, 0) * 20,
      weapons: Math.floor(target.population * 0.5),
      siege_equipment: attackType === 'siege' ? 5 : 0,
      medical_supplies: 10
    };

    // Define success criteria
    plan.success_criteria = {
      primary: attackType === 'raid' ? 'Capture 50+ resources' : 'Defeat enemy colony',
      secondary: 'Maintain <25% casualty rate',
      tertiary: 'Complete within planned timeline'
    };

    return plan;
  }

  /**
   * Plan attack timeline
   */
  planAttackTimeline(colony, strategy) {
    const timeline = {
      preparation_time: 0,
      travel_time: 0,
      attack_duration: 0,
      total_time: 0,
      milestones: []
    };

    // Calculate preparation time based on attack type
    switch (strategy.attackType) {
      case 'blitz':
        timeline.preparation_time = 2;
        break;
      case 'siege':
        timeline.preparation_time = 5;
        break;
      case 'raid':
        timeline.preparation_time = 1;
        break;
      case 'harassment':
        timeline.preparation_time = 3;
        break;
      case 'conquest':
        timeline.preparation_time = 4;
        break;
    }

    // Calculate travel time based on distance
    timeline.travel_time = Math.ceil(strategy.targetColony.distance / 5);

    // Calculate attack duration from plan phases
    timeline.attack_duration = strategy.attackPlan.phases.reduce((sum, phase) => sum + phase.duration, 0);

    timeline.total_time = timeline.preparation_time + timeline.travel_time + timeline.attack_duration;

    // Create milestones
    let currentTime = 0;
    
    timeline.milestones.push({
      time: currentTime,
      event: 'Attack planning initiated',
      phase: 'planning'
    });

    currentTime += timeline.preparation_time;
    timeline.milestones.push({
      time: currentTime,
      event: 'Forces prepared and ready to move',
      phase: 'preparation'
    });

    currentTime += timeline.travel_time;
    timeline.milestones.push({
      time: currentTime,
      event: 'Forces arrive at target location',
      phase: 'deployment'
    });

    // Add phase milestones
    for (const phase of strategy.attackPlan.phases) {
      currentTime += phase.duration;
      timeline.milestones.push({
        time: currentTime,
        event: `${phase.name} phase completed`,
        phase: phase.name
      });
    }

    return timeline;
  }

  /**
   * Generate attack strategy reasoning
   */
  generateAttackReasoning(colony, strategy) {
    const reasoning = [];

    if (!strategy.targetColony) {
      reasoning.push('No suitable targets available for attack');
      return reasoning;
    }

    // Target selection reasoning
    reasoning.push(`Selected ${strategy.targetColony.name} as primary target`);
    reasoning.push(`Target viability score: ${strategy.targetColony.viability.score.toFixed(2)}`);

    // Attack type reasoning
    reasoning.push(`Chose ${strategy.attackType} attack based on target characteristics`);

    // Strength analysis
    const ourStrength = colony.population * (colony.military_focus || 0.3);
    const theirStrength = strategy.targetColony.population * strategy.targetColony.military_strength;
    reasoning.push(`Force ratio: ${(ourStrength / theirStrength).toFixed(2)}:1 in our favor`);

    // Distance considerations
    reasoning.push(`Target distance: ${strategy.targetColony.distance} units (${strategy.targetColony.distance < 15 ? 'close' : 'distant'})`);

    // Resource motivation
    const targetResources = Object.values(strategy.targetColony.resources).reduce((sum, val) => sum + val, 0);
    if (targetResources > 200) {
      reasoning.push(`High resource value target (${targetResources} total resources)`);
    }

    // Personality influence
    if (colony.personality === PERSONALITY_TRAITS.AGGRESSIVE) {
      reasoning.push('Aggressive personality favors offensive action');
    } else if (colony.personality === PERSONALITY_TRAITS.OPPORTUNIST) {
      reasoning.push('Opportunistic personality seeks advantageous targets');
    }

    // Risk assessment
    if (strategy.targetColony.viability.risks.length > 0) {
      reasoning.push(`Identified risks: ${strategy.targetColony.viability.risks.join(', ')}`);
    }

    // Timeline considerations
    reasoning.push(`Estimated campaign duration: ${strategy.timeline.total_time} time units`);

    return reasoning;
  }

  /**
   * Evaluate attack success probability
   */
  evaluateAttackSuccess(colony, strategy) {
    const evaluation = {
      success_probability: 0,
      factors: {},
      critical_risks: [],
      success_factors: []
    };

    if (!strategy.targetColony) {
      evaluation.success_probability = 0;
      evaluation.critical_risks.push('No target selected');
      return evaluation;
    }

    // Military strength factor
    const ourStrength = colony.population * (colony.military_focus || 0.3);
    const theirStrength = strategy.targetColony.population * strategy.targetColony.military_strength;
    const strengthFactor = Math.min(1.0, ourStrength / (theirStrength + 1));
    evaluation.factors.military_strength = strengthFactor;

    // Resource sustainability factor
    const supplyRequirements = strategy.attackPlan.supply_requirements;
    const foodRatio = colony.food_storage / (supplyRequirements.food || 1);
    const resourceFactor = Math.min(1.0, foodRatio);
    evaluation.factors.resource_sustainability = resourceFactor;

    // Distance factor
    const distanceFactor = Math.max(0.3, 1 - (strategy.targetColony.distance / 40));
    evaluation.factors.distance = distanceFactor;

    // Defense penetration factor
    const defenseFactor = Math.max(0.2, 1 - strategy.targetColony.defenses);
    evaluation.factors.defense_penetration = defenseFactor;

    // Calculate overall probability
    evaluation.success_probability = (
      evaluation.factors.military_strength * 0.4 +
      evaluation.factors.resource_sustainability * 0.2 +
      evaluation.factors.distance * 0.2 +
      evaluation.factors.defense_penetration * 0.2
    );

    // Identify critical risks
    if (strengthFactor < 0.8) {
      evaluation.critical_risks.push('Insufficient military advantage');
    }
    if (resourceFactor < 0.5) {
      evaluation.critical_risks.push('Inadequate supply reserves');
    }
    if (strategy.targetColony.distance > 25) {
      evaluation.critical_risks.push('Extended supply lines vulnerable to disruption');
    }

    // Identify success factors
    if (strengthFactor > 1.5) {
      evaluation.success_factors.push('Overwhelming military superiority');
    }
    if (strategy.targetColony.defenses < 0.3) {
      evaluation.success_factors.push('Weak enemy defenses');
    }
    if (strategy.targetColony.distance < 15) {
      evaluation.success_factors.push('Short supply lines and quick reinforcement');
    }

    return evaluation;
  }
}

module.exports = AttackStrategy; 
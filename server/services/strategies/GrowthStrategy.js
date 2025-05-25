/**
 * GrowthStrategy class for AI colony expansion and development
 * Implements intelligent growth priority logic balancing expansion vs. military development
 */

const { PERSONALITY_TRAITS } = require('../../constants/AI');

class GrowthStrategy {
  constructor() {
    this.growthTypes = ['population', 'territory', 'military', 'infrastructure', 'technology'];
    this.developmentPhases = ['early', 'expansion', 'consolidation', 'dominance'];
    this.priorityWeights = new Map();
    
    this.initializeGrowthData();
  }

  /**
   * Initialize growth strategy data
   */
  initializeGrowthData() {
    // Base priority weights for different growth types
    this.priorityWeights.set('population', 1.0);
    this.priorityWeights.set('territory', 0.8);
    this.priorityWeights.set('military', 0.7);
    this.priorityWeights.set('infrastructure', 0.9);
    this.priorityWeights.set('technology', 0.6);
  }

  /**
   * Determine optimal growth strategy for a colony
   */
  determineGrowthStrategy(colony, gameState = {}) {
    const strategy = {
      developmentPhase: null,
      primaryFocus: null,
      secondaryFocus: null,
      growthPlan: {},
      resourceAllocation: {},
      milestones: [],
      reasoning: []
    };

    // Determine current development phase
    strategy.developmentPhase = this.determineDevelopmentPhase(colony);
    
    // Calculate growth priorities
    const growthPriorities = this.calculateGrowthPriorities(colony, strategy.developmentPhase);
    
    // Determine primary and secondary focus
    const sortedPriorities = Object.entries(growthPriorities)
      .sort(([,a], [,b]) => b - a);
    
    strategy.primaryFocus = sortedPriorities[0][0];
    strategy.secondaryFocus = sortedPriorities[1][0];
    
    // Create detailed growth plan
    strategy.growthPlan = this.createGrowthPlan(colony, strategy.developmentPhase, growthPriorities);
    
    // Plan resource allocation
    strategy.resourceAllocation = this.planResourceAllocation(colony, strategy.growthPlan);
    
    // Set growth milestones
    strategy.milestones = this.setGrowthMilestones(colony, strategy);
    
    // Generate reasoning
    strategy.reasoning = this.generateGrowthReasoning(colony, strategy);
    
    return strategy;
  }

  /**
   * Determine current development phase
   */
  determineDevelopmentPhase(colony) {
    const population = colony.population;
    const territorySize = colony.territory_size;
    const totalTicks = colony.total_ticks || 0;
    
    // Early phase: Small colony just starting
    if (population < 40 || territorySize < 4 || totalTicks < 50) {
      return 'early';
    }
    
    // Expansion phase: Growing and expanding
    if (population < 80 || territorySize < 8 || totalTicks < 200) {
      return 'expansion';
    }
    
    // Consolidation phase: Strengthening position
    if (population < 150 || territorySize < 15 || totalTicks < 500) {
      return 'consolidation';
    }
    
    // Dominance phase: Major power
    return 'dominance';
  }

  /**
   * Calculate growth priorities based on current state and phase
   */
  calculateGrowthPriorities(colony, phase) {
    const priorities = {};
    
    // Base priorities by development phase
    const phasePriorities = {
      early: {
        population: 1.0,
        infrastructure: 0.9,
        territory: 0.6,
        military: 0.4,
        technology: 0.3
      },
      expansion: {
        territory: 1.0,
        population: 0.8,
        infrastructure: 0.7,
        military: 0.6,
        technology: 0.5
      },
      consolidation: {
        military: 1.0,
        infrastructure: 0.9,
        population: 0.7,
        territory: 0.6,
        technology: 0.8
      },
      dominance: {
        technology: 1.0,
        military: 0.9,
        territory: 0.8,
        infrastructure: 0.7,
        population: 0.5
      }
    };

    // Start with phase-based priorities
    Object.assign(priorities, phasePriorities[phase]);

    // Apply personality modifiers
    const personalityModifiers = this.getPersonalityGrowthModifiers(colony.personality);
    for (const [type, modifier] of Object.entries(personalityModifiers)) {
      priorities[type] = (priorities[type] || 0.5) * modifier;
    }

    // Apply situational modifiers
    priorities = this.applySituationalModifiers(colony, priorities);

    return priorities;
  }

  /**
   * Get personality-based growth modifiers
   */
  getPersonalityGrowthModifiers(personality) {
    const modifiers = {
      [PERSONALITY_TRAITS.AGGRESSIVE]: {
        military: 1.4,
        territory: 1.2,
        population: 1.1,
        infrastructure: 0.8,
        technology: 0.9
      },
      [PERSONALITY_TRAITS.DEFENSIVE]: {
        infrastructure: 1.4,
        military: 1.2,
        population: 1.1,
        territory: 0.8,
        technology: 0.9
      },
      [PERSONALITY_TRAITS.EXPANSIONIST]: {
        territory: 1.4,
        population: 1.3,
        infrastructure: 1.1,
        military: 0.9,
        technology: 0.8
      },
      [PERSONALITY_TRAITS.BUILDER]: {
        infrastructure: 1.4,
        technology: 1.3,
        population: 1.1,
        military: 0.7,
        territory: 1.0
      },
      [PERSONALITY_TRAITS.MILITANT]: {
        military: 1.4,
        technology: 1.2,
        population: 1.0,
        infrastructure: 0.9,
        territory: 0.8
      },
      [PERSONALITY_TRAITS.OPPORTUNIST]: {
        population: 1.1,
        territory: 1.1,
        military: 1.0,
        infrastructure: 1.0,
        technology: 1.0
      }
    };

    return modifiers[personality] || modifiers[PERSONALITY_TRAITS.OPPORTUNIST];
  }

  /**
   * Apply situational modifiers to growth priorities
   */
  applySituationalModifiers(colony, priorities) {
    const modified = { ...priorities };

    // Threat level modifiers
    if (colony.threat_level > 0.7) {
      modified.military *= 1.5;
      modified.infrastructure *= 1.3;
      modified.territory *= 0.7;
      modified.population *= 0.8;
    } else if (colony.threat_level < 0.3) {
      modified.territory *= 1.3;
      modified.population *= 1.2;
      modified.technology *= 1.2;
      modified.military *= 0.8;
    }

    // Resource constraints
    if (colony.food_storage < 100) {
      modified.population *= 0.7;
      modified.territory *= 0.8;
    }

    // Population pressure
    if (colony.population > colony.max_population * 0.9) {
      modified.infrastructure *= 1.4;
      modified.territory *= 1.3;
      modified.population *= 0.6;
    }

    // Territory saturation
    if (colony.territory_size > 12) {
      modified.infrastructure *= 1.3;
      modified.military *= 1.2;
      modified.technology *= 1.2;
      modified.territory *= 0.6;
    }

    return modified;
  }

  /**
   * Create detailed growth plan
   */
  createGrowthPlan(colony, phase, priorities) {
    const plan = {
      population_growth: {},
      territory_expansion: {},
      military_development: {},
      infrastructure_projects: {},
      technology_research: {}
    };

    // Population growth plan
    plan.population_growth = this.planPopulationGrowth(colony, priorities.population);
    
    // Territory expansion plan
    plan.territory_expansion = this.planTerritoryExpansion(colony, priorities.territory);
    
    // Military development plan
    plan.military_development = this.planMilitaryDevelopment(colony, priorities.military);
    
    // Infrastructure projects plan
    plan.infrastructure_projects = this.planInfrastructureProjects(colony, priorities.infrastructure);
    
    // Technology research plan
    plan.technology_research = this.planTechnologyResearch(colony, priorities.technology);

    return plan;
  }

  /**
   * Plan population growth
   */
  planPopulationGrowth(colony, priority) {
    const plan = {
      target_population: 0,
      growth_rate: 0,
      housing_needed: 0,
      food_requirements: 0,
      timeline: 0
    };

    if (priority < 0.5) {
      plan.target_population = colony.population + Math.floor(colony.population * 0.1);
      plan.growth_rate = 0.05;
    } else if (priority < 0.8) {
      plan.target_population = colony.population + Math.floor(colony.population * 0.3);
      plan.growth_rate = 0.1;
    } else {
      plan.target_population = Math.min(colony.max_population, colony.population + Math.floor(colony.population * 0.5));
      plan.growth_rate = 0.15;
    }

    plan.housing_needed = Math.max(0, plan.target_population - colony.max_population);
    plan.food_requirements = (plan.target_population - colony.population) * 2;
    plan.timeline = Math.ceil((plan.target_population - colony.population) / (colony.population * plan.growth_rate));

    return plan;
  }

  /**
   * Plan territory expansion
   */
  planTerritoryExpansion(colony, priority) {
    const plan = {
      target_size: 0,
      expansion_directions: [],
      outposts_needed: 0,
      resource_cost: {},
      timeline: 0
    };

    const currentSize = colony.territory_size;
    
    if (priority < 0.5) {
      plan.target_size = currentSize + 1;
    } else if (priority < 0.8) {
      plan.target_size = currentSize + Math.ceil(currentSize * 0.3);
    } else {
      plan.target_size = currentSize + Math.ceil(currentSize * 0.5);
    }

    // Determine expansion directions (mock implementation)
    const directions = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
    const numDirections = Math.min(4, Math.ceil((plan.target_size - currentSize) / 2));
    plan.expansion_directions = directions.slice(0, numDirections);

    plan.outposts_needed = Math.ceil((plan.target_size - currentSize) / 3);
    plan.resource_cost = {
      wood: plan.outposts_needed * 50,
      stone: plan.outposts_needed * 30,
      food: (plan.target_size - currentSize) * 20
    };
    plan.timeline = Math.ceil((plan.target_size - currentSize) * 2);

    return plan;
  }

  /**
   * Plan military development
   */
  planMilitaryDevelopment(colony, priority) {
    const plan = {
      target_military_size: 0,
      unit_composition: {},
      training_facilities: 0,
      equipment_needed: {},
      timeline: 0
    };

    const currentMilitary = Math.floor(colony.population * (colony.military_focus || 0.3));
    
    if (priority < 0.5) {
      plan.target_military_size = Math.floor(colony.population * 0.2);
    } else if (priority < 0.8) {
      plan.target_military_size = Math.floor(colony.population * 0.4);
    } else {
      plan.target_military_size = Math.floor(colony.population * 0.6);
    }

    // Unit composition based on personality and threat level
    if (colony.personality === PERSONALITY_TRAITS.DEFENSIVE) {
      plan.unit_composition = {
        guards: Math.floor(plan.target_military_size * 0.4),
        archers: Math.floor(plan.target_military_size * 0.3),
        soldiers: Math.floor(plan.target_military_size * 0.3)
      };
    } else if (colony.personality === PERSONALITY_TRAITS.AGGRESSIVE) {
      plan.unit_composition = {
        soldiers: Math.floor(plan.target_military_size * 0.5),
        cavalry: Math.floor(plan.target_military_size * 0.3),
        archers: Math.floor(plan.target_military_size * 0.2)
      };
    } else {
      plan.unit_composition = {
        soldiers: Math.floor(plan.target_military_size * 0.4),
        archers: Math.floor(plan.target_military_size * 0.3),
        guards: Math.floor(plan.target_military_size * 0.3)
      };
    }

    plan.training_facilities = Math.ceil(plan.target_military_size / 20);
    plan.equipment_needed = {
      weapons: plan.target_military_size - currentMilitary,
      armor: Math.floor((plan.target_military_size - currentMilitary) * 0.8),
      supplies: (plan.target_military_size - currentMilitary) * 5
    };
    plan.timeline = Math.ceil((plan.target_military_size - currentMilitary) / 5);

    return plan;
  }

  /**
   * Plan infrastructure projects
   */
  planInfrastructureProjects(colony, priority) {
    const plan = {
      housing_projects: 0,
      storage_facilities: 0,
      production_buildings: 0,
      defensive_structures: 0,
      resource_cost: {},
      timeline: 0
    };

    if (priority < 0.5) {
      plan.housing_projects = 1;
      plan.storage_facilities = 1;
      plan.production_buildings = 1;
    } else if (priority < 0.8) {
      plan.housing_projects = 2;
      plan.storage_facilities = 2;
      plan.production_buildings = 2;
      plan.defensive_structures = 1;
    } else {
      plan.housing_projects = 3;
      plan.storage_facilities = 3;
      plan.production_buildings = 3;
      plan.defensive_structures = 2;
    }

    plan.resource_cost = {
      wood: (plan.housing_projects * 80) + (plan.production_buildings * 60),
      stone: (plan.storage_facilities * 100) + (plan.defensive_structures * 120),
      labor: (plan.housing_projects + plan.storage_facilities + plan.production_buildings + plan.defensive_structures) * 15
    };
    plan.timeline = Math.ceil((plan.housing_projects + plan.storage_facilities + plan.production_buildings + plan.defensive_structures) * 3);

    return plan;
  }

  /**
   * Plan technology research
   */
  planTechnologyResearch(colony, priority) {
    const plan = {
      research_projects: [],
      research_facilities: 0,
      specialists_needed: 0,
      resource_investment: {},
      timeline: 0
    };

    const availableProjects = [
      'improved_agriculture',
      'advanced_construction',
      'military_tactics',
      'resource_efficiency',
      'defensive_engineering',
      'logistics_optimization'
    ];

    if (priority < 0.5) {
      plan.research_projects = availableProjects.slice(0, 1);
      plan.research_facilities = 1;
    } else if (priority < 0.8) {
      plan.research_projects = availableProjects.slice(0, 2);
      plan.research_facilities = 1;
    } else {
      plan.research_projects = availableProjects.slice(0, 3);
      plan.research_facilities = 2;
    }

    plan.specialists_needed = plan.research_projects.length * 3;
    plan.resource_investment = {
      knowledge_points: plan.research_projects.length * 100,
      research_materials: plan.research_projects.length * 50,
      time_investment: plan.research_projects.length * 10
    };
    plan.timeline = plan.research_projects.length * 8;

    return plan;
  }

  /**
   * Plan resource allocation for growth strategy
   */
  planResourceAllocation(colony, growthPlan) {
    const allocation = {
      population_allocation: {},
      resource_distribution: {},
      priority_order: []
    };

    const totalPopulation = colony.population;
    const workingPopulation = Math.floor(totalPopulation * 0.7); // 70% work

    // Allocate population to different activities
    allocation.population_allocation = {
      resource_gathering: Math.floor(workingPopulation * 0.4),
      construction: Math.floor(workingPopulation * 0.2),
      military: Math.floor(workingPopulation * (colony.military_focus || 0.3)),
      research: Math.floor(workingPopulation * 0.1),
      administration: Math.floor(workingPopulation * 0.05)
    };

    // Calculate total resource needs
    const totalResourceNeeds = {
      food: 0,
      wood: 0,
      stone: 0,
      labor: 0
    };

    // Sum up resource needs from all growth plans
    for (const [planType, planData] of Object.entries(growthPlan)) {
      if (planData.resource_cost) {
        for (const [resource, amount] of Object.entries(planData.resource_cost)) {
          totalResourceNeeds[resource] = (totalResourceNeeds[resource] || 0) + amount;
        }
      }
      if (planData.food_requirements) {
        totalResourceNeeds.food += planData.food_requirements;
      }
    }

    // Distribute available resources
    const availableResources = {
      food: colony.food_storage || 0,
      wood: colony.wood_storage || 0,
      stone: colony.stone_storage || 0,
      labor: allocation.population_allocation.construction
    };

    allocation.resource_distribution = {};
    for (const [resource, needed] of Object.entries(totalResourceNeeds)) {
      const available = availableResources[resource] || 0;
      allocation.resource_distribution[resource] = {
        needed: needed,
        available: available,
        allocated: Math.min(needed, available),
        shortage: Math.max(0, needed - available)
      };
    }

    // Determine priority order based on shortages and importance
    allocation.priority_order = Object.entries(allocation.resource_distribution)
      .filter(([resource, data]) => data.shortage > 0)
      .sort(([,a], [,b]) => b.shortage - a.shortage)
      .map(([resource]) => resource);

    return allocation;
  }

  /**
   * Set growth milestones
   */
  setGrowthMilestones(colony, strategy) {
    const milestones = [];
    const currentTick = colony.total_ticks || 0;

    // Population milestones
    if (strategy.growthPlan.population_growth.target_population > colony.population) {
      milestones.push({
        type: 'population',
        target: strategy.growthPlan.population_growth.target_population,
        current: colony.population,
        estimated_completion: currentTick + strategy.growthPlan.population_growth.timeline,
        priority: 'high'
      });
    }

    // Territory milestones
    if (strategy.growthPlan.territory_expansion.target_size > colony.territory_size) {
      milestones.push({
        type: 'territory',
        target: strategy.growthPlan.territory_expansion.target_size,
        current: colony.territory_size,
        estimated_completion: currentTick + strategy.growthPlan.territory_expansion.timeline,
        priority: 'medium'
      });
    }

    // Military milestones
    const currentMilitary = Math.floor(colony.population * (colony.military_focus || 0.3));
    if (strategy.growthPlan.military_development.target_military_size > currentMilitary) {
      milestones.push({
        type: 'military',
        target: strategy.growthPlan.military_development.target_military_size,
        current: currentMilitary,
        estimated_completion: currentTick + strategy.growthPlan.military_development.timeline,
        priority: colony.threat_level > 0.5 ? 'high' : 'medium'
      });
    }

    // Infrastructure milestones
    const totalInfrastructure = Object.values(strategy.growthPlan.infrastructure_projects)
      .filter(val => typeof val === 'number')
      .reduce((sum, val) => sum + val, 0);
    
    if (totalInfrastructure > 0) {
      milestones.push({
        type: 'infrastructure',
        target: totalInfrastructure,
        current: 0, // Assume starting from 0 new projects
        estimated_completion: currentTick + strategy.growthPlan.infrastructure_projects.timeline,
        priority: 'medium'
      });
    }

    // Technology milestones
    if (strategy.growthPlan.technology_research.research_projects.length > 0) {
      milestones.push({
        type: 'technology',
        target: strategy.growthPlan.technology_research.research_projects.length,
        current: 0, // Assume starting from 0 completed projects
        estimated_completion: currentTick + strategy.growthPlan.technology_research.timeline,
        priority: 'low'
      });
    }

    // Sort by priority and estimated completion
    milestones.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.estimated_completion - b.estimated_completion;
    });

    return milestones;
  }

  /**
   * Generate growth strategy reasoning
   */
  generateGrowthReasoning(colony, strategy) {
    const reasoning = [];

    // Development phase reasoning
    reasoning.push(`Colony is in ${strategy.developmentPhase} development phase`);

    // Primary focus reasoning
    reasoning.push(`Primary growth focus: ${strategy.primaryFocus}`);
    reasoning.push(`Secondary growth focus: ${strategy.secondaryFocus}`);

    // Personality influence
    reasoning.push(`${colony.personality} personality influences growth priorities`);

    // Threat level considerations
    if (colony.threat_level > 0.5) {
      reasoning.push(`High threat level (${colony.threat_level.toFixed(2)}) prioritizes military and defensive growth`);
    } else if (colony.threat_level < 0.3) {
      reasoning.push(`Low threat level (${colony.threat_level.toFixed(2)}) allows focus on expansion and development`);
    }

    // Resource constraints
    const resourceShortages = Object.entries(strategy.resourceAllocation.resource_distribution)
      .filter(([resource, data]) => data.shortage > 0)
      .map(([resource]) => resource);
    
    if (resourceShortages.length > 0) {
      reasoning.push(`Resource shortages identified: ${resourceShortages.join(', ')}`);
    }

    // Population considerations
    if (colony.population < 50) {
      reasoning.push('Small population requires focus on growth and basic infrastructure');
    } else if (colony.population > 100) {
      reasoning.push('Large population enables diverse development strategies');
    }

    // Territory considerations
    if (colony.territory_size < 5) {
      reasoning.push('Limited territory constrains expansion options');
    } else if (colony.territory_size > 10) {
      reasoning.push('Large territory provides expansion opportunities but requires management');
    }

    // Timeline considerations
    const nearestMilestone = strategy.milestones[0];
    if (nearestMilestone) {
      reasoning.push(`Next milestone: ${nearestMilestone.type} target in ${nearestMilestone.estimated_completion - (colony.total_ticks || 0)} ticks`);
    }

    return reasoning;
  }

  /**
   * Evaluate growth strategy effectiveness
   */
  evaluateGrowthEffectiveness(colony, strategy) {
    const evaluation = {
      overall_score: 0,
      factors: {},
      bottlenecks: [],
      opportunities: []
    };

    // Resource availability factor
    const resourceAvailability = Object.values(strategy.resourceAllocation.resource_distribution)
      .map(data => data.allocated / (data.needed || 1))
      .reduce((sum, ratio) => sum + ratio, 0) / 5; // Average across 5 resource types
    evaluation.factors.resource_availability = Math.min(1.0, resourceAvailability);

    // Timeline feasibility factor
    const averageTimeline = strategy.milestones.length > 0 ?
      strategy.milestones.reduce((sum, milestone) => sum + (milestone.estimated_completion - (colony.total_ticks || 0)), 0) / strategy.milestones.length :
      10;
    evaluation.factors.timeline_feasibility = Math.max(0.2, Math.min(1.0, 20 / averageTimeline));

    // Balance factor (how well-balanced the growth strategy is)
    const priorities = [
      strategy.growthPlan.population_growth,
      strategy.growthPlan.territory_expansion,
      strategy.growthPlan.military_development,
      strategy.growthPlan.infrastructure_projects,
      strategy.growthPlan.technology_research
    ];
    const balanceScore = 1.0 - (Math.max(...priorities.map(p => Object.keys(p).length)) - Math.min(...priorities.map(p => Object.keys(p).length))) / 10;
    evaluation.factors.balance = Math.max(0.3, balanceScore);

    // Threat appropriateness factor
    const militaryPriority = strategy.primaryFocus === 'military' || strategy.secondaryFocus === 'military' ? 1.0 : 0.5;
    const threatAppropriate = colony.threat_level > 0.5 ? militaryPriority : (1.0 - militaryPriority * 0.5);
    evaluation.factors.threat_appropriateness = threatAppropriate;

    // Calculate overall score
    evaluation.overall_score = (
      evaluation.factors.resource_availability * 0.3 +
      evaluation.factors.timeline_feasibility * 0.25 +
      evaluation.factors.balance * 0.2 +
      evaluation.factors.threat_appropriateness * 0.25
    );

    // Identify bottlenecks
    if (evaluation.factors.resource_availability < 0.6) {
      evaluation.bottlenecks.push('Insufficient resources for planned growth');
    }
    if (evaluation.factors.timeline_feasibility < 0.5) {
      evaluation.bottlenecks.push('Overly ambitious timeline for growth targets');
    }
    if (colony.population > colony.max_population * 0.9) {
      evaluation.bottlenecks.push('Population approaching housing capacity');
    }

    // Identify opportunities
    if (colony.threat_level < 0.3 && strategy.primaryFocus !== 'territory') {
      evaluation.opportunities.push('Low threat environment suitable for territorial expansion');
    }
    if (colony.food_storage > 300 && strategy.primaryFocus !== 'population') {
      evaluation.opportunities.push('Abundant food reserves enable rapid population growth');
    }
    if (evaluation.factors.resource_availability > 0.8) {
      evaluation.opportunities.push('Strong resource position enables accelerated development');
    }

    return evaluation;
  }
}

module.exports = GrowthStrategy; 
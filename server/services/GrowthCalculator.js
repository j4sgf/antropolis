/**
 * GrowthCalculator class for AI colony time-based growth
 * Implements growth functions for resources, population, and territory expansion
 */

const { PERSONALITY_TRAITS } = require('../models/AIColony');

class GrowthCalculator {
  constructor() {
    this.baseGrowthRates = {
      population: 0.02,      // 2% per tick
      food: 0.05,           // 5% per tick
      wood: 0.03,           // 3% per tick
      stone: 0.02,          // 2% per tick
      minerals: 0.01,       // 1% per tick
      water: 0.04,          // 4% per tick
      territory: 0.001,     // 0.1% per tick
      military: 0.015       // 1.5% per tick
    };

    this.growthCaps = {
      population: 500,      // Maximum population
      territory: 25,        // Maximum territory size
      military_ratio: 0.8   // Maximum 80% military population
    };

    this.resourceEfficiencyFactors = {
      early: 0.8,          // 80% efficiency in early game
      expansion: 1.0,      // 100% efficiency in expansion
      consolidation: 1.2,  // 120% efficiency in consolidation
      dominance: 1.5       // 150% efficiency in dominance
    };
  }

  /**
   * Calculate growth for a colony over a time period
   */
  calculateGrowth(colony, timeDelta = 1, gameState = {}) {
    const growth = {
      population: 0,
      resources: {
        food: 0,
        wood: 0,
        stone: 0,
        minerals: 0,
        water: 0
      },
      territory: 0,
      military: 0,
      infrastructure: 0,
      factors: {},
      reasoning: []
    };

    // Get growth modifiers
    const modifiers = this.calculateGrowthModifiers(colony, gameState);
    growth.factors = modifiers;

    // Calculate population growth
    growth.population = this.calculatePopulationGrowth(colony, timeDelta, modifiers);

    // Calculate resource growth
    growth.resources = this.calculateResourceGrowth(colony, timeDelta, modifiers);

    // Calculate territory growth
    growth.territory = this.calculateTerritoryGrowth(colony, timeDelta, modifiers);

    // Calculate military growth
    growth.military = this.calculateMilitaryGrowth(colony, timeDelta, modifiers);

    // Calculate infrastructure growth
    growth.infrastructure = this.calculateInfrastructureGrowth(colony, timeDelta, modifiers);

    // Generate reasoning
    growth.reasoning = this.generateGrowthReasoning(colony, growth, modifiers);

    return growth;
  }

  /**
   * Calculate growth modifiers based on colony state and conditions
   */
  calculateGrowthModifiers(colony, gameState) {
    const modifiers = {
      personality: 1.0,
      difficulty: 1.0,
      threat: 1.0,
      resources: 1.0,
      phase: 1.0,
      efficiency: 1.0,
      overall: 1.0
    };

    // Personality modifiers
    modifiers.personality = this.getPersonalityGrowthModifier(colony.personality);

    // Difficulty modifiers
    modifiers.difficulty = this.getDifficultyModifier(colony.difficulty_level);

    // Threat level modifiers
    modifiers.threat = this.getThreatModifier(colony.threat_level);

    // Resource availability modifiers
    modifiers.resources = this.getResourceAvailabilityModifier(colony);

    // Development phase modifiers
    modifiers.phase = this.getPhaseModifier(colony);

    // Colony efficiency modifiers
    modifiers.efficiency = colony.resource_efficiency || 1.0;

    // Calculate overall modifier
    modifiers.overall = (
      modifiers.personality * 
      modifiers.difficulty * 
      modifiers.threat * 
      modifiers.resources * 
      modifiers.phase * 
      modifiers.efficiency
    );

    return modifiers;
  }

  /**
   * Get personality-based growth modifier
   */
  getPersonalityGrowthModifier(personality) {
    const modifiers = {
      [PERSONALITY_TRAITS.AGGRESSIVE]: 1.1,      // Faster growth for aggression
      [PERSONALITY_TRAITS.DEFENSIVE]: 0.9,       // Slower but steady growth
      [PERSONALITY_TRAITS.EXPANSIONIST]: 1.3,    // Much faster growth
      [PERSONALITY_TRAITS.BUILDER]: 1.2,         // Good growth for infrastructure
      [PERSONALITY_TRAITS.MILITANT]: 1.0,        // Balanced growth
      [PERSONALITY_TRAITS.OPPORTUNIST]: 1.1      // Slightly faster growth
    };

    return modifiers[personality] || 1.0;
  }

  /**
   * Get difficulty-based modifier
   */
  getDifficultyModifier(difficulty) {
    const modifiers = {
      'easy': 0.8,      // Slower AI growth on easy
      'medium': 1.0,    // Normal growth
      'hard': 1.3,      // Faster growth on hard
      'nightmare': 1.6  // Much faster growth on nightmare
    };

    return modifiers[difficulty] || 1.0;
  }

  /**
   * Get threat level modifier
   */
  getThreatModifier(threatLevel) {
    // Under threat, colonies focus on survival over growth
    if (threatLevel > 0.7) {
      return 0.7; // 30% reduction in growth
    } else if (threatLevel > 0.3) {
      return 0.9; // 10% reduction in growth
    } else {
      return 1.2; // 20% bonus when safe
    }
  }

  /**
   * Get resource availability modifier
   */
  getResourceAvailabilityModifier(colony) {
    const foodRatio = colony.food_storage / 200; // Optimal food level
    const resourceScore = Math.min(1.5, Math.max(0.5, foodRatio));
    return resourceScore;
  }

  /**
   * Get development phase modifier
   */
  getPhaseModifier(colony) {
    const population = colony.population;
    const territorySize = colony.territory_size;

    // Determine phase
    if (population < 40 || territorySize < 4) {
      return this.resourceEfficiencyFactors.early;
    } else if (population < 80 || territorySize < 8) {
      return this.resourceEfficiencyFactors.expansion;
    } else if (population < 150 || territorySize < 15) {
      return this.resourceEfficiencyFactors.consolidation;
    } else {
      return this.resourceEfficiencyFactors.dominance;
    }
  }

  /**
   * Calculate population growth
   */
  calculatePopulationGrowth(colony, timeDelta, modifiers) {
    const currentPop = colony.population;
    const maxPop = colony.max_population || this.growthCaps.population;
    
    // No growth if at capacity
    if (currentPop >= maxPop) {
      return 0;
    }

    // Base growth rate decreases as population approaches capacity
    const capacityFactor = 1 - (currentPop / maxPop);
    const baseGrowth = this.baseGrowthRates.population * capacityFactor;
    
    // Apply modifiers
    const modifiedGrowth = baseGrowth * modifiers.overall;
    
    // Calculate actual growth
    const growthAmount = Math.floor(currentPop * modifiedGrowth * timeDelta);
    
    // Ensure we don't exceed capacity
    return Math.min(growthAmount, maxPop - currentPop);
  }

  /**
   * Calculate resource growth
   */
  calculateResourceGrowth(colony, timeDelta, modifiers) {
    const resourceGrowth = {};
    
    const resourceTypes = ['food', 'wood', 'stone', 'minerals', 'water'];
    
    for (const resource of resourceTypes) {
      const currentAmount = colony[`${resource}_storage`] || 0;
      const capacity = colony[`${resource}_capacity`] || 1000;
      
      // No growth if at capacity
      if (currentAmount >= capacity) {
        resourceGrowth[resource] = 0;
        continue;
      }

      // Base growth rate
      const baseGrowth = this.baseGrowthRates[resource];
      
      // Population factor (more workers = more resources)
      const populationFactor = Math.min(2.0, colony.population / 50);
      
      // Capacity factor (slower growth near capacity)
      const capacityFactor = 1 - (currentAmount / capacity);
      
      // Apply all modifiers
      const totalGrowth = baseGrowth * populationFactor * capacityFactor * modifiers.overall;
      
      // Calculate actual growth
      const growthAmount = Math.floor(currentAmount * totalGrowth * timeDelta);
      
      // Ensure we don't exceed capacity
      resourceGrowth[resource] = Math.min(growthAmount, capacity - currentAmount);
    }
    
    return resourceGrowth;
  }

  /**
   * Calculate territory growth
   */
  calculateTerritoryGrowth(colony, timeDelta, modifiers) {
    const currentTerritory = colony.territory_size;
    const maxTerritory = this.growthCaps.territory;
    
    // No growth if at maximum
    if (currentTerritory >= maxTerritory) {
      return 0;
    }

    // Territory growth is slower and requires resources
    const foodRequirement = currentTerritory * 50; // 50 food per territory unit
    if (colony.food_storage < foodRequirement) {
      return 0; // Can't expand without food
    }

    // Base growth rate
    const baseGrowth = this.baseGrowthRates.territory;
    
    // Population factor (need population to control territory)
    const populationFactor = Math.min(2.0, colony.population / (currentTerritory * 10));
    
    // Apply modifiers
    const totalGrowth = baseGrowth * populationFactor * modifiers.overall;
    
    // Territory growth is discrete (whole numbers only)
    const growthChance = totalGrowth * timeDelta;
    
    // Random chance for territory expansion
    return Math.random() < growthChance ? 1 : 0;
  }

  /**
   * Calculate military growth
   */
  calculateMilitaryGrowth(colony, timeDelta, modifiers) {
    const currentMilitary = Math.floor(colony.population * (colony.military_focus || 0.3));
    const maxMilitary = Math.floor(colony.population * this.growthCaps.military_ratio);
    
    // No growth if at capacity
    if (currentMilitary >= maxMilitary) {
      return 0;
    }

    // Base growth rate
    const baseGrowth = this.baseGrowthRates.military;
    
    // Threat factor (more threat = faster military growth)
    const threatFactor = 1 + colony.threat_level;
    
    // Resource factor (need resources for military)
    const resourceFactor = Math.min(1.0, colony.food_storage / 100);
    
    // Apply modifiers
    const totalGrowth = baseGrowth * threatFactor * resourceFactor * modifiers.overall;
    
    // Calculate actual growth
    const growthAmount = Math.floor(colony.population * totalGrowth * timeDelta);
    
    return Math.min(growthAmount, maxMilitary - currentMilitary);
  }

  /**
   * Calculate infrastructure growth
   */
  calculateInfrastructureGrowth(colony, timeDelta, modifiers) {
    // Infrastructure growth increases max population and resource capacity
    const currentInfrastructure = colony.infrastructure_level || 0;
    
    // Base growth rate
    const baseGrowth = 0.01; // 1% per tick
    
    // Resource factor (need wood and stone for infrastructure)
    const woodFactor = Math.min(1.0, (colony.wood_storage || 0) / 100);
    const stoneFactor = Math.min(1.0, (colony.stone_storage || 0) / 100);
    const resourceFactor = (woodFactor + stoneFactor) / 2;
    
    // Apply modifiers
    const totalGrowth = baseGrowth * resourceFactor * modifiers.overall;
    
    // Infrastructure growth is gradual
    const growthAmount = totalGrowth * timeDelta;
    
    return growthAmount;
  }

  /**
   * Apply growth to colony
   */
  applyGrowth(colony, growth) {
    const changes = {
      before: {},
      after: {},
      applied: {}
    };

    // Store before state
    changes.before = {
      population: colony.population,
      food_storage: colony.food_storage,
      wood_storage: colony.wood_storage,
      stone_storage: colony.stone_storage,
      minerals_storage: colony.minerals_storage,
      water_storage: colony.water_storage,
      territory_size: colony.territory_size,
      infrastructure_level: colony.infrastructure_level || 0
    };

    // Apply population growth
    if (growth.population > 0) {
      colony.population += growth.population;
      changes.applied.population = growth.population;
    }

    // Apply resource growth
    for (const [resource, amount] of Object.entries(growth.resources)) {
      if (amount > 0) {
        const storageKey = `${resource}_storage`;
        colony[storageKey] = (colony[storageKey] || 0) + amount;
        changes.applied[storageKey] = amount;
      }
    }

    // Apply territory growth
    if (growth.territory > 0) {
      colony.territory_size += growth.territory;
      changes.applied.territory_size = growth.territory;
      
      // Consume food for territory expansion
      const foodCost = colony.territory_size * 50;
      colony.food_storage = Math.max(0, colony.food_storage - foodCost);
    }

    // Apply infrastructure growth
    if (growth.infrastructure > 0) {
      colony.infrastructure_level = (colony.infrastructure_level || 0) + growth.infrastructure;
      changes.applied.infrastructure_level = growth.infrastructure;
      
      // Infrastructure increases capacity
      const capacityIncrease = Math.floor(growth.infrastructure * 100);
      colony.max_population += capacityIncrease;
      
      // Consume resources for infrastructure
      const woodCost = Math.floor(growth.infrastructure * 50);
      const stoneCost = Math.floor(growth.infrastructure * 30);
      colony.wood_storage = Math.max(0, (colony.wood_storage || 0) - woodCost);
      colony.stone_storage = Math.max(0, (colony.stone_storage || 0) - stoneCost);
    }

    // Update military focus if military grew
    if (growth.military > 0) {
      const newMilitarySize = Math.floor(colony.population * (colony.military_focus || 0.3)) + growth.military;
      colony.military_focus = Math.min(0.8, newMilitarySize / colony.population);
      changes.applied.military_focus = growth.military / colony.population;
    }

    // Store after state
    changes.after = {
      population: colony.population,
      food_storage: colony.food_storage,
      wood_storage: colony.wood_storage,
      stone_storage: colony.stone_storage,
      minerals_storage: colony.minerals_storage,
      water_storage: colony.water_storage,
      territory_size: colony.territory_size,
      infrastructure_level: colony.infrastructure_level || 0
    };

    return changes;
  }

  /**
   * Generate growth reasoning
   */
  generateGrowthReasoning(colony, growth, modifiers) {
    const reasoning = [];

    // Overall growth assessment
    if (modifiers.overall > 1.2) {
      reasoning.push('Excellent growth conditions with strong modifiers');
    } else if (modifiers.overall > 1.0) {
      reasoning.push('Good growth conditions');
    } else if (modifiers.overall > 0.8) {
      reasoning.push('Moderate growth conditions');
    } else {
      reasoning.push('Challenging growth conditions');
    }

    // Specific factor analysis
    if (modifiers.threat < 0.9) {
      reasoning.push(`High threat level (${colony.threat_level.toFixed(2)}) limiting growth`);
    }

    if (modifiers.resources < 0.8) {
      reasoning.push('Resource shortages constraining growth');
    }

    if (modifiers.difficulty > 1.2) {
      reasoning.push(`High difficulty (${colony.difficulty_level}) accelerating AI growth`);
    }

    // Growth-specific reasoning
    if (growth.population > 0) {
      reasoning.push(`Population growing by ${growth.population} units`);
    }

    if (growth.territory > 0) {
      reasoning.push('Territory expansion successful');
    }

    const totalResourceGrowth = Object.values(growth.resources).reduce((sum, val) => sum + val, 0);
    if (totalResourceGrowth > 100) {
      reasoning.push('Strong resource generation');
    }

    return reasoning;
  }

  /**
   * Calculate growth projection over time
   */
  projectGrowth(colony, ticks = 10, gameState = {}) {
    const projection = {
      timeline: [],
      final_state: {},
      milestones: []
    };

    // Create a copy of the colony for simulation
    const simulatedColony = { ...colony };
    
    for (let tick = 1; tick <= ticks; tick++) {
      const growth = this.calculateGrowth(simulatedColony, 1, gameState);
      this.applyGrowth(simulatedColony, growth);
      
      projection.timeline.push({
        tick: tick,
        population: simulatedColony.population,
        territory_size: simulatedColony.territory_size,
        food_storage: simulatedColony.food_storage,
        total_resources: (simulatedColony.food_storage || 0) + 
                        (simulatedColony.wood_storage || 0) + 
                        (simulatedColony.stone_storage || 0),
        growth_rate: growth.factors.overall
      });

      // Check for milestones
      if (simulatedColony.population >= 100 && colony.population < 100) {
        projection.milestones.push({
          tick: tick,
          type: 'population',
          description: 'Reached 100 population'
        });
      }

      if (simulatedColony.territory_size >= 10 && colony.territory_size < 10) {
        projection.milestones.push({
          tick: tick,
          type: 'territory',
          description: 'Reached 10 territory size'
        });
      }
    }

    projection.final_state = {
      population: simulatedColony.population,
      territory_size: simulatedColony.territory_size,
      food_storage: simulatedColony.food_storage,
      wood_storage: simulatedColony.wood_storage,
      stone_storage: simulatedColony.stone_storage,
      infrastructure_level: simulatedColony.infrastructure_level
    };

    return projection;
  }
}

module.exports = GrowthCalculator; 
/**
 * ResourceStrategy class for AI colony resource management
 * Implements intelligent resource gathering based on colony traits and needs
 */

const { PERSONALITY_TRAITS } = require('../../models/AIColony');

class ResourceStrategy {
  constructor() {
    this.resourceTypes = ['food', 'wood', 'stone', 'minerals', 'water'];
    this.gatheringEfficiency = new Map();
    this.resourcePriorities = new Map();
    
    this.initializeResourceData();
  }

  /**
   * Initialize resource gathering data
   */
  initializeResourceData() {
    // Base gathering efficiency for different resource types
    this.gatheringEfficiency.set('food', 1.0);
    this.gatheringEfficiency.set('wood', 0.8);
    this.gatheringEfficiency.set('stone', 0.6);
    this.gatheringEfficiency.set('minerals', 0.4);
    this.gatheringEfficiency.set('water', 0.9);

    // Base resource priorities (can be modified by personality)
    this.resourcePriorities.set('food', 1.0);
    this.resourcePriorities.set('wood', 0.8);
    this.resourcePriorities.set('stone', 0.6);
    this.resourcePriorities.set('minerals', 0.4);
    this.resourcePriorities.set('water', 0.7);
  }

  /**
   * Determine the best resource gathering strategy for a colony
   */
  determineGatheringStrategy(colony, gameState = {}) {
    const strategy = {
      primaryResource: null,
      secondaryResource: null,
      allocation: {},
      reasoning: []
    };

    // Analyze current resource needs
    const resourceNeeds = this.analyzeResourceNeeds(colony);
    
    // Apply personality modifiers
    const personalityModifiers = this.getPersonalityResourceModifiers(colony.personality);
    
    // Calculate final priorities
    const finalPriorities = this.calculateFinalPriorities(resourceNeeds, personalityModifiers, colony);
    
    // Determine primary and secondary resources
    const sortedResources = Object.entries(finalPriorities)
      .sort(([,a], [,b]) => b - a);
    
    strategy.primaryResource = sortedResources[0][0];
    strategy.secondaryResource = sortedResources[1][0];
    
    // Calculate resource allocation
    strategy.allocation = this.calculateResourceAllocation(colony, finalPriorities);
    
    // Generate reasoning
    strategy.reasoning = this.generateStrategyReasoning(colony, resourceNeeds, finalPriorities);
    
    return strategy;
  }

  /**
   * Analyze current resource needs based on colony state
   */
  analyzeResourceNeeds(colony) {
    const needs = {};
    
    // Food needs (critical for survival)
    if (colony.food_storage < 30) {
      needs.food = 1.5; // Critical need
    } else if (colony.food_storage < 100) {
      needs.food = 1.2; // High need
    } else if (colony.food_storage < 200) {
      needs.food = 1.0; // Normal need
    } else {
      needs.food = 0.7; // Low need
    }

    // Wood needs (for construction)
    const woodStorage = colony.wood_storage || 0;
    if (woodStorage < 50) {
      needs.wood = 1.3;
    } else if (woodStorage < 150) {
      needs.wood = 1.0;
    } else {
      needs.wood = 0.6;
    }

    // Stone needs (for defenses)
    const stoneStorage = colony.stone_storage || 0;
    if (colony.threat_level > 0.5 && stoneStorage < 100) {
      needs.stone = 1.4;
    } else if (stoneStorage < 80) {
      needs.stone = 1.0;
    } else {
      needs.stone = 0.5;
    }

    // Minerals needs (for military)
    const mineralsStorage = colony.minerals_storage || 0;
    if (colony.military_focus > 0.7 && mineralsStorage < 50) {
      needs.minerals = 1.3;
    } else if (mineralsStorage < 30) {
      needs.minerals = 0.8;
    } else {
      needs.minerals = 0.4;
    }

    // Water needs (for population growth)
    const waterStorage = colony.water_storage || 0;
    if (colony.population > 50 && waterStorage < 100) {
      needs.water = 1.2;
    } else if (waterStorage < 50) {
      needs.water = 1.0;
    } else {
      needs.water = 0.6;
    }

    return needs;
  }

  /**
   * Get personality-based resource modifiers
   */
  getPersonalityResourceModifiers(personality) {
    const modifiers = {
      [PERSONALITY_TRAITS.AGGRESSIVE]: {
        food: 1.2,
        minerals: 1.4,
        wood: 0.8,
        stone: 0.9,
        water: 1.0
      },
      [PERSONALITY_TRAITS.DEFENSIVE]: {
        food: 1.1,
        stone: 1.4,
        wood: 1.3,
        minerals: 0.8,
        water: 1.0
      },
      [PERSONALITY_TRAITS.EXPANSIONIST]: {
        food: 1.3,
        water: 1.2,
        wood: 1.1,
        stone: 0.8,
        minerals: 0.9
      },
      [PERSONALITY_TRAITS.BUILDER]: {
        wood: 1.4,
        stone: 1.3,
        food: 1.0,
        minerals: 0.9,
        water: 1.1
      },
      [PERSONALITY_TRAITS.MILITANT]: {
        minerals: 1.4,
        food: 1.2,
        stone: 1.1,
        wood: 0.8,
        water: 0.9
      },
      [PERSONALITY_TRAITS.OPPORTUNIST]: {
        food: 1.0,
        wood: 1.0,
        stone: 1.0,
        minerals: 1.0,
        water: 1.0
      }
    };

    return modifiers[personality] || modifiers[PERSONALITY_TRAITS.OPPORTUNIST];
  }

  /**
   * Calculate final resource priorities
   */
  calculateFinalPriorities(needs, personalityModifiers, colony) {
    const priorities = {};
    
    for (const resource of this.resourceTypes) {
      const baseNeed = needs[resource] || 0.5;
      const personalityMod = personalityModifiers[resource] || 1.0;
      const efficiencyMod = colony.resource_efficiency || 1.0;
      
      priorities[resource] = baseNeed * personalityMod * efficiencyMod;
    }
    
    return priorities;
  }

  /**
   * Calculate optimal resource allocation
   */
  calculateResourceAllocation(colony, priorities) {
    const allocation = {};
    const totalWorkers = Math.floor(colony.population * 0.6); // 60% of population works
    
    // Calculate total priority weight
    const totalPriority = Object.values(priorities).reduce((sum, priority) => sum + priority, 0);
    
    // Allocate workers based on priorities
    let allocatedWorkers = 0;
    
    for (const [resource, priority] of Object.entries(priorities)) {
      const workerCount = Math.floor((priority / totalPriority) * totalWorkers);
      allocation[resource] = Math.max(1, workerCount); // Minimum 1 worker per resource
      allocatedWorkers += allocation[resource];
    }
    
    // Handle any remaining workers (allocate to highest priority resource)
    const remainingWorkers = totalWorkers - allocatedWorkers;
    if (remainingWorkers > 0) {
      const highestPriorityResource = Object.entries(priorities)
        .sort(([,a], [,b]) => b - a)[0][0];
      allocation[highestPriorityResource] += remainingWorkers;
    }
    
    return allocation;
  }

  /**
   * Generate strategy reasoning for debugging/explanation
   */
  generateStrategyReasoning(colony, needs, priorities) {
    const reasoning = [];
    
    // Analyze critical needs
    for (const [resource, need] of Object.entries(needs)) {
      if (need > 1.3) {
        reasoning.push(`Critical ${resource} shortage detected (need: ${need.toFixed(2)})`);
      } else if (need > 1.1) {
        reasoning.push(`High ${resource} demand (need: ${need.toFixed(2)})`);
      }
    }
    
    // Personality influence
    reasoning.push(`Personality (${colony.personality}) influences resource priorities`);
    
    // Threat level influence
    if (colony.threat_level > 0.5) {
      reasoning.push(`High threat level (${colony.threat_level.toFixed(2)}) prioritizes defensive resources`);
    }
    
    // Population influence
    if (colony.population > 80) {
      reasoning.push(`Large population requires increased food and water production`);
    }
    
    return reasoning;
  }

  /**
   * Get specific gathering action for a resource type
   */
  getGatheringAction(resourceType, colony, urgency = 1.0) {
    const baseActions = {
      food: {
        name: 'gather_food',
        efficiency: 1.0,
        cost: 10,
        yield: 30
      },
      wood: {
        name: 'gather_wood',
        efficiency: 0.8,
        cost: 15,
        yield: 25
      },
      stone: {
        name: 'gather_stone',
        efficiency: 0.6,
        cost: 20,
        yield: 20
      },
      minerals: {
        name: 'gather_minerals',
        efficiency: 0.4,
        cost: 25,
        yield: 15
      },
      water: {
        name: 'gather_water',
        efficiency: 0.9,
        cost: 12,
        yield: 28
      }
    };

    const action = baseActions[resourceType];
    if (!action) return null;

    // Apply colony efficiency and urgency modifiers
    const colonyEfficiency = colony.resource_efficiency || 1.0;
    const finalYield = Math.floor(action.yield * colonyEfficiency * urgency);
    const finalCost = Math.ceil(action.cost / colonyEfficiency);

    return {
      ...action,
      yield: finalYield,
      cost: finalCost,
      urgency: urgency
    };
  }

  /**
   * Evaluate resource gathering opportunity
   */
  evaluateGatheringOpportunity(resourceType, location, colony) {
    const opportunity = {
      resource: resourceType,
      location: location,
      score: 0,
      factors: {}
    };

    // Distance factor (closer is better)
    const distance = this.calculateDistance(colony.base_x, colony.base_y, location.x, location.y);
    opportunity.factors.distance = Math.max(0, 1 - (distance / 20));

    // Resource abundance factor
    opportunity.factors.abundance = location.abundance || 0.5;

    // Safety factor (based on threat level in area)
    opportunity.factors.safety = 1 - (location.threat_level || 0);

    // Competition factor (other colonies nearby)
    opportunity.factors.competition = 1 - (location.competition || 0);

    // Calculate final score
    opportunity.score = (
      opportunity.factors.distance * 0.3 +
      opportunity.factors.abundance * 0.4 +
      opportunity.factors.safety * 0.2 +
      opportunity.factors.competition * 0.1
    );

    return opportunity;
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  /**
   * Get resource storage status
   */
  getResourceStatus(colony) {
    const status = {};
    
    for (const resource of this.resourceTypes) {
      const storageKey = `${resource}_storage`;
      const current = colony[storageKey] || 0;
      const capacity = colony[`${resource}_capacity`] || 1000;
      
      status[resource] = {
        current: current,
        capacity: capacity,
        percentage: (current / capacity) * 100,
        status: this.getStorageStatusLevel(current, capacity)
      };
    }
    
    return status;
  }

  /**
   * Get storage status level
   */
  getStorageStatusLevel(current, capacity) {
    const percentage = (current / capacity) * 100;
    
    if (percentage < 20) return 'critical';
    if (percentage < 40) return 'low';
    if (percentage < 70) return 'medium';
    if (percentage < 90) return 'high';
    return 'full';
  }
}

module.exports = ResourceStrategy; 
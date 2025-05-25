const { EventTypes, EventPriority } = require('./SimulationEventSystem');

/**
 * Resource types available in the game
 */
const ResourceTypes = {
  FOOD: 'food',
  BUILDING_MATERIALS: 'building_materials',
  WATER: 'water',
  LARVAE_CARE: 'larvae_care'
};

/**
 * Ant role types
 */
const AntRoles = {
  WORKER: 'worker',
  SOLDIER: 'soldier',
  SCOUT: 'scout',
  NURSE: 'nurse',
  BUILDER: 'builder',
  FORAGER: 'forager'
};

/**
 * Colony development stages
 */
const ColonyStages = {
  FOUNDING: 'founding',     // Just established, small population
  GROWING: 'growing',       // Moderate population, developing infrastructure
  ESTABLISHED: 'established', // Large population, mature infrastructure
  THRIVING: 'thriving'      // Maximum development, multiple specialized areas
};

/**
 * Colony state management system
 * Tracks all colony data including resources, population, structures, and game state
 */
class ColonyState {
  constructor(colonyData, eventSystem = null) {
    this.id = colonyData.id;
    this.name = colonyData.name || `Colony ${this.id}`;
    this.eventSystem = eventSystem;
    
    // Basic colony information
    this.attributes = {
      strength: colonyData.strength || 50,
      speed: colonyData.speed || 50,
      intelligence: colonyData.intelligence || 50,
      defense: colonyData.defense || 50
    };
    
    this.type = colonyData.type || 'balanced';
    this.colorPalette = colonyData.colorPalette || 'earth';
    
    // Colony metrics
    this.foundedAt = colonyData.foundedAt || Date.now();
    this.stage = ColonyStages.FOUNDING;
    this.level = 1;
    this.experience = 0;
    
    // Resource management
    this.resources = new Map();
    this.resourceProduction = new Map();
    this.resourceConsumption = new Map();
    this.resourceCapacity = new Map();
    
    this.initializeResources();
    
    // Population management
    this.population = new Map();
    this.maxPopulation = 100;
    this.totalAnts = 0;
    
    this.initializePopulation();
    
    // Colony infrastructure
    this.structures = new Map();
    this.territory = {
      size: 1.0,
      exploredAreas: 0,
      claimedAreas: 0
    };
    
    // Combat and defense
    this.defenseRating = 0;
    this.attackRating = 0;
    this.battleHistory = [];
    
    // Evolution and technology
    this.evolutionPoints = 0;
    this.unlockedTechnologies = new Set();
    
    // Performance and efficiency modifiers
    this.modifiers = {
      resourceGatheringSpeed: 1.0,
      constructionSpeed: 1.0,
      reproductionRate: 1.0,
      combatEfficiency: 1.0,
      explorationSpeed: 1.0
    };
    
    // State tracking
    this.lastUpdate = Date.now();
    this.dirty = false; // Flag for state changes
    
    console.log(`🏰 Colony ${this.name} state initialized:`, {
      id: this.id,
      type: this.type,
      stage: this.stage,
      resources: Object.fromEntries(this.resources)
    });
  }
  
  /**
   * Initialize starting resources
   */
  initializeResources() {
    // Set starting resources based on colony type
    const startingResources = this.getStartingResources();
    
    Object.entries(startingResources).forEach(([type, amount]) => {
      this.resources.set(type, amount);
      this.resourceProduction.set(type, 0);
      this.resourceConsumption.set(type, 0);
    });
    
    // Set resource capacities
    this.resourceCapacity.set(ResourceTypes.FOOD, 1000);
    this.resourceCapacity.set(ResourceTypes.BUILDING_MATERIALS, 500);
    this.resourceCapacity.set(ResourceTypes.WATER, 200);
    this.resourceCapacity.set(ResourceTypes.LARVAE_CARE, 100);
  }
  
  /**
   * Get starting resources based on colony type
   */
  getStartingResources() {
    const baseResources = {
      [ResourceTypes.FOOD]: 100,
      [ResourceTypes.BUILDING_MATERIALS]: 50,
      [ResourceTypes.WATER]: 50,
      [ResourceTypes.LARVAE_CARE]: 20
    };
    
    // Modify based on colony type
    switch (this.type) {
      case 'aggressive':
        baseResources[ResourceTypes.FOOD] *= 1.2;
        break;
      case 'defensive':
        baseResources[ResourceTypes.BUILDING_MATERIALS] *= 1.5;
        break;
      case 'balanced':
        // No modifications
        break;
    }
    
    return baseResources;
  }
  
  /**
   * Initialize starting population
   */
  initializePopulation() {
    // Initialize all role counts to 0
    Object.values(AntRoles).forEach(role => {
      this.population.set(role, 0);
    });
    
    // Set starting population based on colony attributes
    this.population.set(AntRoles.WORKER, 8);
    this.population.set(AntRoles.SOLDIER, 2);
    this.population.set(AntRoles.SCOUT, 1);
    this.population.set(AntRoles.NURSE, 1);
    
    this.updateTotalPopulation();
  }
  
  /**
   * Update the colony state (called each simulation tick)
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    const oldState = this.serialize();
    
    // Update resource production and consumption
    this.updateResources(deltaTime);
    
    // Update population dynamics
    this.updatePopulation(deltaTime);
    
    // Update colony development
    this.updateDevelopment(deltaTime);
    
    // Update modifiers based on current state
    this.updateModifiers();
    
    // Calculate overall colony health
    this.updateColonyHealth();
    
    this.lastUpdate = Date.now();
    
    // Check for state changes and emit events
    this.checkStateChanges(oldState);
  }
  
  /**
   * Update resource production and consumption
   * @param {number} deltaTime - Time delta in milliseconds
   */
  updateResources(deltaTime) {
    const deltaSeconds = deltaTime / 1000;
    
    for (const [resourceType, currentAmount] of this.resources) {
      const production = this.resourceProduction.get(resourceType) || 0;
      const consumption = this.resourceConsumption.get(resourceType) || 0;
      const capacity = this.resourceCapacity.get(resourceType) || Infinity;
      
      // Calculate net change
      const netChange = (production - consumption) * deltaSeconds;
      const newAmount = Math.max(0, Math.min(capacity, currentAmount + netChange));
      
      if (Math.abs(newAmount - currentAmount) > 0.01) {
        this.setResource(resourceType, newAmount);
      }
    }
  }
  
  /**
   * Update population dynamics
   * @param {number} deltaTime - Time delta in milliseconds
   */
  updatePopulation(deltaTime) {
    // Calculate population growth based on resources
    const foodAmount = this.getResource(ResourceTypes.FOOD);
    const larvaeCare = this.getResource(ResourceTypes.LARVAE_CARE);
    
    // Check if we can support population growth
    if (foodAmount > 50 && larvaeCare > 10 && this.totalAnts < this.maxPopulation) {
      // Chance to add new ant based on reproduction rate
      const reproductionChance = this.modifiers.reproductionRate * (deltaTime / 60000); // Per minute
      
      if (Math.random() < reproductionChance) {
        this.addNewAnt();
      }
    }
    
    // Handle ant deaths due to resource scarcity
    if (foodAmount < 10) {
      const deathChance = 0.001 * (deltaTime / 1000); // Very small chance per second
      if (Math.random() < deathChance && this.totalAnts > 1) {
        this.removeRandomAnt();
      }
    }
  }
  
  /**
   * Update colony development stage and level
   * @param {number} deltaTime - Time delta in milliseconds
   */
  updateDevelopment(deltaTime) {
    // Gain experience over time
    const experienceGain = Math.floor(deltaTime / 10000); // 1 XP per 10 seconds
    if (experienceGain > 0) {
      this.addExperience(experienceGain);
    }
    
    // Update colony stage based on population and development
    this.updateColonyStage();
  }
  
  /**
   * Update colony stage based on current metrics
   */
  updateColonyStage() {
    const oldStage = this.stage;
    
    if (this.totalAnts >= 100 && this.level >= 5) {
      this.stage = ColonyStages.THRIVING;
    } else if (this.totalAnts >= 50 && this.level >= 3) {
      this.stage = ColonyStages.ESTABLISHED;
    } else if (this.totalAnts >= 20 && this.level >= 2) {
      this.stage = ColonyStages.GROWING;
    } else {
      this.stage = ColonyStages.FOUNDING;
    }
    
    if (oldStage !== this.stage) {
      this.emitEvent(EventTypes.COLONY_RESOURCE_CHANGED, {
        stageChanged: true,
        oldStage,
        newStage: this.stage
      });
    }
  }
  
  /**
   * Update efficiency modifiers based on current state
   */
  updateModifiers() {
    // Base modifiers on colony attributes
    this.modifiers.resourceGatheringSpeed = 0.8 + (this.attributes.speed / 100) * 0.4;
    this.modifiers.constructionSpeed = 0.8 + (this.attributes.strength / 100) * 0.4;
    this.modifiers.combatEfficiency = 0.8 + (this.attributes.defense / 100) * 0.4;
    this.modifiers.explorationSpeed = 0.8 + (this.attributes.intelligence / 100) * 0.4;
    
    // Apply stage bonuses
    const stageMultiplier = this.getStageMultiplier();
    Object.keys(this.modifiers).forEach(key => {
      this.modifiers[key] *= stageMultiplier;
    });
    
    // Apply population efficiency (overcrowding penalty)
    const populationRatio = this.totalAnts / this.maxPopulation;
    if (populationRatio > 0.8) {
      const penalty = 1 - ((populationRatio - 0.8) * 0.5);
      Object.keys(this.modifiers).forEach(key => {
        this.modifiers[key] *= penalty;
      });
    }
  }
  
  /**
   * Get stage-based multiplier for efficiency
   */
  getStageMultiplier() {
    switch (this.stage) {
      case ColonyStages.FOUNDING: return 1.0;
      case ColonyStages.GROWING: return 1.1;
      case ColonyStages.ESTABLISHED: return 1.2;
      case ColonyStages.THRIVING: return 1.3;
      default: return 1.0;
    }
  }
  
  /**
   * Update overall colony health metrics
   */
  updateColonyHealth() {
    // Calculate defense rating based on soldiers and structures
    const soldiers = this.getPopulation(AntRoles.SOLDIER);
    this.defenseRating = soldiers * 10 + this.getStructureDefenseBonus();
    
    // Calculate attack rating based on combat ants and attributes
    this.attackRating = soldiers * 8 * this.modifiers.combatEfficiency;
  }
  
  /**
   * Get defense bonus from structures
   */
  getStructureDefenseBonus() {
    // Placeholder - will be implemented when structures are added
    return 0;
  }
  
  /**
   * Check for state changes and emit appropriate events
   * @param {Object} oldState - Previous state for comparison
   */
  checkStateChanges(oldState) {
    // Check for significant resource changes
    for (const [resourceType, currentAmount] of this.resources) {
      const oldAmount = oldState.resources[resourceType] || 0;
      const change = currentAmount - oldAmount;
      
      if (Math.abs(change) > 1) {
        this.emitEvent(EventTypes.COLONY_RESOURCE_CHANGED, {
          resourceType,
          oldAmount,
          newAmount: currentAmount,
          change
        });
      }
      
      // Check for resource depletion
      if (currentAmount <= 0 && oldAmount > 0) {
        this.emitEvent(EventTypes.RESOURCE_DEPLETED, {
          resourceType,
          colonyId: this.id
        });
      }
    }
    
    // Check for population changes
    if (this.totalAnts !== oldState.totalAnts) {
      this.emitEvent(EventTypes.COLONY_POPULATION_CHANGED, {
        oldPopulation: oldState.totalAnts,
        newPopulation: this.totalAnts,
        populationByRole: Object.fromEntries(this.population)
      });
    }
  }
  
  /**
   * Get current resource amount
   * @param {string} resourceType - Type of resource
   */
  getResource(resourceType) {
    return this.resources.get(resourceType) || 0;
  }
  
  /**
   * Set resource amount
   * @param {string} resourceType - Type of resource
   * @param {number} amount - New amount
   */
  setResource(resourceType, amount) {
    const capacity = this.resourceCapacity.get(resourceType) || Infinity;
    const clampedAmount = Math.max(0, Math.min(capacity, amount));
    
    this.resources.set(resourceType, clampedAmount);
    this.dirty = true;
  }
  
  /**
   * Add resources to the colony
   * @param {string} resourceType - Type of resource
   * @param {number} amount - Amount to add
   */
  addResource(resourceType, amount) {
    const currentAmount = this.getResource(resourceType);
    this.setResource(resourceType, currentAmount + amount);
    
    if (amount > 0) {
      this.emitEvent(EventTypes.RESOURCE_COLLECTED, {
        resourceType,
        amount,
        newTotal: this.getResource(resourceType)
      });
    }
  }
  
  /**
   * Consume resources from the colony
   * @param {string} resourceType - Type of resource
   * @param {number} amount - Amount to consume
   * @returns {boolean} True if successful, false if insufficient resources
   */
  consumeResource(resourceType, amount) {
    const currentAmount = this.getResource(resourceType);
    
    if (currentAmount >= amount) {
      this.setResource(resourceType, currentAmount - amount);
      
      this.emitEvent(EventTypes.RESOURCE_CONSUMED, {
        resourceType,
        amount,
        newTotal: this.getResource(resourceType)
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Get population count for a specific role
   * @param {string} role - Ant role
   */
  getPopulation(role) {
    return this.population.get(role) || 0;
  }
  
  /**
   * Set population count for a specific role
   * @param {string} role - Ant role
   * @param {number} count - New count
   */
  setPopulation(role, count) {
    this.population.set(role, Math.max(0, count));
    this.updateTotalPopulation();
    this.dirty = true;
  }
  
  /**
   * Add a new ant to the colony
   * @param {string} role - Role of the new ant (optional, will be auto-assigned)
   */
  addNewAnt(role = null) {
    if (this.totalAnts >= this.maxPopulation) {
      return false;
    }
    
    // Auto-assign role if not specified
    if (!role) {
      role = this.getOptimalRoleForNewAnt();
    }
    
    const currentCount = this.getPopulation(role);
    this.setPopulation(role, currentCount + 1);
    
    // Consume resources for new ant
    this.consumeResource(ResourceTypes.FOOD, 5);
    this.consumeResource(ResourceTypes.LARVAE_CARE, 2);
    
    this.emitEvent(EventTypes.ANT_BORN, {
      role,
      newPopulation: this.totalAnts
    });
    
    return true;
  }
  
  /**
   * Remove an ant from the colony
   * @param {string} role - Role of ant to remove (optional, will pick randomly)
   */
  removeRandomAnt(role = null) {
    if (this.totalAnts <= 1) {
      return false;
    }
    
    // Pick random role if not specified
    if (!role) {
      const availableRoles = Array.from(this.population.entries())
        .filter(([r, count]) => count > 0)
        .map(([r]) => r);
      
      if (availableRoles.length === 0) return false;
      
      role = availableRoles[Math.floor(Math.random() * availableRoles.length)];
    }
    
    const currentCount = this.getPopulation(role);
    if (currentCount > 0) {
      this.setPopulation(role, currentCount - 1);
      
      this.emitEvent(EventTypes.ANT_DIED, {
        role,
        newPopulation: this.totalAnts
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Determine optimal role for a new ant based on current needs
   */
  getOptimalRoleForNewAnt() {
    const workers = this.getPopulation(AntRoles.WORKER);
    const soldiers = this.getPopulation(AntRoles.SOLDIER);
    const scouts = this.getPopulation(AntRoles.SCOUT);
    
    // Maintain ratios: 60% workers, 25% soldiers, 10% scouts, 5% nurses
    const totalAnts = this.totalAnts;
    
    if (workers / totalAnts < 0.6) return AntRoles.WORKER;
    if (soldiers / totalAnts < 0.25) return AntRoles.SOLDIER;
    if (scouts / totalAnts < 0.1) return AntRoles.SCOUT;
    
    return AntRoles.NURSE;
  }
  
  /**
   * Update total population count
   */
  updateTotalPopulation() {
    this.totalAnts = Array.from(this.population.values()).reduce((sum, count) => sum + count, 0);
  }
  
  /**
   * Add experience and handle level ups
   * @param {number} amount - Experience to add
   */
  addExperience(amount) {
    this.experience += amount;
    
    const newLevel = Math.floor(this.experience / 1000) + 1;
    if (newLevel > this.level) {
      const oldLevel = this.level;
      this.level = newLevel;
      
      // Level up benefits
      this.maxPopulation += 10;
      this.evolutionPoints += 5;
      
      this.emitEvent(EventTypes.EVOLUTION_POINTS_EARNED, {
        levelUp: true,
        oldLevel,
        newLevel: this.level,
        pointsEarned: 5
      });
    }
  }
  
  /**
   * Set resource production rate
   * @param {string} resourceType - Resource type
   * @param {number} rate - Production rate per second
   */
  setResourceProduction(resourceType, rate) {
    this.resourceProduction.set(resourceType, rate);
  }
  
  /**
   * Set resource consumption rate
   * @param {string} resourceType - Resource type
   * @param {number} rate - Consumption rate per second
   */
  setResourceConsumption(resourceType, rate) {
    this.resourceConsumption.set(resourceType, rate);
  }
  
  /**
   * Emit an event through the event system
   * @param {string} eventType - Type of event
   * @param {Object} data - Event data
   */
  emitEvent(eventType, data) {
    if (this.eventSystem) {
      this.eventSystem.queueColonyEvent(eventType, this.id, data);
    }
  }
  
  /**
   * Serialize colony state for saving/transmission
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      attributes: { ...this.attributes },
      type: this.type,
      colorPalette: this.colorPalette,
      foundedAt: this.foundedAt,
      stage: this.stage,
      level: this.level,
      experience: this.experience,
      resources: Object.fromEntries(this.resources),
      resourceProduction: Object.fromEntries(this.resourceProduction),
      resourceConsumption: Object.fromEntries(this.resourceConsumption),
      resourceCapacity: Object.fromEntries(this.resourceCapacity),
      population: Object.fromEntries(this.population),
      totalAnts: this.totalAnts,
      maxPopulation: this.maxPopulation,
      structures: Object.fromEntries(this.structures),
      territory: { ...this.territory },
      defenseRating: this.defenseRating,
      attackRating: this.attackRating,
      evolutionPoints: this.evolutionPoints,
      unlockedTechnologies: Array.from(this.unlockedTechnologies),
      modifiers: { ...this.modifiers },
      lastUpdate: this.lastUpdate
    };
  }
  
  /**
   * Restore colony state from serialized data
   * @param {Object} data - Serialized colony data
   */
  deserialize(data) {
    Object.assign(this, {
      id: data.id,
      name: data.name,
      attributes: data.attributes || {},
      type: data.type,
      colorPalette: data.colorPalette,
      foundedAt: data.foundedAt,
      stage: data.stage,
      level: data.level,
      experience: data.experience,
      totalAnts: data.totalAnts,
      maxPopulation: data.maxPopulation,
      territory: data.territory || {},
      defenseRating: data.defenseRating || 0,
      attackRating: data.attackRating || 0,
      evolutionPoints: data.evolutionPoints || 0,
      modifiers: data.modifiers || {},
      lastUpdate: data.lastUpdate
    });
    
    // Restore maps
    this.resources = new Map(Object.entries(data.resources || {}));
    this.resourceProduction = new Map(Object.entries(data.resourceProduction || {}));
    this.resourceConsumption = new Map(Object.entries(data.resourceConsumption || {}));
    this.resourceCapacity = new Map(Object.entries(data.resourceCapacity || {}));
    this.population = new Map(Object.entries(data.population || {}));
    this.structures = new Map(Object.entries(data.structures || {}));
    this.unlockedTechnologies = new Set(data.unlockedTechnologies || []);
    
    this.dirty = false;
  }
  
  /**
   * Get current colony stats summary
   */
  getStats() {
    return {
      id: this.id,
      name: this.name,
      stage: this.stage,
      level: this.level,
      totalAnts: this.totalAnts,
      resources: Object.fromEntries(this.resources),
      population: Object.fromEntries(this.population),
      defenseRating: this.defenseRating,
      attackRating: this.attackRating,
      modifiers: { ...this.modifiers }
    };
  }
}

module.exports = {
  ColonyState,
  ResourceTypes,
  AntRoles,
  ColonyStages
}; 
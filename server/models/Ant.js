const { supabase, handleDatabaseError } = require('../config/database');

// Ant behavior states
const ANT_STATES = {
  FORAGING: 'foraging',        // Looking for food
  RETURNING: 'returning',      // Carrying food back to colony
  EXPLORING: 'exploring',      // Random exploration
  FOLLOWING_TRAIL: 'following_trail', // Following pheromone trail
  IDLE: 'idle'                // Waiting at colony
};

// Ant types with different behaviors
const ANT_TYPES = {
  WORKER: {
    name: 'worker',
    speed: 2.0,
    carryCapacity: 5,
    senseRadius: 30,
    pheromoneStrengthMultiplier: 1.0,
    explorationTendency: 0.3 // 30% chance to explore vs follow trails
  },
  SCOUT: {
    name: 'scout', 
    speed: 3.0,
    carryCapacity: 2,
    senseRadius: 50,
    pheromoneStrengthMultiplier: 1.5,
    explorationTendency: 0.7 // 70% chance to explore
  }
};

// Ant specializations for resource conversion
const ANT_SPECIALIZATIONS = {
  NONE: 'none',
  CULTIVATOR: 'cultivator',     // Specializes in fungus cultivation
  PROCESSOR: 'processor',       // Specializes in protein processing
  HONEY_MAKER: 'honey_maker',   // Specializes in honey production
  FORAGER: 'forager',          // Enhanced foraging abilities
  BUILDER: 'builder',          // Construction specialization
  GUARD: 'guard'               // Defense specialization
};

// Lifecycle stages with properties
const LIFECYCLE_STAGES = {
  EGG: {
    status: 'egg',
    duration: 50,              // 50 ticks to hatch
    foodConsumption: 0,        // Eggs don't consume food
    movementEnabled: false,
    canWork: false,
    size: 0.3,
    description: 'A developing ant egg'
  },
  LARVA: {
    status: 'larva',
    duration: 80,              // 80 ticks to pupate
    foodConsumption: 0.8,      // High food consumption for growth
    movementEnabled: false,
    canWork: false,
    size: 0.5,
    description: 'Growing larva requiring constant care'
  },
  PUPA: {
    status: 'pupa',
    duration: 40,              // 40 ticks to emerge as adult
    foodConsumption: 0.2,      // Low food consumption during metamorphosis
    movementEnabled: false,
    canWork: false,
    size: 0.7,
    description: 'Transforming pupa developing adult features'
  },
  ADULT: {
    status: 'adult',
    duration: 1000,            // 1000 ticks lifespan
    foodConsumption: 0.5,      // Normal food consumption
    movementEnabled: true,
    canWork: true,
    size: 1.0,
    description: 'Fully developed adult ant'
  },
  DEAD: {
    status: 'dead',
    duration: 0,               // No duration - permanent state
    foodConsumption: 0,
    movementEnabled: false,
    canWork: false,
    size: 1.0,
    description: 'Deceased ant'
  }
};

// Queen ant properties
const QUEEN_PROPERTIES = {
  eggProductionRate: 0.1,      // 0.1 eggs per tick (base rate)
  maxEggCapacity: 20,          // Maximum eggs queen can have developing
  fertilityThreshold: 50,      // Food required for egg production
  lifespanMultiplier: 5,       // Queens live 5x longer than normal ants
  size: 2.0,                   // Queens are larger
  specialRole: 'queen'
};

class Ant {
  constructor(data = {}) {
    this.id = data.id;
    this.colony_id = data.colony_id;
    this.type = data.type || 'worker';
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.target_x = data.target_x;
    this.target_y = data.target_y;
    this.state = data.state || ANT_STATES.IDLE;
    this.carrying_resource = data.carrying_resource;
    this.carrying_quantity = data.carrying_quantity || 0;
    this.health = data.health || 100;
    this.energy = data.energy || 100;
    this.experience = data.experience || 0;
    this.specialization = data.specialization || ANT_SPECIALIZATIONS.NONE;
    this.last_pheromone_time = data.last_pheromone_time || 0;
    this.task_id = data.task_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    
    // Lifecycle properties
    this.status = data.status || 'egg';
    this.age_in_ticks = data.age_in_ticks || 0;
    this.max_age_in_ticks = data.max_age_in_ticks || this.calculateMaxAge();
    this.stage_entry_time = data.stage_entry_time || Date.now();
    this.food_consumed_this_stage = data.food_consumed_this_stage || 0;
    this.parent1_id = data.parent1_id;
    this.parent2_id = data.parent2_id;
    this.is_queen = data.is_queen || false;
    this.eggs_laid = data.eggs_laid || 0;
    this.last_egg_production = data.last_egg_production || 0;
    
    // Swarm intelligence properties
    this.lastDirection = { dx: 0, dy: 0 };
    this.stuckCounter = 0;
    this.lastPosition = { x: this.x, y: this.y };
    this.pheromoneLayingCooldown = 0;
    this.explorationTarget = null;
    this.trailFollowingStrength = 0;
  }

  // Get current lifecycle stage properties
  getLifecycleStage() {
    return LIFECYCLE_STAGES[this.status.toUpperCase()] || LIFECYCLE_STAGES.ADULT;
  }

  // Calculate maximum age based on ant type and queen status
  calculateMaxAge() {
    const baseAge = 1000; // Base adult lifespan in ticks
    if (this.is_queen) {
      return baseAge * QUEEN_PROPERTIES.lifespanMultiplier;
    }
    return baseAge;
  }

  // Check if ant can progress to next lifecycle stage
  canProgressStage() {
    const currentStage = this.getLifecycleStage();
    
    // Dead ants cannot progress
    if (this.status === 'dead') return false;
    
    // Check if enough time has passed in current stage
    const timeInStage = this.age_in_ticks - (this.stage_entry_time || 0);
    return timeInStage >= currentStage.duration;
  }

  // Progress to next lifecycle stage
  progressToNextStage() {
    const transitions = {
      'egg': 'larva',
      'larva': 'pupa', 
      'pupa': 'adult',
      'adult': 'dead'  // Adults die when they reach max age
    };

    const nextStatus = transitions[this.status];
    if (nextStatus) {
      this.status = nextStatus;
      this.stage_entry_time = this.age_in_ticks;
      this.food_consumed_this_stage = 0;
      
      // Special handling for becoming adult
      if (nextStatus === 'adult') {
        this.health = 100;
        this.energy = 100;
        // Assign random role if not already set
        if (!this.type || this.type === 'worker') {
          this.assignRandomRole();
        }
      }
      
      return true;
    }
    return false;
  }

  // Assign random role when becoming adult
  assignRandomRole() {
    const roles = ['worker', 'forager', 'scout', 'nurse', 'builder'];
    const weights = [40, 25, 15, 15, 5]; // Percentage weights
    
    const random = Math.random() * 100;
    let cumulative = 0;
    
    for (let i = 0; i < roles.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        this.type = roles[i];
        return;
      }
    }
    
    this.type = 'worker'; // Fallback
  }

  // Calculate food consumption for current lifecycle stage
  getFoodConsumptionRate() {
    const stage = this.getLifecycleStage();
    let baseConsumption = stage.foodConsumption;
    
    // Queens consume more food
    if (this.is_queen && this.status === 'adult') {
      baseConsumption *= 1.5;
    }
    
    // Injured ants consume more food for healing
    if (this.health < 100) {
      baseConsumption *= 1.2;
    }
    
    return baseConsumption;
  }

  // Check if ant should die from age or other causes
  shouldDie() {
    // Death by old age
    if (this.age_in_ticks >= this.max_age_in_ticks) {
      return { reason: 'old_age', probability: 1.0 };
    }
    
    // Death by injury
    if (this.health <= 0) {
      return { reason: 'injury', probability: 1.0 };
    }
    
    // Random death chance increases with age
    const ageRatio = this.age_in_ticks / this.max_age_in_ticks;
    if (ageRatio > 0.8) {
      const deathChance = (ageRatio - 0.8) * 0.05; // 0-1% chance when very old
      if (Math.random() < deathChance) {
        return { reason: 'natural_causes', probability: deathChance };
      }
    }
    
    // Death by starvation (very low energy)
    if (this.energy < 10) {
      const starvationChance = 0.001; // 0.1% chance per tick
      if (Math.random() < starvationChance) {
        return { reason: 'starvation', probability: starvationChance };
      }
    }
    
    return null;
  }

  // Kill the ant
  die(reason = 'unknown') {
    this.status = 'dead';
    this.health = 0;
    this.energy = 0;
    this.state = ANT_STATES.IDLE;
    this.carrying_resource = null;
    this.carrying_quantity = 0;
    
    return {
      id: this.id,
      reason,
      age: this.age_in_ticks,
      stage: this.status
    };
  }

  // Queen-specific: Check if queen can produce eggs
  canProduceEgg(colonyFoodAmount) {
    if (!this.is_queen || this.status !== 'adult') return false;
    
    // Check food requirements
    if (colonyFoodAmount < QUEEN_PROPERTIES.fertilityThreshold) return false;
    
    // Check production cooldown (minimum time between eggs)
    const timeSinceLastEgg = Date.now() - this.last_egg_production;
    const productionCooldown = 1000 / QUEEN_PROPERTIES.eggProductionRate; // milliseconds
    
    return timeSinceLastEgg >= productionCooldown;
  }

  // Queen-specific: Produce an egg
  produceEgg() {
    if (!this.canProduceEgg()) return null;
    
    this.eggs_laid += 1;
    this.last_egg_production = Date.now();
    
    return {
      colony_id: this.colony_id,
      status: 'egg',
      parent1_id: this.id,
      x: this.x,
      y: this.y,
      created_at: new Date()
    };
  }

  // Check if ant can work (adults only)
  canWork() {
    const stage = this.getLifecycleStage();
    return stage.canWork && this.health > 30 && this.energy > 20;
  }

  // Check if ant can move
  canMove() {
    const stage = this.getLifecycleStage();
    return stage.movementEnabled && this.health > 10 && this.energy > 10;
  }

  // Get visual size based on lifecycle stage
  getVisualSize() {
    const stage = this.getLifecycleStage();
    let size = stage.size;
    
    if (this.is_queen && this.status === 'adult') {
      size = QUEEN_PROPERTIES.size;
    }
    
    return size;
  }

  // Age the ant by one tick and handle lifecycle progression
  ageTick(colonyResources = {}) {
    this.age_in_ticks += 1;
    
    // Check for death
    const deathCheck = this.shouldDie();
    if (deathCheck) {
      return this.die(deathCheck.reason);
    }
    
    // Consume food based on lifecycle stage
    const foodConsumption = this.getFoodConsumptionRate();
    if (foodConsumption > 0) {
      this.food_consumed_this_stage += foodConsumption;
      
      // Reduce energy if not enough food
      const availableFood = colonyResources.food || 0;
      if (availableFood < foodConsumption) {
        this.energy = Math.max(0, this.energy - 2);
      } else {
        // Slowly recover energy when well-fed
        this.energy = Math.min(100, this.energy + 0.5);
      }
    }
    
    // Check for stage progression
    if (this.canProgressStage()) {
      const progressed = this.progressToNextStage();
      if (progressed) {
        return {
          id: this.id,
          event: 'stage_progression',
          oldStage: this.status,
          newStage: this.status,
          age: this.age_in_ticks
        };
      }
    }
    
    return null; // No significant events this tick
  }

  // Get ant type configuration
  getTypeConfig() {
    return ANT_TYPES[this.type.toUpperCase()] || ANT_TYPES.WORKER;
  }

  // Check if ant is carrying resources
  isCarryingResources() {
    return this.carrying_quantity > 0;
  }

  // Check if ant can carry more resources
  canCarryMore() {
    const config = this.getTypeConfig();
    return this.carrying_quantity < config.carryCapacity;
  }

  // Calculate movement based on swarm intelligence
  calculateMovement(pheromoneMap, resources, colony, otherAnts = []) {
    const config = this.getTypeConfig();
    let movement = { dx: 0, dy: 0, newState: this.state };

    // Apply cooldowns
    if (this.pheromoneLayingCooldown > 0) this.pheromoneLayingCooldown--;

    switch (this.state) {
      case ANT_STATES.FORAGING:
        movement = this.calculateForagingMovement(pheromoneMap, resources, config);
        break;
      case ANT_STATES.RETURNING:
        movement = this.calculateReturningMovement(pheromoneMap, colony, config);
        break;
      case ANT_STATES.EXPLORING:
        movement = this.calculateExplorationMovement(pheromoneMap, config);
        break;
      case ANT_STATES.FOLLOWING_TRAIL:
        movement = this.calculateTrailFollowingMovement(pheromoneMap, config);
        break;
      case ANT_STATES.IDLE:
        movement = this.calculateIdleMovement(pheromoneMap, config);
        break;
    }

    // Add some randomness to prevent perfect geometric patterns
    movement.dx += (Math.random() - 0.5) * 0.3;
    movement.dy += (Math.random() - 0.5) * 0.3;

    // Normalize movement to ant speed
    const distance = Math.sqrt(movement.dx * movement.dx + movement.dy * movement.dy);
    if (distance > config.speed) {
      movement.dx = (movement.dx / distance) * config.speed;
      movement.dy = (movement.dy / distance) * config.speed;
    }

    return movement;
  }

  // Calculate movement when foraging for food
  calculateForagingMovement(pheromoneMap, resources, config) {
    // Look for nearby food sources
    const nearbyResources = resources.filter(resource => {
      const distance = Math.sqrt(
        Math.pow(resource.location_x - this.x, 2) + 
        Math.pow(resource.location_y - this.y, 2)
      );
      return distance <= config.senseRadius && resource.quantity > 0;
    });

    if (nearbyResources.length > 0) {
      // Head to closest resource
      const closest = nearbyResources.reduce((closest, resource) => {
        const distToCurrent = Math.sqrt(
          Math.pow(resource.location_x - this.x, 2) + 
          Math.pow(resource.location_y - this.y, 2)
        );
        const distToClosest = closest ? Math.sqrt(
          Math.pow(closest.location_x - this.x, 2) + 
          Math.pow(closest.location_y - this.y, 2)
        ) : Infinity;
        
        return distToCurrent < distToClosest ? resource : closest;
      }, null);

      return {
        dx: closest.location_x - this.x,
        dy: closest.location_y - this.y,
        newState: ANT_STATES.FORAGING
      };
    }

    // No visible food - follow food trails or explore
    const foodTrail = pheromoneMap.calculateOptimalDirection(
      this.x, this.y, 'FOOD_TRAIL', 'DANGER_TRAIL'
    );

    if (foodTrail && foodTrail.strength > 10) {
      // Follow food trail
      return {
        dx: foodTrail.dx * config.speed,
        dy: foodTrail.dy * config.speed,
        newState: ANT_STATES.FOLLOWING_TRAIL
      };
    }

    // Explore randomly, but bias towards areas with weaker exploration trails
    // (avoids overcrowding explored areas)
    const explorationStrength = pheromoneMap.getPheromoneStrength(this.x, this.y, 'EXPLORATION_TRAIL');
    const shouldExplore = Math.random() < (config.explorationTendency + (explorationStrength / 100));

    if (shouldExplore) {
      return {
        dx: (Math.random() - 0.5) * config.speed * 2,
        dy: (Math.random() - 0.5) * config.speed * 2,
        newState: ANT_STATES.EXPLORING
      };
    }

    return { dx: 0, dy: 0, newState: ANT_STATES.FORAGING };
  }

  // Calculate movement when returning to colony with food
  calculateReturningMovement(pheromoneMap, colony, config) {
    if (!colony) return { dx: 0, dy: 0, newState: this.state };

    const distanceToColony = Math.sqrt(
      Math.pow(colony.x - this.x, 2) + 
      Math.pow(colony.y - this.y, 2)
    );

    // If very close to colony, return successfully
    if (distanceToColony < 10) {
      return {
        dx: 0,
        dy: 0,
        newState: ANT_STATES.IDLE // Will deposit resources
      };
    }

    // Follow home trail if available, otherwise head directly to colony
    const homeTrail = pheromoneMap.calculateOptimalDirection(
      this.x, this.y, 'HOME_TRAIL'
    );

    let targetDirection;
    if (homeTrail && homeTrail.strength > 5) {
      targetDirection = { dx: homeTrail.dx, dy: homeTrail.dy };
    } else {
      // Head directly to colony
      targetDirection = {
        dx: colony.x - this.x,
        dy: colony.y - this.y
      };
    }

    // Lay food trail while returning
    if (this.pheromoneLayingCooldown === 0) {
      pheromoneMap.layPheromone(this.x, this.y, 'FOOD_TRAIL', 
        config.pheromoneStrengthMultiplier * 80);
      this.pheromoneLayingCooldown = 3; // Lay every 3 ticks
    }

    return {
      dx: targetDirection.dx,
      dy: targetDirection.dy,
      newState: ANT_STATES.RETURNING
    };
  }

  // Calculate exploration movement
  calculateExplorationMovement(pheromoneMap, config) {
    // Continue in roughly the same direction with some randomness
    let newDirection;
    
    if (this.lastDirection.dx === 0 && this.lastDirection.dy === 0) {
      // Start exploring in random direction
      newDirection = {
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2
      };
    } else {
      // Continue in similar direction but add some randomness
      newDirection = {
        dx: this.lastDirection.dx + (Math.random() - 0.5) * 0.5,
        dy: this.lastDirection.dy + (Math.random() - 0.5) * 0.5
      };
    }

    // Lay weak exploration trail
    if (this.pheromoneLayingCooldown === 0) {
      pheromoneMap.layPheromone(this.x, this.y, 'EXPLORATION_TRAIL', 
        config.pheromoneStrengthMultiplier * 20);
      this.pheromoneLayingCooldown = 5;
    }

    // Occasionally switch back to foraging
    if (Math.random() < 0.05) { // 5% chance per tick
      return {
        dx: newDirection.dx * config.speed,
        dy: newDirection.dy * config.speed,
        newState: ANT_STATES.FORAGING
      };
    }

    return {
      dx: newDirection.dx * config.speed,
      dy: newDirection.dy * config.speed,
      newState: ANT_STATES.EXPLORING
    };
  }

  // Calculate movement when following a pheromone trail
  calculateTrailFollowingMovement(pheromoneMap, config) {
    const foodTrail = pheromoneMap.calculateOptimalDirection(
      this.x, this.y, 'FOOD_TRAIL', 'DANGER_TRAIL'
    );

    if (foodTrail && foodTrail.strength > 5) {
      this.trailFollowingStrength = foodTrail.strength;
      return {
        dx: foodTrail.dx * config.speed,
        dy: foodTrail.dy * config.speed,
        newState: ANT_STATES.FOLLOWING_TRAIL
      };
    }

    // Trail lost - switch to foraging
    return {
      dx: 0,
      dy: 0,
      newState: ANT_STATES.FORAGING
    };
  }

  // Calculate movement when idle at colony
  calculateIdleMovement(pheromoneMap, config) {
    // Lay home trail at colony
    if (this.pheromoneLayingCooldown === 0) {
      pheromoneMap.layPheromone(this.x, this.y, 'HOME_TRAIL', 
        config.pheromoneStrengthMultiplier * 100);
      this.pheromoneLayingCooldown = 10;
    }

    // Start foraging after being idle
    return {
      dx: 0,
      dy: 0,
      newState: ANT_STATES.FORAGING
    };
  }

  // Update ant position and state
  async update(movement) {
    const newX = this.x + movement.dx;
    const newY = this.y + movement.dy;
    
    // Check if ant is stuck
    const distanceMoved = Math.sqrt(
      Math.pow(newX - this.lastPosition.x, 2) + 
      Math.pow(newY - this.lastPosition.y, 2)
    );
    
    if (distanceMoved < 0.5) {
      this.stuckCounter++;
      if (this.stuckCounter > 10) {
        // Force exploration if stuck
        movement.newState = ANT_STATES.EXPLORING;
        this.stuckCounter = 0;
      }
    } else {
      this.stuckCounter = 0;
    }

    this.lastPosition = { x: this.x, y: this.y };
    this.lastDirection = { dx: movement.dx, dy: movement.dy };

    return this.updateDatabase({
      x: newX,
      y: newY,
      state: movement.newState,
      energy: Math.max(0, this.energy - 0.1) // Small energy cost for movement
    });
  }

  // Pick up resources at current location
  async pickupResource(resource) {
    if (!this.canCarryMore() || !resource || resource.quantity === 0) {
      return { success: false, message: 'Cannot pickup resource' };
    }

    const config = this.getTypeConfig();
    const pickupAmount = Math.min(
      config.carryCapacity - this.carrying_quantity,
      resource.quantity
    );

    // Update ant
    await this.updateDatabase({
      carrying_resource: resource.type,
      carrying_quantity: this.carrying_quantity + pickupAmount,
      state: ANT_STATES.RETURNING
    });

    // Update resource
    await resource.harvest(pickupAmount);

    return { 
      success: true, 
      amount: pickupAmount,
      newState: ANT_STATES.RETURNING
    };
  }

  // Drop off resources at colony
  async dropoffResources(colony) {
    if (this.carrying_quantity === 0) {
      return { success: false, message: 'No resources to drop off' };
    }

    const droppedAmount = this.carrying_quantity;
    const resourceType = this.carrying_resource;

    // Add to colony storage (you'll need to implement this)
    // await ColonyResource.addToColony(colony.id, resourceType, droppedAmount, 95);

    // Clear ant carrying state
    await this.updateDatabase({
      carrying_resource: null,
      carrying_quantity: 0,
      state: ANT_STATES.IDLE,
      energy: Math.min(100, this.energy + 5) // Small energy boost from successful foraging
    });

    return {
      success: true,
      amount: droppedAmount,
      resourceType
    };
  }

  // Update ant in database
  async updateDatabase(updateData) {
    try {
      const { data, error } = await supabase
        .from('ants')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'updating ant');
      }

      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'updating ant');
    }
  }

  // Create new ant
  static async create(antData) {
    try {
      const { data, error } = await supabase
        .from('ants')
        .insert([antData])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'creating ant');
      }

      return { data: new Ant(data) };
    } catch (err) {
      return handleDatabaseError(err, 'creating ant');
    }
  }

  // Find ants by colony
  static async findByColonyId(colonyId) {
    try {
      const { data, error } = await supabase
        .from('ants')
        .select('*')
        .eq('colony_id', colonyId);

      if (error) {
        return handleDatabaseError(error, 'finding ants by colony');
      }

      const ants = data.map(antData => new Ant(antData));
      return { data: ants };
    } catch (err) {
      return handleDatabaseError(err, 'finding ants by colony');
    }
  }

  // Find ant by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('ants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { error: 'Ant not found' };
        }
        return handleDatabaseError(error, 'finding ant by ID');
      }

      return { data: new Ant(data) };
    } catch (err) {
      return handleDatabaseError(err, 'finding ant by ID');
    }
  }

  // Get ant states and types
  static getAntStates() {
    return ANT_STATES;
  }

  static getAntTypes() {
    return ANT_TYPES;
  }

  static getAntSpecializations() {
    return ANT_SPECIALIZATIONS;
  }

  // Get lifecycle constants
  static getLifecycleStages() {
    return LIFECYCLE_STAGES;
  }

  static getQueenProperties() {
    return QUEEN_PROPERTIES;
  }

  // Convert to JSON for API responses
  toJSON() {
    const config = this.getTypeConfig();
    const stage = this.getLifecycleStage();
    
    return {
      id: this.id,
      colonyId: this.colony_id,
      type: this.type,
      position: { x: this.x, y: this.y },
      target: this.target_x ? { x: this.target_x, y: this.target_y } : null,
      state: this.state,
      carrying: {
        resource: this.carrying_resource,
        quantity: this.carrying_quantity,
        capacity: config.carryCapacity
      },
      health: this.health,
      energy: this.energy,
      experience: this.experience,
      specialization: this.specialization,
      
      // Lifecycle information
      lifecycle: {
        status: this.status,
        age: this.age_in_ticks,
        maxAge: this.max_age_in_ticks,
        stageProgress: this.age_in_ticks - (this.stage_entry_time || 0),
        stageDuration: stage.duration,
        foodConsumption: this.getFoodConsumptionRate(),
        canWork: this.canWork(),
        canMove: this.canMove(),
        visualSize: this.getVisualSize(),
        description: stage.description
      },
      
      // Queen information (if applicable)
      queen: this.is_queen ? {
        eggsLaid: this.eggs_laid,
        lastEggProduction: this.last_egg_production,
        canProduceEgg: this.canProduceEgg(100) // Assume 100 food for display
      } : null,
      
      // Parent information
      parents: {
        parent1: this.parent1_id,
        parent2: this.parent2_id
      },
      
      typeConfig: config,
      lastDirection: this.lastDirection,
      stuckCounter: this.stuckCounter,
      taskId: this.task_id,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

module.exports = Ant;

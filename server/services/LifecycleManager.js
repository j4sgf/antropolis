const EventEmitter = require('events');
const Ant = require('../models/Ant');
const ColonyResource = require('../models/ColonyResource');

/**
 * Lifecycle Events
 */
const LifecycleEvents = {
  STAGE_PROGRESSION: 'stage_progression',
  ANT_DEATH: 'ant_death',
  ANT_BIRTH: 'ant_birth',
  EGG_LAID: 'egg_laid',
  FOOD_SHORTAGE: 'food_shortage',
  POPULATION_CHANGE: 'population_change'
};

/**
 * Lifecycle Configuration
 */
const LifecycleConfig = {
  // Tick rates (adjustable for gameplay balance)
  TICK_INTERVAL: 1000,           // 1 second per tick
  QUEENS_PER_COLONY: 1,          // Maximum queens per colony
  MIN_WORKERS_FOR_SURVIVAL: 3,   // Minimum workers needed for colony survival
  
  // Resource consumption modifiers
  STARVATION_THRESHOLD: 0.1,     // Energy level that triggers starvation
  ENERGY_DECAY_RATE: 0.05,       // Energy loss per tick when starving
  FOOD_EFFICIENCY: 1.0,          // Base food consumption efficiency
  
  // Population limits
  MAX_COLONY_SIZE: 200,          // Maximum ants per colony
  OVERCROWDING_THRESHOLD: 0.8,   // Population ratio that triggers penalties
  
  // Event probabilities
  NATURAL_DEATH_CHANCE: 0.001,   // Base chance of random death per tick
  QUEEN_REPLACEMENT_CHANCE: 0.1, // Chance to promote worker to queen when queen dies
};

/**
 * Lifecycle Manager - Handles ant lifecycle progression and colony population dynamics
 */
class LifecycleManager extends EventEmitter {
  constructor() {
    super();
    this.activeColonies = new Map();
    this.processingIntervals = new Map();
    this.statistics = {
      totalTicks: 0,
      antsProcessed: 0,
      stageProgressions: 0,
      deaths: 0,
      births: 0,
      lastUpdate: Date.now()
    };
  }

  /**
   * Register a colony for lifecycle management
   */
  registerColony(colonyId) {
    if (this.activeColonies.has(colonyId)) {
      console.log(`🐜 Colony ${colonyId} already registered for lifecycle management`);
      return;
    }

    this.activeColonies.set(colonyId, {
      id: colonyId,
      lastProcessedTick: 0,
      populationStats: {
        eggs: 0,
        larvae: 0,
        pupae: 0,
        adults: 0,
        dead: 0,
        queens: 0
      },
      resourceConsumption: {
        foodPerTick: 0,
        totalConsumed: 0
      },
      registeredAt: Date.now()
    });

    // Start processing for this colony
    this.startColonyProcessing(colonyId);
    
    console.log(`🏛️ Registered colony ${colonyId} for lifecycle management`);
    this.emit(LifecycleEvents.POPULATION_CHANGE, { colonyId, event: 'colony_registered' });
  }

  /**
   * Unregister a colony from lifecycle management
   */
  unregisterColony(colonyId) {
    if (!this.activeColonies.has(colonyId)) return;

    this.stopColonyProcessing(colonyId);
    this.activeColonies.delete(colonyId);
    
    console.log(`🚫 Unregistered colony ${colonyId} from lifecycle management`);
  }

  /**
   * Start lifecycle processing for a specific colony
   */
  startColonyProcessing(colonyId) {
    if (this.processingIntervals.has(colonyId)) {
      clearInterval(this.processingIntervals.get(colonyId));
    }

    const interval = setInterval(async () => {
      await this.processColonyLifecycle(colonyId);
    }, LifecycleConfig.TICK_INTERVAL);

    this.processingIntervals.set(colonyId, interval);
    console.log(`⚙️ Started lifecycle processing for colony ${colonyId}`);
  }

  /**
   * Stop lifecycle processing for a specific colony
   */
  stopColonyProcessing(colonyId) {
    if (this.processingIntervals.has(colonyId)) {
      clearInterval(this.processingIntervals.get(colonyId));
      this.processingIntervals.delete(colonyId);
      console.log(`⏹️ Stopped lifecycle processing for colony ${colonyId}`);
    }
  }

  /**
   * Process lifecycle for all ants in a colony
   */
  async processColonyLifecycle(colonyId) {
    try {
      const colonyData = this.activeColonies.get(colonyId);
      if (!colonyData) return;

      // Get all living ants in the colony
      const antsResult = await Ant.findByColonyId(colonyId);
      if (!antsResult.data) {
        console.error(`Failed to load ants for colony ${colonyId}`);
        return;
      }

      const ants = antsResult.data.filter(ant => ant.status !== 'dead');
      
      // Get colony resources
      const resources = await this.getColonyResources(colonyId);
      
      // Update population stats
      this.updatePopulationStats(colonyId, ants);
      
      // Process each ant
      const events = [];
      let totalFoodConsumption = 0;
      
      for (const ant of ants) {
        const antEvent = ant.ageTick(resources);
        if (antEvent) {
          events.push(antEvent);
          
          if (antEvent.event === 'stage_progression') {
            this.statistics.stageProgressions++;
            this.emit(LifecycleEvents.STAGE_PROGRESSION, {
              colonyId,
              antId: ant.id,
              oldStage: antEvent.oldStage,
              newStage: antEvent.newStage,
              age: antEvent.age
            });
          } else if (antEvent.reason) { // Death event
            this.statistics.deaths++;
            await this.handleAntDeath(colonyId, ant, antEvent.reason);
          }
        }
        
        // Accumulate food consumption
        totalFoodConsumption += ant.getFoodConsumptionRate();
        
        // Update ant in database if it has changed
        if (antEvent) {
          await ant.updateDatabase({
            status: ant.status,
            age_in_ticks: ant.age_in_ticks,
            health: ant.health,
            energy: ant.energy,
            stage_entry_time: ant.stage_entry_time
          });
        }
      }
      
      // Consume food from colony resources
      if (totalFoodConsumption > 0) {
        await this.consumeColonyFood(colonyId, totalFoodConsumption);
        colonyData.resourceConsumption.foodPerTick = totalFoodConsumption;
        colonyData.resourceConsumption.totalConsumed += totalFoodConsumption;
      }
      
      // Handle queen egg production
      await this.processQueenEggProduction(colonyId, ants, resources);
      
      // Update statistics
      this.statistics.totalTicks++;
      this.statistics.antsProcessed += ants.length;
      this.statistics.lastUpdate = Date.now();
      colonyData.lastProcessedTick = this.statistics.totalTicks;
      
      // Emit events for any significant changes
      if (events.length > 0) {
        this.emit(LifecycleEvents.POPULATION_CHANGE, {
          colonyId,
          events,
          populationStats: colonyData.populationStats,
          foodConsumption: totalFoodConsumption
        });
      }
      
    } catch (error) {
      console.error(`Error processing lifecycle for colony ${colonyId}:`, error);
    }
  }

  /**
   * Handle queen egg production
   */
  async processQueenEggProduction(colonyId, ants, resources) {
    const queens = ants.filter(ant => ant.is_queen && ant.status === 'adult');
    
    for (const queen of queens) {
      if (queen.canProduceEgg(resources.food || 0)) {
        const eggData = queen.produceEgg();
        if (eggData) {
          // Create new egg ant
          const eggResult = await Ant.create(eggData);
          if (eggResult.data) {
            this.statistics.births++;
            this.emit(LifecycleEvents.EGG_LAID, {
              colonyId,
              queenId: queen.id,
              eggId: eggResult.data.id,
              totalEggs: queen.eggs_laid
            });
            
            // Update queen in database
            await queen.updateDatabase({
              eggs_laid: queen.eggs_laid,
              last_egg_production: queen.last_egg_production
            });
          }
        }
      }
    }
  }

  /**
   * Handle ant death
   */
  async handleAntDeath(colonyId, ant, reason) {
    // Update ant status to dead in database
    await ant.updateDatabase({
      status: 'dead',
      health: 0,
      energy: 0,
      carrying_resource: null,
      carrying_quantity: 0
    });
    
    this.emit(LifecycleEvents.ANT_DEATH, {
      colonyId,
      antId: ant.id,
      reason,
      age: ant.age_in_ticks,
      type: ant.type,
      wasQueen: ant.is_queen
    });
    
    // If a queen died, potentially promote a worker
    if (ant.is_queen) {
      await this.handleQueenReplacement(colonyId);
    }
    
    console.log(`💀 Ant ${ant.id} died from ${reason} at age ${ant.age_in_ticks}`);
  }

  /**
   * Handle queen replacement when queen dies
   */
  async handleQueenReplacement(colonyId) {
    // Get all living adult workers
    const antsResult = await Ant.findByColonyId(colonyId);
    if (!antsResult.data) return;
    
    const adultWorkers = antsResult.data.filter(ant => 
      ant.status === 'adult' && 
      ant.type === 'worker' && 
      !ant.is_queen
    );
    
    if (adultWorkers.length > 0 && Math.random() < LifecycleConfig.QUEEN_REPLACEMENT_CHANCE) {
      // Promote a random worker to queen
      const newQueen = adultWorkers[Math.floor(Math.random() * adultWorkers.length)];
      await newQueen.updateDatabase({
        is_queen: true,
        type: 'queen',
        eggs_laid: 0,
        last_egg_production: 0,
        max_age_in_ticks: newQueen.calculateMaxAge()
      });
      
      console.log(`👑 Worker ${newQueen.id} promoted to queen for colony ${colonyId}`);
      this.emit(LifecycleEvents.ANT_BIRTH, {
        colonyId,
        event: 'queen_promotion',
        antId: newQueen.id
      });
    }
  }

  /**
   * Update population statistics for a colony
   */
  updatePopulationStats(colonyId, ants) {
    const colonyData = this.activeColonies.get(colonyId);
    if (!colonyData) return;
    
    const stats = {
      eggs: 0,
      larvae: 0,
      pupae: 0,
      adults: 0,
      dead: 0,
      queens: 0
    };
    
    ants.forEach(ant => {
      if (ant.status === 'egg') stats.eggs++;
      else if (ant.status === 'larva') stats.larvae++;
      else if (ant.status === 'pupa') stats.pupae++;
      else if (ant.status === 'adult') stats.adults++;
      else if (ant.status === 'dead') stats.dead++;
      
      if (ant.is_queen) stats.queens++;
    });
    
    colonyData.populationStats = stats;
  }

  /**
   * Get colony resources
   */
  async getColonyResources(colonyId) {
    try {
      const result = await ColonyResource.findByColonyId(colonyId);
      if (result.data) {
        const resources = {};
        result.data.forEach(resource => {
          resources[resource.type] = resource.amount;
        });
        return resources;
      }
    } catch (error) {
      console.error(`Error loading colony resources for ${colonyId}:`, error);
    }
    return { food: 0, water: 0 };
  }

  /**
   * Consume food from colony resources
   */
  async consumeColonyFood(colonyId, amount) {
    try {
      // This would integrate with the existing resource system
      const foodResource = await ColonyResource.findByColonyAndType(colonyId, 'food');
      if (foodResource && foodResource.amount >= amount) {
        await ColonyResource.updateAmount(colonyId, 'food', -amount);
      } else {
        // Not enough food - this triggers starvation
        this.emit(LifecycleEvents.FOOD_SHORTAGE, {
          colonyId,
          required: amount,
          available: foodResource ? foodResource.amount : 0
        });
      }
    } catch (error) {
      console.error(`Error consuming food for colony ${colonyId}:`, error);
    }
  }

  /**
   * Get lifecycle statistics
   */
  getStatistics() {
    const activeColoniesData = {};
    for (const [colonyId, data] of this.activeColonies) {
      activeColoniesData[colonyId] = {
        populationStats: data.populationStats,
        resourceConsumption: data.resourceConsumption,
        lastProcessedTick: data.lastProcessedTick,
        registeredAt: data.registeredAt
      };
    }
    
    return {
      global: this.statistics,
      colonies: activeColoniesData,
      config: LifecycleConfig,
      activeColonies: this.activeColonies.size
    };
  }

  /**
   * Update lifecycle configuration (for balancing)
   */
  updateConfig(newConfig) {
    Object.assign(LifecycleConfig, newConfig);
    console.log('🔧 Updated lifecycle configuration:', newConfig);
  }

  /**
   * Shutdown lifecycle manager
   */
  shutdown() {
    console.log('🔌 Shutting down LifecycleManager...');
    
    // Stop all processing intervals
    for (const colonyId of this.activeColonies.keys()) {
      this.stopColonyProcessing(colonyId);
    }
    
    this.activeColonies.clear();
    this.processingIntervals.clear();
    
    console.log('✅ LifecycleManager shutdown complete');
  }
}

// Export the class and constants
module.exports = {
  LifecycleManager,
  LifecycleEvents,
  LifecycleConfig
}; 
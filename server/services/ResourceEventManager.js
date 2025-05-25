const EventEmitter = require('events');
const Resource = require('../models/Resource');
const ColonyResource = require('../models/ColonyResource');
const Colony = require('../models/Colony');
const Ant = require('../models/Ant');

/**
 * Resource Event Types
 */
const ResourceEventTypes = {
  // Random foraging events
  PREDATOR_ATTACK: 'predator_attack',
  RAINFALL: 'rainfall',
  RESOURCE_BONUS: 'resource_bonus',
  DROUGHT: 'drought',
  PEST_INFESTATION: 'pest_infestation',
  SEASONAL_ABUNDANCE: 'seasonal_abundance',
  
  // Resource conversion events
  CONVERSION_STARTED: 'conversion_started',
  CONVERSION_COMPLETED: 'conversion_completed',
  CONVERSION_FAILED: 'conversion_failed',
  
  // Decay events
  RESOURCE_SPOILED: 'resource_spoiled',
  QUALITY_DEGRADED: 'quality_degraded',
  STORAGE_OVERFLOW: 'storage_overflow'
};

/**
 * Conversion Recipes - defines how resources can be converted
 */
const ConversionRecipes = {
  LEAVES_TO_FUNGUS: {
    id: 'leaves_to_fungus',
    name: 'Cultivate Fungus',
    description: 'Convert leaves into nutritious fungus through cultivation',
    input: { type: 'leaves', amount: 3 },
    output: { type: 'fungus', amount: 1 },
    duration: 120, // 2 minutes in seconds
    efficiency: 0.8, // 80% base efficiency
    requiredWorkers: 2,
    specialization: 'cultivator'
  },
  INSECT_TO_PROTEIN: {
    id: 'insect_to_protein',
    name: 'Process Protein',
    description: 'Break down insect remains into concentrated protein',
    input: { type: 'insect_remains', amount: 1 },
    output: { type: 'processed_protein', amount: 2 },
    duration: 60, // 1 minute
    efficiency: 0.9,
    requiredWorkers: 1,
    specialization: 'processor'
  },
  NECTAR_TO_HONEY: {
    id: 'nectar_to_honey',
    name: 'Create Honey',
    description: 'Convert nectar into long-lasting honey stores',
    input: { type: 'nectar', amount: 2 },
    output: { type: 'honey', amount: 1 },
    duration: 180, // 3 minutes
    efficiency: 0.7,
    requiredWorkers: 3,
    specialization: 'honey_maker'
  }
};

/**
 * Random Event Configurations
 */
const RandomEvents = {
  PREDATOR_ATTACK: {
    name: 'Predator Attack',
    description: 'A predator threatens foraging ants',
    probability: 0.02, // 2% chance per hour
    effects: {
      antLoss: { min: 1, max: 3 },
      resourceLoss: { min: 0.1, max: 0.3 }, // 10-30% of carried resources
      pheromoneDisruption: true
    },
    duration: 300 // 5 minutes
  },
  RAINFALL: {
    name: 'Rainfall',
    description: 'Rain improves resource quality but slows movement',
    probability: 0.05, // 5% chance per hour
    effects: {
      qualityBonus: 1.2, // 20% quality improvement
      movementPenalty: 0.7, // 30% slower movement
      newResourceSpawn: { min: 2, max: 5 }
    },
    duration: 600 // 10 minutes
  },
  RESOURCE_BONUS: {
    name: 'Resource Discovery',
    description: 'Scouts discover a rich resource patch',
    probability: 0.03, // 3% chance per hour
    effects: {
      resourceMultiplier: { min: 1.5, max: 3.0 },
      qualityBonus: 1.1
    },
    duration: 1800 // 30 minutes
  },
  DROUGHT: {
    name: 'Drought',
    description: 'Dry conditions reduce resource availability',
    probability: 0.015, // 1.5% chance per hour
    effects: {
      resourceReduction: 0.5, // 50% less resources
      decayIncrease: 1.5, // 50% faster decay
      movementBonus: 1.1 // 10% faster movement (less vegetation)
    },
    duration: 1200 // 20 minutes
  }
};

class ResourceEventManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableRandomEvents: config.enableRandomEvents !== false,
      eventCheckInterval: config.eventCheckInterval || 300000, // 5 minutes
      decayCheckInterval: config.decayCheckInterval || 3600000, // 1 hour
      conversionCheckInterval: config.conversionCheckInterval || 60000, // 1 minute
      ...config
    };
    
    // Active events tracking
    this.activeEvents = new Map();
    this.activeConversions = new Map();
    this.lastEventCheck = Date.now();
    this.lastDecayCheck = Date.now();
    
    // Statistics
    this.stats = {
      eventsTriggered: 0,
      conversionsCompleted: 0,
      resourcesDecayed: 0,
      totalResourcesProcessed: 0
    };
    
    // Start background processes
    this.startBackgroundProcesses();
    
    console.log('🎲 ResourceEventManager initialized:', {
      randomEvents: this.config.enableRandomEvents,
      eventInterval: this.config.eventCheckInterval / 1000 + 's',
      decayInterval: this.config.decayCheckInterval / 1000 + 's'
    });
  }
  
  /**
   * Start background processes for events and decay
   */
  startBackgroundProcesses() {
    // Random event checker
    if (this.config.enableRandomEvents) {
      this.eventInterval = setInterval(() => {
        this.checkRandomEvents();
      }, this.config.eventCheckInterval);
    }
    
    // Decay checker
    this.decayInterval = setInterval(() => {
      this.processResourceDecay();
    }, this.config.decayCheckInterval);
    
    // Conversion checker
    this.conversionInterval = setInterval(() => {
      this.processActiveConversions();
    }, this.config.conversionCheckInterval);
  }
  
  /**
   * Check and trigger random events for active colonies
   */
  async checkRandomEvents() {
    try {
      // Get all active colonies (simplified - in real implementation, get from active session)
      const colonies = await this.getActiveColonies();
      
      for (const colony of colonies) {
        for (const [eventType, eventConfig] of Object.entries(RandomEvents)) {
          if (Math.random() < eventConfig.probability) {
            await this.triggerRandomEvent(eventType, colony);
          }
        }
      }
    } catch (error) {
      console.error('Error checking random events:', error);
    }
  }
  
  /**
   * Trigger a specific random event for a colony
   */
  async triggerRandomEvent(eventType, colony) {
    const eventConfig = RandomEvents[eventType];
    if (!eventConfig) return;
    
    const eventId = `${eventType}_${colony.id}_${Date.now()}`;
    const event = {
      id: eventId,
      type: eventType,
      colonyId: colony.id,
      config: eventConfig,
      startTime: Date.now(),
      endTime: Date.now() + (eventConfig.duration * 1000),
      effects: this.calculateEventEffects(eventConfig)
    };
    
    this.activeEvents.set(eventId, event);
    this.stats.eventsTriggered++;
    
    // Apply immediate effects
    await this.applyEventEffects(event, colony);
    
    // Emit event for UI notifications
    this.emit('randomEvent', {
      type: ResourceEventTypes[eventType.toUpperCase()],
      colony: colony,
      event: event,
      message: `${eventConfig.name}: ${eventConfig.description}`
    });
    
    console.log(`🎲 Triggered ${eventType} for colony ${colony.id}`);
    
    // Schedule event cleanup
    setTimeout(() => {
      this.endEvent(eventId);
    }, eventConfig.duration * 1000);
    
    return event;
  }
  
  /**
   * Calculate specific effects for an event
   */
  calculateEventEffects(eventConfig) {
    const effects = { ...eventConfig.effects };
    
    // Randomize ranges
    Object.keys(effects).forEach(key => {
      const effect = effects[key];
      if (typeof effect === 'object' && effect.min !== undefined && effect.max !== undefined) {
        effects[key] = effect.min + Math.random() * (effect.max - effect.min);
      }
    });
    
    return effects;
  }
  
  /**
   * Apply event effects to colony and ants
   */
  async applyEventEffects(event, colony) {
    const { effects } = event;
    
    switch (event.type) {
      case 'PREDATOR_ATTACK':
        await this.handlePredatorAttack(colony, effects);
        break;
      case 'RAINFALL':
        await this.handleRainfall(colony, effects);
        break;
      case 'RESOURCE_BONUS':
        await this.handleResourceBonus(colony, effects);
        break;
      case 'DROUGHT':
        await this.handleDrought(colony, effects);
        break;
    }
  }
  
  /**
   * Handle predator attack effects
   */
  async handlePredatorAttack(colony, effects) {
    // Get foraging ants
    const antsResult = await Ant.findByColonyId(colony.id);
    if (antsResult.data) {
      const foragingAnts = antsResult.data.filter(ant => 
        ant.state === 'foraging' || ant.state === 'returning'
      );
      
      // Randomly affect some ants
      const affectedCount = Math.min(
        Math.floor(effects.antLoss),
        foragingAnts.length
      );
      
      for (let i = 0; i < affectedCount; i++) {
        const randomAnt = foragingAnts[Math.floor(Math.random() * foragingAnts.length)];
        
        // Make ant drop resources and return home
        if (randomAnt.carrying_quantity > 0) {
          const lossAmount = Math.floor(randomAnt.carrying_quantity * effects.resourceLoss);
          await randomAnt.update({
            carrying_quantity: Math.max(0, randomAnt.carrying_quantity - lossAmount),
            state: 'returning'
          });
        }
      }
    }
  }
  
  /**
   * Handle rainfall effects
   */
  async handleRainfall(colony, effects) {
    // Improve quality of stored resources
    const resourcesResult = await ColonyResource.findByColonyId(colony.id);
    if (resourcesResult.data) {
      for (const resource of resourcesResult.data) {
        const newQuality = Math.min(100, resource.quality * effects.qualityBonus);
        await resource.update({ quality: newQuality });
      }
    }
    
    // Spawn new resources near colony
    const newResourceCount = Math.floor(effects.newResourceSpawn);
    for (let i = 0; i < newResourceCount; i++) {
      await this.spawnResourceNearColony(colony);
    }
  }
  
  /**
   * Handle resource bonus discovery
   */
  async handleResourceBonus(colony, effects) {
    // Find resources near colony and boost them
    const resourcesResult = await Resource.findInArea(colony.x, colony.y, 150);
    if (resourcesResult.data) {
      for (const resource of resourcesResult.data) {
        const multiplier = effects.resourceMultiplier;
        const qualityBonus = effects.qualityBonus;
        
        await resource.update({
          quantity: Math.floor(resource.quantity * multiplier),
          quality: Math.min(100, resource.quality * qualityBonus)
        });
      }
    }
  }
  
  /**
   * Handle drought effects
   */
  async handleDrought(colony, effects) {
    // Reduce nearby resource quantities
    const resourcesResult = await Resource.findInArea(colony.x, colony.y, 200);
    if (resourcesResult.data) {
      for (const resource of resourcesResult.data) {
        await resource.update({
          quantity: Math.floor(resource.quantity * effects.resourceReduction)
        });
      }
    }
  }
  
  /**
   * Spawn a new resource near a colony
   */
  async spawnResourceNearColony(colony) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = 50 + Math.random() * 100; // 50-150 units from colony
    
    const x = colony.x + Math.cos(angle) * distance;
    const y = colony.y + Math.sin(angle) * distance;
    
    const resourceTypes = ['leaves', 'seeds', 'nectar'];
    const randomType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    
    return Resource.create({
      type: randomType,
      quantity: 10 + Math.floor(Math.random() * 20),
      quality: 80 + Math.random() * 20,
      location_x: x,
      location_y: y,
      spawn_rate: 1.0
    });
  }
  
  /**
   * Start a resource conversion process
   */
  async startConversion(colonyId, recipeId, workerIds = []) {
    const recipe = ConversionRecipes[recipeId.toUpperCase()];
    if (!recipe) {
      return { error: 'Invalid conversion recipe' };
    }
    
    // Check if colony has required resources
    const inputResourceResult = await ColonyResource.findByColonyAndType(
      colonyId, 
      recipe.input.type
    );
    
    if (!inputResourceResult.data || inputResourceResult.data.getAvailableQuantity() < recipe.input.amount) {
      return { error: 'Insufficient input resources' };
    }
    
    // Check worker availability
    if (workerIds.length < recipe.requiredWorkers) {
      return { error: `Requires ${recipe.requiredWorkers} workers` };
    }
    
    // Reserve input resources
    await inputResourceResult.data.reserveQuantity(recipe.input.amount);
    
    // Calculate efficiency based on worker specialization
    const efficiency = await this.calculateConversionEfficiency(recipe, workerIds);
    
    const conversionId = `conv_${colonyId}_${recipeId}_${Date.now()}`;
    const conversion = {
      id: conversionId,
      colonyId,
      recipe,
      workerIds,
      efficiency,
      startTime: Date.now(),
      endTime: Date.now() + (recipe.duration * 1000),
      status: 'in_progress'
    };
    
    this.activeConversions.set(conversionId, conversion);
    
    // Emit conversion started event
    this.emit('conversionStarted', {
      type: ResourceEventTypes.CONVERSION_STARTED,
      conversion,
      estimatedOutput: Math.floor(recipe.output.amount * efficiency)
    });
    
    console.log(`🔄 Started conversion ${recipeId} for colony ${colonyId}`);
    
    return { success: true, conversionId, conversion };
  }
  
  /**
   * Calculate conversion efficiency based on worker specialization
   */
  async calculateConversionEfficiency(recipe, workerIds) {
    let efficiency = recipe.efficiency;
    
    // Get worker details
    for (const workerId of workerIds) {
      const workerResult = await Ant.findById(workerId);
      if (workerResult.data) {
        const worker = workerResult.data;
        
        // Check if worker has required specialization
        if (worker.specialization === recipe.specialization) {
          efficiency += 0.1; // 10% bonus per specialized worker
        }
        
        // Experience bonus (simplified)
        if (worker.experience > 50) {
          efficiency += 0.05; // 5% bonus for experienced workers
        }
      }
    }
    
    return Math.min(1.0, efficiency); // Cap at 100%
  }
  
  /**
   * Process active conversions
   */
  async processActiveConversions() {
    const now = Date.now();
    
    for (const [conversionId, conversion] of this.activeConversions) {
      if (now >= conversion.endTime) {
        await this.completeConversion(conversionId);
      }
    }
  }
  
  /**
   * Complete a conversion process
   */
  async completeConversion(conversionId) {
    const conversion = this.activeConversions.get(conversionId);
    if (!conversion) return;
    
    const { colonyId, recipe, efficiency } = conversion;
    
    try {
      // Remove input resources
      const inputResourceResult = await ColonyResource.findByColonyAndType(
        colonyId, 
        recipe.input.type
      );
      
      if (inputResourceResult.data) {
        await inputResourceResult.data.removeQuantity(recipe.input.amount);
      }
      
      // Add output resources
      const outputAmount = Math.floor(recipe.output.amount * efficiency);
      await ColonyResource.addToColony(
        colonyId,
        recipe.output.type,
        outputAmount,
        95 // High quality from conversion
      );
      
      // Update statistics
      this.stats.conversionsCompleted++;
      this.stats.totalResourcesProcessed += outputAmount;
      
      // Emit completion event
      this.emit('conversionCompleted', {
        type: ResourceEventTypes.CONVERSION_COMPLETED,
        conversion,
        actualOutput: outputAmount,
        efficiency
      });
      
      console.log(`✅ Completed conversion ${conversion.recipe.id} for colony ${colonyId}`);
      
    } catch (error) {
      console.error('Error completing conversion:', error);
      
      this.emit('conversionFailed', {
        type: ResourceEventTypes.CONVERSION_FAILED,
        conversion,
        error: error.message
      });
    }
    
    this.activeConversions.delete(conversionId);
  }
  
  /**
   * Process resource decay for all colonies
   */
  async processResourceDecay() {
    try {
      const colonies = await this.getActiveColonies();
      
      for (const colony of colonies) {
        await this.processColonyResourceDecay(colony.id);
      }
      
      this.lastDecayCheck = Date.now();
    } catch (error) {
      console.error('Error processing resource decay:', error);
    }
  }
  
  /**
   * Process decay for a specific colony's resources
   */
  async processColonyResourceDecay(colonyId) {
    const resourcesResult = await ColonyResource.findByColonyId(colonyId);
    if (!resourcesResult.data) return;
    
    for (const resource of resourcesResult.data) {
      const oldQuality = resource.quality;
      const decayResult = await resource.applyDecay();
      
      if (decayResult.data && decayResult.data.quality < oldQuality) {
        this.stats.resourcesDecayed++;
        
        // Emit decay event if significant quality loss
        if (oldQuality - decayResult.data.quality > 10) {
          this.emit('resourceDecayed', {
            type: ResourceEventTypes.QUALITY_DEGRADED,
            colonyId,
            resourceType: resource.resource_type,
            oldQuality,
            newQuality: decayResult.data.quality,
            quantityLost: oldQuality - decayResult.data.quality
          });
        }
        
        // Remove completely spoiled resources
        if (decayResult.data.quality <= 0) {
          await resource.delete();
          
          this.emit('resourceSpoiled', {
            type: ResourceEventTypes.RESOURCE_SPOILED,
            colonyId,
            resourceType: resource.resource_type,
            quantityLost: resource.quantity
          });
        }
      }
    }
  }
  
  /**
   * End an active event
   */
  endEvent(eventId) {
    const event = this.activeEvents.get(eventId);
    if (event) {
      this.activeEvents.delete(eventId);
      
      this.emit('eventEnded', {
        eventId,
        type: event.type,
        colonyId: event.colonyId,
        duration: Date.now() - event.startTime
      });
      
      console.log(`⏰ Event ${event.type} ended for colony ${event.colonyId}`);
    }
  }
  
  /**
   * Get active colonies (simplified implementation)
   */
  async getActiveColonies() {
    // In a real implementation, this would get colonies from active game sessions
    // For now, return a mock colony for testing
    return [
      { id: 'mock-colony-id', x: 500, y: 500, name: 'Test Colony' }
    ];
  }
  
  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeEvents: this.activeEvents.size,
      activeConversions: this.activeConversions.size,
      lastEventCheck: this.lastEventCheck,
      lastDecayCheck: this.lastDecayCheck
    };
  }
  
  /**
   * Get active events for a colony
   */
  getActiveEvents(colonyId) {
    return Array.from(this.activeEvents.values())
      .filter(event => event.colonyId === colonyId);
  }
  
  /**
   * Get active conversions for a colony
   */
  getActiveConversions(colonyId) {
    return Array.from(this.activeConversions.values())
      .filter(conversion => conversion.colonyId === colonyId);
  }
  
  /**
   * Get available conversion recipes
   */
  static getConversionRecipes() {
    return ConversionRecipes;
  }
  
  /**
   * Get random event configurations
   */
  static getRandomEvents() {
    return RandomEvents;
  }
  
  /**
   * Cleanup and stop background processes
   */
  destroy() {
    if (this.eventInterval) clearInterval(this.eventInterval);
    if (this.decayInterval) clearInterval(this.decayInterval);
    if (this.conversionInterval) clearInterval(this.conversionInterval);
    
    this.activeEvents.clear();
    this.activeConversions.clear();
    this.removeAllListeners();
    
    console.log('🧹 ResourceEventManager destroyed');
  }
}

module.exports = {
  ResourceEventManager,
  ResourceEventTypes,
  ConversionRecipes,
  RandomEvents
}; 
const SimulationEngine = require('./SimulationEngine');
const { SimulationEventSystem, EventTypes, EventPriority } = require('./SimulationEventSystem');
const { ColonyState, ResourceTypes, AntRoles } = require('./ColonyState');

/**
 * Integration class that brings together all simulation components
 * Demonstrates the working simulation system with real colony management
 */
class SimulationIntegration {
  constructor(config = {}) {
    this.config = {
      enableDebugLogging: config.enableDebugLogging || true,
      autoStartColonies: config.autoStartColonies || true,
      ...config
    };
    
    // Initialize core systems
    this.eventSystem = new SimulationEventSystem({
      enableDebugLogging: this.config.enableDebugLogging,
      maxEventsPerTick: 200
    });
    
    this.engine = new SimulationEngine({
      targetTicksPerSecond: 10, // Slower for demonstration
      timescale: 1.0
    });
    
    // Active colonies in simulation
    this.colonies = new Map();
    
    // Simulation statistics
    this.stats = {
      startTime: Date.now(),
      totalTicks: 0,
      coloniesCreated: 0,
      eventsProcessed: 0
    };
    
    this.setupEventListeners();
    
    console.log('🎮 SimulationIntegration initialized');
  }
  
  /**
   * Set up event listeners for the simulation
   */
  setupEventListeners() {
    // Listen to simulation engine events
    this.engine.on('simulationStarted', () => {
      console.log('🚀 Simulation started!');
      this.eventSystem.queueEvent(
        EventTypes.SIMULATION_STARTED,
        { timestamp: Date.now() },
        EventPriority.HIGH
      );
    });
    
    this.engine.on('tickStart', (tickData) => {
      // Process events at the start of each tick
      this.eventSystem.processEvents();
      this.stats.totalTicks = tickData.tick;
    });
    
    this.engine.on('tickEnd', (tickData) => {
      // Queue a tick processed event
      this.eventSystem.queueEvent(
        EventTypes.TICK_PROCESSED,
        { 
          tick: tickData.tick,
          activeColonies: this.colonies.size,
          timestamp: tickData.timestamp
        },
        EventPriority.LOW
      );
    });
    
    // Listen to colony events
    this.eventSystem.on(EventTypes.COLONY_RESOURCE_CHANGED, (data) => {
      if (this.config.enableDebugLogging && data.change) {
        console.log(`📊 Colony ${data.colonyId}: ${data.resourceType} changed by ${data.change.toFixed(1)}`);
      }
    });
    
    this.eventSystem.on(EventTypes.COLONY_POPULATION_CHANGED, (data) => {
      if (this.config.enableDebugLogging) {
        console.log(`👥 Colony ${data.colonyId}: Population ${data.oldPopulation} → ${data.newPopulation}`);
      }
    });
    
    this.eventSystem.on(EventTypes.ANT_BORN, (data) => {
      if (this.config.enableDebugLogging) {
        console.log(`🐣 New ${data.role} ant born in colony ${data.colonyId}`);
      }
    });
    
    this.eventSystem.on(EventTypes.ANT_DIED, (data) => {
      if (this.config.enableDebugLogging) {
        console.log(`💀 ${data.role} ant died in colony ${data.colonyId}`);
      }
    });
    
    this.eventSystem.on(EventTypes.RESOURCE_COLLECTED, (data) => {
      if (this.config.enableDebugLogging && data.amount > 5) {
        console.log(`💰 Colony ${data.colonyId}: Collected ${data.amount.toFixed(1)} ${data.resourceType}`);
      }
    });
    
    this.eventSystem.on(EventTypes.EVOLUTION_POINTS_EARNED, (data) => {
      if (data.levelUp) {
        console.log(`🎉 Colony ${data.colonyId}: Level up! ${data.oldLevel} → ${data.newLevel}`);
      }
    });
  }
  
  /**
   * Create a new colony and add it to the simulation
   * @param {Object} colonyData - Colony creation data
   */
  createColony(colonyData) {
    const colony = new ColonyState(colonyData, this.eventSystem);
    
    // Set up basic resource production based on population
    this.setupColonyProduction(colony);
    
    // Add to simulation
    this.colonies.set(colony.id, colony);
    this.engine.addColony(colony);
    
    this.stats.coloniesCreated++;
    
    console.log(`🏰 Created colony "${colony.name}" with ${colony.totalAnts} ants`);
    
    return colony;
  }
  
  /**
   * Set up basic resource production for a colony
   * @param {ColonyState} colony - Colony to set up
   */
  setupColonyProduction(colony) {
    const workers = colony.getPopulation(AntRoles.WORKER);
    const foragers = colony.getPopulation(AntRoles.FORAGER);
    const nurses = colony.getPopulation(AntRoles.NURSE);
    
    // Food production based on workers and foragers
    const foodProduction = (workers + foragers * 2) * 0.5; // units per second
    colony.setResourceProduction(ResourceTypes.FOOD, foodProduction);
    
    // Building materials from workers
    const materialsProduction = workers * 0.2;
    colony.setResourceProduction(ResourceTypes.BUILDING_MATERIALS, materialsProduction);
    
    // Larvae care from nurses
    const larvaeCareProduction = nurses * 0.3;
    colony.setResourceProduction(ResourceTypes.LARVAE_CARE, larvaeCareProduction);
    
    // Basic consumption (maintenance costs)
    const totalAnts = colony.totalAnts;
    colony.setResourceConsumption(ResourceTypes.FOOD, totalAnts * 0.1); // Ants need food
    colony.setResourceConsumption(ResourceTypes.WATER, totalAnts * 0.05); // And water
    
    console.log(`📈 Set up production for ${colony.name}:`, {
      food: `+${foodProduction.toFixed(1)}/s`,
      materials: `+${materialsProduction.toFixed(1)}/s`,
      consumption: `-${(totalAnts * 0.15).toFixed(1)}/s`
    });
  }
  
  /**
   * Create a sample colony for demonstration
   */
  createSampleColony() {
    const sampleData = {
      id: `colony_${Date.now()}`,
      name: 'Demo Colony Alpha',
      type: 'balanced',
      strength: 65,
      speed: 70,
      intelligence: 80,
      defense: 55,
      colorPalette: 'forest'
    };
    
    return this.createColony(sampleData);
  }
  
  /**
   * Start the simulation with optional sample colonies
   */
  start() {
    if (this.config.autoStartColonies && this.colonies.size === 0) {
      console.log('🏗️ Creating sample colonies for demonstration...');
      
      // Create a few different colony types
      this.createSampleColony();
      
      // Create another colony with different attributes
      this.createColony({
        id: `colony_${Date.now() + 1}`,
        name: 'Demo Colony Beta',
        type: 'aggressive',
        strength: 90,
        speed: 60,
        intelligence: 40,
        defense: 75,
        colorPalette: 'earth'
      });
    }
    
    // Start the simulation engine
    this.engine.start();
    
    console.log(`🎮 Simulation started with ${this.colonies.size} colonies`);
  }
  
  /**
   * Stop the simulation
   */
  stop() {
    this.engine.stop();
    console.log('🛑 Simulation stopped');
  }
  
  /**
   * Pause the simulation
   */
  pause() {
    this.engine.pause();
    console.log('⏸️ Simulation paused');
  }
  
  /**
   * Resume the simulation
   */
  resume() {
    this.engine.resume();
    console.log('▶️ Simulation resumed');
  }
  
  /**
   * Add resources to a colony for testing
   * @param {string} colonyId - Colony ID
   * @param {string} resourceType - Resource type
   * @param {number} amount - Amount to add
   */
  addResourcesToColony(colonyId, resourceType, amount) {
    const colony = this.colonies.get(colonyId);
    if (colony) {
      colony.addResource(resourceType, amount);
      console.log(`💰 Added ${amount} ${resourceType} to ${colony.name}`);
    }
  }
  
  /**
   * Simulate ant births for testing
   * @param {string} colonyId - Colony ID
   * @param {string} role - Ant role (optional)
   */
  simulateAntBirth(colonyId, role = null) {
    const colony = this.colonies.get(colonyId);
    if (colony) {
      const success = colony.addNewAnt(role);
      if (success) {
        // Update production since population changed
        this.setupColonyProduction(colony);
        console.log(`🐣 Added new ant to ${colony.name}`);
      } else {
        console.log(`❌ Could not add ant to ${colony.name} (population limit or resources)`);
      }
    }
  }
  
  /**
   * Get current simulation status
   */
  getStatus() {
    const engineStats = this.engine.getStats();
    const eventStats = this.eventSystem.getStats();
    const runtimeMinutes = (Date.now() - this.stats.startTime) / 60000;
    
    const colonies = Array.from(this.colonies.values()).map(colony => ({
      id: colony.id,
      name: colony.name,
      stage: colony.stage,
      level: colony.level,
      totalAnts: colony.totalAnts,
      resources: Object.fromEntries(colony.resources),
      population: Object.fromEntries(colony.population)
    }));
    
    return {
      simulation: {
        isRunning: engineStats.isRunning,
        isPaused: engineStats.isPaused,
        runtime: `${runtimeMinutes.toFixed(1)} minutes`,
        currentTick: engineStats.currentTick,
        performance: engineStats.performance
      },
      events: {
        queueSize: eventStats.queueSize,
        totalProcessed: eventStats.totalProcessed,
        eventsThisTick: eventStats.eventsThisTick
      },
      colonies: {
        total: colonies.length,
        details: colonies
      },
      statistics: this.stats
    };
  }
  
  /**
   * Get simulation performance metrics
   */
  getMetrics() {
    const status = this.getStatus();
    const eventHistory = this.eventSystem.getEventHistory(20);
    
    return {
      ...status,
      recentEvents: eventHistory,
      colonyMetrics: Array.from(this.colonies.values()).map(colony => colony.getStats())
    };
  }
  
  /**
   * Demonstrate simulation capabilities
   */
  demonstrateSimulation() {
    console.log('\n🎬 === ANTOCRACY SIMULATION DEMONSTRATION ===\n');
    
    // Start simulation
    this.start();
    
    // Demonstrate adding resources
    setTimeout(() => {
      const colonyIds = Array.from(this.colonies.keys());
      if (colonyIds.length > 0) {
        console.log('\n💰 Adding bonus resources...');
        this.addResourcesToColony(colonyIds[0], ResourceTypes.FOOD, 50);
        this.addResourcesToColony(colonyIds[0], ResourceTypes.LARVAE_CARE, 20);
      }
    }, 5000);
    
    // Demonstrate ant population growth
    setTimeout(() => {
      const colonyIds = Array.from(this.colonies.keys());
      if (colonyIds.length > 0) {
        console.log('\n🐣 Simulating ant births...');
        this.simulateAntBirth(colonyIds[0], AntRoles.WORKER);
        this.simulateAntBirth(colonyIds[0], AntRoles.FORAGER);
      }
    }, 10000);
    
    // Show status update
    setTimeout(() => {
      console.log('\n📊 === SIMULATION STATUS ===');
      console.log(JSON.stringify(this.getStatus(), null, 2));
    }, 15000);
    
    // Auto-stop after demonstration
    setTimeout(() => {
      console.log('\n🎬 === DEMONSTRATION COMPLETE ===');
      this.stop();
    }, 20000);
  }
  
  /**
   * Clean up and destroy the simulation
   */
  destroy() {
    this.engine.destroy();
    this.eventSystem.destroy();
    this.colonies.clear();
    
    console.log('🗑️ SimulationIntegration destroyed');
  }
}

module.exports = SimulationIntegration; 
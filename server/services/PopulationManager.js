const EventEmitter = require('events');
const Ant = require('../models/Ant');
const ColonyResource = require('../models/ColonyResource');

/**
 * Population Management Events
 */
const PopulationEvents = {
  POPULATION_CHANGE: 'population_change',
  OVERPOPULATION: 'overpopulation',
  UNDERPOPULATION: 'underpopulation',
  RESOURCE_SHORTAGE: 'resource_shortage',
  STARVATION_WARNING: 'starvation_warning',
  COLONY_COLLAPSE: 'colony_collapse',
  POPULATION_MILESTONE: 'population_milestone'
};

/**
 * Population Management Configuration
 */
const PopulationConfig = {
  // Population limits
  MIN_VIABLE_POPULATION: 5,      // Minimum ants for colony survival
  MAX_SUSTAINABLE_POPULATION: 200, // Maximum ants before resource strain
  OPTIMAL_POPULATION_RANGE: [20, 100], // Ideal population range
  
  // Resource management
  FOOD_RESERVE_RATIO: 0.2,       // Keep 20% food in reserve
  STARVATION_THRESHOLD: 0.1,     // Warn when food < 10% of daily consumption
  EMERGENCY_RATIONING: 0.05,     // Emergency rationing when food < 5%
  
  // Population control
  QUEEN_EGG_LAYING_COOLDOWN: 5,  // Ticks between eggs when overpopulated
  WORKER_PROMOTION_CHANCE: 0.1,  // Chance to promote worker to specialized role
  
  // Alerts and thresholds
  POPULATION_ALERT_THRESHOLDS: [10, 25, 50, 100, 150, 200],
  RESOURCE_ALERT_INTERVALS: 50   // Alert every 50 ticks during shortage
};

/**
 * Population Manager Class
 * Handles colony population dynamics, resource balancing, and survival mechanics
 */
class PopulationManager extends EventEmitter {
  constructor() {
    super();
    this.colonies = new Map(); // colonyId -> colony data
    this.alertCounters = new Map(); // Track alert frequencies
    this.statistics = {
      totalColoniesManaged: 0,
      populationEvents: 0,
      resourceShortages: 0,
      colonyCollapses: 0,
      populationMilestones: 0
    };
  }

  /**
   * Register a colony for population management
   */
  registerColony(colonyId) {
    if (this.colonies.has(colonyId)) {
      console.log(`📊 Colony ${colonyId} already registered for population management`);
      return;
    }

    this.colonies.set(colonyId, {
      id: colonyId,
      registeredAt: Date.now(),
      lastProcessed: 0,
      populationHistory: [],
      resourceHistory: [],
      alerts: {
        lastStarvationWarning: 0,
        lastOverpopulationAlert: 0,
        consecutiveShortages: 0
      },
      statistics: {
        peakPopulation: 0,
        totalDeaths: 0,
        totalBirths: 0,
        averageLifespan: 0,
        resourceEfficiency: 1.0
      }
    });

    this.statistics.totalColoniesManaged++;
    console.log(`📊 Registered colony ${colonyId} for population management`);
  }

  /**
   * Unregister a colony
   */
  unregisterColony(colonyId) {
    if (this.colonies.delete(colonyId)) {
      console.log(`📊 Unregistered colony ${colonyId} from population management`);
    }
  }

  /**
   * Process population management for a colony
   */
  async processColonyPopulation(colonyId) {
    const colonyData = this.colonies.get(colonyId);
    if (!colonyData) {
      console.warn(`Colony ${colonyId} not registered for population management`);
      return;
    }

    try {
      // Get current population and resources
      const [ants, resources] = await Promise.all([
        this.getColonyAnts(colonyId),
        this.getColonyResources(colonyId)
      ]);

      if (!ants || ants.length === 0) {
        await this.handleColonyCollapse(colonyId, 'no_population');
        return;
      }

      // Update population statistics
      const populationStats = this.calculatePopulationStats(ants);
      const resourceStats = this.calculateResourceStats(resources, ants);

      // Store historical data
      this.updateHistory(colonyData, populationStats, resourceStats);

      // Check for population issues
      await this.checkPopulationHealth(colonyId, populationStats, resourceStats);
      await this.checkResourceSustainability(colonyId, populationStats, resourceStats);
      await this.checkColonyViability(colonyId, populationStats, resourceStats);

      // Update colony statistics
      this.updateColonyStatistics(colonyData, populationStats, resourceStats);

      colonyData.lastProcessed = Date.now();

    } catch (error) {
      console.error(`Error processing population for colony ${colonyId}:`, error);
    }
  }

  /**
   * Calculate population statistics
   */
  calculatePopulationStats(ants) {
    const stats = {
      total: ants.length,
      byStage: { egg: 0, larva: 0, pupa: 0, adult: 0, dead: 0 },
      byType: { worker: 0, scout: 0, soldier: 0, queen: 0 },
      queens: 0,
      averageAge: 0,
      averageHealth: 0,
      totalFoodConsumption: 0,
      workingAnts: 0,
      mobileAnts: 0
    };

    let totalAge = 0;
    let totalHealth = 0;

    ants.forEach(ant => {
      // Count by stage
      stats.byStage[ant.status] = (stats.byStage[ant.status] || 0) + 1;
      
      // Count by type
      stats.byType[ant.type] = (stats.byType[ant.type] || 0) + 1;
      
      // Queen count
      if (ant.is_queen) stats.queens++;
      
      // Calculate averages
      totalAge += ant.age_in_ticks;
      totalHealth += ant.health;
      
      // Food consumption
      stats.totalFoodConsumption += ant.getFoodConsumptionRate();
      
      // Working capabilities
      if (ant.canWork()) stats.workingAnts++;
      if (ant.canMove()) stats.mobileAnts++;
    });

    stats.averageAge = stats.total > 0 ? totalAge / stats.total : 0;
    stats.averageHealth = stats.total > 0 ? totalHealth / stats.total : 0;

    return stats;
  }

  /**
   * Calculate resource statistics
   */
  calculateResourceStats(resources, ants) {
    const dailyConsumption = ants.reduce((total, ant) => total + ant.getFoodConsumptionRate(), 0);
    const currentFood = resources.food || 0;
    
    return {
      currentFood,
      dailyConsumption,
      daysOfFood: dailyConsumption > 0 ? currentFood / dailyConsumption : Infinity,
      reserveRatio: dailyConsumption > 0 ? currentFood / (dailyConsumption * 10) : 1, // 10-day reserve
      efficiency: this.calculateResourceEfficiency(resources, ants),
      shortage: currentFood < dailyConsumption * PopulationConfig.STARVATION_THRESHOLD
    };
  }

  /**
   * Calculate resource efficiency
   */
  calculateResourceEfficiency(resources, ants) {
    const totalConsumption = ants.reduce((total, ant) => total + ant.getFoodConsumptionRate(), 0);
    const workingAnts = ants.filter(ant => ant.canWork()).length;
    
    if (workingAnts === 0 || totalConsumption === 0) return 0;
    
    // Efficiency = productive ants / total consumption
    return workingAnts / totalConsumption;
  }

  /**
   * Check population health
   */
  async checkPopulationHealth(colonyId, populationStats, resourceStats) {
    const { total, queens, byStage } = populationStats;
    const colonyData = this.colonies.get(colonyId);

    // Check for overpopulation
    if (total > PopulationConfig.MAX_SUSTAINABLE_POPULATION) {
      const now = Date.now();
      if (now - colonyData.alerts.lastOverpopulationAlert > 60000) { // Alert every minute
        this.emit(PopulationEvents.OVERPOPULATION, {
          colonyId,
          population: total,
          maxSustainable: PopulationConfig.MAX_SUSTAINABLE_POPULATION,
          resourceStrain: resourceStats.shortage
        });
        colonyData.alerts.lastOverpopulationAlert = now;
      }
    }

    // Check for underpopulation
    if (total < PopulationConfig.MIN_VIABLE_POPULATION) {
      this.emit(PopulationEvents.UNDERPOPULATION, {
        colonyId,
        population: total,
        minViable: PopulationConfig.MIN_VIABLE_POPULATION,
        risk: 'colony_collapse'
      });
    }

    // Check for no queens
    if (queens === 0 && byStage.adult > 0) {
      this.emit(PopulationEvents.POPULATION_CHANGE, {
        colonyId,
        event: 'no_queens',
        population: total,
        recommendation: 'promote_worker_to_queen'
      });
    }

    // Check population milestones
    for (const threshold of PopulationConfig.POPULATION_ALERT_THRESHOLDS) {
      if (total === threshold) {
        this.emit(PopulationEvents.POPULATION_MILESTONE, {
          colonyId,
          population: total,
          milestone: threshold
        });
        this.statistics.populationMilestones++;
        break;
      }
    }
  }

  /**
   * Check resource sustainability
   */
  async checkResourceSustainability(colonyId, populationStats, resourceStats) {
    const colonyData = this.colonies.get(colonyId);
    const now = Date.now();

    // Check for resource shortage
    if (resourceStats.shortage) {
      colonyData.alerts.consecutiveShortages++;
      
      if (now - colonyData.alerts.lastStarvationWarning > PopulationConfig.RESOURCE_ALERT_INTERVALS * 1000) {
        this.emit(PopulationEvents.RESOURCE_SHORTAGE, {
          colonyId,
          currentFood: resourceStats.currentFood,
          dailyConsumption: resourceStats.dailyConsumption,
          daysRemaining: resourceStats.daysOfFood,
          severity: resourceStats.daysOfFood < 1 ? 'critical' : 'warning'
        });
        
        colonyData.alerts.lastStarvationWarning = now;
        this.statistics.resourceShortages++;
      }

      // Emergency rationing
      if (resourceStats.currentFood < resourceStats.dailyConsumption * PopulationConfig.EMERGENCY_RATIONING) {
        this.emit(PopulationEvents.STARVATION_WARNING, {
          colonyId,
          population: populationStats.total,
          foodRemaining: resourceStats.currentFood,
          emergencyRationing: true
        });
      }
    } else {
      colonyData.alerts.consecutiveShortages = 0;
    }
  }

  /**
   * Check colony viability
   */
  async checkColonyViability(colonyId, populationStats, resourceStats) {
    const { total, byStage, queens } = populationStats;
    
    // Colony collapse conditions
    const collapseReasons = [];
    
    if (total === 0) {
      collapseReasons.push('no_population');
    } else if (total < PopulationConfig.MIN_VIABLE_POPULATION && byStage.adult < 2) {
      collapseReasons.push('insufficient_adults');
    } else if (queens === 0 && byStage.egg === 0 && byStage.larva === 0) {
      collapseReasons.push('no_reproduction_capability');
    } else if (resourceStats.daysOfFood < 0.5 && resourceStats.currentFood < 5) {
      collapseReasons.push('starvation');
    }

    if (collapseReasons.length > 0) {
      await this.handleColonyCollapse(colonyId, collapseReasons[0]);
    }
  }

  /**
   * Handle colony collapse
   */
  async handleColonyCollapse(colonyId, reason) {
    this.emit(PopulationEvents.COLONY_COLLAPSE, {
      colonyId,
      reason,
      timestamp: Date.now()
    });

    this.statistics.colonyCollapses++;
    console.log(`💀 Colony ${colonyId} has collapsed due to: ${reason}`);
    
    // Unregister the collapsed colony
    this.unregisterColony(colonyId);
  }

  /**
   * Update historical data
   */
  updateHistory(colonyData, populationStats, resourceStats) {
    const timestamp = Date.now();
    
    // Keep last 100 data points
    if (colonyData.populationHistory.length >= 100) {
      colonyData.populationHistory.shift();
    }
    if (colonyData.resourceHistory.length >= 100) {
      colonyData.resourceHistory.shift();
    }
    
    colonyData.populationHistory.push({
      timestamp,
      total: populationStats.total,
      adults: populationStats.byStage.adult,
      queens: populationStats.queens
    });
    
    colonyData.resourceHistory.push({
      timestamp,
      food: resourceStats.currentFood,
      consumption: resourceStats.dailyConsumption,
      efficiency: resourceStats.efficiency
    });
  }

  /**
   * Update colony statistics
   */
  updateColonyStatistics(colonyData, populationStats, resourceStats) {
    const stats = colonyData.statistics;
    
    // Update peak population
    if (populationStats.total > stats.peakPopulation) {
      stats.peakPopulation = populationStats.total;
    }
    
    // Update resource efficiency
    stats.resourceEfficiency = resourceStats.efficiency;
  }

  /**
   * Get colony ants
   */
  async getColonyAnts(colonyId) {
    try {
      const result = await Ant.findByColonyId(colonyId);
      return result.data || [];
    } catch (error) {
      console.error(`Error loading ants for colony ${colonyId}:`, error);
      return [];
    }
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
      console.error(`Error loading resources for colony ${colonyId}:`, error);
    }
    return { food: 0, water: 0, wood: 0, stone: 0, minerals: 0 };
  }

  /**
   * Get population management statistics
   */
  getStatistics() {
    const colonyData = {};
    for (const [colonyId, data] of this.colonies) {
      colonyData[colonyId] = {
        registeredAt: data.registeredAt,
        lastProcessed: data.lastProcessed,
        statistics: data.statistics,
        populationHistory: data.populationHistory.slice(-10), // Last 10 data points
        resourceHistory: data.resourceHistory.slice(-10),
        alerts: data.alerts
      };
    }
    
    return {
      global: this.statistics,
      colonies: colonyData,
      config: PopulationConfig,
      activeColonies: this.colonies.size
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    Object.assign(PopulationConfig, newConfig);
    console.log('🔧 Updated population management configuration:', newConfig);
  }

  /**
   * Get population recommendations for a colony
   */
  async getPopulationRecommendations(colonyId) {
    const colonyData = this.colonies.get(colonyId);
    if (!colonyData) return [];

    const [ants, resources] = await Promise.all([
      this.getColonyAnts(colonyId),
      this.getColonyResources(colonyId)
    ]);

    const populationStats = this.calculatePopulationStats(ants);
    const resourceStats = this.calculateResourceStats(resources, ants);
    
    const recommendations = [];

    // Population recommendations
    if (populationStats.total < PopulationConfig.OPTIMAL_POPULATION_RANGE[0]) {
      recommendations.push({
        type: 'population',
        priority: 'high',
        message: 'Colony population is below optimal range. Consider encouraging reproduction.',
        action: 'increase_egg_production'
      });
    }

    if (populationStats.queens === 0) {
      recommendations.push({
        type: 'reproduction',
        priority: 'critical',
        message: 'No queens available for reproduction. Promote a worker to queen immediately.',
        action: 'promote_queen'
      });
    }

    // Resource recommendations
    if (resourceStats.daysOfFood < 3) {
      recommendations.push({
        type: 'resources',
        priority: 'critical',
        message: `Only ${resourceStats.daysOfFood.toFixed(1)} days of food remaining. Increase foraging immediately.`,
        action: 'increase_foraging'
      });
    }

    if (resourceStats.efficiency < 0.5) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        message: 'Resource efficiency is low. Consider optimizing ant roles and reducing non-productive population.',
        action: 'optimize_roles'
      });
    }

    return recommendations;
  }
}

// Export the class and configuration
module.exports = {
  PopulationManager,
  PopulationEvents,
  PopulationConfig
}; 
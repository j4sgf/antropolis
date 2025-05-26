const { EventEmitter } = require('events');
const ColonyStatistics = require('../models/ColonyStatistics');
const ColonyEvents = require('../models/ColonyEvents');

/**
 * Statistics Manager
 * Handles real-time collection and tracking of colony statistics during gameplay
 */
class StatisticsManager extends EventEmitter {
  constructor() {
    super();
    this.trackedColonies = new Map(); // colonyId -> tracking data
    this.statisticsCache = new Map(); // colonyId -> cached stats
    this.eventBuffer = new Map(); // colonyId -> buffered events
    this.trackingEnabled = true;
    this.batchSize = 10;
    this.flushInterval = 30000; // 30 seconds
    
    // Start periodic flush
    this.flushTimer = setInterval(() => {
      this.flushBufferedEvents();
    }, this.flushInterval);

    console.log('📊 Statistics Manager initialized');
  }

  /**
   * Start tracking statistics for a colony
   */
  startTracking(colonyId, initialData = {}) {
    if (this.trackedColonies.has(colonyId)) {
      console.log(`📊 Colony ${colonyId} already being tracked`);
      return;
    }

    const trackingData = {
      colonyId,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      currentTick: 0,
      statistics: {
        population: 0,
        food_harvested: 0,
        food_consumed: 0,
        battles_fought: 0,
        battles_won: 0,
        structures_built: 0,
        structures_destroyed: 0,
        ants_born: 0,
        ants_died: 0,
        territory_explored: 0,
        evolution_points_earned: 0,
        ...initialData
      },
      previousValues: {},
      eventQueue: [],
      milestones: new Set()
    };

    this.trackedColonies.set(colonyId, trackingData);
    this.eventBuffer.set(colonyId, []);
    
    // Log colony tracking start event
    this.logEvent(colonyId, {
      eventType: 'system',
      eventSubtype: 'tracking_started',
      title: 'Statistics Tracking Started',
      description: 'Colony statistics tracking has been initialized',
      importanceLevel: 1
    });

    console.log(`📊 Started tracking statistics for colony ${colonyId}`);
  }

  /**
   * Stop tracking statistics for a colony
   */
  stopTracking(colonyId) {
    if (!this.trackedColonies.has(colonyId)) {
      return;
    }

    // Flush any remaining events
    this.flushColonyEvents(colonyId);

    // Log tracking stop event
    this.logEvent(colonyId, {
      eventType: 'system',
      eventSubtype: 'tracking_stopped',
      title: 'Statistics Tracking Stopped',
      description: 'Colony statistics tracking has been stopped',
      importanceLevel: 1
    });

    this.trackedColonies.delete(colonyId);
    this.statisticsCache.delete(colonyId);
    this.eventBuffer.delete(colonyId);

    console.log(`📊 Stopped tracking statistics for colony ${colonyId}`);
  }

  /**
   * Update a statistic for a colony
   */
  updateStatistic(colonyId, statType, newValue, options = {}) {
    if (!this.trackingEnabled || !this.trackedColonies.has(colonyId)) {
      return;
    }

    const trackingData = this.trackedColonies.get(colonyId);
    const currentValue = trackingData.statistics[statType] || 0;
    const previousValue = trackingData.previousValues[statType] || currentValue;

    // Update the statistic
    trackingData.statistics[statType] = newValue;
    trackingData.previousValues[statType] = currentValue;
    trackingData.lastUpdate = Date.now();
    trackingData.currentTick = options.gameTick || trackingData.currentTick;

    // Determine category
    const category = this.getStatisticCategory(statType);

    // Record the statistic in the database
    const recordOptions = {
      subtype: options.subtype,
      description: options.description,
      gameTick: trackingData.currentTick,
      recordedAt: new Date().toISOString()
    };

    // Queue the statistic for batch recording
    this.queueStatisticRecord(colonyId, statType, category, newValue, recordOptions);

    // Check for significant changes or milestones
    this.checkForMilestones(colonyId, statType, newValue, currentValue);
    this.checkForSignificantChanges(colonyId, statType, newValue, previousValue, options);

    // Emit event for real-time updates
    this.emit('statisticUpdated', {
      colonyId,
      statType,
      newValue,
      previousValue: currentValue,
      category,
      timestamp: trackingData.lastUpdate
    });
  }

  /**
   * Increment a statistic by a value
   */
  incrementStatistic(colonyId, statType, increment = 1, options = {}) {
    if (!this.trackedColonies.has(colonyId)) {
      return;
    }

    const trackingData = this.trackedColonies.get(colonyId);
    const currentValue = trackingData.statistics[statType] || 0;
    const newValue = currentValue + increment;

    this.updateStatistic(colonyId, statType, newValue, options);
  }

  /**
   * Log an event for a colony
   */
  logEvent(colonyId, eventData) {
    if (!this.trackingEnabled) {
      return;
    }

    const event = {
      ...eventData,
      colonyId,
      timestamp: Date.now(),
      gameTick: this.getColonyTick(colonyId)
    };

    // Add to event buffer for batch processing
    if (!this.eventBuffer.has(colonyId)) {
      this.eventBuffer.set(colonyId, []);
    }
    this.eventBuffer.get(colonyId).push(event);

    // Emit for real-time processing
    this.emit('eventLogged', event);

    console.log(`📊 Event logged for colony ${colonyId}: ${eventData.title}`);
  }

  /**
   * Log specific event types with convenience methods
   */
  logPopulationChange(colonyId, oldCount, newCount, changeType = 'unknown') {
    const change = newCount - oldCount;
    const changeDirection = change > 0 ? 'growth' : change < 0 ? 'decline' : 'stable';

    this.updateStatistic(colonyId, 'population', newCount);

    if (changeType === 'birth') {
      this.incrementStatistic(colonyId, 'ants_born', Math.abs(change));
    } else if (changeType === 'death') {
      this.incrementStatistic(colonyId, 'ants_died', Math.abs(change));
    }

    this.logEvent(colonyId, {
      eventType: 'population',
      eventSubtype: changeDirection,
      title: `Population ${changeDirection}`,
      description: `Colony population changed from ${oldCount} to ${newCount} (${change > 0 ? '+' : ''}${change})`,
      importanceLevel: Math.abs(change) > 10 ? 2 : 1,
      eventData: {
        previousCount: oldCount,
        newCount: newCount,
        changeAmount: change,
        changeType: changeType
      }
    });
  }

  logResourceHarvested(colonyId, resourceType, amount) {
    this.incrementStatistic(colonyId, 'food_harvested', amount, {
      subtype: resourceType,
      description: `Harvested ${amount} ${resourceType}`
    });

    this.logEvent(colonyId, {
      eventType: 'resource',
      eventSubtype: 'harvested',
      title: `Harvested ${resourceType}`,
      description: `Collected ${amount} units of ${resourceType}`,
      importanceLevel: 1,
      eventData: {
        resourceType: resourceType,
        amount: amount,
        total: this.getStatistic(colonyId, 'food_harvested')
      }
    });
  }

  logBattleResult(colonyId, battleResult) {
    this.incrementStatistic(colonyId, 'battles_fought');
    
    if (battleResult.outcome === 'victory') {
      this.incrementStatistic(colonyId, 'battles_won');
    }

    // Use the ColonyEvents helper method
    ColonyEvents.logCombatEvent(colonyId, battleResult, {
      gameTick: this.getColonyTick(colonyId),
      occurredAt: new Date().toISOString()
    });
  }

  logStructureBuilt(colonyId, structureData) {
    this.incrementStatistic(colonyId, 'structures_built');

    // Use the ColonyEvents helper method
    ColonyEvents.logConstructionEvent(colonyId, {
      action: 'built',
      ...structureData
    }, {
      gameTick: this.getColonyTick(colonyId),
      occurredAt: new Date().toISOString()
    });
  }

  /**
   * Get current statistic value
   */
  getStatistic(colonyId, statType) {
    const trackingData = this.trackedColonies.get(colonyId);
    return trackingData ? trackingData.statistics[statType] || 0 : 0;
  }

  /**
   * Get all statistics for a colony
   */
  getColonyStatistics(colonyId) {
    const trackingData = this.trackedColonies.get(colonyId);
    if (!trackingData) {
      return null;
    }

    return {
      colonyId,
      statistics: { ...trackingData.statistics },
      tracking: {
        startTime: trackingData.startTime,
        lastUpdate: trackingData.lastUpdate,
        currentTick: trackingData.currentTick,
        uptime: Date.now() - trackingData.startTime
      }
    };
  }

  /**
   * Flush buffered events to database
   */
  async flushBufferedEvents() {
    for (const [colonyId, events] of this.eventBuffer.entries()) {
      if (events.length > 0) {
        await this.flushColonyEvents(colonyId);
      }
    }
  }

  /**
   * Flush events for a specific colony
   */
  async flushColonyEvents(colonyId) {
    const events = this.eventBuffer.get(colonyId);
    if (!events || events.length === 0) {
      return;
    }

    try {
      // Process events in batches
      const batchSize = this.batchSize;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        for (const event of batch) {
          await ColonyEvents.createEvent(colonyId, {
            eventType: event.eventType,
            eventSubtype: event.eventSubtype,
            title: event.title,
            description: event.description,
            importanceLevel: event.importanceLevel || 1,
            eventData: event.eventData || {},
            relatedEntityId: event.relatedEntityId,
            relatedEntityType: event.relatedEntityType,
            locationX: event.locationX,
            locationY: event.locationY,
            gameTick: event.gameTick,
            occurredAt: event.occurredAt || new Date(event.timestamp).toISOString()
          });
        }
      }

      // Clear the buffer
      this.eventBuffer.set(colonyId, []);
      
      console.log(`📊 Flushed ${events.length} events for colony ${colonyId}`);
    } catch (error) {
      console.error(`Error flushing events for colony ${colonyId}:`, error);
    }
  }

  /**
   * Helper methods
   */
  getStatisticCategory(statType) {
    const categories = {
      population: 'population',
      ants_born: 'population',
      ants_died: 'population',
      food_harvested: 'resources',
      food_consumed: 'resources',
      food_storage: 'resources',
      battles_fought: 'combat',
      battles_won: 'combat',
      structures_built: 'construction',
      structures_destroyed: 'construction',
      territory_explored: 'exploration',
      evolution_points_earned: 'evolution'
    };

    return categories[statType] || 'general';
  }

  getColonyTick(colonyId) {
    const trackingData = this.trackedColonies.get(colonyId);
    return trackingData ? trackingData.currentTick : 0;
  }

  async queueStatisticRecord(colonyId, statType, category, value, options) {
    try {
      await ColonyStatistics.recordStatistic(colonyId, statType, category, value, options);
    } catch (error) {
      console.error(`Error recording statistic ${statType} for colony ${colonyId}:`, error);
    }
  }

  checkForMilestones(colonyId, statType, newValue, previousValue) {
    const trackingData = this.trackedColonies.get(colonyId);
    if (!trackingData) return;

    // Define milestone thresholds
    const milestones = {
      population: [25, 50, 100, 250, 500, 1000],
      food_harvested: [100, 1000, 10000, 100000],
      battles_won: [1, 5, 15, 50],
      structures_built: [1, 5, 15, 30]
    };

    const thresholds = milestones[statType];
    if (!thresholds) return;

    // Check if we crossed any thresholds
    for (const threshold of thresholds) {
      const milestoneKey = `${statType}_${threshold}`;
      
      if (newValue >= threshold && previousValue < threshold && !trackingData.milestones.has(milestoneKey)) {
        trackingData.milestones.add(milestoneKey);
        
        this.logEvent(colonyId, {
          eventType: 'milestone',
          eventSubtype: statType,
          title: `Milestone Reached!`,
          description: `Reached ${threshold} ${statType.replace('_', ' ')}`,
          importanceLevel: 3,
          eventData: {
            statType: statType,
            threshold: threshold,
            achievedValue: newValue
          }
        });

        console.log(`🏆 Milestone reached for colony ${colonyId}: ${statType} = ${threshold}`);
      }
    }
  }

  checkForSignificantChanges(colonyId, statType, newValue, previousValue, options) {
    const change = newValue - previousValue;
    const percentChange = previousValue > 0 ? Math.abs(change / previousValue) * 100 : 0;

    // Log significant changes (>10% change or large absolute change)
    if (percentChange > 10 || Math.abs(change) > 50) {
      this.logEvent(colonyId, {
        eventType: 'statistics',
        eventSubtype: 'significant_change',
        title: `Significant ${statType.replace('_', ' ')} change`,
        description: `${statType.replace('_', ' ')} changed from ${previousValue} to ${newValue} (${change > 0 ? '+' : ''}${change})`,
        importanceLevel: 2,
        eventData: {
          statType: statType,
          previousValue: previousValue,
          newValue: newValue,
          change: change,
          percentChange: percentChange
        }
      });
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush all remaining events
    this.flushBufferedEvents();
    
    this.trackedColonies.clear();
    this.statisticsCache.clear();
    this.eventBuffer.clear();

    console.log('📊 Statistics Manager destroyed');
  }
}

// Singleton instance
let statisticsManagerInstance = null;

function getStatisticsManager() {
  if (!statisticsManagerInstance) {
    statisticsManagerInstance = new StatisticsManager();
  }
  return statisticsManagerInstance;
}

module.exports = {
  StatisticsManager,
  getStatisticsManager
}; 
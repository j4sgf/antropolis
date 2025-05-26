const { supabase, handleDatabaseError } = require('../config/database');

/**
 * Colony Events Model
 * Handles database operations for colony timeline and event tracking
 */
class ColonyEvents {
  constructor(data = {}) {
    this.id = data.id;
    this.colony_id = data.colony_id;
    this.event_type = data.event_type;
    this.event_subtype = data.event_subtype;
    this.title = data.title;
    this.description = data.description;
    this.importance_level = data.importance_level || 1;
    this.event_data = data.event_data || {};
    this.related_entity_id = data.related_entity_id;
    this.related_entity_type = data.related_entity_type;
    this.location_x = data.location_x;
    this.location_y = data.location_y;
    this.occurred_at = data.occurred_at;
    this.game_tick = data.game_tick || 0;
    this.created_at = data.created_at;
  }

  /**
   * Create a new colony event
   */
  static async createEvent(colonyId, eventData) {
    try {
      const eventRecord = {
        colony_id: colonyId,
        event_type: eventData.eventType,
        event_subtype: eventData.eventSubtype,
        title: eventData.title,
        description: eventData.description,
        importance_level: eventData.importanceLevel || 1,
        event_data: eventData.eventData || {},
        related_entity_id: eventData.relatedEntityId,
        related_entity_type: eventData.relatedEntityType,
        location_x: eventData.locationX,
        location_y: eventData.locationY,
        game_tick: eventData.gameTick || 0,
        occurred_at: eventData.occurredAt || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('colony_events')
        .insert([eventRecord])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: new ColonyEvents(data)
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to create colony event');
    }
  }

  /**
   * Get events for a colony timeline
   */
  static async getColonyTimeline(colonyId, options = {}) {
    try {
      let query = supabase
        .from('colony_events')
        .select('*')
        .eq('colony_id', colonyId);

      // Apply filters
      if (options.eventType) {
        query = query.eq('event_type', options.eventType);
      }
      if (options.importanceLevel) {
        query = query.gte('importance_level', options.importanceLevel);
      }
      if (options.startDate) {
        query = query.gte('occurred_at', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('occurred_at', options.endDate);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Apply ordering
      const orderBy = options.orderBy || 'occurred_at';
      const orderDirection = options.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      const { data, error } = await query;
      if (error) throw error;

      return {
        success: true,
        data: data.map(event => new ColonyEvents(event))
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get colony timeline');
    }
  }

  /**
   * Get events grouped by time periods
   */
  static async getTimelineByPeriod(colonyId, period = 'day', options = {}) {
    try {
      let dateFormat;
      switch (period) {
        case 'hour':
          dateFormat = 'YYYY-MM-DD HH24:00:00';
          break;
        case 'day':
          dateFormat = 'YYYY-MM-DD';
          break;
        case 'week':
          dateFormat = 'YYYY-WW';
          break;
        case 'month':
          dateFormat = 'YYYY-MM';
          break;
        default:
          dateFormat = 'YYYY-MM-DD';
      }

      // Raw SQL query for grouping by time periods
      const { data, error } = await supabase.rpc('get_timeline_by_period', {
        p_colony_id: colonyId,
        p_date_format: dateFormat,
        p_limit: options.limit || 100
      });

      if (error) {
        // Fallback to basic query if stored procedure doesn't exist
        return await ColonyEvents.getColonyTimeline(colonyId, options);
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get timeline by period');
    }
  }

  /**
   * Get milestone events
   */
  static async getMilestoneEvents(colonyId, options = {}) {
    // Directly call getColonyTimeline with milestone filter
    const result = await ColonyEvents.getColonyTimeline(colonyId, {
      ...options,
      eventType: 'milestone',
      importanceLevel: 3 // High importance or above
    });

    return result;
  }

  /**
   * Get recent activity (last 24 hours)
   */
  static async getRecentActivity(colonyId, hours = 24) {
    try {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);

      const result = await ColonyEvents.getColonyTimeline(colonyId, {
        startDate: startDate.toISOString(),
        limit: 50,
        orderDirection: 'desc'
      });

      return result;
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get recent activity');
    }
  }

  /**
   * Get event statistics
   */
  static async getEventStatistics(colonyId, options = {}) {
    try {
      const { data: events, error } = await supabase
        .from('colony_events')
        .select('event_type, event_subtype, importance_level, occurred_at')
        .eq('colony_id', colonyId);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        total: events.length,
        byType: {},
        byImportance: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        timeline: {
          firstEvent: null,
          lastEvent: null,
          totalDays: 0
        }
      };

      // Process events
      let firstDate = null;
      let lastDate = null;

      for (const event of events) {
        // Count by type
        stats.byType[event.event_type] = (stats.byType[event.event_type] || 0) + 1;

        // Count by importance
        switch (event.importance_level) {
          case 1:
            stats.byImportance.low++;
            break;
          case 2:
            stats.byImportance.medium++;
            break;
          case 3:
            stats.byImportance.high++;
            break;
          case 4:
            stats.byImportance.critical++;
            break;
        }

        // Track timeline
        const eventDate = new Date(event.occurred_at);
        if (!firstDate || eventDate < firstDate) {
          firstDate = eventDate;
          stats.timeline.firstEvent = event.occurred_at;
        }
        if (!lastDate || eventDate > lastDate) {
          lastDate = eventDate;
          stats.timeline.lastEvent = event.occurred_at;
        }
      }

      // Calculate total days
      if (firstDate && lastDate) {
        const diffTime = Math.abs(lastDate - firstDate);
        stats.timeline.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get event statistics');
    }
  }

  /**
   * Helper methods for common event types
   */
  static async logCombatEvent(colonyId, battleResult, options = {}) {
    const eventData = {
      eventType: 'combat',
      eventSubtype: battleResult.outcome, // 'victory', 'defeat', 'draw'
      title: `Battle ${battleResult.outcome.charAt(0).toUpperCase() + battleResult.outcome.slice(1)}`,
      description: `${battleResult.outcome === 'victory' ? 'Won' : battleResult.outcome === 'defeat' ? 'Lost' : 'Drew'} battle against ${battleResult.enemyColony || 'enemy colony'}`,
      importanceLevel: battleResult.outcome === 'victory' ? 3 : 2,
      eventData: {
        battleId: battleResult.battleId,
        enemyColony: battleResult.enemyColony,
        casualties: battleResult.casualties,
        resourcesGained: battleResult.resourcesGained
      },
      ...options
    };

    return await ColonyEvents.createEvent(colonyId, eventData);
  }

  static async logConstructionEvent(colonyId, structureData, options = {}) {
    const eventData = {
      eventType: 'construction',
      eventSubtype: structureData.action, // 'built', 'upgraded', 'destroyed'
      title: `${structureData.action === 'built' ? 'Built' : structureData.action === 'upgraded' ? 'Upgraded' : 'Lost'} ${structureData.structureType}`,
      description: `${structureData.action} a ${structureData.structureType} structure`,
      importanceLevel: structureData.action === 'built' ? 2 : 1,
      eventData: {
        structureType: structureData.structureType,
        structureId: structureData.structureId,
        level: structureData.level,
        cost: structureData.cost
      },
      relatedEntityId: structureData.structureId,
      relatedEntityType: 'structure',
      locationX: structureData.x,
      locationY: structureData.y,
      ...options
    };

    return await ColonyEvents.createEvent(colonyId, eventData);
  }

  static async logDiscoveryEvent(colonyId, discoveryData, options = {}) {
    const eventData = {
      eventType: 'discovery',
      eventSubtype: discoveryData.type, // 'resource', 'area', 'enemy'
      title: `Discovered ${discoveryData.name}`,
      description: discoveryData.description || `Found ${discoveryData.name}`,
      importanceLevel: 2,
      eventData: {
        discoveryType: discoveryData.type,
        discoveryName: discoveryData.name,
        value: discoveryData.value
      },
      locationX: discoveryData.x,
      locationY: discoveryData.y,
      ...options
    };

    return await ColonyEvents.createEvent(colonyId, eventData);
  }

  static async logPopulationEvent(colonyId, populationData, options = {}) {
    const eventData = {
      eventType: 'population',
      eventSubtype: populationData.change, // 'growth', 'decline', 'milestone'
      title: populationData.title || `Population ${populationData.change}`,
      description: populationData.description,
      importanceLevel: populationData.change === 'milestone' ? 3 : 1,
      eventData: {
        previousCount: populationData.previousCount,
        newCount: populationData.newCount,
        changeAmount: populationData.changeAmount,
        changeType: populationData.changeType // 'birth', 'death', 'evolution'
      },
      ...options
    };

    return await ColonyEvents.createEvent(colonyId, eventData);
  }

  /**
   * Delete old events (cleanup)
   */
  static async cleanupOldEvents(olderThanDays = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('colony_events')
        .delete()
        .lt('occurred_at', cutoffDate.toISOString())
        .neq('importance_level', 4); // Don't delete critical events

      if (error) throw error;

      return {
        success: true,
        data: { deletedCount: data?.length || 0 }
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to cleanup old events');
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      colony_id: this.colony_id,
      event_type: this.event_type,
      event_subtype: this.event_subtype,
      title: this.title,
      description: this.description,
      importance_level: this.importance_level,
      event_data: this.event_data,
      related_entity_id: this.related_entity_id,
      related_entity_type: this.related_entity_type,
      location_x: this.location_x,
      location_y: this.location_y,
      occurred_at: this.occurred_at,
      game_tick: this.game_tick,
      created_at: this.created_at
    };
  }
}

module.exports = ColonyEvents; 
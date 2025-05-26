const { supabase, handleDatabaseError } = require('../config/database');

/**
 * Colony Statistics Model
 * Handles database operations for colony statistics tracking
 */
class ColonyStatistics {
  constructor(data = {}) {
    this.id = data.id;
    this.colony_id = data.colony_id;
    this.stat_type = data.stat_type;
    this.stat_category = data.stat_category;
    this.stat_subtype = data.stat_subtype;
    this.value_int = data.value_int || 0;
    this.value_float = data.value_float || 0.0;
    this.value_json = data.value_json || {};
    this.description = data.description;
    this.recorded_at = data.recorded_at;
    this.game_tick = data.game_tick || 0;
    this.created_at = data.created_at;
  }

  /**
   * Record a new statistic for a colony
   */
  static async recordStatistic(colonyId, statType, statCategory, value, options = {}) {
    try {
      const statisticData = {
        colony_id: colonyId,
        stat_type: statType,
        stat_category: statCategory,
        stat_subtype: options.subtype,
        description: options.description,
        game_tick: options.gameTick || 0,
        recorded_at: options.recordedAt || new Date().toISOString()
      };

      // Determine value type and set appropriate field
      if (typeof value === 'number') {
        if (Number.isInteger(value)) {
          statisticData.value_int = value;
        } else {
          statisticData.value_float = value;
        }
      } else {
        statisticData.value_json = value;
      }

      const { data, error } = await supabase
        .from('colony_statistics')
        .insert([statisticData])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: new ColonyStatistics(data)
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to record statistic');
    }
  }

  /**
   * Get statistics for a colony
   */
  static async getColonyStatistics(colonyId, options = {}) {
    try {
      let query = supabase
        .from('colony_statistics')
        .select('*')
        .eq('colony_id', colonyId);

      // Apply filters
      if (options.category) {
        query = query.eq('stat_category', options.category);
      }
      if (options.type) {
        query = query.eq('stat_type', options.type);
      }
      if (options.startDate) {
        query = query.gte('recorded_at', options.startDate);
      }
      if (options.endDate) {
        query = query.lte('recorded_at', options.endDate);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      // Apply ordering
      const orderBy = options.orderBy || 'recorded_at';
      const orderDirection = options.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      const { data, error } = await query;
      if (error) throw error;

      return {
        success: true,
        data: data.map(stat => new ColonyStatistics(stat))
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get colony statistics');
    }
  }

  /**
   * Get aggregated statistics for a colony
   */
  static async getAggregatedStatistics(colonyId, options = {}) {
    try {
      // Get latest values for each stat type
      const { data: latestStats, error: latestError } = await supabase
        .from('colony_statistics')
        .select('stat_type, stat_category, value_int, value_float, value_json, recorded_at')
        .eq('colony_id', colonyId)
        .order('recorded_at', { ascending: false });

      if (latestError) throw latestError;

      // Group by stat type and get the most recent value
      const aggregated = {};
      const seenTypes = new Set();

      for (const stat of latestStats) {
        if (!seenTypes.has(stat.stat_type)) {
          const category = stat.stat_category;
          if (!aggregated[category]) {
            aggregated[category] = {};
          }

          // Get the actual value based on type
          let value;
          if (stat.value_json && Object.keys(stat.value_json).length > 0) {
            value = stat.value_json;
          } else if (stat.value_float !== 0) {
            value = stat.value_float;
          } else {
            value = stat.value_int;
          }

          aggregated[category][stat.stat_type] = {
            value: value,
            lastUpdated: stat.recorded_at
          };

          seenTypes.add(stat.stat_type);
        }
      }

      // Get summary statistics
      const summaryStats = await ColonyStatistics.getSummaryStatistics(colonyId);

      return {
        success: true,
        data: {
          aggregated: aggregated,
          summary: summaryStats.data || {}
        }
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get aggregated statistics');
    }
  }

  /**
   * Get summary statistics for a colony
   */
  static async getSummaryStatistics(colonyId) {
    try {
      // Use raw SQL for complex aggregations
      const { data, error } = await supabase.rpc('get_colony_summary_stats', {
        p_colony_id: colonyId
      });

      if (error) {
        // Fallback to basic queries if stored procedure doesn't exist
        const basicStats = await ColonyStatistics.getBasicSummaryStats(colonyId);
        return basicStats;
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get summary statistics');
    }
  }

  /**
   * Basic summary statistics (fallback)
   */
  static async getBasicSummaryStats(colonyId) {
    try {
      const { data: stats, error } = await supabase
        .from('colony_statistics')
        .select('stat_type, stat_category, value_int, value_float')
        .eq('colony_id', colonyId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      const summary = {
        totalRecords: stats.length,
        categories: {},
        firstRecorded: null,
        lastRecorded: null
      };

      // Calculate basic aggregations
      for (const stat of stats) {
        const category = stat.stat_category;
        if (!summary.categories[category]) {
          summary.categories[category] = {
            count: 0,
            types: new Set()
          };
        }

        summary.categories[category].count++;
        summary.categories[category].types.add(stat.stat_type);
      }

      // Convert sets to arrays
      Object.keys(summary.categories).forEach(category => {
        summary.categories[category].types = Array.from(summary.categories[category].types);
      });

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get basic summary statistics');
    }
  }

  /**
   * Get historical data for charting
   */
  static async getHistoricalData(colonyId, statType, options = {}) {
    try {
      const timeframe = options.timeframe || '24h'; // 24h, 7d, 30d, all
      const dataPoints = options.dataPoints || 50;

      let query = supabase
        .from('colony_statistics')
        .select('value_int, value_float, value_json, recorded_at, game_tick')
        .eq('colony_id', colonyId)
        .eq('stat_type', statType)
        .order('recorded_at', { ascending: true });

      // Apply timeframe filter
      if (timeframe !== 'all') {
        const intervals = {
          '24h': '24 hours',
          '7d': '7 days',
          '30d': '30 days'
        };
        
        if (intervals[timeframe]) {
          const startDate = new Date();
          startDate.setTime(startDate.getTime() - (timeframe === '24h' ? 24*60*60*1000 : 
                                                   timeframe === '7d' ? 7*24*60*60*1000 : 
                                                   30*24*60*60*1000));
          query = query.gte('recorded_at', startDate.toISOString());
        }
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process data for charting
      const chartData = data.map(point => {
        let value;
        if (point.value_json && Object.keys(point.value_json).length > 0) {
          value = point.value_json;
        } else if (point.value_float !== 0) {
          value = point.value_float;
        } else {
          value = point.value_int;
        }

        return {
          timestamp: point.recorded_at,
          gameTick: point.game_tick,
          value: value,
          date: new Date(point.recorded_at)
        };
      });

      // Sample data if too many points
      let sampledData = chartData;
      if (chartData.length > dataPoints) {
        const step = Math.ceil(chartData.length / dataPoints);
        sampledData = chartData.filter((_, index) => index % step === 0);
      }

      return {
        success: true,
        data: sampledData
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to get historical data');
    }
  }

  /**
   * Delete old statistics (cleanup)
   */
  static async cleanupOldStatistics(olderThanDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data, error } = await supabase
        .from('colony_statistics')
        .delete()
        .lt('recorded_at', cutoffDate.toISOString());

      if (error) throw error;

      return {
        success: true,
        data: { deletedCount: data?.length || 0 }
      };
    } catch (error) {
      return handleDatabaseError(error, 'Failed to cleanup old statistics');
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      colony_id: this.colony_id,
      stat_type: this.stat_type,
      stat_category: this.stat_category,
      stat_subtype: this.stat_subtype,
      value_int: this.value_int,
      value_float: this.value_float,
      value_json: this.value_json,
      description: this.description,
      recorded_at: this.recorded_at,
      game_tick: this.game_tick,
      created_at: this.created_at
    };
  }
}

module.exports = ColonyStatistics; 
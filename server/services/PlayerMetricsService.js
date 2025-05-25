/**
 * PlayerMetricsService for tracking player performance metrics
 * Used for dynamic difficulty adjustment of AI colonies
 */

class PlayerMetricsService {
  constructor() {
    this.playerMetrics = new Map(); // Store metrics per player
    this.globalMetrics = {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      averageGameLength: 100,
      lastUpdated: new Date()
    };
  }

  /**
   * Initialize metrics for a new player
   */
  initializePlayer(playerId) {
    if (!this.playerMetrics.has(playerId)) {
      this.playerMetrics.set(playerId, {
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        total_game_time: 0,
        average_game_length: 100,
        resource_efficiency: 1.0,
        expansion_rate: 1.0,
        military_victories: 0,
        economic_victories: 0,
        last_game_timestamp: null,
        win_streak: 0,
        loss_streak: 0,
        performance_trend: 'stable' // 'improving', 'declining', 'stable'
      });
    }
    return this.playerMetrics.get(playerId);
  }

  /**
   * Record the outcome of a game
   */
  recordGameOutcome(playerId, gameData) {
    const metrics = this.initializePlayer(playerId);
    
    // Update basic game stats
    metrics.games_played++;
    metrics.total_game_time += gameData.game_length || 100;
    metrics.average_game_length = metrics.total_game_time / metrics.games_played;
    metrics.last_game_timestamp = new Date().toISOString();

    // Record win/loss
    if (gameData.victory) {
      metrics.games_won++;
      metrics.win_streak++;
      metrics.loss_streak = 0;
      
      // Record victory type
      if (gameData.victory_type === 'military') {
        metrics.military_victories++;
      } else if (gameData.victory_type === 'economic') {
        metrics.economic_victories++;
      }
    } else {
      metrics.games_lost++;
      metrics.loss_streak++;
      metrics.win_streak = 0;
    }

    // Update efficiency metrics
    if (gameData.resource_efficiency) {
      metrics.resource_efficiency = (metrics.resource_efficiency + gameData.resource_efficiency) / 2;
    }
    
    if (gameData.expansion_rate) {
      metrics.expansion_rate = (metrics.expansion_rate + gameData.expansion_rate) / 2;
    }

    // Update performance trend
    this.updatePerformanceTrend(playerId, metrics);

    // Update global metrics
    this.updateGlobalMetrics(gameData);

    return metrics;
  }

  /**
   * Update performance trend based on recent games
   */
  updatePerformanceTrend(playerId, metrics) {
    const recentGames = Math.min(10, metrics.games_played);
    const winRate = metrics.games_won / metrics.games_played;
    
    if (metrics.win_streak >= 3 || winRate > 0.7) {
      metrics.performance_trend = 'improving';
    } else if (metrics.loss_streak >= 3 || winRate < 0.3) {
      metrics.performance_trend = 'declining';
    } else {
      metrics.performance_trend = 'stable';
    }
  }

  /**
   * Update global metrics
   */
  updateGlobalMetrics(gameData) {
    this.globalMetrics.totalGames++;
    if (gameData.victory) {
      this.globalMetrics.totalWins++;
    } else {
      this.globalMetrics.totalLosses++;
    }
    
    // Update average game length
    const totalGameTime = this.globalMetrics.averageGameLength * (this.globalMetrics.totalGames - 1) + (gameData.game_length || 100);
    this.globalMetrics.averageGameLength = totalGameTime / this.globalMetrics.totalGames;
    
    this.globalMetrics.lastUpdated = new Date();
  }

  /**
   * Get player metrics
   */
  getPlayerMetrics(playerId) {
    return this.playerMetrics.get(playerId) || this.initializePlayer(playerId);
  }

  /**
   * Get performance data for difficulty adjustment
   */
  getPerformanceData(playerId) {
    const metrics = this.getPlayerMetrics(playerId);
    
    return {
      win_rate: metrics.games_played > 0 ? metrics.games_won / metrics.games_played : 0.5,
      average_game_length: metrics.average_game_length,
      resource_efficiency: metrics.resource_efficiency,
      expansion_rate: metrics.expansion_rate,
      performance_trend: metrics.performance_trend,
      recent_streak: Math.max(metrics.win_streak, metrics.loss_streak),
      games_played: metrics.games_played
    };
  }

  /**
   * Get global performance data
   */
  getGlobalPerformanceData() {
    return {
      total_games: this.globalMetrics.totalGames,
      global_win_rate: this.globalMetrics.totalGames > 0 ? 
        this.globalMetrics.totalWins / this.globalMetrics.totalGames : 0.5,
      average_game_length: this.globalMetrics.averageGameLength,
      last_updated: this.globalMetrics.lastUpdated
    };
  }

  /**
   * Calculate recommended difficulty level
   */
  getRecommendedDifficulty(playerId) {
    const performance = this.getPerformanceData(playerId);
    
    // Base difficulty on win rate and performance trend
    if (performance.win_rate > 0.8 && performance.performance_trend === 'improving') {
      return 'nightmare';
    } else if (performance.win_rate > 0.6) {
      return 'hard';
    } else if (performance.win_rate > 0.4) {
      return 'medium';
    } else {
      return 'easy';
    }
  }

  /**
   * Reset player metrics (for testing or new seasons)
   */
  resetPlayerMetrics(playerId) {
    this.playerMetrics.delete(playerId);
    return this.initializePlayer(playerId);
  }

  /**
   * Get all player metrics (for admin/debugging)
   */
  getAllMetrics() {
    const allMetrics = {};
    for (const [playerId, metrics] of this.playerMetrics) {
      allMetrics[playerId] = metrics;
    }
    return {
      players: allMetrics,
      global: this.globalMetrics
    };
  }

  /**
   * Record resource gathering efficiency
   */
  recordResourceEfficiency(playerId, efficiency) {
    const metrics = this.getPlayerMetrics(playerId);
    metrics.resource_efficiency = (metrics.resource_efficiency + efficiency) / 2;
  }

  /**
   * Record expansion activity
   */
  recordExpansionRate(playerId, rate) {
    const metrics = this.getPlayerMetrics(playerId);
    metrics.expansion_rate = (metrics.expansion_rate + rate) / 2;
  }

  /**
   * Check if difficulty adjustment is needed
   */
  shouldAdjustDifficulty(playerId) {
    const metrics = this.getPlayerMetrics(playerId);
    
    // Adjust after every 5 games, or if there's a significant streak
    return metrics.games_played % 5 === 0 || 
           metrics.win_streak >= 3 || 
           metrics.loss_streak >= 3;
  }
}

// Create singleton instance
const playerMetricsService = new PlayerMetricsService();

module.exports = playerMetricsService; 
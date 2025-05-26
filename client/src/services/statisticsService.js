const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Statistics Service
 * Handles API calls for colony statistics and timeline data
 */
class StatisticsService {
  
  /**
   * Get aggregated statistics for a colony
   */
  async getColonyStatistics(colonyId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.category) queryParams.append('category', options.category);
      if (options.timeframe) queryParams.append('timeframe', options.timeframe);

      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get colony statistics');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting colony statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get timeline events for a colony
   */
  async getColonyTimeline(colonyId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.eventType) queryParams.append('eventType', options.eventType);
      if (options.importanceLevel) queryParams.append('importanceLevel', options.importanceLevel);
      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      if (options.limit) queryParams.append('limit', options.limit);
      if (options.orderBy) queryParams.append('orderBy', options.orderBy);
      if (options.orderDirection) queryParams.append('orderDirection', options.orderDirection);

      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/timeline?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get colony timeline');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting colony timeline:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get milestone events for a colony
   */
  async getColonyMilestones(colonyId, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit);

      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/milestones?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get colony milestones');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting colony milestones:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get historical data for a specific statistic
   */
  async getHistoricalData(colonyId, statType, options = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (options.timeframe) queryParams.append('timeframe', options.timeframe);
      if (options.dataPoints) queryParams.append('dataPoints', options.dataPoints);
      if (options.limit) queryParams.append('limit', options.limit);

      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/historical/${statType}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get historical data');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting historical data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get summary statistics for a colony
   */
  async getColonySummary(colonyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/summary`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get colony summary');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting colony summary:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get timeline events grouped by time periods
   */
  async getTimelineByPeriod(colonyId, period = 'day', options = {}) {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('period', period);
      if (options.limit) queryParams.append('limit', options.limit);

      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/timeline-by-period?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get timeline by period');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error getting timeline by period:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Start statistics tracking for a colony
   */
  async startTracking(colonyId, initialData = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/start-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initialData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start statistics tracking');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error starting statistics tracking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop statistics tracking for a colony
   */
  async stopTracking(colonyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/stop-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop statistics tracking');
      }

      return {
        success: true,
        data: data
      };
    } catch (error) {
      console.error('Error stopping statistics tracking:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record a statistic manually
   */
  async recordStatistic(colonyId, statData) {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record statistic');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error recording statistic:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Log an event for a colony
   */
  async logEvent(colonyId, eventData) {
    try {
      const response = await fetch(`${API_BASE_URL}/statistics/colony/${colonyId}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log event');
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error logging event:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export colony data
   */
  async exportColonyData(colonyId, format = 'json', type = 'all') {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      queryParams.append('type', type);

      const response = await fetch(`${API_BASE_URL}/statistics/export/${colonyId}?${queryParams}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export colony data');
      }

      if (format === 'csv') {
        const csvData = await response.text();
        return {
          success: true,
          data: csvData,
          type: 'csv'
        };
      } else {
        const jsonData = await response.json();
        return {
          success: true,
          data: jsonData,
          type: 'json'
        };
      }
    } catch (error) {
      console.error('Error exporting colony data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper method to download exported data as a file
   */
  downloadExportedData(data, filename, type = 'json') {
    const blob = new Blob([type === 'json' ? JSON.stringify(data, null, 2) : data], {
      type: type === 'json' ? 'application/json' : 'text/csv'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
const statisticsService = new StatisticsService();

export default statisticsService; 
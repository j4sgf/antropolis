const express = require('express');
const router = express.Router();
const ColonyStatistics = require('../models/ColonyStatistics');
const ColonyEvents = require('../models/ColonyEvents');
const { getStatisticsManager } = require('../services/StatisticsManager');

/**
 * GET /api/statistics/colony/:colonyId
 * Get aggregated statistics for a colony
 */
router.get('/colony/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { category, timeframe = '7d' } = req.query;

    // Get aggregated statistics
    const result = await ColonyStatistics.getAggregatedStatistics(colonyId, {
      category,
      timeframe
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Failed to get colony statistics'
      });
    }

    // Get real-time statistics from manager if available
    const statsManager = getStatisticsManager();
    const liveStats = statsManager.getColonyStatistics(colonyId);

    res.json({
      success: true,
      data: {
        aggregated: result.data,
        live: liveStats,
        colonyId
      }
    });
  } catch (error) {
    console.error('Error getting colony statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get colony statistics'
    });
  }
});

/**
 * GET /api/statistics/colony/:colonyId/timeline
 * Get timeline events for a colony
 */
router.get('/colony/:colonyId/timeline', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { 
      eventType, 
      importanceLevel, 
      startDate, 
      endDate, 
      limit = 50,
      orderBy = 'occurred_at',
      orderDirection = 'desc'
    } = req.query;

    const options = {
      eventType,
      importanceLevel: importanceLevel ? parseInt(importanceLevel) : undefined,
      startDate,
      endDate,
      limit: parseInt(limit),
      orderBy,
      orderDirection
    };

    const result = await ColonyEvents.getColonyTimeline(colonyId, options);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Failed to get colony timeline'
      });
    }

    // Get event statistics
    const statsResult = await ColonyEvents.getEventStatistics(colonyId);

    res.json({
      success: true,
      data: {
        events: result.data,
        statistics: statsResult.success ? statsResult.data : null,
        colonyId,
        options
      }
    });
  } catch (error) {
    console.error('Error getting colony timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get colony timeline'
    });
  }
});

/**
 * GET /api/statistics/colony/:colonyId/milestones
 * Get milestone events for a colony
 */
router.get('/colony/:colonyId/milestones', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { limit = 20 } = req.query;

    const result = await ColonyEvents.getMilestoneEvents(colonyId, {
      limit: parseInt(limit)
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Failed to get colony milestones'
      });
    }

    res.json({
      success: true,
      data: result.data,
      colonyId
    });
  } catch (error) {
    console.error('Error getting colony milestones:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get colony milestones'
    });
  }
});

/**
 * GET /api/statistics/colony/:colonyId/historical/:statType
 * Get historical data for a specific statistic
 */
router.get('/colony/:colonyId/historical/:statType', async (req, res) => {
  try {
    const { colonyId, statType } = req.params;
    const { 
      timeframe = '24h', 
      dataPoints = 50,
      limit = 100
    } = req.query;

    const options = {
      timeframe,
      dataPoints: parseInt(dataPoints),
      limit: parseInt(limit)
    };

    const result = await ColonyStatistics.getHistoricalData(colonyId, statType, options);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Failed to get historical data'
      });
    }

    res.json({
      success: true,
      data: {
        chartData: result.data,
        statType,
        timeframe,
        colonyId
      }
    });
  } catch (error) {
    console.error('Error getting historical data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get historical data'
    });
  }
});

/**
 * GET /api/statistics/colony/:colonyId/summary
 * Get summary statistics for a colony
 */
router.get('/colony/:colonyId/summary', async (req, res) => {
  try {
    const { colonyId } = req.params;

    const result = await ColonyStatistics.getSummaryStatistics(colonyId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Failed to get summary statistics'
      });
    }

    // Get recent activity
    const recentActivityResult = await ColonyEvents.getRecentActivity(colonyId, 24);
    const recentActivity = recentActivityResult.success ? recentActivityResult.data : [];

    res.json({
      success: true,
      data: {
        summary: result.data,
        recentActivity: recentActivity,
        colonyId
      }
    });
  } catch (error) {
    console.error('Error getting summary statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get summary statistics'
    });
  }
});

/**
 * GET /api/statistics/colony/:colonyId/timeline-by-period
 * Get timeline events grouped by time periods
 */
router.get('/colony/:colonyId/timeline-by-period', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { period = 'day', limit = 100 } = req.query;

    const result = await ColonyEvents.getTimelineByPeriod(colonyId, period, {
      limit: parseInt(limit)
    });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Failed to get timeline by period'
      });
    }

    res.json({
      success: true,
      data: {
        timeline: result.data,
        period,
        colonyId
      }
    });
  } catch (error) {
    console.error('Error getting timeline by period:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get timeline by period'
    });
  }
});

/**
 * POST /api/statistics/colony/:colonyId/start-tracking
 * Start statistics tracking for a colony
 */
router.post('/colony/:colonyId/start-tracking', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { initialData = {} } = req.body;

    const statsManager = getStatisticsManager();
    statsManager.startTracking(colonyId, initialData);

    res.json({
      success: true,
      message: 'Statistics tracking started',
      colonyId
    });
  } catch (error) {
    console.error('Error starting statistics tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start statistics tracking'
    });
  }
});

/**
 * POST /api/statistics/colony/:colonyId/stop-tracking
 * Stop statistics tracking for a colony
 */
router.post('/colony/:colonyId/stop-tracking', async (req, res) => {
  try {
    const { colonyId } = req.params;

    const statsManager = getStatisticsManager();
    statsManager.stopTracking(colonyId);

    res.json({
      success: true,
      message: 'Statistics tracking stopped',
      colonyId
    });
  } catch (error) {
    console.error('Error stopping statistics tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop statistics tracking'
    });
  }
});

/**
 * POST /api/statistics/colony/:colonyId/record
 * Manually record a statistic for a colony
 */
router.post('/colony/:colonyId/record', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { 
      statType, 
      statCategory, 
      value, 
      subtype, 
      description, 
      gameTick 
    } = req.body;

    if (!statType || !statCategory || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: statType, statCategory, value'
      });
    }

    const result = await ColonyStatistics.recordStatistic(
      colonyId, 
      statType, 
      statCategory, 
      value, 
      {
        subtype,
        description,
        gameTick
      }
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to record statistic'
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Statistic recorded successfully'
    });
  } catch (error) {
    console.error('Error recording statistic:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record statistic'
    });
  }
});

/**
 * POST /api/statistics/colony/:colonyId/event
 * Log an event for a colony
 */
router.post('/colony/:colonyId/event', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const eventData = req.body;

    if (!eventData.eventType || !eventData.title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventType, title'
      });
    }

    const result = await ColonyEvents.createEvent(colonyId, eventData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to create event'
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Event logged successfully'
    });
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log event'
    });
  }
});

/**
 * GET /api/statistics/export/:colonyId
 * Export colony statistics to CSV/JSON
 */
router.get('/export/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { format = 'json', type = 'all' } = req.query;

    let data = {};

    if (type === 'all' || type === 'statistics') {
      const statsResult = await ColonyStatistics.getColonyStatistics(colonyId);
      if (statsResult.success) {
        data.statistics = statsResult.data;
      }
    }

    if (type === 'all' || type === 'events') {
      const eventsResult = await ColonyEvents.getColonyTimeline(colonyId, { limit: 1000 });
      if (eventsResult.success) {
        data.events = eventsResult.data;
      }
    }

    if (format === 'csv' && type === 'statistics') {
      // Convert to CSV format
      const csvData = convertStatisticsToCSV(data.statistics || []);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="colony-${colonyId}-statistics.csv"`);
      res.send(csvData);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="colony-${colonyId}-data.json"`);
      res.json({
        success: true,
        colonyId,
        exportDate: new Date().toISOString(),
        data
      });
    }
  } catch (error) {
    console.error('Error exporting colony data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export colony data'
    });
  }
});

/**
 * Helper function to convert statistics to CSV
 */
function convertStatisticsToCSV(statistics) {
  if (!statistics || statistics.length === 0) {
    return 'No data available';
  }

  const headers = ['ID', 'Stat Type', 'Category', 'Value', 'Recorded At', 'Game Tick'];
  const csvRows = [headers.join(',')];

  for (const stat of statistics) {
    const value = stat.value_json && Object.keys(stat.value_json).length > 0 
      ? JSON.stringify(stat.value_json).replace(/"/g, '""')
      : stat.value_float !== 0 ? stat.value_float : stat.value_int;
    
    const row = [
      stat.id,
      stat.stat_type,
      stat.stat_category,
      `"${value}"`,
      stat.recorded_at,
      stat.game_tick
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

module.exports = router; 
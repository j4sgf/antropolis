const express = require('express');
const router = express.Router();

// Get active resource queue connections
router.get('/connections/active', async (req, res) => {
  try {
    // Mock active connections data
    const mockConnections = {
      active: [
        {
          id: 'conn-1',
          type: 'foraging',
          source: 'forest-node-1',
          target: 'colony-storage',
          workers: 12,
          efficiency: 0.87,
          status: 'active',
          progress: 0.65
        },
        {
          id: 'conn-2', 
          type: 'construction',
          source: 'quarry-node-1',
          target: 'building-site-1',
          workers: 8,
          efficiency: 0.92,
          status: 'active',
          progress: 0.34
        }
      ],
      total: 2,
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockConnections
    });
  } catch (error) {
    console.error('Error fetching active connections:', error);
    res.status(500).json({ error: 'Failed to fetch active connections' });
  }
});

// Get resource queue workers
router.get('/workers', async (req, res) => {
  try {
    // Mock worker data
    const mockWorkers = {
      available: 45,
      assigned: 38,
      idle: 7,
      byRole: {
        forager: { assigned: 18, available: 3 },
        worker: { assigned: 12, available: 2 },
        architect: { assigned: 8, available: 2 }
      },
      efficiency: 0.89,
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockWorkers
    });
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// Get resource queue status
router.get('/status', async (req, res) => {
  try {
    // Mock queue status
    const mockStatus = {
      pending: 12,
      processing: 8,
      completed: 145,
      failed: 2,
      totalThroughput: 892.5,
      averageWaitTime: 15.3,
      lastUpdate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockStatus
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ error: 'Failed to fetch queue status' });
  }
});

module.exports = router; 
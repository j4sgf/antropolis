const express = require('express');
const {
  initializeExploration,
  getExplorationStatus,
  updateScoutPositions,
  exploreTiles,
  exploreArea,
  processMemoryDecay,
  getTileExploration,
  exportExplorationData,
  importExplorationData
} = require('../controllers/explorationController');

const router = express.Router();

// Initialize exploration for a colony
router.post('/:colonyId/initialize', initializeExploration);

// Get exploration status and statistics
router.get('/:colonyId/status', getExplorationStatus);

// Update scout positions and recalculate visibility
router.post('/:colonyId/update-scouts', updateScoutPositions);

// Mark specific tiles as explored
router.post('/:colonyId/explore-tiles', exploreTiles);

// Mark an area as explored
router.post('/:colonyId/explore-area', exploreArea);

// Process memory decay for exploration
router.post('/:colonyId/process-decay', processMemoryDecay);

// Get exploration data for a specific tile
router.get('/:colonyId/tile/:x/:y', getTileExploration);

// Export exploration data
router.get('/:colonyId/export', exportExplorationData);

// Import exploration data
router.post('/:colonyId/import', importExplorationData);

module.exports = router; 
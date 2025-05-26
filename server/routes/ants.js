const express = require('express');
const router = express.Router();
const antController = require('../controllers/antController');

/**
 * Ant Management Routes
 * Handles role assignment and ant-related operations
 */

// Get all ants for a colony
router.get('/colonies/:colonyId/ants', antController.getColonyAnts);

// Update role for a single ant
router.put('/ants/:antId/role', antController.updateAntRole);

// Batch update roles for multiple ants
router.put('/ants/batch-assign', antController.batchUpdateAntRoles);

// Get detailed statistics for a specific ant
router.get('/ants/:antId/stats', antController.getAntStatistics);

// Validate role assignment
router.post('/ants/validate-assignment', antController.validateRoleAssignment);

// Note: role-distribution and role-recommendations endpoints are now handled in colonies.js

module.exports = router; 
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

// Get role distribution for a colony
router.get('/colonies/:colonyId/role-distribution', antController.getRoleDistribution);

// Validate role assignment
router.post('/ants/validate-assignment', antController.validateRoleAssignment);

// Get role recommendations based on colony state
router.get('/colonies/:colonyId/role-recommendations', antController.getRoleRecommendations);

module.exports = router; 
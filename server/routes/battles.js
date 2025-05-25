/**
 * Battle Routes for Antopolis
 * Handles battle simulation, AI attacks, player raids, and battle management
 */

const express = require('express');
const router = express.Router();
const BattleSimulator = require('../services/BattleSimulator');
const AIAttackScheduler = require('../services/AIAttackScheduler');
const { supabase } = require('../config/database');

// Initialize battle simulator and AI attack scheduler
const battleSimulator = new BattleSimulator();
const aiAttackScheduler = new AIAttackScheduler();

/**
 * GET /api/battles/health
 * Health check for battles API with scheduler status
 */
router.get('/health', (req, res) => {
    try {
        const schedulerStatus = aiAttackScheduler.getStatus();
        
        res.json({
            status: 'OK',
            message: 'Battle API is operational',
            timestamp: new Date().toISOString(),
            scheduler: schedulerStatus,
            endpoints: [
                'GET /api/battles/health',
                'POST /api/battles/simulate',
                'GET /api/battles/targets/:colonyId',
                'POST /api/battles/execute',
                'GET /api/battles/incoming/:colonyId',
                'GET /api/battles/incoming',
                'GET /api/battles/history/:colonyId',
                'POST /api/battles/retreat/:battleId',
                'GET /api/battles/stats/:colonyId',
                'GET /api/battles/scheduler/status',
                'POST /api/battles/scheduler/start',
                'POST /api/battles/scheduler/stop'
            ]
        });
    } catch (error) {
        console.error('Error in battles health check:', error);
        res.status(500).json({
            status: 'ERROR',
            message: 'Battle API health check failed',
            error: error.message
        });
    }
});

/**
 * POST /api/battles/simulate
 * Test battle simulation with provided armies
 */
router.post('/simulate', async (req, res) => {
    try {
        const { attackerArmy, defenderArmy, battleConditions } = req.body;

        if (!attackerArmy || !defenderArmy) {
            return res.status(400).json({
                error: 'Both attackerArmy and defenderArmy are required',
                example: {
                    attackerArmy: { soldier: 10, worker: 5 },
                    defenderArmy: { soldier: 8, guard: 3 },
                    battleConditions: {
                        terrain: 'forest',
                        attackerFormation: 'aggressive',
                        defenderFormation: 'defensive'
                    }
                }
            });
        }

        const battleResult = battleSimulator.simulateBattle(
            attackerArmy, 
            defenderArmy, 
            battleConditions || {}
        );

        res.json({
            success: true,
            battle: battleResult,
            message: 'Battle simulation completed'
        });

    } catch (error) {
        console.error('Battle simulation error:', error);
        res.status(500).json({
            error: 'Failed to simulate battle',
            details: error.message
        });
    }
});

/**
 * GET /api/battles/targets/:colonyId
 * Get available targets for player raids
 */
router.get('/targets/:colonyId', async (req, res) => {
    try {
        const { colonyId } = req.params;

        // For now, return mock AI colonies as potential targets
        // In full implementation, this would query the AI colonies system
        const availableTargets = [
            {
                id: 'ai_colony_1',
                name: 'Crimson Swarm',
                personality: 'aggressive',
                strength: 120,
                location: { x: 10, y: 15 },
                terrain: 'forest',
                difficulty: 'medium',
                estimatedArmy: { soldier: 15, worker: 8, guard: 2 },
                rewards: { food: 150, wood: 75, stone: 45 }
            },
            {
                id: 'ai_colony_2',
                name: 'Stone Builders',
                personality: 'defensive',
                strength: 200,
                location: { x: 25, y: 8 },
                terrain: 'mountain',
                difficulty: 'hard',
                estimatedArmy: { soldier: 12, worker: 20, guard: 6, elite: 1 },
                rewards: { food: 100, wood: 200, stone: 150, minerals: 80 }
            },
            {
                id: 'ai_colony_3',
                name: 'Swift Raiders',
                personality: 'opportunist',
                strength: 80,
                location: { x: 5, y: 30 },
                terrain: 'grassland',
                difficulty: 'easy',
                estimatedArmy: { scout: 10, soldier: 5, worker: 12 },
                rewards: { food: 120, water: 60, minerals: 40 }
            }
        ];

        res.json({
            success: true,
            targets: availableTargets,
            message: `Found ${availableTargets.length} available targets`
        });

    } catch (error) {
        console.error('Error fetching battle targets:', error);
        res.status(500).json({
            error: 'Failed to fetch battle targets',
            details: error.message
        });
    }
});

/**
 * POST /api/battles/execute
 * Execute a player-initiated raid
 */
router.post('/execute', async (req, res) => {
    try {
        const { 
            attackerColonyId, 
            targetColonyId, 
            attackingArmy, 
            formation,
            retreatThreshold 
        } = req.body;

        if (!attackerColonyId || !targetColonyId || !attackingArmy) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['attackerColonyId', 'targetColonyId', 'attackingArmy']
            });
        }

        // Mock target colony data (in full implementation, get from AI colonies)
        const targetColony = {
            id: targetColonyId,
            name: 'Enemy Colony',
            army: { soldier: 12, worker: 8, guard: 3 },
            terrain: 'forest',
            formation: 'defensive'
        };

        // Execute battle simulation
        const battleConditions = {
            terrain: targetColony.terrain,
            attackerFormation: formation || 'balanced',
            defenderFormation: targetColony.formation
        };

        const battleResult = battleSimulator.simulateBattle(
            attackingArmy,
            targetColony.army,
            battleConditions
        );

        if (!battleResult.success) {
            return res.status(400).json({
                error: 'Battle simulation failed',
                details: battleResult.error
            });
        }

        // Calculate rewards if attacker won
        let rewards = null;
        if (battleResult.result.victor === 'attacker') {
            rewards = battleSimulator.calculateBattleRewards(
                battleResult.result,
                { id: attackerColonyId },
                targetColony
            );
        }

        // Store battle record (mock implementation)
        const battleRecord = {
            id: battleResult.battleId,
            attackerColonyId,
            targetColonyId,
            battleType: 'player_raid',
            result: battleResult.result,
            rewards,
            timestamp: battleResult.timestamp
        };

        res.json({
            success: true,
            battle: battleRecord,
            message: `Battle completed - ${battleResult.result.outcome}`,
            casualties: battleResult.result.totalCasualties,
            survivors: battleResult.result.armySurvivors,
            rewards: rewards
        });

    } catch (error) {
        console.error('Error executing battle:', error);
        res.status(500).json({
            error: 'Failed to execute battle',
            details: error.message
        });
    }
});

/**
 * GET /api/battles/incoming/:colonyId
 * Check for incoming AI attacks on player colony
 */
router.get('/incoming/:colonyId', async (req, res) => {
    try {
        const { colonyId } = req.params;

        // Mock implementation - check for scheduled AI attacks
        const incomingAttacks = [
            // Uncomment for testing:
            // {
            //     id: 'attack_001',
            //     attackerName: 'Crimson Swarm',
            //     estimatedArrival: new Date(Date.now() + 5 * 60000).toISOString(), // 5 minutes
            //     estimatedStrength: 150,
            //     canIntercept: true
            // }
        ];

        res.json({
            success: true,
            incomingAttacks,
            message: incomingAttacks.length > 0 
                ? `${incomingAttacks.length} incoming attacks detected!`
                : 'No incoming attacks detected'
        });

    } catch (error) {
        console.error('Error checking incoming attacks:', error);
        res.status(500).json({
            error: 'Failed to check incoming attacks',
            details: error.message
        });
    }
});

/**
 * GET /api/battles/history/:colonyId
 * Get battle history for a colony
 */
router.get('/history/:colonyId', async (req, res) => {
    try {
        const { colonyId } = req.params;
        const { limit = 20, offset = 0 } = req.query;

        // Mock battle history data
        const battleHistory = [
            {
                id: 'battle_001',
                type: 'player_raid',
                opponent: 'Swift Raiders',
                outcome: 'victory',
                casualties: { soldier: 2, worker: 1 },
                rewards: { food: 120, water: 60 },
                tacticalRating: 'good',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'battle_002',
                type: 'defense',
                opponent: 'Crimson Swarm',
                outcome: 'victory',
                casualties: { soldier: 4, guard: 1 },
                rewards: null,
                tacticalRating: 'fair',
                timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
            }
        ];

        res.json({
            success: true,
            history: battleHistory.slice(offset, offset + parseInt(limit)),
            total: battleHistory.length,
            message: `Retrieved battle history for colony ${colonyId}`
        });

    } catch (error) {
        console.error('Error fetching battle history:', error);
        res.status(500).json({
            error: 'Failed to fetch battle history',
            details: error.message
        });
    }
});

/**
 * POST /api/battles/retreat/:battleId
 * Handle battle retreat mechanics
 */
router.post('/retreat/:battleId', async (req, res) => {
    try {
        const { battleId } = req.params;
        const { colonyId, remainingArmy } = req.body;

        if (!colonyId || !remainingArmy) {
            return res.status(400).json({
                error: 'Colony ID and remaining army composition required for retreat'
            });
        }

        // Calculate retreat penalties
        const retreatPenalties = {
            casualties: {
                // 20% additional casualties during retreat
                soldier: Math.floor((remainingArmy.soldier || 0) * 0.2),
                worker: Math.floor((remainingArmy.worker || 0) * 0.15),
                scout: Math.floor((remainingArmy.scout || 0) * 0.1),
                guard: Math.floor((remainingArmy.guard || 0) * 0.25),
                elite: Math.floor((remainingArmy.elite || 0) * 0.1)
            },
            resourcePenalty: {
                food: 50,
                morale: -10 // Fictional morale system
            },
            cooldownPenalty: 3600000 // 1 hour additional cooldown in ms
        };

        // Calculate surviving army after retreat
        const survivingArmy = {};
        for (const [antType, count] of Object.entries(remainingArmy)) {
            const casualties = retreatPenalties.casualties[antType] || 0;
            survivingArmy[antType] = Math.max(0, count - casualties);
        }

        res.json({
            success: true,
            retreat: {
                battleId,
                colonyId,
                originalArmy: remainingArmy,
                survivingArmy,
                penalties: retreatPenalties,
                message: 'Retreat executed - your forces have withdrawn with additional casualties'
            }
        });

    } catch (error) {
        console.error('Error handling retreat:', error);
        res.status(500).json({
            error: 'Failed to process retreat',
            details: error.message
        });
    }
});

/**
 * GET /api/battles/stats/:colonyId
 * Get battle statistics for a colony
 */
router.get('/stats/:colonyId', async (req, res) => {
    try {
        const { colonyId } = req.params;

        // Mock battle statistics
        const battleStats = {
            totalBattles: 15,
            victories: 12,
            defeats: 3,
            winRate: 0.8,
            totalCasualties: { soldier: 25, worker: 10, guard: 3 },
            totalRewards: { food: 2400, wood: 800, stone: 600, minerals: 400 },
            averageTacticalRating: 'good',
            lastBattle: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            combatEfficiency: 0.75,
            favoriteFormation: 'balanced',
            strongestVictory: {
                opponent: 'Stone Builders',
                rating: 'brilliant',
                date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        };

        res.json({
            success: true,
            stats: battleStats,
            message: `Battle statistics for colony ${colonyId}`
        });

    } catch (error) {
        console.error('Error fetching battle stats:', error);
        res.status(500).json({
            error: 'Failed to fetch battle statistics',
            details: error.message
        });
    }
});

/**
 * GET /api/battles/scheduler/status
 * Get AI attack scheduler status
 */
router.get('/scheduler/status', (req, res) => {
    try {
        const status = aiAttackScheduler.getStatus();
        
        res.json({
            success: true,
            scheduler: status,
            message: `AI Attack Scheduler - ${status.initialized ? 'Running' : 'Stopped'}`
        });

    } catch (error) {
        console.error('Error getting scheduler status:', error);
        res.status(500).json({
            error: 'Failed to get scheduler status',
            details: error.message
        });
    }
});

/**
 * POST /api/battles/scheduler/start
 * Start the AI attack scheduler
 */
router.post('/scheduler/start', async (req, res) => {
    try {
        if (aiAttackScheduler.isInitialized) {
            return res.json({
                success: true,
                message: 'AI Attack Scheduler is already running',
                status: aiAttackScheduler.getStatus()
            });
        }

        await aiAttackScheduler.initialize();

        res.json({
            success: true,
            message: 'AI Attack Scheduler started successfully',
            status: aiAttackScheduler.getStatus()
        });

    } catch (error) {
        console.error('Error starting scheduler:', error);
        res.status(500).json({
            error: 'Failed to start AI attack scheduler',
            details: error.message
        });
    }
});

/**
 * POST /api/battles/scheduler/stop
 * Stop the AI attack scheduler
 */
router.post('/scheduler/stop', (req, res) => {
    try {
        aiAttackScheduler.shutdown();

        res.json({
            success: true,
            message: 'AI Attack Scheduler stopped successfully',
            status: aiAttackScheduler.getStatus()
        });

    } catch (error) {
        console.error('Error stopping scheduler:', error);
        res.status(500).json({
            error: 'Failed to stop AI attack scheduler',
            details: error.message
        });
    }
});

/**
 * GET /api/battles/incoming
 * Get all incoming attacks (enhanced with AI scheduler integration)
 */
router.get('/incoming', async (req, res) => {
    try {
        const { colonyId } = req.query;

        if (!colonyId) {
            return res.status(400).json({
                error: 'Colony ID is required as query parameter'
            });
        }

        // Get incoming attacks from AI scheduler
        const schedulerStatus = aiAttackScheduler.getStatus();
        const incomingAttacks = [];

        // Filter active attacks targeting this colony
        for (const attack of aiAttackScheduler.activeAttacks.values()) {
            if (attack.target_id === colonyId && attack.status === 'incoming') {
                incomingAttacks.push({
                    id: attack.id,
                    attackerName: attack.attacker_name || 'Unknown Colony',
                    attackType: attack.attack_type,
                    forcesCount: attack.forces_sent,
                    estimatedArrival: attack.estimated_arrival,
                    canIntercept: Date.now() < (new Date(attack.estimated_arrival).getTime() - 60000), // Can intercept if >1min away
                    timeToArrival: new Date(attack.estimated_arrival).getTime() - Date.now()
                });
            }
        }

        res.json({
            success: true,
            incomingAttacks,
            schedulerActive: schedulerStatus.initialized,
            message: incomingAttacks.length > 0 
                ? `${incomingAttacks.length} incoming attacks detected!`
                : 'No incoming attacks detected'
        });

    } catch (error) {
        console.error('Error checking incoming attacks:', error);
        res.status(500).json({
            error: 'Failed to check incoming attacks',
            details: error.message
        });
    }
});

module.exports = router; 
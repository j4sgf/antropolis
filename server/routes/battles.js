/**
 * Battle Routes for Antopolis
 * Handles battle simulation, AI attacks, player raids, and battle management
 */

const express = require('express');
const router = express.Router();
const BattleSimulator = require('../services/BattleSimulator');
const AIAttackScheduler = require('../services/AIAttackScheduler');
const RewardsCalculator = require('../services/RewardsCalculator');
const RetreatCalculator = require('../services/RetreatCalculator');
const { supabase } = require('../config/database');

// Initialize battle simulator, AI attack scheduler, rewards calculator, and retreat calculator
const battleSimulator = new BattleSimulator();
const aiAttackScheduler = new AIAttackScheduler();
const rewardsCalculator = new RewardsCalculator();
const retreatCalculator = new RetreatCalculator();

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
                'GET /api/battles/results/:battleId',
                'POST /api/battles/rewards/:battleId',
                'POST /api/battles/retreat/:battleId',
                'POST /api/battles/retreat/recommend',
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
            const rewardCalculation = rewardsCalculator.calculateBattleRewards(
                battleResult.result,
                { id: attackerColonyId },
                targetColony
            );
            rewards = rewardCalculation ? rewardCalculation.finalRewards : null;
        }

        // Store battle record in database
        const battleRecord = {
            id: battleResult.battleId,
            attackerColonyId,
            targetColonyId,
            battleType: 'player_raid',
            result: battleResult.result,
            rewards,
            timestamp: battleResult.timestamp
        };

        // Save to battle_history table
        try {
            const { error: historyError } = await supabase
                .from('battle_history')
                .insert({
                    id: battleResult.battleId,
                    attacker_id: attackerColonyId,
                    defender_id: targetColonyId,
                    battle_type: 'player_raid',
                    outcome: {
                        ...battleResult.result,
                        rewards: rewards
                    },
                    forces_involved: {
                        attacker: attackingArmy,
                        defender: targetColony.army
                    },
                    timestamp: battleResult.timestamp
                });

            if (historyError) {
                console.error('Error saving battle to history:', historyError);
                // Continue execution even if history save fails
            }
        } catch (historyError) {
            console.error('Failed to save battle history:', historyError);
            // Continue execution even if history save fails
        }

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

        // Query battle history from database - try multiple approaches
        let battles = null;
        let error = null;
        
        try {
            // First try with or() method
            const result = await supabase
                .from('battle_history')
                .select('*')
                .or(`attacker_id.eq.${colonyId},defender_id.eq.${colonyId}`)
                .order('timestamp', { ascending: false })
                .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
            
            battles = result.data;
            error = result.error;
        } catch (orError) {
            console.log('or() method failed, trying alternative approach:', orError.message);
            
            // Fallback: query both attacker and defender separately
            try {
                const [attackerResult, defenderResult] = await Promise.all([
                    supabase
                        .from('battle_history')
                        .select('*')
                        .eq('attacker_id', colonyId)
                        .order('timestamp', { ascending: false }),
                    supabase
                        .from('battle_history')
                        .select('*')
                        .eq('defender_id', colonyId)
                        .order('timestamp', { ascending: false })
                ]);
                
                if (attackerResult.error || defenderResult.error) {
                    error = attackerResult.error || defenderResult.error;
                } else {
                    // Combine and sort results
                    const combined = [...(attackerResult.data || []), ...(defenderResult.data || [])];
                    battles = combined
                        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                        .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
                }
            } catch (fallbackError) {
                error = fallbackError;
            }
        }

        if (error) {
            console.error('Database error fetching battle history:', error);
            // Fall back to mock data for development
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
                },
                {
                    id: 'battle_003',
                    type: 'ai_attack',
                    opponent: 'Desert Stalkers',
                    outcome: 'defeat',
                    casualties: { soldier: 8, worker: 3, guard: 2 },
                    rewards: null,
                    tacticalRating: 'poor',
                    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'battle_004',
                    type: 'player_raid',
                    opponent: 'Stone Builders',
                    outcome: 'victory',
                    casualties: { soldier: 1, scout: 2 },
                    rewards: { food: 200, wood: 150, stone: 100, minerals: 50 },
                    tacticalRating: 'brilliant',
                    timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString()
                }
            ];

            return res.json({
                success: true,
                history: battleHistory.slice(offset, offset + parseInt(limit)),
                total: battleHistory.length,
                message: `Retrieved battle history for colony ${colonyId} (mock data)`
            });
        }

        // Transform database records to frontend format
        const battleHistory = battles.map(battle => {
            const outcome = battle.outcome || {};
            const isAttacker = battle.attacker_id === colonyId;
            
            return {
                id: battle.id,
                type: battle.battle_type,
                opponent: isAttacker ? 'Enemy Colony' : 'AI Colony',
                outcome: outcome.victor === 'attacker' ? 
                    (isAttacker ? 'victory' : 'defeat') : 
                    (isAttacker ? 'defeat' : 'victory'),
                casualties: isAttacker ? 
                    outcome.totalCasualties?.attacker || {} : 
                    outcome.totalCasualties?.defender || {},
                rewards: outcome.rewards || null,
                tacticalRating: outcome.battleEfficiency?.tacticalRating || 'fair',
                timestamp: battle.timestamp
            };
        });

        res.json({
            success: true,
            history: battleHistory,
            total: battles.length,
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
 * Handle battle retreat mechanics with advanced calculation
 */
router.post('/retreat/:battleId', async (req, res) => {
    try {
        const { battleId } = req.params;
        const { colonyId, remainingArmy, battleConditions = {} } = req.body;

        if (!colonyId || !remainingArmy) {
            return res.status(400).json({
                error: 'Colony ID and remaining army composition required for retreat'
            });
        }

        // Calculate retreat using the advanced retreat calculator
        const retreatResult = retreatCalculator.calculateRetreat(remainingArmy, {
            terrain: battleConditions.terrain || 'grassland',
            battlePhase: battleConditions.phase || 'middle',
            enemyPursuit: battleConditions.pursuit || 'light',
            ...battleConditions
        });

        if (!retreatResult.success) {
            return res.status(400).json({
                error: 'Failed to calculate retreat',
                details: retreatResult.error
            });
        }

        // Store retreat record in battle history
        try {
            const { error: historyError } = await supabase
                .from('battle_history')
                .insert({
                    id: `retreat_${battleId}_${Date.now()}`,
                    attacker_id: colonyId,
                    defender_id: null, // No specific defender for retreat
                    battle_type: 'retreat',
                    outcome: {
                        victor: 'retreat',
                        retreatEfficiency: retreatResult.retreatEfficiency,
                        totalCasualties: {
                            attacker: retreatResult.retreatCasualties,
                            defender: {}
                        },
                        armySurvivors: {
                            attacker: retreatResult.survivingArmy,
                            defender: {}
                        },
                        penalties: retreatResult.penalties
                    },
                    forces_involved: {
                        attacker: remainingArmy,
                        defender: {}
                    },
                    timestamp: new Date().toISOString()
                });

            if (historyError) {
                console.error('Error saving retreat to history:', historyError);
                // Continue execution even if history save fails
            }
        } catch (historyError) {
            console.error('Failed to save retreat history:', historyError);
            // Continue execution even if history save fails
        }

        res.json({
            success: true,
            retreat: {
                battleId,
                colonyId,
                originalArmy: retreatResult.originalArmy,
                retreatCasualties: retreatResult.retreatCasualties,
                survivingArmy: retreatResult.survivingArmy,
                penalties: retreatResult.penalties,
                efficiency: retreatResult.retreatEfficiency,
                totalCasualties: retreatResult.totalCasualties,
                message: `Retreat executed - ${retreatResult.retreatEfficiency.description}`
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

/**
 * GET /api/battles/results/:battleId
 * Get detailed battle results by battle ID
 */
router.get('/results/:battleId', async (req, res) => {
    try {
        const { battleId } = req.params;

        // In full implementation, this would query the battle_history table
        // For now, return mock detailed battle results
        const battleResults = {
            id: battleId,
            result: {
                outcome: 'attacker_victory',
                victor: 'attacker',
                battleEfficiency: {
                    tacticalRating: 'good',
                    victoryMargin: 'decisive'
                },
                totalCasualties: {
                    attacker: { soldier: 3, worker: 1, scout: 0, guard: 0 },
                    defender: { soldier: 8, worker: 4, guard: 2, scout: 1 }
                },
                armySurvivors: {
                    attacker: { soldier: 12, worker: 4, scout: 5, guard: 2 },
                    defender: { soldier: 0, worker: 0, guard: 0, scout: 0 }
                }
            },
            initialForces: {
                attacker: { soldier: 15, worker: 5, scout: 5, guard: 2 },
                defender: { soldier: 8, worker: 4, guard: 2, scout: 1 }
            },
            target: {
                id: 'ai_colony_1',
                name: 'Crimson Swarm',
                terrain: 'forest'
            },
            duration: 180, // battle duration in seconds
            phases: [
                {
                    phase: 1,
                    attackerCasualties: { soldier: 1, worker: 0, scout: 0, guard: 0 },
                    defenderCasualties: { soldier: 3, worker: 1, guard: 0, scout: 0 },
                    battleEnded: false
                },
                {
                    phase: 2,
                    attackerCasualties: { soldier: 2, worker: 1, scout: 0, guard: 0 },
                    defenderCasualties: { soldier: 5, worker: 3, guard: 2, scout: 1 },
                    battleEnded: true
                }
            ],
            rewards: {
                food: 150,
                materials: 75,
                territory: 1
            },
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            battle: battleResults,
            message: `Battle results retrieved for ${battleId}`
        });

    } catch (error) {
        console.error('Error fetching battle results:', error);
        res.status(500).json({
            error: 'Failed to fetch battle results',
            details: error.message
        });
    }
});

/**
 * POST /api/battles/rewards/:battleId
 * Calculate and distribute rewards for a successful battle
 */
router.post('/rewards/:battleId', async (req, res) => {
    try {
        const { battleId } = req.params;
        const { colonyId, rewards } = req.body;

        if (!colonyId || !rewards) {
            return res.status(400).json({
                error: 'Colony ID and rewards object are required'
            });
        }

        // Calculate reward bonuses based on battle performance
        const baseRewards = { ...rewards };
        const bonusRewards = {};

        // Apply performance bonuses (mock implementation)
        for (const [resource, amount] of Object.entries(baseRewards)) {
            // 10% bonus for demonstration
            bonusRewards[resource] = Math.floor(amount * 0.1);
        }

        const totalRewards = {};
        for (const resource in baseRewards) {
            totalRewards[resource] = baseRewards[resource] + (bonusRewards[resource] || 0);
        }

        // In full implementation, update colony resources in database
        const distributionResult = {
            battleId,
            colonyId,
            baseRewards,
            bonusRewards,
            totalRewards,
            distributed: true,
            timestamp: new Date().toISOString()
        };

        res.json({
            success: true,
            distribution: distributionResult,
            message: 'Battle rewards distributed successfully'
        });

    } catch (error) {
        console.error('Error distributing rewards:', error);
        res.status(500).json({
            error: 'Failed to distribute battle rewards',
            details: error.message
        });
    }
});

/**
 * POST /api/battles/retreat/recommend
 * Get retreat recommendation based on current battle conditions
 */
router.post('/retreat/recommend', async (req, res) => {
    try {
        const { currentArmy, enemyArmy, battleState } = req.body;

        if (!currentArmy || !enemyArmy) {
            return res.status(400).json({
                error: 'Current army and enemy army compositions are required'
            });
        }

        const recommendation = retreatCalculator.shouldRetreat(
            currentArmy,
            enemyArmy,
            battleState || {}
        );

        res.json({
            success: true,
            recommendation,
            message: 'Retreat recommendation calculated'
        });

    } catch (error) {
        console.error('Error calculating retreat recommendation:', error);
        res.status(500).json({
            error: 'Failed to calculate retreat recommendation',
            details: error.message
        });
    }
});

module.exports = router; 
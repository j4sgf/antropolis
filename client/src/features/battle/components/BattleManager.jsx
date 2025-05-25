/**
 * BattleManager Component
 * Manages the complete battle flow from planning to results
 */

import React, { useState, useEffect } from 'react';
import battleService from '../../../services/battleService';
import RaidPlanner from './RaidPlanner';
import BattleResults from './BattleResults';
import BattleHistory from './BattleHistory';
import './BattleManager.css';

const BattleManager = ({ playerColony, onClose, onBattleComplete, initialView = 'planning' }) => {
    const [currentPhase, setCurrentPhase] = useState(initialView); // 'planning', 'executing', 'results', 'history'
    const [battleData, setBattleData] = useState(null);
    const [executionProgress, setExecutionProgress] = useState(0);
    const [error, setError] = useState(null);

    const handleRaidExecute = async (raidData) => {
        try {
            setCurrentPhase('executing');
            setError(null);

            // Simulate execution progress
            const progressInterval = setInterval(() => {
                setExecutionProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 15;
                });
            }, 200);

            // Execute the actual raid
            const response = await battleService.executeRaid(raidData);
            
            clearInterval(progressInterval);
            setExecutionProgress(100);

            // Process battle results
            if (response.success) {
                const battleResults = await processBattleResults(response.battle);
                setBattleData(battleResults);
                
                // Distribute rewards if victory
                if (battleResults.result.victor === 'attacker' && battleResults.result.rewards) {
                    await battleService.distributeRewards(
                        battleResults.id,
                        playerColony.id,
                        battleResults.result.rewards
                    );
                }

                setTimeout(() => {
                    setCurrentPhase('results');
                }, 1000);
            } else {
                throw new Error(response.error || 'Battle execution failed');
            }

        } catch (err) {
            setError('Battle execution failed: ' + err.message);
            setCurrentPhase('planning');
            setExecutionProgress(0);
        }
    };

    const processBattleResults = (battleData) => {
        // Enhance battle data with additional information for results display
        return {
            ...battleData,
            duration: calculateBattleDuration(battleData),
            phases: generateBattlePhases(battleData),
            initialForces: extractInitialForces(battleData)
        };
    };

    const calculateBattleDuration = (battleData) => {
        // Estimate battle duration based on army sizes and casualties
        const totalForces = Object.values(battleData.casualties?.attacker || {}).reduce((sum, val) => sum + val, 0) +
                           Object.values(battleData.survivors?.attacker || {}).reduce((sum, val) => sum + val, 0);
        
        // Base duration: 30 seconds per 10 units, modified by battle outcome
        let duration = Math.max(60, totalForces * 3);
        
        if (battleData.result?.battleEfficiency?.tacticalRating === 'brilliant') {
            duration *= 0.7; // Faster battle
        } else if (battleData.result?.battleEfficiency?.tacticalRating === 'poor') {
            duration *= 1.3; // Longer battle
        }
        
        return Math.floor(duration);
    };

    const generateBattlePhases = (battleData) => {
        // Generate battle phase breakdown for timeline display
        const phases = [];
        const totalCasualties = battleData.casualties || { attacker: {}, defender: {} };
        
        // Split casualties across 2-4 phases based on battle intensity
        const numPhases = Math.min(4, Math.max(2, Math.floor(Math.random() * 3) + 2));
        
        for (let i = 1; i <= numPhases; i++) {
            const isLastPhase = i === numPhases;
            const phaseCasualties = {
                attacker: {},
                defender: {}
            };
            
            // Distribute casualties across phases (more in later phases)
            for (const [side, casualties] of Object.entries(totalCasualties)) {
                for (const [antType, total] of Object.entries(casualties)) {
                    if (total > 0) {
                        let phaseAmount;
                        if (isLastPhase) {
                            // Remaining casualties in last phase
                            phaseAmount = total - (phaseCasualties[side][antType] || 0);
                        } else {
                            // Gradually increasing casualties
                            phaseAmount = Math.floor(total * (i / numPhases) * (0.3 + Math.random() * 0.4));
                        }
                        phaseCasualties[side][antType] = Math.max(0, phaseAmount);
                    }
                }
            }
            
            phases.push({
                phase: i,
                attackerCasualties: phaseCasualties.attacker,
                defenderCasualties: phaseCasualties.defender,
                battleEnded: isLastPhase
            });
        }
        
        return phases;
    };

    const extractInitialForces = (battleData) => {
        // Calculate initial forces from survivors + casualties
        const attacker = {};
        const defender = {};
        
        // Attacker forces
        const attackerCasualties = battleData.casualties?.attacker || {};
        const attackerSurvivors = battleData.survivors?.attacker || {};
        
        for (const antType of ['soldier', 'worker', 'scout', 'guard', 'elite']) {
            const casualties = attackerCasualties[antType] || 0;
            const survivors = attackerSurvivors[antType] || 0;
            if (casualties > 0 || survivors > 0) {
                attacker[antType] = casualties + survivors;
            }
        }
        
        // Defender forces (estimated from target data)
        if (battleData.target?.estimatedArmy) {
            Object.assign(defender, battleData.target.estimatedArmy);
        }
        
        return { attacker, defender };
    };

    const handleResultsClose = () => {
        setCurrentPhase('planning');
        setBattleData(null);
        setExecutionProgress(0);
        if (onClose) onClose();
    };

    const handleContinue = () => {
        if (onBattleComplete && battleData) {
            onBattleComplete(battleData);
        }
        handleResultsClose();
    };

    const handleViewHistory = () => {
        setCurrentPhase('history');
    };

    const handleHistoryClose = () => {
        setCurrentPhase('planning');
    };

    const handleViewBattle = (battle) => {
        // When viewing a battle from history, show its results
        setBattleData({
            id: battle.id,
            result: {
                outcome: battle.outcome === 'victory' ? 'attacker_victory' : 'defender_victory',
                victor: battle.outcome === 'victory' ? 'attacker' : 'defender',
                battleEfficiency: {
                    tacticalRating: battle.tacticalRating || 'fair',
                    victoryMargin: 'clear'
                },
                totalCasualties: {
                    attacker: battle.casualties || {},
                    defender: {}
                },
                armySurvivors: {
                    attacker: {},
                    defender: {}
                },
                rewards: battle.rewards || null
            },
            target: {
                id: 'historical',
                name: battle.opponent,
                terrain: 'grassland'
            },
            duration: 180,
            phases: [],
            initialForces: {
                attacker: {},
                defender: {}
            }
        });
        setCurrentPhase('results');
    };

    return (
        <div className="battle-manager">
            {currentPhase === 'planning' && (
                <RaidPlanner
                    playerColony={playerColony}
                    onRaidComplete={handleRaidExecute}
                    onViewHistory={handleViewHistory}
                    onClose={onClose}
                />
            )}

            {currentPhase === 'executing' && (
                <div className="battle-execution">
                    <div className="execution-overlay">
                        <div className="execution-content">
                            <div className="battle-animation">
                                <div className="battle-icon">⚔️</div>
                                <h2>Battle in Progress</h2>
                                <p>Your forces are engaging the enemy...</p>
                            </div>
                            
                            <div className="execution-progress">
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill"
                                        style={{ width: `${executionProgress}%` }}
                                    ></div>
                                </div>
                                <div className="progress-text">
                                    {executionProgress < 30 && "Initial engagement..."}
                                    {executionProgress >= 30 && executionProgress < 60 && "Battle intensifying..."}
                                    {executionProgress >= 60 && executionProgress < 90 && "Decisive moments..."}
                                    {executionProgress >= 90 && "Battle concluding..."}
                                </div>
                            </div>

                            {error && (
                                <div className="execution-error">
                                    <span className="error-icon">⚠️</span>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {currentPhase === 'results' && battleData && (
                <BattleResults
                    battleData={battleData}
                    onClose={handleResultsClose}
                    onContinue={handleContinue}
                />
            )}

            {currentPhase === 'history' && (
                <BattleHistory
                    playerColony={playerColony}
                    onClose={handleHistoryClose}
                    onViewBattle={handleViewBattle}
                />
            )}
        </div>
    );
};

export default BattleManager; 
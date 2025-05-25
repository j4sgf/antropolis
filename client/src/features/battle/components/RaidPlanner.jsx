/**
 * RaidPlanner Component
 * Main interface for planning and executing player raids on AI colonies
 */

import React, { useState, useEffect } from 'react';
import battleService from '../../../services/battleService';
import ColonySelector from './ColonySelector';
import AntAllocation from './AntAllocation';
import BattlePreview from './BattlePreview';
import './RaidPlanner.css';

const RaidPlanner = ({ playerColony, onRaidComplete, onViewHistory, onClose }) => {
    const [step, setStep] = useState('target'); // 'target', 'forces', 'preview', 'executing'
    const [selectedTarget, setSelectedTarget] = useState(null);
    const [availableTargets, setAvailableTargets] = useState([]);
    const [attackingArmy, setAttackingArmy] = useState({
        soldier: 0,
        worker: 0,
        scout: 0,
        guard: 0
    });
    const [formation, setFormation] = useState('balanced');
    const [battlePreview, setBattlePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadAvailableTargets();
    }, [playerColony]);

    const loadAvailableTargets = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await battleService.getAvailableTargets(playerColony.id);
            setAvailableTargets(response.targets || []);
        } catch (err) {
            setError('Failed to load available targets: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTargetSelect = (target) => {
        setSelectedTarget(target);
        setStep('forces');
    };

    const handleArmyChange = (newArmy) => {
        setAttackingArmy(newArmy);
    };

    const handleFormationChange = (newFormation) => {
        setFormation(newFormation);
    };

    const previewBattle = async () => {
        try {
            setLoading(true);
            setError(null);

            const battleConditions = {
                terrain: selectedTarget.terrain,
                attackerFormation: formation,
                defenderFormation: 'defensive'
            };

            const response = await battleService.simulateBattle(
                attackingArmy,
                selectedTarget.estimatedArmy,
                battleConditions
            );

            setBattlePreview(response.battle);
            setStep('preview');
        } catch (err) {
            setError('Failed to preview battle: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const executeBattle = async () => {
        try {
            setLoading(true);
            setError(null);
            setStep('executing');

            const raidData = {
                attackerColonyId: playerColony.id,
                targetColonyId: selectedTarget.id,
                attackingArmy: attackingArmy,
                formation: formation,
                retreatThreshold: 0.3
            };

            const response = await battleService.executeRaid(raidData);
            
            if (onRaidComplete) {
                onRaidComplete(response);
            }
        } catch (err) {
            setError('Failed to execute raid: ' + err.message);
            setStep('preview');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 'target':
                return selectedTarget !== null;
            case 'forces':
                return getTotalArmySize() > 0;
            case 'preview':
                return battlePreview !== null;
            default:
                return false;
        }
    };

    const getTotalArmySize = () => {
        return Object.values(attackingArmy).reduce((sum, count) => sum + count, 0);
    };

    const getAvailableAnts = () => {
        // This would typically come from the player's colony data
        return {
            soldier: playerColony.availableAnts?.soldier || 0,
            worker: playerColony.availableAnts?.worker || 0,
            scout: playerColony.availableAnts?.scout || 0,
            guard: playerColony.availableAnts?.guard || 0
        };
    };

    if (loading && step === 'target') {
        return (
            <div className="raid-planner loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading available targets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="raid-planner">
            <div className="raid-planner-header">
                <h2>🎯 Plan Raid</h2>
                <div className="header-actions">
                    {onViewHistory && (
                        <button 
                            className="history-button"
                            onClick={onViewHistory}
                            title="View Battle History"
                        >
                            📜 History
                        </button>
                    )}
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                    <button onClick={() => setError(null)}>×</button>
                </div>
            )}

            <div className="step-indicator">
                <div className={`step ${step === 'target' ? 'active' : step !== 'target' ? 'completed' : ''}`}>
                    1. Select Target
                </div>
                <div className={`step ${step === 'forces' ? 'active' : ['preview', 'executing'].includes(step) ? 'completed' : ''}`}>
                    2. Allocate Forces
                </div>
                <div className={`step ${step === 'preview' ? 'active' : step === 'executing' ? 'completed' : ''}`}>
                    3. Battle Preview
                </div>
                <div className={`step ${step === 'executing' ? 'active' : ''}`}>
                    4. Execute Raid
                </div>
            </div>

            <div className="raid-planner-content">
                {step === 'target' && (
                    <ColonySelector
                        targets={availableTargets}
                        selectedTarget={selectedTarget}
                        onTargetSelect={handleTargetSelect}
                        loading={loading}
                    />
                )}

                {step === 'forces' && (
                    <AntAllocation
                        availableAnts={getAvailableAnts()}
                        attackingArmy={attackingArmy}
                        formation={formation}
                        onArmyChange={handleArmyChange}
                        onFormationChange={handleFormationChange}
                    />
                )}

                {step === 'preview' && (
                    <BattlePreview
                        target={selectedTarget}
                        attackingArmy={attackingArmy}
                        formation={formation}
                        battlePreview={battlePreview}
                        loading={loading}
                    />
                )}

                {step === 'executing' && (
                    <div className="executing-battle">
                        <div className="battle-animation">
                            <div className="spinner large"></div>
                            <h3>⚔️ Battle in Progress</h3>
                            <p>Your forces are engaging the enemy colony...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="raid-planner-actions">
                {step !== 'target' && step !== 'executing' && (
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => {
                            if (step === 'forces') setStep('target');
                            if (step === 'preview') setStep('forces');
                        }}
                    >
                        ← Back
                    </button>
                )}

                {step === 'forces' && (
                    <button 
                        className="btn btn-primary" 
                        onClick={previewBattle}
                        disabled={!canProceed() || loading}
                    >
                        {loading ? 'Simulating...' : 'Preview Battle →'}
                    </button>
                )}

                {step === 'preview' && (
                    <button 
                        className="btn btn-danger" 
                        onClick={executeBattle}
                        disabled={!canProceed() || loading}
                    >
                        {loading ? 'Executing...' : '⚔️ Execute Raid'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default RaidPlanner; 
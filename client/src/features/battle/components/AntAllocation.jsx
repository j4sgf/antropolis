/**
 * AntAllocation Component
 * Allows players to allocate ants for raids and select battle formations
 */

import React from 'react';
import './AntAllocation.css';

const AntAllocation = ({ 
    availableAnts, 
    attackingArmy, 
    formation, 
    onArmyChange, 
    onFormationChange 
}) => {
    const antTypes = [
        {
            type: 'soldier',
            name: 'Soldiers',
            icon: '⚔️',
            description: 'Primary combat units with high attack power',
            combatValue: 3.0,
            role: 'Offense'
        },
        {
            type: 'guard',
            name: 'Guards',
            icon: '🛡️',
            description: 'Defensive specialists with high defense',
            combatValue: 4.0,
            role: 'Defense'
        },
        {
            type: 'scout',
            name: 'Scouts',
            icon: '🔍',
            description: 'Fast units good for flanking and reconnaissance',
            combatValue: 1.5,
            role: 'Support'
        },
        {
            type: 'worker',
            name: 'Workers',
            icon: '👷',
            description: 'Basic units with low combat effectiveness',
            combatValue: 1.0,
            role: 'Basic'
        }
    ];

    const formations = [
        {
            type: 'aggressive',
            name: 'Aggressive',
            icon: '⚡',
            description: 'High attack, low defense. Best for overwhelming weaker enemies.',
            attackMod: '+20%',
            defenseMod: '-20%',
            recommended: 'When you have numerical superiority'
        },
        {
            type: 'defensive',
            name: 'Defensive',
            icon: '🛡️',
            description: 'Low attack, high defense. Best for surviving tough battles.',
            attackMod: '-20%',
            defenseMod: '+30%',
            recommended: 'When facing stronger enemies'
        },
        {
            type: 'balanced',
            name: 'Balanced',
            icon: '⚖️',
            description: 'No bonuses or penalties. Safe, reliable choice.',
            attackMod: '±0%',
            defenseMod: '±0%',
            recommended: 'General purpose formation'
        },
        {
            type: 'guerrilla',
            name: 'Guerrilla',
            icon: '🌿',
            description: 'Moderate attack bonus, slight defense penalty. Good for hit-and-run.',
            attackMod: '+10%',
            defenseMod: '-10%',
            recommended: 'With many scouts and mobile units'
        }
    ];

    const handleAntCountChange = (antType, change) => {
        const currentCount = attackingArmy[antType] || 0;
        const newCount = Math.max(0, Math.min(availableAnts[antType], currentCount + change));
        
        const newArmy = {
            ...attackingArmy,
            [antType]: newCount
        };
        
        onArmyChange(newArmy);
    };

    const setAntCount = (antType, value) => {
        const count = Math.max(0, Math.min(availableAnts[antType], parseInt(value) || 0));
        
        const newArmy = {
            ...attackingArmy,
            [antType]: count
        };
        
        onArmyChange(newArmy);
    };

    const getTotalArmySize = () => {
        return Object.values(attackingArmy).reduce((sum, count) => sum + count, 0);
    };

    const getTotalCombatPower = () => {
        return antTypes.reduce((total, antType) => {
            const count = attackingArmy[antType.type] || 0;
            return total + (count * antType.combatValue);
        }, 0);
    };

    const getAllocatedAnts = () => {
        return Object.values(attackingArmy).reduce((sum, count) => sum + count, 0);
    };

    const getAvailableAnts = () => {
        return Object.values(availableAnts).reduce((sum, count) => sum + count, 0);
    };

    const clearAllocation = () => {
        const emptyArmy = {
            soldier: 0,
            worker: 0,
            scout: 0,
            guard: 0
        };
        onArmyChange(emptyArmy);
    };

    const allocateRecommended = () => {
        const total = getAvailableAnts();
        if (total === 0) return;

        // Recommended allocation: 40% soldiers, 20% guards, 20% scouts, 20% workers
        const recommended = {
            soldier: Math.floor(availableAnts.soldier * 0.6),
            guard: Math.floor(availableAnts.guard * 0.7),
            scout: Math.floor(availableAnts.scout * 0.5),
            worker: Math.floor(availableAnts.worker * 0.3)
        };

        onArmyChange(recommended);
    };

    return (
        <div className="ant-allocation">
            <div className="allocation-header">
                <h3>🐜 Allocate Forces</h3>
                <p>Select which ants to send into battle and choose your formation.</p>
            </div>

            <div className="allocation-summary">
                <div className="summary-stats">
                    <div className="stat">
                        <span className="stat-value">{getAllocatedAnts()}</span>
                        <span className="stat-label">Total Forces</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{getTotalCombatPower().toFixed(1)}</span>
                        <span className="stat-label">Combat Power</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{getAvailableAnts()}</span>
                        <span className="stat-label">Available</span>
                    </div>
                </div>
                
                <div className="quick-actions">
                    <button 
                        className="btn btn-secondary"
                        onClick={clearAllocation}
                        disabled={getAllocatedAnts() === 0}
                    >
                        Clear All
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={allocateRecommended}
                        disabled={getAvailableAnts() === 0}
                    >
                        Recommended
                    </button>
                </div>
            </div>

            <div className="ant-allocation-grid">
                {antTypes.map((antType) => (
                    <div key={antType.type} className="ant-allocation-card">
                        <div className="ant-header">
                            <div className="ant-info">
                                <span className="ant-icon">{antType.icon}</span>
                                <div className="ant-details">
                                    <h4>{antType.name}</h4>
                                    <span className="ant-role">{antType.role}</span>
                                </div>
                            </div>
                            <div className="ant-combat-value">
                                <span className="combat-label">Combat</span>
                                <span className="combat-value">{antType.combatValue}</span>
                            </div>
                        </div>

                        <p className="ant-description">{antType.description}</p>

                        <div className="ant-allocation-controls">
                            <div className="allocation-counter">
                                <button 
                                    className="count-btn minus"
                                    onClick={() => handleAntCountChange(antType.type, -1)}
                                    disabled={!attackingArmy[antType.type] || attackingArmy[antType.type] <= 0}
                                >
                                    -
                                </button>
                                
                                <input
                                    type="number"
                                    className="ant-count-input"
                                    value={attackingArmy[antType.type] || 0}
                                    onChange={(e) => setAntCount(antType.type, e.target.value)}
                                    min="0"
                                    max={availableAnts[antType.type]}
                                />
                                
                                <button 
                                    className="count-btn plus"
                                    onClick={() => handleAntCountChange(antType.type, 1)}
                                    disabled={attackingArmy[antType.type] >= availableAnts[antType.type]}
                                >
                                    +
                                </button>
                            </div>
                            
                            <div className="availability-info">
                                <span className="available-count">
                                    Available: {availableAnts[antType.type]}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="formation-selection">
                <h4>⚔️ Battle Formation</h4>
                <p>Choose how your forces will be arranged in battle:</p>
                
                <div className="formations-grid">
                    {formations.map((formationType) => (
                        <div
                            key={formationType.type}
                            className={`formation-card ${formation === formationType.type ? 'selected' : ''}`}
                            onClick={() => onFormationChange(formationType.type)}
                        >
                            <div className="formation-header">
                                <span className="formation-icon">{formationType.icon}</span>
                                <h5>{formationType.name}</h5>
                            </div>
                            
                            <p className="formation-description">{formationType.description}</p>
                            
                            <div className="formation-modifiers">
                                <div className="modifier">
                                    <span>Attack: {formationType.attackMod}</span>
                                </div>
                                <div className="modifier">
                                    <span>Defense: {formationType.defenseMod}</span>
                                </div>
                            </div>
                            
                            <div className="formation-recommendation">
                                <small><strong>Best for:</strong> {formationType.recommended}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {getTotalArmySize() === 0 && (
                <div className="allocation-warning">
                    <span className="warning-icon">⚠️</span>
                    <p>You must allocate at least one ant to proceed with the raid.</p>
                </div>
            )}
        </div>
    );
};

export default AntAllocation; 
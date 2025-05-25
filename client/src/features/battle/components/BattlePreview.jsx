/**
 * BattlePreview Component
 * Shows simulated battle outcome before executing the raid
 */

import React from 'react';
import './BattlePreview.css';

const BattlePreview = ({ target, attackingArmy, formation, battlePreview, loading }) => {
    if (loading) {
        return (
            <div className="battle-preview loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Simulating battle...</p>
                </div>
            </div>
        );
    }

    if (!battlePreview) {
        return (
            <div className="battle-preview error">
                <span className="error-icon">⚠️</span>
                <p>Unable to generate battle preview. Please try again.</p>
            </div>
        );
    }

    const getOutcomeClass = (outcome) => {
        if (outcome.includes('attacker')) return 'victory';
        if (outcome.includes('defender')) return 'defeat';
        return 'mutual';
    };

    const getOutcomeText = (outcome) => {
        switch (outcome) {
            case 'attacker_victory': return 'Victory';
            case 'defender_victory': return 'Defeat';
            case 'mutual_destruction': return 'Mutual Destruction';
            default: return 'Unknown';
        }
    };

    const getOutcomeIcon = (outcome) => {
        switch (outcome) {
            case 'attacker_victory': return '🏆';
            case 'defender_victory': return '💀';
            case 'mutual_destruction': return '💥';
            default: return '❓';
        }
    };

    const getTacticalRating = (efficiency) => {
        const rating = efficiency?.tacticalRating || 'unknown';
        const ratingIcons = {
            brilliant: '🌟',
            good: '✅',
            fair: '⚖️',
            poor: '⚠️',
            terrible: '💀'
        };
        return {
            text: rating.charAt(0).toUpperCase() + rating.slice(1),
            icon: ratingIcons[rating] || '❓'
        };
    };

    const result = battlePreview.result;
    const efficiency = result.battleEfficiency;
    const tacticalRating = getTacticalRating(efficiency);

    return (
        <div className="battle-preview">
            <div className="preview-header">
                <h3>🔮 Battle Simulation</h3>
                <p>Preview of the expected battle outcome based on current forces and conditions.</p>
            </div>

            <div className="battle-overview">
                <div className="battle-matchup">
                    <div className="army-side attacker">
                        <h4>Your Forces</h4>
                        <div className="army-composition">
                            {Object.entries(attackingArmy).map(([antType, count]) => 
                                count > 0 && (
                                    <div key={antType} className="army-unit">
                                        <span className="unit-count">{count}</span>
                                        <span className="unit-type">{antType}</span>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="formation-info">
                            <span className="formation-label">Formation:</span>
                            <span className="formation-name">{formation}</span>
                        </div>
                    </div>

                    <div className="vs-divider">
                        <span className="vs-text">VS</span>
                    </div>

                    <div className="army-side defender">
                        <h4>{target.name}</h4>
                        <div className="army-composition">
                            {Object.entries(target.estimatedArmy).map(([antType, count]) => (
                                <div key={antType} className="army-unit">
                                    <span className="unit-count">{count}</span>
                                    <span className="unit-type">{antType}</span>
                                </div>
                            ))}
                        </div>
                        <div className="terrain-info">
                            <span className="terrain-label">Terrain:</span>
                            <span className="terrain-name">{target.terrain}</span>
                        </div>
                    </div>
                </div>

                <div className={`battle-outcome ${getOutcomeClass(result.outcome)}`}>
                    <div className="outcome-header">
                        <span className="outcome-icon">{getOutcomeIcon(result.outcome)}</span>
                        <h3>Predicted Outcome: {getOutcomeText(result.outcome)}</h3>
                    </div>
                    
                    <div className="tactical-rating">
                        <span className="rating-icon">{tacticalRating.icon}</span>
                        <span>Tactical Performance: {tacticalRating.text}</span>
                    </div>
                </div>
            </div>

            <div className="battle-details">
                <div className="casualties-section">
                    <h4>📊 Expected Casualties</h4>
                    <div className="casualties-grid">
                        <div className="casualty-side">
                            <h5>Your Losses</h5>
                            <div className="casualty-stats">
                                <div className="casualty-item">
                                    <span className="casualty-label">Total:</span>
                                    <span className="casualty-value">
                                        {Object.values(result.totalCasualties.attacker).reduce((sum, val) => sum + val, 0)}
                                    </span>
                                </div>
                                <div className="casualty-breakdown">
                                    {Object.entries(result.totalCasualties.attacker).map(([antType, count]) => 
                                        count > 0 && (
                                            <div key={antType} className="casualty-detail">
                                                <span>{antType}: {count}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="casualty-side">
                            <h5>Enemy Losses</h5>
                            <div className="casualty-stats">
                                <div className="casualty-item">
                                    <span className="casualty-label">Total:</span>
                                    <span className="casualty-value">
                                        {Object.values(result.totalCasualties.defender).reduce((sum, val) => sum + val, 0)}
                                    </span>
                                </div>
                                <div className="casualty-breakdown">
                                    {Object.entries(result.totalCasualties.defender).map(([antType, count]) => 
                                        count > 0 && (
                                            <div key={antType} className="casualty-detail">
                                                <span>{antType}: {count}</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="survivors-section">
                    <h4>🐜 Expected Survivors</h4>
                    <div className="survivors-grid">
                        <div className="survivor-side">
                            <h5>Your Survivors</h5>
                            <div className="survivor-composition">
                                {Object.entries(result.armySurvivors.attacker).map(([antType, count]) => 
                                    count > 0 && (
                                        <div key={antType} className="survivor-unit">
                                            <span className="survivor-count">{count}</span>
                                            <span className="survivor-type">{antType}</span>
                                        </div>
                                    )
                                )}
                                {Object.values(result.armySurvivors.attacker).every(count => count === 0) && (
                                    <div className="no-survivors">No survivors expected</div>
                                )}
                            </div>
                        </div>

                        <div className="survivor-side">
                            <h5>Enemy Survivors</h5>
                            <div className="survivor-composition">
                                {Object.entries(result.armySurvivors.defender).map(([antType, count]) => 
                                    count > 0 && (
                                        <div key={antType} className="survivor-unit">
                                            <span className="survivor-count">{count}</span>
                                            <span className="survivor-type">{antType}</span>
                                        </div>
                                    )
                                )}
                                {Object.values(result.armySurvivors.defender).every(count => count === 0) && (
                                    <div className="no-survivors">No survivors expected</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {result.victor === 'attacker' && (
                    <div className="rewards-section">
                        <h4>💰 Expected Rewards</h4>
                        <div className="rewards-grid">
                            {Object.entries(target.rewards).map(([resource, amount]) => (
                                <div key={resource} className="reward-item">
                                    <span className="reward-amount">{amount}</span>
                                    <span className="reward-resource">{resource}</span>
                                </div>
                            ))}
                        </div>
                        <p className="rewards-note">
                            <small>*Actual rewards may vary based on battle performance</small>
                        </p>
                    </div>
                )}

                <div className="battle-phases">
                    <h4>⚔️ Battle Progression</h4>
                    <div className="phases-list">
                        {battlePreview.phases?.map((phase, index) => (
                            <div key={index} className="phase-item">
                                <div className="phase-header">
                                    <span className="phase-number">Phase {phase.phase}</span>
                                    {phase.battleEnded && <span className="phase-end">Battle Ended</span>}
                                </div>
                                <div className="phase-casualties">
                                    <span>Your losses: {Object.values(phase.attackerCasualties).reduce((sum, val) => sum + val, 0)}</span>
                                    <span>Enemy losses: {Object.values(phase.defenderCasualties).reduce((sum, val) => sum + val, 0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="preview-warning">
                <span className="warning-icon">⚠️</span>
                <p>
                    <strong>Note:</strong> This is a simulation based on current information. 
                    Actual battle results may vary due to random factors and hidden enemy strengths.
                </p>
            </div>
        </div>
    );
};

export default BattlePreview; 
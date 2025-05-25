/**
 * BattleResults Component
 * Displays the outcome of completed battles with detailed statistics and rewards
 */

import React, { useState, useEffect } from 'react';
import battleService from '../../../services/battleService';
import './BattleResults.css';

const BattleResults = ({ battleData, onClose, onContinue }) => {
    const [animationPhase, setAnimationPhase] = useState('intro'); // 'intro', 'outcome', 'details', 'complete'
    const [currentPhase, setCurrentPhase] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Start animation sequence
        const timer1 = setTimeout(() => setAnimationPhase('outcome'), 1000);
        const timer2 = setTimeout(() => setAnimationPhase('details'), 3000);
        const timer3 = setTimeout(() => setAnimationPhase('complete'), 5000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    const getOutcomeClass = (outcome) => {
        if (outcome.includes('attacker')) return 'victory';
        if (outcome.includes('defender')) return 'defeat';
        return 'mutual';
    };

    const getOutcomeText = (outcome) => {
        switch (outcome) {
            case 'attacker_victory': return 'Victory!';
            case 'defender_victory': return 'Defeat';
            case 'mutual_destruction': return 'Mutual Destruction';
            default: return 'Battle Complete';
        }
    };

    const getOutcomeIcon = (outcome) => {
        switch (outcome) {
            case 'attacker_victory': return '🏆';
            case 'defender_victory': return '💀';
            case 'mutual_destruction': return '💥';
            default: return '⚔️';
        }
    };

    const getPerformanceRating = (efficiency) => {
        const rating = efficiency?.tacticalRating || 'fair';
        const ratingData = {
            brilliant: { icon: '🌟', text: 'Brilliant!', color: '#ffd700' },
            good: { icon: '✅', text: 'Good', color: '#28a745' },
            fair: { icon: '⚖️', text: 'Fair', color: '#ffc107' },
            poor: { icon: '⚠️', text: 'Poor', color: '#fd7e14' },
            terrible: { icon: '💀', text: 'Terrible', color: '#dc3545' }
        };
        return ratingData[rating] || ratingData.fair;
    };

    const getTotalCasualties = (casualties) => {
        return Object.values(casualties).reduce((sum, count) => sum + count, 0);
    };

    const getTotalRewards = (rewards) => {
        return Object.entries(rewards).reduce((total, [resource, amount]) => {
            return total + amount;
        }, 0);
    };

    const formatDuration = (duration) => {
        if (duration < 60) return `${duration}s`;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        return `${minutes}m ${seconds}s`;
    };

    const result = battleData.result;
    const isVictory = result.victor === 'attacker';
    const performance = getPerformanceRating(result.battleEfficiency);

    return (
        <div className="battle-results-overlay">
            <div className={`battle-results ${getOutcomeClass(result.outcome)} ${animationPhase}`}>
                
                {/* Battle Intro Animation */}
                {animationPhase === 'intro' && (
                    <div className="battle-intro">
                        <div className="battle-flash">⚔️</div>
                        <h2>Battle Complete</h2>
                        <div className="loading-dots">
                            <span>.</span><span>.</span><span>.</span>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {animationPhase !== 'intro' && (
                    <>
                        <div className="results-header">
                            <div className={`outcome-announcement ${animationPhase === 'outcome' ? 'animate' : ''}`}>
                                <span className="outcome-icon">{getOutcomeIcon(result.outcome)}</span>
                                <h1 className="outcome-title">{getOutcomeText(result.outcome)}</h1>
                                <div className="performance-rating" style={{ color: performance.color }}>
                                    <span className="performance-icon">{performance.icon}</span>
                                    <span>Tactical Performance: {performance.text}</span>
                                </div>
                            </div>
                        </div>

                        {animationPhase !== 'outcome' && (
                            <div className="results-content">
                                
                                {/* Battle Summary */}
                                <div className="battle-summary">
                                    <div className="summary-grid">
                                        <div className="summary-item">
                                            <span className="summary-label">Duration</span>
                                            <span className="summary-value">{formatDuration(battleData.duration || 120)}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Battle Phases</span>
                                            <span className="summary-value">{battleData.phases?.length || 0}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Total Casualties</span>
                                            <span className="summary-value">
                                                {getTotalCasualties(result.totalCasualties.attacker) + 
                                                 getTotalCasualties(result.totalCasualties.defender)}
                                            </span>
                                        </div>
                                        <div className="summary-item">
                                            <span className="summary-label">Victory Margin</span>
                                            <span className="summary-value">
                                                {result.battleEfficiency?.victoryMargin || 'Narrow'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Forces Comparison */}
                                <div className="forces-comparison">
                                    <h3>⚔️ Battle Analysis</h3>
                                    <div className="forces-grid">
                                        <div className="force-column attacker">
                                            <h4>Your Forces</h4>
                                            <div className="force-stats">
                                                <div className="stat-item">
                                                    <span className="stat-label">Initial:</span>
                                                    <span className="stat-value">
                                                        {Object.values(battleData.initialForces?.attacker || {}).reduce((sum, val) => sum + val, 0)}
                                                    </span>
                                                </div>
                                                <div className="stat-item casualties">
                                                    <span className="stat-label">Casualties:</span>
                                                    <span className="stat-value">
                                                        {getTotalCasualties(result.totalCasualties.attacker)}
                                                    </span>
                                                </div>
                                                <div className="stat-item survivors">
                                                    <span className="stat-label">Survivors:</span>
                                                    <span className="stat-value">
                                                        {Object.values(result.armySurvivors.attacker).reduce((sum, val) => sum + val, 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="vs-separator">VS</div>

                                        <div className="force-column defender">
                                            <h4>{battleData.target?.name || 'Enemy Colony'}</h4>
                                            <div className="force-stats">
                                                <div className="stat-item">
                                                    <span className="stat-label">Initial:</span>
                                                    <span className="stat-value">
                                                        {Object.values(battleData.initialForces?.defender || {}).reduce((sum, val) => sum + val, 0)}
                                                    </span>
                                                </div>
                                                <div className="stat-item casualties">
                                                    <span className="stat-label">Casualties:</span>
                                                    <span className="stat-value">
                                                        {getTotalCasualties(result.totalCasualties.defender)}
                                                    </span>
                                                </div>
                                                <div className="stat-item survivors">
                                                    <span className="stat-label">Survivors:</span>
                                                    <span className="stat-value">
                                                        {Object.values(result.armySurvivors.defender).reduce((sum, val) => sum + val, 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Casualties */}
                                <div className="detailed-casualties">
                                    <h3>📊 Casualty Report</h3>
                                    <div className="casualties-grid">
                                        <div className="casualty-column">
                                            <h4>Your Losses</h4>
                                            <div className="casualty-breakdown">
                                                {Object.entries(result.totalCasualties.attacker).map(([antType, count]) => 
                                                    count > 0 && (
                                                        <div key={antType} className="casualty-item">
                                                            <span className="ant-type">{antType}</span>
                                                            <span className="ant-count">{count}</span>
                                                        </div>
                                                    )
                                                )}
                                                {getTotalCasualties(result.totalCasualties.attacker) === 0 && (
                                                    <div className="no-casualties">No casualties! 🎉</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="casualty-column">
                                            <h4>Enemy Losses</h4>
                                            <div className="casualty-breakdown">
                                                {Object.entries(result.totalCasualties.defender).map(([antType, count]) => 
                                                    count > 0 && (
                                                        <div key={antType} className="casualty-item">
                                                            <span className="ant-type">{antType}</span>
                                                            <span className="ant-count">{count}</span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Rewards Section */}
                                {isVictory && result.rewards && Object.keys(result.rewards).length > 0 && (
                                    <div className="rewards-section">
                                        <h3>💰 Victory Rewards</h3>
                                        <div className="rewards-grid">
                                            {Object.entries(result.rewards).map(([resource, amount]) => (
                                                <div key={resource} className="reward-item">
                                                    <div className="reward-icon">
                                                        {resource === 'food' && '🍯'}
                                                        {resource === 'materials' && '🪨'}
                                                        {resource === 'territory' && '🗺️'}
                                                        {!['food', 'materials', 'territory'].includes(resource) && '💎'}
                                                    </div>
                                                    <div className="reward-amount">+{amount}</div>
                                                    <div className="reward-type">{resource}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="rewards-total">
                                            <strong>Total Value: {getTotalRewards(result.rewards)} points</strong>
                                        </div>
                                    </div>
                                )}

                                {/* Battle Phases Timeline */}
                                {battleData.phases && battleData.phases.length > 0 && (
                                    <div className="battle-timeline">
                                        <h3>⚔️ Battle Timeline</h3>
                                        <div className="timeline-container">
                                            {battleData.phases.map((phase, index) => (
                                                <div key={index} className="timeline-phase">
                                                    <div className="phase-marker">
                                                        <span className="phase-number">{phase.phase}</span>
                                                    </div>
                                                    <div className="phase-content">
                                                        <div className="phase-casualties">
                                                            <span className="attacker-loss">
                                                                Your losses: {Object.values(phase.attackerCasualties).reduce((sum, val) => sum + val, 0)}
                                                            </span>
                                                            <span className="defender-loss">
                                                                Enemy losses: {Object.values(phase.defenderCasualties).reduce((sum, val) => sum + val, 0)}
                                                            </span>
                                                        </div>
                                                        {phase.battleEnded && (
                                                            <div className="battle-end-marker">⚡ Battle Ended</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {animationPhase === 'complete' && (
                            <div className="results-actions">
                                <div className="action-buttons">
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={onContinue}
                                    >
                                        Continue Playing
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default BattleResults; 
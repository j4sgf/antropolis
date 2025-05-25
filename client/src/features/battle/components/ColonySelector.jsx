/**
 * ColonySelector Component
 * Displays available AI colonies for raiding with stats and difficulty indicators
 */

import React from 'react';
import './ColonySelector.css';

const ColonySelector = ({ targets, selectedTarget, onTargetSelect, loading }) => {
    const getDifficultyColor = (difficulty) => {
        switch (difficulty.toLowerCase()) {
            case 'easy': return '#28a745';
            case 'medium': return '#ffc107';
            case 'hard': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const getStrengthClass = (strength) => {
        if (strength < 100) return 'weak';
        if (strength < 200) return 'medium';
        return 'strong';
    };

    const formatRewards = (rewards) => {
        return Object.entries(rewards)
            .map(([resource, amount]) => `${amount} ${resource}`)
            .join(', ');
    };

    if (loading) {
        return (
            <div className="colony-selector loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading targets...</p>
                </div>
            </div>
        );
    }

    if (!targets || targets.length === 0) {
        return (
            <div className="colony-selector empty">
                <div className="empty-state">
                    <span className="empty-icon">🎯</span>
                    <h3>No Targets Available</h3>
                    <p>There are no AI colonies within raiding range at the moment.</p>
                    <small>Try expanding your territory or wait for new colonies to appear.</small>
                </div>
            </div>
        );
    }

    return (
        <div className="colony-selector">
            <div className="selector-header">
                <h3>🎯 Select Target Colony</h3>
                <p>Choose an AI colony to raid. Consider their strength, distance, and potential rewards.</p>
            </div>

            <div className="targets-grid">
                {targets.map((target) => (
                    <div
                        key={target.id}
                        className={`target-card ${selectedTarget?.id === target.id ? 'selected' : ''} ${getStrengthClass(target.strength)}`}
                        onClick={() => onTargetSelect(target)}
                    >
                        <div className="target-header">
                            <div className="target-name">
                                <h4>{target.name}</h4>
                                <span 
                                    className="difficulty-badge"
                                    style={{ backgroundColor: getDifficultyColor(target.difficulty) }}
                                >
                                    {target.difficulty}
                                </span>
                            </div>
                            <div className="target-personality">
                                <span className="personality-tag">{target.personality}</span>
                            </div>
                        </div>

                        <div className="target-stats">
                            <div className="stat-row">
                                <span className="stat-label">💪 Strength:</span>
                                <span className="stat-value">{target.strength}</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">📍 Location:</span>
                                <span className="stat-value">({target.location.x}, {target.location.y})</span>
                            </div>
                            <div className="stat-row">
                                <span className="stat-label">🌍 Terrain:</span>
                                <span className="stat-value">{target.terrain}</span>
                            </div>
                        </div>

                        <div className="estimated-army">
                            <h5>🐜 Estimated Forces:</h5>
                            <div className="army-composition">
                                {Object.entries(target.estimatedArmy).map(([antType, count]) => (
                                    <div key={antType} className="ant-count">
                                        <span className="ant-type">{antType}:</span>
                                        <span className="ant-number">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="potential-rewards">
                            <h5>💰 Potential Rewards:</h5>
                            <div className="rewards-list">
                                <small>{formatRewards(target.rewards)}</small>
                            </div>
                        </div>

                        <div className="target-actions">
                            <button 
                                className={`select-button ${selectedTarget?.id === target.id ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onTargetSelect(target);
                                }}
                            >
                                {selectedTarget?.id === target.id ? '✓ Selected' : 'Select Target'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedTarget && (
                <div className="selected-target-info">
                    <div className="info-header">
                        <span className="info-icon">ℹ️</span>
                        <strong>Target Selected: {selectedTarget.name}</strong>
                    </div>
                    <div className="tactical-info">
                        <div className="info-section">
                            <h6>Tactical Considerations:</h6>
                            <ul>
                                <li>
                                    <strong>Terrain:</strong> {selectedTarget.terrain} - {getTerrainAdvice(selectedTarget.terrain)}
                                </li>
                                <li>
                                    <strong>Personality:</strong> {selectedTarget.personality} - {getPersonalityAdvice(selectedTarget.personality)}
                                </li>
                                <li>
                                    <strong>Difficulty:</strong> {selectedTarget.difficulty} - {getDifficultyAdvice(selectedTarget.difficulty)}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper functions for tactical advice
const getTerrainAdvice = (terrain) => {
    const advice = {
        forest: "Defensive bonus for enemies, consider bringing scouts",
        mountain: "Strong defensive advantage for defenders",
        grassland: "Balanced terrain, slight advantage to attackers",
        desert: "Neutral terrain with no bonuses",
        swamp: "Difficult terrain, heavily favors defenders",
        cave: "Extremely defensive terrain, very challenging"
    };
    return advice[terrain] || "Unknown terrain effects";
};

const getPersonalityAdvice = (personality) => {
    const advice = {
        aggressive: "Likely to counterattack, bring strong defensive units",
        defensive: "Well-fortified position, expect heavy resistance",
        opportunist: "May retreat early if losses are high",
        expansionist: "Spread out forces, find weak points",
        militant: "Elite combat units, prepare for tough fight"
    };
    return advice[personality] || "Unknown behavioral patterns";
};

const getDifficultyAdvice = (difficulty) => {
    const advice = {
        easy: "Good target for new raiders, moderate resistance expected",
        medium: "Balanced challenge, bring adequate forces",
        hard: "Experienced colony with strong defenses, high risk/reward"
    };
    return advice[difficulty.toLowerCase()] || "Assess carefully before attacking";
};

export default ColonySelector; 
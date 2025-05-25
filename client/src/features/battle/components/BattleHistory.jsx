/**
 * BattleHistory Component
 * Displays past battles with filtering options and detailed battle records
 */

import React, { useState, useEffect } from 'react';
import battleService from '../../../services/battleService';
import './BattleHistory.css';

const BattleHistory = ({ playerColony, onClose, onViewBattle }) => {
    const [battles, setBattles] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({
        outcome: 'all', // 'all', 'victory', 'defeat'
        type: 'all', // 'all', 'player_raid', 'defense', 'ai_attack'
        dateRange: 'all' // 'all', 'week', 'month', 'year'
    });

    const battlesPerPage = 10;

    useEffect(() => {
        loadBattleData();
    }, [playerColony.id, currentPage, filters]);

    const loadBattleData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [historyResponse, statsResponse] = await Promise.all([
                battleService.getBattleHistory(
                    playerColony.id,
                    battlesPerPage,
                    (currentPage - 1) * battlesPerPage
                ),
                battleService.getBattleStats(playerColony.id)
            ]);

            if (historyResponse.success && statsResponse.success) {
                let filteredBattles = historyResponse.history;

                // Apply filters
                if (filters.outcome !== 'all') {
                    filteredBattles = filteredBattles.filter(battle => 
                        battle.outcome === filters.outcome
                    );
                }

                if (filters.type !== 'all') {
                    filteredBattles = filteredBattles.filter(battle => 
                        battle.type === filters.type
                    );
                }

                if (filters.dateRange !== 'all') {
                    const now = Date.now();
                    const ranges = {
                        week: 7 * 24 * 60 * 60 * 1000,
                        month: 30 * 24 * 60 * 60 * 1000,
                        year: 365 * 24 * 60 * 60 * 1000
                    };
                    const cutoff = now - ranges[filters.dateRange];
                    
                    filteredBattles = filteredBattles.filter(battle => 
                        new Date(battle.timestamp).getTime() > cutoff
                    );
                }

                setBattles(filteredBattles);
                setStats(statsResponse.stats);
            } else {
                throw new Error('Failed to load battle data');
            }

        } catch (err) {
            setError(err.message);
            console.error('Error loading battle history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
        setCurrentPage(1); // Reset to first page when filtering
    };

    const handleViewBattle = (battle) => {
        if (onViewBattle) {
            onViewBattle(battle);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
        const diffMins = Math.floor(diffMs / (60 * 1000));

        if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffMins > 0) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    const getBattleIcon = (type, outcome) => {
        if (type === 'defense') {
            return outcome === 'victory' ? '🛡️' : '💀';
        } else if (type === 'player_raid') {
            return outcome === 'victory' ? '⚔️' : '💔';
        }
        return '⚡';
    };

    const getBattleOutcomeClass = (outcome) => {
        switch (outcome) {
            case 'victory': return 'victory';
            case 'defeat': return 'defeat';
            default: return 'draw';
        }
    };

    const getTotalCasualties = (casualties) => {
        if (!casualties) return 0;
        return Object.values(casualties).reduce((sum, count) => sum + count, 0);
    };

    const getRewardValue = (rewards) => {
        if (!rewards) return 0;
        return Object.values(rewards).reduce((sum, amount) => sum + amount, 0);
    };

    const totalPages = Math.ceil(battles.length / battlesPerPage);
    const paginatedBattles = battles.slice(
        (currentPage - 1) * battlesPerPage,
        currentPage * battlesPerPage
    );

    return (
        <div className="battle-history-overlay">
            <div className="battle-history">
                <div className="history-header">
                    <div className="header-content">
                        <h1>🏛️ Battle History</h1>
                        <button className="close-button" onClick={onClose}>×</button>
                    </div>
                    
                    {stats && (
                        <div className="battle-stats-summary">
                            <div className="stat-item">
                                <span className="stat-label">Total Battles</span>
                                <span className="stat-value">{stats.totalBattles}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Win Rate</span>
                                <span className="stat-value">{(stats.winRate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Victories</span>
                                <span className="stat-value victory">{stats.victories}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Defeats</span>
                                <span className="stat-value defeat">{stats.defeats}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Combat Rating</span>
                                <span className="stat-value">{stats.averageTacticalRating}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="history-filters">
                    <div className="filter-group">
                        <label>Outcome:</label>
                        <select 
                            value={filters.outcome} 
                            onChange={(e) => handleFilterChange('outcome', e.target.value)}
                        >
                            <option value="all">All Outcomes</option>
                            <option value="victory">Victories</option>
                            <option value="defeat">Defeats</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Battle Type:</label>
                        <select 
                            value={filters.type} 
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="player_raid">My Raids</option>
                            <option value="defense">Defenses</option>
                            <option value="ai_attack">AI Attacks</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Time Period:</label>
                        <select 
                            value={filters.dateRange} 
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                        >
                            <option value="all">All Time</option>
                            <option value="week">Past Week</option>
                            <option value="month">Past Month</option>
                            <option value="year">Past Year</option>
                        </select>
                    </div>
                </div>

                <div className="history-content">
                    {loading && (
                        <div className="loading-state">
                            <div className="loading-spinner">⚡</div>
                            <p>Loading battle history...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <span className="error-icon">⚠️</span>
                            <p>Error loading battle history: {error}</p>
                            <button onClick={loadBattleData}>Retry</button>
                        </div>
                    )}

                    {!loading && !error && battles.length === 0 && (
                        <div className="empty-state">
                            <span className="empty-icon">🗡️</span>
                            <h3>No battles found</h3>
                            <p>No battles match your current filters. Try adjusting the filters or initiate your first battle!</p>
                        </div>
                    )}

                    {!loading && !error && paginatedBattles.length > 0 && (
                        <>
                            <div className="battle-list">
                                {paginatedBattles.map((battle) => (
                                    <div 
                                        key={battle.id} 
                                        className={`battle-record ${getBattleOutcomeClass(battle.outcome)}`}
                                        onClick={() => handleViewBattle(battle)}
                                    >
                                        <div className="battle-summary">
                                            <div className="battle-icon">
                                                {getBattleIcon(battle.type, battle.outcome)}
                                            </div>
                                            <div className="battle-info">
                                                <div className="battle-title">
                                                    <span className="opponent">{battle.opponent}</span>
                                                    <span className={`outcome ${getBattleOutcomeClass(battle.outcome)}`}>
                                                        {battle.outcome.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="battle-details">
                                                    <span className="battle-type">
                                                        {battle.type === 'player_raid' ? 'Your Raid' : 
                                                         battle.type === 'defense' ? 'Defense' : 'AI Attack'}
                                                    </span>
                                                    <span className="battle-timestamp">
                                                        {formatTimestamp(battle.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="battle-metrics">
                                            <div className="metric-item">
                                                <span className="metric-label">Casualties</span>
                                                <span className="metric-value">
                                                    {getTotalCasualties(battle.casualties)}
                                                </span>
                                            </div>
                                            
                                            {battle.rewards && (
                                                <div className="metric-item">
                                                    <span className="metric-label">Rewards</span>
                                                    <span className="metric-value reward">
                                                        {getRewardValue(battle.rewards)}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {battle.tacticalRating && (
                                                <div className="metric-item">
                                                    <span className="metric-label">Rating</span>
                                                    <span className={`metric-value rating-${battle.tacticalRating}`}>
                                                        {battle.tacticalRating}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="battle-arrow">➤</div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button 
                                        className="page-btn" 
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                    >
                                        ⬅️ Previous
                                    </button>
                                    
                                    <span className="page-info">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    
                                    <button 
                                        className="page-btn" 
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                    >
                                        Next ➡️
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BattleHistory; 
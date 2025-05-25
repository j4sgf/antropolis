/**
 * Battle Service for Antopolis
 * Handles all battle-related API interactions
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class BattleService {
    /**
     * Get API health status including scheduler info
     */
    async getHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/health`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching battle API health:', error);
            throw error;
        }
    }

    /**
     * Get available targets for raids
     */
    async getAvailableTargets(colonyId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/targets/${colonyId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch available targets');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching available targets:', error);
            throw error;
        }
    }

    /**
     * Execute a player-initiated raid
     */
    async executeRaid(raidData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(raidData),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to execute raid');
            }
            
            return data;
        } catch (error) {
            console.error('Error executing raid:', error);
            throw error;
        }
    }

    /**
     * Simulate a battle without executing it
     */
    async simulateBattle(attackerArmy, defenderArmy, battleConditions = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/simulate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    attackerArmy,
                    defenderArmy,
                    battleConditions,
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to simulate battle');
            }
            
            return data;
        } catch (error) {
            console.error('Error simulating battle:', error);
            throw error;
        }
    }

    /**
     * Get incoming attacks for a colony
     */
    async getIncomingAttacks(colonyId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/incoming?colonyId=${colonyId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch incoming attacks');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching incoming attacks:', error);
            throw error;
        }
    }

    /**
     * Get battle history for a colony
     */
    async getBattleHistory(colonyId, limit = 20, offset = 0) {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/battles/history/${colonyId}?limit=${limit}&offset=${offset}`
            );
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch battle history');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching battle history:', error);
            throw error;
        }
    }

    /**
     * Get battle statistics for a colony
     */
    async getBattleStats(colonyId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/stats/${colonyId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch battle stats');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching battle stats:', error);
            throw error;
        }
    }

    /**
     * Execute a retreat from an ongoing battle
     */
    async retreatFromBattle(battleId, colonyId, remainingArmy) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/retreat/${battleId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    colonyId,
                    remainingArmy,
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to retreat from battle');
            }
            
            return data;
        } catch (error) {
            console.error('Error retreating from battle:', error);
            throw error;
        }
    }

    /**
     * Get AI attack scheduler status
     */
    async getSchedulerStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/scheduler/status`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get scheduler status');
            }
            
            return data;
        } catch (error) {
            console.error('Error getting scheduler status:', error);
            throw error;
        }
    }

    /**
     * Start the AI attack scheduler
     */
    async startScheduler() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/scheduler/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to start scheduler');
            }
            
            return data;
        } catch (error) {
            console.error('Error starting scheduler:', error);
            throw error;
        }
    }

    /**
     * Stop the AI attack scheduler
     */
    async stopScheduler() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/scheduler/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to stop scheduler');
            }
            
            return data;
        } catch (error) {
            console.error('Error stopping scheduler:', error);
            throw error;
        }
    }

    /**
     * Get detailed battle results by battle ID
     */
    async getBattleResults(battleId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/results/${battleId}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch battle results');
            }
            
            return data;
        } catch (error) {
            console.error('Error fetching battle results:', error);
            throw error;
        }
    }

    /**
     * Calculate and distribute rewards for a successful battle
     */
    async distributeRewards(battleId, colonyId, rewards) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/battles/rewards/${battleId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    colonyId,
                    rewards,
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to distribute rewards');
            }
            
            return data;
        } catch (error) {
            console.error('Error distributing rewards:', error);
            throw error;
        }
    }
}

// Export singleton instance
export default new BattleService(); 
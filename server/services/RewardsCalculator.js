/**
 * RewardsCalculator Service for Antopolis
 * Calculates battle rewards based on enemy strength, performance, and other factors
 */

class RewardsCalculator {
    constructor() {
        // Base resource values per enemy strength point
        this.baseResourceValues = {
            food: 2.5,
            materials: 1.8,
            energy: 1.2,
            territory: 0.01
        };

        // Performance multipliers based on tactical rating
        this.performanceMultipliers = {
            brilliant: 1.5,
            good: 1.2,
            fair: 1.0,
            poor: 0.8,
            terrible: 0.6
        };

        // Victory margin bonuses
        this.victoryMarginBonuses = {
            overwhelming: 1.3,
            decisive: 1.15,
            clear: 1.05,
            narrow: 1.0,
            pyrrhic: 0.9
        };

        // Terrain bonuses for successful attacks
        this.terrainBonuses = {
            grassland: 1.0,
            forest: 1.1,
            mountain: 1.2,
            desert: 1.05,
            swamp: 1.15,
            cave: 1.25
        };
    }

    /**
     * Calculate rewards for a successful battle
     * @param {Object} battleResult - Result of the battle simulation
     * @param {Object} attackerColony - Attacking colony information
     * @param {Object} defenderColony - Defending colony information
     * @returns {Object} Calculated rewards
     */
    calculateBattleRewards(battleResult, attackerColony, defenderColony) {
        try {
            // Only calculate rewards for attacker victories
            if (battleResult.victor !== 'attacker') {
                return null;
            }

            const baseRewards = this.calculateBaseRewards(defenderColony);
            const performanceBonus = this.calculatePerformanceBonus(battleResult);
            const terrainBonus = this.calculateTerrainBonus(defenderColony.terrain);
            const casualtyPenalty = this.calculateCasualtyPenalty(battleResult);

            const finalRewards = {};
            
            for (const [resource, baseAmount] of Object.entries(baseRewards)) {
                let finalAmount = baseAmount;
                
                // Apply all modifiers
                finalAmount *= performanceBonus;
                finalAmount *= terrainBonus;
                finalAmount *= casualtyPenalty;
                
                // Round to whole numbers
                finalRewards[resource] = Math.max(1, Math.floor(finalAmount));
            }

            return {
                baseRewards,
                finalRewards,
                modifiers: {
                    performanceBonus,
                    terrainBonus,
                    casualtyPenalty
                },
                totalValue: this.calculateTotalValue(finalRewards)
            };

        } catch (error) {
            console.error('Error calculating battle rewards:', error);
            return null;
        }
    }

    /**
     * Calculate base rewards based on enemy colony strength
     * @param {Object} defenderColony - Defending colony data
     * @returns {Object} Base reward amounts
     */
    calculateBaseRewards(defenderColony) {
        const strength = defenderColony.strength || this.calculateColonyStrength(defenderColony);
        
        const baseRewards = {};
        for (const [resource, multiplier] of Object.entries(this.baseResourceValues)) {
            baseRewards[resource] = Math.floor(strength * multiplier);
        }

        // Add bonus resources based on colony type or special characteristics
        if (defenderColony.personality === 'militant') {
            baseRewards.materials = Math.floor(baseRewards.materials * 1.2);
        } else if (defenderColony.personality === 'expansionist') {
            baseRewards.territory = Math.floor(baseRewards.territory * 2);
        } else if (defenderColony.personality === 'defensive') {
            baseRewards.food = Math.floor(baseRewards.food * 1.15);
        }

        return baseRewards;
    }

    /**
     * Calculate performance bonus based on tactical rating and victory margin
     * @param {Object} battleResult - Battle simulation result
     * @returns {number} Performance multiplier
     */
    calculatePerformanceBonus(battleResult) {
        const efficiency = battleResult.battleEfficiency || {};
        
        const tacticalMultiplier = this.performanceMultipliers[efficiency.tacticalRating] || 1.0;
        const victoryMultiplier = this.victoryMarginBonuses[efficiency.victoryMargin] || 1.0;
        
        return tacticalMultiplier * victoryMultiplier;
    }

    /**
     * Calculate terrain bonus for successful conquest
     * @param {string} terrain - Terrain type of the conquered area
     * @returns {number} Terrain multiplier
     */
    calculateTerrainBonus(terrain) {
        return this.terrainBonuses[terrain] || 1.0;
    }

    /**
     * Calculate casualty penalty (lower rewards for pyrrhic victories)
     * @param {Object} battleResult - Battle simulation result
     * @returns {number} Casualty penalty multiplier
     */
    calculateCasualtyPenalty(battleResult) {
        const attackerCasualties = battleResult.totalCasualties?.attacker || {};
        const attackerSurvivors = battleResult.armySurvivors?.attacker || {};
        
        const totalCasualties = Object.values(attackerCasualties).reduce((sum, count) => sum + count, 0);
        const totalSurvivors = Object.values(attackerSurvivors).reduce((sum, count) => sum + count, 0);
        const totalOriginal = totalCasualties + totalSurvivors;
        
        if (totalOriginal === 0) return 1.0;
        
        const casualtyRate = totalCasualties / totalOriginal;
        
        // Penalty scale: 0% casualties = 1.0x, 50% casualties = 0.8x, 100% casualties = 0.5x
        return Math.max(0.5, 1.0 - (casualtyRate * 0.5));
    }

    /**
     * Calculate colony strength from army composition
     * @param {Object} colony - Colony data with army information
     * @returns {number} Total strength value
     */
    calculateColonyStrength(colony) {
        const army = colony.army || colony.estimatedArmy || {};
        
        // Combat values for different ant types
        const combatValues = {
            worker: 1,
            scout: 1.5,
            soldier: 3,
            guard: 4,
            elite: 6
        };
        
        let totalStrength = 0;
        for (const [antType, count] of Object.entries(army)) {
            const combatValue = combatValues[antType] || 1;
            totalStrength += count * combatValue;
        }
        
        return totalStrength;
    }

    /**
     * Calculate total value of all rewards
     * @param {Object} rewards - Reward amounts by resource type
     * @returns {number} Total reward value
     */
    calculateTotalValue(rewards) {
        const resourceValues = {
            food: 1,
            materials: 1.2,
            energy: 1.5,
            territory: 100 // Territory is very valuable
        };
        
        let totalValue = 0;
        for (const [resource, amount] of Object.entries(rewards)) {
            const value = resourceValues[resource] || 1;
            totalValue += amount * value;
        }
        
        return Math.floor(totalValue);
    }

    /**
     * Calculate special event rewards (rare bonuses)
     * @param {Object} battleResult - Battle result
     * @param {Object} conditions - Special battle conditions
     * @returns {Object} Special rewards if any
     */
    calculateSpecialRewards(battleResult, conditions = {}) {
        const specialRewards = {};
        
        // Perfect victory bonus (no casualties)
        const attackerCasualties = battleResult.totalCasualties?.attacker || {};
        const totalCasualties = Object.values(attackerCasualties).reduce((sum, count) => sum + count, 0);
        
        if (totalCasualties === 0) {
            specialRewards.perfectVictoryBonus = {
                food: 50,
                materials: 30,
                prestigePoints: 10
            };
        }
        
        // Underdog victory (attacking much stronger enemy)
        if (conditions.strengthRatio && conditions.strengthRatio > 1.5) {
            const underdogMultiplier = Math.min(2.0, conditions.strengthRatio / 1.5);
            specialRewards.underdogBonus = {
                materials: Math.floor(50 * underdogMultiplier),
                prestigePoints: Math.floor(15 * underdogMultiplier)
            };
        }
        
        // Speed victory bonus (battle ended quickly)
        if (battleResult.phases && battleResult.phases.length <= 2) {
            specialRewards.speedBonus = {
                energy: 25,
                prestigePoints: 5
            };
        }
        
        return Object.keys(specialRewards).length > 0 ? specialRewards : null;
    }

    /**
     * Format rewards for display
     * @param {Object} rewards - Reward calculation result
     * @returns {Object} Formatted reward information
     */
    formatRewardsDisplay(rewards) {
        if (!rewards) return null;
        
        return {
            summary: rewards.finalRewards,
            breakdown: {
                base: rewards.baseRewards,
                modifiers: rewards.modifiers,
                total: rewards.finalRewards
            },
            totalValue: rewards.totalValue,
            displayText: this.generateRewardText(rewards.finalRewards)
        };
    }

    /**
     * Generate human-readable reward text
     * @param {Object} rewards - Final reward amounts
     * @returns {string} Formatted text description
     */
    generateRewardText(rewards) {
        const rewardTexts = [];
        
        for (const [resource, amount] of Object.entries(rewards)) {
            if (amount > 0) {
                rewardTexts.push(`${amount} ${resource}`);
            }
        }
        
        return rewardTexts.join(', ');
    }
}

module.exports = RewardsCalculator; 
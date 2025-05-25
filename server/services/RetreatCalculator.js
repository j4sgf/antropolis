/**
 * RetreatCalculator Service for Antopolis
 * Calculates retreat mechanics, penalties, and consequences
 */

class RetreatCalculator {
    constructor() {
        // Base retreat casualty rates by ant type
        this.baseCasualtyRates = {
            worker: 0.15,    // Workers are most vulnerable during retreat
            scout: 0.08,     // Scouts are fastest and escape easier
            soldier: 0.12,   // Soldiers have training to retreat in formation
            guard: 0.20,     // Guards often sacrifice themselves covering retreat
            elite: 0.06      // Elite units are best trained for tactical withdrawal
        };

        // Retreat condition modifiers
        this.conditionModifiers = {
            terrain: {
                grassland: 1.0,    // Standard retreat conditions
                forest: 0.85,      // Trees provide cover during retreat
                mountain: 1.25,    // Difficult terrain increases casualties
                desert: 1.15,      // Harsh conditions make retreat harder
                swamp: 1.35,       // Worst terrain for retreating forces
                cave: 0.9          // Underground tunnels aid escape
            },
            battlePhase: {
                early: 0.7,        // Retreat early in battle has lower penalties
                middle: 1.0,       // Standard penalties
                late: 1.4,         // Late retreat is more costly
                rout: 2.0          // Panic retreat has severe penalties
            },
            enemyPursuit: {
                none: 0.8,         // Enemy doesn't pursue
                light: 1.0,        // Normal pursuit
                aggressive: 1.3,   // Heavy pursuit increases casualties
                relentless: 1.6    // Enemy follows and attacks retreating forces
            }
        };

        // Resource penalties for retreating
        this.resourcePenalties = {
            food: 25,          // Emergency rations consumed during retreat
            materials: 15,     // Equipment abandoned or damaged
            morale: 20         // Morale penalty for retreat (future mechanic)
        };

        // Cooldown penalties (in milliseconds)
        this.cooldownPenalties = {
            base: 2 * 60 * 60 * 1000,        // 2 hours base cooldown
            perCasualty: 5 * 60 * 1000,       // 5 minutes per casualty
            maxCooldown: 8 * 60 * 60 * 1000   // Maximum 8 hours
        };
    }

    /**
     * Calculate retreat consequences for an army
     * @param {Object} remainingArmy - Current army composition
     * @param {Object} battleConditions - Battle state and conditions
     * @returns {Object} Retreat calculation results
     */
    calculateRetreat(remainingArmy, battleConditions = {}) {
        try {
            const retreatCasualties = this.calculateRetreatCasualties(
                remainingArmy, 
                battleConditions
            );
            
            const survivingArmy = this.calculateSurvivors(
                remainingArmy, 
                retreatCasualties
            );
            
            const resourcePenalties = this.calculateResourcePenalties(
                remainingArmy,
                retreatCasualties,
                battleConditions
            );
            
            const cooldownPenalty = this.calculateCooldownPenalty(
                remainingArmy,
                retreatCasualties,
                battleConditions
            );

            const moralePenalty = this.calculateMoralePenalty(
                remainingArmy,
                retreatCasualties,
                battleConditions
            );

            return {
                success: true,
                originalArmy: remainingArmy,
                retreatCasualties,
                survivingArmy,
                penalties: {
                    resources: resourcePenalties,
                    cooldown: cooldownPenalty,
                    morale: moralePenalty
                },
                totalCasualties: this.getTotalCasualties(retreatCasualties),
                retreatEfficiency: this.calculateRetreatEfficiency(
                    remainingArmy, 
                    retreatCasualties, 
                    battleConditions
                )
            };

        } catch (error) {
            console.error('Error calculating retreat:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate casualties sustained during retreat
     * @param {Object} army - Army composition
     * @param {Object} conditions - Battle conditions
     * @returns {Object} Casualty breakdown by ant type
     */
    calculateRetreatCasualties(army, conditions) {
        const casualties = {};
        
        // Get condition modifiers
        const terrainMod = this.conditionModifiers.terrain[conditions.terrain] || 1.0;
        const phaseMod = this.conditionModifiers.battlePhase[conditions.battlePhase] || 1.0;
        const pursuitMod = this.conditionModifiers.enemyPursuit[conditions.enemyPursuit] || 1.0;
        
        const totalModifier = terrainMod * phaseMod * pursuitMod;
        
        for (const [antType, count] of Object.entries(army)) {
            if (count > 0) {
                const baseCasualtyRate = this.baseCasualtyRates[antType] || 0.12;
                const finalCasualtyRate = Math.min(0.5, baseCasualtyRate * totalModifier);
                
                // Add some randomness (±20% variance)
                const variance = 0.8 + (Math.random() * 0.4);
                const adjustedRate = finalCasualtyRate * variance;
                
                casualties[antType] = Math.max(0, Math.floor(count * adjustedRate));
            }
        }
        
        return casualties;
    }

    /**
     * Calculate surviving army after retreat casualties
     * @param {Object} originalArmy - Original army composition
     * @param {Object} casualties - Retreat casualties
     * @returns {Object} Surviving army composition
     */
    calculateSurvivors(originalArmy, casualties) {
        const survivors = {};
        
        for (const [antType, originalCount] of Object.entries(originalArmy)) {
            const casualtyCount = casualties[antType] || 0;
            survivors[antType] = Math.max(0, originalCount - casualtyCount);
        }
        
        return survivors;
    }

    /**
     * Calculate resource penalties for retreating
     * @param {Object} army - Army composition
     * @param {Object} casualties - Retreat casualties
     * @param {Object} conditions - Battle conditions
     * @returns {Object} Resource penalty amounts
     */
    calculateResourcePenalties(army, casualties, conditions) {
        const armySize = Object.values(army).reduce((sum, count) => sum + count, 0);
        const totalCasualties = this.getTotalCasualties(casualties);
        
        // Scale penalties based on army size and casualties
        const sizeMultiplier = Math.max(0.5, armySize / 20); // Larger armies have larger penalties
        const casualtyMultiplier = 1 + (totalCasualties / armySize); // More casualties = higher penalties
        
        const penalties = {};
        for (const [resource, basePenalty] of Object.entries(this.resourcePenalties)) {
            penalties[resource] = Math.floor(basePenalty * sizeMultiplier * casualtyMultiplier);
        }
        
        return penalties;
    }

    /**
     * Calculate cooldown penalty for next battle
     * @param {Object} army - Army composition
     * @param {Object} casualties - Retreat casualties
     * @param {Object} conditions - Battle conditions
     * @returns {number} Cooldown penalty in milliseconds
     */
    calculateCooldownPenalty(army, casualties, conditions) {
        const totalCasualties = this.getTotalCasualties(casualties);
        const baseCooldown = this.cooldownPenalties.base;
        const casualtyCooldown = totalCasualties * this.cooldownPenalties.perCasualty;
        
        // Additional penalties for poor retreat conditions
        let conditionMultiplier = 1.0;
        if (conditions.battlePhase === 'late') conditionMultiplier += 0.5;
        if (conditions.battlePhase === 'rout') conditionMultiplier += 1.0;
        if (conditions.enemyPursuit === 'aggressive') conditionMultiplier += 0.3;
        if (conditions.enemyPursuit === 'relentless') conditionMultiplier += 0.6;
        
        const totalCooldown = (baseCooldown + casualtyCooldown) * conditionMultiplier;
        
        return Math.min(totalCooldown, this.cooldownPenalties.maxCooldown);
    }

    /**
     * Calculate morale penalty for retreat
     * @param {Object} army - Army composition
     * @param {Object} casualties - Retreat casualties
     * @param {Object} conditions - Battle conditions
     * @returns {number} Morale penalty value
     */
    calculateMoralePenalty(army, casualties, conditions) {
        const armySize = Object.values(army).reduce((sum, count) => sum + count, 0);
        const totalCasualties = this.getTotalCasualties(casualties);
        const casualtyRate = totalCasualties / armySize;
        
        // Base morale penalty + casualties impact
        let moralePenalty = 15 + (casualtyRate * 30);
        
        // Condition modifiers
        if (conditions.battlePhase === 'early') moralePenalty *= 0.7; // Early retreat is less demoralizing
        if (conditions.battlePhase === 'rout') moralePenalty *= 1.5; // Rout is very demoralizing
        if (conditions.enemyPursuit === 'relentless') moralePenalty *= 1.3; // Being hunted hurts morale
        
        return Math.floor(Math.min(moralePenalty, 50)); // Cap at 50 morale penalty
    }

    /**
     * Calculate overall retreat efficiency rating
     * @param {Object} army - Original army
     * @param {Object} casualties - Retreat casualties
     * @param {Object} conditions - Battle conditions
     * @returns {Object} Efficiency rating and description
     */
    calculateRetreatEfficiency(army, casualties, conditions) {
        const armySize = Object.values(army).reduce((sum, count) => sum + count, 0);
        const totalCasualties = this.getTotalCasualties(casualties);
        const survivalRate = (armySize - totalCasualties) / armySize;
        
        let rating, description;
        
        if (survivalRate >= 0.9) {
            rating = 'excellent';
            description = 'Masterful tactical withdrawal with minimal losses';
        } else if (survivalRate >= 0.8) {
            rating = 'good';
            description = 'Well-executed retreat saving most forces';
        } else if (survivalRate >= 0.7) {
            rating = 'fair';
            description = 'Orderly withdrawal with acceptable losses';
        } else if (survivalRate >= 0.5) {
            rating = 'poor';
            description = 'Costly retreat with heavy casualties';
        } else {
            rating = 'disastrous';
            description = 'Chaotic rout with massive losses';
        }
        
        return {
            rating,
            description,
            survivalRate: Math.round(survivalRate * 100),
            totalCasualties
        };
    }

    /**
     * Get total casualties across all ant types
     * @param {Object} casualties - Casualties by ant type
     * @returns {number} Total casualty count
     */
    getTotalCasualties(casualties) {
        return Object.values(casualties).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Determine if retreat is recommended based on battle conditions
     * @param {Object} currentArmy - Current army state
     * @param {Object} enemyArmy - Enemy army composition
     * @param {Object} battleState - Current battle statistics
     * @returns {Object} Retreat recommendation
     */
    shouldRetreat(currentArmy, enemyArmy, battleState) {
        const ourStrength = this.calculateArmyStrength(currentArmy);
        const enemyStrength = this.calculateArmyStrength(enemyArmy);
        const strengthRatio = ourStrength / enemyStrength;
        
        const ourCasualties = battleState.ourCasualties || 0;
        const enemyCasualties = battleState.enemyCasualties || 0;
        const casualtyRatio = ourCasualties / (ourCasualties + enemyCasualties + 1);
        
        let recommendation = 'continue';
        let reason = 'Battle conditions favor continued engagement';
        
        if (strengthRatio < 0.3) {
            recommendation = 'retreat_immediately';
            reason = 'Overwhelming enemy superiority detected';
        } else if (strengthRatio < 0.5 && casualtyRatio > 0.7) {
            recommendation = 'retreat_advised';
            reason = 'Heavy casualties with enemy advantage';
        } else if (casualtyRatio > 0.8) {
            recommendation = 'retreat_consider';
            reason = 'Severe casualties sustained';
        }
        
        return {
            recommendation,
            reason,
            strengthRatio: Math.round(strengthRatio * 100),
            casualtyRatio: Math.round(casualtyRatio * 100)
        };
    }

    /**
     * Calculate relative army strength
     * @param {Object} army - Army composition
     * @returns {number} Total strength value
     */
    calculateArmyStrength(army) {
        const strengthValues = {
            worker: 1,
            scout: 1.5,
            soldier: 3,
            guard: 4,
            elite: 6
        };
        
        let totalStrength = 0;
        for (const [antType, count] of Object.entries(army)) {
            const strength = strengthValues[antType] || 1;
            totalStrength += count * strength;
        }
        
        return totalStrength;
    }
}

module.exports = RetreatCalculator; 
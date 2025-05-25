/**
 * Battle Simulation Engine for Antopolis
 * Calculates battle outcomes based on colony composition, terrain, and strategy
 */

class BattleSimulator {
    constructor() {
        this.config = {
            // Base combat values
            baseCombatStrength: {
                worker: 1,
                soldier: 3,
                scout: 1.5,
                guard: 4,
                elite: 5
            },
            
            // Defensive multipliers
            defenseMultipliers: {
                worker: 0.8,
                soldier: 1.0,
                scout: 0.6,
                guard: 1.2,
                elite: 1.3
            },
            
            // Formation bonuses
            formations: {
                aggressive: { attack: 1.2, defense: 0.8 },
                defensive: { attack: 0.8, defense: 1.3 },
                balanced: { attack: 1.0, defense: 1.0 },
                guerrilla: { attack: 1.1, defense: 0.9 }
            },
            
            // Terrain modifiers
            terrainModifiers: {
                forest: { attacker: 0.9, defender: 1.1 },
                desert: { attacker: 1.0, defender: 1.0 },
                mountain: { attacker: 0.8, defender: 1.2 },
                grassland: { attacker: 1.1, defender: 0.9 },
                swamp: { attacker: 0.7, defender: 1.0 },
                cave: { attacker: 0.6, defender: 1.4 }
            },
            
            // Battle phases and duration
            battlePhases: 3,
            casualtyRate: 0.15, // Base casualty rate per phase
            maxCasualtyRate: 0.4, // Maximum casualties in a single battle
            
            // Random factors
            randomnessRange: 0.15, // ±15% randomness in calculations
        };
    }

    /**
     * Main battle simulation function
     * @param {Object} attackerArmy - Attacking colony's army composition
     * @param {Object} defenderArmy - Defending colony's army composition
     * @param {Object} battleConditions - Terrain, formations, modifiers
     * @returns {Object} Battle result with casualties and outcome
     */
    simulateBattle(attackerArmy, defenderArmy, battleConditions = {}) {
        try {
            // Validate inputs
            this.validateBattleInputs(attackerArmy, defenderArmy);
            
            // Initialize battle state
            const battleState = this.initializeBattleState(attackerArmy, defenderArmy, battleConditions);
            
            // Simulate battle phases
            const phaseResults = [];
            for (let phase = 1; phase <= this.config.battlePhases; phase++) {
                const phaseResult = this.simulateBattlePhase(battleState, phase);
                phaseResults.push(phaseResult);
                
                // Check if battle should end early
                if (phaseResult.battleEnded) break;
            }
            
            // Calculate final outcome
            const finalResult = this.calculateFinalOutcome(battleState, phaseResults);
            
            return {
                success: true,
                result: finalResult,
                phases: phaseResults,
                battleId: this.generateBattleId(),
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Battle simulation error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Initialize battle state with army compositions and modifiers
     */
    initializeBattleState(attackerArmy, defenderArmy, conditions) {
        const terrain = conditions.terrain || 'grassland';
        const attackerFormation = conditions.attackerFormation || 'balanced';
        const defenderFormation = conditions.defenderFormation || 'defensive';
        
        return {
            attacker: {
                army: { ...attackerArmy },
                formation: attackerFormation,
                strength: this.calculateArmyStrength(attackerArmy, 'attacker', terrain, attackerFormation),
                originalSize: this.getArmySize(attackerArmy),
                casualties: {}
            },
            defender: {
                army: { ...defenderArmy },
                formation: defenderFormation,
                strength: this.calculateArmyStrength(defenderArmy, 'defender', terrain, defenderFormation),
                originalSize: this.getArmySize(defenderArmy),
                casualties: {}
            },
            conditions: {
                terrain,
                weather: conditions.weather || 'clear',
                timeOfDay: conditions.timeOfDay || 'day'
            }
        };
    }

    /**
     * Calculate total army strength with all modifiers applied
     */
    calculateArmyStrength(army, role, terrain, formation) {
        let totalStrength = 0;
        
        // Base strength calculation
        for (const [antType, count] of Object.entries(army)) {
            const baseStrength = this.config.baseCombatStrength[antType] || 1;
            const defenseModifier = role === 'defender' ? this.config.defenseMultipliers[antType] : 1;
            totalStrength += baseStrength * defenseModifier * count;
        }
        
        // Apply formation modifiers
        const formationMod = this.config.formations[formation];
        if (formationMod) {
            const modifier = role === 'attacker' ? formationMod.attack : formationMod.defense;
            totalStrength *= modifier;
        }
        
        // Apply terrain modifiers
        const terrainMod = this.config.terrainModifiers[terrain];
        if (terrainMod) {
            totalStrength *= terrainMod[role];
        }
        
        // Add controlled randomness
        const randomFactor = 1 + (Math.random() * 2 - 1) * this.config.randomnessRange;
        totalStrength *= randomFactor;
        
        return Math.max(totalStrength, 0);
    }

    /**
     * Simulate a single battle phase
     */
    simulateBattlePhase(battleState, phaseNumber) {
        const attackerStrength = battleState.attacker.strength;
        const defenderStrength = battleState.defender.strength;
        
        // Calculate strength ratio for this phase
        const totalStrength = attackerStrength + defenderStrength;
        const attackerAdvantage = attackerStrength / totalStrength;
        
        // Determine phase casualties
        const attackerCasualties = this.calculatePhaseCasualties(
            battleState.attacker, 1 - attackerAdvantage, phaseNumber
        );
        const defenderCasualties = this.calculatePhaseCasualties(
            battleState.defender, attackerAdvantage, phaseNumber
        );
        
        // Apply casualties
        this.applyCasualties(battleState.attacker, attackerCasualties);
        this.applyCasualties(battleState.defender, defenderCasualties);
        
        // Update remaining strength
        battleState.attacker.strength = this.calculateRemainingStrength(battleState.attacker);
        battleState.defender.strength = this.calculateRemainingStrength(battleState.defender);
        
        // Check if battle should end
        const battleEnded = battleState.attacker.strength <= 0 || battleState.defender.strength <= 0;
        
        return {
            phase: phaseNumber,
            attackerCasualties,
            defenderCasualties,
            remainingStrength: {
                attacker: battleState.attacker.strength,
                defender: battleState.defender.strength
            },
            battleEnded
        };
    }

    /**
     * Calculate casualties for a battle phase
     */
    calculatePhaseCasualties(armyState, disadvantage, phaseNumber) {
        const casualties = {};
        const baseCasualtyRate = this.config.casualtyRate * disadvantage;
        
        // Add phase escalation (battles get more deadly over time)
        const phaseMultiplier = 1 + (phaseNumber - 1) * 0.1;
        const adjustedRate = Math.min(baseCasualtyRate * phaseMultiplier, this.config.maxCasualtyRate);
        
        for (const [antType, count] of Object.entries(armyState.army)) {
            if (count > 0) {
                // Different ant types have different survival rates
                const survivalModifier = this.getAntSurvivalModifier(antType);
                const casualtyCount = Math.floor(count * adjustedRate * survivalModifier);
                casualties[antType] = Math.min(casualtyCount, count);
            }
        }
        
        return casualties;
    }

    /**
     * Get survival modifier for different ant types
     */
    getAntSurvivalModifier(antType) {
        const modifiers = {
            worker: 1.2, // Workers are more vulnerable
            soldier: 0.8, // Soldiers are hardy
            scout: 1.0, // Scouts are average
            guard: 0.7, // Guards are very hardy
            elite: 0.6 // Elite units are most survivable
        };
        return modifiers[antType] || 1.0;
    }

    /**
     * Apply casualties to an army
     */
    applyCasualties(armyState, casualties) {
        for (const [antType, casualtyCount] of Object.entries(casualties)) {
            if (armyState.army[antType]) {
                armyState.army[antType] = Math.max(0, armyState.army[antType] - casualtyCount);
                
                // Track total casualties
                if (!armyState.casualties[antType]) {
                    armyState.casualties[antType] = 0;
                }
                armyState.casualties[antType] += casualtyCount;
            }
        }
    }

    /**
     * Calculate remaining army strength after casualties
     */
    calculateRemainingStrength(armyState) {
        let strength = 0;
        for (const [antType, count] of Object.entries(armyState.army)) {
            const baseStrength = this.config.baseCombatStrength[antType] || 1;
            strength += baseStrength * count;
        }
        return strength;
    }

    /**
     * Calculate final battle outcome
     */
    calculateFinalOutcome(battleState, phaseResults) {
        const attackerSurvived = battleState.attacker.strength > 0;
        const defenderSurvived = battleState.defender.strength > 0;
        
        let outcome;
        if (attackerSurvived && !defenderSurvived) {
            outcome = 'attacker_victory';
        } else if (!attackerSurvived && defenderSurvived) {
            outcome = 'defender_victory';
        } else if (attackerSurvived && defenderSurvived) {
            // Both survived - compare remaining strength
            outcome = battleState.attacker.strength > battleState.defender.strength 
                ? 'attacker_victory' : 'defender_victory';
        } else {
            outcome = 'mutual_destruction';
        }
        
        return {
            outcome,
            victor: outcome.includes('attacker') ? 'attacker' : 
                   outcome.includes('defender') ? 'defender' : 'none',
            finalStrength: {
                attacker: battleState.attacker.strength,
                defender: battleState.defender.strength
            },
            totalCasualties: {
                attacker: battleState.attacker.casualties,
                defender: battleState.defender.casualties
            },
            armySurvivors: {
                attacker: battleState.attacker.army,
                defender: battleState.defender.army
            },
            battleEfficiency: this.calculateBattleEfficiency(battleState)
        };
    }

    /**
     * Calculate battle efficiency metrics
     */
    calculateBattleEfficiency(battleState) {
        const attackerLossRate = this.getArmyLossRate(battleState.attacker);
        const defenderLossRate = this.getArmyLossRate(battleState.defender);
        
        return {
            attackerLossRate,
            defenderLossRate,
            battleDuration: 'normal', // Can be expanded for different battle lengths
            tacticalRating: this.calculateTacticalRating(attackerLossRate, defenderLossRate)
        };
    }

    /**
     * Get army loss rate (percentage of original army lost)
     */
    getArmyLossRate(armyState) {
        const totalCasualties = Object.values(armyState.casualties).reduce((sum, count) => sum + count, 0);
        return armyState.originalSize > 0 ? totalCasualties / armyState.originalSize : 0;
    }

    /**
     * Calculate tactical rating based on performance
     */
    calculateTacticalRating(attackerLossRate, defenderLossRate) {
        const efficiency = defenderLossRate - attackerLossRate;
        if (efficiency > 0.3) return 'brilliant';
        if (efficiency > 0.1) return 'good';
        if (efficiency > -0.1) return 'fair';
        if (efficiency > -0.3) return 'poor';
        return 'disastrous';
    }

    /**
     * Get total army size
     */
    getArmySize(army) {
        return Object.values(army).reduce((sum, count) => sum + count, 0);
    }

    /**
     * Validate battle inputs
     */
    validateBattleInputs(attackerArmy, defenderArmy) {
        if (!attackerArmy || !defenderArmy) {
            throw new Error('Both attacker and defender armies are required');
        }
        
        if (this.getArmySize(attackerArmy) === 0) {
            throw new Error('Attacker army cannot be empty');
        }
        
        if (this.getArmySize(defenderArmy) === 0) {
            throw new Error('Defender army cannot be empty');
        }
    }

    /**
     * Generate unique battle ID
     */
    generateBattleId() {
        return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calculate resource rewards for battle victory
     */
    calculateBattleRewards(battleResult, victoriousColony, defeatedColony) {
        if (battleResult.victor === 'none') {
            return { resources: {}, message: 'No rewards - mutual destruction' };
        }
        
        const baseRewards = {
            food: 100,
            wood: 50,
            stone: 30,
            minerals: 20,
            water: 40
        };
        
        // Scale rewards based on battle efficiency
        const efficiency = battleResult.battleEfficiency;
        const efficiencyMultiplier = efficiency.tacticalRating === 'brilliant' ? 1.5 :
                                   efficiency.tacticalRating === 'good' ? 1.2 :
                                   efficiency.tacticalRating === 'fair' ? 1.0 :
                                   efficiency.tacticalRating === 'poor' ? 0.8 : 0.6;
        
        // Scale rewards based on defeated colony size
        const colonyStrength = defeatedColony.population || 100;
        const strengthMultiplier = Math.min(colonyStrength / 100, 2.0); // Cap at 2x rewards
        
        const finalRewards = {};
        for (const [resource, amount] of Object.entries(baseRewards)) {
            finalRewards[resource] = Math.floor(amount * efficiencyMultiplier * strengthMultiplier);
        }
        
        return {
            resources: finalRewards,
            message: `Victory rewards (${efficiency.tacticalRating} tactical performance)`,
            multipliers: {
                efficiency: efficiencyMultiplier,
                strength: strengthMultiplier
            }
        };
    }
}

module.exports = BattleSimulator; 
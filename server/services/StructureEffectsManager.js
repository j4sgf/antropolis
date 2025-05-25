const Structure = require('../models/Structure');
const { supabase, handleDatabaseError } = require('../config/database');

/**
 * StructureEffectsManager service handles the application of structure bonuses
 * to colony stats and manages structure effects, damage, and maintenance
 */
class StructureEffectsManager {
  constructor() {
    this.effectsCache = new Map(); // colonyId -> calculated effects
    this.lastCalculation = new Map(); // colonyId -> timestamp
    this.cacheTimeout = 30000; // 30 seconds cache timeout
  }

  /**
   * Calculate all structure effects for a colony
   * @param {string} colonyId - Colony ID
   * @returns {Object} Combined effects from all active structures
   */
  async calculateColonyEffects(colonyId) {
    try {
      const now = Date.now();
      const lastCalc = this.lastCalculation.get(colonyId) || 0;
      
      // Check cache validity
      if (now - lastCalc < this.cacheTimeout && this.effectsCache.has(colonyId)) {
        return { success: true, data: this.effectsCache.get(colonyId) };
      }

      // Get all active structures for the colony
      const structuresResult = await Structure.findByColonyId(colonyId);
      if (structuresResult.error) {
        return { success: false, error: structuresResult.error };
      }

      const structures = structuresResult.data;
      const combinedEffects = {
        // Resource bonuses
        food_production: 0,
        water_capacity: 0,
        mineral_capacity: 0,
        capacity_bonus: 0,
        
        // Efficiency bonuses
        construction_speed: 0,
        research_speed: 0,
        task_efficiency: 0,
        coordination_bonus: 0,
        
        // Colony bonuses
        birth_rate_bonus: 0,
        development_speed: 0,
        queen_health: 0,
        reproduction_rate: 0,
        colony_morale: 0,
        
        // Defense bonuses
        defense_bonus: 0,
        detection_range: 0,
        damage_reduction: 0,
        movement_speed: 0,
        stealth_bonus: 0,
        
        // Special abilities
        special_abilities: [],
        
        // Structure counts
        total_structures: structures.length,
        active_structures: 0,
        damaged_structures: 0
      };

      // Process each structure
      for (const structure of structures) {
        if (!structure.is_active) {
          if (structure.health < structure.max_health) {
            combinedEffects.damaged_structures++;
          }
          continue;
        }

        combinedEffects.active_structures++;
        
        // Get structure effects with level multiplier
        const structureEffects = structure.getStructureEffects();
        const healthMultiplier = structure.health / structure.max_health;
        
        // Apply effects with health-based reduction
        for (const [effectType, value] of Object.entries(structureEffects)) {
          if (typeof value === 'number') {
            const effectiveValue = value * healthMultiplier;
            combinedEffects[effectType] = (combinedEffects[effectType] || 0) + effectiveValue;
          } else if (effectType === 'special_abilities' && Array.isArray(value)) {
            // Only apply special abilities if structure is at full health
            if (healthMultiplier >= 0.75) {
              combinedEffects.special_abilities.push(...value);
            }
          }
        }
      }

      // Round numerical values for cleaner display
      for (const [key, value] of Object.entries(combinedEffects)) {
        if (typeof value === 'number') {
          combinedEffects[key] = Math.round(value * 100) / 100;
        }
      }

      // Remove duplicate special abilities
      combinedEffects.special_abilities = [...new Set(combinedEffects.special_abilities)];

      // Cache results
      this.effectsCache.set(colonyId, combinedEffects);
      this.lastCalculation.set(colonyId, now);

      return { success: true, data: combinedEffects };
    } catch (error) {
      console.error('Error calculating colony effects:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply structure effects to colony resource generation and stats
   * @param {string} colonyId - Colony ID
   * @returns {Object} Updated colony stats
   */
  async applyEffectsToColony(colonyId) {
    try {
      const effectsResult = await this.calculateColonyEffects(colonyId);
      if (!effectsResult.success) {
        return effectsResult;
      }

      const effects = effectsResult.data;
      
      // Get current colony data
      const { data: colony, error: colonyError } = await supabase
        .from('colonies')
        .select('*')
        .eq('id', colonyId)
        .single();

      if (colonyError) {
        return handleDatabaseError(colonyError, 'fetching colony data');
      }

      // Calculate modified stats
      const modifiedStats = {
        // Apply resource bonuses
        resource_generation_rate: Math.max(1, 1 + (effects.food_production / 100)),
        construction_efficiency: Math.max(0.5, 1 + (effects.construction_speed / 100)),
        research_efficiency: Math.max(0.5, 1 + (effects.research_speed / 100)),
        
        // Apply colony bonuses
        population_growth_rate: Math.max(0.1, 1 + (effects.birth_rate_bonus / 100)),
        colony_happiness: Math.min(2.0, 1 + (effects.colony_morale / 100)),
        
        // Apply defense bonuses
        defense_rating: Math.max(0, (colony.defense_rating || 0) + effects.defense_bonus),
        detection_radius: Math.max(1, (colony.detection_radius || 3) + effects.detection_range),
        
        // Special capabilities
        has_research_capability: effects.special_abilities.includes('research'),
        has_advanced_building: effects.special_abilities.includes('advanced_building'),
        has_underground_movement: effects.special_abilities.includes('underground_movement'),
        
        // Structure summary
        total_structures: effects.total_structures,
        active_structures: effects.active_structures,
        damaged_structures: effects.damaged_structures,
        
        last_effects_update: new Date().toISOString()
      };

      return { success: true, data: { originalStats: colony, modifiedStats, effects } };
    } catch (error) {
      console.error('Error applying effects to colony:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Apply damage to structures during events or attacks
   * @param {string} colonyId - Colony ID
   * @param {Object} damageEvent - Damage event details
   * @returns {Object} Damage results
   */
  async applyStructureDamage(colonyId, damageEvent) {
    try {
      const { 
        damageAmount = 10, 
        damageType = 'general',
        targetStructureTypes = null,
        affectAll = false 
      } = damageEvent;

      const structuresResult = await Structure.findByColonyId(colonyId);
      if (structuresResult.error) {
        return { success: false, error: structuresResult.error };
      }

      const structures = structuresResult.data;
      const damageResults = [];

      let targetsToAttack = structures;
      
      // Filter targets based on damage type
      if (targetStructureTypes && !affectAll) {
        targetsToAttack = structures.filter(s => 
          targetStructureTypes.includes(s.building_type)
        );
      }

      // Apply damage to structures
      for (const structure of targetsToAttack) {
        if (!structure.is_active || structure.health <= 0) continue;

        // Calculate actual damage (some structure types may have resistance)
        let actualDamage = damageAmount;
        
        // Defense structures take less damage
        if (['GUARD_POST', 'BARRICADE', 'TUNNEL_SYSTEM'].includes(structure.building_type)) {
          actualDamage *= 0.75;
        }

        // Apply random variance
        actualDamage *= (0.8 + Math.random() * 0.4);
        actualDamage = Math.round(actualDamage);

        const damageResult = await structure.takeDamage(actualDamage);
        if (damageResult.data) {
          damageResults.push({
            structureId: structure.id,
            structureName: structure.name,
            damageDealt: actualDamage,
            newHealth: damageResult.data.health,
            isDestroyed: damageResult.data.health <= 0,
            wasDeactivated: !damageResult.data.is_active
          });
        }
      }

      // Clear effects cache to force recalculation
      this.effectsCache.delete(colonyId);

      return { 
        success: true, 
        data: {
          damageEvent,
          damageResults,
          totalStructuresAffected: damageResults.length,
          structuresDestroyed: damageResults.filter(r => r.isDestroyed).length
        }
      };
    } catch (error) {
      console.error('Error applying structure damage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process structure maintenance costs
   * @param {string} colonyId - Colony ID
   * @returns {Object} Maintenance processing results
   */
  async processStructureMaintenance(colonyId) {
    try {
      const structuresResult = await Structure.findByColonyId(colonyId);
      if (structuresResult.error) {
        return { success: false, error: structuresResult.error };
      }

      const structures = structuresResult.data.filter(s => s.is_active);
      const maintenanceResults = [];
      let totalMaintenanceCost = {
        food: 0,
        wood: 0,
        stone: 0,
        minerals: 0,
        water: 0
      };

      // Calculate total maintenance costs
      for (const structure of structures) {
        if (structure.maintenance_cost && typeof structure.maintenance_cost === 'object') {
          for (const [resource, amount] of Object.entries(structure.maintenance_cost)) {
            totalMaintenanceCost[resource] = (totalMaintenanceCost[resource] || 0) + amount;
          }
        }
      }

      // Get colony resources
      const { data: colonyResources, error: resourceError } = await supabase
        .from('colony_resources')
        .select('resource_type, amount')
        .eq('colony_id', colonyId);

      if (resourceError) {
        return handleDatabaseError(resourceError, 'fetching colony resources');
      }

      const resourceMap = {};
      colonyResources.forEach(resource => {
        resourceMap[resource.resource_type] = resource.amount;
      });

      // Check if colony can afford maintenance
      const canAffordMaintenance = {};
      let canAffordAll = true;

      for (const [resource, required] of Object.entries(totalMaintenanceCost)) {
        if (required > 0) {
          const available = resourceMap[resource] || 0;
          canAffordMaintenance[resource] = available >= required;
          if (!canAffordMaintenance[resource]) {
            canAffordAll = false;
          }
        }
      }

      // Apply maintenance effects
      if (canAffordAll) {
        // Deduct maintenance costs
        for (const [resource, amount] of Object.entries(totalMaintenanceCost)) {
          if (amount > 0) {
            await supabase
              .from('colony_resources')
              .update({ 
                amount: supabase.raw(`amount - ${amount}`),
                updated_at: new Date().toISOString()
              })
              .eq('colony_id', colonyId)
              .eq('resource_type', resource);
          }
        }

        maintenanceResults.push({
          status: 'success',
          message: 'All structures maintained successfully',
          costsPaid: totalMaintenanceCost
        });
      } else {
        // Apply degradation to structures due to lack of maintenance
        for (const structure of structures) {
          const degradationDamage = Math.floor(structure.max_health * 0.02); // 2% degradation
          await structure.takeDamage(degradationDamage);
          
          maintenanceResults.push({
            status: 'degradation',
            structureId: structure.id,
            structureName: structure.name,
            degradationDamage
          });
        }
      }

      return {
        success: true,
        data: {
          maintenanceRequired: totalMaintenanceCost,
          canAffordMaintenance,
          maintenanceResults,
          resourcesAvailable: resourceMap
        }
      };
    } catch (error) {
      console.error('Error processing structure maintenance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get detailed structure bonus information for UI display
   * @param {string} colonyId - Colony ID
   * @returns {Object} Detailed structure bonus breakdown
   */
  async getStructureBonusBreakdown(colonyId) {
    try {
      const structuresResult = await Structure.findByColonyId(colonyId);
      if (structuresResult.error) {
        return { success: false, error: structuresResult.error };
      }

      const structures = structuresResult.data;
      const bonusBreakdown = [];

      for (const structure of structures) {
        if (!structure.is_active) continue;

        const effects = structure.getStructureEffects();
        const healthMultiplier = structure.health / structure.max_health;
        
        const structureInfo = {
          id: structure.id,
          name: structure.name,
          type: structure.building_type,
          level: structure.level,
          health: structure.health,
          maxHealth: structure.max_health,
          healthPercentage: Math.round(healthMultiplier * 100),
          effects: {},
          specialAbilities: [],
          isFullyEffective: healthMultiplier >= 0.75
        };

        // Process effects
        for (const [effectType, value] of Object.entries(effects)) {
          if (typeof value === 'number') {
            structureInfo.effects[effectType] = {
              baseValue: value,
              effectiveValue: Math.round(value * healthMultiplier * 100) / 100,
              healthReduction: healthMultiplier < 1 ? Math.round((1 - healthMultiplier) * 100) : 0
            };
          } else if (effectType === 'special_abilities' && Array.isArray(value)) {
            structureInfo.specialAbilities = value;
          }
        }

        bonusBreakdown.push(structureInfo);
      }

      return { success: true, data: bonusBreakdown };
    } catch (error) {
      console.error('Error getting structure bonus breakdown:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear effects cache for a colony (used when structures change)
   * @param {string} colonyId - Colony ID
   */
  invalidateCache(colonyId) {
    this.effectsCache.delete(colonyId);
    this.lastCalculation.delete(colonyId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.effectsCache.clear();
    this.lastCalculation.clear();
  }
}

// Export singleton instance
module.exports = new StructureEffectsManager(); 
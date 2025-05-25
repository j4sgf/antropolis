/**
 * Evolution Manager - Manages all evolution upgrades and their effects
 * This service handles applying upgrade effects to game mechanics
 */
class EvolutionManager {
  constructor() {
    this.activeUpgrades = new Map();
    this.effectCache = new Map();
    this.modifierCache = new Map();
    this.visualEffects = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Initialize the evolution manager with colony data
   * @param {string} colonyId - Colony ID
   * @param {Array} unlockedTechs - Array of unlocked technology IDs
   */
  async initialize(colonyId, unlockedTechs = []) {
    this.colonyId = colonyId;
    this.activeUpgrades.clear();
    this.effectCache.clear();
    this.modifierCache.clear();
    this.visualEffects.clear();

    // Load active upgrades
    await this.loadActiveUpgrades(unlockedTechs);
    
    // Calculate all effects
    this.calculateAllEffects();
    
    console.log(`🧬 Evolution Manager initialized for colony ${colonyId} with ${this.activeUpgrades.size} upgrades`);
  }

  /**
   * Load active upgrades from unlocked technologies
   * @param {Array} unlockedTechIds - Array of unlocked technology IDs
   */
  async loadActiveUpgrades(unlockedTechIds) {
    try {
      // Import technology data
      const { technologies } = await import('../../server/data/technologies.js');
      
      unlockedTechIds.forEach(techId => {
        const tech = technologies.find(t => t.id === techId);
        if (tech) {
          this.activeUpgrades.set(techId, tech);
        }
      });
    } catch (error) {
      console.error('Error loading technologies:', error);
      // Fallback to local mock data if server data unavailable
      this.loadMockUpgrades(unlockedTechIds);
    }
  }

  /**
   * Fallback method to load mock upgrade data
   * @param {Array} unlockedTechIds - Array of unlocked technology IDs
   */
  loadMockUpgrades(unlockedTechIds) {
    const mockTechnologies = [
      {
        id: 'tech-001',
        name: 'Enhanced Strength',
        category: 'physical',
        effects: {
          carrying_capacity_bonus: 25,
          building_speed_bonus: 15,
          combat_strength_bonus: 10
        },
        visual_changes: {
          size_modifier: 1.1,
          color_tint: 'darker'
        }
      },
      {
        id: 'tech-002',
        name: 'Improved Speed',
        category: 'physical',
        effects: {
          movement_speed_bonus: 30,
          foraging_efficiency_bonus: 20,
          escape_chance_bonus: 15
        },
        visual_changes: {
          animation_speed: 1.2,
          trail_effect: true
        }
      }
      // Add more mock data as needed
    ];

    unlockedTechIds.forEach(techId => {
      const tech = mockTechnologies.find(t => t.id === techId);
      if (tech) {
        this.activeUpgrades.set(techId, tech);
      }
    });
  }

  /**
   * Add a new upgrade to active upgrades
   * @param {Object} tech - Technology object
   */
  addUpgrade(tech) {
    this.activeUpgrades.set(tech.id, tech);
    this.invalidateCache();
    this.calculateAllEffects();
    this.applyVisualChanges(tech);
    
    console.log(`🧬 Added upgrade: ${tech.name}`);
  }

  /**
   * Remove an upgrade (for undo functionality)
   * @param {string} techId - Technology ID
   */
  removeUpgrade(techId) {
    const tech = this.activeUpgrades.get(techId);
    if (tech) {
      this.activeUpgrades.delete(techId);
      this.invalidateCache();
      this.calculateAllEffects();
      this.removeVisualChanges(tech);
      
      console.log(`🧬 Removed upgrade: ${tech.name}`);
    }
  }

  /**
   * Calculate all cumulative effects from active upgrades
   */
  calculateAllEffects() {
    const cumulativeEffects = {
      // Physical attributes
      carrying_capacity_bonus: 0,
      movement_speed_bonus: 0,
      combat_strength_bonus: 0,
      health_bonus: 0,
      
      // Resource collection
      foraging_efficiency_bonus: 0,
      mining_efficiency_bonus: 0,
      water_collection_bonus: 0,
      
      // Colony performance
      building_speed_bonus: 0,
      research_speed_bonus: 0,
      birth_rate_bonus: 0,
      colony_morale_bonus: 0,
      
      // Combat attributes
      attack_damage_bonus: 0,
      defense_bonus: 0,
      escape_chance_bonus: 0,
      
      // Special abilities
      special_abilities: [],
      multipliers: {},
      
      // Environmental adaptations
      temperature_resistance: 0,
      poison_resistance: 0,
      predator_detection: 0
    };

    // Apply effects from all active upgrades
    this.activeUpgrades.forEach(tech => {
      if (tech.effects) {
        Object.entries(tech.effects).forEach(([effectType, value]) => {
          if (typeof value === 'number') {
            // Numeric bonuses are additive
            if (cumulativeEffects.hasOwnProperty(effectType)) {
              cumulativeEffects[effectType] += value;
            } else if (effectType.includes('multiplier')) {
              // Handle multipliers specially
              if (!cumulativeEffects.multipliers[effectType]) {
                cumulativeEffects.multipliers[effectType] = 1;
              }
              cumulativeEffects.multipliers[effectType] *= value;
            }
          } else if (typeof value === 'boolean' && value) {
            // Boolean effects that are true
            if (effectType.includes('unlock_') || effectType.includes('enable_')) {
              cumulativeEffects.special_abilities.push(effectType);
            }
          } else if (Array.isArray(value)) {
            // Array effects (like special abilities)
            cumulativeEffects.special_abilities.push(...value);
          }
        });
      }
    });

    // Cache the results
    this.effectCache.set('cumulative', cumulativeEffects);
    this.lastCacheUpdate = Date.now();
    
    return cumulativeEffects;
  }

  /**
   * Get current cumulative effects
   * @returns {Object} Current effects object
   */
  getCurrentEffects() {
    if (!this.effectCache.has('cumulative') || this.isCacheExpired()) {
      return this.calculateAllEffects();
    }
    return this.effectCache.get('cumulative');
  }

  /**
   * Apply ant attribute modifiers
   * @param {Object} baseAttributes - Base ant attributes
   * @returns {Object} Modified attributes
   */
  applyAntModifiers(baseAttributes) {
    const cacheKey = `ant_modifiers_${JSON.stringify(baseAttributes)}`;
    
    if (this.modifierCache.has(cacheKey) && !this.isCacheExpired()) {
      return this.modifierCache.get(cacheKey);
    }

    const effects = this.getCurrentEffects();
    const modifiedAttributes = { ...baseAttributes };

    // Apply carrying capacity modifiers
    if (effects.carrying_capacity_bonus > 0) {
      modifiedAttributes.carryingCapacity = Math.floor(
        modifiedAttributes.carryingCapacity * (1 + effects.carrying_capacity_bonus / 100)
      );
    }

    // Apply movement speed modifiers
    if (effects.movement_speed_bonus > 0) {
      modifiedAttributes.movementSpeed = Math.min(
        modifiedAttributes.movementSpeed * (1 + effects.movement_speed_bonus / 100),
        10 // Cap at 10x speed
      );
    }

    // Apply health modifiers
    if (effects.health_bonus > 0) {
      modifiedAttributes.maxHealth = Math.floor(
        modifiedAttributes.maxHealth * (1 + effects.health_bonus / 100)
      );
      modifiedAttributes.currentHealth = Math.min(
        modifiedAttributes.currentHealth,
        modifiedAttributes.maxHealth
      );
    }

    // Apply combat modifiers
    if (effects.combat_strength_bonus > 0) {
      modifiedAttributes.combatStrength = Math.floor(
        modifiedAttributes.combatStrength * (1 + effects.combat_strength_bonus / 100)
      );
    }

    // Apply special multipliers
    Object.entries(effects.multipliers).forEach(([multiplierType, value]) => {
      if (multiplierType === 'efficiency_multiplier') {
        // Apply to all efficiency-related attributes
        ['foragingEfficiency', 'buildingEfficiency', 'miningEfficiency'].forEach(attr => {
          if (modifiedAttributes[attr]) {
            modifiedAttributes[attr] *= value;
          }
        });
      }
    });

    // Cache the result
    this.modifierCache.set(cacheKey, modifiedAttributes);
    
    return modifiedAttributes;
  }

  /**
   * Apply resource collection rate modifiers
   * @param {string} resourceType - Type of resource (food, water, materials, etc.)
   * @param {number} baseRate - Base collection rate
   * @returns {number} Modified collection rate
   */
  applyResourceModifiers(resourceType, baseRate) {
    const effects = this.getCurrentEffects();
    let modifiedRate = baseRate;

    // Apply specific resource bonuses
    const resourceBonusMap = {
      food: 'foraging_efficiency_bonus',
      water: 'water_collection_bonus',
      materials: 'mining_efficiency_bonus',
      stone: 'mining_efficiency_bonus',
      wood: 'foraging_efficiency_bonus'
    };

    const bonusType = resourceBonusMap[resourceType];
    if (bonusType && effects[bonusType] > 0) {
      modifiedRate = baseRate * (1 + effects[bonusType] / 100);
    }

    // Apply general efficiency multipliers
    if (effects.multipliers.efficiency_multiplier) {
      modifiedRate *= effects.multipliers.efficiency_multiplier;
    }

    return Math.floor(modifiedRate);
  }

  /**
   * Apply construction speed modifiers
   * @param {number} baseConstructionTime - Base construction time in ticks
   * @returns {number} Modified construction time
   */
  applyConstructionModifiers(baseConstructionTime) {
    const effects = this.getCurrentEffects();
    let modifiedTime = baseConstructionTime;

    if (effects.building_speed_bonus > 0) {
      // Faster building = less time required
      modifiedTime = baseConstructionTime / (1 + effects.building_speed_bonus / 100);
    }

    return Math.max(Math.floor(modifiedTime), 1); // Minimum 1 tick
  }

  /**
   * Apply combat modifiers
   * @param {Object} combatStats - Base combat statistics
   * @returns {Object} Modified combat statistics
   */
  applyCombatModifiers(combatStats) {
    const effects = this.getCurrentEffects();
    const modified = { ...combatStats };

    if (effects.attack_damage_bonus > 0) {
      modified.attackDamage = Math.floor(
        modified.attackDamage * (1 + effects.attack_damage_bonus / 100)
      );
    }

    if (effects.defense_bonus > 0) {
      modified.defense = Math.floor(
        modified.defense * (1 + effects.defense_bonus / 100)
      );
    }

    if (effects.escape_chance_bonus > 0) {
      modified.escapeChance = Math.min(
        modified.escapeChance + effects.escape_chance_bonus,
        95 // Cap at 95%
      );
    }

    return modified;
  }

  /**
   * Apply visual changes from upgrades
   * @param {Object} tech - Technology with visual changes
   */
  applyVisualChanges(tech) {
    if (!tech.visual_changes) return;

    const visualEffects = this.visualEffects.get(tech.id) || {};
    
    Object.entries(tech.visual_changes).forEach(([changeType, value]) => {
      visualEffects[changeType] = value;
    });

    this.visualEffects.set(tech.id, visualEffects);
    
    // Emit visual update event
    this.emitVisualUpdate(tech.id, visualEffects);
  }

  /**
   * Remove visual changes from an upgrade
   * @param {Object} tech - Technology with visual changes
   */
  removeVisualChanges(tech) {
    if (!tech.visual_changes) return;

    this.visualEffects.delete(tech.id);
    
    // Emit visual update event
    this.emitVisualUpdate(tech.id, null);
  }

  /**
   * Get all active visual effects
   * @returns {Object} Combined visual effects
   */
  getActiveVisualEffects() {
    const combined = {};
    
    this.visualEffects.forEach((effects, techId) => {
      Object.entries(effects).forEach(([changeType, value]) => {
        if (typeof value === 'number') {
          // Multiplicative for numbers
          combined[changeType] = (combined[changeType] || 1) * value;
        } else if (typeof value === 'boolean') {
          // OR operation for booleans
          combined[changeType] = combined[changeType] || value;
        } else {
          // Override for other types
          combined[changeType] = value;
        }
      });
    });

    return combined;
  }

  /**
   * Check if a special ability is unlocked
   * @param {string} abilityName - Name of the ability to check
   * @returns {boolean} Whether the ability is unlocked
   */
  hasSpecialAbility(abilityName) {
    const effects = this.getCurrentEffects();
    return effects.special_abilities.includes(abilityName);
  }

  /**
   * Get research speed modifier
   * @returns {number} Research speed multiplier
   */
  getResearchSpeedModifier() {
    const effects = this.getCurrentEffects();
    return 1 + (effects.research_speed_bonus || 0) / 100;
  }

  /**
   * Get colony happiness modifier
   * @returns {number} Colony happiness multiplier
   */
  getColonyHappinessModifier() {
    const effects = this.getCurrentEffects();
    return 1 + (effects.colony_morale_bonus || 0) / 100;
  }

  /**
   * Emit visual update event
   * @param {string} techId - Technology ID
   * @param {Object} visualEffects - Visual effects to apply
   */
  emitVisualUpdate(techId, visualEffects) {
    // Dispatch custom event for visual updates
    const event = new CustomEvent('evolutionVisualUpdate', {
      detail: { techId, visualEffects, allEffects: this.getActiveVisualEffects() }
    });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(event);
    }
  }

  /**
   * Invalidate all caches
   */
  invalidateCache() {
    this.effectCache.clear();
    this.modifierCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Check if cache is expired
   * @returns {boolean} Whether cache is expired
   */
  isCacheExpired() {
    return Date.now() - this.lastCacheUpdate > this.cacheTimeout;
  }

  /**
   * Get upgrade statistics
   * @returns {Object} Statistics about active upgrades
   */
  getUpgradeStats() {
    const stats = {
      totalUpgrades: this.activeUpgrades.size,
      categories: {},
      totalBonuses: {},
      specialAbilities: this.getCurrentEffects().special_abilities.length
    };

    this.activeUpgrades.forEach(tech => {
      // Count by category
      if (!stats.categories[tech.category]) {
        stats.categories[tech.category] = 0;
      }
      stats.categories[tech.category]++;

      // Sum bonuses
      if (tech.effects) {
        Object.entries(tech.effects).forEach(([effectType, value]) => {
          if (typeof value === 'number') {
            if (!stats.totalBonuses[effectType]) {
              stats.totalBonuses[effectType] = 0;
            }
            stats.totalBonuses[effectType] += value;
          }
        });
      }
    });

    return stats;
  }

  /**
   * Export current evolution state
   * @returns {Object} Serializable evolution state
   */
  exportState() {
    return {
      colonyId: this.colonyId,
      activeUpgrades: Array.from(this.activeUpgrades.entries()),
      effects: this.getCurrentEffects(),
      visualEffects: Array.from(this.visualEffects.entries()),
      lastUpdate: this.lastCacheUpdate
    };
  }

  /**
   * Import evolution state
   * @param {Object} state - Evolution state to import
   */
  importState(state) {
    this.colonyId = state.colonyId;
    this.activeUpgrades = new Map(state.activeUpgrades);
    this.visualEffects = new Map(state.visualEffects);
    this.lastCacheUpdate = state.lastUpdate;
    
    this.calculateAllEffects();
  }
}

// Create singleton instance
const evolutionManager = new EvolutionManager();

export default evolutionManager; 
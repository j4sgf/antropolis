const { supabase, handleDatabaseError } = require('../config/database');

/**
 * Structure class for managing colony buildings and their effects
 * Represents both structure templates and colony-specific structure instances
 */
class Structure {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.description = data.description;
    
    // Position (for colony instances)
    this.colony_id = data.colony_id;
    this.position_x = data.position_x;
    this.position_y = data.position_y;
    this.width = data.width || 1;
    this.height = data.height || 1;
    
    // Construction and health
    this.health = data.health || 100;
    this.max_health = data.max_health || 100;
    this.construction_progress = data.construction_progress || 0;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.level = data.level || 1;
    this.max_level = data.max_level || 5;
    
    // Effects and bonuses
    this.capacity_bonus = data.capacity_bonus || 0;
    this.production_bonus = data.production_bonus || 0;
    this.defense_bonus = data.defense_bonus || 0;
    this.population_bonus = data.population_bonus || 0;
    this.efficiency_bonus = data.efficiency_bonus || 0;
    
    // Costs and requirements
    this.build_cost = data.build_cost || {};
    this.upgrade_cost = data.upgrade_cost || {};
    this.maintenance_cost = data.maintenance_cost || {};
    this.construction_time = data.construction_time || 100; // in ticks
    this.required_workers = data.required_workers || 1;
    
    // Special properties
    this.special_abilities = data.special_abilities || [];
    this.prerequisites = data.prerequisites || [];
    this.effects = data.effects || {};
    
    // Timestamps
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Static method to get all available structure types
  static getStructureTypes() {
    return {
      // Resource and storage structures
      FOOD_STORAGE: {
        name: 'Food Storage Chamber',
        type: 'FOOD_STORAGE',
        description: 'Expands food storage capacity and reduces spoilage rates.',
        base_cost: { food: 50, wood: 30 },
        maintenance_cost: { food: 2, wood: 1 }, // Per day maintenance
        construction_time: 150,
        effects: { capacity_bonus: 200, spoilage_reduction: 0.1 },
        max_level: 5
      },
      WATER_RESERVOIR: {
        name: 'Water Reservoir',
        type: 'WATER_RESERVOIR', 
        description: 'Stores water and improves colony hydration.',
        base_cost: { stone: 40, minerals: 20 },
        maintenance_cost: { stone: 1, minerals: 1 },
        construction_time: 120,
        effects: { water_capacity: 500, drought_resistance: 0.2 },
        max_level: 3
      },
      MINERAL_STOCKPILE: {
        name: 'Mineral Stockpile',
        type: 'MINERAL_STOCKPILE',
        description: 'Organized storage for minerals and building materials.',
        base_cost: { stone: 60, wood: 20 },
        maintenance_cost: { wood: 1 },
        construction_time: 100,
        effects: { mineral_capacity: 300, construction_efficiency: 0.15 },
        max_level: 4
      },

      // Production structures
      NURSERY: {
        name: 'Nursery Chamber',
        type: 'NURSERY',
        description: 'Dedicated space for raising young ants, increasing birth rates.',
        base_cost: { food: 80, wood: 50 },
        maintenance_cost: { food: 5, wood: 2 }, // Higher maintenance for active nursery
        construction_time: 200,
        effects: { birth_rate_bonus: 0.25, development_speed: 0.2 },
        max_level: 5
      },
      FARM_CHAMBER: {
        name: 'Mushroom Farm',
        type: 'FARM_CHAMBER',
        description: 'Cultivates fungus for sustainable food production.',
        base_cost: { food: 60, water: 40, minerals: 30 },
        maintenance_cost: { water: 3, minerals: 2 }, // Farming requires ongoing resources
        construction_time: 180,
        effects: { food_production: 5, sustainability: 0.3 },
        max_level: 4
      },
      WORKSHOP: {
        name: 'Workshop',
        type: 'WORKSHOP',
        description: 'Enables advanced tool crafting and construction.',
        base_cost: { wood: 70, stone: 40, minerals: 50 },
        maintenance_cost: { wood: 2, stone: 1, minerals: 3 }, // Tools wear out
        construction_time: 250,
        effects: { construction_speed: 0.25, tool_quality: 0.2 },
        max_level: 3,
        special_abilities: ['advanced_building', 'tool_crafting']
      },

      // Defense structures
      GUARD_POST: {
        name: 'Guard Post',
        type: 'GUARD_POST',
        description: 'Watchtower that provides early warning and defensive bonuses.',
        base_cost: { wood: 40, stone: 60 },
        maintenance_cost: { wood: 1, stone: 1 }, // Minimal upkeep
        construction_time: 120,
        effects: { detection_range: 3, defense_bonus: 15 },
        max_level: 4
      },
      BARRICADE: {
        name: 'Defensive Barricade',
        type: 'BARRICADE',
        description: 'Provides cover and slows enemy advancement.',
        base_cost: { wood: 30, stone: 20 },
        maintenance_cost: { wood: 1 }, // Wood structures need replacement
        construction_time: 80,
        effects: { damage_reduction: 0.2, movement_penalty: 0.3 },
        max_level: 3
      },
      TUNNEL_SYSTEM: {
        name: 'Tunnel Network',
        type: 'TUNNEL_SYSTEM',
        description: 'Underground passages for quick movement and escape routes.',
        base_cost: { stone: 80, minerals: 40 },
        maintenance_cost: { stone: 2, minerals: 1 }, // Tunnels need reinforcement
        construction_time: 300,
        effects: { movement_speed: 0.4, stealth_bonus: 0.3 },
        max_level: 4,
        special_abilities: ['underground_movement', 'emergency_evacuation']
      },

      // Specialized structures
      LABORATORY: {
        name: 'Research Laboratory',
        type: 'LABORATORY',
        description: 'Enables research and technological advancement.',
        base_cost: { minerals: 100, wood: 50, water: 30 },
        maintenance_cost: { minerals: 5, water: 2 }, // Research equipment maintenance
        construction_time: 400,
        effects: { research_speed: 0.5, tech_unlock: true },
        max_level: 3,
        special_abilities: ['research', 'evolution_tracking'],
        prerequisites: ['WORKSHOP']
      },
      QUEEN_CHAMBER: {
        name: 'Royal Chamber',
        type: 'QUEEN_CHAMBER',
        description: 'Luxurious quarters for the queen, boosting reproduction.',
        base_cost: { food: 150, wood: 100, minerals: 80 },
        maintenance_cost: { food: 8, wood: 3, minerals: 2 }, // Royal luxury requires upkeep
        construction_time: 500,
        effects: { queen_health: 0.5, reproduction_rate: 0.4, colony_morale: 0.3 },
        max_level: 3,
        special_abilities: ['queen_bonuses', 'royal_court']
      },
      COMMUNICATION_HUB: {
        name: 'Communication Hub',
        type: 'COMMUNICATION_HUB',
        description: 'Improves coordination and efficiency across the colony.',
        base_cost: { minerals: 60, wood: 40 },
        maintenance_cost: { minerals: 2, wood: 1 }, // Communication equipment upkeep
        construction_time: 180,
        effects: { coordination_bonus: 0.25, task_efficiency: 0.2 },
        max_level: 4,
        special_abilities: ['pheromone_amplification', 'network_coordination']
      }
    };
  }

  // Create a new structure instance in a colony
  static async build(colonyId, structureType, positionX, positionY, level = 1) {
    try {
      const structureTypes = Structure.getStructureTypes();
      const template = structureTypes[structureType];
      
      if (!template) {
        return { error: 'Invalid structure type' };
      }

      // Calculate costs for the specified level
      const buildCost = Structure.calculateLevelCost(template.base_cost, level);
      const constructionTime = template.construction_time * level;

      const structureData = {
        colony_id: colonyId,
        building_type: structureType,
        name: template.name,
        position_x: positionX,
        position_y: positionY,
        level: level,
        construction_progress: 0,
        health: 100,
        max_health: 100,
        is_active: false, // Will be activated when construction completes
        build_cost: buildCost,
        maintenance_cost: template.maintenance_cost || {},
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('buildings')
        .insert([structureData])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'building structure');
      }

      return { data: new Structure(data) };
    } catch (err) {
      return handleDatabaseError(err, 'building structure');
    }
  }

  // Calculate cost for a specific level
  static calculateLevelCost(baseCost, level) {
    const multiplier = Math.pow(1.5, level - 1); // 50% increase per level
    const levelCost = {};
    
    for (const [resource, amount] of Object.entries(baseCost)) {
      levelCost[resource] = Math.floor(amount * multiplier);
    }
    
    return levelCost;
  }

  // Get all structures for a colony
  static async findByColonyId(colonyId) {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('colony_id', colonyId)
        .order('created_at', { ascending: true });

      if (error) {
        return handleDatabaseError(error, 'finding colony structures');
      }

      const structures = data.map(structure => new Structure(structure));
      return { data: structures };
    } catch (err) {
      return handleDatabaseError(err, 'finding colony structures');
    }
  }

  // Find structure by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { error: 'Structure not found' };
        }
        return handleDatabaseError(error, 'finding structure');
      }

      return { data: new Structure(data) };
    } catch (err) {
      return handleDatabaseError(err, 'finding structure');
    }
  }

  // Update construction progress
  async updateConstructionProgress(progress) {
    try {
      const newProgress = Math.min(100, Math.max(0, progress));
      const isCompleted = newProgress >= 100;

      const updateData = {
        construction_progress: newProgress,
        is_active: isCompleted,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('buildings')
        .update(updateData)
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'updating construction progress');
      }

      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'updating construction progress');
    }
  }

  // Upgrade structure to next level
  async upgrade() {
    try {
      if (this.level >= this.max_level) {
        return { error: 'Structure is already at maximum level' };
      }

      const newLevel = this.level + 1;
      const structureTypes = Structure.getStructureTypes();
      const template = structureTypes[this.building_type];
      
      if (!template) {
        return { error: 'Invalid structure type for upgrade' };
      }

      const upgradeCost = Structure.calculateLevelCost(template.base_cost, newLevel);

      const updateData = {
        level: newLevel,
        build_cost: upgradeCost,
        construction_progress: 0, // Reset progress for upgrade
        is_active: false, // Deactivate during upgrade
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('buildings')
        .update(updateData)
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'upgrading structure');
      }

      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'upgrading structure');
    }
  }

  // Repair structure
  async repair(healthAmount) {
    try {
      const newHealth = Math.min(this.max_health, this.health + healthAmount);

      const { data, error } = await supabase
        .from('buildings')
        .update({ 
          health: newHealth,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'repairing structure');
      }

      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'repairing structure');
    }
  }

  // Damage structure
  async takeDamage(damageAmount) {
    try {
      const newHealth = Math.max(0, this.health - damageAmount);
      const isDestroyed = newHealth <= 0;

      const updateData = {
        health: newHealth,
        is_active: !isDestroyed,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('buildings')
        .update(updateData)
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'damaging structure');
      }

      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'damaging structure');
    }
  }

  // Demolish structure
  async demolish() {
    try {
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', this.id);

      if (error) {
        return handleDatabaseError(error, 'demolishing structure');
      }

      return { data: { message: 'Structure demolished successfully' } };
    } catch (err) {
      return handleDatabaseError(err, 'demolishing structure');
    }
  }

  // Get structure effects based on type and level
  getStructureEffects() {
    const structureTypes = Structure.getStructureTypes();
    const template = structureTypes[this.building_type];
    
    if (!template || !this.is_active) {
      return {};
    }

    // Calculate effects based on level
    const effects = {};
    const levelMultiplier = this.level;

    for (const [effectType, baseValue] of Object.entries(template.effects)) {
      if (typeof baseValue === 'number') {
        effects[effectType] = baseValue * levelMultiplier;
      } else {
        effects[effectType] = baseValue;
      }
    }

    return effects;
  }

  // Check if structure can be placed at position
  static async canPlaceAt(colonyId, x, y, width = 1, height = 1, excludeId = null) {
    try {
      let query = supabase
        .from('buildings')
        .select('position_x, position_y, width, height')
        .eq('colony_id', colonyId);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        return handleDatabaseError(error, 'checking placement');
      }

      // Check for overlapping structures
      for (const structure of data) {
        const structureLeft = structure.position_x;
        const structureRight = structure.position_x + (structure.width || 1);
        const structureTop = structure.position_y;
        const structureBottom = structure.position_y + (structure.height || 1);

        const newLeft = x;
        const newRight = x + width;
        const newTop = y;
        const newBottom = y + height;

        // Check for overlap
        if (newLeft < structureRight && newRight > structureLeft &&
            newTop < structureBottom && newBottom > structureTop) {
          return { data: false, error: 'Position overlaps with existing structure' };
        }
      }

      return { data: true };
    } catch (err) {
      return handleDatabaseError(err, 'checking placement');
    }
  }

  // Get total effects for all active structures in colony
  static async getTotalColonyEffects(colonyId) {
    try {
      const result = await Structure.findByColonyId(colonyId);
      if (result.error) {
        return result;
      }

      const totalEffects = {};
      
      for (const structure of result.data) {
        if (structure.is_active) {
          const effects = structure.getStructureEffects();
          
          for (const [effectType, value] of Object.entries(effects)) {
            if (typeof value === 'number') {
              totalEffects[effectType] = (totalEffects[effectType] || 0) + value;
            } else if (effectType === 'special_abilities') {
              totalEffects.special_abilities = totalEffects.special_abilities || [];
              totalEffects.special_abilities.push(...(Array.isArray(value) ? value : [value]));
            }
          }
        }
      }

      return { data: totalEffects };
    } catch (err) {
      return handleDatabaseError(err, 'calculating colony effects');
    }
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      colony_id: this.colony_id,
      name: this.name,
      type: this.building_type,
      position: {
        x: this.position_x,
        y: this.position_y,
        width: this.width,
        height: this.height
      },
      status: {
        health: this.health,
        max_health: this.max_health,
        construction_progress: this.construction_progress,
        is_active: this.is_active,
        level: this.level
      },
      costs: {
        build_cost: this.build_cost,
        maintenance_cost: this.maintenance_cost
      },
      effects: this.getStructureEffects(),
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Structure; 
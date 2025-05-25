const { supabase, handleDatabaseError } = require('../config/database');

class Colony {
  constructor(data = {}) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.name = data.name;
    this.description = data.description;
    this.color = data.color || '#8B4513';
    
    // Colony stats
    this.population = data.population || 10;
    this.max_population = data.max_population || 100;
    this.food_storage = data.food_storage || 100;
    this.food_consumed_per_tick = data.food_consumed_per_tick || 1;
    
    // Position and territory
    this.map_seed = data.map_seed;
    this.territory_size = data.territory_size || 5;
    
    // Game state
    this.game_speed = data.game_speed || 1.0;
    this.last_tick = data.last_tick;
    this.total_ticks = data.total_ticks || 0;
    
    // Status
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.difficulty_level = data.difficulty_level || 'medium';
    
    // Timestamps
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new colony
  static async create(colonyData) {
    try {
      const { data, error } = await supabase
        .from('colonies')
        .insert([colonyData])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'creating colony');
      }

      return { data: new Colony(data) };
    } catch (err) {
      return handleDatabaseError(err, 'creating colony');
    }
  }

  // Find colony by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('colonies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { error: 'Colony not found' };
        }
        return handleDatabaseError(error, 'finding colony');
      }

      return { data: new Colony(data) };
    } catch (err) {
      return handleDatabaseError(err, 'finding colony');
    }
  }

  // Find all colonies for a user
  static async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('colonies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return handleDatabaseError(error, 'finding user colonies');
      }

      const colonies = data.map(colony => new Colony(colony));
      return { data: colonies };
    } catch (err) {
      return handleDatabaseError(err, 'finding user colonies');
    }
  }

  // Update colony
  async update(updateData) {
    try {
      const { data, error } = await supabase
        .from('colonies')
        .update(updateData)
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'updating colony');
      }

      // Update this instance with new data
      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'updating colony');
    }
  }

  // Delete colony
  async delete() {
    try {
      const { error } = await supabase
        .from('colonies')
        .delete()
        .eq('id', this.id);

      if (error) {
        return handleDatabaseError(error, 'deleting colony');
      }

      return { data: { message: 'Colony deleted successfully' } };
    } catch (err) {
      return handleDatabaseError(err, 'deleting colony');
    }
  }

  // Get colony with related data (ants, resources, buildings)
  static async findWithDetails(id) {
    try {
      // Get colony
      const colonyResult = await Colony.findById(id);
      if (colonyResult.error) {
        return colonyResult;
      }

      const colony = colonyResult.data;

      // Get related data in parallel
      const [antsResult, resourcesResult, buildingsResult] = await Promise.all([
        supabase.from('ants').select('*').eq('colony_id', id),
        supabase.from('colony_resources').select('*').eq('colony_id', id),
        supabase.from('buildings').select('*').eq('colony_id', id)
      ]);

      if (antsResult.error || resourcesResult.error || buildingsResult.error) {
        return { error: 'Failed to load colony details' };
      }

      return {
        data: {
          colony,
          ants: antsResult.data,
          resources: resourcesResult.data,
          buildings: buildingsResult.data
        }
      };
    } catch (err) {
      return handleDatabaseError(err, 'loading colony details');
    }
  }

  // Increment game tick
  async incrementTick() {
    return this.update({
      total_ticks: this.total_ticks + 1,
      last_tick: new Date().toISOString()
    });
  }

  // Update population
  async updatePopulation(newPopulation) {
    return this.update({
      population: Math.max(0, newPopulation)
    });
  }

  // Update food storage
  async updateFoodStorage(newAmount) {
    return this.update({
      food_storage: Math.max(0, newAmount)
    });
  }

  // Get active colonies (for AI or simulation)
  static async getActiveColonies() {
    try {
      const { data, error } = await supabase
        .from('colonies')
        .select('*')
        .eq('is_active', true)
        .order('last_tick', { ascending: true });

      if (error) {
        return handleDatabaseError(error, 'finding active colonies');
      }

      const colonies = data.map(colony => new Colony(colony));
      return { data: colonies };
    } catch (err) {
      return handleDatabaseError(err, 'finding active colonies');
    }
  }

  // Convert to JSON for API responses
  toJSON() {
    return {
      id: this.id,
      user_id: this.user_id,
      name: this.name,
      description: this.description,
      color: this.color,
      population: this.population,
      max_population: this.max_population,
      food_storage: this.food_storage,
      food_consumed_per_tick: this.food_consumed_per_tick,
      map_seed: this.map_seed,
      territory_size: this.territory_size,
      game_speed: this.game_speed,
      last_tick: this.last_tick,
      total_ticks: this.total_ticks,
      is_active: this.is_active,
      difficulty_level: this.difficulty_level,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

module.exports = Colony;

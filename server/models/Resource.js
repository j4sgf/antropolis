const { supabase, handleDatabaseError } = require('../config/database');

// Resource Types Configuration
const RESOURCE_TYPES = {
  LEAVES: {
    name: 'leaves',
    displayName: 'Leaves',
    nutritionalValue: 5,
    decayRate: 0.05, // 5% per hour
    storageRequirement: 1, // storage units per resource
    baseCollectionTime: 30, // seconds
    rarityLevel: 'common',
    description: 'Fresh leaves provide basic nutrition and are abundant in most environments.'
  },
  FUNGUS: {
    name: 'fungus',
    displayName: 'Fungus',
    nutritionalValue: 12,
    decayRate: 0.02, // 2% per hour
    storageRequirement: 2,
    baseCollectionTime: 60, // seconds
    rarityLevel: 'uncommon',
    description: 'Cultivated fungus provides excellent nutrition with good storage properties.'
  },
  INSECT_REMAINS: {
    name: 'insect_remains',
    displayName: 'Insect Remains',
    nutritionalValue: 20,
    decayRate: 0.1, // 10% per hour
    storageRequirement: 1,
    baseCollectionTime: 45, // seconds
    rarityLevel: 'rare',
    description: 'Protein-rich insect remains are highly nutritious but spoil quickly.'
  },
  SEEDS: {
    name: 'seeds',
    displayName: 'Seeds',
    nutritionalValue: 8,
    decayRate: 0.01, // 1% per hour
    storageRequirement: 1,
    baseCollectionTime: 20, // seconds
    rarityLevel: 'common',
    description: 'Durable seeds provide sustained nutrition and store well.'
  },
  NECTAR: {
    name: 'nectar',
    displayName: 'Nectar',
    nutritionalValue: 15,
    decayRate: 0.08, // 8% per hour
    storageRequirement: 3,
    baseCollectionTime: 40, // seconds
    rarityLevel: 'uncommon',
    description: 'Sweet nectar is energy-rich but requires special storage containers.'
  },
  PROCESSED_PROTEIN: {
    name: 'processed_protein',
    displayName: 'Processed Protein',
    nutritionalValue: 25,
    decayRate: 0.03, // 3% per hour
    storageRequirement: 2,
    baseCollectionTime: 0, // Not collectible from map, only from conversion
    rarityLevel: 'processed',
    description: 'Concentrated protein processed from insect remains, highly nutritious and stable.'
  },
  HONEY: {
    name: 'honey',
    displayName: 'Honey',
    nutritionalValue: 18,
    decayRate: 0.005, // 0.5% per hour - very stable
    storageRequirement: 2,
    baseCollectionTime: 0, // Not collectible from map, only from conversion
    rarityLevel: 'processed',
    description: 'Long-lasting honey stores created from nectar, excellent for emergency reserves.'
  }
};

class Resource {
  constructor(data = {}) {
    this.id = data.id;
    this.type = data.type;
    this.quantity = data.quantity || 0;
    this.quality = data.quality || 100; // 0-100, decreases with decay
    this.location_x = data.location_x;
    this.location_y = data.location_y;
    this.discovered_at = data.discovered_at;
    this.last_harvested = data.last_harvested;
    this.spawn_rate = data.spawn_rate || 1.0; // multiplier for regeneration
    this.is_depleted = data.is_depleted || false;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Get resource type configuration
  getTypeConfig() {
    return RESOURCE_TYPES[this.type.toUpperCase()] || null;
  }

  // Get effective nutritional value considering quality
  getEffectiveNutritionalValue() {
    const config = this.getTypeConfig();
    if (!config) return 0;
    return Math.floor(config.nutritionalValue * (this.quality / 100));
  }

  // Calculate decay over time
  calculateDecay(hoursElapsed) {
    const config = this.getTypeConfig();
    if (!config) return this.quality;
    
    const decayAmount = config.decayRate * hoursElapsed * 100;
    return Math.max(0, this.quality - decayAmount);
  }

  // Apply decay to the resource
  async applyDecay() {
    if (!this.updated_at) return { data: this };
    
    const hoursElapsed = (Date.now() - new Date(this.updated_at).getTime()) / (1000 * 60 * 60);
    const newQuality = this.calculateDecay(hoursElapsed);
    
    return this.update({ quality: newQuality });
  }

  // Create a new resource node on the map
  static async create(resourceData) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert([{
          ...resourceData,
          discovered_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'creating resource');
      }

      return { data: new Resource(data) };
    } catch (err) {
      return handleDatabaseError(err, 'creating resource');
    }
  }

  // Find resource by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { error: 'Resource not found' };
        }
        return handleDatabaseError(error, 'finding resource');
      }

      return { data: new Resource(data) };
    } catch (err) {
      return handleDatabaseError(err, 'finding resource');
    }
  }

  // Find resources in a specific area
  static async findInArea(x, y, radius) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .gte('location_x', x - radius)
        .lte('location_x', x + radius)
        .gte('location_y', y - radius)
        .lte('location_y', y + radius)
        .eq('is_depleted', false);

      if (error) {
        return handleDatabaseError(error, 'finding resources in area');
      }

      const resources = data.map(resource => new Resource(resource));
      return { data: resources };
    } catch (err) {
      return handleDatabaseError(err, 'finding resources in area');
    }
  }

  // Find resources by type
  static async findByType(type, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('type', type)
        .eq('is_depleted', false)
        .limit(limit);

      if (error) {
        return handleDatabaseError(error, 'finding resources by type');
      }

      const resources = data.map(resource => new Resource(resource));
      return { data: resources };
    } catch (err) {
      return handleDatabaseError(err, 'finding resources by type');
    }
  }

  // Update resource
  async update(updateData) {
    try {
      const { data, error } = await supabase
        .from('resources')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'updating resource');
      }

      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'updating resource');
    }
  }

  // Harvest resource (reduce quantity)
  async harvest(amount) {
    const newQuantity = Math.max(0, this.quantity - amount);
    const isDepleted = newQuantity === 0;
    
    return this.update({
      quantity: newQuantity,
      is_depleted: isDepleted,
      last_harvested: new Date().toISOString()
    });
  }

  // Regenerate resource over time
  async regenerate() {
    if (this.is_depleted) return { data: this };
    
    const config = this.getTypeConfig();
    if (!config) return { data: this };
    
    // Calculate regeneration based on time elapsed and spawn rate
    const hoursElapsed = this.last_harvested ? 
      (Date.now() - new Date(this.last_harvested).getTime()) / (1000 * 60 * 60) : 0;
    
    const regenAmount = Math.floor(hoursElapsed * this.spawn_rate * 2); // 2 units per hour base
    if (regenAmount > 0) {
      const newQuantity = Math.min(100, this.quantity + regenAmount); // Max 100 units
      return this.update({ quantity: newQuantity });
    }
    
    return { data: this };
  }

  // Delete resource
  async delete() {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', this.id);

      if (error) {
        return handleDatabaseError(error, 'deleting resource');
      }

      return { data: { message: 'Resource deleted successfully' } };
    } catch (err) {
      return handleDatabaseError(err, 'deleting resource');
    }
  }

  // Generate random resources in an area
  static async generateInArea(centerX, centerY, radius, count = 10) {
    const resources = [];
    const types = Object.keys(RESOURCE_TYPES);
    
    for (let i = 0; i < count; i++) {
      // Random position within radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      // Random resource type (weighted by rarity)
      const type = types[Math.floor(Math.random() * types.length)];
      const config = RESOURCE_TYPES[type];
      
      // Random quantity based on type
      const baseQuantity = {
        common: 50,
        uncommon: 30,
        rare: 15
      }[config.rarityLevel] || 25;
      
      const quantity = Math.floor(baseQuantity + Math.random() * baseQuantity);
      
      const resourceData = {
        type: config.name,
        quantity,
        location_x: Math.round(x),
        location_y: Math.round(y),
        quality: 100,
        spawn_rate: 0.5 + Math.random() * 1.0 // 0.5 to 1.5 multiplier
      };
      
      try {
        const result = await Resource.create(resourceData);
        if (result.data) {
          resources.push(result.data);
        }
      } catch (error) {
        console.error('Failed to generate resource:', error);
      }
    }
    
    return { data: resources };
  }

  // Get all available resource types
  static getResourceTypes() {
    return RESOURCE_TYPES;
  }

  // Convert to JSON for API responses
  toJSON() {
    const config = this.getTypeConfig();
    return {
      id: this.id,
      type: this.type,
      displayName: config?.displayName || this.type,
      quantity: this.quantity,
      quality: this.quality,
      location: {
        x: this.location_x,
        y: this.location_y
      },
      typeConfig: config,
      effectiveNutritionalValue: this.getEffectiveNutritionalValue(),
      discoveredAt: this.discovered_at,
      lastHarvested: this.last_harvested,
      spawnRate: this.spawn_rate,
      isDepleted: this.is_depleted,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

module.exports = Resource; 
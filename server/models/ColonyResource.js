const { supabase, handleDatabaseError } = require('../config/database');
const Resource = require('./Resource');

// Storage zone types for organizing resources
const STORAGE_ZONES = {
  GENERAL: {
    name: 'general',
    displayName: 'General Storage',
    capacity: 500,
    description: 'Main storage area for common resources'
  },
  FOOD_PROCESSING: {
    name: 'food_processing',
    displayName: 'Food Processing',
    capacity: 200,
    description: 'Specialized area for processing and preparing food'
  },
  NURSERY_SUPPLIES: {
    name: 'nursery_supplies',
    displayName: 'Nursery Supplies',
    capacity: 100,
    description: 'Resources dedicated to larvae and nursery care'
  },
  EMERGENCY_RESERVES: {
    name: 'emergency_reserves',
    displayName: 'Emergency Reserves',
    capacity: 150,
    description: 'Protected storage for emergency situations'
  }
};

class ColonyResource {
  constructor(data = {}) {
    this.id = data.id;
    this.colony_id = data.colony_id;
    this.resource_type = data.resource_type;
    this.quantity = data.quantity || 0;
    this.quality = data.quality || 100;
    this.storage_zone = data.storage_zone || 'general';
    this.reserved_quantity = data.reserved_quantity || 0; // Reserved for specific tasks
    this.last_updated = data.last_updated;
    this.last_decay_check = data.last_decay_check;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Get available quantity (total - reserved)
  getAvailableQuantity() {
    return Math.max(0, this.quantity - this.reserved_quantity);
  }

  // Get resource type configuration
  getResourceConfig() {
    const resourceTypes = Resource.getResourceTypes();
    return resourceTypes[this.resource_type.toUpperCase()] || null;
  }

  // Get storage zone configuration
  getStorageZoneConfig() {
    return STORAGE_ZONES[this.storage_zone.toUpperCase()] || STORAGE_ZONES.GENERAL;
  }

  // Calculate effective nutritional value
  getEffectiveNutritionalValue() {
    const config = this.getResourceConfig();
    if (!config) return 0;
    return Math.floor(config.nutritionalValue * (this.quality / 100) * this.quantity);
  }

  // Apply decay to stored resources
  async applyDecay() {
    if (!this.last_decay_check) {
      return this.update({ last_decay_check: new Date().toISOString() });
    }

    const hoursElapsed = (Date.now() - new Date(this.last_decay_check).getTime()) / (1000 * 60 * 60);
    const config = this.getResourceConfig();
    
    if (!config || hoursElapsed < 1) return { data: this };

    // Calculate decay rate (storage zones may affect decay)
    let decayRate = config.decayRate;
    if (this.storage_zone === 'food_processing') decayRate *= 0.8; // 20% slower decay
    if (this.storage_zone === 'emergency_reserves') decayRate *= 0.5; // 50% slower decay

    const decayAmount = decayRate * hoursElapsed * 100;
    const newQuality = Math.max(0, this.quality - decayAmount);

    return this.update({
      quality: newQuality,
      last_decay_check: new Date().toISOString()
    });
  }

  // Create a new colony resource entry
  static async create(colonyResourceData) {
    try {
      const { data, error } = await supabase
        .from('colony_resources')
        .insert([{
          ...colonyResourceData,
          last_updated: new Date().toISOString(),
          last_decay_check: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'creating colony resource');
      }

      return { data: new ColonyResource(data) };
    } catch (err) {
      return handleDatabaseError(err, 'creating colony resource');
    }
  }

  // Find colony resource by ID
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('colony_resources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { error: 'Colony resource not found' };
        }
        return handleDatabaseError(error, 'finding colony resource');
      }

      return { data: new ColonyResource(data) };
    } catch (err) {
      return handleDatabaseError(err, 'finding colony resource');
    }
  }

  // Find all resources for a colony
  static async findByColonyId(colonyId) {
    try {
      const { data, error } = await supabase
        .from('colony_resources')
        .select('*')
        .eq('colony_id', colonyId)
        .order('resource_type');

      if (error) {
        return handleDatabaseError(error, 'finding colony resources');
      }

      const resources = data.map(resource => new ColonyResource(resource));
      return { data: resources };
    } catch (err) {
      return handleDatabaseError(err, 'finding colony resources');
    }
  }

  // Find specific resource type for a colony
  static async findByColonyAndType(colonyId, resourceType, storageZone = null) {
    try {
      let query = supabase
        .from('colony_resources')
        .select('*')
        .eq('colony_id', colonyId)
        .eq('resource_type', resourceType);

      if (storageZone) {
        query = query.eq('storage_zone', storageZone);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null }; // Not found, which is valid
        }
        return handleDatabaseError(error, 'finding colony resource by type');
      }

      return { data: new ColonyResource(data) };
    } catch (err) {
      return handleDatabaseError(err, 'finding colony resource by type');
    }
  }

  // Get storage summary for a colony
  static async getStorageSummary(colonyId) {
    try {
      const { data, error } = await supabase
        .from('colony_resources')
        .select('*')
        .eq('colony_id', colonyId);

      if (error) {
        return handleDatabaseError(error, 'getting storage summary');
      }

      const resources = data.map(r => new ColonyResource(r));
      const summary = {
        totalResources: resources.length,
        totalQuantity: 0,
        totalNutritionalValue: 0,
        byZone: {},
        byType: {}
      };

      // Initialize zones
      Object.keys(STORAGE_ZONES).forEach(zone => {
        const config = STORAGE_ZONES[zone];
        summary.byZone[config.name] = {
          displayName: config.displayName,
          capacity: config.capacity,
          used: 0,
          resources: []
        };
      });

      // Process each resource
      resources.forEach(resource => {
        const config = resource.getResourceConfig();
        const storageRequired = config ? config.storageRequirement * resource.quantity : resource.quantity;
        
        summary.totalQuantity += resource.quantity;
        summary.totalNutritionalValue += resource.getEffectiveNutritionalValue();

        // By zone
        if (summary.byZone[resource.storage_zone]) {
          summary.byZone[resource.storage_zone].used += storageRequired;
          summary.byZone[resource.storage_zone].resources.push(resource.toJSON());
        }

        // By type
        if (!summary.byType[resource.resource_type]) {
          summary.byType[resource.resource_type] = {
            totalQuantity: 0,
            totalNutritionalValue: 0,
            averageQuality: 0,
            zones: []
          };
        }
        
        summary.byType[resource.resource_type].totalQuantity += resource.quantity;
        summary.byType[resource.resource_type].totalNutritionalValue += resource.getEffectiveNutritionalValue();
        summary.byType[resource.resource_type].zones.push({
          zone: resource.storage_zone,
          quantity: resource.quantity,
          quality: resource.quality
        });
      });

      // Calculate average quality by type
      Object.keys(summary.byType).forEach(type => {
        const typeResources = resources.filter(r => r.resource_type === type);
        const totalQuality = typeResources.reduce((sum, r) => sum + (r.quality * r.quantity), 0);
        const totalQuantity = typeResources.reduce((sum, r) => sum + r.quantity, 0);
        summary.byType[type].averageQuality = totalQuantity > 0 ? totalQuality / totalQuantity : 0;
      });

      return { data: summary };
    } catch (err) {
      return handleDatabaseError(err, 'getting storage summary');
    }
  }

  // Update colony resource
  async update(updateData) {
    try {
      const { data, error } = await supabase
        .from('colony_resources')
        .update({
          ...updateData,
          last_updated: new Date().toISOString()
        })
        .eq('id', this.id)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, 'updating colony resource');
      }

      Object.assign(this, data);
      return { data: this };
    } catch (err) {
      return handleDatabaseError(err, 'updating colony resource');
    }
  }

  // Add resources to storage
  async addQuantity(amount, quality = 100) {
    const newQuantity = this.quantity + amount;
    const weightedQuality = ((this.quality * this.quantity) + (quality * amount)) / newQuantity;
    
    return this.update({
      quantity: newQuantity,
      quality: Math.round(weightedQuality)
    });
  }

  // Remove resources from storage
  async removeQuantity(amount) {
    const newQuantity = Math.max(0, this.quantity - amount);
    return this.update({ quantity: newQuantity });
  }

  // Reserve resources for specific tasks
  async reserveQuantity(amount) {
    const maxReservable = this.getAvailableQuantity();
    const actualReserved = Math.min(amount, maxReservable);
    
    return this.update({
      reserved_quantity: this.reserved_quantity + actualReserved
    });
  }

  // Release reserved resources
  async releaseReserved(amount = null) {
    const releaseAmount = amount || this.reserved_quantity;
    const newReserved = Math.max(0, this.reserved_quantity - releaseAmount);
    
    return this.update({ reserved_quantity: newReserved });
  }

  // Move resources between storage zones
  async moveToZone(targetZone, amount = null) {
    const moveAmount = amount || this.quantity;
    
    if (moveAmount === this.quantity) {
      // Move entire resource
      return this.update({ storage_zone: targetZone });
    } else {
      // Split the resource - create new entry in target zone
      const targetData = {
        colony_id: this.colony_id,
        resource_type: this.resource_type,
        quantity: moveAmount,
        quality: this.quality,
        storage_zone: targetZone
      };
      
      const createResult = await ColonyResource.create(targetData);
      if (createResult.error) return createResult;
      
      // Reduce quantity in current zone
      return this.removeQuantity(moveAmount);
    }
  }

  // Delete colony resource
  async delete() {
    try {
      const { error } = await supabase
        .from('colony_resources')
        .delete()
        .eq('id', this.id);

      if (error) {
        return handleDatabaseError(error, 'deleting colony resource');
      }

      return { data: { message: 'Colony resource deleted successfully' } };
    } catch (err) {
      return handleDatabaseError(err, 'deleting colony resource');
    }
  }

  // Add or update resources in colony storage
  static async addToColony(colonyId, resourceType, quantity, quality = 100, storageZone = 'general') {
    try {
      // Try to find existing resource in the same zone
      const existingResult = await ColonyResource.findByColonyAndType(colonyId, resourceType, storageZone);
      
      if (existingResult.data) {
        // Add to existing resource
        return existingResult.data.addQuantity(quantity, quality);
      } else {
        // Create new resource entry
        return ColonyResource.create({
          colony_id: colonyId,
          resource_type: resourceType,
          quantity,
          quality,
          storage_zone: storageZone
        });
      }
    } catch (err) {
      return handleDatabaseError(err, 'adding resource to colony');
    }
  }

  // Get storage zone configurations
  static getStorageZones() {
    return STORAGE_ZONES;
  }

  // Convert to JSON for API responses
  toJSON() {
    const resourceConfig = this.getResourceConfig();
    const zoneConfig = this.getStorageZoneConfig();
    
    return {
      id: this.id,
      colonyId: this.colony_id,
      resourceType: this.resource_type,
      displayName: resourceConfig?.displayName || this.resource_type,
      quantity: this.quantity,
      availableQuantity: this.getAvailableQuantity(),
      reservedQuantity: this.reserved_quantity,
      quality: this.quality,
      storageZone: {
        name: this.storage_zone,
        displayName: zoneConfig.displayName
      },
      resourceConfig,
      effectiveNutritionalValue: this.getEffectiveNutritionalValue(),
      lastUpdated: this.last_updated,
      lastDecayCheck: this.last_decay_check,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }
}

module.exports = ColonyResource; 
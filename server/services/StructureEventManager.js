const Structure = require('../models/Structure');
const StructureEffectsManager = require('./StructureEffectsManager');
const EventEmitter = require('events');

/**
 * StructureEventManager handles structure-related events and 
 * automatically updates colony effects when structures change
 */
class StructureEventManager extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // When a structure is built
    this.on('structure:built', async (data) => {
      console.log(`🏗️ Structure built: ${data.structureType} in colony ${data.colonyId}`);
      await this.updateColonyEffects(data.colonyId);
      await this.logStructureEvent(data.colonyId, 'built', data);
    });

    // When a structure is upgraded
    this.on('structure:upgraded', async (data) => {
      console.log(`⬆️ Structure upgraded: ${data.structureName} to level ${data.newLevel}`);
      await this.updateColonyEffects(data.colonyId);
      await this.logStructureEvent(data.colonyId, 'upgraded', data);
    });

    // When a structure is damaged
    this.on('structure:damaged', async (data) => {
      console.log(`💥 Structure damaged: ${data.structureName} (-${data.damageAmount} HP)`);
      await this.updateColonyEffects(data.colonyId);
      
      // Check if structure was destroyed
      if (data.newHealth <= 0) {
        this.emit('structure:destroyed', {
          ...data,
          reason: 'damage'
        });
      }
      
      await this.logStructureEvent(data.colonyId, 'damaged', data);
    });

    // When a structure is destroyed
    this.on('structure:destroyed', async (data) => {
      console.log(`💀 Structure destroyed: ${data.structureName} in colony ${data.colonyId}`);
      await this.updateColonyEffects(data.colonyId);
      await this.logStructureEvent(data.colonyId, 'destroyed', data);
      
      // Trigger colony alert for destroyed structures
      this.emit('colony:alert', {
        colonyId: data.colonyId,
        type: 'structure_destroyed',
        message: `${data.structureName} has been destroyed!`,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    });

    // When a structure is repaired
    this.on('structure:repaired', async (data) => {
      console.log(`🔧 Structure repaired: ${data.structureName} (+${data.repairAmount} HP)`);
      await this.updateColonyEffects(data.colonyId);
      await this.logStructureEvent(data.colonyId, 'repaired', data);
    });

    // When a structure construction completes
    this.on('structure:construction_complete', async (data) => {
      console.log(`✅ Construction completed: ${data.structureName} in colony ${data.colonyId}`);
      await this.updateColonyEffects(data.colonyId);
      await this.logStructureEvent(data.colonyId, 'construction_complete', data);
      
      // Trigger colony notification for completed structures
      this.emit('colony:notification', {
        colonyId: data.colonyId,
        type: 'construction_complete',
        message: `${data.structureName} construction completed!`,
        severity: 'low',
        timestamp: new Date().toISOString()
      });
    });

    // When structure maintenance is processed
    this.on('structure:maintenance_processed', async (data) => {
      console.log(`🔧 Maintenance processed for colony ${data.colonyId}`);
      await this.updateColonyEffects(data.colonyId);
      
      // Check for maintenance failures
      if (data.maintenanceResults.some(result => result.status === 'degradation')) {
        this.emit('colony:alert', {
          colonyId: data.colonyId,
          type: 'maintenance_failure',
          message: 'Some structures are degrading due to insufficient maintenance!',
          severity: 'medium',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Colony alerts and notifications
    this.on('colony:alert', (alert) => {
      console.log(`🚨 Colony Alert [${alert.severity}]: ${alert.message}`);
      // Here you could store alerts in database, send to WebSocket, etc.
    });

    this.on('colony:notification', (notification) => {
      console.log(`📢 Colony Notification: ${notification.message}`);
      // Here you could store notifications in database, send to WebSocket, etc.
    });
  }

  /**
   * Update colony effects after structure changes
   * @param {string} colonyId - Colony ID
   */
  async updateColonyEffects(colonyId) {
    try {
      // Invalidate effects cache to force recalculation
      StructureEffectsManager.invalidateCache(colonyId);
      
      // Recalculate effects
      const effectsResult = await StructureEffectsManager.calculateColonyEffects(colonyId);
      if (effectsResult.success) {
        console.log(`📊 Updated effects for colony ${colonyId}:`, {
          activeStructures: effectsResult.data.active_structures,
          totalEffects: Object.keys(effectsResult.data).filter(key => 
            typeof effectsResult.data[key] === 'number' && effectsResult.data[key] > 0
          ).length
        });
      }
    } catch (error) {
      console.error('Error updating colony effects:', error);
    }
  }

  /**
   * Log structure events for history/debugging
   * @param {string} colonyId - Colony ID
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  async logStructureEvent(colonyId, eventType, data) {
    try {
      // In a real implementation, you might store these in a database
      const logEntry = {
        colonyId,
        eventType,
        timestamp: new Date().toISOString(),
        data: {
          structureId: data.structureId,
          structureName: data.structureName,
          structureType: data.structureType,
          ...data
        }
      };
      
      // For now, just log to console (could be stored in database)
      console.log(`📝 Event Log:`, logEntry);
    } catch (error) {
      console.error('Error logging structure event:', error);
    }
  }

  /**
   * Trigger structure built event
   * @param {Object} data - Structure data
   */
  triggerStructureBuilt(data) {
    this.emit('structure:built', data);
  }

  /**
   * Trigger structure upgraded event
   * @param {Object} data - Structure data
   */
  triggerStructureUpgraded(data) {
    this.emit('structure:upgraded', data);
  }

  /**
   * Trigger structure damaged event
   * @param {Object} data - Damage data
   */
  triggerStructureDamaged(data) {
    this.emit('structure:damaged', data);
  }

  /**
   * Trigger structure repaired event
   * @param {Object} data - Repair data
   */
  triggerStructureRepaired(data) {
    this.emit('structure:repaired', data);
  }

  /**
   * Trigger construction complete event
   * @param {Object} data - Construction data
   */
  triggerConstructionComplete(data) {
    this.emit('structure:construction_complete', data);
  }

  /**
   * Trigger maintenance processed event
   * @param {Object} data - Maintenance data
   */
  triggerMaintenanceProcessed(data) {
    this.emit('structure:maintenance_processed', data);
  }

  /**
   * Process daily structure events (maintenance, etc.)
   * @param {string} colonyId - Colony ID (optional, processes all if not provided)
   */
  async processDailyEvents(colonyId = null) {
    try {
      console.log('🌅 Processing daily structure events...');
      
      // Get colonies to process
      const coloniesToProcess = colonyId ? [colonyId] : await this.getAllActiveColonies();
      
      for (const cId of coloniesToProcess) {
        // Process maintenance for each colony
        const maintenanceResult = await StructureEffectsManager.processStructureMaintenance(cId);
        if (maintenanceResult.success) {
          this.triggerMaintenanceProcessed({
            colonyId: cId,
            ...maintenanceResult.data
          });
        }
        
        // Random chance for structure damage events (natural wear, weather, etc.)
        if (Math.random() < 0.1) { // 10% chance per day
          const damageEvent = {
            damageAmount: Math.floor(Math.random() * 10) + 5, // 5-15 damage
            damageType: 'environmental',
            affectAll: false
          };
          
          const damageResult = await StructureEffectsManager.applyStructureDamage(cId, damageEvent);
          if (damageResult.success && damageResult.data.damageResults.length > 0) {
            console.log(`🌦️ Environmental damage in colony ${cId}`);
            for (const result of damageResult.data.damageResults) {
              this.triggerStructureDamaged({
                colonyId: cId,
                structureId: result.structureId,
                structureName: result.structureName,
                damageAmount: result.damageDealt,
                newHealth: result.newHealth,
                reason: 'environmental'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing daily structure events:', error);
    }
  }

  /**
   * Get all active colony IDs from database
   * @returns {Array} Array of colony IDs
   */
  async getAllActiveColonies() {
    try {
      const { supabase, isDevelopmentMode } = require('../config/database');
      
      if (isDevelopmentMode) {
        // In mock mode, return the test colony ID
        return ['test-colony-001'];
      }
      
      // Query real database for active colonies
      const { data, error } = await supabase
        .from('colonies')
        .select('id')
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching active colonies:', error);
        return [];
      }
      
      return data.map(colony => colony.id);
    } catch (error) {
      console.error('Error in getAllActiveColonies:', error);
      return [];
    }
  }

  /**
   * Start automated daily processing
   * @param {number} intervalMs - Interval in milliseconds (default: 24 hours)
   */
  startDailyProcessing(intervalMs = 24 * 60 * 60 * 1000) {
    console.log('🕐 Starting automated daily structure processing...');
    
    // Process immediately
    this.processDailyEvents();
    
    // Set up interval for daily processing
    this.dailyInterval = setInterval(() => {
      this.processDailyEvents();
    }, intervalMs);
  }

  /**
   * Stop automated daily processing
   */
  stopDailyProcessing() {
    if (this.dailyInterval) {
      clearInterval(this.dailyInterval);
      this.dailyInterval = null;
      console.log('🛑 Stopped automated daily structure processing');
    }
  }
}

// Export singleton instance
module.exports = new StructureEventManager(); 
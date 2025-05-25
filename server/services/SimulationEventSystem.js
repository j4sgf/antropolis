const EventEmitter = require('events');

/**
 * Event priorities for processing order
 */
const EventPriority = {
  CRITICAL: 0,    // System-critical events (colony death, simulation errors)
  HIGH: 1,        // Important game events (battles, major resource events)
  NORMAL: 2,      // Standard game events (resource collection, ant actions)
  LOW: 3,         // Minor events (visual updates, notifications)
  DEBUG: 4        // Debug and logging events
};

/**
 * Standard simulation event types
 */
const EventTypes = {
  // Colony events
  COLONY_CREATED: 'colony:created',
  COLONY_DESTROYED: 'colony:destroyed',
  COLONY_RESOURCE_CHANGED: 'colony:resource_changed',
  COLONY_POPULATION_CHANGED: 'colony:population_changed',
  
  // Ant events
  ANT_BORN: 'ant:born',
  ANT_DIED: 'ant:died',
  ANT_ROLE_CHANGED: 'ant:role_changed',
  ANT_TASK_STARTED: 'ant:task_started',
  ANT_TASK_COMPLETED: 'ant:task_completed',
  
  // Resource events
  RESOURCE_COLLECTED: 'resource:collected',
  RESOURCE_CONSUMED: 'resource:consumed',
  RESOURCE_DEPLETED: 'resource:depleted',
  RESOURCE_DISCOVERED: 'resource:discovered',
  
  // Battle events
  BATTLE_STARTED: 'battle:started',
  BATTLE_ENDED: 'battle:ended',
  ATTACK_LAUNCHED: 'battle:attack_launched',
  DAMAGE_DEALT: 'battle:damage_dealt',
  
  // Structure events
  STRUCTURE_BUILT: 'structure:built',
  STRUCTURE_UPGRADED: 'structure:upgraded',
  STRUCTURE_DAMAGED: 'structure:damaged',
  STRUCTURE_DESTROYED: 'structure:destroyed',
  
  // Evolution events
  TECHNOLOGY_RESEARCHED: 'evolution:technology_researched',
  EVOLUTION_POINTS_EARNED: 'evolution:points_earned',
  
  // Exploration events
  AREA_EXPLORED: 'exploration:area_explored',
  TERRITORY_CLAIMED: 'exploration:territory_claimed',
  
  // System events
  SIMULATION_STARTED: 'system:simulation_started',
  SIMULATION_PAUSED: 'system:simulation_paused',
  SIMULATION_ERROR: 'system:simulation_error',
  TICK_PROCESSED: 'system:tick_processed'
};

/**
 * Event queue item structure
 */
class SimulationEvent {
  constructor(type, data, priority = EventPriority.NORMAL, source = null) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.type = type;
    this.data = data;
    this.priority = priority;
    this.source = source; // Source object that created the event
    this.timestamp = Date.now();
    this.processed = false;
  }
}

/**
 * Advanced event system for simulation events with queuing and prioritization
 */
class SimulationEventSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      maxQueueSize: config.maxQueueSize || 10000,
      maxEventsPerTick: config.maxEventsPerTick || 500,
      enableDebugLogging: config.enableDebugLogging || false,
      enableEventHistory: config.enableEventHistory || true,
      historySize: config.historySize || 1000,
      ...config
    };
    
    // Event queue with priority
    this.eventQueue = [];
    
    // Event history for debugging
    this.eventHistory = [];
    
    // Event statistics
    this.stats = {
      totalEventsProcessed: 0,
      eventsThisTick: 0,
      eventsByType: new Map(),
      eventsByPriority: new Map(),
      averageQueueSize: 0,
      maxQueueSize: 0
    };
    
    // Event listeners registry
    this.listeners = new Map();
    
    // Initialize priority counters
    Object.values(EventPriority).forEach(priority => {
      this.stats.eventsByPriority.set(priority, 0);
    });
    
    console.log('📡 SimulationEventSystem initialized:', {
      maxQueueSize: this.config.maxQueueSize,
      maxEventsPerTick: this.config.maxEventsPerTick,
      debugLogging: this.config.enableDebugLogging
    });
  }
  
  /**
   * Add an event to the queue
   * @param {string} type - Event type
   * @param {*} data - Event data
   * @param {number} priority - Event priority
   * @param {*} source - Source object
   */
  queueEvent(type, data, priority = EventPriority.NORMAL, source = null) {
    // Check queue size limit
    if (this.eventQueue.length >= this.config.maxQueueSize) {
      console.warn(`⚠️ Event queue full (${this.config.maxQueueSize}), dropping event:`, type);
      return false;
    }
    
    const event = new SimulationEvent(type, data, priority, source);
    
    // Insert event in queue based on priority
    this.insertEventByPriority(event);
    
    // Update statistics
    this.updateStats(event);
    
    // Debug logging
    if (this.config.enableDebugLogging) {
      console.log(`📨 Event queued: ${type}`, { id: event.id, priority, data });
    }
    
    return event.id;
  }
  
  /**
   * Insert event into queue maintaining priority order
   * @param {SimulationEvent} event - Event to insert
   */
  insertEventByPriority(event) {
    // Find insertion point based on priority
    let insertIndex = this.eventQueue.length;
    
    for (let i = 0; i < this.eventQueue.length; i++) {
      if (this.eventQueue[i].priority > event.priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.eventQueue.splice(insertIndex, 0, event);
  }
  
  /**
   * Process events from the queue
   * @param {number} maxEvents - Maximum events to process this cycle
   */
  processEvents(maxEvents = this.config.maxEventsPerTick) {
    this.stats.eventsThisTick = 0;
    const startTime = performance.now();
    
    let eventsProcessed = 0;
    
    while (this.eventQueue.length > 0 && eventsProcessed < maxEvents) {
      const event = this.eventQueue.shift();
      
      try {
        this.processEvent(event);
        eventsProcessed++;
        this.stats.eventsThisTick++;
        this.stats.totalEventsProcessed++;
        
      } catch (error) {
        console.error(`❌ Error processing event ${event.type}:`, error);
        
        // Queue a system error event
        this.queueEvent(
          EventTypes.SIMULATION_ERROR, 
          { error, originalEvent: event },
          EventPriority.CRITICAL
        );
      }
    }
    
    const processingTime = performance.now() - startTime;
    
    // Update queue statistics
    this.stats.averageQueueSize = (this.stats.averageQueueSize * 0.9) + (this.eventQueue.length * 0.1);
    this.stats.maxQueueSize = Math.max(this.stats.maxQueueSize, this.eventQueue.length);
    
    if (this.config.enableDebugLogging && eventsProcessed > 0) {
      console.log(`📊 Processed ${eventsProcessed} events in ${processingTime.toFixed(2)}ms, ${this.eventQueue.length} remaining`);
    }
    
    return eventsProcessed;
  }
  
  /**
   * Process a single event
   * @param {SimulationEvent} event - Event to process
   */
  processEvent(event) {
    event.processed = true;
    
    // Add to history
    if (this.config.enableEventHistory) {
      this.addToHistory(event);
    }
    
    // Emit the event to listeners
    this.emit(event.type, event.data, event);
    
    // Debug logging for critical events
    if (event.priority <= EventPriority.HIGH && this.config.enableDebugLogging) {
      console.log(`⚡ Event processed: ${event.type}`, event.data);
    }
  }
  
  /**
   * Add event to history for debugging
   * @param {SimulationEvent} event - Event to add to history
   */
  addToHistory(event) {
    this.eventHistory.push({
      id: event.id,
      type: event.type,
      priority: event.priority,
      timestamp: event.timestamp,
      processedAt: Date.now(),
      data: event.data
    });
    
    // Limit history size
    if (this.eventHistory.length > this.config.historySize) {
      this.eventHistory.shift();
    }
  }
  
  /**
   * Update event statistics
   * @param {SimulationEvent} event - Event to track
   */
  updateStats(event) {
    // Count by type
    const typeCount = this.stats.eventsByType.get(event.type) || 0;
    this.stats.eventsByType.set(event.type, typeCount + 1);
    
    // Count by priority
    const priorityCount = this.stats.eventsByPriority.get(event.priority) || 0;
    this.stats.eventsByPriority.set(event.priority, priorityCount + 1);
  }
  
  /**
   * Register a listener for specific event types
   * @param {string|Array} eventTypes - Event type(s) to listen for
   * @param {Function} callback - Callback function
   * @param {Object} options - Listener options
   */
  registerListener(eventTypes, callback, options = {}) {
    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];
    const listenerId = Math.random().toString(36).substr(2, 9);
    
    const listener = {
      id: listenerId,
      types,
      callback,
      once: options.once || false,
      priority: options.priority || EventPriority.NORMAL,
      active: true
    };
    
    this.listeners.set(listenerId, listener);
    
    // Register with EventEmitter
    types.forEach(type => {
      if (listener.once) {
        this.once(type, callback);
      } else {
        this.on(type, callback);
      }
    });
    
    return listenerId;
  }
  
  /**
   * Unregister a listener
   * @param {string} listenerId - ID of listener to remove
   */
  unregisterListener(listenerId) {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener.active = false;
      listener.types.forEach(type => {
        this.removeListener(type, listener.callback);
      });
      this.listeners.delete(listenerId);
    }
  }
  
  /**
   * Clear the event queue
   */
  clearQueue() {
    const queueSize = this.eventQueue.length;
    this.eventQueue = [];
    
    if (queueSize > 0) {
      console.log(`🗑️ Cleared ${queueSize} events from queue`);
    }
  }
  
  /**
   * Get current event system statistics
   */
  getStats() {
    return {
      queueSize: this.eventQueue.length,
      totalProcessed: this.stats.totalEventsProcessed,
      eventsThisTick: this.stats.eventsThisTick,
      averageQueueSize: Math.round(this.stats.averageQueueSize),
      maxQueueSize: this.stats.maxQueueSize,
      eventsByType: Object.fromEntries(this.stats.eventsByType),
      eventsByPriority: Object.fromEntries(this.stats.eventsByPriority),
      activeListeners: this.listeners.size
    };
  }
  
  /**
   * Get recent event history
   * @param {number} count - Number of recent events to return
   */
  getEventHistory(count = 50) {
    return this.eventHistory.slice(-count);
  }
  
  /**
   * Helper method to queue colony events
   */
  queueColonyEvent(type, colonyId, data) {
    return this.queueEvent(type, { colonyId, ...data }, EventPriority.NORMAL, `colony:${colonyId}`);
  }
  
  /**
   * Helper method to queue ant events
   */
  queueAntEvent(type, antId, colonyId, data) {
    return this.queueEvent(type, { antId, colonyId, ...data }, EventPriority.NORMAL, `ant:${antId}`);
  }
  
  /**
   * Helper method to queue resource events
   */
  queueResourceEvent(type, resourceId, amount, data) {
    return this.queueEvent(type, { resourceId, amount, ...data }, EventPriority.NORMAL, `resource:${resourceId}`);
  }
  
  /**
   * Helper method to queue battle events
   */
  queueBattleEvent(type, battleId, data) {
    return this.queueEvent(type, { battleId, ...data }, EventPriority.HIGH, `battle:${battleId}`);
  }
  
  /**
   * Clean up and destroy the event system
   */
  destroy() {
    this.clearQueue();
    this.eventHistory = [];
    this.listeners.clear();
    this.removeAllListeners();
    
    console.log('🗑️ SimulationEventSystem destroyed');
  }
}

module.exports = {
  SimulationEventSystem,
  EventTypes,
  EventPriority,
  SimulationEvent
}; 
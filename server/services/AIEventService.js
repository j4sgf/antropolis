/**
 * AIEventService for managing AI colony events and notifications
 * Handles communication about significant AI decisions and state changes
 */

class AIEventService {
  constructor() {
    this.eventQueue = [];
    this.eventHistory = [];
    this.subscribers = new Map(); // Event subscribers by type
    this.eventTypes = [
      'ai_attack_launched',
      'ai_strategy_changed',
      'ai_colony_created',
      'ai_colony_destroyed',
      'ai_adaptation_triggered',
      'ai_threat_level_changed',
      'ai_resource_threshold_reached',
      'ai_alliance_formed',
      'ai_alliance_broken',
      'ai_discovery_made',
      'ai_territory_claimed',
      'ai_unit_deployed',
      'ai_building_constructed',
      'ai_research_completed',
      'ai_diplomatic_action'
    ];
    this.eventPriorities = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
      emergency: 5
    };
    this.maxHistorySize = 1000;
    this.processingInterval = 100; // Process events every 100ms
    this.isProcessing = false;
  }

  /**
   * Initialize the event service and start processing
   */
  initialize() {
    this.startEventProcessing();
    console.log('AIEventService initialized');
  }

  /**
   * Start the event processing loop
   */
  startEventProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.processEvents();
  }

  /**
   * Stop the event processing loop
   */
  stopEventProcessing() {
    this.isProcessing = false;
  }

  /**
   * Process events in the queue
   */
  async processEvents() {
    if (!this.isProcessing) return;

    try {
      // Sort queue by priority and timestamp
      this.eventQueue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp - b.timestamp; // Earlier timestamp first
      });

      // Process events
      while (this.eventQueue.length > 0 && this.isProcessing) {
        const event = this.eventQueue.shift();
        await this.handleEvent(event);
      }
    } catch (error) {
      console.error('Error processing AI events:', error);
    }

    // Schedule next processing cycle
    if (this.isProcessing) {
      setTimeout(() => this.processEvents(), this.processingInterval);
    }
  }

  /**
   * Add an event to the queue
   */
  addEvent(eventType, data, priority = 'medium', colonyId = null) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: data,
      priority: this.eventPriorities[priority] || this.eventPriorities.medium,
      priorityLevel: priority,
      colonyId: colonyId,
      timestamp: new Date(),
      processed: false,
      attempts: 0,
      maxAttempts: 3
    };

    this.eventQueue.push(event);
    
    // If high priority, trigger immediate processing
    if (event.priority >= this.eventPriorities.high) {
      this.processHighPriorityEvent(event);
    }

    return event.id;
  }

  /**
   * Handle a specific event
   */
  async handleEvent(event) {
    try {
      event.attempts++;
      
      // Call event-specific handlers
      await this.routeEvent(event);
      
      // Notify subscribers
      await this.notifySubscribers(event);
      
      // Mark as processed and add to history
      event.processed = true;
      event.processedAt = new Date();
      this.addToHistory(event);
      
    } catch (error) {
      console.error(`Error handling event ${event.id}:`, error);
      
      // Retry logic
      if (event.attempts < event.maxAttempts) {
        event.retryAt = new Date(Date.now() + (event.attempts * 1000)); // Exponential backoff
        this.eventQueue.push(event);
      } else {
        console.error(`Event ${event.id} failed after ${event.maxAttempts} attempts`);
        event.failed = true;
        this.addToHistory(event);
      }
    }
  }

  /**
   * Route event to appropriate handler
   */
  async routeEvent(event) {
    switch (event.type) {
      case 'ai_attack_launched':
        return this.handleAttackLaunched(event);
      case 'ai_strategy_changed':
        return this.handleStrategyChanged(event);
      case 'ai_colony_created':
        return this.handleColonyCreated(event);
      case 'ai_colony_destroyed':
        return this.handleColonyDestroyed(event);
      case 'ai_adaptation_triggered':
        return this.handleAdaptationTriggered(event);
      case 'ai_threat_level_changed':
        return this.handleThreatLevelChanged(event);
      case 'ai_resource_threshold_reached':
        return this.handleResourceThresholdReached(event);
      case 'ai_alliance_formed':
        return this.handleAllianceFormed(event);
      case 'ai_alliance_broken':
        return this.handleAllianceBroken(event);
      case 'ai_discovery_made':
        return this.handleDiscoveryMade(event);
      case 'ai_territory_claimed':
        return this.handleTerritoryClaimed(event);
      case 'ai_unit_deployed':
        return this.handleUnitDeployed(event);
      case 'ai_building_constructed':
        return this.handleBuildingConstructed(event);
      case 'ai_research_completed':
        return this.handleResearchCompleted(event);
      case 'ai_diplomatic_action':
        return this.handleDiplomaticAction(event);
      default:
        return this.handleGenericEvent(event);
    }
  }

  /**
   * Handle attack launched event
   */
  async handleAttackLaunched(event) {
    const { colonyId, targetId, attackType, forces, reasoning } = event.data;
    
    console.log(`AI Colony ${colonyId} launched ${attackType} attack on ${targetId}`);
    
    // Broadcast to game systems
    this.broadcastToGame('ai_attack_initiated', {
      attacker: colonyId,
      target: targetId,
      attackType: attackType,
      estimatedForces: forces,
      reasoning: reasoning,
      timestamp: event.timestamp
    });
    
    // Log for analytics
    this.logAnalyticsEvent('ai_combat', {
      action: 'attack_launched',
      colonyId: colonyId,
      targetId: targetId,
      attackType: attackType
    });
  }

  /**
   * Handle strategy changed event
   */
  async handleStrategyChanged(event) {
    const { colonyId, oldStrategy, newStrategy, reasoning, adaptationLevel } = event.data;
    
    console.log(`AI Colony ${colonyId} changed strategy from ${oldStrategy} to ${newStrategy}`);
    
    // Update colony behavior systems
    this.updateColonyBehavior(colonyId, newStrategy, adaptationLevel);
    
    // Notify UI systems for strategy indicators
    this.notifyUI('ai_strategy_indicator', {
      colonyId: colonyId,
      strategy: newStrategy,
      adaptationLevel: adaptationLevel,
      visible: adaptationLevel > 0.7 // Only show obvious strategy changes
    });
  }

  /**
   * Handle colony created event
   */
  async handleColonyCreated(event) {
    const { colonyId, position, personality, initialStrategy } = event.data;
    
    console.log(`New AI Colony ${colonyId} created at position ${position.x}, ${position.y}`);
    
    // Initialize colony in game systems
    this.initializeColonyInGame(colonyId, position, personality, initialStrategy);
    
    // Update strategic map
    this.updateStrategicMap('colony_added', {
      colonyId: colonyId,
      position: position,
      personality: personality
    });
  }

  /**
   * Handle colony destroyed event
   */
  async handleColonyDestroyed(event) {
    const { colonyId, destroyedBy, finalResources, duration } = event.data;
    
    console.log(`AI Colony ${colonyId} destroyed by ${destroyedBy}`);
    
    // Clean up colony systems
    this.cleanupColonyInGame(colonyId);
    
    // Award resources to destroyer if applicable
    if (destroyedBy && finalResources) {
      this.awardDestructionRewards(destroyedBy, finalResources);
    }
    
    // Update strategic map
    this.updateStrategicMap('colony_removed', { colonyId: colonyId });
  }

  /**
   * Handle adaptation triggered event
   */
  async handleAdaptationTriggered(event) {
    const { colonyId, playerId, oldBehavior, newBehavior, triggerReason } = event.data;
    
    console.log(`AI Colony ${colonyId} adapted behavior in response to player ${playerId}`);
    
    // Subtle UI hints about adaptation (if noticeable)
    if (event.data.noticeable) {
      this.notifyUI('ai_adaptation_hint', {
        colonyId: colonyId,
        adaptationType: triggerReason,
        intensity: event.data.intensity
      });
    }
    
    // Update player metrics service
    this.updatePlayerMetrics(playerId, 'triggered_ai_adaptation', {
      colonyId: colonyId,
      adaptationType: triggerReason
    });
  }

  /**
   * Handle threat level changed event
   */
  async handleThreatLevelChanged(event) {
    const { colonyId, oldThreatLevel, newThreatLevel, targetId } = event.data;
    
    if (newThreatLevel > oldThreatLevel + 0.2) {
      console.log(`AI Colony ${colonyId} threat level increased to ${newThreatLevel}`);
      
      // Trigger defensive preparations
      this.triggerDefensivePreparations(colonyId, newThreatLevel);
      
      // Warn nearby colonies
      this.alertNearbyColonies(colonyId, 'threat_increase', {
        threatLevel: newThreatLevel,
        targetId: targetId
      });
    }
  }

  /**
   * Handle resource threshold reached event
   */
  async handleResourceThresholdReached(event) {
    const { colonyId, resourceType, threshold, currentAmount, action } = event.data;
    
    console.log(`AI Colony ${colonyId} reached ${threshold} threshold for ${resourceType}`);
    
    // Trigger appropriate response based on threshold type
    switch (threshold) {
      case 'abundance':
        this.triggerResourceAbundanceResponse(colonyId, resourceType, currentAmount);
        break;
      case 'scarcity':
        this.triggerResourceScarcityResponse(colonyId, resourceType, currentAmount);
        break;
      case 'military_ready':
        this.triggerMilitaryReadinessCheck(colonyId);
        break;
    }
  }

  /**
   * Handle alliance formed event
   */
  async handleAllianceFormed(event) {
    const { colonyId, allyId, allianceType, terms } = event.data;
    
    console.log(`AI Colony ${colonyId} formed ${allianceType} alliance with ${allyId}`);
    
    // Update diplomatic systems
    this.updateDiplomaticRelations(colonyId, allyId, allianceType, terms);
    
    // Coordinate allied strategies
    this.coordinateAlliedStrategies(colonyId, allyId, allianceType);
  }

  /**
   * Handle alliance broken event
   */
  async handleAllianceBroken(event) {
    const { colonyId, formerAllyId, reason, betrayal } = event.data;
    
    console.log(`AI Colony ${colonyId} broke alliance with ${formerAllyId}: ${reason}`);
    
    // Update diplomatic relations
    this.updateDiplomaticRelations(colonyId, formerAllyId, 'neutral', {});
    
    // Handle betrayal consequences
    if (betrayal) {
      this.handleBetrayalConsequences(colonyId, formerAllyId, reason);
    }
  }

  /**
   * Handle discovery made event
   */
  async handleDiscoveryMade(event) {
    const { colonyId, discoveryType, location, significance } = event.data;
    
    console.log(`AI Colony ${colonyId} made discovery: ${discoveryType} at ${location.x}, ${location.y}`);
    
    // Update colony memory and intelligence
    this.updateColonyIntelligence(colonyId, discoveryType, location, significance);
    
    // Share intelligence with allies if appropriate
    if (significance > 0.7) {
      this.shareIntelligenceWithAllies(colonyId, discoveryType, location);
    }
  }

  /**
   * Handle territory claimed event
   */
  async handleTerritoryClaimed(event) {
    const { colonyId, territory, resources, strategicValue } = event.data;
    
    console.log(`AI Colony ${colonyId} claimed territory with strategic value ${strategicValue}`);
    
    // Update territorial control systems
    this.updateTerritorialControl(colonyId, territory);
    
    // Check for territorial conflicts
    this.checkTerritorialConflicts(colonyId, territory);
  }

  /**
   * Handle unit deployed event
   */
  async handleUnitDeployed(event) {
    const { colonyId, unitType, position, mission, squadSize } = event.data;
    
    // Log deployment for tracking
    this.logUnitDeployment(colonyId, unitType, position, mission, squadSize);
    
    // Update tactical map
    this.updateTacticalMap(colonyId, unitType, position, mission);
  }

  /**
   * Handle building constructed event
   */
  async handleBuildingConstructed(event) {
    const { colonyId, buildingType, position, purpose } = event.data;
    
    console.log(`AI Colony ${colonyId} constructed ${buildingType} for ${purpose}`);
    
    // Update infrastructure tracking
    this.updateInfrastructureTracking(colonyId, buildingType, position, purpose);
    
    // Check for strategic implications
    this.analyzeInfrastructureImplications(colonyId, buildingType, purpose);
  }

  /**
   * Handle research completed event
   */
  async handleResearchCompleted(event) {
    const { colonyId, researchType, benefits, nextResearch } = event.data;
    
    console.log(`AI Colony ${colonyId} completed research: ${researchType}`);
    
    // Apply research benefits
    this.applyResearchBenefits(colonyId, researchType, benefits);
    
    // Update technology tracking
    this.updateTechnologyTracking(colonyId, researchType, benefits);
  }

  /**
   * Handle diplomatic action event
   */
  async handleDiplomaticAction(event) {
    const { colonyId, targetId, action, terms, expectedResponse } = event.data;
    
    console.log(`AI Colony ${colonyId} performed diplomatic action: ${action} with ${targetId}`);
    
    // Process diplomatic action
    this.processDiplomaticAction(colonyId, targetId, action, terms);
    
    // Monitor for response
    this.monitorDiplomaticResponse(colonyId, targetId, action, expectedResponse);
  }

  /**
   * Handle generic events
   */
  async handleGenericEvent(event) {
    console.log(`AI Event: ${event.type}`, event.data);
    
    // Log for analytics
    this.logAnalyticsEvent('ai_generic', {
      eventType: event.type,
      colonyId: event.colonyId,
      data: event.data
    });
  }

  /**
   * Process high priority events immediately
   */
  async processHighPriorityEvent(event) {
    if (event.priority >= this.eventPriorities.critical) {
      console.log(`Processing critical AI event immediately: ${event.type}`);
      await this.handleEvent(event);
    }
  }

  /**
   * Subscribe to specific event types
   */
  subscribe(eventType, callback, subscriberId = null) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    const subscription = {
      id: subscriberId || this.generateEventId(),
      callback: callback,
      subscribedAt: new Date()
    };
    
    this.subscribers.get(eventType).push(subscription);
    return subscription.id;
  }

  /**
   * Unsubscribe from event types
   */
  unsubscribe(eventType, subscriberId) {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      const index = subscribers.findIndex(sub => sub.id === subscriberId);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  /**
   * Notify subscribers of events
   */
  async notifySubscribers(event) {
    const subscribers = this.subscribers.get(event.type) || [];
    
    for (const subscriber of subscribers) {
      try {
        await subscriber.callback(event);
      } catch (error) {
        console.error(`Error notifying subscriber ${subscriber.id}:`, error);
      }
    }
  }

  /**
   * Add event to history
   */
  addToHistory(event) {
    this.eventHistory.push(event);
    
    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history with filters
   */
  getEventHistory(filters = {}) {
    let filteredHistory = [...this.eventHistory];
    
    if (filters.colonyId) {
      filteredHistory = filteredHistory.filter(event => event.colonyId === filters.colonyId);
    }
    
    if (filters.eventType) {
      filteredHistory = filteredHistory.filter(event => event.type === filters.eventType);
    }
    
    if (filters.priority) {
      const priorityLevel = this.eventPriorities[filters.priority];
      filteredHistory = filteredHistory.filter(event => event.priority >= priorityLevel);
    }
    
    if (filters.startTime) {
      filteredHistory = filteredHistory.filter(event => event.timestamp >= filters.startTime);
    }
    
    if (filters.endTime) {
      filteredHistory = filteredHistory.filter(event => event.timestamp <= filters.endTime);
    }
    
    return filteredHistory.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get event statistics
   */
  getEventStatistics() {
    const stats = {
      totalEvents: this.eventHistory.length,
      eventsInQueue: this.eventQueue.length,
      eventsByType: {},
      eventsByPriority: {},
      averageProcessingTime: 0,
      failedEvents: 0
    };

    this.eventHistory.forEach(event => {
      // Count by type
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
      
      // Count by priority
      stats.eventsByPriority[event.priorityLevel] = (stats.eventsByPriority[event.priorityLevel] || 0) + 1;
      
      // Count failures
      if (event.failed) {
        stats.failedEvents++;
      }
    });

    return stats;
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `ai_event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  // Placeholder methods for game system integration
  
  broadcastToGame(eventType, data) {
    // Implementation would broadcast to game systems
    console.log(`Broadcasting to game: ${eventType}`, data);
  }
  
  notifyUI(notificationType, data) {
    // Implementation would send UI notifications
    console.log(`UI Notification: ${notificationType}`, data);
  }
  
  updateColonyBehavior(colonyId, strategy, adaptationLevel) {
    // Implementation would update colony behavior systems
    console.log(`Updating colony ${colonyId} behavior to ${strategy}`);
  }
  
  logAnalyticsEvent(category, data) {
    // Implementation would log to analytics system
    console.log(`Analytics: ${category}`, data);
  }
  
  initializeColonyInGame(colonyId, position, personality, strategy) {
    // Implementation would initialize colony in game world
    console.log(`Initializing colony ${colonyId} in game`);
  }
  
  cleanupColonyInGame(colonyId) {
    // Implementation would clean up colony from game systems
    console.log(`Cleaning up colony ${colonyId} from game`);
  }
  
  updateStrategicMap(action, data) {
    // Implementation would update strategic map display
    console.log(`Strategic map update: ${action}`, data);
  }
  
  triggerDefensivePreparations(colonyId, threatLevel) {
    // Implementation would trigger defensive preparations
    console.log(`Triggering defensive preparations for colony ${colonyId}`);
  }
  
  alertNearbyColonies(colonyId, alertType, data) {
    // Implementation would alert nearby AI colonies
    console.log(`Alerting nearby colonies from ${colonyId}: ${alertType}`);
  }
  
  updateDiplomaticRelations(colonyId, targetId, relationType, terms) {
    // Implementation would update diplomatic systems
    console.log(`Updating diplomatic relations: ${colonyId} -> ${targetId}: ${relationType}`);
  }
  
  updateColonyIntelligence(colonyId, discoveryType, location, significance) {
    // Implementation would update colony intelligence systems
    console.log(`Updating intelligence for colony ${colonyId}: ${discoveryType}`);
  }
  
  updateTerritorialControl(colonyId, territory) {
    // Implementation would update territorial control systems
    console.log(`Updating territorial control for colony ${colonyId}`);
  }
  
  logUnitDeployment(colonyId, unitType, position, mission, squadSize) {
    // Implementation would log unit deployment
    console.log(`Unit deployed from colony ${colonyId}: ${unitType} for ${mission}`);
  }
  
  updateTacticalMap(colonyId, unitType, position, mission) {
    // Implementation would update tactical map
    console.log(`Tactical map update: ${unitType} at ${position.x}, ${position.y}`);
  }
  
  updateInfrastructureTracking(colonyId, buildingType, position, purpose) {
    // Implementation would track infrastructure development
    console.log(`Infrastructure update for colony ${colonyId}: ${buildingType}`);
  }
  
  applyResearchBenefits(colonyId, researchType, benefits) {
    // Implementation would apply research benefits to colony
    console.log(`Applying research benefits to colony ${colonyId}: ${researchType}`);
  }
  
  processDiplomaticAction(colonyId, targetId, action, terms) {
    // Implementation would process diplomatic actions
    console.log(`Processing diplomatic action from ${colonyId} to ${targetId}: ${action}`);
  }
}

module.exports = AIEventService; 
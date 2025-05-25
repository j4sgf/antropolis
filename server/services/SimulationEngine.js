const EventEmitter = require('events');

/**
 * Core simulation engine that drives the ant colony simulation
 * Manages time-based updates, game state, and simulation events
 * Compatible with both browser and Node.js environments
 */
class SimulationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Simulation configuration
    this.config = {
      targetTicksPerSecond: config.targetTicksPerSecond || 30,
      maxDeltaTime: config.maxDeltaTime || 100, // Prevent spiral of death
      timescale: config.timescale || 1.0, // Speed multiplier
      maxTicksPerFrame: config.maxTicksPerFrame || 3,
      ...config
    };
    
    // Simulation state
    this.isRunning = false;
    this.isPaused = false;
    this.lastTick = 0;
    this.accumulator = 0;
    this.currentTick = 0;
    this.tickDuration = 1000 / this.config.targetTicksPerSecond; // ms per tick
    this.frameTimer = null;
    
    // Performance tracking
    this.performanceStats = {
      frameCount: 0,
      lastFpsUpdate: Date.now(),
      currentFps: 0,
      avgTickTime: 0,
      tickTimes: []
    };
    
    // Colonies being simulated
    this.activeColonies = new Map();
    
    // Bind methods to preserve context
    this.gameLoop = this.gameLoop.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    this.setupEventHandlers();
    
    console.log('🐜 SimulationEngine initialized:', {
      targetTPS: this.config.targetTicksPerSecond,
      tickDuration: this.tickDuration,
      timescale: this.config.timescale
    });
  }
  
  /**
   * Set up event handlers for browser visibility changes
   */
  setupEventHandlers() {
    // Handle browser tab visibility changes (browser only)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    // Handle window focus/blur (browser only)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.handleVisibilityChange(true));
      window.addEventListener('blur', () => this.handleVisibilityChange(false));
    }
  }
  
  /**
   * Handle browser tab visibility changes to pause/resume simulation
   */
  handleVisibilityChange(forceFocus = null) {
    const isVisible = forceFocus !== null ? forceFocus : 
      (typeof document !== 'undefined' ? !document.hidden : true);
    
    if (isVisible && this.isRunning && this.isPaused) {
      console.log('🔄 Tab visible - resuming simulation');
      this.resume();
    } else if (!isVisible && this.isRunning && !this.isPaused) {
      console.log('⏸️ Tab hidden - pausing simulation');
      this.pause();
    }
  }
  
  /**
   * Get current timestamp (compatible with both browser and Node.js)
   */
  getNow() {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }
    return Date.now();
  }
  
  /**
   * Schedule the next frame (compatible with both browser and Node.js)
   */
  scheduleNextFrame() {
    if (typeof requestAnimationFrame !== 'undefined') {
      this.frameTimer = requestAnimationFrame(this.gameLoop);
    } else {
      // Node.js fallback using setTimeout
      this.frameTimer = setTimeout(this.gameLoop, 16); // ~60 FPS
    }
  }
  
  /**
   * Clear the scheduled frame
   */
  clearScheduledFrame() {
    if (this.frameTimer) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.frameTimer);
      } else {
        clearTimeout(this.frameTimer);
      }
      this.frameTimer = null;
    }
  }
  
  /**
   * Start the simulation engine
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ SimulationEngine already running');
      return;
    }
    
    console.log('🚀 Starting SimulationEngine...');
    this.isRunning = true;
    this.isPaused = false;
    this.lastTick = this.getNow();
    this.accumulator = 0;
    
    this.emit('simulationStarted');
    this.gameLoop();
    
    return this;
  }
  
  /**
   * Stop the simulation engine
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ SimulationEngine not running');
      return;
    }
    
    console.log('🛑 Stopping SimulationEngine...');
    this.isRunning = false;
    this.isPaused = false;
    
    this.clearScheduledFrame();
    this.emit('simulationStopped');
    
    return this;
  }
  
  /**
   * Pause the simulation
   */
  pause() {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    console.log('⏸️ Pausing simulation...');
    this.isPaused = true;
    this.emit('simulationPaused');
    
    return this;
  }
  
  /**
   * Resume the simulation
   */
  resume() {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    
    console.log('▶️ Resuming simulation...');
    this.isPaused = false;
    this.lastTick = this.getNow(); // Reset time to prevent catch-up
    this.accumulator = 0;
    this.emit('simulationResumed');
    
    return this;
  }
  
  /**
   * Main game loop - runs continuously while simulation is active
   */
  gameLoop() {
    if (!this.isRunning) {
      return;
    }
    
    const currentTime = this.getNow();
    const deltaTime = Math.min(currentTime - this.lastTick, this.config.maxDeltaTime);
    this.lastTick = currentTime;
    
    // Update performance stats
    this.updatePerformanceStats(deltaTime);
    
    if (!this.isPaused) {
      // Accumulate time
      this.accumulator += deltaTime * this.config.timescale;
      
      // Run fixed timestep updates
      let ticksThisFrame = 0;
      while (this.accumulator >= this.tickDuration && ticksThisFrame < this.config.maxTicksPerFrame) {
        const tickStart = this.getNow();
        
        this.update(this.tickDuration);
        this.currentTick++;
        
        this.accumulator -= this.tickDuration;
        ticksThisFrame++;
        
        // Track tick performance
        const tickTime = this.getNow() - tickStart;
        this.performanceStats.tickTimes.push(tickTime);
        if (this.performanceStats.tickTimes.length > 60) {
          this.performanceStats.tickTimes.shift();
        }
      }
    }
    
    // Schedule next frame (browser or Node.js compatible)
    this.scheduleNextFrame();
  }
  
  /**
   * Core simulation update method - called once per simulation tick
   * @param {number} deltaTime - Time since last tick in milliseconds
   */
  update(deltaTime) {
    const tickData = {
      tick: this.currentTick,
      deltaTime,
      timestamp: Date.now()
    };
    
    try {
      // Emit tick start event
      this.emit('tickStart', tickData);
      
      // Update all active colonies
      for (const [colonyId, colony] of this.activeColonies) {
        this.updateColony(colony, deltaTime);
      }
      
      // Emit tick end event
      this.emit('tickEnd', tickData);
      
    } catch (error) {
      console.error('❌ Error during simulation tick:', error);
      this.emit('simulationError', { error, tick: this.currentTick });
    }
  }
  
  /**
   * Update a specific colony during simulation tick
   * @param {Object} colony - Colony object to update
   * @param {number} deltaTime - Time since last tick
   */
  updateColony(colony, deltaTime) {
    // Placeholder for colony update logic
    // This will be expanded in subsequent subtasks
    
    if (colony.update && typeof colony.update === 'function') {
      colony.update(deltaTime);
    }
    
    // Emit colony updated event
    this.emit('colonyUpdated', { 
      colonyId: colony.id, 
      colony, 
      deltaTime,
      tick: this.currentTick 
    });
  }
  
  /**
   * Add a colony to the simulation
   * @param {Object} colony - Colony object to simulate
   */
  addColony(colony) {
    if (!colony || !colony.id) {
      throw new Error('Colony must have an id property');
    }
    
    console.log(`🏰 Adding colony ${colony.id} to simulation`);
    this.activeColonies.set(colony.id, colony);
    this.emit('colonyAdded', { colonyId: colony.id, colony });
    
    return this;
  }
  
  /**
   * Remove a colony from the simulation
   * @param {string} colonyId - ID of colony to remove
   */
  removeColony(colonyId) {
    if (this.activeColonies.has(colonyId)) {
      console.log(`🏚️ Removing colony ${colonyId} from simulation`);
      const colony = this.activeColonies.get(colonyId);
      this.activeColonies.delete(colonyId);
      this.emit('colonyRemoved', { colonyId, colony });
    }
    
    return this;
  }
  
  /**
   * Get current simulation statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentTick: this.currentTick,
      activeColonies: this.activeColonies.size,
      performance: {
        fps: this.performanceStats.currentFps,
        avgTickTime: this.performanceStats.avgTickTime,
        timescale: this.config.timescale
      }
    };
  }
  
  /**
   * Update performance statistics
   * @param {number} deltaTime - Frame delta time
   */
  updatePerformanceStats(deltaTime) {
    const now = Date.now();
    this.performanceStats.frameCount++;
    
    // Update FPS every second
    if (now - this.performanceStats.lastFpsUpdate >= 1000) {
      this.performanceStats.currentFps = this.performanceStats.frameCount;
      this.performanceStats.frameCount = 0;
      this.performanceStats.lastFpsUpdate = now;
      
      // Calculate average tick time
      if (this.performanceStats.tickTimes.length > 0) {
        const sum = this.performanceStats.tickTimes.reduce((a, b) => a + b, 0);
        this.performanceStats.avgTickTime = sum / this.performanceStats.tickTimes.length;
      }
    }
  }
  
  /**
   * Change simulation speed
   * @param {number} timescale - Speed multiplier (1.0 = normal, 2.0 = 2x speed, etc.)
   */
  setTimescale(timescale) {
    timescale = Math.max(0.1, Math.min(10.0, timescale)); // Clamp between 0.1x and 10x
    this.config.timescale = timescale;
    
    console.log(`⚡ Simulation speed changed to ${timescale}x`);
    this.emit('timescaleChanged', { timescale });
    
    return this;
  }
  
  /**
   * Cleanup and destroy the simulation engine
   */
  destroy() {
    this.stop();
    
    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.handleVisibilityChange);
      window.removeEventListener('blur', this.handleVisibilityChange);
    }
    
    // Clear all colonies
    this.activeColonies.clear();
    
    // Remove all event listeners
    this.removeAllListeners();
    
    console.log('🗑️ SimulationEngine destroyed');
  }
}

module.exports = SimulationEngine; 
/**
 * Scout Service for managing ant scouts and their visibility
 * Handles real-time position tracking and fog of war updates
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ScoutService {
  constructor() {
    this.scouts = new Map(); // scoutId -> scout data
    this.activeColony = null;
    this.visibilityUpdateInterval = null;
    this.config = {
      updateInterval: 2000, // Update visibility every 2 seconds
      defaultVisibilityRange: 5,
      scoutTypes: {
        WORKER: { range: 3, speed: 1.0, stamina: 100 },
        SCOUT: { range: 5, speed: 1.5, stamina: 80 },
        SOLDIER: { range: 4, speed: 0.8, stamina: 120 },
        RANGER: { range: 7, speed: 1.2, stamina: 90 }
      }
    };
  }

  /**
   * Initialize scout service for a colony
   */
  async initialize(colonyId) {
    this.activeColony = colonyId;
    this.scouts.clear();
    
    try {
      // Initialize exploration for the colony
      await this.initializeExploration(colonyId);
      
      // Start visibility updates
      this.startVisibilityUpdates();
      
      console.log(`🕵️ Scout service initialized for colony ${colonyId}`);
      return true;
    } catch (error) {
      console.error('Error initializing scout service:', error);
      return false;
    }
  }

  /**
   * Initialize exploration system for colony
   */
  async initializeExploration(colonyId) {
    const response = await fetch(`${API_BASE_URL}/exploration/${colonyId}/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mapWidth: 100,
        mapHeight: 100,
        basePosition: { x: 50, y: 50 } // Default base position
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initialize exploration');
    }

    return await response.json();
  }

  /**
   * Add a scout to the tracking system
   */
  addScout(scoutData) {
    const {
      id,
      x,
      y,
      type = 'WORKER',
      visibilityRange,
      stamina = 100,
      isActive = true
    } = scoutData;

    const scoutType = this.config.scoutTypes[type] || this.config.scoutTypes.WORKER;
    
    const scout = {
      id,
      x,
      y,
      type,
      visibilityRange: visibilityRange || scoutType.range,
      speed: scoutType.speed,
      stamina,
      maxStamina: scoutType.stamina,
      isActive,
      lastUpdate: Date.now(),
      path: [],
      currentTarget: null,
      discoveryHistory: []
    };

    this.scouts.set(id, scout);
    console.log(`🐜 Added scout ${id} at (${x}, ${y}) with range ${scout.visibilityRange}`);
    
    return scout;
  }

  /**
   * Update scout position
   */
  updateScoutPosition(scoutId, x, y) {
    const scout = this.scouts.get(scoutId);
    if (!scout) {
      console.warn(`Scout ${scoutId} not found`);
      return false;
    }

    // Update position
    scout.x = x;
    scout.y = y;
    scout.lastUpdate = Date.now();
    
    // Add to path history
    scout.path.push({ x, y, timestamp: Date.now() });
    
    // Keep path history limited
    if (scout.path.length > 50) {
      scout.path = scout.path.slice(-25);
    }

    this.scouts.set(scoutId, scout);
    return true;
  }

  /**
   * Remove scout from tracking
   */
  removeScout(scoutId) {
    const scout = this.scouts.get(scoutId);
    if (scout) {
      this.scouts.delete(scoutId);
      console.log(`🐜 Removed scout ${scoutId}`);
      return true;
    }
    return false;
  }

  /**
   * Get all active scouts
   */
  getActiveScouts() {
    return Array.from(this.scouts.values()).filter(scout => scout.isActive);
  }

  /**
   * Get scout positions for visibility calculation
   */
  getScoutPositions() {
    return this.getActiveScouts().map(scout => ({
      id: scout.id,
      x: scout.x,
      y: scout.y,
      visibilityRange: scout.visibilityRange,
      type: scout.type
    }));
  }

  /**
   * Start automatic visibility updates
   */
  startVisibilityUpdates() {
    if (this.visibilityUpdateInterval) {
      clearInterval(this.visibilityUpdateInterval);
    }

    this.visibilityUpdateInterval = setInterval(async () => {
      await this.updateVisibility();
    }, this.config.updateInterval);
  }

  /**
   * Stop automatic visibility updates
   */
  stopVisibilityUpdates() {
    if (this.visibilityUpdateInterval) {
      clearInterval(this.visibilityUpdateInterval);
      this.visibilityUpdateInterval = null;
    }
  }

  /**
   * Update visibility based on current scout positions
   */
  async updateVisibility() {
    if (!this.activeColony || this.scouts.size === 0) {
      return;
    }

    try {
      const scoutPositions = this.getScoutPositions();
      
      const response = await fetch(
        `${API_BASE_URL}/exploration/${this.activeColony}/update-scouts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ scoutPositions })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update visibility');
      }

      const result = await response.json();
      
      // Update scout stamina based on movement
      this.updateScoutStamina();
      
      return result.data;
    } catch (error) {
      console.error('Error updating visibility:', error);
      return null;
    }
  }

  /**
   * Update scout stamina based on activity
   */
  updateScoutStamina() {
    this.scouts.forEach((scout, scoutId) => {
      if (!scout.isActive) return;

      // Reduce stamina over time
      const staminaDrain = Math.max(1, Math.floor(scout.speed * 2));
      scout.stamina = Math.max(0, scout.stamina - staminaDrain);

      // Deactivate exhausted scouts
      if (scout.stamina <= 0) {
        scout.isActive = false;
        console.log(`🐜 Scout ${scoutId} exhausted and deactivated`);
      }

      this.scouts.set(scoutId, scout);
    });
  }

  /**
   * Get exploration status for the active colony
   */
  async getExplorationStatus() {
    if (!this.activeColony) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/exploration/${this.activeColony}/status?includeDetails=true`
      );

      if (!response.ok) {
        throw new Error('Failed to get exploration status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting exploration status:', error);
      return null;
    }
  }

  /**
   * Set specific tiles as explored
   */
  async exploreTiles(tiles, discoveryType = null) {
    if (!this.activeColony) {
      return false;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/exploration/${this.activeColony}/explore-tiles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tiles, discoveryType })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to explore tiles');
      }

      return await response.json();
    } catch (error) {
      console.error('Error exploring tiles:', error);
      return false;
    }
  }

  /**
   * Explore an area around a position
   */
  async exploreArea(centerX, centerY, radius = 3, shape = 'circular') {
    if (!this.activeColony) {
      return false;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/exploration/${this.activeColony}/explore-area`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ centerX, centerY, radius, shape })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to explore area');
      }

      return await response.json();
    } catch (error) {
      console.error('Error exploring area:', error);
      return false;
    }
  }

  /**
   * Process memory decay for exploration
   */
  async processMemoryDecay() {
    if (!this.activeColony) {
      return false;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/exploration/${this.activeColony}/process-decay`,
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process memory decay');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing memory decay:', error);
      return false;
    }
  }

  /**
   * Send scout to specific coordinates
   */
  sendScoutTo(scoutId, targetX, targetY) {
    const scout = this.scouts.get(scoutId);
    if (!scout) {
      return false;
    }

    scout.currentTarget = { x: targetX, y: targetY };
    scout.isActive = true;
    
    // Simple pathfinding - move directly toward target
    const dx = targetX - scout.x;
    const dy = targetY - scout.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const moveX = scout.x + (dx / distance) * scout.speed;
      const moveY = scout.y + (dy / distance) * scout.speed;
      
      this.updateScoutPosition(scoutId, moveX, moveY);
    }

    return true;
  }

  /**
   * Get scout by ID
   */
  getScout(scoutId) {
    return this.scouts.get(scoutId);
  }

  /**
   * Get all scouts data
   */
  getAllScouts() {
    return Array.from(this.scouts.values());
  }

  /**
   * Cleanup and shutdown
   */
  shutdown() {
    this.stopVisibilityUpdates();
    this.scouts.clear();
    this.activeColony = null;
    console.log('🕵️ Scout service shut down');
  }
}

// Create singleton instance
const scoutService = new ScoutService();

export default scoutService; 
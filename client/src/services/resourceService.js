const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Resource Service - Handles all resource-related API calls
 * Including storage, events, conversions, and foraging
 */
class ResourceService {
  
  // ===== BASIC RESOURCE OPERATIONS =====
  
  /**
   * Get resource types configuration
   */
  async getResourceTypes() {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/types`);
      if (!response.ok) throw new Error('Failed to fetch resource types');
      return await response.json();
    } catch (error) {
      console.error('Error fetching resource types:', error);
      throw error;
    }
  }

  /**
   * Get colony storage summary
   */
  async getColonyStorage(colonyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/storage`);
      if (!response.ok) throw new Error('Failed to fetch colony storage');
      return await response.json();
    } catch (error) {
      console.error('Error fetching colony storage:', error);
      throw error;
    }
  }

  /**
   * Get colony resources with optional filtering
   */
  async getColonyResources(colonyId, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.zone) params.append('zone', filters.zone);
      
      const url = `${API_BASE_URL}/resources/colony/${colonyId}${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch colony resources');
      return await response.json();
    } catch (error) {
      console.error('Error fetching colony resources:', error);
      throw error;
    }
  }

  /**
   * Add resources to colony storage
   */
  async addResourcesToColony(colonyId, resourceData) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resourceData)
      });
      if (!response.ok) throw new Error('Failed to add resources');
      return await response.json();
    } catch (error) {
      console.error('Error adding resources:', error);
      throw error;
    }
  }

  /**
   * Transfer resources between storage zones
   */
  async transferResources(colonyId, transferData) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData)
      });
      if (!response.ok) throw new Error('Failed to transfer resources');
      return await response.json();
    } catch (error) {
      console.error('Error transferring resources:', error);
      throw error;
    }
  }

  /**
   * Reserve resources for tasks
   */
  async reserveResources(colonyId, reservationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });
      if (!response.ok) throw new Error('Failed to reserve resources');
      return await response.json();
    } catch (error) {
      console.error('Error reserving resources:', error);
      throw error;
    }
  }

  // ===== RESOURCE CONVERSIONS =====

  /**
   * Get available conversion recipes
   */
  async getConversionRecipes() {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/conversions/recipes`);
      if (!response.ok) throw new Error('Failed to fetch conversion recipes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversion recipes:', error);
      throw error;
    }
  }

  /**
   * Start a resource conversion
   */
  async startConversion(colonyId, conversionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/conversions/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversionData)
      });
      if (!response.ok) throw new Error('Failed to start conversion');
      return await response.json();
    } catch (error) {
      console.error('Error starting conversion:', error);
      throw error;
    }
  }

  /**
   * Get active conversions for a colony
   */
  async getActiveConversions(colonyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/conversions/active`);
      if (!response.ok) throw new Error('Failed to fetch active conversions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching active conversions:', error);
      throw error;
    }
  }

  // ===== RANDOM EVENTS =====

  /**
   * Get random event types
   */
  async getRandomEventTypes() {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/events/types`);
      if (!response.ok) throw new Error('Failed to fetch event types');
      return await response.json();
    } catch (error) {
      console.error('Error fetching event types:', error);
      throw error;
    }
  }

  /**
   * Get active events for a colony
   */
  async getActiveEvents(colonyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/events/active`);
      if (!response.ok) throw new Error('Failed to fetch active events');
      return await response.json();
    } catch (error) {
      console.error('Error fetching active events:', error);
      throw error;
    }
  }

  /**
   * Trigger a random event manually (for testing)
   */
  async triggerRandomEvent(colonyId, eventType) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/events/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType })
      });
      if (!response.ok) throw new Error('Failed to trigger event');
      return await response.json();
    } catch (error) {
      console.error('Error triggering event:', error);
      throw error;
    }
  }

  /**
   * Get event statistics
   */
  async getEventStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/events/stats`);
      if (!response.ok) throw new Error('Failed to fetch event stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching event stats:', error);
      throw error;
    }
  }

  // ===== MAP RESOURCES =====

  /**
   * Get map resources in a specific area
   */
  async getMapResources(x, y, radius = 50) {
    try {
      const params = new URLSearchParams({ x, y, radius });
      const response = await fetch(`${API_BASE_URL}/resources/map?${params}`);
      if (!response.ok) throw new Error('Failed to fetch map resources');
      return await response.json();
    } catch (error) {
      console.error('Error fetching map resources:', error);
      throw error;
    }
  }

  /**
   * Harvest a map resource
   */
  async harvestMapResource(resourceId, harvestData) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/map/${resourceId}/harvest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(harvestData)
      });
      if (!response.ok) throw new Error('Failed to harvest resource');
      return await response.json();
    } catch (error) {
      console.error('Error harvesting resource:', error);
      throw error;
    }
  }

  /**
   * Generate new map resources
   */
  async generateMapResources(generationData) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/map/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationData)
      });
      if (!response.ok) throw new Error('Failed to generate resources');
      return await response.json();
    } catch (error) {
      console.error('Error generating resources:', error);
      throw error;
    }
  }

  // ===== RESOURCE DECAY =====

  /**
   * Process resource decay for a colony
   */
  async processResourceDecay(colonyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/decay`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to process decay');
      return await response.json();
    } catch (error) {
      console.error('Error processing decay:', error);
      throw error;
    }
  }

  /**
   * Force decay processing (for testing)
   */
  async forceDecayProcessing(colonyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/decay/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      if (!response.ok) throw new Error('Failed to force decay processing');
      return await response.json();
    } catch (error) {
      console.error('Error forcing decay processing:', error);
      throw error;
    }
  }

  // ===== SIMULATION =====

  /**
   * Simulate resource events for testing
   */
  async simulateEvents(colonyId, duration = 60) {
    try {
      const response = await fetch(`${API_BASE_URL}/resources/colony/${colonyId}/events/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      });
      if (!response.ok) throw new Error('Failed to simulate events');
      return await response.json();
    } catch (error) {
      console.error('Error simulating events:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ResourceService(); 
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ColonyService {
  // Create a new colony
  async createColony(colonyData) {
    try {
      const endpoint = '/colonies';
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(colonyData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create colony');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating colony:', error);
      throw error;
    }
  }

  // Get all colonies for a user
  async getColonies(userId) {
    try {
      const endpoint = `/colonies?user_id=${userId}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch colonies');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching colonies:', error);
      throw error;
    }
  }

  // Get a specific colony with details
  async getColony(colonyId, includeDetails = false) {
    try {
      const endpoint = `/colonies/${colonyId}${includeDetails ? '?details=true' : ''}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch colony');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching colony:', error);
      throw error;
    }
  }

  // Update a colony
  async updateColony(colonyId, updateData) {
    try {
      const endpoint = `/colonies/${colonyId}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update colony');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating colony:', error);
      throw error;
    }
  }

  // Delete a colony
  async deleteColony(colonyId) {
    try {
      const endpoint = `/colonies/${colonyId}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete colony');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting colony:', error);
      throw error;
    }
  }

  // Get colony ants
  async getColonyAnts(colonyId, filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const endpoint = `/colonies/${colonyId}/ants?${params}`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch colony ants');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching colony ants:', error);
      throw error;
    }
  }

  // Get ant statistics for a colony
  async getColonyAntStats(colonyId) {
    try {
      const endpoint = `/colonies/${colonyId}/ants/stats`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch ant statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ant statistics:', error);
      throw error;
    }
  }

  // Simulate a colony tick
  async simulateColonyTick(colonyId) {
    try {
      const endpoint = `/colonies/${colonyId}/tick`;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to simulate colony tick');
      }

      return await response.json();
    } catch (error) {
      console.error('Error simulating colony tick:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new ColonyService(); 
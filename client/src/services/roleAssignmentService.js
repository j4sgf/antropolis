/**
 * Role Assignment Service
 * Handles API communication for ant role management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class RoleAssignmentService {
  constructor() {
    this.activeRequests = new Map();
    this.cache = new Map();
  }

  /**
   * Update role for a single ant
   * @param {string} colonyId - Colony ID
   * @param {string} antId - Ant ID
   * @param {string} newRole - New role to assign
   * @returns {Promise<Object>} Response data
   */
  async updateAntRole(colonyId, antId, newRole) {
    const endpoint = `/api/ants/${antId}/role`;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colonyId,
          role: newRole
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update ant role: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Invalidate cache for this colony
      this.invalidateColonyCache(colonyId);
      
      return data;
    } catch (error) {
      console.error('Error updating ant role:', error);
      throw error;
    }
  }

  /**
   * Update roles for multiple ants (batch assignment)
   * @param {string} colonyId - Colony ID
   * @param {Array<string>} antIds - Array of ant IDs
   * @param {string} newRole - New role to assign
   * @returns {Promise<Object>} Response data
   */
  async batchUpdateAntRoles(colonyId, antIds, newRole) {
    const endpoint = '/api/ants/batch-assign';
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colonyId,
          antIds,
          role: newRole
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to batch update ant roles: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Invalidate cache for this colony
      this.invalidateColonyCache(colonyId);
      
      return data;
    } catch (error) {
      console.error('Error batch updating ant roles:', error);
      throw error;
    }
  }

  /**
   * Get all ants for a colony with their current roles
   * @param {string} colonyId - Colony ID
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Array>} Array of ant objects
   */
  async getColonyAnts(colonyId, useCache = true) {
    const cacheKey = `colony_ants_${colonyId}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.data;
      }
    }

    const endpoint = `/api/colonies/${colonyId}/ants`;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch colony ants: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: data.ants || [],
        timestamp: Date.now()
      });
      
      return data.ants || [];
    } catch (error) {
      console.error('Error fetching colony ants:', error);
      throw error;
    }
  }

  /**
   * Get detailed statistics for a specific ant
   * @param {string} antId - Ant ID
   * @returns {Promise<Object>} Ant statistics
   */
  async getAntStatistics(antId) {
    const endpoint = `/api/ants/${antId}/stats`;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ant statistics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.stats || {};
    } catch (error) {
      console.error('Error fetching ant statistics:', error);
      throw error;
    }
  }

  /**
   * Get role distribution for a colony
   * @param {string} colonyId - Colony ID
   * @returns {Promise<Object>} Role distribution data
   */
  async getRoleDistribution(colonyId) {
    const endpoint = `/api/colonies/${colonyId}/role-distribution`;
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🔗 Making role distribution request:', {
      colonyId,
      url,
      baseUrl: API_BASE_URL,
      endpoint
    });
    
    try {
      const response = await fetch(url);
      
      console.log('📡 Role distribution response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch role distribution: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Role distribution data:', data);
      return data.distribution || {};
    } catch (error) {
      console.error('❌ Error fetching role distribution:', error);
      throw error;
    }
  }

  /**
   * Validate role assignment
   * @param {string} colonyId - Colony ID
   * @param {Array<string>} antIds - Ant IDs to reassign
   * @param {string} newRole - New role to assign
   * @returns {Promise<Object>} Validation result
   */
  async validateRoleAssignment(colonyId, antIds, newRole) {
    const endpoint = '/api/ants/validate-assignment';
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colonyId,
          antIds,
          role: newRole
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to validate role assignment: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error validating role assignment:', error);
      throw error;
    }
  }

  /**
   * Get role recommendations based on colony state
   * @param {string} colonyId - Colony ID
   * @returns {Promise<Object>} Role recommendations
   */
  async getRoleRecommendations(colonyId) {
    const endpoint = `/api/colonies/${colonyId}/role-recommendations`;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch role recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      return data.recommendations || {};
    } catch (error) {
      console.error('Error fetching role recommendations:', error);
      return {}; // Return empty object on error for graceful degradation
    }
  }

  /**
   * Invalidate cache for a specific colony
   * @param {string} colonyId - Colony ID
   */
  invalidateColonyCache(colonyId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(colonyId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Cancel ongoing requests
   */
  cancelRequests() {
    this.activeRequests.clear();
  }

  /**
   * Generate mock data for development/testing
   * @param {string} colonyId - Colony ID
   * @returns {Array} Mock ant data
   */
  generateMockAnts(colonyId) {
    const roles = ['worker', 'soldier', 'scout', 'nurse', 'builder', 'forager'];
    const mockAnts = [];

    for (let i = 1; i <= 50; i++) {
      const randomRole = roles[Math.floor(Math.random() * roles.length)];
      mockAnts.push({
        id: `ant_${colonyId}_${i}`,
        colonyId,
        role: randomRole,
        experience: Math.floor(Math.random() * 100),
        efficiency: Math.floor(Math.random() * 100),
        health: Math.floor(Math.random() * 100),
        status: Math.random() > 0.2 ? 'active' : 'idle',
        assignedAt: Date.now() - Math.floor(Math.random() * 86400000), // Random time in last 24h
        tasks: Math.floor(Math.random() * 10),
        successRate: Math.floor(Math.random() * 100)
      });
    }

    return mockAnts;
  }

  /**
   * Check if running in development mode
   * @returns {boolean} Whether in development mode
   */
  isDevelopment() {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  }
}

// Create singleton instance
const roleAssignmentService = new RoleAssignmentService();

export default roleAssignmentService;

// Export role validation utilities
export const ROLE_TYPES = {
  WORKER: 'worker',
  SOLDIER: 'soldier',
  SCOUT: 'scout',
  NURSE: 'nurse',
  BUILDER: 'builder',
  FORAGER: 'forager'
};

export const ROLE_CATEGORIES = {
  WORKER: {
    name: 'Worker',
    description: 'General colony maintenance and basic tasks',
    subRoles: ['general', 'maintenance'],
    color: 'amber'
  },
  SOLDIER: {
    name: 'Soldier',
    description: 'Defense and combat specialists',
    subRoles: ['guard', 'fighter'],
    color: 'red'
  },
  SCOUT: {
    name: 'Scout',
    description: 'Exploration and threat detection',
    subRoles: ['explorer', 'detector'],
    color: 'blue'
  },
  NURSE: {
    name: 'Nurse',
    description: 'Larvae care and colony health',
    subRoles: ['caretaker', 'healer'],
    color: 'green'
  },
  BUILDER: {
    name: 'Builder',
    description: 'Construction and infrastructure',
    subRoles: ['architect', 'constructor'],
    color: 'orange'
  },
  FORAGER: {
    name: 'Forager',
    description: 'Resource gathering and collection',
    subRoles: ['gatherer', 'collector'],
    color: 'yellow'
  }
};

/**
 * Validate role assignment based on colony constraints
 * @param {Object} colony - Colony data
 * @param {Array} antIds - Ant IDs to reassign
 * @param {string} newRole - New role to assign
 * @returns {Object} Validation result
 */
export function validateRoleChange(colony, antIds, newRole) {
  if (!colony || !antIds || !newRole) {
    return { valid: false, reason: 'Missing required parameters' };
  }

  if (!ROLE_TYPES[newRole.toUpperCase()]) {
    return { valid: false, reason: 'Invalid role type' };
  }

  // Basic validation - can be expanded with more complex rules
  if (antIds.length === 0) {
    return { valid: false, reason: 'No ants selected' };
  }

  return { valid: true };
} 
const { ColonyState, AntRoles } = require('../services/ColonyState');
const SimulationEventSystem = require('../services/SimulationEventSystem');

/**
 * Ant Controller
 * Handles ant-related API endpoints including role management
 */
class AntController {
  constructor() {
    this.eventSystem = SimulationEventSystem;
  }

  /**
   * Get all ants for a colony
   * GET /api/colonies/:colonyId/ants
   */
  async getColonyAnts(req, res) {
    try {
      const { colonyId } = req.params;
      
      // For development, generate mock data
      if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL) {
        const mockAnts = this.generateMockAnts(colonyId);
        return res.json({
          success: true,
          ants: mockAnts,
          count: mockAnts.length
        });
      }

      // TODO: Implement real database queries
      res.json({
        success: true,
        ants: [],
        count: 0
      });
    } catch (error) {
      console.error('Error fetching colony ants:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch colony ants'
      });
    }
  }

  /**
   * Update role for a single ant
   * PUT /api/ants/:antId/role
   */
  async updateAntRole(req, res) {
    try {
      const { antId } = req.params;
      const { colonyId, role } = req.body;

      if (!colonyId || !role) {
        return res.status(400).json({
          success: false,
          error: 'Colony ID and role are required'
        });
      }

      if (!Object.values(AntRoles).includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role specified'
        });
      }

      // For development, simulate the role update
      if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL) {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));

        // Emit role change event
        this.eventSystem.emit('ant:role_changed', {
          antId,
          colonyId,
          oldRole: 'unknown',
          newRole: role,
          timestamp: Date.now()
        });

        return res.json({
          success: true,
          message: 'Ant role updated successfully',
          data: {
            antId,
            newRole: role,
            updatedAt: new Date().toISOString()
          }
        });
      }

      // TODO: Implement real database update
      res.json({
        success: true,
        message: 'Ant role updated successfully',
        data: { antId, newRole: role }
      });
    } catch (error) {
      console.error('Error updating ant role:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update ant role'
      });
    }
  }

  /**
   * Batch update roles for multiple ants
   * PUT /api/ants/batch-assign
   */
  async batchUpdateAntRoles(req, res) {
    try {
      const { colonyId, antIds, role } = req.body;

      if (!colonyId || !antIds || !Array.isArray(antIds) || !role) {
        return res.status(400).json({
          success: false,
          error: 'Colony ID, ant IDs array, and role are required'
        });
      }

      if (!Object.values(AntRoles).includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role specified'
        });
      }

      // For development, simulate batch update
      if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL) {
        // Simulate processing time based on number of ants
        await new Promise(resolve => setTimeout(resolve, antIds.length * 10));

        // Emit batch role change event
        this.eventSystem.emit('ants:batch_role_changed', {
          colonyId,
          antIds,
          newRole: role,
          count: antIds.length,
          timestamp: Date.now()
        });

        return res.json({
          success: true,
          message: `Successfully updated roles for ${antIds.length} ants`,
          data: {
            updatedCount: antIds.length,
            newRole: role,
            updatedAt: new Date().toISOString()
          }
        });
      }

      // TODO: Implement real batch database update
      res.json({
        success: true,
        message: `Successfully updated roles for ${antIds.length} ants`,
        data: { updatedCount: antIds.length, newRole: role }
      });
    } catch (error) {
      console.error('Error batch updating ant roles:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to batch update ant roles'
      });
    }
  }

  /**
   * Get detailed statistics for a specific ant
   * GET /api/ants/:antId/stats
   */
  async getAntStatistics(req, res) {
    try {
      const { antId } = req.params;

      // For development, generate mock statistics
      if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL) {
        const mockStats = this.generateMockAntStats(antId);
        return res.json({
          success: true,
          stats: mockStats
        });
      }

      // TODO: Implement real statistics query
      res.json({
        success: true,
        stats: {}
      });
    } catch (error) {
      console.error('Error fetching ant statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch ant statistics'
      });
    }
  }

  /**
   * Get role distribution for a colony
   * GET /api/colonies/:colonyId/role-distribution
   */
  async getRoleDistribution(req, res) {
    try {
      const { colonyId } = req.params;

      // For development, generate mock distribution
      if (process.env.NODE_ENV === 'development' || !process.env.SUPABASE_URL) {
        const distribution = {
          worker: Math.floor(Math.random() * 20) + 15,
          soldier: Math.floor(Math.random() * 10) + 5,
          scout: Math.floor(Math.random() * 5) + 2,
          nurse: Math.floor(Math.random() * 8) + 3,
          builder: Math.floor(Math.random() * 6) + 2,
          forager: Math.floor(Math.random() * 12) + 8
        };

        return res.json({
          success: true,
          distribution,
          total: Object.values(distribution).reduce((sum, count) => sum + count, 0)
        });
      }

      // TODO: Implement real distribution query
      res.json({
        success: true,
        distribution: {},
        total: 0
      });
    } catch (error) {
      console.error('Error fetching role distribution:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch role distribution'
      });
    }
  }

  /**
   * Validate role assignment
   * POST /api/ants/validate-assignment
   */
  async validateRoleAssignment(req, res) {
    try {
      const { colonyId, antIds, role } = req.body;

      if (!colonyId || !antIds || !role) {
        return res.status(400).json({
          success: false,
          error: 'Colony ID, ant IDs, and role are required'
        });
      }

      // Basic validation
      const validationResult = {
        valid: true,
        warnings: [],
        recommendations: []
      };

      // Check if role is valid
      if (!Object.values(AntRoles).includes(role)) {
        validationResult.valid = false;
        validationResult.warnings.push('Invalid role specified');
      }

      // Check ant count limits (example logic)
      if (antIds.length > 20) {
        validationResult.warnings.push('Large batch assignment may impact colony performance');
      }

      // Add role-specific recommendations
      if (role === AntRoles.SOLDIER && antIds.length > 10) {
        validationResult.recommendations.push('Consider gradual assignment to maintain worker productivity');
      }

      res.json({
        success: true,
        validation: validationResult
      });
    } catch (error) {
      console.error('Error validating role assignment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate role assignment'
      });
    }
  }

  /**
   * Get role recommendations based on colony state
   * GET /api/colonies/:colonyId/role-recommendations
   */
  async getRoleRecommendations(req, res) {
    try {
      const { colonyId } = req.params;

      // Generate mock recommendations
      const recommendations = {
        urgent: [],
        suggested: [],
        optimal: {
          worker: 40,
          soldier: 15,
          scout: 8,
          nurse: 12,
          builder: 10,
          forager: 15
        }
      };

      // Add some sample recommendations
      if (Math.random() > 0.5) {
        recommendations.urgent.push({
          type: 'increase',
          role: 'scout',
          reason: 'Low exploration coverage detected',
          impact: 'high'
        });
      }

      if (Math.random() > 0.3) {
        recommendations.suggested.push({
          type: 'rebalance',
          from: 'worker',
          to: 'soldier',
          reason: 'Increased threat level in surrounding area',
          impact: 'medium'
        });
      }

      res.json({
        success: true,
        recommendations
      });
    } catch (error) {
      console.error('Error fetching role recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch role recommendations'
      });
    }
  }

  /**
   * Generate mock ant data for development
   * @param {string} colonyId - Colony ID
   * @returns {Array} Mock ant data
   */
  generateMockAnts(colonyId) {
    const roles = Object.values(AntRoles);
    const statuses = ['active', 'idle', 'working', 'resting'];
    const mockAnts = [];

    const antCounts = {
      [AntRoles.WORKER]: 15,
      [AntRoles.SOLDIER]: 5,
      [AntRoles.SCOUT]: 3,
      [AntRoles.NURSE]: 4,
      [AntRoles.BUILDER]: 3,
      [AntRoles.FORAGER]: 8
    };

    let antId = 1;
    Object.entries(antCounts).forEach(([role, count]) => {
      for (let i = 0; i < count; i++) {
        mockAnts.push({
          id: `${colonyId}_ant_${antId}`,
          colonyId,
          role,
          name: `Ant #${antId}`,
          experience: Math.floor(Math.random() * 100),
          efficiency: Math.floor(Math.random() * 40) + 60, // 60-100%
          health: Math.floor(Math.random() * 30) + 70, // 70-100%
          status: statuses[Math.floor(Math.random() * statuses.length)],
          assignedAt: Date.now() - Math.floor(Math.random() * 86400000), // Random time in last 24h
          tasks: Math.floor(Math.random() * 10),
          successRate: Math.floor(Math.random() * 40) + 60, // 60-100%
          energy: Math.floor(Math.random() * 50) + 50, // 50-100%
          lastActive: Date.now() - Math.floor(Math.random() * 3600000) // Random time in last hour
        });
        antId++;
      }
    });

    return mockAnts;
  }

  /**
   * Generate mock ant statistics
   * @param {string} antId - Ant ID
   * @returns {Object} Mock ant statistics
   */
  generateMockAntStats(antId) {
    return {
      antId,
      experience: Math.floor(Math.random() * 100),
      efficiency: Math.floor(Math.random() * 40) + 60,
      health: Math.floor(Math.random() * 30) + 70,
      energy: Math.floor(Math.random() * 50) + 50,
      tasksCompleted: Math.floor(Math.random() * 100) + 20,
      successRate: Math.floor(Math.random() * 40) + 60,
      timeActive: Math.floor(Math.random() * 86400000), // Random time in milliseconds
      skillLevels: {
        strength: Math.floor(Math.random() * 50) + 25,
        speed: Math.floor(Math.random() * 50) + 25,
        intelligence: Math.floor(Math.random() * 50) + 25,
        endurance: Math.floor(Math.random() * 50) + 25
      },
      achievements: [
        'First Assignment',
        'Task Master',
        'Team Player'
      ].slice(0, Math.floor(Math.random() * 3) + 1),
      recentActivities: [
        { action: 'Completed foraging task', timestamp: Date.now() - 3600000 },
        { action: 'Assigned new role', timestamp: Date.now() - 7200000 },
        { action: 'Resource collected', timestamp: Date.now() - 10800000 }
      ].slice(0, Math.floor(Math.random() * 3) + 1)
    };
  }
}

module.exports = new AntController(); 
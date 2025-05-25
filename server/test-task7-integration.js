/**
 * Task 7 Integration Tests
 * Tests for Ant Role Assignment and Management API endpoints
 */

const request = require('supertest');
const express = require('express');
const antController = require('./controllers/antController');

// Create test app
const app = express();
app.use(express.json());

// Add routes
app.get('/api/colonies/:colonyId/ants', antController.getColonyAnts);
app.put('/api/ants/:antId/role', antController.updateAntRole);
app.put('/api/ants/batch-assign', antController.batchUpdateAntRoles);
app.get('/api/ants/:antId/stats', antController.getAntStatistics);
app.get('/api/colonies/:colonyId/role-distribution', antController.getRoleDistribution);
app.post('/api/ants/validate-assignment', antController.validateRoleAssignment);
app.get('/api/colonies/:colonyId/role-recommendations', antController.getRoleRecommendations);

describe('Task 7: Ant Role Assignment API Integration Tests', () => {
  const testColonyId = 'test-colony-123';
  const testAntId = 'test-ant-456';

  beforeAll(() => {
    // Set development mode for testing
    process.env.NODE_ENV = 'development';
  });

  afterAll(() => {
    // Clean up
    delete process.env.NODE_ENV;
  });

  describe('GET /api/colonies/:colonyId/ants', () => {
    test('should return colony ants successfully', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/ants`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('ants');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.ants)).toBe(true);
    });

    test('should return mock data with correct structure', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/ants`)
        .expect(200);

      const { ants } = response.body;
      expect(ants.length).toBeGreaterThan(0);

      // Check first ant structure
      const firstAnt = ants[0];
      expect(firstAnt).toHaveProperty('id');
      expect(firstAnt).toHaveProperty('colonyId', testColonyId);
      expect(firstAnt).toHaveProperty('role');
      expect(firstAnt).toHaveProperty('name');
      expect(firstAnt).toHaveProperty('experience');
      expect(firstAnt).toHaveProperty('efficiency');
      expect(firstAnt).toHaveProperty('health');
      expect(firstAnt).toHaveProperty('status');
    });

    test('should return ants with valid roles', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/ants`)
        .expect(200);

      const validRoles = ['worker', 'soldier', 'scout', 'nurse', 'builder', 'forager'];
      const { ants } = response.body;

      ants.forEach(ant => {
        expect(validRoles).toContain(ant.role);
      });
    });

    test('should return ants with realistic stat ranges', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/ants`)
        .expect(200);

      const { ants } = response.body;

      ants.forEach(ant => {
        expect(ant.experience).toBeGreaterThanOrEqual(0);
        expect(ant.experience).toBeLessThanOrEqual(100);
        expect(ant.efficiency).toBeGreaterThanOrEqual(60);
        expect(ant.efficiency).toBeLessThanOrEqual(100);
        expect(ant.health).toBeGreaterThanOrEqual(70);
        expect(ant.health).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('PUT /api/ants/:antId/role', () => {
    test('should update ant role successfully', async () => {
      const updateData = {
        colonyId: testColonyId,
        role: 'soldier'
      };

      const response = await request(app)
        .put(`/api/ants/${testAntId}/role`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Ant role updated successfully');
      expect(response.body.data).toHaveProperty('antId', testAntId);
      expect(response.body.data).toHaveProperty('newRole', 'soldier');
    });

    test('should reject invalid role', async () => {
      const updateData = {
        colonyId: testColonyId,
        role: 'invalid-role'
      };

      const response = await request(app)
        .put(`/api/ants/${testAntId}/role`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Invalid role specified');
    });

    test('should reject missing colony ID', async () => {
      const updateData = {
        role: 'soldier'
      };

      const response = await request(app)
        .put(`/api/ants/${testAntId}/role`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Colony ID and role are required');
    });

    test('should reject missing role', async () => {
      const updateData = {
        colonyId: testColonyId
      };

      const response = await request(app)
        .put(`/api/ants/${testAntId}/role`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Colony ID and role are required');
    });

    test('should accept all valid roles', async () => {
      const validRoles = ['worker', 'soldier', 'scout', 'nurse', 'builder', 'forager'];

      for (const role of validRoles) {
        const updateData = {
          colonyId: testColonyId,
          role: role
        };

        const response = await request(app)
          .put(`/api/ants/${testAntId}/role`)
          .send(updateData)
          .expect(200);

        expect(response.body.data.newRole).toBe(role);
      }
    });
  });

  describe('PUT /api/ants/batch-assign', () => {
    test('should batch update ant roles successfully', async () => {
      const updateData = {
        colonyId: testColonyId,
        antIds: ['ant1', 'ant2', 'ant3'],
        role: 'scout'
      };

      const response = await request(app)
        .put('/api/ants/batch-assign')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Successfully updated roles for 3 ants');
      expect(response.body.data).toHaveProperty('updatedCount', 3);
      expect(response.body.data).toHaveProperty('newRole', 'scout');
    });

    test('should reject missing required fields', async () => {
      const updateData = {
        colonyId: testColonyId,
        role: 'soldier'
        // Missing antIds
      };

      const response = await request(app)
        .put('/api/ants/batch-assign')
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('ant IDs array');
    });

    test('should reject invalid antIds format', async () => {
      const updateData = {
        colonyId: testColonyId,
        antIds: 'not-an-array',
        role: 'soldier'
      };

      const response = await request(app)
        .put('/api/ants/batch-assign')
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('ant IDs array');
    });

    test('should handle large batch updates', async () => {
      const largeAntIds = Array.from({ length: 25 }, (_, i) => `ant${i + 1}`);
      const updateData = {
        colonyId: testColonyId,
        antIds: largeAntIds,
        role: 'worker'
      };

      const response = await request(app)
        .put('/api/ants/batch-assign')
        .send(updateData)
        .expect(200);

      expect(response.body.data.updatedCount).toBe(25);
    });
  });

  describe('GET /api/ants/:antId/stats', () => {
    test('should return ant statistics successfully', async () => {
      const response = await request(app)
        .get(`/api/ants/${testAntId}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('stats');

      const { stats } = response.body;
      expect(stats).toHaveProperty('antId', testAntId);
      expect(stats).toHaveProperty('experience');
      expect(stats).toHaveProperty('efficiency');
      expect(stats).toHaveProperty('health');
      expect(stats).toHaveProperty('energy');
      expect(stats).toHaveProperty('tasksCompleted');
      expect(stats).toHaveProperty('successRate');
    });

    test('should return detailed skill levels', async () => {
      const response = await request(app)
        .get(`/api/ants/${testAntId}/stats`)
        .expect(200);

      const { stats } = response.body;
      expect(stats).toHaveProperty('skillLevels');
      expect(stats.skillLevels).toHaveProperty('strength');
      expect(stats.skillLevels).toHaveProperty('speed');
      expect(stats.skillLevels).toHaveProperty('intelligence');
      expect(stats.skillLevels).toHaveProperty('endurance');
    });

    test('should return achievements and activities', async () => {
      const response = await request(app)
        .get(`/api/ants/${testAntId}/stats`)
        .expect(200);

      const { stats } = response.body;
      expect(stats).toHaveProperty('achievements');
      expect(stats).toHaveProperty('recentActivities');
      expect(Array.isArray(stats.achievements)).toBe(true);
      expect(Array.isArray(stats.recentActivities)).toBe(true);
    });
  });

  describe('GET /api/colonies/:colonyId/role-distribution', () => {
    test('should return role distribution successfully', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/role-distribution`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('distribution');
      expect(response.body).toHaveProperty('total');

      const { distribution } = response.body;
      expect(distribution).toHaveProperty('worker');
      expect(distribution).toHaveProperty('soldier');
      expect(distribution).toHaveProperty('scout');
      expect(distribution).toHaveProperty('nurse');
      expect(distribution).toHaveProperty('builder');
      expect(distribution).toHaveProperty('forager');
    });

    test('should return valid counts', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/role-distribution`)
        .expect(200);

      const { distribution, total } = response.body;
      
      // All counts should be non-negative
      Object.values(distribution).forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(count)).toBe(true);
      });

      // Total should match sum of individual counts
      const calculatedTotal = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      expect(total).toBe(calculatedTotal);
    });
  });

  describe('POST /api/ants/validate-assignment', () => {
    test('should validate assignment successfully', async () => {
      const validationData = {
        colonyId: testColonyId,
        antIds: ['ant1', 'ant2'],
        role: 'soldier'
      };

      const response = await request(app)
        .post('/api/ants/validate-assignment')
        .send(validationData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('validation');

      const { validation } = response.body;
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('warnings');
      expect(validation).toHaveProperty('recommendations');
      expect(Array.isArray(validation.warnings)).toBe(true);
      expect(Array.isArray(validation.recommendations)).toBe(true);
    });

    test('should reject invalid role in validation', async () => {
      const validationData = {
        colonyId: testColonyId,
        antIds: ['ant1'],
        role: 'invalid-role'
      };

      const response = await request(app)
        .post('/api/ants/validate-assignment')
        .send(validationData)
        .expect(200);

      const { validation } = response.body;
      expect(validation.valid).toBe(false);
      expect(validation.warnings).toContain('Invalid role specified');
    });

    test('should warn about large batch assignments', async () => {
      const largeAntIds = Array.from({ length: 25 }, (_, i) => `ant${i + 1}`);
      const validationData = {
        colonyId: testColonyId,
        antIds: largeAntIds,
        role: 'worker'
      };

      const response = await request(app)
        .post('/api/ants/validate-assignment')
        .send(validationData)
        .expect(200);

      const { validation } = response.body;
      expect(validation.warnings.some(warning => 
        warning.includes('Large batch assignment')
      )).toBe(true);
    });

    test('should provide role-specific recommendations', async () => {
      const validationData = {
        colonyId: testColonyId,
        antIds: Array.from({ length: 15 }, (_, i) => `ant${i + 1}`),
        role: 'soldier'
      };

      const response = await request(app)
        .post('/api/ants/validate-assignment')
        .send(validationData)
        .expect(200);

      const { validation } = response.body;
      expect(validation.recommendations.some(rec => 
        rec.includes('gradual assignment')
      )).toBe(true);
    });
  });

  describe('GET /api/colonies/:colonyId/role-recommendations', () => {
    test('should return role recommendations successfully', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/role-recommendations`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('recommendations');

      const { recommendations } = response.body;
      expect(recommendations).toHaveProperty('urgent');
      expect(recommendations).toHaveProperty('suggested');
      expect(recommendations).toHaveProperty('optimal');
      expect(Array.isArray(recommendations.urgent)).toBe(true);
      expect(Array.isArray(recommendations.suggested)).toBe(true);
    });

    test('should provide optimal distribution', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/role-recommendations`)
        .expect(200);

      const { recommendations } = response.body;
      const { optimal } = recommendations;

      expect(optimal).toHaveProperty('worker');
      expect(optimal).toHaveProperty('soldier');
      expect(optimal).toHaveProperty('scout');
      expect(optimal).toHaveProperty('nurse');
      expect(optimal).toHaveProperty('builder');
      expect(optimal).toHaveProperty('forager');

      // All optimal values should be reasonable percentages
      Object.values(optimal).forEach(percentage => {
        expect(percentage).toBeGreaterThanOrEqual(0);
        expect(percentage).toBeLessThanOrEqual(100);
      });
    });

    test('should include recommendation details', async () => {
      const response = await request(app)
        .get(`/api/colonies/${testColonyId}/role-recommendations`)
        .expect(200);

      const { recommendations } = response.body;
      
      // Check urgent recommendations structure if any exist
      recommendations.urgent.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('role');
        expect(rec).toHaveProperty('reason');
        expect(rec).toHaveProperty('impact');
      });

      // Check suggested recommendations structure if any exist
      recommendations.suggested.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('reason');
        expect(rec).toHaveProperty('impact');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing parameters gracefully', async () => {
      const response = await request(app)
        .post('/api/ants/validate-assignment')
        .send({}) // Empty body
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('should handle malformed requests', async () => {
      const response = await request(app)
        .put('/api/ants/batch-assign')
        .send('invalid json') // Invalid JSON
        .expect(400);

      // Express should handle malformed JSON and return 400
    });
  });

  describe('Performance and Load', () => {
    test('should handle concurrent requests', async () => {
      const requests = [];
      
      // Create 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get(`/api/colonies/colony${i}/ants`)
            .expect(200)
        );
      }

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });
    });

    test('should respond within reasonable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get(`/api/colonies/${testColonyId}/ants`)
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});

console.log('🧪 Task 7 Integration Tests - Ready to run with: npm test server/test-task7-integration.js'); 
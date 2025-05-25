/**
 * Task 7 Integration Tests
 * Tests for Ant Role Assignment and Management API endpoints
 */

const request = require('supertest');
const express = require('express');
const antController = require('../controllers/antController');

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
    });
  });
});

console.log('🧪 Task 7 Integration Tests - Ready to run with Jest'); 
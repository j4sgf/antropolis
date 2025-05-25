import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import roleAssignmentService, { 
  ROLE_TYPES, 
  ROLE_CATEGORIES, 
  validateRoleChange 
} from '../roleAssignmentService';

// Mock fetch
global.fetch = vi.fn();

// Mock environment
const originalEnv = process.env;

describe('RoleAssignmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
    roleAssignmentService.clearCache();
    
    // Reset environment
    process.env = { ...originalEnv };
    import.meta = { env: { VITE_API_URL: 'http://localhost:3001', DEV: true } };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('updateAntRole', () => {
    test('successfully updates ant role', async () => {
      const mockResponse = {
        success: true,
        message: 'Ant role updated successfully'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await roleAssignmentService.updateAntRole('colony1', 'ant1', 'soldier');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/ants/ant1/role',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colonyId: 'colony1',
            role: 'soldier'
          })
        }
      );

      expect(result).toEqual(mockResponse);
    });

    test('throws error on API failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request'
      });

      await expect(
        roleAssignmentService.updateAntRole('colony1', 'ant1', 'soldier')
      ).rejects.toThrow('Failed to update ant role: Bad Request');
    });

    test('throws error on network failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        roleAssignmentService.updateAntRole('colony1', 'ant1', 'soldier')
      ).rejects.toThrow('Network error');
    });

    test('invalidates cache after successful update', async () => {
      const mockResponse = { success: true };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Set up cache
      roleAssignmentService.cache.set('colony_ants_colony1', {
        data: [{ id: 'ant1', role: 'worker' }],
        timestamp: Date.now()
      });

      await roleAssignmentService.updateAntRole('colony1', 'ant1', 'soldier');

      // Cache should be cleared
      expect(roleAssignmentService.cache.has('colony_ants_colony1')).toBe(false);
    });
  });

  describe('batchUpdateAntRoles', () => {
    test('successfully updates multiple ant roles', async () => {
      const mockResponse = {
        success: true,
        message: 'Successfully updated roles for 3 ants'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await roleAssignmentService.batchUpdateAntRoles(
        'colony1', 
        ['ant1', 'ant2', 'ant3'], 
        'scout'
      );

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/ants/batch-assign',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colonyId: 'colony1',
            antIds: ['ant1', 'ant2', 'ant3'],
            role: 'scout'
          })
        }
      );

      expect(result).toEqual(mockResponse);
    });

    test('throws error on batch update failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error'
      });

      await expect(
        roleAssignmentService.batchUpdateAntRoles('colony1', ['ant1', 'ant2'], 'soldier')
      ).rejects.toThrow('Failed to batch update ant roles: Internal Server Error');
    });
  });

  describe('getColonyAnts', () => {
    test('fetches colony ants successfully', async () => {
      const mockAnts = [
        { id: 'ant1', role: 'worker', health: 100 },
        { id: 'ant2', role: 'soldier', health: 95 }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ants: mockAnts })
      });

      const result = await roleAssignmentService.getColonyAnts('colony1');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/colonies/colony1/ants');
      expect(result).toEqual(mockAnts);
    });

    test('uses cached data when available and fresh', async () => {
      const cachedAnts = [{ id: 'ant1', role: 'worker' }];
      const cacheKey = 'colony_ants_colony1';
      
      roleAssignmentService.cache.set(cacheKey, {
        data: cachedAnts,
        timestamp: Date.now() - 10000 // 10 seconds ago
      });

      const result = await roleAssignmentService.getColonyAnts('colony1', true);

      expect(fetch).not.toHaveBeenCalled();
      expect(result).toEqual(cachedAnts);
    });

    test('fetches fresh data when cache is stale', async () => {
      const cachedAnts = [{ id: 'ant1', role: 'worker' }];
      const freshAnts = [{ id: 'ant1', role: 'soldier' }];
      
      roleAssignmentService.cache.set('colony_ants_colony1', {
        data: cachedAnts,
        timestamp: Date.now() - 60000 // 60 seconds ago (stale)
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ants: freshAnts })
      });

      const result = await roleAssignmentService.getColonyAnts('colony1', true);

      expect(fetch).toHaveBeenCalled();
      expect(result).toEqual(freshAnts);
    });

    test('bypasses cache when useCache is false', async () => {
      const cachedAnts = [{ id: 'ant1', role: 'worker' }];
      const freshAnts = [{ id: 'ant1', role: 'soldier' }];
      
      roleAssignmentService.cache.set('colony_ants_colony1', {
        data: cachedAnts,
        timestamp: Date.now()
      });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ants: freshAnts })
      });

      const result = await roleAssignmentService.getColonyAnts('colony1', false);

      expect(fetch).toHaveBeenCalled();
      expect(result).toEqual(freshAnts);
    });
  });

  describe('getAntStatistics', () => {
    test('fetches ant statistics successfully', async () => {
      const mockStats = {
        experience: 75,
        efficiency: 85,
        tasksCompleted: 42
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ stats: mockStats })
      });

      const result = await roleAssignmentService.getAntStatistics('ant1');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/ants/ant1/stats');
      expect(result).toEqual(mockStats);
    });

    test('returns empty object on API failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(
        roleAssignmentService.getAntStatistics('ant1')
      ).rejects.toThrow('Failed to fetch ant statistics: Not Found');
    });
  });

  describe('getRoleDistribution', () => {
    test('fetches role distribution successfully', async () => {
      const mockDistribution = {
        worker: 15,
        soldier: 5,
        scout: 3
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ distribution: mockDistribution })
      });

      const result = await roleAssignmentService.getRoleDistribution('colony1');

      expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/colonies/colony1/role-distribution');
      expect(result).toEqual(mockDistribution);
    });
  });

  describe('validateRoleAssignment', () => {
    test('validates role assignment successfully', async () => {
      const mockValidation = {
        valid: true,
        warnings: [],
        recommendations: []
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockValidation
      });

      const result = await roleAssignmentService.validateRoleAssignment(
        'colony1',
        ['ant1', 'ant2'],
        'soldier'
      );

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/ants/validate-assignment',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colonyId: 'colony1',
            antIds: ['ant1', 'ant2'],
            role: 'soldier'
          })
        }
      );

      expect(result).toEqual(mockValidation);
    });
  });

  describe('getRoleRecommendations', () => {
    test('fetches role recommendations successfully', async () => {
      const mockRecommendations = {
        urgent: [{ type: 'increase', role: 'scout' }],
        suggested: []
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ recommendations: mockRecommendations })
      });

      const result = await roleAssignmentService.getRoleRecommendations('colony1');

      expect(result).toEqual(mockRecommendations);
    });

    test('returns empty object on error (graceful degradation)', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Server Error'
      });

      const result = await roleAssignmentService.getRoleRecommendations('colony1');

      expect(result).toEqual({});
    });
  });

  describe('Cache Management', () => {
    test('invalidateColonyCache removes colony-related entries', () => {
      roleAssignmentService.cache.set('colony_ants_colony1', { data: [] });
      roleAssignmentService.cache.set('other_data_colony1', { data: [] });
      roleAssignmentService.cache.set('colony_ants_colony2', { data: [] });

      roleAssignmentService.invalidateColonyCache('colony1');

      expect(roleAssignmentService.cache.has('colony_ants_colony1')).toBe(false);
      expect(roleAssignmentService.cache.has('other_data_colony1')).toBe(false);
      expect(roleAssignmentService.cache.has('colony_ants_colony2')).toBe(true);
    });

    test('clearCache removes all cached data', () => {
      roleAssignmentService.cache.set('key1', { data: [] });
      roleAssignmentService.cache.set('key2', { data: [] });

      expect(roleAssignmentService.cache.size).toBe(2);

      roleAssignmentService.clearCache();

      expect(roleAssignmentService.cache.size).toBe(0);
    });
  });

  describe('Mock Data Generation', () => {
    test('generateMockAnts creates appropriate number of ants', () => {
      const mockAnts = roleAssignmentService.generateMockAnts('test-colony');

      expect(mockAnts).toHaveLength(50);
      expect(mockAnts[0]).toHaveProperty('id');
      expect(mockAnts[0]).toHaveProperty('colonyId', 'test-colony');
      expect(mockAnts[0]).toHaveProperty('role');
      expect(mockAnts[0]).toHaveProperty('experience');
      expect(mockAnts[0]).toHaveProperty('efficiency');
    });

    test('mock ants have valid roles', () => {
      const mockAnts = roleAssignmentService.generateMockAnts('test-colony');
      const validRoles = ['worker', 'soldier', 'scout', 'nurse', 'builder', 'forager'];

      mockAnts.forEach(ant => {
        expect(validRoles).toContain(ant.role);
      });
    });

    test('mock ants have realistic stat ranges', () => {
      const mockAnts = roleAssignmentService.generateMockAnts('test-colony');

      mockAnts.forEach(ant => {
        expect(ant.experience).toBeGreaterThanOrEqual(0);
        expect(ant.experience).toBeLessThanOrEqual(100);
        expect(ant.efficiency).toBeGreaterThanOrEqual(0);
        expect(ant.efficiency).toBeLessThanOrEqual(100);
        expect(ant.health).toBeGreaterThanOrEqual(0);
        expect(ant.health).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Development Mode Detection', () => {
    test('correctly identifies development mode', () => {
      import.meta.env.DEV = true;
      expect(roleAssignmentService.isDevelopment()).toBe(true);

      import.meta.env.DEV = false;
      import.meta.env.MODE = 'development';
      expect(roleAssignmentService.isDevelopment()).toBe(true);

      import.meta.env.DEV = false;
      import.meta.env.MODE = 'production';
      expect(roleAssignmentService.isDevelopment()).toBe(false);
    });
  });
});

describe('Role Constants and Utilities', () => {
  describe('ROLE_TYPES', () => {
    test('contains all expected role types', () => {
      expect(ROLE_TYPES).toEqual({
        WORKER: 'worker',
        SOLDIER: 'soldier',
        SCOUT: 'scout',
        NURSE: 'nurse',
        BUILDER: 'builder',
        FORAGER: 'forager'
      });
    });
  });

  describe('ROLE_CATEGORIES', () => {
    test('contains detailed role information', () => {
      expect(ROLE_CATEGORIES.WORKER).toHaveProperty('name', 'Worker');
      expect(ROLE_CATEGORIES.WORKER).toHaveProperty('description');
      expect(ROLE_CATEGORIES.WORKER).toHaveProperty('subRoles');
      expect(ROLE_CATEGORIES.WORKER).toHaveProperty('color');
    });

    test('all roles have required properties', () => {
      Object.values(ROLE_CATEGORIES).forEach(role => {
        expect(role).toHaveProperty('name');
        expect(role).toHaveProperty('description');
        expect(role).toHaveProperty('subRoles');
        expect(role).toHaveProperty('color');
        expect(Array.isArray(role.subRoles)).toBe(true);
      });
    });
  });

  describe('validateRoleChange', () => {
    const mockColony = { id: 'colony1', name: 'Test Colony' };

    test('validates successful role change', () => {
      const result = validateRoleChange(mockColony, ['ant1', 'ant2'], 'SOLDIER');

      expect(result).toEqual({ valid: true });
    });

    test('rejects missing parameters', () => {
      expect(validateRoleChange(null, ['ant1'], 'SOLDIER')).toEqual({
        valid: false,
        reason: 'Missing required parameters'
      });

      expect(validateRoleChange(mockColony, null, 'SOLDIER')).toEqual({
        valid: false,
        reason: 'Missing required parameters'
      });

      expect(validateRoleChange(mockColony, ['ant1'], null)).toEqual({
        valid: false,
        reason: 'Missing required parameters'
      });
    });

    test('rejects invalid role type', () => {
      const result = validateRoleChange(mockColony, ['ant1'], 'INVALID_ROLE');

      expect(result).toEqual({
        valid: false,
        reason: 'Invalid role type'
      });
    });

    test('rejects empty ant selection', () => {
      const result = validateRoleChange(mockColony, [], 'SOLDIER');

      expect(result).toEqual({
        valid: false,
        reason: 'No ants selected'
      });
    });

    test('accepts lowercase role names', () => {
      const result = validateRoleChange(mockColony, ['ant1'], 'soldier');

      expect(result).toEqual({ valid: true });
    });
  });
}); 
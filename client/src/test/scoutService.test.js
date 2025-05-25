import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import scoutService from '../services/scoutService.js';

// Mock fetch globally
global.fetch = vi.fn();

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_API_URL: 'http://localhost:3001'
  }
}));

describe('ScoutService', () => {
  beforeEach(() => {
    // Reset the service before each test
    scoutService.shutdown();
    vi.clearAllMocks();
  });

  afterEach(() => {
    scoutService.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid colony ID', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });

      const result = await scoutService.initialize('test-colony');
      expect(result).toBe(true);
      expect(scoutService.activeColony).toBe('test-colony');
    });

    it('should handle initialization failure', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await scoutService.initialize('test-colony');
      expect(result).toBe(false);
    });
  });

  describe('Scout Management', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });
      await scoutService.initialize('test-colony');
    });

    it('should add a scout with default values', () => {
      const scout = scoutService.addScout({
        id: 'scout-1',
        x: 10,
        y: 20
      });

      expect(scout).toBeDefined();
      expect(scout.id).toBe('scout-1');
      expect(scout.x).toBe(10);
      expect(scout.y).toBe(20);
      expect(scout.type).toBe('WORKER');
      expect(scout.isActive).toBe(true);
      expect(scout.visibilityRange).toBe(3); // Worker default range
    });

    it('should add a scout with custom type and properties', () => {
      const scout = scoutService.addScout({
        id: 'scout-2',
        x: 5,
        y: 15,
        type: 'SCOUT',
        stamina: 90
      });

      expect(scout.type).toBe('SCOUT');
      expect(scout.visibilityRange).toBe(5); // Scout default range
      expect(scout.stamina).toBe(90);
      expect(scout.speed).toBe(1.5); // Scout speed
    });

    it('should update scout position and maintain path history', () => {
      scoutService.addScout({ id: 'scout-1', x: 0, y: 0 });
      
      const result = scoutService.updateScoutPosition('scout-1', 5, 10);
      expect(result).toBe(true);

      const scout = scoutService.getScout('scout-1');
      expect(scout.x).toBe(5);
      expect(scout.y).toBe(10);
      expect(scout.path).toHaveLength(1);
      expect(scout.path[0]).toEqual(
        expect.objectContaining({ x: 5, y: 10 })
      );
    });

    it('should remove scout successfully', () => {
      scoutService.addScout({ id: 'scout-1', x: 0, y: 0 });
      
      const result = scoutService.removeScout('scout-1');
      expect(result).toBe(true);
      expect(scoutService.getScout('scout-1')).toBeUndefined();
    });

    it('should return false when removing non-existent scout', () => {
      const result = scoutService.removeScout('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('Visibility Updates', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });
      await scoutService.initialize('test-colony');
    });

    it('should update visibility when scouts are active', async () => {
      scoutService.addScout({ id: 'scout-1', x: 10, y: 10 });
      scoutService.addScout({ id: 'scout-2', x: 20, y: 20 });

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { updated: true } })
      });

      const result = await scoutService.updateVisibility();
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/update-scouts'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('scoutPositions')
        })
      );
      expect(result).toEqual({ updated: true });
    });

    it('should handle visibility update failure', async () => {
      scoutService.addScout({ id: 'scout-1', x: 10, y: 10 });
      
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await scoutService.updateVisibility();
      expect(result).toBeNull();
    });

    it('should not update visibility when no colony is active', async () => {
      scoutService.activeColony = null;
      
      const result = await scoutService.updateVisibility();
      expect(result).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Stamina Management', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });
      await scoutService.initialize('test-colony');
    });

    it('should reduce scout stamina over time', () => {
      const scout = scoutService.addScout({
        id: 'scout-1',
        x: 0,
        y: 0,
        type: 'SCOUT',
        stamina: 50
      });

      scoutService.updateScoutStamina();

      const updatedScout = scoutService.getScout('scout-1');
      expect(updatedScout.stamina).toBeLessThan(50);
    });

    it('should deactivate exhausted scouts', () => {
      const scout = scoutService.addScout({
        id: 'scout-1',
        x: 0,
        y: 0,
        stamina: 1
      });

      scoutService.updateScoutStamina();

      const updatedScout = scoutService.getScout('scout-1');
      expect(updatedScout.stamina).toBe(0);
      expect(updatedScout.isActive).toBe(false);
    });
  });

  describe('Scout Positioning and Movement', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });
      await scoutService.initialize('test-colony');
    });

    it('should send scout to target location', () => {
      scoutService.addScout({ id: 'scout-1', x: 0, y: 0 });
      
      const result = scoutService.sendScoutTo('scout-1', 10, 10);
      expect(result).toBe(true);

      const scout = scoutService.getScout('scout-1');
      expect(scout.currentTarget).toEqual({ x: 10, y: 10 });
      expect(scout.isActive).toBe(true);
    });

    it('should return false for non-existent scout movement', () => {
      const result = scoutService.sendScoutTo('non-existent', 10, 10);
      expect(result).toBe(false);
    });

    it('should get active scouts only', () => {
      scoutService.addScout({ id: 'scout-1', x: 0, y: 0, isActive: true });
      scoutService.addScout({ id: 'scout-2', x: 5, y: 5, isActive: false });

      const activeScouts = scoutService.getActiveScouts();
      expect(activeScouts).toHaveLength(1);
      expect(activeScouts[0].id).toBe('scout-1');
    });

    it('should get scout positions for visibility calculation', () => {
      scoutService.addScout({ id: 'scout-1', x: 10, y: 20, type: 'SCOUT' });
      scoutService.addScout({ id: 'scout-2', x: 30, y: 40, type: 'WORKER', isActive: false });

      const positions = scoutService.getScoutPositions();
      expect(positions).toHaveLength(1); // Only active scouts
      expect(positions[0]).toEqual({
        id: 'scout-1',
        x: 10,
        y: 20,
        visibilityRange: 5,
        type: 'SCOUT'
      });
    });
  });

  describe('Exploration API Calls', () => {
    beforeEach(async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: {} })
      });
      await scoutService.initialize('test-colony');
    });

    it('should explore tiles successfully', async () => {
      const tiles = [{ x: 10, y: 10 }, { x: 11, y: 11 }];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await scoutService.exploreTiles(tiles, 'RESOURCE_CACHE');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/explore-tiles'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"discoveryType":"RESOURCE_CACHE"')
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('should explore area around position', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await scoutService.exploreArea(25, 35, 5, 'circular');
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/explore-area'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"centerX":25')
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('should process memory decay', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await scoutService.processMemoryDecay();
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/process-decay'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('Configuration and Types', () => {
    it('should have correct scout type configurations', () => {
      const workerScout = scoutService.addScout({ id: 'w1', x: 0, y: 0, type: 'WORKER' });
      const scoutScout = scoutService.addScout({ id: 's1', x: 0, y: 0, type: 'SCOUT' });
      const soldierScout = scoutService.addScout({ id: 'so1', x: 0, y: 0, type: 'SOLDIER' });
      const rangerScout = scoutService.addScout({ id: 'r1', x: 0, y: 0, type: 'RANGER' });

      expect(workerScout.visibilityRange).toBe(3);
      expect(workerScout.speed).toBe(1.0);
      expect(workerScout.maxStamina).toBe(100);

      expect(scoutScout.visibilityRange).toBe(5);
      expect(scoutScout.speed).toBe(1.5);
      expect(scoutScout.maxStamina).toBe(80);

      expect(soldierScout.visibilityRange).toBe(4);
      expect(soldierScout.speed).toBe(0.8);
      expect(soldierScout.maxStamina).toBe(120);

      expect(rangerScout.visibilityRange).toBe(7);
      expect(rangerScout.speed).toBe(1.2);
      expect(rangerScout.maxStamina).toBe(90);
    });
  });
}); 
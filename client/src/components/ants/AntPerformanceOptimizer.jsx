import React, { useRef, useCallback, useMemo, useEffect } from 'react';

/**
 * AntPerformanceOptimizer - Advanced performance optimization utilities
 * Part of Task 15.5: Optimize Ant Rendering for Performance
 */

/**
 * Object Pool for reusing ant visual instances
 */
class AntObjectPool {
  constructor(initialSize = 100) {
    this.pool = [];
    this.active = new Set();
    this.createInitialObjects(initialSize);
  }

  createInitialObjects(size) {
    for (let i = 0; i < size; i++) {
      this.pool.push(this.createAntObject());
    }
  }

  createAntObject() {
    return {
      id: null,
      position: { x: 0, y: 0 },
      role: 'worker',
      health: 100,
      stamina: 100,
      level: 1,
      status: 'idle',
      lod: 'high',
      lastUpdate: 0,
      isDirty: false,
      element: null
    };
  }

  acquire(antData) {
    let obj = this.pool.pop();
    
    if (!obj) {
      obj = this.createAntObject();
    }

    // Reset and populate with new data
    Object.assign(obj, antData);
    obj.lastUpdate = Date.now();
    obj.isDirty = true;
    
    this.active.add(obj);
    return obj;
  }

  release(obj) {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      
      // Reset object
      obj.id = null;
      obj.isDirty = false;
      obj.element = null;
      
      this.pool.push(obj);
    }
  }

  releaseAll() {
    this.active.forEach(obj => this.release(obj));
  }

  getActiveCount() {
    return this.active.size;
  }

  getPoolSize() {
    return this.pool.length;
  }
}

/**
 * Batch Update Manager for efficient DOM updates
 */
class BatchUpdateManager {
  constructor(batchSize = 50, frameDelay = 16) {
    this.batchSize = batchSize;
    this.frameDelay = frameDelay;
    this.updateQueue = [];
    this.isProcessing = false;
    this.lastFrameTime = 0;
  }

  addUpdate(updateFn, priority = 0) {
    this.updateQueue.push({ updateFn, priority, timestamp: Date.now() });
    this.updateQueue.sort((a, b) => b.priority - a.priority);
    
    if (!this.isProcessing) {
      this.processUpdates();
    }
  }

  processUpdates() {
    this.isProcessing = true;
    
    const processFrame = (currentTime) => {
      if (currentTime - this.lastFrameTime >= this.frameDelay) {
        const batch = this.updateQueue.splice(0, this.batchSize);
        
        // Process batch
        batch.forEach(({ updateFn }) => {
          try {
            updateFn();
          } catch (error) {
            console.warn('Batch update error:', error);
          }
        });

        this.lastFrameTime = currentTime;
      }

      if (this.updateQueue.length > 0) {
        requestAnimationFrame(processFrame);
      } else {
        this.isProcessing = false;
      }
    };

    requestAnimationFrame(processFrame);
  }

  clear() {
    this.updateQueue = [];
    this.isProcessing = false;
  }

  getQueueSize() {
    return this.updateQueue.length;
  }
}

/**
 * Memory Manager for tracking and optimizing memory usage
 */
class MemoryManager {
  constructor() {
    this.memoryStats = {
      antObjects: 0,
      domElements: 0,
      eventListeners: 0,
      lastCleanup: Date.now()
    };
    this.cleanupThreshold = 1000; // Cleanup every 1000 objects
    this.cleanupInterval = 30000; // Cleanup every 30 seconds
    this.startCleanupTimer();
  }

  trackAntObject() {
    this.memoryStats.antObjects++;
    this.checkCleanupThreshold();
  }

  releaseAntObject() {
    this.memoryStats.antObjects = Math.max(0, this.memoryStats.antObjects - 1);
  }

  trackDOMElement() {
    this.memoryStats.domElements++;
  }

  releaseDOMElement() {
    this.memoryStats.domElements = Math.max(0, this.memoryStats.domElements - 1);
  }

  trackEventListener() {
    this.memoryStats.eventListeners++;
  }

  releaseEventListener() {
    this.memoryStats.eventListeners = Math.max(0, this.memoryStats.eventListeners - 1);
  }

  checkCleanupThreshold() {
    if (this.memoryStats.antObjects > this.cleanupThreshold) {
      this.performCleanup();
    }
  }

  performCleanup() {
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }

    // Update cleanup timestamp
    this.memoryStats.lastCleanup = Date.now();
    
    // Emit cleanup event for components to handle their own cleanup
    window.dispatchEvent(new CustomEvent('antMemoryCleanup', {
      detail: this.memoryStats
    }));
  }

  startCleanupTimer() {
    setInterval(() => {
      this.performCleanup();
    }, this.cleanupInterval);
  }

  getMemoryStats() {
    return { ...this.memoryStats };
  }
}

/**
 * Performance Monitor Hook
 */
export const useAntPerformanceMonitor = () => {
  const frameTimeRef = useRef([]);
  const renderCountRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());

  const recordFrame = useCallback(() => {
    const now = Date.now();
    const frameTime = now - lastUpdateRef.current;
    
    frameTimeRef.current.push(frameTime);
    if (frameTimeRef.current.length > 60) {
      frameTimeRef.current.shift();
    }
    
    renderCountRef.current++;
    lastUpdateRef.current = now;
  }, []);

  const getPerformanceStats = useCallback(() => {
    const frameTimes = frameTimeRef.current;
    const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    const fps = Math.round(1000 / avgFrameTime);
    const minFrameTime = Math.min(...frameTimes);
    const maxFrameTime = Math.max(...frameTimes);

    return {
      fps,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
      minFrameTime,
      maxFrameTime,
      renderCount: renderCountRef.current,
      frameCount: frameTimes.length
    };
  }, []);

  return { recordFrame, getPerformanceStats };
};

/**
 * Viewport Culling Hook
 */
export const useViewportCulling = (ants, viewport, margin = 50) => {
  return useMemo(() => {
    if (!viewport || !ants) return ants;

    const bounds = {
      left: -margin,
      top: -margin,
      right: viewport.width + margin,
      bottom: viewport.height + margin
    };

    return ants.filter(ant => {
      if (!ant.position) return false;
      
      return (
        ant.position.x >= bounds.left &&
        ant.position.x <= bounds.right &&
        ant.position.y >= bounds.top &&
        ant.position.y <= bounds.bottom
      );
    });
  }, [ants, viewport, margin]);
};

/**
 * LOD (Level of Detail) Hook
 */
export const useLODSystem = (ants, camera, lodDistances) => {
  return useMemo(() => {
    if (!camera || !ants) return ants;

    return ants.map(ant => {
      if (!ant.position) return { ...ant, lod: 'low' };

      const distance = Math.sqrt(
        Math.pow(ant.position.x - camera.x, 2) + 
        Math.pow(ant.position.y - camera.y, 2)
      );

      let lod = 'low';
      if (distance <= lodDistances.high) lod = 'high';
      else if (distance <= lodDistances.medium) lod = 'medium';

      return { ...ant, lod, distance };
    });
  }, [ants, camera, lodDistances]);
};

/**
 * Ant Clustering Hook for performance optimization
 */
export const useAntClustering = (ants, clusterDistance = 20) => {
  return useMemo(() => {
    if (!ants || ants.length === 0) return { clusters: [], individuals: [] };

    const clusters = [];
    const processed = new Set();
    const individuals = [];

    ants.forEach((ant, index) => {
      if (processed.has(index) || !ant.position) return;

      const cluster = [ant];
      processed.add(index);

      // Find nearby ants
      ants.forEach((otherAnt, otherIndex) => {
        if (processed.has(otherIndex) || !otherAnt.position || index === otherIndex) return;

        const distance = Math.sqrt(
          Math.pow(ant.position.x - otherAnt.position.x, 2) +
          Math.pow(ant.position.y - otherAnt.position.y, 2)
        );

        if (distance <= clusterDistance) {
          cluster.push(otherAnt);
          processed.add(otherIndex);
        }
      });

      if (cluster.length > 1) {
        // Calculate cluster center
        const centerX = cluster.reduce((sum, a) => sum + a.position.x, 0) / cluster.length;
        const centerY = cluster.reduce((sum, a) => sum + a.position.y, 0) / cluster.length;
        
        clusters.push({
          id: `cluster-${clusters.length}`,
          center: { x: centerX, y: centerY },
          ants: cluster,
          count: cluster.length
        });
      } else {
        individuals.push(ant);
      }
    });

    return { clusters, individuals };
  }, [ants, clusterDistance]);
};

/**
 * Performance Optimizer Context Provider
 */
export const AntPerformanceProvider = ({ children, config = {} }) => {
  const objectPool = useRef(new AntObjectPool(config.poolSize || 100));
  const batchManager = useRef(new BatchUpdateManager(config.batchSize || 50));
  const memoryManager = useRef(new MemoryManager());

  useEffect(() => {
    return () => {
      objectPool.current.releaseAll();
      batchManager.current.clear();
    };
  }, []);

  const value = {
    objectPool: objectPool.current,
    batchManager: batchManager.current,
    memoryManager: memoryManager.current
  };

  return (
    <AntPerformanceContext.Provider value={value}>
      {children}
    </AntPerformanceContext.Provider>
  );
};

/**
 * Performance Context
 */
export const AntPerformanceContext = React.createContext(null);

/**
 * Hook to use performance utilities
 */
export const useAntPerformance = () => {
  const context = React.useContext(AntPerformanceContext);
  if (!context) {
    throw new Error('useAntPerformance must be used within AntPerformanceProvider');
  }
  return context;
};

export { AntObjectPool, BatchUpdateManager, MemoryManager }; 
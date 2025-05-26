/**
 * Ant Visual Components - Export all ant-related visual components
 * Part of Task 15: Visual Differentiation of Ant Types
 */

// Main components
export { default as AntVisual } from './AntVisual';
export { default as AntRenderer } from './AntRenderer';
export { default as AntTooltip } from './AntTooltip';
export { default as AntStatusBadge } from './AntStatusBadge';
export { default as AntProgressBars, CompactProgressRing } from './AntProgressBars';
export { default as AntEvolutionVisuals } from './AntEvolutionVisuals';

// Performance optimization components (Task 15.5)
export { default as AntWebGLRenderer } from './AntWebGLRenderer';
export { default as AntPerformanceTester } from './AntPerformanceTester';
export { 
  AntPerformanceProvider, 
  useAntPerformance, 
  useAntPerformanceMonitor,
  useViewportCulling,
  useLODSystem,
  useAntClustering,
  AntObjectPool,
  BatchUpdateManager,
  MemoryManager
} from './AntPerformanceOptimizer';

// Configuration and utilities
export { default as antVisualConfig, getAntConfig, getSizeConfig, getStatusColor, getEvolutionEffects } from '../../data/antVisualConfig';

/**
 * Re-export commonly used components and utilities for convenience
 */
export const AntComponents = {
  AntVisual,
  AntRenderer,
  AntWebGLRenderer,
  AntTooltip,
  AntStatusBadge,
  AntProgressBars,
  CompactProgressRing,
  AntEvolutionVisuals,
  AntPerformanceTester
};

export const AntUtils = {
  getAntConfig,
  getSizeConfig,
  getStatusColor,
  getEvolutionEffects,
  antVisualConfig
};

export const AntPerformanceUtils = {
  AntPerformanceProvider,
  useAntPerformance,
  useAntPerformanceMonitor,
  useViewportCulling,
  useLODSystem,
  useAntClustering,
  AntObjectPool,
  BatchUpdateManager,
  MemoryManager
}; 
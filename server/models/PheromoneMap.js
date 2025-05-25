const { supabase, handleDatabaseError } = require('../config/database');

// Pheromone types that ants can lay and follow
const PHEROMONE_TYPES = {
  FOOD_TRAIL: {
    name: 'food_trail',
    color: '#4CAF50', // Green
    baseStrength: 100,
    decayRate: 0.02, // 2% per tick
    maxStrength: 255
  },
  HOME_TRAIL: {
    name: 'home_trail', 
    color: '#2196F3', // Blue
    baseStrength: 80,
    decayRate: 0.015, // 1.5% per tick
    maxStrength: 200
  },
  EXPLORATION_TRAIL: {
    name: 'exploration_trail',
    color: '#FF9800', // Orange
    baseStrength: 30,
    decayRate: 0.05, // 5% per tick (fades quickly)
    maxStrength: 100
  },
  DANGER_TRAIL: {
    name: 'danger_trail',
    color: '#F44336', // Red
    baseStrength: 150,
    decayRate: 0.01, // 1% per tick (lasts long)
    maxStrength: 255
  }
};

class PheromoneMap {
  constructor(mapWidth, mapHeight, cellSize = 16) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.cellSize = cellSize;
    this.gridWidth = Math.ceil(mapWidth / cellSize);
    this.gridHeight = Math.ceil(mapHeight / cellSize);
    
    // Initialize pheromone grids for each type
    this.pheromoneGrids = {};
    Object.keys(PHEROMONE_TYPES).forEach(type => {
      this.pheromoneGrids[type] = this.createEmptyGrid();
    });
    
    this.lastDecayTick = 0;
    this.decayInterval = 5; // Apply decay every 5 ticks for performance
  }

  // Create an empty grid filled with zeros
  createEmptyGrid() {
    return Array(this.gridHeight).fill(null).map(() => 
      Array(this.gridWidth).fill(0)
    );
  }

  // Convert world coordinates to grid coordinates
  worldToGrid(x, y) {
    return {
      gridX: Math.floor(x / this.cellSize),
      gridY: Math.floor(y / this.cellSize)
    };
  }

  // Convert grid coordinates to world coordinates (center of cell)
  gridToWorld(gridX, gridY) {
    return {
      x: (gridX * this.cellSize) + (this.cellSize / 2),
      y: (gridY * this.cellSize) + (this.cellSize / 2)
    };
  }

  // Check if grid coordinates are valid
  isValidGridPosition(gridX, gridY) {
    return gridX >= 0 && gridX < this.gridWidth && 
           gridY >= 0 && gridY < this.gridHeight;
  }

  // Lay pheromone at a specific location
  layPheromone(x, y, pheromoneType, strength = null) {
    const { gridX, gridY } = this.worldToGrid(x, y);
    
    if (!this.isValidGridPosition(gridX, gridY)) return false;
    
    const config = PHEROMONE_TYPES[pheromoneType];
    if (!config) return false;
    
    const actualStrength = strength || config.baseStrength;
    const currentStrength = this.pheromoneGrids[pheromoneType][gridY][gridX];
    
    // Add to existing pheromone, but cap at max strength
    const newStrength = Math.min(
      currentStrength + actualStrength,
      config.maxStrength
    );
    
    this.pheromoneGrids[pheromoneType][gridY][gridX] = newStrength;
    return true;
  }

  // Get pheromone strength at a location
  getPheromoneStrength(x, y, pheromoneType) {
    const { gridX, gridY } = this.worldToGrid(x, y);
    
    if (!this.isValidGridPosition(gridX, gridY)) return 0;
    
    return this.pheromoneGrids[pheromoneType][gridY][gridX];
  }

  // Get all pheromone values at a location
  getAllPheromones(x, y) {
    const result = {};
    Object.keys(PHEROMONE_TYPES).forEach(type => {
      result[type] = this.getPheromoneStrength(x, y, type);
    });
    return result;
  }

  // Get pheromone gradient in surrounding area (for ant decision making)
  getPheromoneGradient(x, y, pheromoneType, radius = 1) {
    const { gridX, gridY } = this.worldToGrid(x, y);
    const gradient = [];
    
    // Sample surrounding cells
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const checkX = gridX + dx;
        const checkY = gridY + dy;
        
        if (this.isValidGridPosition(checkX, checkY)) {
          const strength = this.pheromoneGrids[pheromoneType][checkY][checkX];
          const worldPos = this.gridToWorld(checkX, checkY);
          
          gradient.push({
            x: worldPos.x,
            y: worldPos.y,
            strength,
            direction: { dx, dy }
          });
        }
      }
    }
    
    return gradient.sort((a, b) => b.strength - a.strength);
  }

  // Apply decay to all pheromones
  applyDecay(currentTick) {
    // Only decay every few ticks for performance
    if (currentTick - this.lastDecayTick < this.decayInterval) return;
    
    Object.keys(PHEROMONE_TYPES).forEach(type => {
      const config = PHEROMONE_TYPES[type];
      const grid = this.pheromoneGrids[type];
      
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          if (grid[y][x] > 0) {
            const decayAmount = grid[y][x] * config.decayRate;
            grid[y][x] = Math.max(0, grid[y][x] - decayAmount);
            
            // Round to zero if very small to avoid floating point accumulation
            if (grid[y][x] < 0.1) grid[y][x] = 0;
          }
        }
      }
    });
    
    this.lastDecayTick = currentTick;
  }

  // Get visual representation of pheromones for rendering
  getVisualizationData(pheromoneType = null, minStrength = 10) {
    const visualData = [];
    
    const types = pheromoneType ? [pheromoneType] : Object.keys(PHEROMONE_TYPES);
    
    types.forEach(type => {
      const config = PHEROMONE_TYPES[type];
      const grid = this.pheromoneGrids[type];
      
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const strength = grid[y][x];
          
          if (strength >= minStrength) {
            const worldPos = this.gridToWorld(x, y);
            const opacity = Math.min(strength / config.maxStrength, 1.0);
            
            visualData.push({
              x: worldPos.x,
              y: worldPos.y,
              cellSize: this.cellSize,
              type,
              strength,
              opacity,
              color: config.color
            });
          }
        }
      }
    });
    
    return visualData;
  }

  // Find the strongest pheromone trail from a given position
  findStrongestTrail(x, y, excludeTypes = []) {
    const allPheromones = this.getAllPheromones(x, y);
    let strongest = { type: null, strength: 0 };
    
    Object.entries(allPheromones).forEach(([type, strength]) => {
      if (!excludeTypes.includes(type) && strength > strongest.strength) {
        strongest = { type, strength };
      }
    });
    
    return strongest;
  }

  // Calculate optimal direction based on pheromone gradients
  calculateOptimalDirection(x, y, targetPheromone, avoidPheromone = null) {
    const targetGradient = this.getPheromoneGradient(x, y, targetPheromone, 2);
    const avoidGradient = avoidPheromone ? 
      this.getPheromoneGradient(x, y, avoidPheromone, 1) : [];
    
    if (targetGradient.length === 0) return null;
    
    // Weight directions based on pheromone strength
    let bestDirection = null;
    let bestScore = -Infinity;
    
    targetGradient.forEach(cell => {
      if (cell.direction.dx === 0 && cell.direction.dy === 0) return; // Skip current position
      
      let score = cell.strength;
      
      // Penalize if there's danger pheromone in this direction
      if (avoidPheromone) {
        const dangerInDirection = avoidGradient.find(avoid => 
          avoid.direction.dx === cell.direction.dx && 
          avoid.direction.dy === cell.direction.dy
        );
        if (dangerInDirection) {
          score -= dangerInDirection.strength * 2; // Heavy penalty for danger
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestDirection = {
          dx: cell.direction.dx,
          dy: cell.direction.dy,
          strength: cell.strength
        };
      }
    });
    
    return bestDirection;
  }

  // Clear all pheromones (for testing/reset)
  clearAll() {
    Object.keys(PHEROMONE_TYPES).forEach(type => {
      this.pheromoneGrids[type] = this.createEmptyGrid();
    });
  }

  // Get statistics about current pheromone state
  getStatistics() {
    const stats = {
      totalCells: this.gridWidth * this.gridHeight,
      activeCells: 0,
      byType: {}
    };
    
    Object.keys(PHEROMONE_TYPES).forEach(type => {
      const grid = this.pheromoneGrids[type];
      let activeCells = 0;
      let totalStrength = 0;
      let maxStrength = 0;
      
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const strength = grid[y][x];
          if (strength > 0) {
            activeCells++;
            totalStrength += strength;
            maxStrength = Math.max(maxStrength, strength);
          }
        }
      }
      
      stats.byType[type] = {
        activeCells,
        totalStrength: Math.round(totalStrength),
        averageStrength: activeCells > 0 ? Math.round(totalStrength / activeCells) : 0,
        maxStrength: Math.round(maxStrength)
      };
      
      stats.activeCells += activeCells;
    });
    
    return stats;
  }

  // Get pheromone types configuration
  static getPheromoneTypes() {
    return PHEROMONE_TYPES;
  }
}

module.exports = PheromoneMap; 
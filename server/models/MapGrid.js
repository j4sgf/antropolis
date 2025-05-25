/**
 * MapGrid class for managing a 2D array of tiles
 * Provides efficient access, modification, and spatial query methods
 */

const { Tile, TERRAIN_TYPES } = require('./Tile');

class MapGrid {
  constructor(width, height, defaultTerrain = TERRAIN_TYPES.GRASS) {
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.metadata = {
      createdAt: new Date(),
      lastModified: new Date(),
      seed: null,
      generationVersion: '1.0.0',
      difficulty: 'medium'
    };
    
    // Initialize the grid with default tiles
    this.initializeGrid(defaultTerrain);
  }

  /**
   * Initialize the grid with empty tiles
   */
  initializeGrid(defaultTerrain) {
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new Tile(x, y, defaultTerrain));
      }
      this.tiles.push(row);
    }
  }

  /**
   * Get a tile at the specified coordinates
   */
  getTile(x, y) {
    if (!this.isValidCoordinate(x, y)) {
      return null;
    }
    return this.tiles[y][x];
  }

  /**
   * Set a tile at the specified coordinates
   */
  setTile(x, y, tile) {
    if (!this.isValidCoordinate(x, y)) {
      throw new Error(`Invalid coordinates: (${x}, ${y})`);
    }
    
    tile.x = x;
    tile.y = y;
    this.tiles[y][x] = tile;
    this.metadata.lastModified = new Date();
  }

  /**
   * Check if coordinates are within grid bounds
   */
  isValidCoordinate(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Get neighboring tiles (8-directional)
   */
  getNeighbors(x, y, includeInvalid = false) {
    const neighbors = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (this.isValidCoordinate(nx, ny)) {
        neighbors.push(this.getTile(nx, ny));
      } else if (includeInvalid) {
        neighbors.push(null);
      }
    }

    return neighbors;
  }

  /**
   * Get neighboring tiles (4-directional - cardinal directions only)
   */
  getCardinalNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      [0, -1], // North
      [1, 0],  // East
      [0, 1],  // South
      [-1, 0]  // West
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (this.isValidCoordinate(nx, ny)) {
        neighbors.push(this.getTile(nx, ny));
      }
    }

    return neighbors;
  }

  /**
   * Get all tiles within a specified radius
   */
  getTilesInRadius(centerX, centerY, radius, includeCenter = true) {
    const tiles = [];
    const radiusSquared = radius * radius;

    for (let y = Math.max(0, centerY - radius); y <= Math.min(this.height - 1, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x <= Math.min(this.width - 1, centerX + radius); x++) {
        const distanceSquared = (x - centerX) ** 2 + (y - centerY) ** 2;
        
        if (distanceSquared <= radiusSquared) {
          if (includeCenter || (x !== centerX || y !== centerY)) {
            tiles.push(this.getTile(x, y));
          }
        }
      }
    }

    return tiles;
  }

  /**
   * Get all tiles in a rectangular area
   */
  getTilesInRectangle(x1, y1, x2, y2) {
    const tiles = [];
    const minX = Math.max(0, Math.min(x1, x2));
    const maxX = Math.min(this.width - 1, Math.max(x1, x2));
    const minY = Math.max(0, Math.min(y1, y2));
    const maxY = Math.min(this.height - 1, Math.max(y1, y2));

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        tiles.push(this.getTile(x, y));
      }
    }

    return tiles;
  }

  /**
   * Find tiles matching specific criteria
   */
  findTiles(predicate) {
    const matchingTiles = [];
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        if (predicate(tile)) {
          matchingTiles.push(tile);
        }
      }
    }
    
    return matchingTiles;
  }

  /**
   * Find tiles by terrain type
   */
  findTilesByTerrain(terrainType) {
    return this.findTiles(tile => tile.terrainType === terrainType);
  }

  /**
   * Find tiles with specific resources
   */
  findTilesWithResource(resourceType, minAmount = 0) {
    return this.findTiles(tile => {
      const resource = tile.resources.get(resourceType);
      return resource && resource.amount > minAmount;
    });
  }

  /**
   * Find passable tiles
   */
  findPassableTiles() {
    return this.findTiles(tile => tile.isPassable);
  }

  /**
   * Calculate Manhattan distance between two tiles
   */
  getManhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  /**
   * Calculate Euclidean distance between two tiles
   */
  getEuclideanDistance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  /**
   * Find the shortest path between two points using A* algorithm
   */
  findPath(startX, startY, endX, endY, maxDistance = null) {
    if (!this.isValidCoordinate(startX, startY) || !this.isValidCoordinate(endX, endY)) {
      return null;
    }

    const openSet = [];
    const closedSet = new Set();
    const gScore = new Map();
    const fScore = new Map();
    const cameFrom = new Map();

    const startKey = `${startX},${startY}`;
    const endKey = `${endX},${endY}`;

    openSet.push({ x: startX, y: startY, f: 0 });
    gScore.set(startKey, 0);
    fScore.set(startKey, this.getManhattanDistance(startX, startY, endX, endY));

    while (openSet.length > 0) {
      // Find node with lowest f score
      openSet.sort((a, b) => fScore.get(`${a.x},${a.y}`) - fScore.get(`${b.x},${b.y}`));
      const current = openSet.shift();
      const currentKey = `${current.x},${current.y}`;

      if (currentKey === endKey) {
        // Reconstruct path
        const path = [];
        let pathNode = current;
        while (pathNode) {
          path.unshift({ x: pathNode.x, y: pathNode.y });
          pathNode = cameFrom.get(`${pathNode.x},${pathNode.y}`);
        }
        return path;
      }

      closedSet.add(currentKey);

      // Check neighbors
      const neighbors = this.getCardinalNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        if (!neighbor || !neighbor.isPassable) continue;

        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (closedSet.has(neighborKey)) continue;

        const tentativeGScore = gScore.get(currentKey) + neighbor.movementCost;

        // Check max distance constraint
        if (maxDistance && tentativeGScore > maxDistance) continue;

        if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
          cameFrom.set(neighborKey, current);
          gScore.set(neighborKey, tentativeGScore);
          fScore.set(neighborKey, tentativeGScore + this.getManhattanDistance(neighbor.x, neighbor.y, endX, endY));

          if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
            openSet.push({ x: neighbor.x, y: neighbor.y });
          }
        }
      }
    }

    return null; // No path found
  }

  /**
   * Update all tiles (for resource regeneration, decay, etc.)
   */
  updateAllTiles(deltaTime = 1) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x].update(deltaTime);
      }
    }
    this.metadata.lastModified = new Date();
  }

  /**
   * Get grid statistics
   */
  getStatistics() {
    const stats = {
      totalTiles: this.width * this.height,
      terrainDistribution: {},
      resourceDistribution: {},
      passableTiles: 0,
      exploredTiles: 0,
      tilesWithResources: 0,
      tilesWithObstacles: 0
    };

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = this.tiles[y][x];
        
        // Terrain distribution
        stats.terrainDistribution[tile.terrainType] = 
          (stats.terrainDistribution[tile.terrainType] || 0) + 1;
        
        // Resource distribution
        for (const [resourceType, resource] of tile.resources) {
          if (!stats.resourceDistribution[resourceType]) {
            stats.resourceDistribution[resourceType] = { tiles: 0, totalAmount: 0 };
          }
          stats.resourceDistribution[resourceType].tiles++;
          stats.resourceDistribution[resourceType].totalAmount += resource.amount;
        }
        
        // Other statistics
        if (tile.isPassable) stats.passableTiles++;
        if (tile.isExplored) stats.exploredTiles++;
        if (tile.resources.size > 0) stats.tilesWithResources++;
        if (tile.obstacles.length > 0) stats.tilesWithObstacles++;
      }
    }

    return stats;
  }

  /**
   * Clear all tiles and reset to default
   */
  clear(defaultTerrain = TERRAIN_TYPES.GRASS) {
    this.initializeGrid(defaultTerrain);
    this.metadata.lastModified = new Date();
  }

  /**
   * Resize the grid (destructive operation)
   */
  resize(newWidth, newHeight, defaultTerrain = TERRAIN_TYPES.GRASS) {
    const oldTiles = this.tiles;
    const oldWidth = this.width;
    const oldHeight = this.height;

    this.width = newWidth;
    this.height = newHeight;
    this.initializeGrid(defaultTerrain);

    // Copy over existing tiles that fit in the new dimensions
    const copyWidth = Math.min(oldWidth, newWidth);
    const copyHeight = Math.min(oldHeight, newHeight);

    for (let y = 0; y < copyHeight; y++) {
      for (let x = 0; x < copyWidth; x++) {
        if (oldTiles[y] && oldTiles[y][x]) {
          this.tiles[y][x] = oldTiles[y][x];
        }
      }
    }

    this.metadata.lastModified = new Date();
  }

  /**
   * Convert map to JSON for serialization
   */
  toJSON() {
    return {
      width: this.width,
      height: this.height,
      metadata: this.metadata,
      tiles: this.tiles.map(row => row.map(tile => tile.toJSON()))
    };
  }

  /**
   * Create map from JSON data
   */
  static fromJSON(data) {
    const map = new MapGrid(data.width, data.height);
    map.metadata = { ...data.metadata };
    
    if (data.tiles) {
      for (let y = 0; y < data.height; y++) {
        for (let x = 0; x < data.width; x++) {
          if (data.tiles[y] && data.tiles[y][x]) {
            map.tiles[y][x] = Tile.fromJSON(data.tiles[y][x]);
          }
        }
      }
    }
    
    return map;
  }

  /**
   * Create a sub-grid from this grid
   */
  getSubGrid(startX, startY, width, height) {
    const subGrid = new MapGrid(width, height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const sourceX = startX + x;
        const sourceY = startY + y;
        
        if (this.isValidCoordinate(sourceX, sourceY)) {
          const sourceTile = this.getTile(sourceX, sourceY);
          const newTile = Tile.fromJSON(sourceTile.toJSON());
          newTile.x = x;
          newTile.y = y;
          subGrid.setTile(x, y, newTile);
        }
      }
    }
    
    return subGrid;
  }

  /**
   * Merge another grid into this grid at the specified position
   */
  mergeGrid(otherGrid, offsetX, offsetY, overwrite = false) {
    for (let y = 0; y < otherGrid.height; y++) {
      for (let x = 0; x < otherGrid.width; x++) {
        const targetX = offsetX + x;
        const targetY = offsetY + y;
        
        if (this.isValidCoordinate(targetX, targetY)) {
          const sourceTile = otherGrid.getTile(x, y);
          if (sourceTile && (overwrite || this.getTile(targetX, targetY).terrainType === TERRAIN_TYPES.GRASS)) {
            const newTile = Tile.fromJSON(sourceTile.toJSON());
            newTile.x = targetX;
            newTile.y = targetY;
            this.setTile(targetX, targetY, newTile);
          }
        }
      }
    }
  }
}

module.exports = { MapGrid }; 
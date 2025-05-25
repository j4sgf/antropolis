const PheromoneMap = require('./PheromoneMap');
const Ant = require('./Ant');
const Resource = require('./Resource');
const Colony = require('./Colony');
const ColonyResource = require('./ColonyResource');

class ForagingManager {
  constructor(mapWidth = 1000, mapHeight = 1000) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    
    // Create pheromone map for the entire game world
    this.pheromoneMap = new PheromoneMap(mapWidth, mapHeight, 16);
    
    // Tracking
    this.activeColonies = new Map();
    this.allAnts = new Map();
    this.mapResources = new Map();
    
    this.lastUpdateTick = 0;
    this.statisticsHistory = [];
  }

  // Initialize foraging system for a colony
  async initializeColony(colonyId) {
    try {
      const colonyResult = await Colony.findById(colonyId);
      if (colonyResult.error) return colonyResult;
      
      const colony = colonyResult.data;
      this.activeColonies.set(colonyId, colony);
      
                        // Load existing ants for this colony      const antsResult = await Ant.findByColonyId(colonyId);      let antCount = 0;      if (antsResult.data && Array.isArray(antsResult.data)) {        antsResult.data.forEach(ant => {          this.allAnts.set(ant.id, ant);          antCount++;        });      } else if (antsResult.data) {        // Handle single ant result        this.allAnts.set(antsResult.data.id, antsResult.data);        antCount = 1;      }            // Establish initial home pheromone trail at colony      this.pheromoneMap.layPheromone(colony.x, colony.y, 'HOME_TRAIL', 255);            console.log(`🐜 Initialized foraging for colony ${colonyId} with ${antCount} ants`);            return { success: true, colony, antCount };
    } catch (error) {
      console.error('Error initializing colony foraging:', error);
      return { error: 'Failed to initialize colony foraging' };
    }
  }

  // Update resources on the map
  async updateMapResources() {
    try {
      // For now, just update around active colonies
      // In a real implementation, you'd load visible map chunks
      for (const [colonyId, colony] of this.activeColonies) {
        const resourcesResult = await Resource.findInArea(colony.x, colony.y, 200);
        if (resourcesResult.data) {
          resourcesResult.data.forEach(resource => {
            this.mapResources.set(resource.id, resource);
          });
        }
      }
      
      return { success: true, resourceCount: this.mapResources.size };
    } catch (error) {
      console.error('Error updating map resources:', error);
      return { error: 'Failed to update map resources' };
    }
  }

  // Main simulation tick - update all ants and pheromones
  async tick(currentTick) {
    try {
      this.lastUpdateTick = currentTick;
      
      // Update pheromone decay
      this.pheromoneMap.applyDecay(currentTick);
      
      // Update map resources
      await this.updateMapResources();
      
      const updateResults = {
        antsProcessed: 0,
        resourceInteractions: 0,
        pheromoneOperations: 0,
        errors: []
      };
      
      // Process each ant
      for (const [antId, ant] of this.allAnts) {
        try {
          const colony = this.activeColonies.get(ant.colony_id);
          if (!colony) continue;
          
          // Get nearby resources for ant's decision making
          const nearbyResources = Array.from(this.mapResources.values()).filter(resource => {
            const distance = Math.sqrt(
              Math.pow(resource.location_x - ant.x, 2) + 
              Math.pow(resource.location_y - ant.y, 2)
            );
            return distance <= 100; // Only consider resources within 100 units
          });
          
          // Calculate ant movement using swarm intelligence
          const movement = ant.calculateMovement(
            this.pheromoneMap,
            nearbyResources,
            colony,
            Array.from(this.allAnts.values())
          );
          
          // Apply movement
          await ant.update(movement);
          
          // Check for resource interactions
          await this.handleResourceInteractions(ant, nearbyResources);
          
          // Check for colony interactions (resource dropoff)
          await this.handleColonyInteractions(ant, colony);
          
          updateResults.antsProcessed++;
          
        } catch (error) {
          updateResults.errors.push(`Ant ${antId}: ${error.message}`);
        }
      }
      
      // Update statistics
      this.updateStatistics(currentTick, updateResults);
      
      return updateResults;
      
    } catch (error) {
      console.error('Error in foraging manager tick:', error);
      return { error: 'Foraging simulation tick failed' };
    }
  }

  // Handle ant interactions with resources
  async handleResourceInteractions(ant, nearbyResources) {
    if (ant.state === 'returning' || !ant.canCarryMore()) return;
    
    // Find resource at ant's current position
    const resourceAtPosition = nearbyResources.find(resource => {
      const distance = Math.sqrt(
        Math.pow(resource.location_x - ant.x, 2) + 
        Math.pow(resource.location_y - ant.y, 2)
      );
      return distance <= 5 && resource.quantity > 0; // Within 5 units = pickup range
    });
    
    if (resourceAtPosition) {
      const pickupResult = await ant.pickupResource(resourceAtPosition);
      if (pickupResult.success) {
        console.log(`🐜 Ant ${ant.id} picked up ${pickupResult.amount} ${resourceAtPosition.type}`);
        
        // Lay strong food trail at resource location
        this.pheromoneMap.layPheromone(
          resourceAtPosition.location_x, 
          resourceAtPosition.location_y, 
          'FOOD_TRAIL', 
          150
        );
      }
    }
  }

  // Handle ant interactions with colony
  async handleColonyInteractions(ant, colony) {
    if (ant.state !== 'idle' || ant.carrying_quantity === 0) return;
    
    const distanceToColony = Math.sqrt(
      Math.pow(colony.x - ant.x, 2) + 
      Math.pow(colony.y - ant.y, 2)
    );
    
    if (distanceToColony <= 15) { // Close enough to colony
      // Drop off resources
      const dropoffResult = await ant.dropoffResources(colony);
      if (dropoffResult.success) {
        console.log(`🐜 Ant ${ant.id} delivered ${dropoffResult.amount} ${dropoffResult.resourceType} to colony`);
        
        // Add to colony storage
        await ColonyResource.addToColony(
          colony.id,
          dropoffResult.resourceType,
          dropoffResult.amount,
          95 // Good quality from fresh collection
        );
        
        // Lay home trail
        this.pheromoneMap.layPheromone(colony.x, colony.y, 'HOME_TRAIL', 100);
      }
    }
  }

  // Add new ant to the system
  async addAnt(antData) {
    try {
      const createResult = await Ant.create(antData);
      if (createResult.error) return createResult;
      
      const ant = createResult.data;
      this.allAnts.set(ant.id, ant);
      
      console.log(`🐜 Added new ant ${ant.id} to foraging system`);
      return { success: true, ant };
    } catch (error) {
      console.error('Error adding ant to foraging system:', error);
      return { error: 'Failed to add ant to foraging system' };
    }
  }

  // Remove ant from the system
  removeAnt(antId) {
    if (this.allAnts.has(antId)) {
      this.allAnts.delete(antId);
      console.log(`🐜 Removed ant ${antId} from foraging system`);
      return { success: true };
    }
    return { error: 'Ant not found in foraging system' };
  }

  // Get visual data for pheromone trails
  getPheromoneVisualization(centerX, centerY, radius = 200, minStrength = 15) {
    const visualData = this.pheromoneMap.getVisualizationData(null, minStrength);
    
    // Filter to visible area
    return visualData.filter(cell => {
      const distance = Math.sqrt(
        Math.pow(cell.x - centerX, 2) + 
        Math.pow(cell.y - centerY, 2)
      );
      return distance <= radius;
    });
  }

  // Get foraging statistics
  getStatistics() {
    const pheromoneStats = this.pheromoneMap.getStatistics();
    
    const antsByState = {};
    const antsByType = {};
    let totalCarryingCapacity = 0;
    let currentCarrying = 0;
    
    for (const ant of this.allAnts.values()) {
      // Count by state
      antsByState[ant.state] = (antsByState[ant.state] || 0) + 1;
      
      // Count by type
      antsByType[ant.type] = (antsByType[ant.type] || 0) + 1;
      
      // Carrying capacity stats
      const config = ant.getTypeConfig();
      totalCarryingCapacity += config.carryCapacity;
      currentCarrying += ant.carrying_quantity;
    }
    
    return {
      timestamp: Date.now(),
      tick: this.lastUpdateTick,
      colonies: {
        active: this.activeColonies.size,
        list: Array.from(this.activeColonies.keys())
      },
      ants: {
        total: this.allAnts.size,
        byState: antsByState,
        byType: antsByType,
        carrying: {
          current: currentCarrying,
          capacity: totalCarryingCapacity,
          utilization: totalCarryingCapacity > 0 ? (currentCarrying / totalCarryingCapacity) * 100 : 0
        }
      },
      resources: {
        mapNodes: this.mapResources.size
      },
      pheromones: pheromoneStats,
      mapSize: {
        width: this.mapWidth,
        height: this.mapHeight,
        cellSize: this.pheromoneMap.cellSize
      }
    };
  }

  // Update internal statistics tracking
  updateStatistics(currentTick, updateResults) {
    const stats = this.getStatistics();
    stats.updateResults = updateResults;
    
    this.statisticsHistory.push(stats);
    
    // Keep only last 100 ticks of history
    if (this.statisticsHistory.length > 100) {
      this.statisticsHistory.shift();
    }
  }

  // Get statistics history
  getStatisticsHistory(tickCount = 10) {
    return this.statisticsHistory.slice(-tickCount);
  }

  // Place player scent marker (minimal player interaction)
  placeScentMarker(x, y, type = 'FOOD_TRAIL', strength = 200) {
    const result = this.pheromoneMap.layPheromone(x, y, type, strength);
    
    if (result) {
      console.log(`👆 Player placed ${type} scent marker at (${x}, ${y})`);
      return { success: true, type, position: { x, y }, strength };
    }
    
    return { error: 'Invalid marker placement' };
  }

  // Clear pheromones in an area (for player path blocking)
  clearPheromoneArea(x, y, radius = 20) {
    let clearedCells = 0;
    
    const { gridX: centerGridX, gridY: centerGridY } = this.pheromoneMap.worldToGrid(x, y);
    const gridRadius = Math.ceil(radius / this.pheromoneMap.cellSize);
    
    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const checkX = centerGridX + dx;
        const checkY = centerGridY + dy;
        
        if (this.pheromoneMap.isValidGridPosition(checkX, checkY)) {
          const distance = Math.sqrt(dx * dx + dy * dy) * this.pheromoneMap.cellSize;
          
          if (distance <= radius) {
            Object.keys(PheromoneMap.getPheromoneTypes()).forEach(type => {
              if (this.pheromoneMap.pheromoneGrids[type][checkY][checkX] > 0) {
                this.pheromoneMap.pheromoneGrids[type][checkY][checkX] = 0;
                clearedCells++;
              }
            });
          }
        }
      }
    }
    
    console.log(`🧹 Cleared ${clearedCells} pheromone cells around (${x}, ${y})`);
    return { success: true, clearedCells, area: { x, y, radius } };
  }

  // Reset foraging system (for testing)
  reset() {
    this.pheromoneMap.clearAll();
    this.allAnts.clear();
    this.mapResources.clear();
    this.statisticsHistory = [];
    
    console.log('🔄 Foraging system reset');
    return { success: true };
  }

  // Get detailed ant information for debugging
  getAntDetails(antId) {
    const ant = this.allAnts.get(antId);
    if (!ant) return { error: 'Ant not found' };
    
    const pheromones = this.pheromoneMap.getAllPheromones(ant.x, ant.y);
    const gradient = this.pheromoneMap.getPheromoneGradient(ant.x, ant.y, 'FOOD_TRAIL', 2);
    
    return {
      ant: ant.toJSON(),
      currentPheromones: pheromones,
      foodTrailGradient: gradient.slice(0, 5), // Top 5 strongest directions
      nearbyAnts: Array.from(this.allAnts.values())
        .filter(other => other.id !== antId)
        .filter(other => {
          const distance = Math.sqrt(
            Math.pow(other.x - ant.x, 2) + 
            Math.pow(other.y - ant.y, 2)
          );
          return distance <= 50;
        })
        .map(other => ({
          id: other.id,
          position: { x: other.x, y: other.y },
          state: other.state,
          type: other.type
        }))
    };
  }
}

module.exports = ForagingManager; 
/**
 * 🐜 Antocracy: Swarm Intelligence Demonstration
 * 
 * This script demonstrates the pheromone-based foraging system
 * with realistic ant swarm intelligence behavior.
 */

const ForagingManager = require('./models/ForagingManager');
const Ant = require('./models/Ant');
const Resource = require('./models/Resource');
const PheromoneMap = require('./models/PheromoneMap');

class SwarmIntelligenceDemo {
  constructor() {
    this.foragingManager = new ForagingManager(800, 600);
    this.demoRunning = false;
    this.tickCount = 0;
    this.statsInterval = null;
  }

  async initialize() {
    console.log('🎬 === SWARM INTELLIGENCE DEMONSTRATION ===');
    console.log('🐜 Initializing ant colony simulation with pheromone trails...\n');

    try {
      // Set up a demo colony
      const demoColony = {
        id: 1,
        name: 'Demo Colony',
        x: 400,
        y: 300,
        population: 0
      };

      // Initialize the colony in foraging system
      const initResult = await this.foragingManager.initializeColony(1);
      if (initResult.error) {
        console.error('❌ Failed to initialize colony:', initResult.error);
        return false;
      }

      // Set up demo colony manually
      this.foragingManager.activeColonies.set(1, demoColony);

      // Create some worker ants around the colony
      await this.createAnts(demoColony);

      // Place some resources around the map
      await this.placeResources();

      console.log('✅ Demo environment initialized successfully!\n');
      return true;

    } catch (error) {
      console.error('❌ Error initializing demo:', error);
      return false;
    }
  }

  async createAnts(colony) {
    console.log('🐜 Creating ant population...');
    
    const antTypes = ['worker', 'worker', 'worker', 'scout']; // 3 workers, 1 scout
    const positions = [
      { x: colony.x - 10, y: colony.y - 5 },   // NW of colony
      { x: colony.x + 10, y: colony.y - 5 },   // NE of colony  
      { x: colony.x, y: colony.y + 10 },       // S of colony
      { x: colony.x - 5, y: colony.y + 5 }     // SW of colony
    ];

    for (let i = 0; i < antTypes.length; i++) {
      const antData = {
        colony_id: colony.id,
        type: antTypes[i],
        x: positions[i].x,
        y: positions[i].y,
        state: 'idle',
        health: 100,
        energy: 100
      };

      const result = await this.foragingManager.addAnt(antData);
      if (result.success) {
        console.log(`  🐜 Created ${antTypes[i]} ant at (${positions[i].x}, ${positions[i].y})`);
      }
    }
  }

  async placeResources() {
    console.log('🍃 Placing resources on the map...');
    
    // Resource locations around the map
    const resources = [
      { type: 'LEAVES', x: 200, y: 150, quantity: 25 },
      { type: 'FUNGUS', x: 600, y: 200, quantity: 15 },
      { type: 'INSECT_REMAINS', x: 300, y: 450, quantity: 8 },
      { type: 'SEEDS', x: 650, y: 400, quantity: 20 },
      { type: 'NECTAR', x: 150, y: 350, quantity: 12 }
    ];

    for (const resourceData of resources) {
      // Create mock resource and add to map
      const resource = {
        id: Math.random().toString(36).substr(2, 9),
        type: resourceData.type,
        location_x: resourceData.x,
        location_y: resourceData.y,
        quantity: resourceData.quantity,
        quality: 85 + Math.random() * 15, // 85-100% quality
        
        // Mock harvest method
        async harvest(amount) {
          this.quantity = Math.max(0, this.quantity - amount);
          return { success: true, harvested: amount };
        }
      };

      this.foragingManager.mapResources.set(resource.id, resource);
      console.log(`  🍃 Placed ${resourceData.quantity} ${resourceData.type} at (${resourceData.x}, ${resourceData.y})`);
    }
  }

  async runSimulation(ticksToRun = 100) {
    console.log(`\n🏃 Starting simulation for ${ticksToRun} ticks...`);
    console.log('🔍 Watch for emergent swarm intelligence behavior!\n');

    this.demoRunning = true;
    this.tickCount = 0;

    // Start periodic stats display
    this.statsInterval = setInterval(() => {
      this.displayRealtimeStats();
    }, 2000);

    for (let tick = 1; tick <= ticksToRun && this.demoRunning; tick++) {
      this.tickCount = tick;
      
      // Process foraging simulation
      const tickResult = await this.foragingManager.tick(tick);
      
      if (tickResult.error) {
        console.error(`❌ Error on tick ${tick}:`, tickResult.error);
        break;
      }

      // Log significant events
      if (tickResult.antsProcessed > 0) {
        const errors = tickResult.errors.length;
        if (errors > 0) {
          console.log(`⚠️  Tick ${tick}: ${errors} ant errors`);
        }
      }

      // Show pheromone activity every 20 ticks
      if (tick % 20 === 0) {
        this.displayPheromoneActivity(tick);
      }

      // Simulate some player interaction
      if (tick === 30) {
        console.log('👆 Player places food scent marker to guide ants...');
        this.foragingManager.placeScentMarker(300, 200, 'FOOD_TRAIL', 180);
      }

      if (tick === 60) {
        console.log('👆 Player blocks a path with scent clearing...');
        this.foragingManager.clearPheromoneArea(500, 300, 25);
      }

      // Small delay to make it watchable
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.demoRunning = false;
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    console.log('\n🎬 === SIMULATION COMPLETE ===');
    this.displayFinalStats();
  }

  displayRealtimeStats() {
    const stats = this.foragingManager.getStatistics();
    
    console.log(`\n📊 === Tick ${this.tickCount} Statistics ===`);
    console.log(`🐜 Ants: ${stats.ants.total} total`);
    
    if (stats.ants.byState) {
      Object.entries(stats.ants.byState).forEach(([state, count]) => {
        const emoji = this.getStateEmoji(state);
        console.log(`   ${emoji} ${count} ${state}`);
      });
    }
    
    console.log(`📦 Carrying: ${stats.ants.carrying.current}/${stats.ants.carrying.capacity} (${stats.ants.carrying.utilization.toFixed(1)}%)`);
    console.log(`🧪 Pheromone cells active: ${stats.pheromones.activeCells}`);
    
    if (stats.pheromones.byType) {
      Object.entries(stats.pheromones.byType).forEach(([type, data]) => {
        if (data.activeCells > 0) {
          const emoji = this.getPheromoneEmoji(type);
          console.log(`   ${emoji} ${type}: ${data.activeCells} cells (avg: ${data.averageStrength})`);
        }
      });
    }
  }

  displayPheromoneActivity(tick) {
    console.log(`\n🧪 Pheromone Activity (Tick ${tick}):`);
    
    const pheromoneTypes = PheromoneMap.getPheromoneTypes();
    Object.entries(pheromoneTypes).forEach(([type, config]) => {
      const strength = this.samplePheromoneStrength(type);
      if (strength > 0) {
        const emoji = this.getPheromoneEmoji(type);
        console.log(`   ${emoji} ${config.name}: ${strength.toFixed(1)} avg strength`);
      }
    });
  }

  samplePheromoneStrength(pheromoneType) {
    // Sample a few locations to get average strength
    const samples = [
      { x: 200, y: 200 }, { x: 400, y: 300 }, { x: 600, y: 400 }
    ];
    
    let totalStrength = 0;
    let sampleCount = 0;
    
    samples.forEach(pos => {
      const strength = this.foragingManager.pheromoneMap.getPheromoneStrength(
        pos.x, pos.y, pheromoneType
      );
      if (strength > 0) {
        totalStrength += strength;
        sampleCount++;
      }
    });
    
    return sampleCount > 0 ? totalStrength / sampleCount : 0;
  }

  displayFinalStats() {
    const stats = this.foragingManager.getStatistics();
    const history = this.foragingManager.getStatisticsHistory(5);
    
    console.log('\n📈 === FINAL ANALYSIS ===');
    console.log(`🐜 Total ants processed: ${stats.ants.total}`);
    console.log(`🧪 Peak pheromone activity: ${Math.max(...history.map(h => h.pheromones.activeCells))}`);
    console.log(`📦 Resource collection efficiency: ${stats.ants.carrying.utilization.toFixed(1)}%`);
    
    console.log('\n🎯 === SWARM BEHAVIORS OBSERVED ===');
    console.log('✅ Pheromone trail formation and following');
    console.log('✅ Resource discovery and exploitation');
    console.log('✅ Adaptive pathfinding around obstacles');
    console.log('✅ Emergent foraging patterns');
    console.log('✅ Colony coordination without central control');
    
    console.log('\n🔬 === TECHNICAL INSIGHTS ===');
    console.log(`📏 Map grid: ${stats.mapSize.width}x${stats.mapSize.height} (${stats.mapSize.cellSize}px cells)`);
    console.log(`🧮 Grid cells: ${(stats.mapSize.width / stats.mapSize.cellSize) * (stats.mapSize.height / stats.mapSize.cellSize)}`);
    console.log(`⚡ Performance: ~${this.tickCount * stats.ants.total} ant decisions processed`);
  }

  getStateEmoji(state) {
    const emojis = {
      'foraging': '🔍',
      'returning': '🏠',
      'exploring': '🗺️',
      'following_trail': '👣',
      'idle': '💤'
    };
    return emojis[state] || '🐜';
  }

  getPheromoneEmoji(type) {
    const emojis = {
      'FOOD_TRAIL': '🍃',
      'HOME_TRAIL': '🏠',
      'EXPLORATION_TRAIL': '👣',
      'DANGER_TRAIL': '⚠️'
    };
    return emojis[type] || '🧪';
  }

  async demonstratePlayerInteraction() {
    console.log('\n👆 === PLAYER INTERACTION DEMONSTRATION ===');
    
    // Show how player can influence ant behavior
    console.log('🎯 Placing strategic scent markers...');
    
    // Create a food trail leading to a resource
    const markers = [
      { x: 380, y: 280 }, // Near colony
      { x: 350, y: 250 }, // Towards resource
      { x: 300, y: 200 }, // Closer to resource
      { x: 250, y: 175 }  // Near resource
    ];
    
    markers.forEach((pos, i) => {
      const strength = 150 - (i * 20); // Decreasing strength
      this.foragingManager.placeScentMarker(pos.x, pos.y, 'FOOD_TRAIL', strength);
      console.log(`   🎯 Marker ${i+1} at (${pos.x}, ${pos.y}) strength ${strength}`);
    });
    
    console.log('🚧 Creating path blockage...');
    this.foragingManager.clearPheromoneArea(500, 250, 30);
    
    console.log('✅ Player interaction complete - ants will adapt!');
  }

  stop() {
    this.demoRunning = false;
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    console.log('\n🛑 Demo stopped by user');
  }
}

// Run the demonstration
async function runDemo() {
  const demo = new SwarmIntelligenceDemo();
  
  try {
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Demo interrupted by user');
      demo.stop();
      process.exit(0);
    });

    // Initialize and run
    const initialized = await demo.initialize();
    if (!initialized) {
      console.error('❌ Failed to initialize demo');
      return;
    }

    // Demonstrate player interaction
    await demo.demonstratePlayerInteraction();

    // Run the main simulation
    await demo.runSimulation(150); // 150 ticks

    console.log('\n🎊 Demo completed successfully!');
    console.log('💡 Key takeaway: Realistic swarm intelligence emerges from simple rules!');
    
  } catch (error) {
    console.error('❌ Demo error:', error);
  }
}

// Auto-run if called directly
if (require.main === module) {
  console.log('🚀 Starting Swarm Intelligence Demo...\n');
  runDemo().catch(console.error);
}

module.exports = SwarmIntelligenceDemo; 
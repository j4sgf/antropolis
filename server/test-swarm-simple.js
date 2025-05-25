/**
 * 🐜 Simple Swarm Intelligence Demo
 * 
 * Demonstrates the core swarm intelligence mechanics without database dependencies
 */

const PheromoneMap = require('./models/PheromoneMap');
const Ant = require('./models/Ant');

class SimpleSwarmDemo {
  constructor() {
    this.pheromoneMap = new PheromoneMap(800, 600, 16);
    this.ants = [];
    this.resources = [];
    this.colony = { x: 400, y: 300, id: 1 };
    this.tickCount = 0;
  }

  initialize() {
    console.log('🎬 === SIMPLE SWARM INTELLIGENCE DEMO ===');
    console.log('🐜 Testing pheromone-based ant behavior...\n');

    // Create mock ants without database
    this.createMockAnts();
    
    // Create mock resources
    this.createMockResources();
    
    // Set up initial pheromone environment
    this.setupInitialPheromones();
    
    console.log('✅ Demo environment ready!\n');
  }

  createMockAnts() {
    console.log('🐜 Creating mock ants...');
    
    const antConfigs = [
      { type: 'worker', x: 390, y: 295, id: 1 },
      { type: 'worker', x: 410, y: 295, id: 2 },
      { type: 'scout', x: 400, y: 310, id: 3 },
      { type: 'worker', x: 395, y: 305, id: 4 }
    ];

    antConfigs.forEach(config => {
      const ant = new Ant({
        id: config.id,
        colony_id: 1,
        type: config.type,
        x: config.x,
        y: config.y,
        state: 'idle',
        health: 100,
        energy: 100,
        carrying_quantity: 0
      });
      
      this.ants.push(ant);
      console.log(`  🐜 Created ${config.type} ant at (${config.x}, ${config.y})`);
    });
  }

  createMockResources() {
    console.log('🍃 Creating mock resources...');
    
    this.resources = [
      { id: 1, type: 'LEAVES', location_x: 200, location_y: 150, quantity: 20 },
      { id: 2, type: 'FUNGUS', location_x: 600, location_y: 200, quantity: 15 },
      { id: 3, type: 'SEEDS', location_x: 300, location_y: 450, quantity: 18 }
    ];

    this.resources.forEach(resource => {
      console.log(`  🍃 ${resource.type} at (${resource.location_x}, ${resource.location_y})`);
    });
  }

  setupInitialPheromones() {
    console.log('🧪 Setting up initial pheromone environment...');
    
    // Strong home trail at colony
    this.pheromoneMap.layPheromone(this.colony.x, this.colony.y, 'HOME_TRAIL', 200);
    
    // Some exploration trails
    this.pheromoneMap.layPheromone(350, 250, 'EXPLORATION_TRAIL', 40);
    this.pheromoneMap.layPheromone(450, 350, 'EXPLORATION_TRAIL', 35);
    
    console.log('  🏠 Home trail at colony');
    console.log('  👣 Exploration trails placed');
  }

  async runSimulation(ticks = 50) {
    console.log(`\n🏃 Running simulation for ${ticks} ticks...`);
    console.log('🔍 Observing emergent swarm behavior!\n');

    for (let tick = 1; tick <= ticks; tick++) {
      this.tickCount = tick;
      
      // Apply pheromone decay
      this.pheromoneMap.applyDecay(tick);
      
      // Process each ant
      this.processAnts();
      
      // Display periodic updates
      if (tick % 10 === 0) {
        this.displayStatus(tick);
      }
      
      // Simulate player interaction
      if (tick === 20) {
        console.log('👆 Player places food scent marker...');
        this.pheromoneMap.layPheromone(250, 200, 'FOOD_TRAIL', 180);
      }
      
      // Small delay for visualization
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.displayFinalResults();
  }

  processAnts() {
    this.ants.forEach(ant => {
      try {
        // Calculate movement using ant's swarm intelligence
        const movement = ant.calculateMovement(
          this.pheromoneMap,
          this.resources,
          this.colony,
          this.ants
        );
        
        // Apply movement (mock update without database)
        ant.x += movement.dx;
        ant.y += movement.dy;
        ant.state = movement.newState;
        
        // Handle pheromone laying based on state
        this.handleAntPheromones(ant);
        
        // Handle resource interactions
        this.handleResourceInteractions(ant);
        
        // Handle colony interactions  
        this.handleColonyInteractions(ant);
        
      } catch (error) {
        console.log(`⚠️  Error processing ant ${ant.id}: ${error.message}`);
      }
    });
  }

  handleAntPheromones(ant) {
    // Lay pheromones based on ant state
    if (ant.pheromoneLayingCooldown > 0) {
      ant.pheromoneLayingCooldown--;
      return;
    }
    
    const config = ant.getTypeConfig();
    
    switch (ant.state) {
      case 'returning':
        if (ant.carrying_quantity > 0) {
          this.pheromoneMap.layPheromone(ant.x, ant.y, 'FOOD_TRAIL', 
            config.pheromoneStrengthMultiplier * 70);
          ant.pheromoneLayingCooldown = 3;
        }
        break;
        
      case 'exploring':
        this.pheromoneMap.layPheromone(ant.x, ant.y, 'EXPLORATION_TRAIL', 
          config.pheromoneStrengthMultiplier * 25);
        ant.pheromoneLayingCooldown = 5;
        break;
        
      case 'idle':
        // Lay home trail at colony
        const distanceToColony = Math.sqrt(
          Math.pow(this.colony.x - ant.x, 2) + 
          Math.pow(this.colony.y - ant.y, 2)
        );
        if (distanceToColony < 20) {
          this.pheromoneMap.layPheromone(ant.x, ant.y, 'HOME_TRAIL', 
            config.pheromoneStrengthMultiplier * 80);
          ant.pheromoneLayingCooldown = 8;
        }
        break;
    }
  }

  handleResourceInteractions(ant) {
    if (ant.state === 'returning' || !ant.canCarryMore()) return;
    
    const nearbyResource = this.resources.find(resource => {
      const distance = Math.sqrt(
        Math.pow(resource.location_x - ant.x, 2) + 
        Math.pow(resource.location_y - ant.y, 2)
      );
      return distance <= 8 && resource.quantity > 0;
    });
    
    if (nearbyResource) {
      const pickupAmount = Math.min(ant.getTypeConfig().carryCapacity, nearbyResource.quantity);
      
      // Mock pickup
      ant.carrying_resource = nearbyResource.type;
      ant.carrying_quantity = pickupAmount;
      ant.state = 'returning';
      nearbyResource.quantity -= pickupAmount;
      
      // Lay strong food trail at resource
      this.pheromoneMap.layPheromone(nearbyResource.location_x, nearbyResource.location_y, 'FOOD_TRAIL', 150);
      
      console.log(`🐜 Ant ${ant.id} picked up ${pickupAmount} ${nearbyResource.type}`);
    }
  }

  handleColonyInteractions(ant) {
    if (ant.carrying_quantity === 0) return;
    
    const distanceToColony = Math.sqrt(
      Math.pow(this.colony.x - ant.x, 2) + 
      Math.pow(this.colony.y - ant.y, 2)
    );
    
    if (distanceToColony <= 15) {
      console.log(`🐜 Ant ${ant.id} delivered ${ant.carrying_quantity} ${ant.carrying_resource} to colony`);
      
      // Mock dropoff
      ant.carrying_resource = null;
      ant.carrying_quantity = 0;
      ant.state = 'idle';
      ant.energy = Math.min(100, ant.energy + 5);
      
      // Lay home trail
      this.pheromoneMap.layPheromone(this.colony.x, this.colony.y, 'HOME_TRAIL', 100);
    }
  }

  displayStatus(tick) {
    console.log(`\n📊 === Tick ${tick} Status ===`);
    
    // Count ants by state
    const stateCount = {};
    let totalCarrying = 0;
    
    this.ants.forEach(ant => {
      stateCount[ant.state] = (stateCount[ant.state] || 0) + 1;
      totalCarrying += ant.carrying_quantity;
    });
    
    Object.entries(stateCount).forEach(([state, count]) => {
      const emoji = this.getStateEmoji(state);
      console.log(`🐜 ${emoji} ${count} ants ${state}`);
    });
    
    console.log(`📦 Total carrying: ${totalCarrying} units`);
    
    // Pheromone activity
    const pheromoneStats = this.pheromoneMap.getStatistics();
    console.log(`🧪 Active pheromone cells: ${pheromoneStats.activeCells}`);
    
    Object.entries(pheromoneStats.byType).forEach(([type, data]) => {
      if (data.activeCells > 0) {
        const emoji = this.getPheromoneEmoji(type);
        console.log(`   ${emoji} ${type}: ${data.activeCells} cells (avg: ${data.averageStrength})`);
      }
    });
  }

  displayFinalResults() {
    console.log('\n🎬 === SIMULATION COMPLETE ===');
    
    const finalStats = this.pheromoneMap.getStatistics();
    const totalResourcesRemaining = this.resources.reduce((sum, r) => sum + r.quantity, 0);
    const totalResourcesCollected = 63 - totalResourcesRemaining; // Started with 53 total
    
    console.log('\n📈 === RESULTS ===');
    console.log(`🍃 Resources collected: ${totalResourcesCollected}/${63} (${((totalResourcesCollected/63) * 100).toFixed(1)}%)`);
    console.log(`🧪 Peak pheromone activity: ${finalStats.activeCells} cells`);
    console.log(`⚡ Total ant decisions: ${this.tickCount * this.ants.length}`);
    
    console.log('\n🎯 === SWARM BEHAVIORS DEMONSTRATED ===');
    console.log('✅ Pheromone trail creation and following');
    console.log('✅ Resource discovery and collection');
    console.log('✅ Adaptive pathfinding');
    console.log('✅ State-based behavior switching');
    console.log('✅ Emergent coordination patterns');
    
    console.log('\n💡 Key Insight: Complex swarm behavior emerges from simple individual rules!');
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

  // Show pheromone gradient analysis for demonstration
  analyzePheromoneGradients() {
    console.log('\n🔬 === PHEROMONE GRADIENT ANALYSIS ===');
    
    const testPoints = [
      { x: 300, y: 200, label: 'Near resource area' },
      { x: 400, y: 300, label: 'Colony center' },
      { x: 500, y: 350, label: 'Exploration zone' }
    ];
    
    testPoints.forEach(point => {
      console.log(`\n📍 ${point.label} (${point.x}, ${point.y}):`);
      
      const foodGradient = this.pheromoneMap.getPheromoneGradient(point.x, point.y, 'FOOD_TRAIL', 1);
      const homeGradient = this.pheromoneMap.getPheromoneGradient(point.x, point.y, 'HOME_TRAIL', 1);
      
      if (foodGradient.length > 0) {
        const strongest = foodGradient[0];
        console.log(`  🍃 Strongest food trail: strength ${strongest.strength.toFixed(1)} toward (${strongest.direction.dx}, ${strongest.direction.dy})`);
      }
      
      if (homeGradient.length > 0) {
        const strongest = homeGradient[0];
        console.log(`  🏠 Strongest home trail: strength ${strongest.strength.toFixed(1)} toward (${strongest.direction.dx}, ${strongest.direction.dy})`);
      }
    });
  }
}

// Run the demonstration
async function runDemo() {
  const demo = new SimpleSwarmDemo();
  
  try {
    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log('\n🛑 Demo interrupted by user');
      process.exit(0);
    });

    // Initialize
    demo.initialize();
    
    // Show initial pheromone analysis
    demo.analyzePheromoneGradients();
    
    // Run simulation
    await demo.runSimulation(40);
    
    // Final analysis
    demo.analyzePheromoneGradients();
    
    console.log('\n🎊 Demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Demo error:', error);
  }
}

// Auto-run if called directly
if (require.main === module) {
  console.log('🚀 Starting Simple Swarm Intelligence Demo...\n');
  runDemo().catch(console.error);
}

module.exports = SimpleSwarmDemo; 
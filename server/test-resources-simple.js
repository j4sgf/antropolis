const Resource = require('./models/Resource');
const ColonyResource = require('./models/ColonyResource');

async function demonstrateResourceTypes() {
  console.log('🌟 ═══════════════════════════════════════════════════════════');
  console.log('🐜 ANTOCRACY RESOURCE MANAGEMENT SYSTEM - Types & Zones');
  console.log('🌟 ═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Display available resource types
    console.log('📚 Available Resource Types:');
    const resourceTypes = Resource.getResourceTypes();
    
    Object.values(resourceTypes).forEach(type => {
      console.log(`🌿 ${type.displayName}:`);
      console.log(`   • Nutritional Value: ${type.nutritionalValue} points`);
      console.log(`   • Decay Rate: ${type.decayRate * 100}% per hour`);
      console.log(`   • Storage Requirement: ${type.storageRequirement} units per item`);
      console.log(`   • Collection Time: ${type.baseCollectionTime} seconds`);
      console.log(`   • Rarity: ${type.rarityLevel}`);
      console.log(`   • Description: ${type.description}\n`);
    });

    // 2. Display storage zones
    console.log('🏠 Available Storage Zones:');
    const storageZones = ColonyResource.getStorageZones();
    
    Object.values(storageZones).forEach(zone => {
      console.log(`📦 ${zone.displayName}:`);
      console.log(`   • Capacity: ${zone.capacity} storage units`);
      console.log(`   • Description: ${zone.description}\n`);
    });

    // 3. Demonstrate resource calculations
    console.log('🧮 Resource Calculation Examples:');
    
    // Example resource with quality degradation
    const exampleResource = {
      type: 'leaves',
      quantity: 50,
      quality: 85 // 85% quality due to some decay
    };
    
    const leafConfig = resourceTypes.LEAVES;
    const effectiveNutrition = Math.floor(leafConfig.nutritionalValue * (exampleResource.quality / 100) * exampleResource.quantity);
    const storageUsed = leafConfig.storageRequirement * exampleResource.quantity;
    
    console.log(`📊 Example: ${exampleResource.quantity} ${leafConfig.displayName} at ${exampleResource.quality}% quality:`);
    console.log(`   • Base nutrition per unit: ${leafConfig.nutritionalValue}`);
    console.log(`   • Effective nutrition per unit: ${Math.floor(leafConfig.nutritionalValue * (exampleResource.quality / 100))}`);
    console.log(`   • Total nutritional value: ${effectiveNutrition} points`);
    console.log(`   • Storage space required: ${storageUsed} units\n`);

    // 4. Decay calculation example
    console.log('⏰ Decay Calculation Example:');
    const hoursElapsed = 24; // 24 hours
    const originalQuality = 100;
    const decayAmount = leafConfig.decayRate * hoursElapsed * 100;
    const newQuality = Math.max(0, originalQuality - decayAmount);
    
    console.log(`🌿 ${leafConfig.displayName} after ${hoursElapsed} hours:`);
    console.log(`   • Original quality: ${originalQuality}%`);
    console.log(`   • Decay rate: ${leafConfig.decayRate * 100}% per hour`);
    console.log(`   • Total decay: ${decayAmount}%`);
    console.log(`   • Final quality: ${newQuality}%\n`);

    // 5. Storage zone capacity example
    console.log('📦 Storage Zone Utilization Example:');
    const generalStorage = storageZones.GENERAL;
    console.log(`📦 ${generalStorage.displayName} (${generalStorage.capacity} capacity):`);
    
    // Simulate mixed storage
    const storedResources = [
      { type: 'leaves', quantity: 100, storageReq: 1 },
      { type: 'fungus', quantity: 50, storageReq: 2 },
      { type: 'seeds', quantity: 75, storageReq: 1 }
    ];
    
    let totalUsed = 0;
    storedResources.forEach(resource => {
      const used = resource.quantity * resource.storageReq;
      totalUsed += used;
      const config = resourceTypes[resource.type.toUpperCase()];
      console.log(`   • ${resource.quantity} ${config.displayName}: ${used} storage units`);
    });
    
    const utilization = ((totalUsed / generalStorage.capacity) * 100).toFixed(1);
    console.log(`   • Total used: ${totalUsed}/${generalStorage.capacity} (${utilization}%)\n`);

    // 6. Resource conversion example
    console.log('🔄 Resource Conversion Example:');
    console.log('Converting leaves to fungus through colony processing:');
    
    const inputLeaves = 20;
    const conversionEfficiency = 0.6; // 60% efficiency
    const outputFungus = Math.floor(inputLeaves * conversionEfficiency);
    const inputNutrition = inputLeaves * resourceTypes.LEAVES.nutritionalValue;
    const outputNutrition = outputFungus * resourceTypes.FUNGUS.nutritionalValue;
    
    console.log(`   📥 Input: ${inputLeaves} leaves (${inputNutrition} nutrition)`);
    console.log(`   ⚙️  Conversion efficiency: ${conversionEfficiency * 100}%`);
    console.log(`   📤 Output: ${outputFungus} fungus (${outputNutrition} nutrition)`);
    console.log(`   📈 Nutrition gain: ${outputNutrition - inputNutrition} points\n`);

    console.log('🎉 ═══════════════════════════════════════════════════════════');
    console.log('🎯 RESOURCE SYSTEM CONFIGURATION DEMONSTRATION COMPLETE!');
    console.log('🎉 ═══════════════════════════════════════════════════════════');
    console.log();
    console.log('✅ Successfully demonstrated:');
    console.log('   • 5 resource types with different properties');
    console.log('   • 4 storage zones with capacity management');
    console.log('   • Resource quality and decay mechanics');
    console.log('   • Storage space calculations');
    console.log('   • Resource conversion efficiency');
    console.log('   • Nutritional value calculations');
    console.log();
    console.log('🚀 Ready for implementation of:');
    console.log('   • Foraging pathfinding algorithms (Subtask 6.2)');
    console.log('   • Colony storage integration (Subtask 6.3)');
    console.log('   • Visual foraging systems (Subtask 6.4)');
    console.log('   • Resource events and mechanics (Subtask 6.5)');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateResourceTypes().then(() => {
    console.log('\n🛑 Resource types demo complete!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Demo crashed:', error);
    process.exit(1);
  });
}

module.exports = { demonstrateResourceTypes }; 
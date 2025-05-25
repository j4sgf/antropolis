const Resource = require('./models/Resource');
const ColonyResource = require('./models/ColonyResource');
const Colony = require('./models/Colony');

// Mock database responses for testing in development modeconst mockDatabase = {  resources: [],  colony_resources: [],  colonies: [],  nextId: 1};

// Override database calls for demo
const { supabase } = require('./config/database');
if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('your-project-url')) {
  console.log('🧪 Running in mock database mode for resource demonstration\n');
  
  // Mock supabase operations
  const mockSupabase = {
    from: (table) => ({
      insert: (data) => ({
        select: () => ({
          single: () => {
            const newRecord = { id: mockDatabase.nextId++, ...data[0], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
            mockDatabase[table].push(newRecord);
            return { data: newRecord, error: null };
          }
        })
      }),
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: () => {
            const record = mockDatabase[table].find(r => r[column] === value);
            return record ? { data: record, error: null } : { data: null, error: { code: 'PGRST116' } };
          },
          order: (column) => ({
            limit: (limit) => ({ data: mockDatabase[table].filter(r => r[column] === value).slice(0, limit), error: null }),
            toString: () => ({ data: mockDatabase[table].filter(r => r[column] === value), error: null })
          }),
          gte: (col, val) => ({
            lte: (col2, val2) => ({
              gte: (col3, val3) => ({
                lte: (col4, val4) => ({
                  eq: (col5, val5) => {
                    const filtered = mockDatabase[table].filter(r => 
                      r[column] === value && 
                      r[col] >= val && r[col2] <= val2 && 
                      r[col3] >= val3 && r[col4] <= val4 &&
                      r[col5] === val5
                    );
                    return { data: filtered, error: null };
                  }
                })
              })
            })
          }),
          toString: () => ({ data: mockDatabase[table].filter(r => r[column] === value), error: null })
        }),
        order: (column) => ({ data: mockDatabase[table], error: null }),
        limit: (limit) => ({ data: mockDatabase[table].slice(0, limit), error: null }),
        toString: () => ({ data: mockDatabase[table], error: null })
      }),
      update: (data) => ({
        eq: (column, value) => ({
          select: () => ({
            single: () => {
              const recordIndex = mockDatabase[table].findIndex(r => r[column] === value);
              if (recordIndex >= 0) {
                mockDatabase[table][recordIndex] = { ...mockDatabase[table][recordIndex], ...data, updated_at: new Date().toISOString() };
                return { data: mockDatabase[table][recordIndex], error: null };
              }
              return { data: null, error: { message: 'Record not found' } };
            }
          })
        })
      }),
      delete: () => ({
        eq: (column, value) => {
          const initialLength = mockDatabase[table].length;
          mockDatabase[table] = mockDatabase[table].filter(r => r[column] !== value);
          return { data: null, error: mockDatabase[table].length < initialLength ? null : { message: 'Record not found' } };
        }
      })
    })
  };
  
  // Replace the supabase object
  Object.assign(supabase, mockSupabase);
}

async function demonstrateResourceSystem() {
  console.log('🌟 ═══════════════════════════════════════════════════════════');
  console.log('🐜 ANTOCRACY RESOURCE MANAGEMENT SYSTEM DEMONSTRATION');
  console.log('🌟 ═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Create a test colony
    console.log('🏰 Step 1: Creating test colony...');
    const colonyData = {
      user_id: 1,
      name: 'Resource Demo Colony',
      description: 'A colony for testing resource management',
      population: 25,
      food_storage: 50,
      map_seed: 'demo_resources_123'
    };
    
    const colonyResult = await Colony.create(colonyData);
    if (colonyResult.error) {
      console.error('❌ Failed to create colony:', colonyResult.error);
      return;
    }
    
    const colony = colonyResult.data;
    console.log(`✅ Created colony: ${colony.name} (ID: ${colony.id})`);
    console.log(`   Population: ${colony.population} ants`);
    console.log(`   Initial food storage: ${colony.food_storage}\n`);

    // 2. Display available resource types
    console.log('📚 Step 2: Available resource types...');
    const resourceTypes = Resource.getResourceTypes();
    const storageZones = ColonyResource.getStorageZones();
    
    console.log('   Resource Types:');
    Object.values(resourceTypes).forEach(type => {
      console.log(`   🌿 ${type.displayName}: ${type.nutritionalValue} nutrition, ${type.decayRate * 100}% decay/hour (${type.rarityLevel})`);
    });
    
    console.log('\n   Storage Zones:');
    Object.values(storageZones).forEach(zone => {
      console.log(`   📦 ${zone.displayName}: ${zone.capacity} capacity - ${zone.description}`);
    });
    console.log();

    // 3. Generate map resources around the colony
    console.log('🗺️  Step 3: Generating map resources around colony...');
    const mapResourceResult = await Resource.generateInArea(100, 100, 75, 15);
    
    if (mapResourceResult.error) {
      console.error('❌ Failed to generate map resources:', mapResourceResult.error);
      return;
    }
    
    const mapResources = mapResourceResult.data;
    console.log(`✅ Generated ${mapResources.length} resource nodes on the map:`);
    
    mapResources.slice(0, 5).forEach(resource => {
      const config = resource.getTypeConfig();
      console.log(`   🎯 ${config.displayName} at (${resource.location_x}, ${resource.location_y}): ${resource.quantity} units, ${resource.quality}% quality`);
    });
    console.log(`   ... and ${mapResources.length - 5} more resource nodes\n`);

    // 4. Simulate harvesting resources
    console.log('⛏️  Step 4: Simulating resource harvesting...');
    const harvestResults = [];
    
    for (let i = 0; i < Math.min(5, mapResources.length); i++) {
      const resource = mapResources[i];
      const harvestAmount = Math.min(10, resource.quantity);
      
      // Harvest from map
      const harvestResult = await resource.harvest(harvestAmount);
      if (harvestResult.error) continue;
      
      // Add to colony storage
      const addResult = await ColonyResource.addToColony(
        colony.id,
        resource.type,
        harvestAmount,
        resource.quality
      );
      
      if (addResult.data) {
        harvestResults.push({
          type: resource.type,
          amount: harvestAmount,
          quality: resource.quality,
          location: `(${resource.location_x}, ${resource.location_y})`
        });
      }
    }
    
    console.log('✅ Harvesting complete:');
    harvestResults.forEach(result => {
      const config = resourceTypes[result.type.toUpperCase()];
      console.log(`   🌾 Harvested ${result.amount}x ${config.displayName} (${result.quality}% quality) from ${result.location}`);
    });
    console.log();

    // 5. Display colony storage summary
    console.log('📊 Step 5: Colony storage summary...');
    const storageSummary = await ColonyResource.getStorageSummary(colony.id);
    
    if (storageSummary.error) {
      console.error('❌ Failed to get storage summary:', storageSummary.error);
      return;
    }
    
    const summary = storageSummary.data;
    console.log(`✅ Storage Overview:`);
    console.log(`   📦 Total Resources: ${summary.totalResources} types`);
    console.log(`   🔢 Total Quantity: ${summary.totalQuantity} units`);
    console.log(`   🍽️  Total Nutritional Value: ${summary.totalNutritionalValue} points\n`);
    
    console.log('   📋 By Resource Type:');
    Object.entries(summary.byType).forEach(([type, data]) => {
      const config = resourceTypes[type.toUpperCase()];
      console.log(`   🌿 ${config.displayName}: ${data.totalQuantity} units (avg ${data.averageQuality.toFixed(1)}% quality) = ${data.totalNutritionalValue} nutrition`);
    });
    console.log();
    
    console.log('   🏠 By Storage Zone:');
    Object.entries(summary.byZone).forEach(([zone, data]) => {
      const utilization = ((data.used / data.capacity) * 100).toFixed(1);
      console.log(`   📦 ${data.displayName}: ${data.used}/${data.capacity} capacity (${utilization}% used)`);
    });
    console.log();

    // 6. Demonstrate resource operations
    console.log('🔄 Step 6: Demonstrating resource operations...');
    
    // Find a resource to work with
    const colonyResources = await ColonyResource.findByColonyId(colony.id);
    if (colonyResources.data && colonyResources.data.length > 0) {
      const testResource = colonyResources.data[0];
      
      // Reserve some resources
      console.log(`   🔒 Reserving 5 units of ${testResource.resource_type}...`);
      await testResource.reserveQuantity(5);
      
      // Move resources to food processing zone
      console.log(`   🚚 Moving resources to food processing zone...`);
      await testResource.moveToZone('food_processing', 3);
      
      // Apply decay simulation
      console.log(`   ⏰ Simulating resource decay over time...`);
      await testResource.applyDecay();
      
      console.log('   ✅ Resource operations completed\n');
    }

    // 7. Resource conversion demonstration
    console.log('🔄 Step 7: Resource conversion simulation...');
    
    // Add leaves to convert to fungus
    await ColonyResource.addToColony(colony.id, 'leaves', 20, 90, 'food_processing');
    console.log('   🌿 Added 20 leaves to food processing zone');
    
    // Simulate conversion (leaves -> fungus)
    const leavesResult = await ColonyResource.findByColonyAndType(colony.id, 'leaves', 'food_processing');
    if (leavesResult.data) {
      const leaves = leavesResult.data;
      const conversionAmount = 10;
      const conversionEfficiency = 0.6; // 60% efficiency
      const fungusAmount = Math.floor(conversionAmount * conversionEfficiency);
      
      await leaves.removeQuantity(conversionAmount);
      await ColonyResource.addToColony(colony.id, 'fungus', fungusAmount, 95, 'food_processing');
      
      console.log(`   🔄 Converted ${conversionAmount} leaves → ${fungusAmount} fungus (60% efficiency)`);
    }
    console.log();

    // 8. Final storage state
    console.log('📈 Step 8: Final storage state...');
    const finalSummary = await ColonyResource.getStorageSummary(colony.id);
    if (finalSummary.data) {
      console.log('   📊 Final Storage Summary:');
      Object.entries(finalSummary.data.byType).forEach(([type, data]) => {
        const config = resourceTypes[type.toUpperCase()];
        console.log(`   🌿 ${config.displayName}: ${data.totalQuantity} units = ${data.totalNutritionalValue} nutrition`);
      });
    }
    console.log();

    // 9. Performance metrics
    console.log('⚡ Step 9: System performance metrics...');
    console.log(`   🗺️  Map Resources Generated: ${mapResources.length}`);
    console.log(`   ⛏️  Resources Harvested: ${harvestResults.length} operations`);
    console.log(`   📦 Storage Operations: Multiple transfers, reservations, conversions`);
    console.log(`   🔄 Resource Types Supported: ${Object.keys(resourceTypes).length}`);
    console.log(`   🏠 Storage Zones Available: ${Object.keys(storageZones).length}`);
    console.log();

    console.log('🎉 ═══════════════════════════════════════════════════════════');
    console.log('🎯 RESOURCE MANAGEMENT SYSTEM DEMONSTRATION COMPLETE!');
    console.log('🎉 ═══════════════════════════════════════════════════════════');
    console.log();
    console.log('✅ Successfully demonstrated:');
    console.log('   • Resource type configuration and properties');
    console.log('   • Map resource generation and discovery');
    console.log('   • Resource harvesting from map to colony');
    console.log('   • Colony storage management with zones');
    console.log('   • Resource reservations and transfers');
    console.log('   • Resource conversion mechanics');
    console.log('   • Resource decay simulation');
    console.log('   • Storage capacity and utilization tracking');
    console.log();
    console.log('🚀 The resource management foundation is ready for foraging mechanics!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.error(error.stack);
  }
}

// Run the demonstration
if (require.main === module) {
  demonstrateResourceSystem().then(() => {
    console.log('\n🛑 Demo complete. You can now implement foraging pathfinding!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Demo crashed:', error);
    process.exit(1);
  });
}

module.exports = { demonstrateResourceSystem }; 
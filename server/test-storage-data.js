// Test script to create sample storage data
// Uses the global fetch API available in Node.js 18+

async function addSampleData() {
  try {
    console.log('Creating test colony...');
    
    // First create a test colony
    const colonyResponse = await fetch('http://localhost:3001/api/colonies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Storage Colony',
        type: 'builder',
        population: 50,
        user_id: 'test-user-001',
        description: 'A colony for testing the storage management system'
      })
    });
    
    if (!colonyResponse.ok) {
      const errorText = await colonyResponse.text();
      throw new Error(`Failed to create colony: ${errorText}`);
    }
    
    const colony = await colonyResponse.json();
    const colonyId = colony.data.id;
    
    console.log('✅ Created test colony with ID:', colonyId);
    
    // Add some sample resources
    const resources = [
      { resource_type: 'LEAVES', quantity: 45, quality: 85, storage_zone: 'general' },
      { resource_type: 'FUNGUS', quantity: 30, quality: 92, storage_zone: 'food_processing' },
      { resource_type: 'SEEDS', quantity: 15, quality: 88, storage_zone: 'emergency_reserves' },
      { resource_type: 'INSECT_REMAINS', quantity: 20, quality: 76, storage_zone: 'food_processing' },
      { resource_type: 'NECTAR', quantity: 8, quality: 95, storage_zone: 'nursery_supplies' },
      { resource_type: 'LEAVES', quantity: 25, quality: 70, storage_zone: 'nursery_supplies' },
      { resource_type: 'FUNGUS', quantity: 12, quality: 88, storage_zone: 'general' }
    ];
    
    console.log('Adding sample resources...');
    
    for (const resource of resources) {
      const resourceResponse = await fetch(`http://localhost:3001/api/resources/colony/${colonyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource)
      });
      
      if (resourceResponse.ok) {
        console.log('✅ Added:', resource.resource_type, resource.quantity, 'units to', resource.storage_zone);
      } else {
        const errorText = await resourceResponse.text();
        console.log('❌ Failed to add:', resource.resource_type, '-', errorText);
      }
    }
    
    console.log('\n🎉 Sample storage data created successfully!');
    console.log('🌐 Access the colony at: http://localhost:5173/colony/' + colonyId);
    console.log('📦 Navigate to the Storage tab to see the management system in action');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addSampleData(); 
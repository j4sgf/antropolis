const { supabase } = require('../server/config/database');

async function addAntsToColony(colonyId, colonyName) {
  console.log(`🐣 Adding ants to colony ${colonyName} (${colonyId})...`);
  
  const initialAnts = [
    {
      colony_id: colonyId,
      name: 'Queen ' + colonyName,
      type: 'queen',
      role: 'nurse',
      status: 'adult',
      is_queen: true,
      health: 100,
      energy: 100,
      position_x: 0,
      position_y: 0
    },
    {
      colony_id: colonyId,
      name: 'Worker-1',
      type: 'worker',
      role: 'worker',
      status: 'adult',
      health: 85,
      energy: 90,
      position_x: 1,
      position_y: 0
    },
    {
      colony_id: colonyId,
      name: 'Worker-2',
      type: 'worker',
      role: 'worker',
      status: 'adult',
      health: 92,
      energy: 85,
      position_x: 0,
      position_y: 1
    },
    {
      colony_id: colonyId,
      name: 'Forager-1',
      type: 'worker',
      role: 'forager',
      status: 'adult',
      health: 78,
      energy: 95,
      position_x: -1,
      position_y: 0
    },
    {
      colony_id: colonyId,
      name: 'Soldier-1',
      type: 'worker',
      role: 'soldier',
      status: 'adult',
      health: 95,
      energy: 80,
      position_x: 0,
      position_y: -1
    }
  ];
  
  // Create ants in database
  for (const antData of initialAnts) {
    const { data, error } = await supabase
      .from('ants')
      .insert([antData])
      .select()
      .single();
    
    if (error) {
      console.error('⚠️ Failed to create ant:', error);
    } else {
      console.log('✅ Created ant:', data.name);
    }
  }
}

async function main() {
  console.log('🐜 Adding ants to existing colonies...\n');
  
  // Get all colonies that might not have ants
  const { data: colonies, error } = await supabase
    .from('colonies')
    .select('id, name')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Error fetching colonies:', error);
    return;
  }
  
  console.log(`Found ${colonies.length} colonies\n`);
  
  for (const colony of colonies) {
    // Check if colony already has ants
    const { data: existingAnts, error: antsError } = await supabase
      .from('ants')
      .select('id')
      .eq('colony_id', colony.id);
    
    if (antsError) {
      console.error(`❌ Error checking ants for ${colony.name}:`, antsError);
      continue;
    }
    
    if (existingAnts.length === 0) {
      console.log(`🔧 Colony "${colony.name}" has no ants, adding them...`);
      await addAntsToColony(colony.id, colony.name);
    } else {
      console.log(`✅ Colony "${colony.name}" already has ${existingAnts.length} ants`);
    }
  }
  
  console.log('\n🎉 Finished adding ants to colonies!');
}

main().catch(console.error); 
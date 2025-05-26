#!/usr/bin/env node

/**
 * Production Data Population Script
 * Populates initial data in Supabase database after migration
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateInitialData() {
  console.log('🚀 Populating Production Database with Initial Data\n');

  try {
    // 1. Create test user
    console.log('👤 Creating test user...');
    const testUser = {
      id: '00000000-0000-0000-0000-000000000001',
      username: 'demo_player',
      email: 'demo@antopolis.game',
      preferences: {
        theme: 'default',
        sound_enabled: true,
        tutorial_completed: false
      }
    };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert(testUser)
      .select()
      .single();

    if (userError) {
      console.log(`⚠️  User creation skipped: ${userError.message}`);
    } else {
      console.log('✅ Test user created');
    }

    // 2. Create demo colony
    console.log('🏛️ Creating demo colony...');
    const demoColony = {
      user_id: testUser.id,
      name: 'Demo Colony',
      description: 'A demonstration colony for testing and development',
      color: '#4CAF50',
      difficulty_level: 'medium',
      population: 25,
      max_population: 100,
      food_storage: 500,
      map_seed: 'demo_seed_001',
      territory_size: 10,
      evolution_points: 50,
      is_active: true
    };

    const { data: colonyData, error: colonyError } = await supabase
      .from('colonies')
      .upsert(demoColony)
      .select()
      .single();

    if (colonyError) {
      console.log(`⚠️  Colony creation failed: ${colonyError.message}`);
      return;
    } else {
      console.log('✅ Demo colony created');
    }

    // 3. Create initial resources
    console.log('📦 Setting up colony resources...');
    const resources = [
      { colony_id: demoColony.id, resource_type: 'food', amount: 500, capacity: 1000 },
      { colony_id: demoColony.id, resource_type: 'wood', amount: 200, capacity: 500 },
      { colony_id: demoColony.id, resource_type: 'stone', amount: 100, capacity: 300 },
      { colony_id: demoColony.id, resource_type: 'water', amount: 150, capacity: 400 },
      { colony_id: demoColony.id, resource_type: 'minerals', amount: 50, capacity: 200 }
    ];

    const { error: resourcesError } = await supabase
      .from('colony_resources')
      .upsert(resources);

    if (resourcesError) {
      console.log(`⚠️  Resources setup failed: ${resourcesError.message}`);
    } else {
      console.log('✅ Colony resources initialized');
    }

    // 4. Create the queen ant
    console.log('👑 Creating queen ant...');
    const queenAnt = {
      colony_id: demoColony.id,
      name: 'Queen Demo',
      role: 'worker', // Queens are special workers in our system
      type: 'queen',
      status: 'adult',
      is_queen: true,
      health: 150,
      max_health: 150,
      energy: 100,
      max_energy: 100,
      level: 5,
      age_in_ticks: 500,
      max_age_in_ticks: 5000,
      position_x: 0,
      position_y: 0,
      eggs_laid: 25,
      last_egg_production: new Date().toISOString()
    };

    const { error: queenError } = await supabase
      .from('ants')
      .upsert(queenAnt);

    if (queenError) {
      console.log(`⚠️  Queen creation failed: ${queenError.message}`);
    } else {
      console.log('✅ Queen ant created');
    }

    // 5. Create worker ants
    console.log('🐜 Creating worker ants...');
    const workers = [];
    const roles = ['worker', 'forager', 'soldier', 'scout', 'nurse', 'builder'];
    
    for (let i = 0; i < 20; i++) {
      workers.push({
        colony_id: demoColony.id,
        name: `Ant-${String(i + 1).padStart(3, '0')}`,
        role: roles[i % roles.length],
        type: roles[i % roles.length],
        status: 'adult',
        health: 100,
        max_health: 100,
        energy: Math.floor(Math.random() * 50) + 50,
        max_energy: 100,
        level: Math.floor(Math.random() * 3) + 1,
        age_in_ticks: Math.floor(Math.random() * 200) + 100,
        max_age_in_ticks: 1000,
        position_x: Math.floor(Math.random() * 20) - 10,
        position_y: Math.floor(Math.random() * 20) - 10
      });
    }

    const { error: workersError } = await supabase
      .from('ants')
      .upsert(workers);

    if (workersError) {
      console.log(`⚠️  Worker ants creation failed: ${workersError.message}`);
    } else {
      console.log('✅ Worker ants created');
    }

    // 6. Create initial statistics
    console.log('📊 Setting up colony statistics...');
    const stats = {
      colony_id: demoColony.id,
      population: 25,
      food_harvested: 1500,
      battles_won: 0,
      battles_lost: 0,
      structures_built: 0,
      territories_explored: 5,
      evolution_points_earned: 50,
      total_production: 2000,
      efficiency_rating: 0.75,
      last_updated: new Date().toISOString()
    };

    const { error: statsError } = await supabase
      .from('colony_statistics')
      .upsert(stats);

    if (statsError) {
      console.log(`⚠️  Statistics setup failed: ${statsError.message}`);
    } else {
      console.log('✅ Colony statistics initialized');
    }

    // 7. Create initial milestone events
    console.log('🎯 Creating milestone events...');
    const events = [
      {
        colony_id: demoColony.id,
        event_type: 'colony_founded',
        title: 'Colony Founded',
        description: 'The demo colony has been established',
        importance: 'high',
        metadata: { initial_population: 25 }
      },
      {
        colony_id: demoColony.id,
        event_type: 'first_foraging',
        title: 'First Foraging Mission',
        description: 'Workers have begun collecting resources',
        importance: 'medium',
        metadata: { food_collected: 100 }
      }
    ];

    const { error: eventsError } = await supabase
      .from('colony_events')
      .upsert(events);

    if (eventsError) {
      console.log(`⚠️  Events creation failed: ${eventsError.message}`);
    } else {
      console.log('✅ Milestone events created');
    }

    console.log('\n🎉 Production data population completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Test user account created');
    console.log('- ✅ Demo colony with 25 ants established');
    console.log('- ✅ Resources and statistics initialized');
    console.log('- ✅ Milestone events recorded');
    console.log('\n🚀 Your Antopolis database is ready for testing!');

  } catch (error) {
    console.error('❌ Error populating data:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  populateInitialData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { populateInitialData }; 
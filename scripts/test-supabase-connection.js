#!/usr/bin/env node

/**
 * Supabase Connection and Migration Test Script
 * Run this after setting up your Supabase project and environment variables
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSupabaseConnection() {
  log('\n🚀 Testing Supabase Connection and Database Setup', 'cyan');
  log('=' * 60, 'blue');

  // Check environment variables
  log('\n📋 Step 1: Checking Environment Variables', 'yellow');
  
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = [];
  
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    if (!value || value.includes('placeholder') || value.includes('[')) {
      missingVars.push(varName);
      log(`❌ ${varName}: Missing or contains placeholder`, 'red');
    } else {
      log(`✅ ${varName}: Configured`, 'green');
    }
  }

  if (missingVars.length > 0) {
    log(`\n❌ Missing environment variables: ${missingVars.join(', ')}`, 'red');
    log('Please check your .env file and follow the setup guide.', 'yellow');
    return false;
  }

  // Initialize Supabase client
  log('\n🔗 Step 2: Initializing Supabase Client', 'yellow');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    log('✅ Supabase client initialized successfully', 'green');
  } catch (error) {
    log(`❌ Failed to initialize Supabase client: ${error.message}`, 'red');
    return false;
  }

  // Test basic connectivity
  log('\n🌐 Step 3: Testing Basic Connectivity', 'yellow');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      log(`❌ Connection test failed: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ Basic connectivity test passed', 'green');
  } catch (error) {
    log(`❌ Connection error: ${error.message}`, 'red');
    return false;
  }

  // Test table existence
  log('\n🗃️ Step 4: Verifying Database Schema', 'yellow');
  
  const expectedTables = [
    'users',
    'colonies', 
    'ants',
    'colony_resources',
    'buildings',
    'map_tiles',
    'technologies',
    'battles',
    'colony_statistics',
    'colony_events',
    'colony_milestones'
  ];

  const tableResults = [];
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        log(`❌ Table '${tableName}': ${error.message}`, 'red');
        tableResults.push({ table: tableName, exists: false, error: error.message });
      } else {
        log(`✅ Table '${tableName}': Accessible`, 'green');
        tableResults.push({ table: tableName, exists: true });
      }
    } catch (error) {
      log(`❌ Table '${tableName}': ${error.message}`, 'red');
      tableResults.push({ table: tableName, exists: false, error: error.message });
    }
  }

  const missingTables = tableResults.filter(r => !r.exists);
  
  if (missingTables.length > 0) {
    log(`\n⚠️ Missing or inaccessible tables: ${missingTables.length}`, 'yellow');
    log('You may need to run the database migrations.', 'yellow');
  } else {
    log('\n✅ All expected tables are accessible', 'green');
  }

  // Test data operations
  log('\n📊 Step 5: Testing Data Operations', 'yellow');
  
  try {
    // Test user creation (let database generate UUID)
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`
    };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      log(`❌ User creation test failed: ${userError.message}`, 'red');
    } else {
      log('✅ User creation test passed', 'green');
      
      // Test colony creation
      const testColony = {
        user_id: userData.id,
        name: `Test Colony ${Date.now()}`,
        description: 'Test colony created by migration script'
      };

      const { data: colonyData, error: colonyError } = await supabase
        .from('colonies')
        .insert(testColony)
        .select()
        .single();

      if (colonyError) {
        log(`❌ Colony creation test failed: ${colonyError.message}`, 'red');
      } else {
        log('✅ Colony creation test passed', 'green');
        
        // Clean up test data
        await supabase.from('colonies').delete().eq('id', colonyData.id);
        await supabase.from('users').delete().eq('id', userData.id);
        log('✅ Test data cleaned up', 'green');
      }
    }
  } catch (error) {
    log(`❌ Data operations test failed: ${error.message}`, 'red');
  }

  // Generate final report
  log('\n' + '=' * 60, 'blue');
  log('📊 FINAL MIGRATION TEST REPORT', 'cyan');
  log('=' * 60, 'blue');
  
  const successfulTables = tableResults.filter(r => r.exists).length;
  const totalTables = expectedTables.length;
  const successRate = ((successfulTables / totalTables) * 100).toFixed(1);
  
  log(`📈 Database Schema: ${successfulTables}/${totalTables} tables (${successRate}%)`, 'bright');
  
  if (missingVars.length === 0) {
    log('✅ Environment Configuration: Complete', 'green');
  } else {
    log('❌ Environment Configuration: Incomplete', 'red');
  }

  if (successfulTables === totalTables && missingVars.length === 0) {
    log('\n🎉 MIGRATION SUCCESSFUL!', 'green');
    log('Your Antopolis database is ready for production use.', 'green');
    log('\nNext steps:', 'yellow');
    log('1. Restart your server with: npm run dev:server', 'bright');
    log('2. Verify the server starts in production mode', 'bright');
    log('3. Test creating a new colony in the game', 'bright');
    return true;
  } else {
    log('\n⚠️  MIGRATION INCOMPLETE', 'yellow');
    log('Please address the issues above and run this test again.', 'yellow');
    
    if (missingTables.length > 0) {
      log('\nTo fix missing tables:', 'yellow');
      log('1. Go to your Supabase Dashboard > SQL Editor', 'bright');
      log('2. Run the schema.sql file', 'bright');
      log('3. Run each migration file in order', 'bright');
    }
    
    return false;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testSupabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`\n💥 Unexpected error: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { testSupabaseConnection }; 
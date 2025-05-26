# Step 4: Migrate Database Schema to Supabase

## 🎯 Goal
Create all the required database tables in your Supabase project so your application can connect to a real database instead of mock data.

## 📋 Prerequisites
- ✅ Supabase project created (Step 1)
- ✅ Configuration values copied (Step 2) 
- ✅ Environment variables set (Step 3)
- ✅ Connection test passed (environment variables working)

## 🚀 Migration Steps

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Sign in to your account
   - Select your Antopolis project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query" (+ button)

3. **Run the Migration Script**
   - Copy the entire contents of `scripts/migrate-database-schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" button (or Ctrl+Enter)

4. **Verify Success**
   - You should see "Success. No rows returned" message
   - Check the "Tables" section in the left sidebar
   - You should see all 16 tables created:
     - ✅ users
     - ✅ colonies  
     - ✅ ants
     - ✅ colony_resources
     - ✅ buildings
     - ✅ map_tiles
     - ✅ technologies
     - ✅ evolution_point_transactions
     - ✅ colony_technologies
     - ✅ battles
     - ✅ game_sessions
     - ✅ game_events
     - ✅ colony_statistics
     - ✅ colony_events
     - ✅ colony_milestones
     - ✅ colony_sessions

### Option B: Using psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres"

# Run the migration
\i scripts/migrate-database-schema.sql

# Check tables were created
\dt
```

## 🔍 Testing the Migration

Run the connection test again to verify everything works:

```bash
npm run test:supabase
```

You should now see:
- ✅ Environment variables configured
- ✅ Supabase client initialized
- ✅ Basic connectivity test passed
- ✅ Database schema verification passed (all 16 tables found)

## 🚨 Troubleshooting

### "Syntax error" or "Invalid command"
- Make sure you copied the entire migration script
- Ensure there are no copy/paste formatting issues
- Try running smaller sections of the script if needed

### "Permission denied" errors
- Verify you're using the correct Supabase project
- Check that your service role key has the necessary permissions

### Some tables missing
- Re-run the migration script (it's safe to run multiple times)
- Check the Tables section in Supabase Dashboard

### Connection still fails after migration
- Verify your .env files have the correct values
- Restart your development server
- Double-check the environment variable names (no typos)

## ✅ Success Indicators

When the migration is complete, you should:
1. ✅ See all 16 tables in Supabase Dashboard
2. ✅ Pass the connection test with schema verification
3. ✅ Be ready to populate initial data (Step 5)

## ⏭️ Next Steps

After successful migration, proceed to:
- **Step 5**: Populate the database with initial test data
- **Step 6**: Test the connection with sample operations  
- **Step 7**: Start your application in production mode 
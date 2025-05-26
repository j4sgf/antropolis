# 🚀 Antopolis Supabase Database Migration Guide

## 📋 **Prerequisites**
- Supabase account (free tier is sufficient)
- Node.js and npm installed
- Antopolis project cloned and dependencies installed

## 🏗️ **Step 1: Create Supabase Project**

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Fill in project details:**
   - Project Name: `Antopolis`
   - Database Password: `Generate a strong password and save it!`
   - Region: `Choose closest to your location`
4. **Wait for project to initialize** (usually 2-3 minutes)

## 🔧 **Step 2: Get Project Configuration**

### **From your Supabase Dashboard:**

1. **Go to Settings > API**
2. **Copy the following values:**
   - `Project URL` (looks like: https://[project-id].supabase.co)
   - `anon public` key (starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)
   - `service_role secret` key (starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)

3. **Go to Settings > Database**
   - Copy the `Connection string` (URI format)

## 📝 **Step 3: Environment Configuration**

### **Create `.env` file in the root directory:**

```bash
# Antopolis Production Environment Configuration
PORT=3001
NODE_ENV=production
CLIENT_URL=http://localhost:5173

# Database Configuration (Supabase)
DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_key_here_change_this_in_production

# Game Configuration
MAX_COLONIES_PER_USER=5
DEFAULT_STARTING_ANTS=10

# Development flags
ENABLE_MOCK_DATA=false
DEBUG_DATABASE=true
```

### **Create `client/.env` file:**

```bash
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=Antopolis
VITE_WEBSOCKET_URL=ws://localhost:3001

# Supabase Configuration (for client-side)
VITE_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# Development Configuration
VITE_DEV_MODE=false
```

## 🗃️ **Step 4: Database Schema Migration**

### **Option A: SQL Editor (Recommended)**

1. **Go to Supabase Dashboard > SQL Editor**
2. **Create a new query**
3. **Copy and paste the entire schema:**

```sql
-- Run this first to ensure clean setup
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

4. **Then run the main schema file** (`supabase/schema.sql`)
5. **Run each migration file in order:**
   - `supabase/migrations/add_queen_fields.sql`
   - `supabase/migrations/create_save_games_table.sql`
   - `supabase/migrations/004_colony_statistics.sql`

### **Option B: Command Line (Alternative)**

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref [YOUR_PROJECT_ID]

# Run migrations
supabase db push
```

## 🧪 **Step 5: Test Connection**

### **Run the connection test:**

```bash
cd server
node -e "
const { testConnection } = require('./config/database');
testConnection().then(result => {
  console.log('Connection test result:', result);
  process.exit(result.success ? 0 : 1);
});
"
```

### **Expected output:**
```
✅ Database connection successful
✅ Tables verified: users, colonies, ants, colony_resources, buildings...
Connection test result: { success: true, message: 'All systems operational' }
```

## 📊 **Step 6: Populate Initial Data**

### **Run the test data script:**

```bash
npm run test:populate-data
```

This will create:
- Test user accounts
- Sample colonies
- Initial resource configurations
- AI colonies for testing
- Sample statistics and milestones

## 🚀 **Step 7: Start Production Mode**

```bash
# Start the server
npm run dev:server

# In another terminal, start the client
npm run dev:client
```

### **Verify everything works:**
- Check server logs for "Running in production mode" (not development mode)
- Test API endpoints: `curl http://localhost:3001/api/health`
- Check frontend loads properly
- Create a new colony to test database writes

## 🔒 **Step 8: Security Configuration**

### **Row Level Security (RLS):**

1. **Go to Authentication > Policies**
2. **Enable RLS on all tables**
3. **Add basic policies:**

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON colonies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own ants" ON ants
  FOR ALL USING (
    colony_id IN (
      SELECT id FROM colonies WHERE user_id = auth.uid()
    )
  );

-- Repeat for other tables...
```

## 🎯 **Verification Checklist**

- [ ] Supabase project created and configured
- [ ] Environment variables set correctly  
- [ ] Database schema migrated successfully
- [ ] Connection test passes
- [ ] Server starts in production mode (not mock mode)
- [ ] API endpoints respond with real data
- [ ] Frontend connects and displays data
- [ ] Can create new colonies and save data
- [ ] Row Level Security configured (recommended)

## 🐛 **Troubleshooting**

### **Connection Issues:**
- Verify project URL and keys are correct
- Check database password matches
- Ensure project is not paused (free tier limitation)

### **Migration Issues:**
- Run schema.sql first before migrations
- Check for naming conflicts
- Verify user permissions

### **Environment Issues:**
- Restart both server and client after changing .env
- Check for typos in environment variable names
- Ensure no spaces around = signs

## 📞 **Support**

If you encounter issues:
1. Check Supabase project logs in dashboard
2. Check server console for detailed error messages
3. Test individual API endpoints with curl
4. Verify database tables exist in Supabase dashboard

---

**🎉 Once complete, your Antopolis game will be running on a production-ready Supabase database!** 
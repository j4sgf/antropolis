# 🗄️ Database Setup Guide - Antocracy

This guide will help you set up the Supabase database for Antocracy.

## 📋 Prerequisites

- A [Supabase](https://supabase.com) account (free tier is sufficient)
- Node.js installed (already done)

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `antocracy-db` (or your preferred name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for the project to be created (~2 minutes)

### 2. Get Your Project Credentials

After your project is ready:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### 3. Set Up Environment Variables

1. Copy the environment template:
   ```bash
   cp server/env.example server/.env
   ```

2. Edit `server/.env` with your Supabase credentials:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173

   # Database Configuration (Supabase)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here

   # JWT Configuration
   JWT_SECRET=your-random-secret-key-here

   # Game Configuration
   MAX_COLONIES_PER_USER=5
   DEFAULT_STARTING_ANTS=10
   ```

### 4. Run the Database Schema

1. Go to your Supabase dashboard
2. Click **SQL Editor** in the sidebar
3. Copy the contents of `supabase/schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the schema

This will create all the tables needed for the game!

### 5. Test the Connection

Start your server:
```bash
npm run dev:server
```

You should see:
```
🐜 Antocracy server running on port 3001
📡 Health check: http://localhost:3001/api/health
🌍 Environment: development
✅ Database connection successful
```

If you see "⚠️ Database tables not yet created", make sure you've run the schema SQL.

## 🧪 Testing the API

### Test Health Check
```bash
curl http://localhost:3001/api/health
```

### Create a Test User and Colony
```bash
# Create a test colony
curl -X POST http://localhost:3001/api/colonies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Colony",
    "description": "A test colony",
    "color": "#8B4513",
    "user_id": "00000000-0000-0000-0000-000000000001"
  }'
```

### Get Colonies
```bash
curl "http://localhost:3001/api/colonies?user_id=00000000-0000-0000-0000-000000000001"
```

## 📊 Database Schema Overview

The schema includes these main tables:

- **users**: Player accounts
- **colonies**: Player colonies
- **ants**: Individual ants with roles and lifecycle
- **colony_resources**: Food, wood, stone, etc.
- **buildings**: Structures in colonies
- **map_tiles**: Procedural map data
- **technologies**: Research tree
- **battles**: Combat history
- **game_sessions**: Save games
- **game_events**: Game history log

## 🔐 Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Database constraints**: Prevent invalid data
- **Input validation**: API validates all inputs
- **Error handling**: Graceful error messages

## 🚨 Troubleshooting

### "Database connection failed"
- Check your SUPABASE_URL and SUPABASE_ANON_KEY in `.env`
- Make sure your Supabase project is active
- Check your internet connection

### "Database table not found"
- Run the schema SQL in Supabase SQL Editor
- Make sure all tables were created successfully

### "Authentication failed"
- Verify your anon key is correct
- Check that RLS policies are set up properly

## 🎯 Next Steps

Once your database is set up, you can:

1. **Test the API endpoints** using curl or Postman
2. **Connect the frontend** to display colony data
3. **Implement user authentication** for real users
4. **Add more game features** like resources and buildings

Your database is now ready for Antocracy! 🐜🎮 
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware for colony creation
app.use('/api/colonies', (req, res, next) => {
  if (req.method === 'POST') {
    console.log('🔥 RAW COLONY REQUEST DEBUG:');
    console.log('  Method:', req.method);
    console.log('  URL:', req.url);
    console.log('  Headers:', JSON.stringify(req.headers, null, 2));
    console.log('  Body (raw):', req.body);
    console.log('  Body (stringified):', JSON.stringify(req.body));
  }
  next();
});

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Antopolis server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import routes
const coloniesRouter = require('./routes/colonies');
const resourcesRouter = require('./routes/resources');
const resourceQueueRouter = require('./routes/resource-queue');
const foragingRouter = require('./routes/foraging');
const structuresRouter = require('./routes/structures');
const { router: lifecycleRouter, initializeLifecycleManager } = require('./routes/lifecycle');
const mapRouter = require('./routes/map');
const aiColonyRouter = require('./routes/aiColony');
const battlesRouter = require('./routes/battles');
const explorationRouter = require('./routes/exploration');
const antsRouter = require('./routes/ants');
const evolutionRouter = require('./routes/evolutionRoutes');
const techtreeRouter = require('./routes/techtree');
const tutorialRouter = require('./routes/tutorial');
const statisticsRouter = require('./routes/statistics');

// Import services
const ConstructionManager = require('./services/ConstructionManager');
const StructureEventManager = require('./services/StructureEventManager');
const { populateTestMilestones } = require('./scripts/populate-test-milestones');

// API routes
app.use('/api/colonies', coloniesRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/resource-queue', resourceQueueRouter);
app.use('/api/foraging', foragingRouter);
app.use('/api/structures', structuresRouter);
app.use('/api/lifecycle', lifecycleRouter);
app.use('/api/map', mapRouter);
app.use('/api/ai-colonies', aiColonyRouter);
app.use('/api/battles', battlesRouter);
app.use('/api/exploration', explorationRouter);
app.use('/api', antsRouter);
app.use('/api/evolution', evolutionRouter);
app.use('/api', techtreeRouter);
app.use('/api/tutorial', tutorialRouter);
app.use('/api/statistics', statisticsRouter);

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Antopolis server is running',
    version: '1.0.0',
    endpoints: {
      colonies: '/api/colonies',
      'ai-colonies': '/api/ai-colonies',
      health: '/health'
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🐜 Antopolis server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Running in development mode (mock database)');
  }
  
  // Test database connection
  await testConnection();
  
  // Populate test data for development
  if (process.env.NODE_ENV !== 'production') {
    populateTestMilestones();
  }
  
  // Initialize services
  ConstructionManager.startProcessing();
  console.log(`🏗️ Construction manager initialized`);
  
  // Initialize lifecycle manager
  initializeLifecycleManager();
  console.log(`🐛 Lifecycle manager initialized`);
  
  // Start structure event processing (for testing, use shorter interval)
  const isDev = process.env.NODE_ENV !== 'production';
  const processingInterval = isDev ? 60000 : 24 * 60 * 60 * 1000; // 1 minute in dev, 24 hours in prod
  StructureEventManager.startDailyProcessing(processingInterval);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  ConstructionManager.stop();
  StructureEventManager.stopDailyProcessing();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  ConstructionManager.stop();
  StructureEventManager.stopDailyProcessing();
  process.exit(0);
});

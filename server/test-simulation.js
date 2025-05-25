#!/usr/bin/env node

/**
 * Test script to demonstrate the Antocracy simulation engine
 * Run with: node test-simulation.js
 */

const SimulationIntegration = require('./services/SimulationIntegration');

console.log('🐜 === ANTOCRACY SIMULATION ENGINE TEST ===\n');

// Create simulation integration instance
const simulation = new SimulationIntegration({
  enableDebugLogging: true,
  autoStartColonies: true
});

// Start the demonstration
simulation.demonstrateSimulation();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down simulation...');
  simulation.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Terminating simulation...');
  simulation.destroy();
  process.exit(0);
});

console.log('\n💡 Press Ctrl+C to stop the simulation\n'); 
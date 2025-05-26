#!/usr/bin/env node

/**
 * Antopolis Corrected Integration Testing Script
 * Tests all major API endpoints with correct paths
 */

const http = require('http');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_COLONY_ID = 'test-colony-001';

// Test results storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  tests: [],
  errors: [],
  performance: {}
};

// Helper function to make HTTP requests
function makeRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const url = new URL(endpoint, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
            responseTime: responseTime,
            success: res.statusCode >= 200 && res.statusCode < 300
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            responseTime: responseTime,
            success: false,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (err) => {
      reject({
        error: err.message,
        success: false,
        responseTime: Date.now() - startTime
      });
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test function wrapper
async function runTest(testName, testFunction) {
  console.log(`🧪 Running: ${testName}`);
  testResults.totalTests++;
  
  try {
    const result = await testFunction();
    testResults.passedTests++;
    testResults.tests.push({
      name: testName,
      status: 'PASSED',
      result: result,
      timestamp: new Date().toISOString()
    });
    console.log(`✅ PASSED: ${testName}`);
    return result;
  } catch (error) {
    testResults.failedTests++;
    testResults.errors.push({
      test: testName,
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
    testResults.tests.push({
      name: testName,
      status: 'FAILED',
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
    console.log(`❌ FAILED: ${testName} - ${error.message || error}`);
    return null;
  }
}

// Individual test functions with corrected endpoints
async function testServerHealth() {
  const response = await makeRequest('/api/health');
  if (!response.success) {
    throw new Error(`Health check failed: ${response.statusCode}`);
  }
  return response;
}

async function testColoniesEndpoint() {
  const response = await makeRequest('/api/colonies');
  if (!response.success) {
    throw new Error(`Colonies endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testResourceTypes() {
  const response = await makeRequest('/api/resources/types');
  if (!response.success) {
    throw new Error(`Resource types failed: ${response.statusCode}`);
  }
  return response;
}

async function testMapGeneration() {
  const response = await makeRequest('/api/map/generate', 'POST', {
    width: 50,
    height: 50,
    difficulty: 'medium'
  });
  if (!response.success) {
    throw new Error(`Map generation failed: ${response.statusCode}`);
  }
  return response;
}

async function testBattleHistory() {
  const response = await makeRequest(`/api/battles/history/${TEST_COLONY_ID}`);
  if (!response.success) {
    throw new Error(`Battle history failed: ${response.statusCode}`);
  }
  return response;
}

async function testEvolutionHistory() {
  const response = await makeRequest(`/api/evolution/history/${TEST_COLONY_ID}`);
  if (!response.success) {
    throw new Error(`Evolution history failed: ${response.statusCode}`);
  }
  return response;
}

async function testLifecyclePopulation() {
  const response = await makeRequest(`/api/lifecycle/colony/${TEST_COLONY_ID}/population`);
  if (!response.success) {
    throw new Error(`Lifecycle population failed: ${response.statusCode}`);
  }
  return response;
}

async function testExplorationStatus() {
  const response = await makeRequest(`/api/exploration/${TEST_COLONY_ID}/status`);
  if (!response.success) {
    throw new Error(`Exploration status failed: ${response.statusCode}`);
  }
  return response;
}

async function testStatistics() {
  const response = await makeRequest(`/api/statistics/colony/${TEST_COLONY_ID}`);
  if (!response.success) {
    throw new Error(`Statistics failed: ${response.statusCode}`);
  }
  return response;
}

async function testTimeline() {
  const response = await makeRequest(`/api/statistics/colony/${TEST_COLONY_ID}/timeline`);
  if (!response.success) {
    throw new Error(`Timeline failed: ${response.statusCode}`);
  }
  return response;
}

async function testTutorialProgress() {
  const response = await makeRequest('/api/tutorial/progress');
  if (!response.success) {
    throw new Error(`Tutorial progress failed: ${response.statusCode}`);
  }
  return response;
}

async function testForagingStatistics() {
  const response = await makeRequest('/api/foraging/statistics/history');
  if (!response.success) {
    throw new Error(`Foraging statistics failed: ${response.statusCode}`);
  }
  return response;
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Corrected Antopolis Integration Tests...\n');
  console.log('='*60);
  
  // Core System Tests
  console.log('\n📋 PHASE 1: Core System Tests');
  await runTest('Server Health Check', testServerHealth);
  await runTest('Colonies API', testColoniesEndpoint);
  await runTest('Resource Types API', testResourceTypes);
  
  // Map and Generation Tests
  console.log('\n📋 PHASE 2: Map and Generation Tests');
  await runTest('Map Generation API', testMapGeneration);
  
  // Game System Tests  
  console.log('\n📋 PHASE 3: Game System Tests');
  await runTest('Battle History API', testBattleHistory);
  await runTest('Evolution History API', testEvolutionHistory);
  await runTest('Lifecycle Population API', testLifecyclePopulation);
  await runTest('Exploration Status API', testExplorationStatus);
  await runTest('Foraging Statistics API', testForagingStatistics);
  
  // Advanced Feature Tests
  console.log('\n📋 PHASE 4: Advanced Feature Tests');
  await runTest('Statistics API', testStatistics);
  await runTest('Timeline API', testTimeline);
  await runTest('Tutorial Progress API', testTutorialProgress);
  
  // Calculate performance metrics
  const totalResponseTime = testResults.tests.reduce((sum, test) => {
    return sum + (test.result?.responseTime || 0);
  }, 0);
  
  testResults.performance = {
    averageResponseTime: totalResponseTime / testResults.totalTests,
    totalResponseTime: totalResponseTime
  };
  
  // Generate final report
  console.log('\n' + '='*60);
  console.log('📊 FINAL TEST RESULTS');
  console.log('='*60);
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`✅ Passed: ${testResults.passedTests}`);
  console.log(`❌ Failed: ${testResults.failedTests}`);
  console.log(`📈 Success Rate: ${((testResults.passedTests / testResults.totalTests) * 100).toFixed(2)}%`);
  console.log(`⚡ Average Response Time: ${testResults.performance.averageResponseTime.toFixed(2)}ms`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🐛 ERRORS FOUND:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  // Save results to file
  const logFile = 'corrected-test-results.json';
  fs.writeFileSync(logFile, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Full results saved to: ${logFile}`);
  
  return testResults;
}

// Execute tests if this script is run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults }; 
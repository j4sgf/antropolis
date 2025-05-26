#!/usr/bin/env node

/**
 * Antopolis Integration Testing Script
 * Tests all major API endpoints and system integrations
 */

const http = require('http');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_COLONY_ID = 'test-colony-001';
const LOG_FILE = 'api-test-results.json';

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
  console.log(`\n🧪 Running: ${testName}`);
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

// Individual test functions
async function testServerHealth() {
  const response = await makeRequest('/api/health');
  if (!response.success) {
    throw new Error(`Health check failed: ${response.statusCode}`);
  }
  if (!response.body.status || response.body.status !== 'OK') {
    throw new Error('Health check returned invalid status');
  }
  return response;
}

async function testColoniesEndpoint() {
  const response = await makeRequest('/api/colonies');
  if (!response.success) {
    throw new Error(`Colonies endpoint failed: ${response.statusCode}`);
  }
  if (!response.body.success || !Array.isArray(response.body.data)) {
    throw new Error('Invalid colonies response structure');
  }
  return response;
}

async function testStatisticsEndpoint() {
  const response = await makeRequest(`/api/statistics/colony/${TEST_COLONY_ID}`);
  if (!response.success) {
    throw new Error(`Statistics endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testTimelineEndpoint() {
  const response = await makeRequest(`/api/statistics/colony/${TEST_COLONY_ID}/timeline`);
  if (!response.success) {
    throw new Error(`Timeline endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testMapEndpoint() {
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

async function testBattleEndpoints() {
  const response = await makeRequest('/api/battles/history');
  if (!response.success) {
    throw new Error(`Battle history endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testEvolutionEndpoint() {
  const response = await makeRequest('/api/tech-tree');
  if (!response.success) {
    throw new Error(`Tech tree endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testResourcesEndpoint() {
  const response = await makeRequest(`/api/resources/colony/${TEST_COLONY_ID}/status`);
  if (!response.success) {
    throw new Error(`Resources endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testStructuresEndpoint() {
  const response = await makeRequest(`/api/structures/colony/${TEST_COLONY_ID}/list`);
  if (!response.success) {
    throw new Error(`Structures endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testForagingEndpoint() {
  const response = await makeRequest(`/api/foraging/colony/${TEST_COLONY_ID}/active-parties`);
  if (!response.success) {
    throw new Error(`Foraging endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testLifecycleEndpoint() {
  const response = await makeRequest(`/api/lifecycle/colony/${TEST_COLONY_ID}/population`);
  if (!response.success) {
    throw new Error(`Lifecycle endpoint failed: ${response.statusCode}`);
  }
  return response;
}

async function testTutorialEndpoint() {
  const response = await makeRequest('/api/tutorial/progress');
  if (!response.success) {
    throw new Error(`Tutorial endpoint failed: ${response.statusCode}`);
  }
  return response;
}

// Main test execution
async function runAllTests() {
  console.log('🚀 Starting Antopolis Integration Tests...\n');
  console.log('='*60);
  
  // Core System Tests
  console.log('\n📋 PHASE 1: Core System Tests');
  await runTest('Server Health Check', testServerHealth);
  await runTest('Colonies API', testColoniesEndpoint);
  
  // Feature System Tests  
  console.log('\n📋 PHASE 2: Feature System Tests');
  await runTest('Statistics API', testStatisticsEndpoint);
  await runTest('Timeline API', testTimelineEndpoint);
  await runTest('Map Generation API', testMapEndpoint);
  await runTest('Battle System API', testBattleEndpoints);
  await runTest('Evolution System API', testEvolutionEndpoint);
  await runTest('Resources API', testResourcesEndpoint);
  await runTest('Structures API', testStructuresEndpoint);
  await runTest('Foraging API', testForagingEndpoint);
  await runTest('Lifecycle API', testLifecycleEndpoint);
  await runTest('Tutorial API', testTutorialEndpoint);
  
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
  fs.writeFileSync(LOG_FILE, JSON.stringify(testResults, null, 2));
  console.log(`\n💾 Full results saved to: ${LOG_FILE}`);
  
  return testResults;
}

// Execute tests if this script is run directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults }; 
/**
 * Comprehensive Test Suite for Battle Simulation System (Task 13)
 * Tests all components of the battle system integration
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

// Test configuration
const TEST_CONFIG = {
    timeout: 30000,
    retries: 3,
    delay: 1000
};

// Mock data for testing
const MOCK_COLONY_ID = 'test-colony-123';
const MOCK_BATTLE_DATA = {
    attackerArmy: { soldier: 15, worker: 5, scout: 3, guard: 2 },
    defenderArmy: { soldier: 10, worker: 8, guard: 4 },
    battleConditions: {
        terrain: 'forest',
        attackerFormation: 'aggressive',
        defenderFormation: 'defensive'
    }
};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const logTest = (testName, passed, details = '') => {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        console.log(`✅ ${testName}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${testName}: ${details}`);
    }
    testResults.details.push({ testName, passed, details });
};

const makeRequest = async (method, url, data = null) => {
    try {
        const config = {
            method,
            url: `${API_BASE_URL}${url}`,
            timeout: TEST_CONFIG.timeout,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) config.data = data;
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status || 500
        };
    }
};

// Test Suite Functions

/**
 * Test 1: Battle API Health Check
 */
async function testBattleAPIHealth() {
    console.log('\n🔍 Testing Battle API Health...');
    
    const result = await makeRequest('GET', '/api/battles/health');
    
    const passed = result.success && 
                  result.data.status === 'OK' &&
                  Array.isArray(result.data.endpoints) &&
                  result.data.endpoints.length >= 10;
    
    logTest('Battle API Health Check', passed, 
        passed ? '' : `API not healthy: ${JSON.stringify(result.error)}`);
    
    return result;
}

/**
 * Test 2: Battle Simulation Core
 */
async function testBattleSimulation() {
    console.log('\n⚔️ Testing Battle Simulation Core...');
    
    const result = await makeRequest('POST', '/api/battles/simulate', MOCK_BATTLE_DATA);
    
    const passed = result.success &&
                  result.data.success &&
                  result.data.battle &&
                  result.data.battle.result &&
                  typeof result.data.battle.result.victor === 'string';
    
    logTest('Battle Simulation Algorithm', passed,
        passed ? '' : `Simulation failed: ${JSON.stringify(result.error)}`);
    
    return result;
}

/**
 * Test 3: AI Attack Scheduler
 */
async function testAIAttackScheduler() {
    console.log('\n🤖 Testing AI Attack Scheduler...');
    
    // Test scheduler status
    const statusResult = await makeRequest('GET', '/api/battles/scheduler/status');
    const statusPassed = statusResult.success && statusResult.data.success;
    
    logTest('AI Scheduler Status Check', statusPassed,
        statusPassed ? '' : `Status check failed: ${JSON.stringify(statusResult.error)}`);
    
    // Test scheduler start
    const startResult = await makeRequest('POST', '/api/battles/scheduler/start');
    const startPassed = startResult.success && startResult.data.success;
    
    logTest('AI Scheduler Start', startPassed,
        startPassed ? '' : `Start failed: ${JSON.stringify(startResult.error)}`);
    
    return { statusResult, startResult };
}

/**
 * Test 4: Player Raid System
 */
async function testPlayerRaidSystem() {
    console.log('\n🎯 Testing Player Raid System...');
    
    // Test available targets
    const targetsResult = await makeRequest('GET', `/api/battles/targets/${MOCK_COLONY_ID}`);
    const targetsPassed = targetsResult.success &&
                         targetsResult.data.success &&
                         Array.isArray(targetsResult.data.targets);
    
    logTest('Available Targets Retrieval', targetsPassed,
        targetsPassed ? '' : `Targets failed: ${JSON.stringify(targetsResult.error)}`);
    
    // Test raid execution
    const raidData = {
        attackerColonyId: MOCK_COLONY_ID,
        targetColonyId: 'ai_colony_1',
        attackingArmy: MOCK_BATTLE_DATA.attackerArmy,
        formation: 'balanced',
        retreatThreshold: 0.3
    };
    
    const executeResult = await makeRequest('POST', '/api/battles/execute', raidData);
    const executePassed = executeResult.success &&
                         executeResult.data.success &&
                         executeResult.data.battle;
    
    logTest('Raid Execution', executePassed,
        executePassed ? '' : `Execution failed: ${JSON.stringify(executeResult.error)}`);
    
    return { targetsResult, executeResult };
}

/**
 * Test 5: Battle Results and Rewards
 */
async function testBattleResultsAndRewards() {
    console.log('\n🏆 Testing Battle Results and Rewards...');
    
    const battleId = 'test-battle-' + Date.now();
    
    // Test battle results retrieval
    const resultsResult = await makeRequest('GET', `/api/battles/results/${battleId}`);
    const resultsPassed = resultsResult.success &&
                         resultsResult.data.success &&
                         resultsResult.data.battle;
    
    logTest('Battle Results Retrieval', resultsPassed,
        resultsPassed ? '' : `Results failed: ${JSON.stringify(resultsResult.error)}`);
    
    // Test reward distribution
    const rewardsData = {
        colonyId: MOCK_COLONY_ID,
        rewards: { food: 100, materials: 50, territory: 1 }
    };
    
    const rewardsResult = await makeRequest('POST', `/api/battles/rewards/${battleId}`, rewardsData);
    const rewardsPassed = rewardsResult.success &&
                         rewardsResult.data.success &&
                         rewardsResult.data.distribution;
    
    logTest('Reward Distribution', rewardsPassed,
        rewardsPassed ? '' : `Rewards failed: ${JSON.stringify(rewardsResult.error)}`);
    
    return { resultsResult, rewardsResult };
}

/**
 * Test 6: Battle History System
 */
async function testBattleHistory() {
    console.log('\n📜 Testing Battle History System...');
    
    // Test battle history retrieval
    const historyResult = await makeRequest('GET', `/api/battles/history/${MOCK_COLONY_ID}?limit=10&offset=0`);
    const historyPassed = historyResult.success &&
                         historyResult.data.success &&
                         Array.isArray(historyResult.data.history);
    
    logTest('Battle History Retrieval', historyPassed,
        historyPassed ? '' : `History failed: ${JSON.stringify(historyResult.error)}`);
    
    // Test battle statistics
    const statsResult = await makeRequest('GET', `/api/battles/stats/${MOCK_COLONY_ID}`);
    const statsPassed = statsResult.success &&
                       statsResult.data.success &&
                       statsResult.data.stats &&
                       typeof statsResult.data.stats.totalBattles === 'number';
    
    logTest('Battle Statistics', statsPassed,
        statsPassed ? '' : `Stats failed: ${JSON.stringify(statsResult.error)}`);
    
    return { historyResult, statsResult };
}

/**
 * Test 7: Retreat Mechanics
 */
async function testRetreatMechanics() {
    console.log('\n🏃 Testing Retreat Mechanics...');
    
    const battleId = 'test-retreat-' + Date.now();
    
    // Test retreat recommendation
    const recommendData = {
        currentArmy: { soldier: 5, worker: 2, scout: 1 },
        enemyArmy: { soldier: 15, worker: 8, guard: 4 },
        battleState: { 
            ourCasualties: 10, 
            enemyCasualties: 3,
            terrain: 'forest',
            phase: 'middle'
        }
    };
    
    const recommendResult = await makeRequest('POST', '/api/battles/retreat/recommend', recommendData);
    const recommendPassed = recommendResult.success &&
                           recommendResult.data.success &&
                           recommendResult.data.recommendation;
    
    logTest('Retreat Recommendation', recommendPassed,
        recommendPassed ? '' : `Recommendation failed: ${JSON.stringify(recommendResult.error)}`);
    
    // Test retreat execution
    const retreatData = {
        colonyId: MOCK_COLONY_ID,
        remainingArmy: { soldier: 5, worker: 2, scout: 1 },
        battleConditions: {
            terrain: 'forest',
            phase: 'middle',
            pursuit: 'light'
        }
    };
    
    const retreatResult = await makeRequest('POST', `/api/battles/retreat/${battleId}`, retreatData);
    const retreatPassed = retreatResult.success &&
                         retreatResult.data.success &&
                         retreatResult.data.retreat;
    
    logTest('Retreat Execution', retreatPassed,
        retreatPassed ? '' : `Retreat failed: ${JSON.stringify(retreatResult.error)}`);
    
    return { recommendResult, retreatResult };
}

/**
 * Test 8: Incoming Attacks System
 */
async function testIncomingAttacks() {
    console.log('\n⚡ Testing Incoming Attacks System...');
    
    const incomingResult = await makeRequest('GET', `/api/battles/incoming?colonyId=${MOCK_COLONY_ID}`);
    const incomingPassed = incomingResult.success &&
                          incomingResult.data.success &&
                          Array.isArray(incomingResult.data.incomingAttacks);
    
    logTest('Incoming Attacks Check', incomingPassed,
        incomingPassed ? '' : `Incoming attacks failed: ${JSON.stringify(incomingResult.error)}`);
    
    return incomingResult;
}

/**
 * Test 9: Integration Test - Complete Battle Flow
 */
async function testCompleteBattleFlow() {
    console.log('\n🔄 Testing Complete Battle Flow Integration...');
    
    try {
        // 1. Get available targets
        const targets = await makeRequest('GET', `/api/battles/targets/${MOCK_COLONY_ID}`);
        if (!targets.success) throw new Error('Failed to get targets');
        
        // 2. Simulate battle preview
        const simulation = await makeRequest('POST', '/api/battles/simulate', MOCK_BATTLE_DATA);
        if (!simulation.success) throw new Error('Failed to simulate battle');
        
        // 3. Execute raid
        const raidData = {
            attackerColonyId: MOCK_COLONY_ID,
            targetColonyId: 'ai_colony_1',
            attackingArmy: MOCK_BATTLE_DATA.attackerArmy,
            formation: 'balanced'
        };
        
        const execution = await makeRequest('POST', '/api/battles/execute', raidData);
        if (!execution.success) throw new Error('Failed to execute raid');
        
        // 4. Get battle results
        const battleId = execution.data.battle?.id || 'test-battle-flow';
        const results = await makeRequest('GET', `/api/battles/results/${battleId}`);
        
        // 5. Check battle history
        await delay(1000); // Allow time for history to update
        const history = await makeRequest('GET', `/api/battles/history/${MOCK_COLONY_ID}`);
        
        const flowPassed = targets.success && simulation.success && 
                          execution.success && history.success;
        
        logTest('Complete Battle Flow Integration', flowPassed,
            flowPassed ? '' : 'One or more steps in the battle flow failed');
        
        return { targets, simulation, execution, results, history };
        
    } catch (error) {
        logTest('Complete Battle Flow Integration', false, error.message);
        return null;
    }
}

/**
 * Test 10: Performance and Load Testing
 */
async function testPerformanceAndLoad() {
    console.log('\n⚡ Testing Performance and Load...');
    
    const startTime = Date.now();
    const concurrentRequests = 5;
    
    try {
        // Run multiple concurrent battle simulations
        const promises = Array(concurrentRequests).fill().map(() => 
            makeRequest('POST', '/api/battles/simulate', MOCK_BATTLE_DATA)
        );
        
        const results = await Promise.all(promises);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const allSuccessful = results.every(r => r.success);
        const performancePassed = allSuccessful && duration < 10000; // Under 10 seconds
        
        logTest('Performance and Load Test', performancePassed,
            performancePassed ? `Completed ${concurrentRequests} requests in ${duration}ms` : 
            `Failed: ${results.filter(r => !r.success).length} failures, ${duration}ms duration`);
        
        return { results, duration };
        
    } catch (error) {
        logTest('Performance and Load Test', false, error.message);
        return null;
    }
}

/**
 * Main Test Runner
 */
async function runBattleSystemTests() {
    console.log('🚀 Starting Comprehensive Battle System Test Suite...\n');
    console.log('Testing Task 13: Battle Simulation System');
    console.log('=' .repeat(60));
    
    const startTime = Date.now();
    
    try {
        // Run all tests
        await testBattleAPIHealth();
        await delay(TEST_CONFIG.delay);
        
        await testBattleSimulation();
        await delay(TEST_CONFIG.delay);
        
        await testAIAttackScheduler();
        await delay(TEST_CONFIG.delay);
        
        await testPlayerRaidSystem();
        await delay(TEST_CONFIG.delay);
        
        await testBattleResultsAndRewards();
        await delay(TEST_CONFIG.delay);
        
        await testBattleHistory();
        await delay(TEST_CONFIG.delay);
        
        await testRetreatMechanics();
        await delay(TEST_CONFIG.delay);
        
        await testIncomingAttacks();
        await delay(TEST_CONFIG.delay);
        
        await testCompleteBattleFlow();
        await delay(TEST_CONFIG.delay);
        
        await testPerformanceAndLoad();
        
    } catch (error) {
        console.error('❌ Test suite encountered an error:', error.message);
        testResults.failed++;
    }
    
    // Print final results
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 BATTLE SYSTEM TEST RESULTS');
    console.log('=' .repeat(60));
    console.log(`✅ Passed: ${testResults.passed}/${testResults.total}`);
    console.log(`❌ Failed: ${testResults.failed}/${testResults.total}`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.details
            .filter(test => !test.passed)
            .forEach(test => console.log(`   - ${test.testName}: ${test.details}`));
    }
    
    console.log('\n🎯 Battle System Test Suite Complete!');
    
    // Return summary for programmatic use
    return {
        passed: testResults.passed,
        failed: testResults.failed,
        total: testResults.total,
        successRate: (testResults.passed / testResults.total) * 100,
        duration: parseFloat(duration),
        details: testResults.details
    };
}

// Run tests if called directly
if (require.main === module) {
    runBattleSystemTests()
        .then(results => {
            process.exit(results.failed > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runBattleSystemTests }; 
/**
 * Test Script for AI Attack Scheduler System
 * Tests the AI attack scheduling functionality and API endpoints
 */

const { performance } = require('perf_hooks');

// Test configurations
const BASE_URL = 'http://localhost:3001';
const TEST_COLONY_ID = 'test-colony-123';

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

// Helper function to make HTTP requests
async function makeRequest(method, url, data = null) {
    const fetch = (await import('node-fetch')).default;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    return {
        status: response.status,
        ok: response.ok,
        data: responseData
    };
}

// Test helper functions
function logTest(testName) {
    console.log(`${colors.blue}🧪 Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logInfo(message) {
    console.log(`${colors.yellow}ℹ️  ${message}${colors.reset}`);
}

function logResult(title, data) {
    console.log(`${colors.bright}📊 ${title}:${colors.reset}`);
    console.log(JSON.stringify(data, null, 2));
    console.log();
}

// Test functions
async function testBattleAPIHealth() {
    logTest('Battle API Health Check');
    
    try {
        const response = await makeRequest('GET', `${BASE_URL}/api/battles/health`);
        
        if (response.ok) {
            logSuccess('Battle API is operational');
            logResult('Health Check Response', response.data);
            return true;
        } else {
            logError(`Health check failed: ${response.data.error}`);
            return false;
        }
    } catch (error) {
        logError(`Failed to connect to API: ${error.message}`);
        return false;
    }
}

async function testSchedulerStatus() {
    logTest('AI Attack Scheduler Status');
    
    try {
        const response = await makeRequest('GET', `${BASE_URL}/api/battles/scheduler/status`);
        
        if (response.ok) {
            logSuccess('Scheduler status retrieved successfully');
            logResult('Scheduler Status', response.data.scheduler);
            return response.data.scheduler;
        } else {
            logError(`Failed to get scheduler status: ${response.data.error}`);
            return null;
        }
    } catch (error) {
        logError(`Error getting scheduler status: ${error.message}`);
        return null;
    }
}

async function testStartScheduler() {
    logTest('Starting AI Attack Scheduler');
    
    try {
        const response = await makeRequest('POST', `${BASE_URL}/api/battles/scheduler/start`);
        
        if (response.ok) {
            logSuccess('AI Attack Scheduler started successfully');
            logResult('Start Response', response.data);
            return true;
        } else {
            logError(`Failed to start scheduler: ${response.data.error}`);
            return false;
        }
    } catch (error) {
        logError(`Error starting scheduler: ${error.message}`);
        return false;
    }
}

async function testStopScheduler() {
    logTest('Stopping AI Attack Scheduler');
    
    try {
        const response = await makeRequest('POST', `${BASE_URL}/api/battles/scheduler/stop`);
        
        if (response.ok) {
            logSuccess('AI Attack Scheduler stopped successfully');
            logResult('Stop Response', response.data);
            return true;
        } else {
            logError(`Failed to stop scheduler: ${response.data.error}`);
            return false;
        }
    } catch (error) {
        logError(`Error stopping scheduler: ${error.message}`);
        return false;
    }
}

async function testIncomingAttacks() {
    logTest('Checking Incoming Attacks');
    
    try {
        const response = await makeRequest('GET', `${BASE_URL}/api/battles/incoming?colonyId=${TEST_COLONY_ID}`);
        
        if (response.ok) {
            logSuccess('Incoming attacks check completed');
            logResult('Incoming Attacks', response.data);
            return response.data;
        } else {
            logError(`Failed to check incoming attacks: ${response.data.error}`);
            return null;
        }
    } catch (error) {
        logError(`Error checking incoming attacks: ${error.message}`);
        return null;
    }
}

async function testBattleTargets() {
    logTest('Getting Available Battle Targets');
    
    try {
        const response = await makeRequest('GET', `${BASE_URL}/api/battles/targets/${TEST_COLONY_ID}`);
        
        if (response.ok) {
            logSuccess('Battle targets retrieved successfully');
            logResult('Available Targets', response.data);
            return response.data.targets;
        } else {
            logError(`Failed to get battle targets: ${response.data.error}`);
            return null;
        }
    } catch (error) {
        logError(`Error getting battle targets: ${error.message}`);
        return null;
    }
}

async function testBattleSimulation() {
    logTest('Battle Simulation');
    
    const testBattle = {
        attackerArmy: { soldier: 10, worker: 5, scout: 2 },
        defenderArmy: { soldier: 8, worker: 3, guard: 2 },
        battleConditions: {
            terrain: 'forest',
            attackerFormation: 'aggressive',
            defenderFormation: 'defensive'
        }
    };
    
    try {
        const response = await makeRequest('POST', `${BASE_URL}/api/battles/simulate`, testBattle);
        
        if (response.ok) {
            logSuccess('Battle simulation completed');
            logResult('Battle Result', response.data.battle);
            return response.data.battle;
        } else {
            logError(`Battle simulation failed: ${response.data.error}`);
            return null;
        }
    } catch (error) {
        logError(`Error running battle simulation: ${error.message}`);
        return null;
    }
}

async function testBattleExecution() {
    logTest('Battle Execution (Player Raid)');
    
    const testRaid = {
        attackerColonyId: TEST_COLONY_ID,
        targetColonyId: 'ai_colony_1',
        attackingArmy: { soldier: 8, worker: 4, scout: 1 },
        formation: 'balanced',
        retreatThreshold: 0.3
    };
    
    try {
        const response = await makeRequest('POST', `${BASE_URL}/api/battles/execute`, testRaid);
        
        if (response.ok) {
            logSuccess('Battle execution completed');
            logResult('Battle Execution Result', response.data);
            return response.data;
        } else {
            logError(`Battle execution failed: ${response.data.error}`);
            return null;
        }
    } catch (error) {
        logError(`Error executing battle: ${error.message}`);
        return null;
    }
}

async function testBattleHistory() {
    logTest('Battle History Retrieval');
    
    try {
        const response = await makeRequest('GET', `${BASE_URL}/api/battles/history/${TEST_COLONY_ID}?limit=5`);
        
        if (response.ok) {
            logSuccess('Battle history retrieved successfully');
            logResult('Battle History', response.data);
            return response.data;
        } else {
            logError(`Failed to get battle history: ${response.data.error}`);
            return null;
        }
    } catch (error) {
        logError(`Error getting battle history: ${error.message}`);
        return null;
    }
}

async function testBattleStats() {
    logTest('Battle Statistics');
    
    try {
        const response = await makeRequest('GET', `${BASE_URL}/api/battles/stats/${TEST_COLONY_ID}`);
        
        if (response.ok) {
            logSuccess('Battle statistics retrieved successfully');
            logResult('Battle Statistics', response.data.stats);
            return response.data.stats;
        } else {
            logError(`Failed to get battle statistics: ${response.data.error}`);
            return null;
        }
    } catch (error) {
        logError(`Error getting battle statistics: ${error.message}`);
        return null;
    }
}

async function testRetreatMechanism() {
    logTest('Retreat Mechanism');
    
    const testRetreat = {
        colonyId: TEST_COLONY_ID,
        remainingArmy: { soldier: 5, worker: 3, scout: 1 }
    };
    
    try {
        const response = await makeRequest('POST', `${BASE_URL}/api/battles/retreat/test-battle-123`, testRetreat);
        
        if (response.ok) {
            logSuccess('Retreat mechanism test completed');
            logResult('Retreat Result', response.data);
            return response.data;
        } else {
            logError(`Retreat test failed: ${response.data.error}`);
            return null;
        }
    } catch (error) {
        logError(`Error testing retreat: ${error.message}`);
        return null;
    }
}

// Main test runner
async function runAllTests() {
    console.log(`${colors.bright}🚀 AI Attack Scheduler System Test Suite${colors.reset}`);
    console.log(`${colors.blue}Testing against: ${BASE_URL}${colors.reset}`);
    console.log('='.repeat(60));
    
    const startTime = performance.now();
    let passed = 0;
    let failed = 0;
    
    // Test sequence
    const tests = [
        { name: 'API Health Check', fn: testBattleAPIHealth },
        { name: 'Scheduler Status', fn: testSchedulerStatus },
        { name: 'Start Scheduler', fn: testStartScheduler },
        { name: 'Incoming Attacks Check', fn: testIncomingAttacks },
        { name: 'Battle Targets', fn: testBattleTargets },
        { name: 'Battle Simulation', fn: testBattleSimulation },
        { name: 'Battle Execution', fn: testBattleExecution },
        { name: 'Battle History', fn: testBattleHistory },
        { name: 'Battle Statistics', fn: testBattleStats },
        { name: 'Retreat Mechanism', fn: testRetreatMechanism },
        { name: 'Stop Scheduler', fn: testStopScheduler }
    ];
    
    for (const test of tests) {
        try {
            console.log(`\n${'─'.repeat(40)}`);
            const result = await test.fn();
            if (result !== false && result !== null) {
                passed++;
                logSuccess(`${test.name} passed`);
            } else {
                failed++;
                logError(`${test.name} failed`);
            }
        } catch (error) {
            failed++;
            logError(`${test.name} failed with error: ${error.message}`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.bright}📊 Test Results Summary${colors.reset}`);
    console.log(`Tests passed: ${colors.green}${passed}${colors.reset}`);
    console.log(`Tests failed: ${colors.red}${failed}${colors.reset}`);
    console.log(`Total time: ${duration}s`);
    
    const successRate = (passed / (passed + failed) * 100).toFixed(1);
    if (successRate >= 80) {
        console.log(`${colors.green}🎉 Success rate: ${successRate}% - AI Attack Scheduler is working well!${colors.reset}`);
    } else {
        console.log(`${colors.yellow}⚠️  Success rate: ${successRate}% - Some issues detected${colors.reset}`);
    }
    
    if (failed === 0) {
        console.log(`${colors.green}${colors.bright}✅ All tests passed! AI Attack Scheduler system is fully functional.${colors.reset}`);
    } else {
        console.log(`${colors.red}❌ ${failed} test(s) failed. Please check the issues above.${colors.reset}`);
    }
}

// Run the tests if this script is executed directly
if (require.main === module) {
    runAllTests().catch(error => {
        console.error(`${colors.red}💥 Test suite failed with error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testBattleAPIHealth,
    testSchedulerStatus,
    testStartScheduler,
    testStopScheduler,
    testIncomingAttacks,
    testBattleTargets,
    testBattleSimulation,
    testBattleExecution,
    testBattleHistory,
    testBattleStats,
    testRetreatMechanism
}; 
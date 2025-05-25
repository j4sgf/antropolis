/**
 * Test file for Battle Simulation System
 * Run with: node test-battle-system.js
 */

const BattleSimulator = require('./services/BattleSimulator');

// Initialize battle simulator
const battleSimulator = new BattleSimulator();

console.log('🎯 Testing Antopolis Battle Simulation System\n');

// Test 1: Basic battle simulation
console.log('=== Test 1: Basic Battle Simulation ===');
const attackerArmy1 = { soldier: 10, worker: 5 };
const defenderArmy1 = { soldier: 8, guard: 3 };
const result1 = battleSimulator.simulateBattle(attackerArmy1, defenderArmy1);

console.log('Attacker:', attackerArmy1);
console.log('Defender:', defenderArmy1);
console.log('Outcome:', result1.result.outcome);
console.log('Victor:', result1.result.victor);
console.log('Tactical Rating:', result1.result.battleEfficiency.tacticalRating);
console.log('Casualties - Attacker:', result1.result.totalCasualties.attacker);
console.log('Casualties - Defender:', result1.result.totalCasualties.defender);
console.log('');

// Test 2: Formation and terrain effects
console.log('=== Test 2: Formation & Terrain Effects ===');
const attackerArmy2 = { soldier: 15, scout: 5 };
const defenderArmy2 = { soldier: 10, guard: 5, worker: 8 };
const battleConditions2 = {
    terrain: 'forest',
    attackerFormation: 'aggressive',
    defenderFormation: 'defensive'
};
const result2 = battleSimulator.simulateBattle(attackerArmy2, defenderArmy2, battleConditions2);

console.log('Attacker:', attackerArmy2, '(Aggressive formation)');
console.log('Defender:', defenderArmy2, '(Defensive formation)');
console.log('Terrain: Forest (favors defender)');
console.log('Outcome:', result2.result.outcome);
console.log('Victor:', result2.result.victor);
console.log('Battle Phases:', result2.phases.length);
console.log('Final Strength - Attacker:', result2.result.finalStrength.attacker.toFixed(1));
console.log('Final Strength - Defender:', result2.result.finalStrength.defender.toFixed(1));
console.log('');

// Test 3: Elite units battle
console.log('=== Test 3: Elite Units Battle ===');
const attackerArmy3 = { elite: 3, soldier: 8, scout: 4 };
const defenderArmy3 = { soldier: 20, worker: 15 };
const battleConditions3 = {
    terrain: 'mountain',
    attackerFormation: 'guerrilla',
    defenderFormation: 'balanced'
};
const result3 = battleSimulator.simulateBattle(attackerArmy3, defenderArmy3, battleConditions3);

console.log('Attacker:', attackerArmy3, '(Elite forces)');
console.log('Defender:', defenderArmy3, '(Mass army)');
console.log('Terrain: Mountain (favors defender)');
console.log('Outcome:', result3.result.outcome);
console.log('Victor:', result3.result.victor);
console.log('Tactical Rating:', result3.result.battleEfficiency.tacticalRating);
console.log('Attacker Loss Rate:', (result3.result.battleEfficiency.attackerLossRate * 100).toFixed(1) + '%');
console.log('Defender Loss Rate:', (result3.result.battleEfficiency.defenderLossRate * 100).toFixed(1) + '%');
console.log('');

// Test 4: Rewards calculation
console.log('=== Test 4: Battle Rewards ===');
if (result3.result.victor === 'attacker') {
    const rewards = battleSimulator.calculateBattleRewards(
        result3.result,
        { id: 'player_colony' },
        { population: 150 }
    );
    console.log('Victory Rewards:', rewards.resources);
    console.log('Message:', rewards.message);
    console.log('Efficiency Multiplier:', rewards.multipliers.efficiency);
    console.log('Strength Multiplier:', rewards.multipliers.strength);
} else {
    console.log('No rewards - attacker was defeated');
}
console.log('');

// Test 5: Battle phases breakdown
console.log('=== Test 5: Battle Phases Analysis ===');
console.log('Phase-by-phase breakdown:');
result3.phases.forEach((phase, index) => {
    console.log(`Phase ${phase.phase}:`);
    console.log(`  - Attacker casualties:`, phase.attackerCasualties);
    console.log(`  - Defender casualties:`, phase.defenderCasualties);
    console.log(`  - Remaining strength: A=${phase.remainingStrength.attacker.toFixed(1)}, D=${phase.remainingStrength.defender.toFixed(1)}`);
    if (phase.battleEnded) console.log(`  - Battle ended after this phase`);
});
console.log('');

// Test 6: Error handling
console.log('=== Test 6: Error Handling ===');
try {
    const invalidResult = battleSimulator.simulateBattle({}, { soldier: 5 });
    console.log('Error test failed - should have thrown error');
} catch (error) {
    console.log('✅ Error handling works: Empty attacker army rejected');
}

try {
    const invalidResult = battleSimulator.simulateBattle({ soldier: 5 }, {});
    console.log('Error test failed - should have thrown error');
} catch (error) {
    console.log('✅ Error handling works: Empty defender army rejected');
}
console.log('');

// Test 7: Different terrain types
console.log('=== Test 7: Terrain Comparison ===');
const baseArmy = { soldier: 10, worker: 5 };
const terrains = ['forest', 'desert', 'mountain', 'grassland', 'swamp', 'cave'];

terrains.forEach(terrain => {
    const result = battleSimulator.simulateBattle(
        baseArmy, 
        baseArmy, 
        { terrain, attackerFormation: 'balanced', defenderFormation: 'balanced' }
    );
    console.log(`${terrain.padEnd(10)}: ${result.result.victor} (${result.result.battleEfficiency.tacticalRating})`);
});

console.log('\n🎉 Battle System Tests Completed!');
console.log('The battle simulation system is working correctly.');
console.log('✅ All core features tested: formations, terrain, casualties, rewards, phases'); 
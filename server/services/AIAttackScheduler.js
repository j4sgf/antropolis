/**
 * AIAttackScheduler - Manages scheduled attacks from AI colonies
 * Implements dynamic attack scheduling based on difficulty and game progression
 */

const BattleSimulator = require('./BattleSimulator');
const { supabase, handleDatabaseError } = require('../config/database');

class AIAttackScheduler {
  constructor() {
    this.schedulers = new Map(); // Track active schedulers per colony
    this.attackIntervals = new Map(); // Store interval timers
    this.defaultSettings = {
      easy: {
        baseAttackInterval: 300000, // 5 minutes in milliseconds
        aggressionMultiplier: 0.6,
        attackChance: 0.3,
        maxConcurrentAttacks: 1,
        progressionScaling: 0.8
      },
      normal: {
        baseAttackInterval: 180000, // 3 minutes
        aggressionMultiplier: 1.0,
        attackChance: 0.5,
        maxConcurrentAttacks: 2,
        progressionScaling: 1.0
      },
      hard: {
        baseAttackInterval: 120000, // 2 minutes
        aggressionMultiplier: 1.4,
        attackChance: 0.7,
        maxConcurrentAttacks: 3,
        progressionScaling: 1.2
      }
    };
    
    this.isInitialized = false;
    this.activeAttacks = new Map(); // Track ongoing attacks
  }

  /**
   * Initialize the scheduler for all active AI colonies
   */
  async initialize() {
    try {
      console.log('🤖 Initializing AI Attack Scheduler...');
      
      // Get all active AI colonies
      const aiColonies = await this.getActiveAIColonies();
      
      for (const colony of aiColonies) {
        await this.startSchedulerForColony(colony.id);
      }
      
      this.isInitialized = true;
      console.log(`✅ AI Attack Scheduler initialized for ${aiColonies.length} colonies`);
      
    } catch (error) {
      console.error('❌ Error initializing AI Attack Scheduler:', error);
      throw error;
    }
  }

  /**
   * Start attack scheduler for a specific AI colony
   */
  async startSchedulerForColony(colonyId) {
    try {
      // Get colony details and settings
      const colony = await this.getColonyDetails(colonyId);
      if (!colony || !colony.is_ai) {
        console.log(`⚠️  Colony ${colonyId} is not an AI colony, skipping scheduler`);
        return;
      }

      // Get difficulty settings
      const difficulty = await this.getDifficultySettings(colony.user_id);
      const settings = this.defaultSettings[difficulty.level] || this.defaultSettings.normal;

      // Calculate actual attack interval based on colony progression
      const attackInterval = this.calculateAttackInterval(colony, settings);

      console.log(`🎯 Starting attack scheduler for AI colony ${colonyId} (${colony.name}) - interval: ${attackInterval}ms`);

      // Clear existing scheduler if any
      this.stopSchedulerForColony(colonyId);

      // Start new scheduler
      const intervalId = setInterval(async () => {
        await this.evaluateAttackOpportunity(colonyId, settings);
      }, attackInterval);

      this.attackIntervals.set(colonyId, intervalId);
      this.schedulers.set(colonyId, {
        colonyId,
        settings,
        interval: attackInterval,
        lastAttack: new Date(),
        nextAttackWindow: new Date(Date.now() + attackInterval)
      });

    } catch (error) {
      console.error(`❌ Error starting scheduler for colony ${colonyId}:`, error);
    }
  }

  /**
   * Stop attack scheduler for a specific colony
   */
  stopSchedulerForColony(colonyId) {
    const intervalId = this.attackIntervals.get(colonyId);
    if (intervalId) {
      clearInterval(intervalId);
      this.attackIntervals.delete(colonyId);
      this.schedulers.delete(colonyId);
      console.log(`🛑 Stopped attack scheduler for colony ${colonyId}`);
    }
  }

  /**
   * Evaluate whether to launch an attack from a specific AI colony
   */
  async evaluateAttackOpportunity(colonyId, settings) {
    try {
      const colony = await this.getColonyDetails(colonyId);
      if (!colony) return;

      // Check if colony is eligible to attack
      if (!this.isEligibleForAttack(colony, settings)) {
        return;
      }

      // Find potential targets
      const targets = await this.findPotentialTargets(colony);
      if (targets.length === 0) {
        console.log(`🔍 No targets found for AI colony ${colonyId}`);
        return;
      }

      // Evaluate each target and select the best one
      const bestTarget = await this.selectBestTarget(colony, targets, settings);
      if (!bestTarget) {
        console.log(`🎯 No suitable target selected for AI colony ${colonyId}`);
        return;
      }

      // Determine if attack should proceed based on chance and conditions
      if (Math.random() > settings.attackChance) {
        console.log(`🎲 Attack chance failed for AI colony ${colonyId}`);
        return;
      }

      // Launch the attack
      await this.launchAttack(colony, bestTarget, settings);

    } catch (error) {
      console.error(`❌ Error evaluating attack opportunity for colony ${colonyId}:`, error);
    }
  }

  /**
   * Check if a colony is eligible to launch an attack
   */
  isEligibleForAttack(colony, settings) {
    // Check if already at max concurrent attacks
    const activeAttacksCount = this.getActiveAttacksCount(colony.id);
    if (activeAttacksCount >= settings.maxConcurrentAttacks) {
      return false;
    }

    // Check if colony has sufficient military strength
    const militaryStrength = this.calculateMilitaryStrength(colony);
    if (militaryStrength < 10) { // Minimum threshold
      return false;
    }

    // Check cooldown periods
    const lastAttackTime = this.getLastAttackTime(colony.id);
    const minCooldown = 60000; // 1 minute minimum between attacks
    if (lastAttackTime && (Date.now() - lastAttackTime) < minCooldown) {
      return false;
    }

    return true;
  }

  /**
   * Find potential attack targets for an AI colony
   */
  async findPotentialTargets(attackerColony) {
    try {
      // Get all colonies within reasonable distance
      const { data: colonies, error } = await supabase
        .from('colonies')
        .select('*')
        .neq('id', attackerColony.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching potential targets:', error);
        return [];
      }

      const targets = [];
      
      for (const colony of colonies) {
        // Calculate distance
        const distance = this.calculateDistance(
          attackerColony.base_x || 0, 
          attackerColony.base_y || 0,
          colony.base_x || 0, 
          colony.base_y || 0
        );

        // Only consider targets within reasonable range
        if (distance <= 50) { // Max attack range
          targets.push({
            ...colony,
            distance,
            militaryStrength: this.calculateMilitaryStrength(colony),
            resourceValue: this.calculateResourceValue(colony)
          });
        }
      }

      return targets;

    } catch (error) {
      console.error('Error finding potential targets:', error);
      return [];
    }
  }

  /**
   * Select the best target based on various factors
   */
  async selectBestTarget(attacker, targets, settings) {
    if (targets.length === 0) return null;

    let bestTarget = null;
    let bestScore = 0;

    for (const target of targets) {
      const score = this.calculateTargetScore(attacker, target, settings);
      
      if (score > bestScore) {
        bestScore = score;
        bestTarget = target;
      }
    }

    // Only select target if there's a reasonable chance of success
    if (bestScore < 0.3) {
      return null;
    }

    return bestTarget;
  }

  /**
   * Calculate target attractiveness score
   */
  calculateTargetScore(attacker, target, settings) {
    const attackerStrength = this.calculateMilitaryStrength(attacker);
    const targetStrength = this.calculateMilitaryStrength(target);
    
    // Strength ratio (prefer weaker targets)
    const strengthRatio = targetStrength > 0 ? attackerStrength / targetStrength : 2.0;
    const strengthScore = Math.min(1.0, Math.max(0.1, strengthRatio - 0.5));

    // Resource value (prefer resource-rich targets)
    const resourceScore = Math.min(1.0, target.resourceValue / 500);

    // Distance factor (prefer closer targets)
    const distanceScore = Math.max(0.1, 1.0 - (target.distance / 50));

    // Personality-based preferences
    const personalityBonus = this.getPersonalityTargetBonus(attacker, target);

    // Weighted final score
    const finalScore = (
      strengthScore * 0.4 +
      resourceScore * 0.3 +
      distanceScore * 0.2 +
      personalityBonus * 0.1
    ) * settings.aggressionMultiplier;

    return Math.min(1.0, finalScore);
  }

  /**
   * Get personality-based targeting bonus
   */
  getPersonalityTargetBonus(attacker, target) {
    switch (attacker.personality) {
      case 'aggressive':
        return target.militaryStrength > 50 ? 0.3 : 0.1; // Prefers strong targets
      case 'opportunist':
        return target.militaryStrength < 30 ? 0.3 : 0.1; // Prefers weak targets
      case 'expansionist':
        return target.territory_size > 8 ? 0.3 : 0.1; // Prefers large territories
      default:
        return 0.15; // Balanced approach
    }
  }

  /**
   * Launch an attack against a target
   */
  async launchAttack(attacker, target, settings) {
    try {
      console.log(`⚔️  AI Colony ${attacker.id} (${attacker.name}) launching attack on ${target.id} (${target.name})`);

      // Pre-calculate battle outcome
      const battleOutcome = await this.simulateBattle(attacker, target);
      
      // Create attack record
      const attack = {
        id: `attack_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        attacker_id: attacker.id,
        target_id: target.id,
        attack_type: this.determineAttackType(attacker, target),
        forces_sent: this.calculateAttackForces(attacker),
        estimated_arrival: new Date(Date.now() + this.calculateTravelTime(attacker, target)),
        status: 'incoming',
        created_at: new Date(),
        battle_outcome: battleOutcome
      };

      // Store attack in database
      await this.storeAttack(attack);

      // Update active attacks tracking
      this.activeAttacks.set(attack.id, attack);

      // Update scheduler state
      const scheduler = this.schedulers.get(attacker.id);
      if (scheduler) {
        scheduler.lastAttack = new Date();
      }

      console.log(`📊 Attack ${attack.id} scheduled for arrival at ${attack.estimated_arrival}`);

      // Schedule battle resolution
      setTimeout(async () => {
        await this.resolveBattle(attack.id);
      }, this.calculateTravelTime(attacker, target));

    } catch (error) {
      console.error('❌ Error launching attack:', error);
    }
  }

  /**
   * Simulate battle to pre-calculate outcome
   */
  async simulateBattle(attacker, target) {
    const battleSimulator = new BattleSimulator();
    
    const attackerForces = {
      colony: attacker,
      units: this.generateAttackForces(attacker),
      formation: this.selectFormation(attacker),
      terrain: 'grassland' // Default terrain
    };

    const defenderForces = {
      colony: target,
      units: this.generateDefenseForces(target),
      formation: 'defensive',
      terrain: 'grassland'
    };

    return battleSimulator.simulateBattle(attackerForces, defenderForces);
  }

  /**
   * Resolve a scheduled battle
   */
  async resolveBattle(attackId) {
    try {
      const attack = this.activeAttacks.get(attackId);
      if (!attack) {
        console.error(`❌ Attack ${attackId} not found in active attacks`);
        return;
      }

      console.log(`⚔️  Resolving battle for attack ${attackId}`);

      // Update attack status
      attack.status = 'resolved';
      attack.resolved_at = new Date();

      // Apply battle results
      await this.applyBattleResults(attack);

      // Clean up
      this.activeAttacks.delete(attackId);

      console.log(`✅ Battle ${attackId} resolved`);

    } catch (error) {
      console.error(`❌ Error resolving battle ${attackId}:`, error);
    }
  }

  /**
   * Apply battle results to both colonies
   */
  async applyBattleResults(attack) {
    const outcome = attack.battle_outcome;
    
    try {
      // Update attacker colony
      if (outcome.attacker_casualties) {
        await this.applyCasualties(attack.attacker_id, outcome.attacker_casualties);
      }

      // Update defender colony
      if (outcome.defender_casualties) {
        await this.applyCasualties(attack.target_id, outcome.defender_casualties);
      }

      // Apply resource transfers if attacker won
      if (outcome.winner === 'attacker' && outcome.resources_captured) {
        await this.transferResources(attack.target_id, attack.attacker_id, outcome.resources_captured);
      }

      // Create battle history record
      await this.createBattleRecord(attack);

    } catch (error) {
      console.error('❌ Error applying battle results:', error);
    }
  }

  // Utility methods
  calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  calculateMilitaryStrength(colony) {
    return (colony.used_military_capacity || 0) + (colony.population || 0) * 0.3;
  }

  calculateResourceValue(colony) {
    return (colony.food_storage || 0) + 
           (colony.wood_storage || 0) + 
           (colony.stone_storage || 0) + 
           (colony.mineral_storage || 0);
  }

  calculateAttackInterval(colony, settings) {
    const progressionFactor = Math.min(2.0, (colony.total_ticks || 0) / 1000);
    return Math.floor(settings.baseAttackInterval / (1 + progressionFactor * settings.progressionScaling));
  }

  determineAttackType(attacker, target) {
    const strengthRatio = this.calculateMilitaryStrength(attacker) / Math.max(1, this.calculateMilitaryStrength(target));
    
    if (strengthRatio > 2.0) return 'raid';
    if (strengthRatio > 1.5) return 'assault';
    if (strengthRatio > 1.0) return 'skirmish';
    return 'probe';
  }

  calculateAttackForces(colony) {
    const totalMilitary = colony.used_military_capacity || 0;
    const commitmentRatio = 0.6 + Math.random() * 0.3; // 60-90% of forces
    return Math.floor(totalMilitary * commitmentRatio);
  }

  calculateTravelTime(attacker, target) {
    const distance = this.calculateDistance(
      attacker.base_x || 0, attacker.base_y || 0,
      target.base_x || 0, target.base_y || 0
    );
    return Math.max(30000, distance * 1000); // Minimum 30 seconds, plus distance factor
  }

  getActiveAttacksCount(colonyId) {
    let count = 0;
    for (const attack of this.activeAttacks.values()) {
      if (attack.attacker_id === colonyId && attack.status === 'incoming') {
        count++;
      }
    }
    return count;
  }

  getLastAttackTime(colonyId) {
    const scheduler = this.schedulers.get(colonyId);
    return scheduler ? scheduler.lastAttack.getTime() : null;
  }

  generateAttackForces(colony) {
    // Simplified force generation - would be more complex in full implementation
    return {
      workers: Math.floor((colony.population || 0) * 0.1),
      soldiers: Math.floor((colony.used_military_capacity || 0) * 0.8),
      scouts: Math.floor((colony.population || 0) * 0.05)
    };
  }

  generateDefenseForces(colony) {
    return {
      workers: Math.floor((colony.population || 0) * 0.2),
      soldiers: colony.used_military_capacity || 0,
      scouts: Math.floor((colony.population || 0) * 0.1)
    };
  }

  selectFormation(colony) {
    switch (colony.personality) {
      case 'aggressive': return 'aggressive';
      case 'defensive': return 'defensive';
      case 'militant': return 'aggressive';
      default: return 'balanced';
    }
  }

  // Database operations
  async getActiveAIColonies() {
    try {
      const { data, error } = await supabase
        .from('ai_colonies')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI colonies:', error);
      return [];
    }
  }

  async getColonyDetails(colonyId) {
    try {
      const { data, error } = await supabase
        .from('ai_colonies')
        .select('*')
        .eq('id', colonyId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching colony ${colonyId}:`, error);
      return null;
    }
  }

  async getDifficultySettings(userId) {
    // Placeholder - would fetch from difficulty settings table
    return { level: 'normal' };
  }

  async storeAttack(attack) {
    try {
      const { error } = await supabase
        .from('ai_attacks')
        .insert([attack]);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing attack:', error);
    }
  }

  async applyCasualties(colonyId, casualties) {
    // Placeholder - would update colony population/military
    console.log(`💀 Applying ${casualties} casualties to colony ${colonyId}`);
  }

  async transferResources(fromColonyId, toColonyId, resources) {
    // Placeholder - would transfer resources between colonies
    console.log(`💰 Transferring resources from ${fromColonyId} to ${toColonyId}:`, resources);
  }

  async createBattleRecord(attack) {
    try {
      const battleRecord = {
        id: `battle_${attack.id}`,
        attacker_id: attack.attacker_id,
        defender_id: attack.target_id,
        battle_type: attack.attack_type,
        outcome: attack.battle_outcome,
        timestamp: new Date(),
        forces_involved: {
          attacker: attack.forces_sent,
          defender: attack.battle_outcome.defender_forces
        }
      };

      const { error } = await supabase
        .from('battle_history')
        .insert([battleRecord]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating battle record:', error);
    }
  }

  /**
   * Shutdown all schedulers
   */
  shutdown() {
    console.log('🛑 Shutting down AI Attack Scheduler...');
    
    for (const [colonyId] of this.attackIntervals) {
      this.stopSchedulerForColony(colonyId);
    }
    
    this.isInitialized = false;
    console.log('✅ AI Attack Scheduler shutdown complete');
  }

  /**
   * Get status of all active schedulers
   */
  getStatus() {
    const schedulers = Array.from(this.schedulers.values());
    const activeAttacks = Array.from(this.activeAttacks.values());
    
    return {
      initialized: this.isInitialized,
      activeSchedulers: schedulers.length,
      totalActiveAttacks: activeAttacks.length,
      schedulers: schedulers.map(s => ({
        colonyId: s.colonyId,
        interval: s.interval,
        lastAttack: s.lastAttack,
        nextAttackWindow: s.nextAttackWindow
      })),
      incomingAttacks: activeAttacks.filter(a => a.status === 'incoming').length,
      resolvedAttacks: activeAttacks.filter(a => a.status === 'resolved').length
    };
  }
}

module.exports = AIAttackScheduler; 
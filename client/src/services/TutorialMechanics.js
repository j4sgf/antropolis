/**
 * TutorialMechanics - Simplified game mechanics for tutorial mode
 * Part of subtask 22.4: Interactive Tutorial Tasks and Rewards
 */

class TutorialMechanics {
  constructor() {
    this.isActive = false;
    this.originalMechanics = {};
    this.tutorialResources = {};
    this.tutorialColony = null;
    this.guidedActions = new Map();
  }

  /**
   * Activate tutorial mode with simplified mechanics
   */
  activateTutorialMode() {
    this.isActive = true;
    this.setupTutorialResources();
    this.setupTutorialColony();
    this.overrideGameMechanics();
    
    console.log('🎓 Tutorial mode activated');
  }

  /**
   * Deactivate tutorial mode and restore normal mechanics
   */
  deactivateTutorialMode() {
    this.isActive = false;
    this.restoreGameMechanics();
    this.cleanupTutorialData();
    
    console.log('🎓 Tutorial mode deactivated');
  }

  /**
   * Setup tutorial-specific resources with boosted amounts
   */
  setupTutorialResources() {
    this.tutorialResources = {
      food: 1000,        // Extra food for safety
      materials: 500,    // Extra materials for building
      water: 300,        // Extra water for structures
      minerals: 100,     // Some minerals for evolution
      evolutionPoints: 200, // Bonus evolution points
      population: 20,    // Starting population
      maxPopulation: 50  // Higher cap for tutorial
    };

    // Store tutorial resources in localStorage
    localStorage.setItem('tutorial-resources', JSON.stringify(this.tutorialResources));
  }

  /**
   * Create a tutorial-specific colony with optimal settings
   */
  setupTutorialColony() {
    this.tutorialColony = {
      id: 'tutorial-colony',
      name: 'Tutorial Colony',
      level: 1,
      attributes: ['foraging', 'building'], // Optimal for tutorial
      structures: [],
      ants: this.generateTutorialAnts(),
      stats: {
        efficiency: 85,
        happiness: 90,
        health: 95
      },
      tutorial: true
    };

    localStorage.setItem('tutorial-colony', JSON.stringify(this.tutorialColony));
  }

  /**
   * Generate tutorial-friendly ants with diverse roles
   */
  generateTutorialAnts() {
    const ants = [];
    const roles = ['worker', 'scout', 'soldier', 'nurse', 'builder'];
    
    for (let i = 0; i < 15; i++) {
      const ant = {
        id: `tutorial-ant-${i}`,
        role: i < 5 ? roles[i] : 'worker', // Ensure role diversity
        age: Math.random() * 30 + 20, // Adult ants
        health: 90 + Math.random() * 10,
        stamina: 80 + Math.random() * 20,
        experience: Math.random() * 50,
        skills: {
          foraging: 60 + Math.random() * 40,
          building: 50 + Math.random() * 50,
          combat: 40 + Math.random() * 40,
          scouting: 45 + Math.random() * 45
        },
        tutorial: true
      };
      ants.push(ant);
    }
    
    return ants;
  }

  /**
   * Override game mechanics with tutorial-friendly versions
   */
  overrideGameMechanics() {
    // Store original mechanics for restoration
    this.originalMechanics = {
      resourceConsumption: window.gameConfig?.resourceConsumption || 1,
      constructionTime: window.gameConfig?.constructionTime || 1,
      populationGrowth: window.gameConfig?.populationGrowth || 1,
      evolutionCost: window.gameConfig?.evolutionCost || 1
    };

    // Apply tutorial modifiers
    if (window.gameConfig) {
      window.gameConfig.resourceConsumption = 0.5; // Slower consumption
      window.gameConfig.constructionTime = 0.3;    // Faster building
      window.gameConfig.populationGrowth = 1.5;    // Faster growth
      window.gameConfig.evolutionCost = 0.7;       // Cheaper evolution
    }
  }

  /**
   * Restore original game mechanics
   */
  restoreGameMechanics() {
    if (window.gameConfig && this.originalMechanics) {
      Object.assign(window.gameConfig, this.originalMechanics);
    }
  }

  /**
   * Clean up tutorial data
   */
  cleanupTutorialData() {
    localStorage.removeItem('tutorial-resources');
    localStorage.removeItem('tutorial-colony');
    this.tutorialResources = {};
    this.tutorialColony = null;
    this.guidedActions.clear();
  }

  // ===== SIMPLIFIED COLONY CREATION =====

  /**
   * Guided colony creation with predefined good choices
   */
  createTutorialColony(customName) {
    const colonyData = {
      name: customName || 'My First Colony',
      attributes: ['foraging', 'building'], // Recommended combo
      startingResources: this.tutorialResources,
      tutorial: true,
      createdAt: new Date().toISOString()
    };

    // Emit success event
    this.emitTutorialEvent('colony:created', colonyData);
    
    return colonyData;
  }

  /**
   * Validate colony name with helpful suggestions
   */
  validateColonyName(name) {
    if (!name || name.length < 3) {
      return {
        valid: false,
        suggestion: 'Try "Anthill Academy" or "First Colony"'
      };
    }
    
    if (name.length > 20) {
      return {
        valid: false,
        suggestion: 'Keep it shorter - maybe "' + name.substring(0, 15) + '"?'
      };
    }

    return { valid: true };
  }

  // ===== SIMPLIFIED ANT ROLE ASSIGNMENT =====

  /**
   * Assign ant role with tutorial guidance
   */
  assignAntRole(antId, role) {
    const ant = this.findTutorialAnt(antId);
    if (!ant) return false;

    const oldRole = ant.role;
    ant.role = role;

    // Provide helpful feedback
    const feedback = this.getRoleAssignmentFeedback(role, oldRole);
    
    // Update tutorial progress
    this.emitTutorialEvent('ant:role-assigned', {
      antId,
      role,
      oldRole,
      feedback
    });

    return true;
  }

  /**
   * Get helpful feedback for role assignments
   */
  getRoleAssignmentFeedback(newRole, oldRole) {
    const feedback = {
      worker: "Great choice! Workers will boost your food collection by 50%.",
      scout: "Excellent! Scouts will reveal new territory and spot threats early.",
      soldier: "Wise decision! Soldiers will protect your colony from attacks.",
      nurse: "Perfect! Nurses will help your population grow faster.",
      builder: "Smart move! Builders will construct structures 45% faster.",
      forager: "Nice pick! Foragers specialize in finding the best food sources."
    };

    return {
      message: feedback[newRole] || "Good assignment!",
      bonus: this.getRoleBonus(newRole)
    };
  }

  /**
   * Get role-specific bonuses for tutorial
   */
  getRoleBonus(role) {
    const bonuses = {
      worker: { food: 50, message: "+50 Food production bonus!" },
      scout: { visionRange: 2, message: "+2 Vision range bonus!" },
      soldier: { defense: 25, message: "+25 Defense bonus!" },
      nurse: { populationGrowth: 30, message: "+30% Population growth!" },
      builder: { buildSpeed: 45, message: "+45% Build speed!" },
      forager: { foodEfficiency: 35, message: "+35% Foraging efficiency!" }
    };

    return bonuses[role] || {};
  }

  // ===== SIMPLIFIED RESOURCE FORAGING =====

  /**
   * Start guided foraging with guaranteed success
   */
  startGuidedForaging() {
    // Ensure worker ants exist
    const workers = this.getTutorialAntsByRole('worker');
    if (workers.length === 0) {
      return {
        success: false,
        message: "Assign some ants to the Worker role first!"
      };
    }

    // Simulate successful foraging
    setTimeout(() => {
      const foragingResult = {
        food: 100 + Math.random() * 50,
        materials: 25 + Math.random() * 25,
        efficiency: 85 + Math.random() * 15
      };

      this.addTutorialResources(foragingResult);
      this.emitTutorialEvent('foraging:completed', foragingResult);
    }, 2000); // 2 second delay for demonstration

    this.emitTutorialEvent('foraging:started', { workers: workers.length });
    
    return {
      success: true,
      message: `${workers.length} workers started foraging!`
    };
  }

  /**
   * Add resources to tutorial inventory
   */
  addTutorialResources(resources) {
    Object.keys(resources).forEach(resourceType => {
      if (this.tutorialResources[resourceType] !== undefined) {
        this.tutorialResources[resourceType] += resources[resourceType];
      }
    });

    // Update localStorage
    localStorage.setItem('tutorial-resources', JSON.stringify(this.tutorialResources));
    
    // Emit resource update event
    this.emitTutorialEvent('resources:updated', this.tutorialResources);
  }

  // ===== SIMPLIFIED BUILDING SYSTEM =====

  /**
   * Place structure with tutorial guidance
   */
  placeStructure(structureType, position) {
    const structure = {
      id: `tutorial-structure-${Date.now()}`,
      type: structureType,
      position,
      level: 1,
      constructionProgress: 0,
      tutorial: true
    };

    // Check if resources are sufficient (with tutorial leniency)
    const cost = this.getStructureCost(structureType);
    if (!this.canAffordStructure(cost)) {
      return {
        success: false,
        message: "Not enough resources. Don't worry - you'll gather more soon!",
        cost
      };
    }

    // Start construction with visual progress
    this.startTutorialConstruction(structure, cost);
    
    return {
      success: true,
      message: `${structureType} construction started!`,
      structure
    };
  }

  /**
   * Get tutorial-friendly structure costs
   */
  getStructureCost(structureType) {
    const costs = {
      nest: { materials: 50, water: 20 },
      storage: { materials: 75, water: 30 },
      nursery: { materials: 60, food: 40 },
      barracks: { materials: 100, minerals: 25 },
      farm: { materials: 80, water: 50 },
      workshop: { materials: 120, minerals: 40 }
    };

    return costs[structureType] || { materials: 50 };
  }

  /**
   * Check if player can afford structure (with tutorial leniency)
   */
  canAffordStructure(cost) {
    return Object.keys(cost).every(resource => {
      const required = cost[resource];
      const available = this.tutorialResources[resource] || 0;
      return available >= required * 0.8; // 20% discount for tutorial
    });
  }

  /**
   * Start tutorial construction with automatic completion
   */
  startTutorialConstruction(structure, cost) {
    // Deduct resources (with tutorial discount)
    Object.keys(cost).forEach(resource => {
      const discountedCost = Math.floor(cost[resource] * 0.8);
      this.tutorialResources[resource] -= discountedCost;
    });

    // Add to colony structures
    this.tutorialColony.structures.push(structure);
    
    // Auto-complete construction after 3 seconds
    setTimeout(() => {
      structure.constructionProgress = 100;
      this.emitTutorialEvent('structure:completed', structure);
    }, 3000);

    this.emitTutorialEvent('structure:construction-started', structure);
  }

  // ===== SIMPLIFIED EVOLUTION SYSTEM =====

  /**
   * Unlock evolution with tutorial guidance
   */
  unlockEvolution(evolutionId) {
    const evolution = this.getTutorialEvolution(evolutionId);
    if (!evolution) return false;

    // Check evolution points (with tutorial discount)
    const cost = Math.floor(evolution.cost * 0.7);
    if (this.tutorialResources.evolutionPoints < cost) {
      return {
        success: false,
        message: `Need ${cost} evolution points. Complete more tutorial steps to earn them!`
      };
    }

    // Unlock evolution
    this.tutorialResources.evolutionPoints -= cost;
    evolution.unlocked = true;

    this.emitTutorialEvent('evolution:unlocked', evolution);
    
    return {
      success: true,
      message: `${evolution.name} unlocked! ${evolution.benefit}`,
      evolution
    };
  }

  /**
   * Get tutorial-friendly evolution options
   */
  getTutorialEvolution(evolutionId) {
    const evolutions = {
      'foraging-boost': {
        id: 'foraging-boost',
        name: 'Enhanced Foraging',
        cost: 50,
        benefit: '+25% food collection rate',
        description: 'Your ants become more efficient at finding food'
      },
      'population-growth': {
        id: 'population-growth',
        name: 'Population Boom',
        cost: 75,
        benefit: '+30% reproduction rate',
        description: 'Your colony grows faster'
      },
      'construction-speed': {
        id: 'construction-speed',
        name: 'Master Builders',
        cost: 60,
        benefit: '+40% construction speed',
        description: 'Structures are built much faster'
      }
    };

    return evolutions[evolutionId];
  }

  // ===== SIMPLIFIED BATTLE SYSTEM =====

  /**
   * Initiate tutorial battle with guaranteed success
   */
  startTutorialBattle() {
    const battleData = {
      enemy: {
        name: 'Weak Rival Colony',
        strength: 30, // Intentionally weak
        ants: 8
      },
      playerForce: {
        soldiers: this.getTutorialAntsByRole('soldier').length,
        totalAnts: this.tutorialColony.ants.length
      }
    };

    // Auto-win after 5 seconds with rewards
    setTimeout(() => {
      const victory = {
        result: 'victory',
        efficiency: 'brilliant',
        rewards: {
          evolutionPoints: 30,
          materials: 75,
          minerals: 20
        },
        casualties: 0 // No losses in tutorial
      };

      this.addTutorialResources(victory.rewards);
      this.emitTutorialEvent('battle:victory', victory);
    }, 5000);

    this.emitTutorialEvent('battle:started', battleData);
    
    return battleData;
  }

  // ===== UTILITY METHODS =====

  /**
   * Find tutorial ant by ID
   */
  findTutorialAnt(antId) {
    return this.tutorialColony?.ants.find(ant => ant.id === antId);
  }

  /**
   * Get tutorial ants by role
   */
  getTutorialAntsByRole(role) {
    return this.tutorialColony?.ants.filter(ant => ant.role === role) || [];
  }

  /**
   * Emit tutorial-specific events
   */
  emitTutorialEvent(eventName, data) {
    const event = new CustomEvent(`tutorial:${eventName}`, {
      detail: { ...data, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get current tutorial resources
   */
  getTutorialResources() {
    return { ...this.tutorialResources };
  }

  /**
   * Get current tutorial colony
   */
  getTutorialColony() {
    return { ...this.tutorialColony };
  }

  /**
   * Check if tutorial mode is active
   */
  isTutorialActive() {
    return this.isActive;
  }

  /**
   * Reset tutorial progress for replay
   */
  resetTutorialProgress() {
    this.cleanupTutorialData();
    this.setupTutorialResources();
    this.setupTutorialColony();
    
    // Clear tutorial completion flags
    localStorage.removeItem('tutorial-completion-flags');
    
    this.emitTutorialEvent('tutorial:reset', {
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export default new TutorialMechanics(); 
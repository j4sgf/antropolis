/**
 * DefenseStrategy class for AI colony defensive positioning
 * Implements intelligent defensive unit placement and fortification logic
 */

const { PERSONALITY_TRAITS } = require('../../models/AIColony');

class DefenseStrategy {
  constructor() {
    this.defensivePositions = new Map();
    this.fortificationTypes = ['walls', 'towers', 'barriers', 'trenches'];
    this.unitTypes = ['soldiers', 'archers', 'scouts', 'guards'];
    
    this.initializeDefenseData();
  }

  /**
   * Initialize defensive strategy data
   */
  initializeDefenseData() {
    // Defensive position priorities
    this.defensivePositions.set('entrance', 1.0);
    this.defensivePositions.set('perimeter', 0.8);
    this.defensivePositions.set('chokepoints', 0.9);
    this.defensivePositions.set('high_ground', 0.7);
    this.defensivePositions.set('resource_areas', 0.6);
  }

  /**
   * Determine optimal defensive strategy for a colony
   */
  determineDefenseStrategy(colony, gameState = {}) {
    const strategy = {
      defensivePosture: null,
      unitDeployment: {},
      fortificationPlan: {},
      priorityAreas: [],
      reasoning: []
    };

    // Analyze threat level and determine posture
    strategy.defensivePosture = this.determineDefensivePosture(colony);
    
    // Plan unit deployment
    strategy.unitDeployment = this.planUnitDeployment(colony, strategy.defensivePosture);
    
    // Plan fortifications
    strategy.fortificationPlan = this.planFortifications(colony, strategy.defensivePosture);
    
    // Identify priority defensive areas
    strategy.priorityAreas = this.identifyPriorityAreas(colony, gameState);
    
    // Generate reasoning
    strategy.reasoning = this.generateDefenseReasoning(colony, strategy);
    
    return strategy;
  }

  /**
   * Determine defensive posture based on threat level and personality
   */
  determineDefensivePosture(colony) {
    const threatLevel = colony.threat_level;
    const personality = colony.personality;
    
    // Base posture determination
    let posture = 'balanced';
    
    if (threatLevel > 0.8) {
      posture = 'fortress'; // Maximum defense
    } else if (threatLevel > 0.6) {
      posture = 'defensive'; // High defense
    } else if (threatLevel > 0.3) {
      posture = 'balanced'; // Moderate defense
    } else {
      posture = 'minimal'; // Low defense
    }
    
    // Personality modifiers
    switch (personality) {
      case PERSONALITY_TRAITS.DEFENSIVE:
        if (posture === 'minimal') posture = 'balanced';
        if (posture === 'balanced') posture = 'defensive';
        break;
      case PERSONALITY_TRAITS.AGGRESSIVE:
        if (posture === 'fortress') posture = 'defensive';
        if (posture === 'defensive') posture = 'balanced';
        break;
      case PERSONALITY_TRAITS.BUILDER:
        // Builders prefer fortifications over mobile defense
        break;
      case PERSONALITY_TRAITS.MILITANT:
        // Militants prefer active defense
        break;
    }
    
    return posture;
  }

  /**
   * Plan unit deployment based on defensive posture
   */
  planUnitDeployment(colony, posture) {
    const deployment = {
      soldiers: 0,
      archers: 0,
      scouts: 0,
      guards: 0,
      positions: {}
    };

    const totalMilitary = Math.floor(colony.population * colony.military_focus);
    
    switch (posture) {
      case 'fortress':
        deployment.soldiers = Math.floor(totalMilitary * 0.4);
        deployment.archers = Math.floor(totalMilitary * 0.3);
        deployment.guards = Math.floor(totalMilitary * 0.2);
        deployment.scouts = Math.floor(totalMilitary * 0.1);
        break;
        
      case 'defensive':
        deployment.soldiers = Math.floor(totalMilitary * 0.35);
        deployment.archers = Math.floor(totalMilitary * 0.25);
        deployment.guards = Math.floor(totalMilitary * 0.25);
        deployment.scouts = Math.floor(totalMilitary * 0.15);
        break;
        
      case 'balanced':
        deployment.soldiers = Math.floor(totalMilitary * 0.3);
        deployment.archers = Math.floor(totalMilitary * 0.2);
        deployment.guards = Math.floor(totalMilitary * 0.3);
        deployment.scouts = Math.floor(totalMilitary * 0.2);
        break;
        
      case 'minimal':
        deployment.soldiers = Math.floor(totalMilitary * 0.2);
        deployment.archers = Math.floor(totalMilitary * 0.1);
        deployment.guards = Math.floor(totalMilitary * 0.4);
        deployment.scouts = Math.floor(totalMilitary * 0.3);
        break;
    }

    // Plan positions for units
    deployment.positions = this.planUnitPositions(colony, deployment, posture);
    
    return deployment;
  }

  /**
   * Plan specific positions for defensive units
   */
  planUnitPositions(colony, deployment, posture) {
    const positions = {
      entrance_guards: 0,
      perimeter_patrol: 0,
      watchtowers: 0,
      resource_protection: 0,
      mobile_reserve: 0
    };

    const totalUnits = deployment.soldiers + deployment.archers + deployment.guards + deployment.scouts;
    
    switch (posture) {
      case 'fortress':
        positions.entrance_guards = Math.floor(totalUnits * 0.3);
        positions.perimeter_patrol = Math.floor(totalUnits * 0.2);
        positions.watchtowers = Math.floor(totalUnits * 0.3);
        positions.resource_protection = Math.floor(totalUnits * 0.1);
        positions.mobile_reserve = Math.floor(totalUnits * 0.1);
        break;
        
      case 'defensive':
        positions.entrance_guards = Math.floor(totalUnits * 0.25);
        positions.perimeter_patrol = Math.floor(totalUnits * 0.25);
        positions.watchtowers = Math.floor(totalUnits * 0.2);
        positions.resource_protection = Math.floor(totalUnits * 0.15);
        positions.mobile_reserve = Math.floor(totalUnits * 0.15);
        break;
        
      case 'balanced':
        positions.entrance_guards = Math.floor(totalUnits * 0.2);
        positions.perimeter_patrol = Math.floor(totalUnits * 0.3);
        positions.watchtowers = Math.floor(totalUnits * 0.15);
        positions.resource_protection = Math.floor(totalUnits * 0.15);
        positions.mobile_reserve = Math.floor(totalUnits * 0.2);
        break;
        
      case 'minimal':
        positions.entrance_guards = Math.floor(totalUnits * 0.15);
        positions.perimeter_patrol = Math.floor(totalUnits * 0.35);
        positions.watchtowers = Math.floor(totalUnits * 0.1);
        positions.resource_protection = Math.floor(totalUnits * 0.1);
        positions.mobile_reserve = Math.floor(totalUnits * 0.3);
        break;
    }
    
    return positions;
  }

  /**
   * Plan fortification construction
   */
  planFortifications(colony, posture) {
    const plan = {
      walls: 0,
      towers: 0,
      barriers: 0,
      trenches: 0,
      priority_order: [],
      resource_cost: {}
    };

    const territorySize = colony.territory_size;
    const stoneStorage = colony.stone_storage || 0;
    const woodStorage = colony.wood_storage || 0;
    
    switch (posture) {
      case 'fortress':
        plan.walls = Math.min(territorySize * 2, Math.floor(stoneStorage / 50));
        plan.towers = Math.min(Math.floor(territorySize / 2), Math.floor(stoneStorage / 80));
        plan.barriers = Math.min(territorySize, Math.floor(woodStorage / 30));
        plan.trenches = Math.min(territorySize, Math.floor(colony.population / 20));
        plan.priority_order = ['walls', 'towers', 'barriers', 'trenches'];
        break;
        
      case 'defensive':
        plan.walls = Math.min(territorySize, Math.floor(stoneStorage / 60));
        plan.towers = Math.min(Math.floor(territorySize / 3), Math.floor(stoneStorage / 100));
        plan.barriers = Math.min(Math.floor(territorySize * 0.8), Math.floor(woodStorage / 40));
        plan.trenches = Math.min(Math.floor(territorySize * 0.6), Math.floor(colony.population / 30));
        plan.priority_order = ['walls', 'barriers', 'towers', 'trenches'];
        break;
        
      case 'balanced':
        plan.walls = Math.min(Math.floor(territorySize * 0.6), Math.floor(stoneStorage / 80));
        plan.towers = Math.min(Math.floor(territorySize / 4), Math.floor(stoneStorage / 120));
        plan.barriers = Math.min(Math.floor(territorySize * 0.5), Math.floor(woodStorage / 50));
        plan.trenches = Math.min(Math.floor(territorySize * 0.3), Math.floor(colony.population / 40));
        plan.priority_order = ['barriers', 'walls', 'trenches', 'towers'];
        break;
        
      case 'minimal':
        plan.walls = Math.min(Math.floor(territorySize * 0.3), Math.floor(stoneStorage / 100));
        plan.towers = Math.min(Math.floor(territorySize / 6), Math.floor(stoneStorage / 150));
        plan.barriers = Math.min(Math.floor(territorySize * 0.3), Math.floor(woodStorage / 60));
        plan.trenches = Math.min(Math.floor(territorySize * 0.2), Math.floor(colony.population / 50));
        plan.priority_order = ['barriers', 'trenches', 'walls', 'towers'];
        break;
    }

    // Calculate resource costs
    plan.resource_cost = {
      stone: (plan.walls * 50) + (plan.towers * 80),
      wood: (plan.barriers * 30) + (plan.towers * 20),
      labor: (plan.walls + plan.towers + plan.barriers) * 10 + (plan.trenches * 5)
    };
    
    return plan;
  }

  /**
   * Identify priority defensive areas
   */
  identifyPriorityAreas(colony, gameState) {
    const areas = [];
    
    // Main entrance/exit points
    areas.push({
      type: 'entrance',
      priority: 1.0,
      coordinates: { x: colony.base_x, y: colony.base_y },
      reason: 'Primary access point to colony'
    });
    
    // Resource gathering areas
    if (colony.scouted_areas && colony.scouted_areas.length > 0) {
      colony.scouted_areas.forEach((area, index) => {
        if (area.hasResources) {
          areas.push({
            type: 'resource_area',
            priority: 0.7,
            coordinates: area.coordinates,
            reason: 'Critical resource gathering location'
          });
        }
      });
    }
    
    // Perimeter points
    const perimeterPoints = this.calculatePerimeterPoints(colony);
    perimeterPoints.forEach(point => {
      areas.push({
        type: 'perimeter',
        priority: 0.6,
        coordinates: point,
        reason: 'Territory boundary defense'
      });
    });
    
    // High ground positions (if available)
    if (gameState.terrain) {
      const highGround = this.findHighGround(colony, gameState.terrain);
      highGround.forEach(point => {
        areas.push({
          type: 'high_ground',
          priority: 0.8,
          coordinates: point,
          reason: 'Strategic elevated position'
        });
      });
    }
    
    // Sort by priority
    areas.sort((a, b) => b.priority - a.priority);
    
    return areas;
  }

  /**
   * Calculate perimeter defense points
   */
  calculatePerimeterPoints(colony) {
    const points = [];
    const radius = colony.territory_size;
    const centerX = colony.base_x;
    const centerY = colony.base_y;
    
    // Calculate points around the perimeter
    const numPoints = Math.max(4, Math.floor(radius * 2));
    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      points.push({ x: Math.round(x), y: Math.round(y) });
    }
    
    return points;
  }

  /**
   * Find high ground positions for defensive advantage
   */
  findHighGround(colony, terrain) {
    const highGround = [];
    const searchRadius = colony.territory_size + 2;
    
    // This would integrate with the actual terrain system
    // For now, return some mock high ground positions
    const mockHighGround = [
      { x: colony.base_x + 3, y: colony.base_y + 2 },
      { x: colony.base_x - 2, y: colony.base_y + 3 },
      { x: colony.base_x + 1, y: colony.base_y - 3 }
    ];
    
    return mockHighGround;
  }

  /**
   * Generate defensive strategy reasoning
   */
  generateDefenseReasoning(colony, strategy) {
    const reasoning = [];
    
    // Threat level analysis
    if (colony.threat_level > 0.7) {
      reasoning.push(`High threat level (${colony.threat_level.toFixed(2)}) requires fortress-level defenses`);
    } else if (colony.threat_level > 0.3) {
      reasoning.push(`Moderate threat level (${colony.threat_level.toFixed(2)}) suggests balanced defensive approach`);
    } else {
      reasoning.push(`Low threat level (${colony.threat_level.toFixed(2)}) allows minimal defensive posture`);
    }
    
    // Personality influence
    if (colony.personality === PERSONALITY_TRAITS.DEFENSIVE) {
      reasoning.push('Defensive personality prioritizes fortification and static defense');
    } else if (colony.personality === PERSONALITY_TRAITS.AGGRESSIVE) {
      reasoning.push('Aggressive personality favors mobile defense over static fortifications');
    }
    
    // Resource constraints
    const stoneStorage = colony.stone_storage || 0;
    const woodStorage = colony.wood_storage || 0;
    
    if (stoneStorage < 100) {
      reasoning.push('Limited stone resources constrain wall and tower construction');
    }
    if (woodStorage < 100) {
      reasoning.push('Limited wood resources limit barrier construction');
    }
    
    // Population factors
    if (colony.population < 50) {
      reasoning.push('Small population limits available military units');
    } else if (colony.population > 100) {
      reasoning.push('Large population enables comprehensive defensive coverage');
    }
    
    // Territory size
    if (colony.territory_size > 8) {
      reasoning.push('Large territory requires extended perimeter defense');
    } else if (colony.territory_size < 4) {
      reasoning.push('Compact territory allows concentrated defensive focus');
    }
    
    return reasoning;
  }

  /**
   * Evaluate defensive effectiveness
   */
  evaluateDefensiveEffectiveness(colony, strategy) {
    const evaluation = {
      overall_score: 0,
      factors: {},
      weaknesses: [],
      strengths: []
    };

    // Unit coverage factor
    const totalUnits = Object.values(strategy.unitDeployment).reduce((sum, count) => sum + count, 0);
    const unitCoverage = Math.min(1.0, totalUnits / (colony.territory_size * 2));
    evaluation.factors.unit_coverage = unitCoverage;

    // Fortification factor
    const totalFortifications = Object.values(strategy.fortificationPlan).reduce((sum, count) => sum + count, 0);
    const fortificationCoverage = Math.min(1.0, totalFortifications / colony.territory_size);
    evaluation.factors.fortification_coverage = fortificationCoverage;

    // Resource sustainability
    const resourceSustainability = this.calculateResourceSustainability(colony, strategy);
    evaluation.factors.resource_sustainability = resourceSustainability;

    // Strategic positioning
    const strategicPositioning = this.evaluateStrategicPositioning(colony, strategy);
    evaluation.factors.strategic_positioning = strategicPositioning;

    // Calculate overall score
    evaluation.overall_score = (
      evaluation.factors.unit_coverage * 0.3 +
      evaluation.factors.fortification_coverage * 0.25 +
      evaluation.factors.resource_sustainability * 0.25 +
      evaluation.factors.strategic_positioning * 0.2
    );

    // Identify strengths and weaknesses
    if (evaluation.factors.unit_coverage < 0.5) {
      evaluation.weaknesses.push('Insufficient unit coverage for territory size');
    } else if (evaluation.factors.unit_coverage > 0.8) {
      evaluation.strengths.push('Excellent unit coverage across territory');
    }

    if (evaluation.factors.fortification_coverage < 0.3) {
      evaluation.weaknesses.push('Inadequate fortification coverage');
    } else if (evaluation.factors.fortification_coverage > 0.7) {
      evaluation.strengths.push('Strong fortification network');
    }

    return evaluation;
  }

  /**
   * Calculate resource sustainability for defensive strategy
   */
  calculateResourceSustainability(colony, strategy) {
    const costs = strategy.fortificationPlan.resource_cost;
    const stoneRatio = (colony.stone_storage || 0) / (costs.stone || 1);
    const woodRatio = (colony.wood_storage || 0) / (costs.wood || 1);
    const laborRatio = colony.population / (costs.labor || 1);
    
    return Math.min(1.0, (stoneRatio + woodRatio + laborRatio) / 3);
  }

  /**
   * Evaluate strategic positioning effectiveness
   */
  evaluateStrategicPositioning(colony, strategy) {
    let score = 0.5; // Base score
    
    // Check if priority areas are covered
    const coveredAreas = strategy.priorityAreas.filter(area => area.priority > 0.7).length;
    const totalPriorityAreas = strategy.priorityAreas.filter(area => area.priority > 0.7).length;
    
    if (totalPriorityAreas > 0) {
      score += (coveredAreas / totalPriorityAreas) * 0.3;
    }
    
    // Check defensive posture appropriateness
    if (strategy.defensivePosture === 'fortress' && colony.threat_level > 0.7) {
      score += 0.2; // Appropriate high-threat response
    } else if (strategy.defensivePosture === 'minimal' && colony.threat_level < 0.3) {
      score += 0.1; // Appropriate low-threat response
    }
    
    return Math.min(1.0, score);
  }
}

module.exports = DefenseStrategy; 
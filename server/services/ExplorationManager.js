/**
 * ExplorationManager class for AI colony scouting and exploration behavior
 * Manages unexplored areas, prioritizes scouting targets, and coordinates exploration activities
 */

const { PERSONALITY_TRAITS } = require('../models/AIColony');

class ExplorationManager {
  constructor() {
    this.explorationModes = ['systematic', 'opportunistic', 'resource_focused', 'threat_assessment'];
    this.scoutingPriorities = new Map();
    this.explorationPatterns = new Map();
    
    this.initializeExplorationData();
  }

  /**
   * Initialize exploration data and patterns
   */
  initializeExplorationData() {
    // Scouting priority weights
    this.scoutingPriorities.set('unknown_territory', 1.0);
    this.scoutingPriorities.set('resource_rich_areas', 0.9);
    this.scoutingPriorities.set('enemy_territory', 0.8);
    this.scoutingPriorities.set('strategic_positions', 0.7);
    this.scoutingPriorities.set('trade_routes', 0.6);

    // Exploration patterns by personality
    this.explorationPatterns.set(PERSONALITY_TRAITS.AGGRESSIVE, {
      mode: 'threat_assessment',
      search_radius: 15,
      scout_ratio: 0.3,
      risk_tolerance: 0.8
    });
    
    this.explorationPatterns.set(PERSONALITY_TRAITS.DEFENSIVE, {
      mode: 'systematic',
      search_radius: 10,
      scout_ratio: 0.2,
      risk_tolerance: 0.3
    });
    
    this.explorationPatterns.set(PERSONALITY_TRAITS.EXPANSIONIST, {
      mode: 'opportunistic',
      search_radius: 20,
      scout_ratio: 0.4,
      risk_tolerance: 0.6
    });
    
    this.explorationPatterns.set(PERSONALITY_TRAITS.BUILDER, {
      mode: 'resource_focused',
      search_radius: 12,
      scout_ratio: 0.25,
      risk_tolerance: 0.4
    });
    
    this.explorationPatterns.set(PERSONALITY_TRAITS.MILITANT, {
      mode: 'threat_assessment',
      search_radius: 18,
      scout_ratio: 0.35,
      risk_tolerance: 0.7
    });
    
    this.explorationPatterns.set(PERSONALITY_TRAITS.OPPORTUNIST, {
      mode: 'opportunistic',
      search_radius: 14,
      scout_ratio: 0.3,
      risk_tolerance: 0.5
    });
  }

  /**
   * Plan exploration strategy for a colony
   */
  planExplorationStrategy(colony, gameState = {}) {
    const strategy = {
      exploration_mode: null,
      primary_objectives: [],
      scout_assignments: [],
      exploration_zones: [],
      risk_assessment: {},
      reasoning: []
    };

    // Get personality-based exploration pattern
    const pattern = this.explorationPatterns.get(colony.personality) || 
                   this.explorationPatterns.get(PERSONALITY_TRAITS.OPPORTUNIST);
    
    strategy.exploration_mode = pattern.mode;

    // Identify exploration objectives
    strategy.primary_objectives = this.identifyExplorationObjectives(colony, pattern, gameState);
    
    // Plan scout assignments
    strategy.scout_assignments = this.planScoutAssignments(colony, strategy.primary_objectives, pattern);
    
    // Define exploration zones
    strategy.exploration_zones = this.defineExplorationZones(colony, pattern);
    
    // Assess risks
    strategy.risk_assessment = this.assessExplorationRisks(colony, strategy.exploration_zones);
    
    // Generate reasoning
    strategy.reasoning = this.generateExplorationReasoning(colony, strategy, pattern);
    
    return strategy;
  }

  /**
   * Identify exploration objectives based on colony needs and personality
   */
  identifyExplorationObjectives(colony, pattern, gameState) {
    const objectives = [];
    
    // Resource discovery objectives
    if (colony.food_storage < 100 || pattern.mode === 'resource_focused') {
      objectives.push({
        type: 'resource_discovery',
        priority: 0.9,
        target_resource: 'food',
        search_radius: pattern.search_radius,
        description: 'Locate food sources for colony sustainability'
      });
    }

    if ((colony.wood_storage || 0) < 100 && pattern.mode === 'resource_focused') {
      objectives.push({
        type: 'resource_discovery',
        priority: 0.8,
        target_resource: 'wood',
        search_radius: pattern.search_radius,
        description: 'Find wood resources for construction'
      });
    }

    // Territory expansion objectives
    if (colony.territory_size < 8 && pattern.mode !== 'threat_assessment') {
      objectives.push({
        type: 'territory_expansion',
        priority: 0.7,
        target_area: 'adjacent_territories',
        search_radius: pattern.search_radius * 0.6,
        description: 'Identify suitable areas for territorial expansion'
      });
    }

    // Threat assessment objectives
    if (colony.threat_level > 0.3 || pattern.mode === 'threat_assessment') {
      objectives.push({
        type: 'threat_assessment',
        priority: 0.8,
        target_area: 'enemy_territories',
        search_radius: pattern.search_radius * 0.8,
        description: 'Monitor enemy activities and military movements'
      });
    }

    // Strategic positioning objectives
    if (pattern.mode === 'systematic' || pattern.mode === 'opportunistic') {
      objectives.push({
        type: 'strategic_positioning',
        priority: 0.6,
        target_area: 'high_ground',
        search_radius: pattern.search_radius,
        description: 'Identify strategic positions for future expansion'
      });
    }

    // Trade route discovery (if applicable)
    if (colony.population > 60) {
      objectives.push({
        type: 'trade_route_discovery',
        priority: 0.5,
        target_area: 'trade_paths',
        search_radius: pattern.search_radius * 1.2,
        description: 'Locate potential trade routes and neutral territories'
      });
    }

    // Sort by priority
    objectives.sort((a, b) => b.priority - a.priority);
    
    return objectives.slice(0, 5); // Limit to top 5 objectives
  }

  /**
   * Plan scout assignments for exploration objectives
   */
  planScoutAssignments(colony, objectives, pattern) {
    const assignments = [];
    const availableScouts = Math.floor(colony.population * pattern.scout_ratio);
    
    if (availableScouts < 1) {
      return assignments; // No scouts available
    }

    let scoutsAssigned = 0;
    
    for (const objective of objectives) {
      if (scoutsAssigned >= availableScouts) break;
      
      const scoutsNeeded = this.calculateScoutsNeeded(objective, pattern);
      const scoutsToAssign = Math.min(scoutsNeeded, availableScouts - scoutsAssigned);
      
      if (scoutsToAssign > 0) {
        assignments.push({
          objective_id: objective.type,
          scouts_assigned: scoutsToAssign,
          assignment_type: this.getAssignmentType(objective),
          target_coordinates: this.generateTargetCoordinates(colony, objective),
          estimated_duration: this.estimateScoutingDuration(objective, scoutsToAssign),
          success_probability: this.calculateSuccessProbability(objective, scoutsToAssign, pattern),
          fallback_plan: this.createFallbackPlan(objective, colony)
        });
        
        scoutsAssigned += scoutsToAssign;
      }
    }

    return assignments;
  }

  /**
   * Calculate number of scouts needed for an objective
   */
  calculateScoutsNeeded(objective, pattern) {
    const baseNeeds = {
      'resource_discovery': 2,
      'territory_expansion': 3,
      'threat_assessment': 4,
      'strategic_positioning': 2,
      'trade_route_discovery': 3
    };

    const baseNeed = baseNeeds[objective.type] || 2;
    const riskMultiplier = pattern.risk_tolerance < 0.5 ? 1.5 : 1.0;
    
    return Math.ceil(baseNeed * riskMultiplier);
  }

  /**
   * Get assignment type for objective
   */
  getAssignmentType(objective) {
    const assignmentTypes = {
      'resource_discovery': 'survey',
      'territory_expansion': 'reconnaissance', 
      'threat_assessment': 'surveillance',
      'strategic_positioning': 'mapping',
      'trade_route_discovery': 'exploration'
    };

    return assignmentTypes[objective.type] || 'general_scouting';
  }

  /**
   * Generate target coordinates for scouting
   */
  generateTargetCoordinates(colony, objective) {
    const coordinates = [];
    const baseX = colony.base_x;
    const baseY = colony.base_y;
    const radius = objective.search_radius;
    
    // Generate coordinates based on objective type
    switch (objective.type) {
      case 'resource_discovery':
        // Spiral pattern around base
        coordinates.push(...this.generateSpiralCoordinates(baseX, baseY, radius, 6));
        break;
        
      case 'territory_expansion':
        // Adjacent areas to current territory
        coordinates.push(...this.generateAdjacentCoordinates(baseX, baseY, colony.territory_size + 2, 4));
        break;
        
      case 'threat_assessment':
        // Perimeter and beyond
        coordinates.push(...this.generatePerimeterCoordinates(baseX, baseY, radius, 8));
        break;
        
      case 'strategic_positioning':
        // Key strategic points
        coordinates.push(...this.generateStrategicCoordinates(baseX, baseY, radius, 5));
        break;
        
      case 'trade_route_discovery':
        // Long-range exploration
        coordinates.push(...this.generateLongRangeCoordinates(baseX, baseY, radius, 4));
        break;
        
      default:
        // Default pattern
        coordinates.push(...this.generateSpiralCoordinates(baseX, baseY, radius, 4));
    }
    
    return coordinates;
  }

  /**
   * Generate spiral coordinates for systematic exploration
   */
  generateSpiralCoordinates(centerX, centerY, radius, numPoints) {
    const coordinates = [];
    const angleStep = (2 * Math.PI) / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      const x = centerX + Math.floor(radius * Math.cos(angle));
      const y = centerY + Math.floor(radius * Math.sin(angle));
      coordinates.push({ x, y, type: 'spiral_point' });
    }
    
    return coordinates;
  }

  /**
   * Generate adjacent coordinates for territory expansion
   */
  generateAdjacentCoordinates(centerX, centerY, distance, numPoints) {
    const coordinates = [];
    const directions = [
      { dx: 1, dy: 0 },   // East
      { dx: -1, dy: 0 },  // West
      { dx: 0, dy: 1 },   // North
      { dx: 0, dy: -1 },  // South
      { dx: 1, dy: 1 },   // Northeast
      { dx: -1, dy: 1 },  // Northwest
      { dx: 1, dy: -1 },  // Southeast
      { dx: -1, dy: -1 }  // Southwest
    ];
    
    for (let i = 0; i < Math.min(numPoints, directions.length); i++) {
      const dir = directions[i];
      coordinates.push({
        x: centerX + dir.dx * distance,
        y: centerY + dir.dy * distance,
        type: 'adjacent_area'
      });
    }
    
    return coordinates;
  }

  /**
   * Generate perimeter coordinates for threat assessment
   */
  generatePerimeterCoordinates(centerX, centerY, radius, numPoints) {
    const coordinates = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      const x = centerX + Math.floor(radius * Math.cos(angle));
      const y = centerY + Math.floor(radius * Math.sin(angle));
      coordinates.push({ x, y, type: 'perimeter_point' });
    }
    
    return coordinates;
  }

  /**
   * Generate strategic coordinates
   */
  generateStrategicCoordinates(centerX, centerY, radius, numPoints) {
    const coordinates = [];
    const strategicOffsets = [
      { dx: 0, dy: radius },     // North
      { dx: radius, dy: 0 },     // East
      { dx: 0, dy: -radius },    // South
      { dx: -radius, dy: 0 },    // West
      { dx: radius * 0.7, dy: radius * 0.7 } // Northeast
    ];
    
    for (let i = 0; i < Math.min(numPoints, strategicOffsets.length); i++) {
      const offset = strategicOffsets[i];
      coordinates.push({
        x: centerX + offset.dx,
        y: centerY + offset.dy,
        type: 'strategic_position'
      });
    }
    
    return coordinates;
  }

  /**
   * Generate long-range coordinates for trade route discovery
   */
  generateLongRangeCoordinates(centerX, centerY, radius, numPoints) {
    const coordinates = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (2 * Math.PI * i) / numPoints;
      const distance = radius + Math.random() * radius * 0.5; // Vary distance
      const x = centerX + Math.floor(distance * Math.cos(angle));
      const y = centerY + Math.floor(distance * Math.sin(angle));
      coordinates.push({ x, y, type: 'long_range_target' });
    }
    
    return coordinates;
  }

  /**
   * Define exploration zones based on pattern and objectives
   */
  defineExplorationZones(colony, pattern) {
    const zones = [];
    const baseX = colony.base_x;
    const baseY = colony.base_y;
    const radius = pattern.search_radius;
    
    // Inner zone (immediate vicinity)
    zones.push({
      id: 'inner_zone',
      center: { x: baseX, y: baseY },
      radius: radius * 0.3,
      priority: 1.0,
      risk_level: 0.1,
      exploration_type: 'detailed',
      description: 'Immediate colony vicinity'
    });
    
    // Middle zone (territorial expansion area)
    zones.push({
      id: 'middle_zone',
      center: { x: baseX, y: baseY },
      radius: radius * 0.7,
      priority: 0.8,
      risk_level: 0.3,
      exploration_type: 'systematic',
      description: 'Territorial expansion zone'
    });
    
    // Outer zone (strategic reconnaissance)
    zones.push({
      id: 'outer_zone',
      center: { x: baseX, y: baseY },
      radius: radius,
      priority: 0.6,
      risk_level: 0.6,
      exploration_type: 'surveillance',
      description: 'Strategic reconnaissance zone'
    });
    
    // Dynamic zones based on threats or opportunities
    if (colony.threat_level > 0.5) {
      zones.push({
        id: 'threat_zone',
        center: this.estimateThreatCenter(colony),
        radius: radius * 0.5,
        priority: 0.9,
        risk_level: 0.8,
        exploration_type: 'threat_assessment',
        description: 'High-threat monitoring zone'
      });
    }
    
    return zones;
  }

  /**
   * Estimate threat center location (placeholder implementation)
   */
  estimateThreatCenter(colony) {
    // In a real implementation, this would analyze known enemy positions
    return {
      x: colony.base_x + (Math.random() - 0.5) * 20,
      y: colony.base_y + (Math.random() - 0.5) * 20
    };
  }

  /**
   * Assess exploration risks
   */
  assessExplorationRisks(colony, zones) {
    const assessment = {
      overall_risk: 0,
      zone_risks: {},
      risk_factors: [],
      mitigation_strategies: []
    };

    let totalRisk = 0;
    let totalWeight = 0;

    for (const zone of zones) {
      const zoneRisk = this.calculateZoneRisk(colony, zone);
      assessment.zone_risks[zone.id] = zoneRisk;
      totalRisk += zoneRisk.risk_score * zone.priority;
      totalWeight += zone.priority;
    }

    assessment.overall_risk = totalWeight > 0 ? totalRisk / totalWeight : 0;

    // Identify risk factors
    if (colony.threat_level > 0.5) {
      assessment.risk_factors.push('High ambient threat level');
    }
    if (colony.population < 50) {
      assessment.risk_factors.push('Limited scout availability');
    }
    if (colony.territory_size < 5) {
      assessment.risk_factors.push('Limited safe zones for retreat');
    }

    // Suggest mitigation strategies
    if (assessment.overall_risk > 0.7) {
      assessment.mitigation_strategies.push('Increase scout group sizes');
      assessment.mitigation_strategies.push('Limit exploration to inner zones');
    }
    if (assessment.overall_risk > 0.5) {
      assessment.mitigation_strategies.push('Establish fallback positions');
    }

    return assessment;
  }

  /**
   * Calculate risk for a specific zone
   */
  calculateZoneRisk(colony, zone) {
    const riskAssessment = {
      risk_score: zone.risk_level,
      factors: {},
      recommendations: []
    };

    // Distance factor
    const distance = Math.sqrt(
      Math.pow(zone.center.x - colony.base_x, 2) + 
      Math.pow(zone.center.y - colony.base_y, 2)
    );
    riskAssessment.factors.distance = Math.min(1.0, distance / 30);

    // Threat level factor
    riskAssessment.factors.threat_level = colony.threat_level;

    // Unknown territory factor
    riskAssessment.factors.unknown_territory = zone.exploration_type === 'surveillance' ? 0.8 : 0.3;

    // Calculate final risk score
    riskAssessment.risk_score = Math.min(1.0, 
      zone.risk_level + 
      riskAssessment.factors.distance * 0.3 + 
      riskAssessment.factors.threat_level * 0.4 +
      riskAssessment.factors.unknown_territory * 0.3
    );

    // Generate recommendations
    if (riskAssessment.risk_score > 0.8) {
      riskAssessment.recommendations.push('Use multiple scout groups');
      riskAssessment.recommendations.push('Establish communication checkpoints');
    }
    if (riskAssessment.risk_score > 0.6) {
      riskAssessment.recommendations.push('Include military escort');
    }

    return riskAssessment;
  }

  /**
   * Estimate scouting duration
   */
  estimateScoutingDuration(objective, scoutsAssigned) {
    const baseDurations = {
      'resource_discovery': 3,
      'territory_expansion': 4,
      'threat_assessment': 5,
      'strategic_positioning': 3,
      'trade_route_discovery': 6
    };

    const baseDuration = baseDurations[objective.type] || 4;
    const scoutEfficiency = Math.min(2.0, scoutsAssigned / 2);
    
    return Math.ceil(baseDuration / scoutEfficiency);
  }

  /**
   * Calculate success probability for scouting mission
   */
  calculateSuccessProbability(objective, scoutsAssigned, pattern) {
    let baseProbability = 0.7;
    
    // Scout count factor
    const scoutFactor = Math.min(1.2, 1.0 + (scoutsAssigned - 1) * 0.1);
    
    // Risk tolerance factor
    const riskFactor = pattern.risk_tolerance;
    
    // Objective difficulty factor
    const difficultyFactors = {
      'resource_discovery': 1.0,
      'territory_expansion': 0.9,
      'threat_assessment': 0.7,
      'strategic_positioning': 0.8,
      'trade_route_discovery': 0.6
    };
    
    const difficultyFactor = difficultyFactors[objective.type] || 0.8;
    
    return Math.min(0.95, baseProbability * scoutFactor * riskFactor * difficultyFactor);
  }

  /**
   * Create fallback plan for failed scouting missions
   */
  createFallbackPlan(objective, colony) {
    return {
      alternative_objectives: this.generateAlternativeObjectives(objective, colony),
      retreat_plan: this.generateRetreatPlan(colony),
      communication_protocol: 'return_to_base_if_compromised',
      timeout_duration: this.estimateScoutingDuration(objective, 1) * 2
    };
  }

  /**
   * Generate alternative objectives
   */
  generateAlternativeObjectives(originalObjective, colony) {
    const alternatives = [];
    
    // Safer, closer alternatives
    if (originalObjective.search_radius > 8) {
      alternatives.push({
        ...originalObjective,
        search_radius: originalObjective.search_radius * 0.6,
        priority: originalObjective.priority * 0.8,
        description: `Safer alternative to ${originalObjective.description}`
      });
    }
    
    // Different objective type
    if (originalObjective.type !== 'resource_discovery') {
      alternatives.push({
        type: 'resource_discovery',
        priority: 0.6,
        target_resource: 'food',
        search_radius: 8,
        description: 'Fallback resource discovery mission'
      });
    }
    
    return alternatives;
  }

  /**
   * Generate retreat plan
   */
  generateRetreatPlan(colony) {
    return {
      rally_point: { x: colony.base_x, y: colony.base_y },
      safe_zones: this.identifySafeZones(colony),
      emergency_protocol: 'immediate_withdrawal',
      communication_method: 'signal_fires'
    };
  }

  /**
   * Identify safe zones for retreat
   */
  identifySafeZones(colony) {
    const safeZones = [];
    const baseX = colony.base_x;
    const baseY = colony.base_y;
    
    // Areas close to base
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI * i) / 2;
      const distance = 5;
      safeZones.push({
        x: baseX + Math.floor(distance * Math.cos(angle)),
        y: baseY + Math.floor(distance * Math.sin(angle)),
        type: 'base_vicinity'
      });
    }
    
    return safeZones;
  }

  /**
   * Generate exploration reasoning
   */
  generateExplorationReasoning(colony, strategy, pattern) {
    const reasoning = [];
    
    // Personality influence
    reasoning.push(`${colony.personality} personality drives ${pattern.mode} exploration approach`);
    
    // Objective priorities
    if (strategy.primary_objectives.length > 0) {
      const topObjective = strategy.primary_objectives[0];
      reasoning.push(`Primary focus: ${topObjective.description} (priority: ${topObjective.priority})`);
    }
    
    // Resource needs
    if (colony.food_storage < 100) {
      reasoning.push('Low food storage prioritizes resource discovery missions');
    }
    
    // Threat considerations
    if (colony.threat_level > 0.5) {
      reasoning.push(`High threat level (${colony.threat_level.toFixed(2)}) emphasizes defensive scouting`);
    }
    
    // Scout availability
    const availableScouts = Math.floor(colony.population * pattern.scout_ratio);
    reasoning.push(`${availableScouts} scouts available for exploration missions`);
    
    // Risk assessment
    if (strategy.risk_assessment.overall_risk > 0.7) {
      reasoning.push('High exploration risk requires careful mission planning');
    }
    
    return reasoning;
  }

  /**
   * Process exploration results and update colony memory
   */
  processExplorationResults(colony, explorationData) {
    const results = {
      discoveries: [],
      intelligence: [],
      map_updates: [],
      threat_assessments: []
    };

    // Process discoveries
    if (explorationData.resources_found) {
      explorationData.resources_found.forEach(resource => {
        results.discoveries.push({
          type: 'resource',
          resource_type: resource.type,
          location: resource.location,
          abundance: resource.abundance,
          accessibility: resource.accessibility
        });
        
        // Update colony memory
        colony.storeMemory('discovered_resources', {
          resource_type: resource.type,
          location: resource.location,
          abundance: resource.abundance,
          discovered_by: 'scout_mission',
          discovery_date: new Date().toISOString()
        });
      });
    }

    // Process intelligence
    if (explorationData.enemy_activities) {
      explorationData.enemy_activities.forEach(activity => {
        results.intelligence.push({
          type: 'enemy_activity',
          enemy_id: activity.enemy_id,
          location: activity.location,
          activity_type: activity.type,
          threat_level: activity.threat_level
        });
        
        // Update colony memory
        colony.storeMemory('enemy_movements', {
          enemy_id: activity.enemy_id,
          location: activity.location,
          activity_type: activity.type,
          threat_level: activity.threat_level,
          observed_date: new Date().toISOString()
        });
      });
    }

    // Process map updates
    if (explorationData.terrain_features) {
      explorationData.terrain_features.forEach(feature => {
        results.map_updates.push({
          type: 'terrain_feature',
          feature_type: feature.type,
          location: feature.location,
          strategic_value: feature.strategic_value
        });
      });
    }

    return results;
  }
}

module.exports = ExplorationManager; 
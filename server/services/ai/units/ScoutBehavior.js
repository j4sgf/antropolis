/**
 * ScoutBehavior class for AI scout unit behavior
 * Handles pathfinding, information gathering, and mission execution
 */

class ScoutBehavior {
  constructor() {
    this.scoutStates = ['idle', 'moving', 'exploring', 'returning', 'investigating'];
    this.pathfindingModes = ['direct', 'safe', 'stealth', 'rapid'];
    this.investigationTypes = ['resource', 'enemy', 'terrain', 'strategic'];
  }

  /**
   * Create a scout mission from exploration assignment
   */
  createScoutMission(assignment, colony) {
    const mission = {
      id: `scout_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: assignment.assignment_type,
      objective: assignment.objective_id,
      scouts_assigned: assignment.scouts_assigned,
      target_coordinates: assignment.target_coordinates,
      colony_id: colony.id,
      start_position: { x: colony.base_x, y: colony.base_y },
      current_position: { x: colony.base_x, y: colony.base_y },
      state: 'idle',
      progress: 0,
      discoveries: [],
      intelligence: [],
      estimated_duration: assignment.estimated_duration,
      actual_duration: 0,
      success_probability: assignment.success_probability,
      fallback_plan: assignment.fallback_plan,
      created_at: new Date().toISOString(),
      last_update: new Date().toISOString()
    };

    return mission;
  }

  /**
   * Plan pathfinding route for scout mission
   */
  planScoutRoute(mission, gameState = {}) {
    const route = {
      waypoints: [],
      total_distance: 0,
      estimated_time: 0,
      pathfinding_mode: 'safe',
      risk_level: 0.3,
      alternative_routes: []
    };

    // Determine pathfinding mode based on mission type and risk
    route.pathfinding_mode = this.selectPathfindingMode(mission, gameState);
    
    // Generate waypoints to target coordinates
    route.waypoints = this.generateWaypoints(mission, route.pathfinding_mode);
    
    // Calculate route metrics
    route.total_distance = this.calculateRouteDistance(route.waypoints);
    route.estimated_time = this.estimateRouteTime(route.waypoints, mission.scouts_assigned);
    route.risk_level = this.assessRouteRisk(route.waypoints, gameState);
    
    // Generate alternative routes if primary route is risky
    if (route.risk_level > 0.6) {
      route.alternative_routes = this.generateAlternativeRoutes(mission, gameState);
    }

    return route;
  }

  /**
   * Select appropriate pathfinding mode
   */
  selectPathfindingMode(mission, gameState) {
    // High-risk missions use stealth mode
    if (mission.type === 'surveillance' || mission.success_probability < 0.6) {
      return 'stealth';
    }
    
    // Time-sensitive missions use rapid mode
    if (mission.estimated_duration <= 2) {
      return 'rapid';
    }
    
    // Resource discovery uses direct mode for efficiency
    if (mission.type === 'survey') {
      return 'direct';
    }
    
    // Default to safe mode
    return 'safe';
  }

  /**
   * Generate waypoints for the route
   */
  generateWaypoints(mission, pathfindingMode) {
    const waypoints = [];
    const start = mission.start_position;
    const targets = mission.target_coordinates;

    // Add starting position
    waypoints.push({
      ...start,
      type: 'start',
      action: 'departure',
      estimated_time: 0
    });

    // Generate intermediate waypoints based on pathfinding mode
    switch (pathfindingMode) {
      case 'direct':
        waypoints.push(...this.generateDirectWaypoints(start, targets));
        break;
      case 'safe':
        waypoints.push(...this.generateSafeWaypoints(start, targets));
        break;
      case 'stealth':
        waypoints.push(...this.generateStealthWaypoints(start, targets));
        break;
      case 'rapid':
        waypoints.push(...this.generateRapidWaypoints(start, targets));
        break;
    }

    // Add return waypoint
    waypoints.push({
      ...start,
      type: 'return',
      action: 'return_to_base',
      estimated_time: waypoints.length * 2
    });

    return waypoints;
  }

  /**
   * Generate direct route waypoints
   */
  generateDirectWaypoints(start, targets) {
    const waypoints = [];
    
    targets.forEach((target, index) => {
      waypoints.push({
        x: target.x,
        y: target.y,
        type: target.type || 'exploration',
        action: 'investigate',
        estimated_time: index + 1,
        investigation_time: this.getInvestigationTime(target.type)
      });
    });

    return waypoints;
  }

  /**
   * Generate safe route waypoints (avoiding known threats)
   */
  generateSafeWaypoints(start, targets) {
    const waypoints = [];
    
    targets.forEach((target, index) => {
      // Add intermediate safety checkpoints
      if (index > 0) {
        const prevTarget = targets[index - 1];
        const midpoint = this.calculateMidpoint(prevTarget, target);
        waypoints.push({
          x: midpoint.x,
          y: midpoint.y,
          type: 'checkpoint',
          action: 'safety_check',
          estimated_time: index + 0.5
        });
      }
      
      waypoints.push({
        x: target.x,
        y: target.y,
        type: target.type || 'exploration',
        action: 'investigate',
        estimated_time: index + 1,
        investigation_time: this.getInvestigationTime(target.type)
      });
    });

    return waypoints;
  }

  /**
   * Generate stealth route waypoints (avoiding detection)
   */
  generateStealthWaypoints(start, targets) {
    const waypoints = [];
    
    targets.forEach((target, index) => {
      // Add approach waypoints for stealth
      const approachPoint = this.calculateApproachPoint(target);
      waypoints.push({
        x: approachPoint.x,
        y: approachPoint.y,
        type: 'approach',
        action: 'stealth_approach',
        estimated_time: index + 0.5
      });
      
      waypoints.push({
        x: target.x,
        y: target.y,
        type: target.type || 'exploration',
        action: 'stealth_investigate',
        estimated_time: index + 1,
        investigation_time: this.getInvestigationTime(target.type) * 1.5 // Stealth takes longer
      });
    });

    return waypoints;
  }

  /**
   * Generate rapid route waypoints (fastest path)
   */
  generateRapidWaypoints(start, targets) {
    const waypoints = [];
    
    // Only visit highest priority targets for speed
    const priorityTargets = targets.slice(0, Math.ceil(targets.length / 2));
    
    priorityTargets.forEach((target, index) => {
      waypoints.push({
        x: target.x,
        y: target.y,
        type: target.type || 'exploration',
        action: 'rapid_survey',
        estimated_time: index + 0.5,
        investigation_time: this.getInvestigationTime(target.type) * 0.5 // Rapid is faster
      });
    });

    return waypoints;
  }

  /**
   * Calculate midpoint between two positions
   */
  calculateMidpoint(pos1, pos2) {
    return {
      x: Math.floor((pos1.x + pos2.x) / 2),
      y: Math.floor((pos1.y + pos2.y) / 2)
    };
  }

  /**
   * Calculate approach point for stealth
   */
  calculateApproachPoint(target) {
    // Approach from a safe distance
    const offset = 2;
    return {
      x: target.x + (Math.random() > 0.5 ? offset : -offset),
      y: target.y + (Math.random() > 0.5 ? offset : -offset)
    };
  }

  /**
   * Get investigation time based on target type
   */
  getInvestigationTime(targetType) {
    const investigationTimes = {
      'spiral_point': 1,
      'adjacent_area': 1,
      'perimeter_point': 2,
      'strategic_position': 2,
      'long_range_target': 3,
      'checkpoint': 0.5,
      'approach': 0.5
    };

    return investigationTimes[targetType] || 1;
  }

  /**
   * Calculate total route distance
   */
  calculateRouteDistance(waypoints) {
    let totalDistance = 0;
    
    for (let i = 1; i < waypoints.length; i++) {
      const prev = waypoints[i - 1];
      const current = waypoints[i];
      const distance = Math.sqrt(
        Math.pow(current.x - prev.x, 2) + 
        Math.pow(current.y - prev.y, 2)
      );
      totalDistance += distance;
    }

    return totalDistance;
  }

  /**
   * Estimate route completion time
   */
  estimateRouteTime(waypoints, scoutCount) {
    let totalTime = 0;
    
    waypoints.forEach(waypoint => {
      totalTime += waypoint.estimated_time || 1;
      totalTime += waypoint.investigation_time || 0;
    });

    // More scouts can split up to cover ground faster
    const scoutEfficiency = Math.min(2.0, 1.0 + (scoutCount - 1) * 0.2);
    
    return Math.ceil(totalTime / scoutEfficiency);
  }

  /**
   * Assess route risk level
   */
  assessRouteRisk(waypoints, gameState) {
    let totalRisk = 0;
    let riskFactors = 0;

    waypoints.forEach(waypoint => {
      let waypointRisk = 0.2; // Base risk
      
      // Distance from base increases risk
      const distance = Math.sqrt(waypoint.x * waypoint.x + waypoint.y * waypoint.y);
      waypointRisk += Math.min(0.3, distance / 50);
      
      // Unknown areas have higher risk
      if (waypoint.type === 'perimeter_point' || waypoint.type === 'long_range_target') {
        waypointRisk += 0.2;
      }
      
      // Stealth actions have reduced risk
      if (waypoint.action && waypoint.action.includes('stealth')) {
        waypointRisk *= 0.7;
      }
      
      totalRisk += waypointRisk;
      riskFactors++;
    });

    return riskFactors > 0 ? Math.min(1.0, totalRisk / riskFactors) : 0.3;
  }

  /**
   * Generate alternative routes for high-risk primary routes
   */
  generateAlternativeRoutes(mission, gameState) {
    const alternatives = [];
    
    // Conservative alternative (safer but slower)
    const conservativeRoute = this.planConservativeRoute(mission);
    alternatives.push(conservativeRoute);
    
    // Bypass alternative (different path)
    const bypassRoute = this.planBypassRoute(mission);
    alternatives.push(bypassRoute);

    return alternatives;
  }

  /**
   * Plan conservative route with maximum safety
   */
  planConservativeRoute(mission) {
    const conservativeTargets = mission.target_coordinates.slice(0, 2); // Fewer targets
    const route = {
      waypoints: this.generateSafeWaypoints(mission.start_position, conservativeTargets),
      pathfinding_mode: 'safe',
      risk_level: 0.2,
      estimated_time: mission.estimated_duration * 1.5
    };
    
    return route;
  }

  /**
   * Plan bypass route avoiding high-risk areas
   */
  planBypassRoute(mission) {
    // Modify target coordinates to avoid center of map
    const modifiedTargets = mission.target_coordinates.map(target => ({
      x: target.x + (Math.random() - 0.5) * 4,
      y: target.y + (Math.random() - 0.5) * 4,
      type: target.type
    }));

    const route = {
      waypoints: this.generateDirectWaypoints(mission.start_position, modifiedTargets),
      pathfinding_mode: 'direct',
      risk_level: 0.4,
      estimated_time: mission.estimated_duration * 1.2
    };
    
    return route;
  }

  /**
   * Execute scout mission step
   */
  executeScoutStep(mission, currentTick, gameState = {}) {
    const stepResult = {
      mission_id: mission.id,
      step_completed: false,
      discoveries: [],
      intelligence: [],
      position_updated: false,
      state_changed: false,
      next_action: null,
      completion_progress: 0
    };

    // Update mission duration
    mission.actual_duration++;

    // Determine current waypoint
    const currentWaypoint = this.getCurrentWaypoint(mission);
    if (!currentWaypoint) {
      // Mission complete
      mission.state = 'returning';
      stepResult.step_completed = true;
      stepResult.completion_progress = 1.0;
      return stepResult;
    }

    // Execute action at current waypoint
    const actionResult = this.executeWaypointAction(mission, currentWaypoint, gameState);
    stepResult.discoveries.push(...actionResult.discoveries);
    stepResult.intelligence.push(...actionResult.intelligence);

    // Update mission position
    if (this.shouldMoveToWaypoint(mission, currentWaypoint)) {
      mission.current_position = { x: currentWaypoint.x, y: currentWaypoint.y };
      stepResult.position_updated = true;
    }

    // Update mission progress
    mission.progress = Math.min(1.0, mission.actual_duration / mission.estimated_duration);
    stepResult.completion_progress = mission.progress;

    // Determine next action
    stepResult.next_action = this.determineNextAction(mission, currentWaypoint);

    // Update mission state if needed
    const newState = this.determineScoutState(mission, currentWaypoint);
    if (newState !== mission.state) {
      mission.state = newState;
      stepResult.state_changed = true;
    }

    mission.last_update = new Date().toISOString();

    return stepResult;
  }

  /**
   * Get current waypoint based on mission progress
   */
  getCurrentWaypoint(mission) {
    if (!mission.route || !mission.route.waypoints) {
      return null;
    }

    const progressIndex = Math.floor(mission.progress * mission.route.waypoints.length);
    return mission.route.waypoints[progressIndex] || null;
  }

  /**
   * Execute action at a waypoint
   */
  executeWaypointAction(mission, waypoint, gameState) {
    const result = {
      discoveries: [],
      intelligence: [],
      action_completed: true
    };

    switch (waypoint.action) {
      case 'investigate':
        result.discoveries.push(...this.investigateLocation(waypoint, mission, gameState));
        break;
      case 'stealth_investigate':
        result.intelligence.push(...this.stealthInvestigate(waypoint, mission, gameState));
        break;
      case 'rapid_survey':
        result.discoveries.push(...this.rapidSurvey(waypoint, mission, gameState));
        break;
      case 'safety_check':
        result.intelligence.push(...this.performSafetyCheck(waypoint, mission, gameState));
        break;
      case 'stealth_approach':
        // No immediate results, just positioning
        break;
      default:
        // Basic exploration
        result.discoveries.push(...this.basicExploration(waypoint, mission, gameState));
    }

    return result;
  }

  /**
   * Investigate a location thoroughly
   */
  investigateLocation(waypoint, mission, gameState) {
    const discoveries = [];
    
    // Simulate resource discovery
    if (Math.random() < 0.3) {
      discoveries.push({
        type: 'resource',
        resource_type: this.generateRandomResourceType(),
        location: { x: waypoint.x, y: waypoint.y },
        abundance: Math.random() * 100,
        accessibility: Math.random(),
        discovered_by: mission.id,
        discovery_method: 'investigation'
      });
    }

    // Simulate terrain feature discovery
    if (Math.random() < 0.2) {
      discoveries.push({
        type: 'terrain_feature',
        feature_type: this.generateRandomTerrainFeature(),
        location: { x: waypoint.x, y: waypoint.y },
        strategic_value: Math.random(),
        discovered_by: mission.id,
        discovery_method: 'investigation'
      });
    }

    return discoveries;
  }

  /**
   * Perform stealth investigation
   */
  stealthInvestigate(waypoint, mission, gameState) {
    const intelligence = [];
    
    // Higher chance of enemy detection in stealth mode
    if (Math.random() < 0.4) {
      intelligence.push({
        type: 'enemy_activity',
        enemy_type: 'patrol',
        location: { x: waypoint.x, y: waypoint.y },
        activity_type: 'movement',
        threat_level: Math.random(),
        confidence: 0.8,
        discovered_by: mission.id,
        discovery_method: 'stealth_observation'
      });
    }

    return intelligence;
  }

  /**
   * Perform rapid survey
   */
  rapidSurvey(waypoint, mission, gameState) {
    const discoveries = [];
    
    // Lower chance but faster discovery
    if (Math.random() < 0.15) {
      discoveries.push({
        type: 'quick_scan',
        scan_type: 'terrain',
        location: { x: waypoint.x, y: waypoint.y },
        quality: 'basic',
        discovered_by: mission.id,
        discovery_method: 'rapid_survey'
      });
    }

    return discoveries;
  }

  /**
   * Perform safety check
   */
  performSafetyCheck(waypoint, mission, gameState) {
    const intelligence = [];
    
    // Safety assessment
    intelligence.push({
      type: 'safety_assessment',
      location: { x: waypoint.x, y: waypoint.y },
      safety_level: Math.random(),
      threats_detected: Math.random() < 0.1,
      discovered_by: mission.id,
      discovery_method: 'safety_check'
    });

    return intelligence;
  }

  /**
   * Perform basic exploration
   */
  basicExploration(waypoint, mission, gameState) {
    const discoveries = [];
    
    // Basic discovery chance
    if (Math.random() < 0.2) {
      discoveries.push({
        type: 'exploration',
        location: { x: waypoint.x, y: waypoint.y },
        visibility_improved: true,
        discovered_by: mission.id,
        discovery_method: 'basic_exploration'
      });
    }

    return discoveries;
  }

  /**
   * Generate random resource type for discoveries
   */
  generateRandomResourceType() {
    const resourceTypes = ['food', 'wood', 'stone', 'water', 'minerals'];
    return resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
  }

  /**
   * Generate random terrain feature
   */
  generateRandomTerrainFeature() {
    const features = ['hill', 'river', 'forest', 'clearing', 'rocky_outcrop', 'water_source'];
    return features[Math.floor(Math.random() * features.length)];
  }

  /**
   * Check if scout should move to waypoint
   */
  shouldMoveToWaypoint(mission, waypoint) {
    const distance = Math.sqrt(
      Math.pow(waypoint.x - mission.current_position.x, 2) + 
      Math.pow(waypoint.y - mission.current_position.y, 2)
    );
    
    // Move if not already at the waypoint
    return distance > 0.5;
  }

  /**
   * Determine next action for the mission
   */
  determineNextAction(mission, currentWaypoint) {
    if (mission.progress >= 1.0) {
      return 'return_to_base';
    }
    
    if (!currentWaypoint) {
      return 'find_next_waypoint';
    }
    
    if (this.shouldMoveToWaypoint(mission, currentWaypoint)) {
      return 'move_to_waypoint';
    }
    
    return currentWaypoint.action || 'investigate';
  }

  /**
   * Determine current scout state
   */
  determineScoutState(mission, currentWaypoint) {
    if (mission.progress >= 1.0) {
      return 'returning';
    }
    
    if (!currentWaypoint) {
      return 'idle';
    }
    
    if (this.shouldMoveToWaypoint(mission, currentWaypoint)) {
      return 'moving';
    }
    
    if (currentWaypoint.action && currentWaypoint.action.includes('investigate')) {
      return 'investigating';
    }
    
    return 'exploring';
  }

  /**
   * Check if mission is complete
   */
  isMissionComplete(mission) {
    return mission.progress >= 1.0 || mission.state === 'returning';
  }

  /**
   * Calculate mission success rate
   */
  calculateMissionSuccess(mission) {
    let successScore = 0.5; // Base success
    
    // Time efficiency factor
    if (mission.actual_duration <= mission.estimated_duration) {
      successScore += 0.2;
    } else if (mission.actual_duration > mission.estimated_duration * 1.5) {
      successScore -= 0.2;
    }
    
    // Discovery factor
    const totalDiscoveries = mission.discoveries.length;
    successScore += Math.min(0.3, totalDiscoveries * 0.1);
    
    // Completion factor
    successScore += mission.progress * 0.3;
    
    return Math.max(0, Math.min(1.0, successScore));
  }
}

module.exports = ScoutBehavior; 
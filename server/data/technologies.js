// Tech tree data structure for ant colony evolution
// Categories: physical, specialized, environmental, combat, efficiency

const technologies = [
  // ========== PHYSICAL TRAITS ==========
  {
    id: 'tech-001',
    name: 'Enhanced Strength',
    description: 'Increases ant carrying capacity and building speed',
    category: 'physical',
    required_research_points: 50,
    prerequisite_techs: [],
    required_buildings: [],
    effects: {
      carrying_capacity_bonus: 25,
      building_speed_bonus: 15,
      combat_strength_bonus: 10
    },
    visual_changes: {
      size_modifier: 1.1,
      color_tint: 'darker'
    }
  },
  {
    id: 'tech-002',
    name: 'Improved Speed',
    description: 'Increases movement speed for all activities',
    category: 'physical',
    required_research_points: 50,
    prerequisite_techs: [],
    required_buildings: [],
    effects: {
      movement_speed_bonus: 30,
      foraging_efficiency_bonus: 20,
      escape_chance_bonus: 15
    },
    visual_changes: {
      animation_speed: 1.2,
      trail_effect: true
    }
  },
  {
    id: 'tech-003',
    name: 'Enhanced Intelligence',
    description: 'Improves task efficiency and decision making',
    category: 'physical',
    required_research_points: 75,
    prerequisite_techs: [],
    required_buildings: [],
    effects: {
      task_efficiency_bonus: 25,
      tech_research_bonus: 20,
      communication_range_bonus: 50
    },
    visual_changes: {
      head_size_modifier: 1.15,
      antenna_glow: true
    }
  },
  {
    id: 'tech-004',
    name: 'Reinforced Exoskeleton',
    description: 'Provides better protection and health',
    category: 'physical',
    required_research_points: 60,
    prerequisite_techs: [],
    required_buildings: [],
    effects: {
      max_health_bonus: 40,
      damage_reduction: 20,
      environmental_resistance: 30
    },
    visual_changes: {
      shell_thickness: 1.2,
      metallic_sheen: true
    }
  },

  // ========== ADVANCED PHYSICAL TRAITS ==========
  {
    id: 'tech-005',
    name: 'Super Strength',
    description: 'Massive increase in physical capabilities',
    category: 'physical',
    required_research_points: 150,
    prerequisite_techs: ['tech-001', 'tech-004'],
    required_buildings: ['workshop'],
    effects: {
      carrying_capacity_bonus: 75,
      building_speed_bonus: 40,
      combat_strength_bonus: 50
    },
    visual_changes: {
      size_modifier: 1.3,
      muscle_definition: true
    }
  },
  {
    id: 'tech-006',
    name: 'Lightning Reflexes',
    description: 'Extreme speed and agility enhancements',
    category: 'physical',
    required_research_points: 125,
    prerequisite_techs: ['tech-002', 'tech-003'],
    required_buildings: [],
    effects: {
      movement_speed_bonus: 80,
      dodge_chance_bonus: 35,
      multi_task_ability: true
    },
    visual_changes: {
      blur_effect: true,
      electric_aura: true
    }
  },

  // ========== SPECIALIZED ANT TYPES ==========
  {
    id: 'tech-007',
    name: 'Elite Soldier Caste',
    description: 'Unlock specialized combat ants',
    category: 'specialized',
    required_research_points: 100,
    prerequisite_techs: ['tech-004'],
    required_buildings: ['barracks'],
    effects: {
      unlock_ant_type: 'elite_soldier',
      combat_effectiveness_bonus: 60,
      defense_bonus: 40
    },
    visual_changes: {
      armor_plating: true,
      weapon_mandibles: true
    }
  },
  {
    id: 'tech-008',
    name: 'Master Foragers',
    description: 'Specialized resource gathering ants',
    category: 'specialized',
    required_research_points: 80,
    prerequisite_techs: ['tech-002'],
    required_buildings: ['food_storage'],
    effects: {
      unlock_ant_type: 'master_forager',
      resource_gathering_bonus: 80,
      resource_detection_range: 100
    },
    visual_changes: {
      enlarged_mandibles: true,
      resource_pouches: true
    }
  },
  {
    id: 'tech-009',
    name: 'Scout Rangers',
    description: 'Elite exploration and reconnaissance ants',
    category: 'specialized',
    required_research_points: 90,
    prerequisite_techs: ['tech-002', 'tech-003'],
    required_buildings: ['watchtower'],
    effects: {
      unlock_ant_type: 'scout_ranger',
      exploration_speed_bonus: 100,
      vision_range_bonus: 150,
      stealth_ability: true
    },
    visual_changes: {
      camouflage_pattern: true,
      enhanced_eyes: true
    }
  },
  {
    id: 'tech-010',
    name: 'Engineer Architects',
    description: 'Specialized building and construction ants',
    category: 'specialized',
    required_research_points: 120,
    prerequisite_techs: ['tech-001', 'tech-003'],
    required_buildings: ['workshop'],
    effects: {
      unlock_ant_type: 'engineer_architect',
      building_speed_bonus: 100,
      structure_durability_bonus: 50,
      unlock_advanced_buildings: true
    },
    visual_changes: {
      tool_appendages: true,
      blueprint_markings: true
    }
  },

  // ========== ENVIRONMENTAL ADAPTATIONS ==========
  {
    id: 'tech-011',
    name: 'Aquatic Adaptation',
    description: 'Ability to work in and around water',
    category: 'environmental',
    required_research_points: 75,
    prerequisite_techs: ['tech-004'],
    required_buildings: [],
    effects: {
      water_movement_ability: true,
      water_resource_gathering: true,
      flood_resistance: 90
    },
    visual_changes: {
      waterproof_coating: true,
      fin_appendages: true
    }
  },
  {
    id: 'tech-012',
    name: 'Underground Mastery',
    description: 'Enhanced tunneling and subterranean abilities',
    category: 'environmental',
    required_research_points: 85,
    prerequisite_techs: ['tech-001'],
    required_buildings: [],
    effects: {
      tunneling_speed_bonus: 200,
      underground_vision: true,
      mineral_detection_bonus: 100
    },
    visual_changes: {
      drill_mandibles: true,
      earth_sense_organs: true
    }
  },
  {
    id: 'tech-013',
    name: 'Thermal Resistance',
    description: 'Adaptation to extreme temperatures',
    category: 'environmental',
    required_research_points: 70,
    prerequisite_techs: ['tech-004'],
    required_buildings: [],
    effects: {
      heat_resistance: 80,
      cold_resistance: 80,
      desert_efficiency_bonus: 50
    },
    visual_changes: {
      insulation_layer: true,
      thermal_glow: true
    }
  },
  {
    id: 'tech-014',
    name: 'Acid Immunity',
    description: 'Resistance to acid and toxic environments',
    category: 'environmental',
    required_research_points: 100,
    prerequisite_techs: ['tech-004', 'tech-013'],
    required_buildings: [],
    effects: {
      acid_immunity: true,
      toxic_environment_immunity: true,
      chemical_warfare_ability: true
    },
    visual_changes: {
      acid_proof_shell: true,
      toxic_warning_colors: true
    }
  },

  // ========== COMBAT SPECIALIZATIONS ==========
  {
    id: 'tech-015',
    name: 'Poison Weaponry',
    description: 'Develop venomous attacks',
    category: 'combat',
    required_research_points: 90,
    prerequisite_techs: ['tech-007'],
    required_buildings: ['barracks'],
    effects: {
      poison_attack: true,
      poison_damage_over_time: 25,
      fear_factor_bonus: 30
    },
    visual_changes: {
      venom_sacs: true,
      poison_drip_effect: true
    }
  },
  {
    id: 'tech-016',
    name: 'Swarm Tactics',
    description: 'Coordinated group combat techniques',
    category: 'combat',
    required_research_points: 110,
    prerequisite_techs: ['tech-003', 'tech-007'],
    required_buildings: ['barracks'],
    effects: {
      group_combat_bonus: 50,
      flanking_maneuvers: true,
      morale_boost: 40
    },
    visual_changes: {
      formation_markers: true,
      synchronized_animations: true
    }
  },
  {
    id: 'tech-017',
    name: 'Explosive Sacrifice',
    description: 'Ultimate sacrifice for massive damage',
    category: 'combat',
    required_research_points: 150,
    prerequisite_techs: ['tech-015', 'tech-016'],
    required_buildings: ['barracks', 'workshop'],
    effects: {
      kamikaze_attack: true,
      explosion_damage: 200,
      area_effect_damage: true
    },
    visual_changes: {
      explosive_markings: true,
      volatile_glow: true
    }
  },

  // ========== EFFICIENCY AND PRODUCTIVITY ==========
  {
    id: 'tech-018',
    name: 'Resource Optimization',
    description: 'More efficient use of all resources',
    category: 'efficiency',
    required_research_points: 80,
    prerequisite_techs: ['tech-003'],
    required_buildings: ['food_storage'],
    effects: {
      resource_consumption_reduction: 25,
      storage_efficiency_bonus: 40,
      waste_reduction: 60
    },
    visual_changes: {
      efficiency_indicators: true,
      organized_storage: true
    }
  },
  {
    id: 'tech-019',
    name: 'Communication Network',
    description: 'Advanced pheromone communication system',
    category: 'efficiency',
    required_research_points: 100,
    prerequisite_techs: ['tech-003', 'tech-018'],
    required_buildings: [],
    effects: {
      global_coordination: true,
      task_switching_bonus: 50,
      information_sharing_bonus: 75
    },
    visual_changes: {
      pheromone_trails: true,
      communication_antennae: true
    }
  },
  {
    id: 'tech-020',
    name: 'Automation Systems',
    description: 'Partially automated colony functions',
    category: 'efficiency',
    required_research_points: 200,
    prerequisite_techs: ['tech-010', 'tech-019'],
    required_buildings: ['workshop'],
    effects: {
      automated_resource_collection: 30,
      automated_construction: 20,
      passive_income_bonus: 50
    },
    visual_changes: {
      mechanical_components: true,
      automation_indicators: true
    }
  },

  // ========== ULTIMATE EVOLUTIONS ==========
  {
    id: 'tech-021',
    name: 'Hive Mind',
    description: 'Collective consciousness and perfect coordination',
    category: 'specialized',
    required_research_points: 300,
    prerequisite_techs: ['tech-006', 'tech-019', 'tech-020'],
    required_buildings: ['nest_chamber'],
    effects: {
      perfect_coordination: true,
      shared_consciousness: true,
      efficiency_multiplier: 2.0,
      unlock_hive_abilities: true
    },
    visual_changes: {
      neural_connections: true,
      shared_aura: true,
      synchronized_behavior: true
    }
  },
  {
    id: 'tech-022',
    name: 'Genesis Evolution',
    description: 'Transcend normal ant limitations',
    category: 'physical',
    required_research_points: 400,
    prerequisite_techs: ['tech-005', 'tech-014', 'tech-017'],
    required_buildings: ['nest_chamber', 'workshop'],
    effects: {
      transcendent_abilities: true,
      reality_manipulation: true,
      infinite_potential: true,
      unlock_god_mode: true
    },
    visual_changes: {
      ethereal_glow: true,
      reality_distortion: true,
      transcendent_form: true
    }
  }
];

// Tech tree structure helper functions
const TechTreeUtils = {
  /**
   * Get all technologies available for research based on current unlocked techs
   */
  getAvailableTechs(unlockedTechIds = []) {
    return technologies.filter(tech => {
      // Check if tech is already unlocked
      if (unlockedTechIds.includes(tech.id)) {
        return false;
      }
      
      // Check if all prerequisites are met
      return tech.prerequisite_techs.every(prereq => 
        unlockedTechIds.includes(prereq)
      );
    });
  },

  /**
   * Get technology by ID
   */
  getTechById(techId) {
    return technologies.find(tech => tech.id === techId);
  },

  /**
   * Get technologies by category
   */
  getTechsByCategory(category) {
    return technologies.filter(tech => tech.category === category);
  },

  /**
   * Get tech tree organized by categories for UI display
   */
  getStructuredTechTree() {
    const categories = ['physical', 'specialized', 'environmental', 'combat', 'efficiency'];
    const structuredTree = {};
    
    categories.forEach(category => {
      structuredTree[category] = this.getTechsByCategory(category);
    });
    
    return structuredTree;
  },

  /**
   * Calculate total cost to reach a specific technology
   */
  calculateTotalCost(techId, unlockedTechIds = []) {
    const tech = this.getTechById(techId);
    if (!tech) return 0;
    
    let totalCost = tech.required_research_points;
    
    // Add costs of prerequisites that aren't unlocked yet
    tech.prerequisite_techs.forEach(prereqId => {
      if (!unlockedTechIds.includes(prereqId)) {
        totalCost += this.calculateTotalCost(prereqId, unlockedTechIds);
      }
    });
    
    return totalCost;
  },

  /**
   * Get all categories
   */
  getCategories() {
    return [...new Set(technologies.map(tech => tech.category))];
  },

  /**
   * Validate tech tree integrity (no circular dependencies)
   */
  validateTechTree() {
    const errors = [];
    
    technologies.forEach(tech => {
      // Check for self-reference
      if (tech.prerequisite_techs.includes(tech.id)) {
        errors.push(`Technology ${tech.id} references itself as a prerequisite`);
      }
      
      // Check for invalid prerequisites
      tech.prerequisite_techs.forEach(prereqId => {
        const prereq = this.getTechById(prereqId);
        if (!prereq) {
          errors.push(`Technology ${tech.id} has invalid prerequisite: ${prereqId}`);
        }
      });
    });
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
};

module.exports = {
  technologies,
  TechTreeUtils
}; 
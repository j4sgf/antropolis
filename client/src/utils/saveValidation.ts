import { z } from 'zod';
import {
  SaveGame,
  SaveValidation,
  SaveVersion,
  ColonyInfo,
  Resources,
  AntData,
  BuildingData,
  ResearchProgress,
  EvolutionData,
  EnvironmentData,
  GameEvent,
  GameStatistics,
  GameSettings,
  ViewState,
  TutorialProgress
} from '../types/saveGame';

/**
 * Save Data Validation - Comprehensive validation schemas using Zod
 */

// Version schema
const SaveVersionSchema = z.object({
  major: z.number().int().min(0),
  minor: z.number().int().min(0),
  patch: z.number().int().min(0),
  build: z.string().optional()
});

// Colony information schema
const ColonyInfoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50),
  founded: z.date(),
  daysSurvived: z.number().int().min(0),
  difficulty: z.enum(['easy', 'medium', 'hard', 'nightmare']),
  gameMode: z.enum(['sandbox', 'survival', 'campaign']),
  population: z.number().int().min(0),
  maxPopulation: z.number().int().min(0),
  happiness: z.number().min(0).max(100),
  overallRating: z.enum(['struggling', 'stable', 'thriving', 'legendary'])
});

// Resources schema
const ResourcesSchema = z.object({
  food: z.number().min(0),
  water: z.number().min(0),
  materials: z.number().min(0),
  wood: z.number().min(0),
  stone: z.number().min(0),
  energy: z.number().min(0),
  research_points: z.number().min(0),
  evolution_points: z.number().min(0),
  specialized_resources: z.record(z.string(), z.number()).optional()
});

// Resource production schema
const ResourceProductionSchema = z.object({
  food_per_tick: z.number(),
  water_per_tick: z.number(),
  materials_per_tick: z.number(),
  wood_per_tick: z.number(),
  stone_per_tick: z.number(),
  energy_per_tick: z.number(),
  research_per_tick: z.number(),
  evolution_per_tick: z.number()
});

// Ant data schema
const AntDataSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  type: z.enum(['worker', 'soldier', 'scout', 'builder', 'researcher', 'queen', 'specialized']),
  level: z.number().int().min(1).max(100),
  experience: z.number().min(0),
  health: z.number().min(0),
  maxHealth: z.number().min(1),
  energy: z.number().min(0),
  maxEnergy: z.number().min(1),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  currentTask: z.string().optional(),
  traits: z.array(z.string()),
  equipment: z.array(z.string()).optional(),
  skills: z.record(z.string(), z.number().min(0).max(100)),
  birthDate: z.date(),
  achievements: z.array(z.string()),
  status: z.enum(['active', 'injured', 'resting', 'working', 'fighting'])
});

// Building data schema
const BuildingDataSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  level: z.number().int().min(1).max(10),
  health: z.number().min(0),
  maxHealth: z.number().min(1),
  constructed: z.date(),
  lastMaintenance: z.date().optional(),
  upgrades: z.array(z.string()),
  efficiency: z.number().min(0).max(2),
  operatingCost: ResourcesSchema,
  production: ResourcesSchema.optional(),
  capacity: z.number().int().min(0).optional(),
  currentOccupancy: z.number().int().min(0).optional(),
  status: z.enum(['active', 'inactive', 'damaged', 'upgrading', 'under_construction']),
  constructionProgress: z.number().min(0).max(100).optional(),
  assignedAnts: z.array(z.string())
});

// Research progress schema
const ResearchProgressSchema = z.object({
  completed_technologies: z.array(z.string()),
  current_research: z.string().optional(),
  research_progress: z.number().min(0).max(100),
  research_queue: z.array(z.string()),
  total_research_points_earned: z.number().min(0),
  research_bonuses: z.record(z.string(), z.number())
});

// Evolution data schema
const EvolutionDataSchema = z.object({
  unlocked_techs: z.array(z.string()),
  evolution_points_earned: z.number().min(0),
  evolution_points_spent: z.number().min(0),
  active_mutations: z.array(z.string()),
  evolution_tree_progress: z.record(z.string(), z.number().min(0).max(100)),
  trait_bonuses: z.record(z.string(), z.number())
});

// Environment data schema
const EnvironmentDataSchema = z.object({
  season: z.enum(['spring', 'summer', 'autumn', 'winter']),
  weather: z.enum(['sunny', 'rainy', 'cloudy', 'stormy', 'drought', 'flood']),
  temperature: z.number().min(-50).max(70),
  humidity: z.number().min(0).max(100),
  dayNightCycle: z.enum(['dawn', 'day', 'dusk', 'night']),
  currentDay: z.number().int().min(0),
  currentTime: z.number().min(0).max(100),
  threats: z.object({
    predators: z.number().int().min(0),
    diseases: z.array(z.string()),
    natural_disasters: z.array(z.string()),
    resource_scarcity: z.record(z.string(), z.number().min(0).max(1))
  })
});

// Game event schema
const GameEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  timestamp: z.date(),
  effects: z.record(z.string(), z.any()),
  resolved: z.boolean(),
  choices_made: z.record(z.string(), z.any()).optional()
});

// Game statistics schema
const GameStatisticsSchema = z.object({
  total_play_time: z.number().min(0),
  ants_born: z.number().int().min(0),
  ants_died: z.number().int().min(0),
  buildings_constructed: z.number().int().min(0),
  buildings_destroyed: z.number().int().min(0),
  research_completed: z.number().int().min(0),
  evolution_upgrades: z.number().int().min(0),
  resources_gathered: ResourcesSchema,
  resources_consumed: ResourcesSchema,
  battles_won: z.number().int().min(0),
  battles_lost: z.number().int().min(0),
  major_achievements: z.array(z.string()),
  milestones_reached: z.array(z.string())
});

// Game settings schema
const GameSettingsSchema = z.object({
  game_speed: z.number().min(0.1).max(5),
  auto_pause_on_events: z.boolean(),
  show_notifications: z.boolean(),
  sound_enabled: z.boolean(),
  music_enabled: z.boolean(),
  graphics_quality: z.enum(['low', 'medium', 'high', 'ultra']),
  ui_scale: z.number().min(0.5).max(2),
  accessibility_features: z.object({
    colorblind_mode: z.string(),
    high_contrast: z.boolean(),
    reduce_motion: z.boolean(),
    screen_reader: z.boolean()
  }),
  auto_save_enabled: z.boolean(),
  auto_save_interval: z.number().int().min(1).max(60)
});

// View state schema
const ViewStateSchema = z.object({
  camera_position: z.object({
    x: z.number(),
    y: z.number()
  }),
  zoom_level: z.number().min(0.1).max(5),
  active_view: z.enum(['colony', 'world', 'research', 'evolution', 'statistics']),
  ui_panels_open: z.array(z.string()),
  selected_entities: z.array(z.string()),
  view_filters: z.record(z.string(), z.boolean())
});

// Tutorial progress schema
const TutorialProgressSchema = z.object({
  completed_steps: z.array(z.string()),
  current_tutorial: z.string().optional(),
  hints_shown: z.array(z.string()),
  tips_dismissed: z.array(z.string()),
  tutorial_mode: z.boolean()
});

// Main save game schema
const SaveGameSchema = z.object({
  // Metadata
  version: SaveVersionSchema,
  save_id: z.string().min(1),
  save_name: z.string().min(1).max(100),
  created_at: z.date(),
  last_saved: z.date(),
  save_size: z.number().int().min(0),
  checksum: z.string().optional(),
  thumbnail: z.string().optional(),

  // Core game data
  colony: ColonyInfoSchema,
  resources: ResourcesSchema,
  resource_production: ResourceProductionSchema,
  ants: z.array(AntDataSchema),
  buildings: z.array(BuildingDataSchema),
  research: ResearchProgressSchema,
  evolution: EvolutionDataSchema,
  environment: EnvironmentDataSchema,

  // Game progression
  events: z.array(GameEventSchema),
  statistics: GameStatisticsSchema,
  tutorial: TutorialProgressSchema,

  // User preferences
  settings: GameSettingsSchema,
  view_state: ViewStateSchema,

  // Additional data
  custom_data: z.record(z.string(), z.any()).optional(),
  mod_data: z.record(z.string(), z.any()).optional()
});

/**
 * Save Data Validator Class
 */
export class SaveDataValidator {
  /**
   * Validate a complete save game object
   */
  public static validateSaveGame(saveData: any): SaveValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const corruptedSections: string[] = [];

    try {
      // Basic structure validation
      if (!saveData || typeof saveData !== 'object') {
        return {
          is_valid: false,
          errors: ['Save data is not a valid object'],
          warnings: [],
          corrupted_sections: ['all'],
          recovery_possible: false
        };
      }

      // Validate main structure
      const result = SaveGameSchema.safeParse(saveData);
      
      if (!result.success) {
        const zodErrors = result.error.errors;
        
        for (const error of zodErrors) {
          const path = error.path.join('.');
          const section = error.path[0] as string;
          
          if (this.isCriticalSection(section)) {
            errors.push(`${path}: ${error.message}`);
            if (section && !corruptedSections.includes(section)) {
              corruptedSections.push(section);
            }
          } else {
            warnings.push(`${path}: ${error.message}`);
          }
        }
      }

      // Additional business logic validation
      if (saveData.colony && saveData.colony.population !== saveData.ants?.length) {
        warnings.push('Colony population count does not match ants array length');
      }

      if (saveData.colony && saveData.colony.maxPopulation < saveData.colony.population) {
        warnings.push('Max population is less than current population');
      }

      if (saveData.buildings) {
        const invalidBuildings = saveData.buildings.filter((building: any) => 
          building.currentOccupancy > building.capacity
        );
        if (invalidBuildings.length > 0) {
          warnings.push(`${invalidBuildings.length} buildings have invalid occupancy`);
        }
      }

      if (saveData.resources) {
        const negativeResources = Object.entries(saveData.resources)
          .filter(([key, value]) => typeof value === 'number' && value < 0)
          .map(([key]) => key);
        
        if (negativeResources.length > 0) {
          warnings.push(`Negative resource values: ${negativeResources.join(', ')}`);
        }
      }

      if (saveData.evolution) {
        if (saveData.evolution.evolution_points_spent > saveData.evolution.evolution_points_earned) {
          warnings.push('Spent evolution points exceed earned points');
        }
      }

      // Version compatibility check
      if (saveData.version) {
        const version = saveData.version;
        if (version.major > 1 || (version.major === 1 && version.minor > 0)) {
          warnings.push('Save file is from a newer version of the game');
        }
      }

      // Timestamp validation
      if (saveData.created_at && saveData.last_saved) {
        if (saveData.created_at > saveData.last_saved) {
          warnings.push('Creation date is after last saved date');
        }
      }

      // Recovery assessment
      const recoveryPossible = corruptedSections.length < 3 && !corruptedSections.includes('colony');

      return {
        is_valid: errors.length === 0,
        errors,
        warnings,
        corrupted_sections: corruptedSections,
        recovery_possible: recoveryPossible
      };

    } catch (error) {
      return {
        is_valid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        corrupted_sections: ['validation'],
        recovery_possible: false
      };
    }
  }

  /**
   * Validate a specific section of save data
   */
  public static validateSection(sectionName: string, sectionData: any): SaveValidation {
    const schemas: Record<string, z.ZodSchema> = {
      colony: ColonyInfoSchema,
      resources: ResourcesSchema,
      resource_production: ResourceProductionSchema,
      ants: z.array(AntDataSchema),
      buildings: z.array(BuildingDataSchema),
      research: ResearchProgressSchema,
      evolution: EvolutionDataSchema,
      environment: EnvironmentDataSchema,
      events: z.array(GameEventSchema),
      statistics: GameStatisticsSchema,
      tutorial: TutorialProgressSchema,
      settings: GameSettingsSchema,
      view_state: ViewStateSchema
    };

    const schema = schemas[sectionName];
    if (!schema) {
      return {
        is_valid: false,
        errors: [`Unknown section: ${sectionName}`],
        warnings: [],
        corrupted_sections: [sectionName],
        recovery_possible: false
      };
    }

    const result = schema.safeParse(sectionData);
    
    if (result.success) {
      return {
        is_valid: true,
        errors: [],
        warnings: [],
        corrupted_sections: [],
        recovery_possible: true
      };
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );

      return {
        is_valid: false,
        errors,
        warnings: [],
        corrupted_sections: [sectionName],
        recovery_possible: !this.isCriticalSection(sectionName)
      };
    }
  }

  /**
   * Attempt to repair corrupted save data
   */
  public static repairSaveData(saveData: any): { 
    repaired: any; 
    repairLog: string[]; 
    wasRepaired: boolean 
  } {
    const repairLog: string[] = [];
    let wasRepaired = false;
    const repaired = JSON.parse(JSON.stringify(saveData)); // Deep clone

    try {
      // Fix missing or invalid colony data
      if (!repaired.colony || typeof repaired.colony !== 'object') {
        repaired.colony = this.getDefaultColonyInfo();
        repairLog.push('Restored missing colony information');
        wasRepaired = true;
      }

      // Fix missing resources
      if (!repaired.resources || typeof repaired.resources !== 'object') {
        repaired.resources = this.getDefaultResources();
        repairLog.push('Restored missing resources');
        wasRepaired = true;
      }

      // Fix negative resource values
      if (repaired.resources) {
        for (const [key, value] of Object.entries(repaired.resources)) {
          if (typeof value === 'number' && value < 0) {
            repaired.resources[key] = 0;
            repairLog.push(`Fixed negative ${key} value`);
            wasRepaired = true;
          }
        }
      }

      // Fix invalid ants array
      if (!Array.isArray(repaired.ants)) {
        repaired.ants = [];
        repairLog.push('Restored missing ants array');
        wasRepaired = true;
      }

      // Fix invalid buildings array
      if (!Array.isArray(repaired.buildings)) {
        repaired.buildings = [];
        repairLog.push('Restored missing buildings array');
        wasRepaired = true;
      }

      // Fix missing version info
      if (!repaired.version) {
        repaired.version = { major: 1, minor: 0, patch: 0, build: 'repaired' };
        repairLog.push('Added missing version information');
        wasRepaired = true;
      }

      // Fix invalid timestamps
      if (!repaired.created_at || !(repaired.created_at instanceof Date)) {
        repaired.created_at = new Date();
        repairLog.push('Fixed invalid creation date');
        wasRepaired = true;
      }

      if (!repaired.last_saved || !(repaired.last_saved instanceof Date)) {
        repaired.last_saved = new Date();
        repairLog.push('Fixed invalid last saved date');
        wasRepaired = true;
      }

      // Fix population count mismatch
      if (repaired.colony && repaired.ants) {
        if (repaired.colony.population !== repaired.ants.length) {
          repaired.colony.population = repaired.ants.length;
          repairLog.push('Fixed population count mismatch');
          wasRepaired = true;
        }
      }

      // Fix building occupancy issues
      if (repaired.buildings) {
        for (const building of repaired.buildings) {
          if (building.currentOccupancy > building.capacity) {
            building.currentOccupancy = building.capacity;
            repairLog.push(`Fixed building ${building.id} occupancy`);
            wasRepaired = true;
          }
        }
      }

      // Fix evolution points
      if (repaired.evolution) {
        if (repaired.evolution.evolution_points_spent > repaired.evolution.evolution_points_earned) {
          repaired.evolution.evolution_points_spent = repaired.evolution.evolution_points_earned;
          repairLog.push('Fixed evolution points spent/earned mismatch');
          wasRepaired = true;
        }
      }

    } catch (error) {
      repairLog.push(`Repair error: ${error.message}`);
    }

    return {
      repaired,
      repairLog,
      wasRepaired
    };
  }

  /**
   * Check if a section is critical for game functionality
   */
  private static isCriticalSection(sectionName: string): boolean {
    const criticalSections = ['colony', 'resources', 'version', 'save_id'];
    return criticalSections.includes(sectionName);
  }

  /**
   * Get default colony information for repairs
   */
  private static getDefaultColonyInfo(): ColonyInfo {
    return {
      id: `recovered_${Date.now()}`,
      name: 'Recovered Colony',
      founded: new Date(),
      daysSurvived: 0,
      difficulty: 'easy',
      gameMode: 'sandbox',
      population: 0,
      maxPopulation: 100,
      happiness: 50,
      overallRating: 'stable'
    };
  }

  /**
   * Get default resources for repairs
   */
  private static getDefaultResources(): Resources {
    return {
      food: 100,
      water: 100,
      materials: 50,
      wood: 50,
      stone: 25,
      energy: 100,
      research_points: 0,
      evolution_points: 0
    };
  }

  /**
   * Get schema for a specific section
   */
  public static getSchemaForSection(sectionName: string): z.ZodSchema | null {
    const schemas: Record<string, z.ZodSchema> = {
      version: SaveVersionSchema,
      colony: ColonyInfoSchema,
      resources: ResourcesSchema,
      resource_production: ResourceProductionSchema,
      ants: z.array(AntDataSchema),
      buildings: z.array(BuildingDataSchema),
      research: ResearchProgressSchema,
      evolution: EvolutionDataSchema,
      environment: EnvironmentDataSchema,
      events: z.array(GameEventSchema),
      statistics: GameStatisticsSchema,
      tutorial: TutorialProgressSchema,
      settings: GameSettingsSchema,
      view_state: ViewStateSchema
    };

    return schemas[sectionName] || null;
  }
}

export default SaveDataValidator; 
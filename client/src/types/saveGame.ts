/**
 * Save Game Data Structure
 * Comprehensive interface for capturing all game state
 */

// Version information for backwards compatibility
export interface SaveVersion {
  major: number;
  minor: number;
  patch: number;
  build?: string;
}

// Colony basic information
export interface ColonyInfo {
  id: string;
  name: string;
  founded: Date;
  daysSurvived: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'nightmare';
  gameMode: 'sandbox' | 'survival' | 'campaign';
  population: number;
  maxPopulation: number;
  happiness: number;
  overallRating: 'struggling' | 'stable' | 'thriving' | 'legendary';
}

// Resource data
export interface Resources {
  food: number;
  water: number;
  materials: number;
  wood: number;
  stone: number;
  energy: number;
  research_points: number;
  evolution_points: number;
  specialized_resources?: Record<string, number>;
}

// Resource production rates
export interface ResourceProduction {
  food_per_tick: number;
  water_per_tick: number;
  materials_per_tick: number;
  wood_per_tick: number;
  stone_per_tick: number;
  energy_per_tick: number;
  research_per_tick: number;
  evolution_per_tick: number;
}

// Individual ant data
export interface AntData {
  id: string;
  name?: string;
  type: 'worker' | 'soldier' | 'scout' | 'builder' | 'researcher' | 'queen' | 'specialized';
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  position: { x: number; y: number };
  currentTask?: string;
  traits: string[];
  equipment?: string[];
  skills: Record<string, number>;
  birthDate: Date;
  achievements: string[];
  status: 'active' | 'injured' | 'resting' | 'working' | 'fighting';
}

// Building/Structure data
export interface BuildingData {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  level: number;
  health: number;
  maxHealth: number;
  constructed: Date;
  lastMaintenance?: Date;
  upgrades: string[];
  efficiency: number;
  operatingCost: Resources;
  production?: Resources;
  capacity?: number;
  currentOccupancy?: number;
  status: 'active' | 'inactive' | 'damaged' | 'upgrading' | 'under_construction';
  constructionProgress?: number;
  assignedAnts: string[]; // Ant IDs
}

// Research progress
export interface ResearchProgress {
  completed_technologies: string[];
  current_research?: string;
  research_progress: number;
  research_queue: string[];
  total_research_points_earned: number;
  research_bonuses: Record<string, number>;
}

// Evolution system data
export interface EvolutionData {
  unlocked_techs: string[];
  evolution_points_earned: number;
  evolution_points_spent: number;
  active_mutations: string[];
  evolution_tree_progress: Record<string, number>;
  trait_bonuses: Record<string, number>;
}

// Environment and world state
export interface EnvironmentData {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  weather: 'sunny' | 'rainy' | 'cloudy' | 'stormy' | 'drought' | 'flood';
  temperature: number;
  humidity: number;
  dayNightCycle: 'dawn' | 'day' | 'dusk' | 'night';
  currentDay: number;
  currentTime: number; // Time within the day (0-100)
  threats: {
    predators: number;
    diseases: string[];
    natural_disasters: string[];
    resource_scarcity: Record<string, number>;
  };
}

// Game events and history
export interface GameEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  effects: Record<string, any>;
  resolved: boolean;
  choices_made?: Record<string, any>;
}

// Statistics and achievements
export interface GameStatistics {
  total_play_time: number; // in minutes
  ants_born: number;
  ants_died: number;
  buildings_constructed: number;
  buildings_destroyed: number;
  research_completed: number;
  evolution_upgrades: number;
  resources_gathered: Resources;
  resources_consumed: Resources;
  battles_won: number;
  battles_lost: number;
  major_achievements: string[];
  milestones_reached: string[];
}

// Game settings and preferences
export interface GameSettings {
  game_speed: number;
  auto_pause_on_events: boolean;
  show_notifications: boolean;
  sound_enabled: boolean;
  music_enabled: boolean;
  graphics_quality: 'low' | 'medium' | 'high' | 'ultra';
  ui_scale: number;
  accessibility_features: {
    colorblind_mode: string;
    high_contrast: boolean;
    reduce_motion: boolean;
    screen_reader: boolean;
  };
  auto_save_enabled: boolean;
  auto_save_interval: number; // in minutes
}

// Camera and view state
export interface ViewState {
  camera_position: { x: number; y: number };
  zoom_level: number;
  active_view: 'colony' | 'world' | 'research' | 'evolution' | 'statistics';
  ui_panels_open: string[];
  selected_entities: string[];
  view_filters: Record<string, boolean>;
}

// Tutorial and onboarding progress
export interface TutorialProgress {
  completed_steps: string[];
  current_tutorial?: string;
  hints_shown: string[];
  tips_dismissed: string[];
  tutorial_mode: boolean;
}

// Main save game interface
export interface SaveGame {
  // Metadata
  version: SaveVersion;
  save_id: string;
  save_name: string;
  created_at: Date;
  last_saved: Date;
  save_size: number; // in bytes
  checksum?: string;
  thumbnail?: string; // base64 encoded image
  
  // Core game data
  colony: ColonyInfo;
  resources: Resources;
  resource_production: ResourceProduction;
  ants: AntData[];
  buildings: BuildingData[];
  research: ResearchProgress;
  evolution: EvolutionData;
  environment: EnvironmentData;
  
  // Game progression
  events: GameEvent[];
  statistics: GameStatistics;
  tutorial: TutorialProgress;
  
  // User preferences
  settings: GameSettings;
  view_state: ViewState;
  
  // Additional data for future expansion
  custom_data?: Record<string, any>;
  mod_data?: Record<string, any>;
}

// Save slot information for UI
export interface SaveSlot {
  slot_id: number;
  save_game?: SaveGame;
  is_empty: boolean;
  last_accessed?: Date;
  is_auto_save: boolean;
  is_quick_save: boolean;
}

// Save operation result
export interface SaveResult {
  success: boolean;
  save_id?: string;
  error?: string;
  compressed_size?: number;
  save_time?: number; // milliseconds
}

// Load operation result
export interface LoadResult {
  success: boolean;
  save_game?: SaveGame;
  error?: string;
  load_time?: number; // milliseconds
  version_mismatch?: boolean;
  migration_applied?: boolean;
}

// Export/Import format
export interface ExportData {
  format_version: string;
  export_date: Date;
  exported_by: string;
  save_games: SaveGame[];
  metadata: {
    total_saves: number;
    total_size: number;
    compression_used: boolean;
    encryption_used: boolean;
  };
}

// Validation schema for save data integrity
export interface SaveValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  corrupted_sections: string[];
  recovery_possible: boolean;
}

// Auto-save configuration
export interface AutoSaveConfig {
  enabled: boolean;
  interval_minutes: number;
  max_auto_saves: number;
  save_on_events: string[];
  save_before_major_actions: boolean;
  compress_auto_saves: boolean;
}

// Cloud save data (for future cloud sync)
export interface CloudSaveData {
  cloud_id: string;
  local_save_id: string;
  last_sync: Date;
  sync_status: 'synced' | 'pending' | 'conflict' | 'error';
  cloud_size: number;
  conflict_resolution?: 'local' | 'cloud' | 'manual';
}

// Save manager state
export interface SaveManagerState {
  current_save_id?: string;
  auto_save_config: AutoSaveConfig;
  save_slots: SaveSlot[];
  last_auto_save?: Date;
  total_saves: number;
  storage_used: number; // in bytes
  storage_limit: number; // in bytes
  compression_enabled: boolean;
}

export default SaveGame; 
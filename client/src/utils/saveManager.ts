import * as LZString from 'lz-string';
import {
  SaveGame,
  SaveResult,
  LoadResult,
  SaveSlot,
  SaveManagerState,
  AutoSaveConfig,
  SaveValidation,
  SaveVersion
} from '../types/saveGame';

/**
 * SaveManager - Handles all save/load operations for the game
 * Provides compression, validation, and local storage management
 */
export class SaveManager {
  private static instance: SaveManager;
  private currentState: SaveManagerState;
  private readonly storageKeyPrefix = 'antopolis_save_';
  private readonly stateStorageKey = 'antopolis_save_state';
  private readonly maxSaveSlots = 10;
  private readonly currentVersion: SaveVersion = { major: 1, minor: 0, patch: 0, build: 'dev' };

  private constructor() {
    this.currentState = this.initializeState();
    this.loadState();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  /**
   * Initialize default save manager state
   */
  private initializeState(): SaveManagerState {
    const defaultAutoSaveConfig: AutoSaveConfig = {
      enabled: true,
      interval_minutes: 5,
      max_auto_saves: 3,
      save_on_events: ['day_end', 'major_construction', 'research_complete', 'evolution_unlock'],
      save_before_major_actions: true,
      compress_auto_saves: true
    };

    const emptySlots: SaveSlot[] = Array.from({ length: this.maxSaveSlots }, (_, index) => ({
      slot_id: index + 1,
      is_empty: true,
      is_auto_save: index < 3, // First 3 slots are auto-save slots
      is_quick_save: index === 9 // Last slot is quick-save
    }));

    return {
      auto_save_config: defaultAutoSaveConfig,
      save_slots: emptySlots,
      total_saves: 0,
      storage_used: 0,
      storage_limit: 50 * 1024 * 1024, // 50MB limit
      compression_enabled: true
    };
  }

  /**
   * Load save manager state from localStorage
   */
  private loadState(): void {
    try {
      const savedState = localStorage.getItem(this.stateStorageKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        this.currentState = { ...this.currentState, ...parsedState };
        
        // Restore date objects
        this.currentState.save_slots.forEach(slot => {
          if (slot.last_accessed) {
            slot.last_accessed = new Date(slot.last_accessed);
          }
        });
        
        if (this.currentState.last_auto_save) {
          this.currentState.last_auto_save = new Date(this.currentState.last_auto_save);
        }
      }
      
      // Load actual save data for each slot
      this.loadSaveSlots();
    } catch (error) {
      console.error('Failed to load save manager state:', error);
      this.currentState = this.initializeState();
    }
  }

  /**
   * Save save manager state to localStorage
   */
  private saveState(): void {
    try {
      localStorage.setItem(this.stateStorageKey, JSON.stringify(this.currentState));
    } catch (error) {
      console.error('Failed to save manager state:', error);
    }
  }

  /**
   * Load save data for all occupied slots
   */
  private loadSaveSlots(): void {
    this.currentState.save_slots.forEach(slot => {
      if (!slot.is_empty) {
        const storageKey = `${this.storageKeyPrefix}slot_${slot.slot_id}`;
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          try {
            const loadResult = this.deserializeSaveData(savedData);
            if (loadResult.success && loadResult.save_game) {
              slot.save_game = loadResult.save_game;
              slot.last_accessed = new Date(loadResult.save_game.last_saved);
            } else {
              // Mark slot as empty if data is corrupted
              slot.is_empty = true;
              slot.save_game = undefined;
              slot.last_accessed = undefined;
            }
          } catch (error) {
            console.error(`Failed to load save slot ${slot.slot_id}:`, error);
            slot.is_empty = true;
            slot.save_game = undefined;
            slot.last_accessed = undefined;
          }
        }
      }
    });
  }

  /**
   * Generate a unique save ID
   */
  private generateSaveId(): string {
    return `save_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Calculate checksum for save data integrity
   */
  private calculateChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Serialize save data with compression
   */
  private serializeSaveData(saveGame: SaveGame, compress: boolean = true): string {
    try {
      // Add metadata
      saveGame.version = this.currentVersion;
      saveGame.last_saved = new Date();
      
      // Convert to JSON
      const jsonData = JSON.stringify(saveGame, (key, value) => {
        // Handle Date objects
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });

      // Calculate checksum
      saveGame.checksum = this.calculateChecksum(jsonData);
      
      // Re-serialize with checksum
      const finalJson = JSON.stringify(saveGame, (key, value) => {
        if (value instanceof Date) {
          return { __type: 'Date', value: value.toISOString() };
        }
        return value;
      });

      // Compress if enabled
      if (compress && this.currentState.compression_enabled) {
        return LZString.compressToUTF16(finalJson);
      }
      
      return finalJson;
    } catch (error) {
      console.error('Failed to serialize save data:', error);
      throw new Error('Serialization failed');
    }
  }

  /**
   * Deserialize save data with decompression
   */
  private deserializeSaveData(data: string): LoadResult {
    const startTime = performance.now();
    
    try {
      let jsonData: string;
      
      // Try to decompress first
      try {
        const decompressed = LZString.decompressFromUTF16(data);
        if (decompressed) {
          jsonData = decompressed;
        } else {
          // Not compressed or compression failed, use raw data
          jsonData = data;
        }
      } catch {
        // Decompression failed, use raw data
        jsonData = data;
      }

      // Parse JSON and restore Date objects
      const saveGame: SaveGame = JSON.parse(jsonData, (key, value) => {
        if (value && typeof value === 'object' && value.__type === 'Date') {
          return new Date(value.value);
        }
        return value;
      });

      // Validate version compatibility
      const versionMismatch = !this.isVersionCompatible(saveGame.version);
      let migrationApplied = false;

      if (versionMismatch) {
        try {
          this.migrateSaveData(saveGame);
          migrationApplied = true;
        } catch (error) {
          return {
            success: false,
            error: `Version migration failed: ${error.message}`,
            load_time: performance.now() - startTime,
            version_mismatch: true
          };
        }
      }

      // Validate data integrity
      const validation = this.validateSaveData(saveGame);
      if (!validation.is_valid) {
        return {
          success: false,
          error: `Save data validation failed: ${validation.errors.join(', ')}`,
          load_time: performance.now() - startTime
        };
      }

      return {
        success: true,
        save_game: saveGame,
        load_time: performance.now() - startTime,
        version_mismatch: versionMismatch,
        migration_applied: migrationApplied
      };
    } catch (error) {
      return {
        success: false,
        error: `Deserialization failed: ${error.message}`,
        load_time: performance.now() - startTime
      };
    }
  }

  /**
   * Check if save version is compatible
   */
  private isVersionCompatible(saveVersion: SaveVersion): boolean {
    const current = this.currentVersion;
    
    // Major version must match
    if (saveVersion.major !== current.major) {
      return false;
    }
    
    // Minor version can be different but save must not be newer
    if (saveVersion.minor > current.minor) {
      return false;
    }
    
    return true;
  }

  /**
   * Migrate save data to current version
   */
  private migrateSaveData(saveGame: SaveGame): void {
    const currentVer = this.currentVersion;
    const saveVer = saveGame.version;

    console.log(`Migrating save from ${saveVer.major}.${saveVer.minor}.${saveVer.patch} to ${currentVer.major}.${currentVer.minor}.${currentVer.patch}`);

    // Add migration logic here for different versions
    // For now, just update the version
    saveGame.version = currentVer;

    // Example migration logic:
    // if (saveVer.minor < 1) {
    //   // Add new fields introduced in v1.1.0
    //   if (!saveGame.evolution) {
    //     saveGame.evolution = defaultEvolutionData();
    //   }
    // }
  }

  /**
   * Validate save data integrity
   */
  private validateSaveData(saveGame: SaveGame): SaveValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const corruptedSections: string[] = [];

    try {
      // Basic structure validation
      if (!saveGame.save_id || typeof saveGame.save_id !== 'string') {
        errors.push('Invalid or missing save ID');
      }

      if (!saveGame.colony || typeof saveGame.colony.id !== 'string') {
        errors.push('Invalid colony data');
        corruptedSections.push('colony');
      }

      if (!saveGame.resources || typeof saveGame.resources.food !== 'number') {
        errors.push('Invalid resources data');
        corruptedSections.push('resources');
      }

      if (!Array.isArray(saveGame.ants)) {
        errors.push('Invalid ants data');
        corruptedSections.push('ants');
      }

      if (!Array.isArray(saveGame.buildings)) {
        errors.push('Invalid buildings data');
        corruptedSections.push('buildings');
      }

      // Checksum validation
      if (saveGame.checksum) {
        const tempGame = { ...saveGame };
        delete tempGame.checksum;
        const recalculatedChecksum = this.calculateChecksum(JSON.stringify(tempGame));
        
        if (saveGame.checksum !== recalculatedChecksum) {
          warnings.push('Checksum mismatch - data may be corrupted');
        }
      }

      // Date validation
      if (!(saveGame.created_at instanceof Date) || isNaN(saveGame.created_at.getTime())) {
        warnings.push('Invalid creation date');
      }

      if (!(saveGame.last_saved instanceof Date) || isNaN(saveGame.last_saved.getTime())) {
        warnings.push('Invalid last saved date');
      }

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      corrupted_sections: corruptedSections,
      recovery_possible: corruptedSections.length < 3 // Can recover if less than 3 sections are corrupted
    };
  }

  /**
   * Save game to specified slot
   */
  public async saveGame(saveGame: SaveGame, slotId: number, saveName?: string): Promise<SaveResult> {
    const startTime = performance.now();

    try {
      // Validate slot ID
      if (slotId < 1 || slotId > this.maxSaveSlots) {
        return {
          success: false,
          error: `Invalid slot ID: ${slotId}`
        };
      }

      // Generate save ID if not provided
      if (!saveGame.save_id) {
        saveGame.save_id = this.generateSaveId();
      }

      // Set save name
      if (saveName) {
        saveGame.save_name = saveName;
      } else if (!saveGame.save_name) {
        saveGame.save_name = `Save ${slotId} - ${new Date().toLocaleDateString()}`;
      }

      // Update metadata
      saveGame.created_at = saveGame.created_at || new Date();
      saveGame.last_saved = new Date();

      // Serialize data
      const slot = this.currentState.save_slots[slotId - 1];
      const compress = slot.is_auto_save ? this.currentState.auto_save_config.compress_auto_saves : this.currentState.compression_enabled;
      const serializedData = this.serializeSaveData(saveGame, compress);

      // Calculate size
      const dataSize = new Blob([serializedData]).size;
      saveGame.save_size = dataSize;

      // Check storage limits
      if (this.currentState.storage_used + dataSize > this.currentState.storage_limit) {
        return {
          success: false,
          error: 'Storage limit exceeded'
        };
      }

      // Save to localStorage
      const storageKey = `${this.storageKeyPrefix}slot_${slotId}`;
      localStorage.setItem(storageKey, serializedData);

      // Update slot information
      slot.save_game = saveGame;
      slot.is_empty = false;
      slot.last_accessed = new Date();

      // Update state
      if (slot.is_empty) {
        this.currentState.total_saves++;
      }
      this.currentState.storage_used += dataSize;
      this.currentState.current_save_id = saveGame.save_id;

      // Save state
      this.saveState();

      const saveTime = performance.now() - startTime;

      return {
        success: true,
        save_id: saveGame.save_id,
        compressed_size: dataSize,
        save_time: saveTime
      };

    } catch (error) {
      return {
        success: false,
        error: `Save failed: ${error.message}`,
        save_time: performance.now() - startTime
      };
    }
  }

  /**
   * Load game from specified slot
   */
  public async loadGame(slotId: number): Promise<LoadResult> {
    try {
      // Validate slot ID
      if (slotId < 1 || slotId > this.maxSaveSlots) {
        return {
          success: false,
          error: `Invalid slot ID: ${slotId}`
        };
      }

      const slot = this.currentState.save_slots[slotId - 1];
      
      if (slot.is_empty) {
        return {
          success: false,
          error: 'Save slot is empty'
        };
      }

      // Load from localStorage
      const storageKey = `${this.storageKeyPrefix}slot_${slotId}`;
      const savedData = localStorage.getItem(storageKey);

      if (!savedData) {
        return {
          success: false,
          error: 'Save data not found'
        };
      }

      // Deserialize data
      const loadResult = this.deserializeSaveData(savedData);

      if (loadResult.success && loadResult.save_game) {
        // Update slot access time
        slot.last_accessed = new Date();
        this.currentState.current_save_id = loadResult.save_game.save_id;
        this.saveState();
      }

      return loadResult;

    } catch (error) {
      return {
        success: false,
        error: `Load failed: ${error.message}`
      };
    }
  }

  /**
   * Delete save from specified slot
   */
  public deleteSave(slotId: number): boolean {
    try {
      if (slotId < 1 || slotId > this.maxSaveSlots) {
        return false;
      }

      const slot = this.currentState.save_slots[slotId - 1];
      
      if (slot.is_empty) {
        return false;
      }

      // Remove from localStorage
      const storageKey = `${this.storageKeyPrefix}slot_${slotId}`;
      localStorage.removeItem(storageKey);

      // Update slot
      const dataSize = slot.save_game?.save_size || 0;
      slot.save_game = undefined;
      slot.is_empty = true;
      slot.last_accessed = undefined;

      // Update state
      this.currentState.total_saves--;
      this.currentState.storage_used -= dataSize;

      this.saveState();
      return true;

    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Get all save slots
   */
  public getSaveSlots(): SaveSlot[] {
    return [...this.currentState.save_slots];
  }

  /**
   * Get save manager state
   */
  public getState(): SaveManagerState {
    return { ...this.currentState };
  }

  /**
   * Update auto-save configuration
   */
  public updateAutoSaveConfig(config: Partial<AutoSaveConfig>): void {
    this.currentState.auto_save_config = {
      ...this.currentState.auto_save_config,
      ...config
    };
    this.saveState();
  }

  /**
   * Get next available save slot
   */
  public getNextAvailableSlot(): number | null {
    const availableSlot = this.currentState.save_slots.find(slot => slot.is_empty && !slot.is_auto_save);
    return availableSlot ? availableSlot.slot_id : null;
  }

  /**
   * Get next auto-save slot
   */
  public getNextAutoSaveSlot(): number {
    const autoSaveSlots = this.currentState.save_slots.filter(slot => slot.is_auto_save);
    
    // Find oldest auto-save or first empty auto-save slot
    let oldestSlot = autoSaveSlots[0];
    
    for (const slot of autoSaveSlots) {
      if (slot.is_empty) {
        return slot.slot_id;
      }
      
      if (!oldestSlot.last_accessed || 
          (slot.last_accessed && slot.last_accessed < oldestSlot.last_accessed)) {
        oldestSlot = slot;
      }
    }
    
    return oldestSlot.slot_id;
  }

  /**
   * Clear all saves (with confirmation)
   */
  public clearAllSaves(): boolean {
    try {
      // Remove all save data from localStorage
      for (let i = 1; i <= this.maxSaveSlots; i++) {
        const storageKey = `${this.storageKeyPrefix}slot_${i}`;
        localStorage.removeItem(storageKey);
      }

      // Reset state
      this.currentState = this.initializeState();
      this.saveState();

      return true;
    } catch (error) {
      console.error('Failed to clear all saves:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  public getStorageStats(): { used: number; limit: number; percentage: number; saves: number } {
    return {
      used: this.currentState.storage_used,
      limit: this.currentState.storage_limit,
      percentage: (this.currentState.storage_used / this.currentState.storage_limit) * 100,
      saves: this.currentState.total_saves
    };
  }
}

// Export singleton instance
export default SaveManager.getInstance(); 
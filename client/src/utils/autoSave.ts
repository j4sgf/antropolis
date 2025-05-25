import SaveManager from './saveManager';
import { SaveGame, AutoSaveConfig, SaveResult } from '../types/saveGame';

/**
 * AutoSave - Handles automatic saving functionality
 * Triggers saves at regular intervals and on important game events
 */
export class AutoSave {
  private static instance: AutoSave;
  private saveManager: typeof SaveManager;
  private intervalTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = true;
  private lastAutoSaveTime: Date | null = null;
  private gameDataProvider: (() => SaveGame | null) | null = null;
  private eventQueue: Set<string> = new Set();
  private saveInProgress: boolean = false;
  private config: AutoSaveConfig;

  private constructor() {
    this.saveManager = SaveManager;
    this.config = this.saveManager.getState().auto_save_config;
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AutoSave {
    if (!AutoSave.instance) {
      AutoSave.instance = new AutoSave();
    }
    return AutoSave.instance;
  }

  /**
   * Initialize auto-save system
   */
  private initialize(): void {
    this.config = this.saveManager.getState().auto_save_config;
    this.isEnabled = this.config.enabled;
    
    if (this.isEnabled) {
      this.startAutoSaveTimer();
    }

    // Listen for visibility changes to pause/resume auto-save
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for beforeunload to trigger a final save
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  /**
   * Set the game data provider function
   */
  public setGameDataProvider(provider: () => SaveGame | null): void {
    this.gameDataProvider = provider;
  }

  /**
   * Start the auto-save timer
   */
  private startAutoSaveTimer(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }

    if (!this.config.enabled || this.config.interval_minutes <= 0) {
      return;
    }

    const intervalMs = this.config.interval_minutes * 60 * 1000;
    
    this.intervalTimer = setInterval(() => {
      if (!document.hidden && this.isEnabled) {
        this.triggerAutoSave('interval');
      }
    }, intervalMs);
  }

  /**
   * Stop the auto-save timer
   */
  private stopAutoSaveTimer(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Handle visibility change (pause auto-save when tab is hidden)
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Tab is hidden - pause auto-save and trigger one final save
      this.pause();
      if (this.config.save_before_major_actions) {
        this.triggerAutoSave('tab_hidden');
      }
    } else {
      // Tab is visible again - resume auto-save
      this.resume();
    }
  }

  /**
   * Handle before unload event
   */
  private handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.config.save_before_major_actions && this.gameDataProvider) {
      // Trigger synchronous save before page unload
      this.triggerAutoSave('page_unload', true);
    }
  }

  /**
   * Update auto-save configuration
   */
  public updateConfig(newConfig: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveManager.updateAutoSaveConfig(this.config);
    
    this.isEnabled = this.config.enabled;
    
    if (this.isEnabled) {
      this.startAutoSaveTimer();
    } else {
      this.stopAutoSaveTimer();
    }
  }

  /**
   * Enable auto-save
   */
  public enable(): void {
    this.isEnabled = true;
    this.updateConfig({ enabled: true });
  }

  /**
   * Disable auto-save
   */
  public disable(): void {
    this.isEnabled = false;
    this.stopAutoSaveTimer();
    this.updateConfig({ enabled: false });
  }

  /**
   * Pause auto-save temporarily (without changing config)
   */
  public pause(): void {
    this.stopAutoSaveTimer();
  }

  /**
   * Resume auto-save
   */
  public resume(): void {
    if (this.isEnabled) {
      this.startAutoSaveTimer();
    }
  }

  /**
   * Trigger an auto-save
   */
  public async triggerAutoSave(
    reason: string = 'manual', 
    synchronous: boolean = false
  ): Promise<SaveResult | null> {
    // Prevent multiple simultaneous saves
    if (this.saveInProgress) {
      console.log('Auto-save already in progress, skipping...');
      return null;
    }

    if (!this.gameDataProvider) {
      console.warn('No game data provider set for auto-save');
      return null;
    }

    if (!this.isEnabled && reason !== 'page_unload') {
      console.log('Auto-save is disabled');
      return null;
    }

    try {
      this.saveInProgress = true;
      
      const gameData = this.gameDataProvider();
      if (!gameData) {
        console.warn('No game data available for auto-save');
        return null;
      }

      // Get next auto-save slot
      const autoSaveSlot = this.saveManager.getNextAutoSaveSlot();
      
      // Generate auto-save name
      const saveName = this.generateAutoSaveName(reason);
      
      // Perform the save
      const savePromise = this.saveManager.saveGame(gameData, autoSaveSlot, saveName);
      
      let result: SaveResult;
      if (synchronous) {
        result = await savePromise;
      } else {
        result = await savePromise;
      }

      if (result.success) {
        this.lastAutoSaveTime = new Date();
        console.log(`Auto-save successful (${reason}):`, result);
        
        // Emit custom event for notifications
        window.dispatchEvent(new CustomEvent('autoSaveSuccess', {
          detail: { reason, result }
        }));
      } else {
        console.error(`Auto-save failed (${reason}):`, result.error);
        
        // Emit custom event for error handling
        window.dispatchEvent(new CustomEvent('autoSaveError', {
          detail: { reason, error: result.error }
        }));
      }

      return result;

    } catch (error) {
      console.error('Auto-save error:', error);
      
      window.dispatchEvent(new CustomEvent('autoSaveError', {
        detail: { reason, error: error.message }
      }));
      
      return {
        success: false,
        error: error.message
      };
    } finally {
      this.saveInProgress = false;
    }
  }

  /**
   * Trigger auto-save on specific game events
   */
  public onGameEvent(eventType: string, eventData?: any): void {
    if (!this.config.save_on_events.includes(eventType)) {
      return;
    }

    // Add to event queue to prevent spam
    this.eventQueue.add(eventType);
    
    // Debounce event-based saves
    setTimeout(() => {
      if (this.eventQueue.has(eventType)) {
        this.eventQueue.delete(eventType);
        this.triggerAutoSave(`event_${eventType}`);
      }
    }, 2000); // 2 second debounce
  }

  /**
   * Generate auto-save name based on reason
   */
  private generateAutoSaveName(reason: string): string {
    const timestamp = new Date().toLocaleString();
    const reasonMap: Record<string, string> = {
      'interval': 'Auto Save',
      'day_end': 'End of Day',
      'major_construction': 'Construction',
      'research_complete': 'Research',
      'evolution_unlock': 'Evolution',
      'tab_hidden': 'Tab Switch',
      'page_unload': 'Exit Game',
      'manual': 'Manual Auto Save'
    };

    const displayReason = reasonMap[reason] || reason.replace('event_', '').replace('_', ' ');
    return `${displayReason} - ${timestamp}`;
  }

  /**
   * Get auto-save status
   */
  public getStatus(): {
    enabled: boolean;
    lastSaveTime: Date | null;
    nextSaveIn: number | null; // milliseconds
    saveInProgress: boolean;
    config: AutoSaveConfig;
  } {
    let nextSaveIn: number | null = null;
    
    if (this.isEnabled && this.lastAutoSaveTime && this.config.interval_minutes > 0) {
      const intervalMs = this.config.interval_minutes * 60 * 1000;
      const timeSinceLastSave = Date.now() - this.lastAutoSaveTime.getTime();
      nextSaveIn = Math.max(0, intervalMs - timeSinceLastSave);
    }

    return {
      enabled: this.isEnabled,
      lastSaveTime: this.lastAutoSaveTime,
      nextSaveIn,
      saveInProgress: this.saveInProgress,
      config: { ...this.config }
    };
  }

  /**
   * Force auto-save cleanup (for testing or manual cleanup)
   */
  public cleanup(): void {
    this.stopAutoSaveTimer();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    this.eventQueue.clear();
  }

  /**
   * Check if enough time has passed for next auto-save
   */
  public canAutoSave(): boolean {
    if (!this.isEnabled || this.saveInProgress) {
      return false;
    }

    if (!this.lastAutoSaveTime) {
      return true;
    }

    const intervalMs = this.config.interval_minutes * 60 * 1000;
    const timeSinceLastSave = Date.now() - this.lastAutoSaveTime.getTime();
    
    return timeSinceLastSave >= intervalMs;
  }

  /**
   * Set the last auto-save time (useful for initialization)
   */
  public setLastAutoSaveTime(time: Date): void {
    this.lastAutoSaveTime = time;
  }

  /**
   * Get time until next auto-save
   */
  public getTimeUntilNextSave(): number {
    if (!this.isEnabled || !this.lastAutoSaveTime) {
      return 0;
    }

    const intervalMs = this.config.interval_minutes * 60 * 1000;
    const timeSinceLastSave = Date.now() - this.lastAutoSaveTime.getTime();
    
    return Math.max(0, intervalMs - timeSinceLastSave);
  }

  /**
   * Validate auto-save configuration
   */
  public validateConfig(config: Partial<AutoSaveConfig>): string[] {
    const errors: string[] = [];

    if (config.interval_minutes !== undefined) {
      if (config.interval_minutes < 1) {
        errors.push('Auto-save interval must be at least 1 minute');
      }
      if (config.interval_minutes > 60) {
        errors.push('Auto-save interval should not exceed 60 minutes');
      }
    }

    if (config.max_auto_saves !== undefined) {
      if (config.max_auto_saves < 1) {
        errors.push('Must have at least 1 auto-save slot');
      }
      if (config.max_auto_saves > 10) {
        errors.push('Too many auto-save slots (maximum 10)');
      }
    }

    if (config.save_on_events !== undefined) {
      const validEvents = ['day_end', 'major_construction', 'research_complete', 'evolution_unlock'];
      const invalidEvents = config.save_on_events.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        errors.push(`Invalid auto-save events: ${invalidEvents.join(', ')}`);
      }
    }

    return errors;
  }
}

// Export singleton instance
export default AutoSave.getInstance(); 
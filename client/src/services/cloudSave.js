import { supabase, auth } from '../config/supabase';
import SaveManager from '../utils/saveManager';
import * as LZString from 'lz-string';

/**
 * CloudSaveService - Handles cloud save functionality using Supabase
 * Provides uploading, downloading, and synchronization of save data
 */
export class CloudSaveService {
  static instance = null;
  
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.conflictResolvers = new Map();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!CloudSaveService.instance) {
      CloudSaveService.instance = new CloudSaveService();
    }
    return CloudSaveService.instance;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const { data: { user } } = await auth.getUser();
    return !!user;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await auth.getUser();
    if (error) throw error;
    return user;
  }

  /**
   * Sign up a new user
   */
  async signUp(email, password, username) {
    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });

    if (error) throw error;

    // Create user profile in users table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          username: username
        });
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return data;
  }

  /**
   * Sign in user
   */
  async signIn(email, password) {
    const { data, error } = await auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out user
   */
  async signOut() {
    const { error } = await auth.signOut();
    if (error) throw error;
  }

  /**
   * Upload save game to cloud
   */
  async uploadSave(saveGame, slotId = 1, options = {}) {
    if (!this.isOnline) {
      this.queueSync('upload', { saveGame, slotId, options });
      throw new Error('Currently offline. Save will be uploaded when connection is restored.');
    }

    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      // Prepare save data
      const saveData = this.prepareSaveData(saveGame);
      const { compressed, isCompressed, size } = this.compressSaveData(saveData);
      
      // Calculate checksum
      const checksum = this.calculateChecksum(JSON.stringify(saveData));

      // Prepare database record
      const saveRecord = {
        user_id: user.id,
        save_name: saveGame.save_name,
        save_slot: slotId,
        save_data: isCompressed ? null : saveData,
        compressed_data: isCompressed ? compressed : null,
        is_compressed: isCompressed,
        game_version: saveGame.version ? `${saveGame.version.major}.${saveGame.version.minor}.${saveGame.version.patch}` : '1.0.0',
        save_version: 1,
        save_size: size,
        checksum: checksum
      };

      // Upload to Supabase
      const { data, error } = await supabase
        .from('save_games')
        .upsert(saveRecord, {
          onConflict: 'user_id,save_slot'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        cloudSaveId: data.id,
        uploadTime: new Date(),
        size: size,
        compressed: isCompressed
      };

    } catch (error) {
      console.error('Cloud save upload failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Download save game from cloud
   */
  async downloadSave(slotId) {
    if (!this.isOnline) {
      throw new Error('Cannot download saves while offline');
    }

    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('save_games')
        .select('*')
        .eq('user_id', user.id)
        .eq('save_slot', slotId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Save not found'
          };
        }
        throw error;
      }

      // Decompress and parse save data
      let saveGame;
      if (data.is_compressed) {
        const decompressed = LZString.decompressFromUTF16(data.compressed_data);
        saveGame = JSON.parse(decompressed, this.dateReviver);
      } else {
        saveGame = this.parseSaveData(data.save_data);
      }

      // Validate checksum
      const calculatedChecksum = this.calculateChecksum(JSON.stringify(saveGame));
      if (data.checksum && calculatedChecksum !== data.checksum) {
        console.warn('Cloud save checksum mismatch - data may be corrupted');
      }

      // Update last accessed timestamp
      await supabase
        .from('save_games')
        .update({ last_accessed: new Date() })
        .eq('id', data.id);

      return {
        success: true,
        saveGame: saveGame,
        cloudSaveId: data.id,
        downloadTime: new Date(),
        lastModified: new Date(data.updated_at)
      };

    } catch (error) {
      console.error('Cloud save download failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List all cloud saves for current user
   */
  async listSaves() {
    if (!this.isOnline) {
      throw new Error('Cannot list saves while offline');
    }

    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('save_games')
        .select('id, save_name, save_slot, save_size, game_version, created_at, updated_at, last_accessed')
        .eq('user_id', user.id)
        .order('save_slot');

      if (error) throw error;

      return {
        success: true,
        saves: data
      };

    } catch (error) {
      console.error('Failed to list cloud saves:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete cloud save
   */
  async deleteSave(slotId) {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('save_games')
        .delete()
        .eq('user_id', user.id)
        .eq('save_slot', slotId);

      if (error) throw error;

      return {
        success: true
      };

    } catch (error) {
      console.error('Failed to delete cloud save:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Synchronize local saves with cloud
   */
  async syncSaves() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const localSlots = SaveManager.getSaveSlots();
      const cloudResult = await this.listSaves();
      
      if (!cloudResult.success) {
        throw new Error(cloudResult.error);
      }

      const cloudSaves = cloudResult.saves;
      const conflicts = [];
      const syncActions = [];

      // Compare local and cloud saves
      for (const localSlot of localSlots) {
        if (localSlot.is_empty) continue;

        const cloudSave = cloudSaves.find(cs => cs.save_slot === localSlot.slot_id);
        
        if (!cloudSave) {
          // Local save doesn't exist in cloud - upload
          syncActions.push({
            action: 'upload',
            slotId: localSlot.slot_id,
            saveGame: localSlot.save_game
          });
        } else {
          // Compare timestamps
          const localTime = new Date(localSlot.save_game.last_saved);
          const cloudTime = new Date(cloudSave.updated_at);
          
          if (localTime > cloudTime) {
            // Local is newer - upload
            syncActions.push({
              action: 'upload',
              slotId: localSlot.slot_id,
              saveGame: localSlot.save_game
            });
          } else if (cloudTime > localTime) {
            // Cloud is newer - download
            syncActions.push({
              action: 'download',
              slotId: localSlot.slot_id
            });
          }
          // If timestamps are equal, no action needed
        }
      }

      // Check for cloud saves not present locally
      for (const cloudSave of cloudSaves) {
        const localSlot = localSlots.find(ls => ls.slot_id === cloudSave.save_slot);
        
        if (!localSlot || localSlot.is_empty) {
          // Cloud save doesn't exist locally - download
          syncActions.push({
            action: 'download',
            slotId: cloudSave.save_slot
          });
        }
      }

      // Execute sync actions
      const results = [];
      for (const action of syncActions) {
        try {
          let result;
          
          if (action.action === 'upload') {
            result = await this.uploadSave(action.saveGame, action.slotId);
          } else if (action.action === 'download') {
            const downloadResult = await this.downloadSave(action.slotId);
            if (downloadResult.success) {
              // Save to local storage
              await SaveManager.saveGame(downloadResult.saveGame, action.slotId);
            }
            result = downloadResult;
          }
          
          results.push({
            ...action,
            result: result
          });
          
        } catch (error) {
          results.push({
            ...action,
            result: {
              success: false,
              error: error.message
            }
          });
        }
      }

      return {
        success: true,
        syncActions: results,
        conflicts: conflicts
      };

    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Queue sync operation for when online
   */
  queueSync(action, data) {
    this.syncQueue.push({
      action,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Process queued sync operations
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const queue = [...this.syncQueue];
    this.syncQueue = [];

    for (const item of queue) {
      try {
        if (item.action === 'upload') {
          await this.uploadSave(item.data.saveGame, item.data.slotId, item.data.options);
        }
      } catch (error) {
        console.error('Failed to process queued sync:', error);
        // Re-queue failed operations
        this.syncQueue.push(item);
      }
    }
  }

  /**
   * Prepare save data for cloud storage
   */
  prepareSaveData(saveGame) {
    // Create a copy to avoid modifying original
    return JSON.parse(JSON.stringify(saveGame, (key, value) => {
      // Handle Date objects
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    }));
  }

  /**
   * Parse save data from cloud storage
   */
  parseSaveData(data) {
    return JSON.parse(JSON.stringify(data), this.dateReviver);
  }

  /**
   * Date reviver for JSON parsing
   */
  dateReviver(key, value) {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }

  /**
   * Compress save data for storage
   */
  compressSaveData(saveData) {
    const jsonString = JSON.stringify(saveData);
    const size = new Blob([jsonString]).size;
    
    // Compress if larger than 100KB
    if (size > 100 * 1024) {
      const compressed = LZString.compressToUTF16(jsonString);
      return {
        compressed,
        isCompressed: true,
        size: new Blob([compressed]).size,
        originalSize: size
      };
    }
    
    return {
      compressed: saveData,
      isCompressed: false,
      size: size
    };
  }

  /**
   * Calculate checksum for data integrity
   */
  calculateChecksum(data) {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      queuedOperations: this.syncQueue.length,
      lastSync: this.lastSyncTime
    };
  }
}

// Export singleton instance
export default CloudSaveService.getInstance(); 
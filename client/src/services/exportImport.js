import * as LZString from 'lz-string';
import SaveManager from '../utils/saveManager';
import { SaveDataValidator } from '../utils/saveValidation';

/**
 * ExportImportService - Handles exporting and importing save game data
 * Provides file export/import with validation and security checks
 */
export class ExportImportService {
  static instance = null;
  
  constructor() {
    this.supportedFormats = ['json', 'compressed'];
    this.maxFileSize = 50 * 1024 * 1024; // 50MB limit
    this.currentVersion = { major: 1, minor: 0, patch: 0 };
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!ExportImportService.instance) {
      ExportImportService.instance = new ExportImportService();
    }
    return ExportImportService.instance;
  }

  /**
   * Export a single save game to file
   */
  async exportSave(saveGame, options = {}) {
    const {
      format = 'json',
      compress = true,
      includeMetadata = true,
      encrypt = false,
      filename = null
    } = options;

    try {
      // Validate save game
      const validation = SaveDataValidator.validateSaveGame(saveGame);
      if (!validation.is_valid) {
        throw new Error(`Save validation failed: ${validation.errors.join(', ')}`);
      }

      // Prepare export data
      const exportData = this.prepareExportData([saveGame], {
        includeMetadata,
        compress,
        encrypt
      });

      // Generate filename
      const finalFilename = filename || this.generateFilename(saveGame, format);

      // Create and download file
      await this.downloadFile(exportData, finalFilename, format);

      return {
        success: true,
        filename: finalFilename,
        size: new Blob([JSON.stringify(exportData)]).size,
        format: format,
        compressed: compress
      };

    } catch (error) {
      console.error('Export failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export multiple saves to a single file
   */
  async exportMultipleSaves(saveGames, options = {}) {
    const {
      format = 'json',
      compress = true,
      includeMetadata = true,
      encrypt = false,
      filename = null
    } = options;

    try {
      // Validate all save games
      for (const saveGame of saveGames) {
        const validation = SaveDataValidator.validateSaveGame(saveGame);
        if (!validation.is_valid) {
          throw new Error(`Save validation failed for "${saveGame.save_name}": ${validation.errors.join(', ')}`);
        }
      }

      // Prepare export data
      const exportData = this.prepareExportData(saveGames, {
        includeMetadata,
        compress,
        encrypt
      });

      // Generate filename
      const finalFilename = filename || `antopolis_saves_${new Date().toISOString().slice(0, 10)}.json`;

      // Create and download file
      await this.downloadFile(exportData, finalFilename, format);

      return {
        success: true,
        filename: finalFilename,
        size: new Blob([JSON.stringify(exportData)]).size,
        format: format,
        compressed: compress,
        saveCount: saveGames.length
      };

    } catch (error) {
      console.error('Multiple export failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export all local saves
   */
  async exportAllSaves(options = {}) {
    try {
      const saveSlots = SaveManager.getSaveSlots();
      const saveGames = saveSlots
        .filter(slot => !slot.is_empty)
        .map(slot => slot.save_game);

      if (saveGames.length === 0) {
        throw new Error('No saves found to export');
      }

      return await this.exportMultipleSaves(saveGames, options);

    } catch (error) {
      console.error('Export all saves failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import save data from file
   */
  async importSaves(file, options = {}) {
    const {
      validateOnly = false,
      overwriteExisting = false,
      autoRepair = true
    } = options;

    try {
      // Validate file
      const fileValidation = this.validateImportFile(file);
      if (!fileValidation.valid) {
        throw new Error(fileValidation.error);
      }

      // Read file content
      const fileContent = await this.readFileContent(file);
      
      // Parse and validate export data
      const parseResult = await this.parseImportData(fileContent, autoRepair);
      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      const { exportData, saves, warnings } = parseResult;

      // If validation only, return results without importing
      if (validateOnly) {
        return {
          success: true,
          validationOnly: true,
          saveCount: saves.length,
          saves: saves.map(save => ({
            save_name: save.save_name,
            save_id: save.save_id,
            version: save.version,
            created_at: save.created_at,
            colony_name: save.colony?.name
          })),
          warnings: warnings,
          metadata: exportData.metadata
        };
      }

      // Import saves
      const importResults = [];
      for (const saveGame of saves) {
        try {
          // Find available slot or use specified slot
          let targetSlot = this.findAvailableSlot(saveGame);
          
          if (!targetSlot && !overwriteExisting) {
            importResults.push({
              saveGame: saveGame,
              success: false,
              error: 'No available slot found'
            });
            continue;
          }

          // Save to local storage
          const saveResult = await SaveManager.saveGame(
            saveGame, 
            targetSlot, 
            saveGame.save_name
          );

          importResults.push({
            saveGame: saveGame,
            slotId: targetSlot,
            success: saveResult.success,
            error: saveResult.error
          });

        } catch (error) {
          importResults.push({
            saveGame: saveGame,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = importResults.filter(r => r.success).length;
      const failureCount = importResults.length - successCount;

      return {
        success: successCount > 0,
        importedCount: successCount,
        failedCount: failureCount,
        totalCount: saves.length,
        results: importResults,
        warnings: warnings,
        metadata: exportData.metadata
      };

    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Prepare export data structure
   */
  prepareExportData(saveGames, options = {}) {
    const { includeMetadata, compress, encrypt } = options;

    const exportData = {
      format_version: '1.0.0',
      export_date: new Date().toISOString(),
      exported_by: 'Antopolis Save System',
      save_games: saveGames.map(save => this.prepareSaveForExport(save)),
      metadata: includeMetadata ? {
        total_saves: saveGames.length,
        total_size: 0, // Will be calculated
        compression_used: compress,
        encryption_used: encrypt,
        game_version: this.currentVersion,
        export_source: 'local_storage'
      } : undefined
    };

    // Calculate total size
    if (includeMetadata) {
      const jsonSize = new Blob([JSON.stringify(exportData.save_games)]).size;
      exportData.metadata.total_size = jsonSize;
    }

    return exportData;
  }

  /**
   * Prepare individual save for export
   */
  prepareSaveForExport(saveGame) {
    // Create a clean copy for export
    return JSON.parse(JSON.stringify(saveGame, (key, value) => {
      // Handle Date objects
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    }));
  }

  /**
   * Parse imported data
   */
  async parseImportData(content, autoRepair = true) {
    try {
      let exportData;
      
      // Try to parse as JSON
      try {
        exportData = JSON.parse(content);
      } catch (parseError) {
        // Try to decompress if parsing fails
        try {
          const decompressed = LZString.decompressFromUTF16(content);
          if (decompressed) {
            exportData = JSON.parse(decompressed);
          } else {
            throw new Error('Failed to decompress data');
          }
        } catch (decompressError) {
          throw new Error('Invalid file format - not valid JSON or compressed data');
        }
      }

      // Validate export data structure
      if (!exportData.save_games || !Array.isArray(exportData.save_games)) {
        throw new Error('Invalid export format - missing save_games array');
      }

      // Parse and validate individual saves
      const saves = [];
      const warnings = [];

      for (let i = 0; i < exportData.save_games.length; i++) {
        const saveData = exportData.save_games[i];
        
        try {
          // Restore Date objects
          const parsedSave = JSON.parse(JSON.stringify(saveData), (key, value) => {
            if (value && typeof value === 'object' && value.__type === 'Date') {
              return new Date(value.value);
            }
            return value;
          });

          // Validate save
          const validation = SaveDataValidator.validateSaveGame(parsedSave);
          
          if (!validation.is_valid) {
            if (autoRepair && validation.recovery_possible) {
              // Attempt to repair
              const repairResult = SaveDataValidator.repairSaveData(parsedSave);
              if (repairResult.wasRepaired) {
                saves.push(repairResult.repaired);
                warnings.push({
                  saveIndex: i,
                  saveName: parsedSave.save_name || `Save ${i + 1}`,
                  type: 'repaired',
                  message: `Save was repaired: ${repairResult.repairLog.join(', ')}`
                });
              } else {
                warnings.push({
                  saveIndex: i,
                  saveName: parsedSave.save_name || `Save ${i + 1}`,
                  type: 'skipped',
                  message: `Save validation failed: ${validation.errors.join(', ')}`
                });
              }
            } else {
              warnings.push({
                saveIndex: i,
                saveName: parsedSave.save_name || `Save ${i + 1}`,
                type: 'invalid',
                message: `Save validation failed: ${validation.errors.join(', ')}`
              });
            }
          } else {
            saves.push(parsedSave);
          }

        } catch (error) {
          warnings.push({
            saveIndex: i,
            saveName: `Save ${i + 1}`,
            type: 'error',
            message: `Failed to parse save: ${error.message}`
          });
        }
      }

      if (saves.length === 0) {
        throw new Error('No valid saves found in import file');
      }

      return {
        success: true,
        exportData,
        saves,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate import file
   */
  validateImportFile(file) {
    // Check file size
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}`
      };
    }

    // Check file type
    const allowedTypes = ['application/json', 'text/plain'];
    const allowedExtensions = ['.json', '.txt'];
    
    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      return {
        valid: false,
        error: 'Invalid file type. Please select a JSON file.'
      };
    }

    return { valid: true };
  }

  /**
   * Read file content
   */
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Find available slot for imported save
   */
  findAvailableSlot(saveGame) {
    const saveSlots = SaveManager.getSaveSlots();
    
    // Try to find empty slot, excluding auto-save slots
    const availableSlot = saveSlots.find(slot => 
      slot.is_empty && !slot.is_auto_save && !slot.is_quick_save
    );
    
    return availableSlot ? availableSlot.slot_id : null;
  }

  /**
   * Generate filename for export
   */
  generateFilename(saveGame, format) {
    const safeName = saveGame.save_name
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    
    return `${safeName}_${timestamp}.${format === 'compressed' ? 'ant' : 'json'}`;
  }

  /**
   * Download file
   */
  downloadFile(data, filename, format) {
    return new Promise((resolve, reject) => {
      try {
        let content;
        let mimeType;

        if (format === 'compressed') {
          content = LZString.compressToUTF16(JSON.stringify(data));
          mimeType = 'application/octet-stream';
        } else {
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get supported formats
   */
  getSupportedFormats() {
    return [...this.supportedFormats];
  }

  /**
   * Check version compatibility
   */
  isVersionCompatible(saveVersion) {
    if (!saveVersion) return true; // Assume compatible if no version info
    
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
   * Create backup before import
   */
  async createBackupBeforeImport() {
    try {
      const result = await this.exportAllSaves({
        filename: `backup_before_import_${Date.now()}.json`,
        includeMetadata: true,
        compress: false
      });
      
      return result.success;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }
}

// Export singleton instance
export default ExportImportService.getInstance(); 
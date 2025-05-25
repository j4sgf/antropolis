import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportImportService from '../../../services/exportImport';
import SaveManager from '../../../utils/saveManager';
import ExportPanel from './ExportPanel';
import ImportPanel from './ImportPanel';
import './ExportImportModal.css';

const ExportImportModal = ({ 
  isOpen, 
  onClose, 
  currentGameData,
  onImportSuccess 
}) => {
  const [activeTab, setActiveTab] = useState('export');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveSlots, setSaveSlots] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadSaveSlots();
      setError(null);
    }
  }, [isOpen]);

  /**
   * Load save slots for export selection
   */
  const loadSaveSlots = () => {
    try {
      const slots = SaveManager.getSaveSlots();
      setSaveSlots(slots);
    } catch (err) {
      setError('Failed to load save slots');
    }
  };

  /**
   * Handle export operation
   */
  const handleExport = async (exportOptions) => {
    setLoading(true);
    setError(null);

    try {
      let result;

      if (exportOptions.exportType === 'current' && currentGameData) {
        result = await ExportImportService.exportSave(currentGameData, exportOptions);
      } else if (exportOptions.exportType === 'selected') {
        const selectedSaves = saveSlots
          .filter(slot => exportOptions.selectedSlots.includes(slot.slot_id) && !slot.is_empty)
          .map(slot => slot.save_game);
        
        if (selectedSaves.length === 0) {
          throw new Error('No valid saves selected for export');
        }

        if (selectedSaves.length === 1) {
          result = await ExportImportService.exportSave(selectedSaves[0], exportOptions);
        } else {
          result = await ExportImportService.exportMultipleSaves(selectedSaves, exportOptions);
        }
      } else if (exportOptions.exportType === 'all') {
        result = await ExportImportService.exportAllSaves(exportOptions);
      }

      if (result && !result.success) {
        throw new Error(result.error);
      }

      // Success feedback could be added here
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle import operation
   */
  const handleImport = async (file, importOptions) => {
    setLoading(true);
    setError(null);

    try {
      // Create backup if requested
      if (importOptions.createBackup) {
        const backupSuccess = await ExportImportService.createBackupBeforeImport();
        if (!backupSuccess) {
          console.warn('Failed to create backup before import');
        }
      }

      const result = await ExportImportService.importSaves(file, importOptions);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh save slots after import
      loadSaveSlots();

      // Notify parent component
      if (onImportSuccess) {
        onImportSuccess(result);
      }

      // Switch to export tab to show imported saves
      setActiveTab('export');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="export-import-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="export-import-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">
              <span className="title-icon">📁</span>
              Export / Import Saves
            </h2>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              <span className="tab-icon">📤</span>
              Export
            </button>
            <button 
              className={`tab-button ${activeTab === 'import' ? 'active' : ''}`}
              onClick={() => setActiveTab('import')}
            >
              <span className="tab-icon">📥</span>
              Import
            </button>
          </div>

          {/* Content */}
          <div className="modal-content">
            <AnimatePresence mode="wait">
              {activeTab === 'export' ? (
                <motion.div
                  key="export"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ExportPanel
                    saveSlots={saveSlots}
                    currentGameData={currentGameData}
                    onExport={handleExport}
                    loading={loading}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="import"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ImportPanel
                    onImport={handleImport}
                    loading={loading}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div
                className="error-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="error-icon">❌</span>
                <span>{error}</span>
                <button 
                  className="error-dismiss"
                  onClick={() => setError(null)}
                >
                  ✕
                </button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <div className="footer-info">
              <span className="info-text">
                Export saves as JSON files to backup or share your colonies
              </span>
            </div>
            <button 
              className="close-footer-button"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExportImportModal; 
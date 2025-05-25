import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SaveSlot from './SaveSlot';
import ConfirmationDialog from './ConfirmationDialog';
import SaveManager from '../../utils/saveManager';
import { SaveSlot as SaveSlotType, SaveGame } from '../../types/saveGame';
import './SaveGameModal.css';

const SaveGameModal = ({ 
  isOpen, 
  onClose, 
  mode = 'save', // 'save' or 'load'
  currentGameData = null,
  onSave = null,
  onLoad = null 
}) => {
  const [saveSlots, setSaveSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveName, setSaveName] = useState('');
  const [storageStats, setStorageStats] = useState({ used: 0, limit: 0, percentage: 0, saves: 0 });
  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'auto', 'quick'

  // Load save slots when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSaveSlots();
      updateStorageStats();
      setError(null);
      setSelectedSlot(null);
      setSaveName('');
    }
  }, [isOpen]);

  /**
   * Load all save slots from SaveManager
   */
  const loadSaveSlots = () => {
    try {
      const slots = SaveManager.getSaveSlots();
      setSaveSlots(slots);
    } catch (err) {
      setError('Failed to load save slots');
      console.error('Error loading save slots:', err);
    }
  };

  /**
   * Update storage usage statistics
   */
  const updateStorageStats = () => {
    const stats = SaveManager.getStorageStats();
    setStorageStats(stats);
  };

  /**
   * Get filtered slots based on active tab
   */
  const getFilteredSlots = () => {
    switch (activeTab) {
      case 'auto':
        return saveSlots.filter(slot => slot.is_auto_save);
      case 'quick':
        return saveSlots.filter(slot => slot.is_quick_save);
      case 'manual':
      default:
        return saveSlots.filter(slot => !slot.is_auto_save && !slot.is_quick_save);
    }
  };

  /**
   * Handle slot selection
   */
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    
    if (mode === 'save' && slot.save_game) {
      setSaveName(slot.save_game.save_name || '');
    }
  };

  /**
   * Handle save operation
   */
  const handleSave = async () => {
    if (!currentGameData || !selectedSlot) return;

    const finalSaveName = saveName.trim() || `Save ${selectedSlot.slot_id} - ${new Date().toLocaleDateString()}`;

    // Show confirmation if overwriting existing save
    if (!selectedSlot.is_empty) {
      setConfirmationData({
        type: 'overwrite',
        title: 'Overwrite Save?',
        message: `Are you sure you want to overwrite "${selectedSlot.save_game.save_name}"?`,
        confirmText: 'Overwrite',
        cancelText: 'Cancel',
        onConfirm: () => performSave(finalSaveName)
      });
      setShowConfirmation(true);
      return;
    }

    await performSave(finalSaveName);
  };

  /**
   * Perform the actual save operation
   */
  const performSave = async (finalSaveName) => {
    setLoading(true);
    setError(null);

    try {
      const saveData = {
        ...currentGameData,
        save_name: finalSaveName
      };

      const result = await SaveManager.saveGame(saveData, selectedSlot.slot_id, finalSaveName);

      if (result.success) {
        // Refresh slots and stats
        loadSaveSlots();
        updateStorageStats();
        
        // Notify parent
        if (onSave) {
          onSave(result);
        }

        // Show success message briefly then close
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setError(result.error || 'Save failed');
      }
    } catch (err) {
      setError(`Save failed: ${err.message}`);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  /**
   * Handle load operation
   */
  const handleLoad = async () => {
    if (!selectedSlot || selectedSlot.is_empty) return;

    setLoading(true);
    setError(null);

    try {
      const result = await SaveManager.loadGame(selectedSlot.slot_id);

      if (result.success) {
        // Notify parent
        if (onLoad) {
          onLoad(result);
        }
        onClose();
      } else {
        setError(result.error || 'Load failed');
      }
    } catch (err) {
      setError(`Load failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle delete operation
   */
  const handleDelete = (slot) => {
    setConfirmationData({
      type: 'delete',
      title: 'Delete Save?',
      message: `Are you sure you want to delete "${slot.save_game.save_name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: () => performDelete(slot)
    });
    setShowConfirmation(true);
  };

  /**
   * Perform the actual delete operation
   */
  const performDelete = (slot) => {
    const success = SaveManager.deleteSave(slot.slot_id);
    
    if (success) {
      loadSaveSlots();
      updateStorageStats();
      if (selectedSlot && selectedSlot.slot_id === slot.slot_id) {
        setSelectedSlot(null);
      }
    } else {
      setError('Failed to delete save');
    }
    setShowConfirmation(false);
  };

  /**
   * Handle quick save (slot 10)
   */
  const handleQuickSave = async () => {
    if (!currentGameData) return;

    const quickSaveSlot = saveSlots.find(slot => slot.is_quick_save);
    if (!quickSaveSlot) return;

    setLoading(true);
    try {
      const result = await SaveManager.saveGame(
        currentGameData, 
        quickSaveSlot.slot_id, 
        `Quick Save - ${new Date().toLocaleString()}`
      );

      if (result.success) {
        loadSaveSlots();
        updateStorageStats();
        
        if (onSave) {
          onSave(result);
        }
      } else {
        setError(result.error || 'Quick save failed');
      }
    } catch (err) {
      setError(`Quick save failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Get tab counts
   */
  const getTabCounts = () => {
    return {
      manual: saveSlots.filter(slot => !slot.is_auto_save && !slot.is_quick_save && !slot.is_empty).length,
      auto: saveSlots.filter(slot => slot.is_auto_save && !slot.is_empty).length,
      quick: saveSlots.filter(slot => slot.is_quick_save && !slot.is_empty).length
    };
  };

  const tabCounts = getTabCounts();
  const filteredSlots = getFilteredSlots();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="save-game-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="save-game-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="header-content">
              <h2 className="modal-title">
                {mode === 'save' ? '💾 Save Game' : '📁 Load Game'}
              </h2>
              <div className="storage-stats">
                <div className="storage-bar">
                  <div 
                    className="storage-fill" 
                    style={{ width: `${Math.min(storageStats.percentage, 100)}%` }}
                  />
                </div>
                <span className="storage-text">
                  {formatFileSize(storageStats.used)} / {formatFileSize(storageStats.limit)} 
                  ({storageStats.saves} saves)
                </span>
              </div>
            </div>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="save-tabs">
            <button 
              className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <span className="tab-icon">💾</span>
              <span className="tab-label">Manual Saves</span>
              <span className="tab-count">({tabCounts.manual})</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'auto' ? 'active' : ''}`}
              onClick={() => setActiveTab('auto')}
            >
              <span className="tab-icon">🔄</span>
              <span className="tab-label">Auto Saves</span>
              <span className="tab-count">({tabCounts.auto})</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'quick' ? 'active' : ''}`}
              onClick={() => setActiveTab('quick')}
            >
              <span className="tab-icon">⚡</span>
              <span className="tab-label">Quick Save</span>
              <span className="tab-count">({tabCounts.quick})</span>
            </button>
          </div>

          {/* Save Name Input (for save mode) */}
          {mode === 'save' && selectedSlot && (
            <div className="save-name-section">
              <label htmlFor="save-name" className="save-name-label">
                Save Name:
              </label>
              <input
                id="save-name"
                type="text"
                className="save-name-input"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={`Save ${selectedSlot.slot_id} - ${new Date().toLocaleDateString()}`}
                maxLength={50}
              />
            </div>
          )}

          {/* Save Slots Grid */}
          <div className="save-slots-container">
            <div className="save-slots-grid">
              {filteredSlots.map((slot) => (
                <SaveSlot
                  key={slot.slot_id}
                  slot={slot}
                  isSelected={selectedSlot?.slot_id === slot.slot_id}
                  mode={mode}
                  onClick={() => handleSlotSelect(slot)}
                  onDelete={() => handleDelete(slot)}
                />
              ))}
            </div>

            {filteredSlots.length === 0 && (
              <div className="no-saves-message">
                <div className="no-saves-icon">
                  {activeTab === 'auto' ? '🔄' : activeTab === 'quick' ? '⚡' : '💾'}
                </div>
                <p>No {activeTab} saves found</p>
                {mode === 'save' && activeTab === 'manual' && (
                  <p className="no-saves-hint">Select an empty slot to create a new save</p>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="modal-footer">
            <div className="footer-left">
              {mode === 'save' && (
                <button 
                  className="quick-save-button"
                  onClick={handleQuickSave}
                  disabled={loading || !currentGameData}
                >
                  <span className="button-icon">⚡</span>
                  Quick Save
                </button>
              )}
            </div>

            <div className="footer-right">
              <button 
                className="cancel-button"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              
              <button 
                className={`action-button ${mode === 'save' ? 'save' : 'load'}`}
                onClick={mode === 'save' ? handleSave : handleLoad}
                disabled={
                  loading || 
                  !selectedSlot || 
                  (mode === 'load' && selectedSlot?.is_empty) ||
                  (mode === 'save' && !currentGameData)
                }
              >
                {loading ? (
                  <>
                    <span className="loading-spinner">🔄</span>
                    {mode === 'save' ? 'Saving...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    <span className="button-icon">
                      {mode === 'save' ? '💾' : '📁'}
                    </span>
                    {mode === 'save' ? 'Save Game' : 'Load Game'}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title={confirmationData?.title}
        message={confirmationData?.message}
        confirmText={confirmationData?.confirmText}
        cancelText={confirmationData?.cancelText}
        isDestructive={confirmationData?.isDestructive}
        onConfirm={confirmationData?.onConfirm}
      />
    </AnimatePresence>
  );
};

export default SaveGameModal; 
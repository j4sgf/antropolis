import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ExportPanel = ({ 
  saveSlots, 
  currentGameData, 
  onExport, 
  loading 
}) => {
  const [exportType, setExportType] = useState('current');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [exportOptions, setExportOptions] = useState({
    format: 'json',
    compress: true,
    includeMetadata: true,
    filename: ''
  });

  /**
   * Handle export type change
   */
  const handleExportTypeChange = (type) => {
    setExportType(type);
    if (type !== 'selected') {
      setSelectedSlots([]);
    }
  };

  /**
   * Handle slot selection
   */
  const handleSlotToggle = (slotId) => {
    setSelectedSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  /**
   * Handle export
   */
  const handleExport = () => {
    const options = {
      ...exportOptions,
      exportType,
      selectedSlots
    };
    onExport(options);
  };

  /**
   * Get export button text
   */
  const getExportButtonText = () => {
    if (loading) return 'Exporting...';
    
    switch (exportType) {
      case 'current':
        return 'Export Current Game';
      case 'selected':
        return `Export Selected (${selectedSlots.length})`;
      case 'all':
        return 'Export All Saves';
      default:
        return 'Export';
    }
  };

  /**
   * Check if export is possible
   */
  const canExport = () => {
    if (loading) return false;
    
    switch (exportType) {
      case 'current':
        return !!currentGameData;
      case 'selected':
        return selectedSlots.length > 0;
      case 'all':
        return saveSlots.some(slot => !slot.is_empty);
      default:
        return false;
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const occupiedSlots = saveSlots.filter(slot => !slot.is_empty);

  return (
    <div className="export-panel">
      {/* Export Type Selection */}
      <div className="export-type-section">
        <h3 className="section-title">What to Export</h3>
        
        <div className="export-options">
          {/* Current Game */}
          <motion.div
            className={`export-option ${exportType === 'current' ? 'selected' : ''}`}
            onClick={() => handleExportTypeChange('current')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="option-header">
              <div className="option-radio">
                <input
                  type="radio"
                  checked={exportType === 'current'}
                  onChange={() => handleExportTypeChange('current')}
                />
                <span className="option-icon">🎮</span>
                <span className="option-title">Current Game</span>
              </div>
              {!currentGameData && (
                <span className="unavailable-badge">Not Available</span>
              )}
            </div>
            <p className="option-description">
              Export your current game session
            </p>
          </motion.div>

          {/* Selected Saves */}
          <motion.div
            className={`export-option ${exportType === 'selected' ? 'selected' : ''}`}
            onClick={() => handleExportTypeChange('selected')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="option-header">
              <div className="option-radio">
                <input
                  type="radio"
                  checked={exportType === 'selected'}
                  onChange={() => handleExportTypeChange('selected')}
                />
                <span className="option-icon">☑️</span>
                <span className="option-title">Selected Saves</span>
              </div>
              <span className="count-badge">{selectedSlots.length} selected</span>
            </div>
            <p className="option-description">
              Choose specific saves to export
            </p>
          </motion.div>

          {/* All Saves */}
          <motion.div
            className={`export-option ${exportType === 'all' ? 'selected' : ''}`}
            onClick={() => handleExportTypeChange('all')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="option-header">
              <div className="option-radio">
                <input
                  type="radio"
                  checked={exportType === 'all'}
                  onChange={() => handleExportTypeChange('all')}
                />
                <span className="option-icon">📦</span>
                <span className="option-title">All Saves</span>
              </div>
              <span className="count-badge">{occupiedSlots.length} saves</span>
            </div>
            <p className="option-description">
              Export all your saved games in one file
            </p>
          </motion.div>
        </div>
      </div>

      {/* Save Selection (for selected type) */}
      {exportType === 'selected' && (
        <motion.div
          className="save-selection-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3 className="section-title">Select Saves</h3>
          
          <div className="save-list">
            {occupiedSlots.length === 0 ? (
              <div className="no-saves-message">
                <p>No saves available for export</p>
              </div>
            ) : (
              occupiedSlots.map(slot => (
                <motion.div
                  key={slot.slot_id}
                  className={`save-item ${selectedSlots.includes(slot.slot_id) ? 'selected' : ''}`}
                  onClick={() => handleSlotToggle(slot.slot_id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="save-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSlots.includes(slot.slot_id)}
                      onChange={() => handleSlotToggle(slot.slot_id)}
                    />
                  </div>
                  
                  <div className="save-info">
                    <div className="save-header">
                      <h4 className="save-name">{slot.save_game.save_name}</h4>
                      <span className="slot-badge">Slot {slot.slot_id}</span>
                    </div>
                    
                    <div className="save-metadata">
                      <span className="colony-name">
                        🏛️ {slot.save_game.colony.name}
                      </span>
                      <span className="save-date">
                        📅 {formatDate(slot.save_game.last_saved)}
                      </span>
                      <span className="save-size">
                        💾 {formatFileSize(slot.save_game.save_size)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {occupiedSlots.length > 0 && (
            <div className="selection-actions">
              <button
                className="select-all-button"
                onClick={() => setSelectedSlots(occupiedSlots.map(slot => slot.slot_id))}
              >
                Select All
              </button>
              <button
                className="select-none-button"
                onClick={() => setSelectedSlots([])}
              >
                Select None
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Export Options */}
      <div className="export-settings-section">
        <h3 className="section-title">Export Settings</h3>
        
        <div className="settings-grid">
          {/* Format */}
          <div className="setting-group">
            <label className="setting-label">Format</label>
            <select
              className="setting-select"
              value={exportOptions.format}
              onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
            >
              <option value="json">JSON (Readable)</option>
              <option value="compressed">Compressed</option>
            </select>
          </div>

          {/* Filename */}
          <div className="setting-group">
            <label className="setting-label">Custom Filename (Optional)</label>
            <input
              type="text"
              className="setting-input"
              placeholder="Leave empty for auto-generated name"
              value={exportOptions.filename}
              onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
            />
          </div>
        </div>

        <div className="settings-checkboxes">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportOptions.compress}
              onChange={(e) => setExportOptions(prev => ({ ...prev, compress: e.target.checked }))}
            />
            <span>Compress large saves</span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={exportOptions.includeMetadata}
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
            />
            <span>Include export metadata</span>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <div className="export-action-section">
        <motion.button
          className="export-button"
          onClick={handleExport}
          disabled={!canExport()}
          whileHover={canExport() ? { scale: 1.05 } : {}}
          whileTap={canExport() ? { scale: 0.95 } : {}}
        >
          {loading && <span className="loading-spinner">🔄</span>}
          <span className="button-icon">📤</span>
          {getExportButtonText()}
        </motion.button>

        {!canExport() && !loading && (
          <p className="export-hint">
            {exportType === 'current' && !currentGameData && 'No current game to export'}
            {exportType === 'selected' && selectedSlots.length === 0 && 'Select saves to export'}
            {exportType === 'all' && occupiedSlots.length === 0 && 'No saves available to export'}
          </p>
        )}
      </div>
    </div>
  );
};

export default ExportPanel; 
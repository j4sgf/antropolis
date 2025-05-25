import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImportPanel = ({ onImport, loading }) => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [importOptions, setImportOptions] = useState({
    validateOnly: false,
    overwriteExisting: false,
    autoRepair: true,
    createBackup: true
  });
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Handle file selection
   */
  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    setPreviewData(null);
    
    if (selectedFile) {
      validateFile(selectedFile);
    }
  };

  /**
   * Validate and preview file
   */
  const validateFile = async (selectedFile) => {
    setPreviewLoading(true);
    
    try {
      // Import with validation only to get preview
      await onImport(selectedFile, { 
        ...importOptions, 
        validateOnly: true 
      });
      
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  /**
   * Handle file drop
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  /**
   * Handle drag events
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  /**
   * Handle import
   */
  const handleImport = () => {
    if (file) {
      onImport(file, importOptions);
    }
  };

  /**
   * Clear file selection
   */
  const clearFile = () => {
    setFile(null);
    setPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="import-panel">
      {/* File Selection */}
      <div className="file-selection-section">
        <h3 className="section-title">Select Save File</h3>
        
        <motion.div
          className={`file-drop-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: file ? 1 : 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            onChange={handleFileInputChange}
            className="file-input-hidden"
          />
          
          {!file ? (
            <div className="file-drop-content">
              <div className="file-drop-icon">📁</div>
              <h4 className="file-drop-title">
                Drop save file here or click to browse
              </h4>
              <p className="file-drop-description">
                Supports JSON files exported from Antopolis
              </p>
              <button className="browse-button">
                Browse Files
              </button>
            </div>
          ) : (
            <div className="file-selected-content">
              <div className="file-info">
                <div className="file-icon">📄</div>
                <div className="file-details">
                  <h4 className="file-name">{file.name}</h4>
                  <p className="file-meta">
                    {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                  </p>
                </div>
                <button 
                  className="remove-file-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* File Preview */}
      {file && (
        <motion.div
          className="file-preview-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3 className="section-title">File Preview</h3>
          
          {previewLoading ? (
            <div className="preview-loading">
              <span className="loading-spinner">🔄</span>
              <span>Analyzing file...</span>
            </div>
          ) : previewData ? (
            <div className="preview-content">
              <div className="preview-summary">
                <div className="summary-item">
                  <span className="summary-label">Found Saves:</span>
                  <span className="summary-value">{previewData.saveCount}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Export Date:</span>
                  <span className="summary-value">
                    {formatDate(previewData.metadata?.export_date)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Game Version:</span>
                  <span className="summary-value">
                    v{previewData.metadata?.game_version?.major || 1}.
                    {previewData.metadata?.game_version?.minor || 0}.
                    {previewData.metadata?.game_version?.patch || 0}
                  </span>
                </div>
              </div>

              {previewData.saves && previewData.saves.length > 0 && (
                <div className="saves-preview">
                  <h4 className="saves-preview-title">Saves in File:</h4>
                  <div className="saves-list">
                    {previewData.saves.map((save, index) => (
                      <div key={index} className="save-preview-item">
                        <div className="save-preview-info">
                          <h5 className="save-preview-name">{save.save_name}</h5>
                          <p className="save-preview-meta">
                            {save.colony_name && (
                              <span>🏛️ {save.colony_name}</span>
                            )}
                            {save.created_at && (
                              <span>📅 {formatDate(save.created_at)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.warnings && previewData.warnings.length > 0 && (
                <div className="preview-warnings">
                  <h4 className="warnings-title">⚠️ Warnings</h4>
                  <div className="warnings-list">
                    {previewData.warnings.map((warning, index) => (
                      <div key={index} className={`warning-item warning-${warning.type}`}>
                        <span className="warning-icon">
                          {warning.type === 'repaired' ? '🔧' : 
                           warning.type === 'skipped' ? '⏭️' : 
                           warning.type === 'invalid' ? '❌' : '⚠️'}
                        </span>
                        <span className="warning-message">{warning.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="preview-error">
              <span className="error-icon">❌</span>
              <span>Failed to preview file. The file may be corrupted or invalid.</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Import Options */}
      {file && (
        <motion.div
          className="import-options-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3 className="section-title">Import Options</h3>
          
          <div className="options-grid">
            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={importOptions.createBackup}
                onChange={(e) => setImportOptions(prev => ({ 
                  ...prev, 
                  createBackup: e.target.checked 
                }))}
              />
              <span className="option-text">Create backup before import</span>
              <p className="option-description">
                Recommended: Creates a backup of current saves before importing
              </p>
            </label>

            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={importOptions.overwriteExisting}
                onChange={(e) => setImportOptions(prev => ({ 
                  ...prev, 
                  overwriteExisting: e.target.checked 
                }))}
              />
              <span className="option-text">Overwrite existing saves</span>
              <p className="option-description">
                Allow importing even if save slots are occupied
              </p>
            </label>

            <label className="option-checkbox">
              <input
                type="checkbox"
                checked={importOptions.autoRepair}
                onChange={(e) => setImportOptions(prev => ({ 
                  ...prev, 
                  autoRepair: e.target.checked 
                }))}
              />
              <span className="option-text">Auto-repair corrupted saves</span>
              <p className="option-description">
                Attempt to fix minor issues in save data automatically
              </p>
            </label>
          </div>
        </motion.div>
      )}

      {/* Import Action */}
      {file && (
        <motion.div
          className="import-action-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            className="import-button"
            onClick={handleImport}
            disabled={loading || !file}
            whileHover={!loading && file ? { scale: 1.05 } : {}}
            whileTap={!loading && file ? { scale: 0.95 } : {}}
          >
            {loading && <span className="loading-spinner">🔄</span>}
            <span className="button-icon">📥</span>
            {loading ? 'Importing...' : 'Import Saves'}
          </motion.button>

          <div className="import-info">
            <p className="import-hint">
              {previewData ? 
                `Ready to import ${previewData.saveCount} save${previewData.saveCount !== 1 ? 's' : ''}` :
                'File will be validated before import'
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Help Section */}
      <div className="import-help-section">
        <h3 className="section-title">Import Help</h3>
        
        <div className="help-content">
          <div className="help-item">
            <h4 className="help-title">📄 Supported Files</h4>
            <p className="help-text">
              JSON files exported from Antopolis save system. Both regular and compressed formats are supported.
            </p>
          </div>

          <div className="help-item">
            <h4 className="help-title">🔒 Safety</h4>
            <p className="help-text">
              All imports are validated for security and compatibility. Enable backup creation for maximum safety.
            </p>
          </div>

          <div className="help-item">
            <h4 className="help-title">🔧 Auto-Repair</h4>
            <p className="help-text">
              Minor save corruption can be automatically repaired. Major issues will be reported as warnings.
            </p>
          </div>

          <div className="help-item">
            <h4 className="help-title">📊 Compatibility</h4>
            <p className="help-text">
              Saves from older game versions are automatically upgraded. Newer versions may not be compatible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPanel; 
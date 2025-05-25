import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CloudSaveService from '../../services/cloudSave';
import './CloudSavePanel.css';

const CloudSavePanel = ({ 
  isOpen, 
  onClose, 
  currentGameData,
  onCloudSave,
  onCloudLoad 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cloudSaves, setCloudSaves] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  
  // Auth form states
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    username: ''
  });

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
      updateSyncStatus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCloudSaves();
    }
  }, [isAuthenticated]);

  /**
   * Check authentication status
   */
  const checkAuthStatus = async () => {
    try {
      const authenticated = await CloudSaveService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const currentUser = await CloudSaveService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to check authentication status');
    }
  };

  /**
   * Update sync status
   */
  const updateSyncStatus = () => {
    const status = CloudSaveService.getSyncStatus();
    setSyncStatus(status);
  };

  /**
   * Load cloud saves
   */
  const loadCloudSaves = async () => {
    setLoading(true);
    try {
      const result = await CloudSaveService.listSaves();
      if (result.success) {
        setCloudSaves(result.saves);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load cloud saves');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle authentication
   */
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMode === 'signin') {
        await CloudSaveService.signIn(authForm.email, authForm.password);
      } else {
        await CloudSaveService.signUp(authForm.email, authForm.password, authForm.username);
      }
      
      await checkAuthStatus();
      setAuthForm({ email: '', password: '', username: '' });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle sign out
   */
  const handleSignOut = async () => {
    try {
      await CloudSaveService.signOut();
      setIsAuthenticated(false);
      setUser(null);
      setCloudSaves([]);
    } catch (err) {
      setError('Failed to sign out');
    }
  };

  /**
   * Upload save to cloud
   */
  const handleCloudSave = async (slotId) => {
    if (!currentGameData) return;

    setLoading(true);
    try {
      const result = await CloudSaveService.uploadSave(currentGameData, slotId);
      
      if (result.success) {
        await loadCloudSaves();
        if (onCloudSave) {
          onCloudSave(result);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to upload save to cloud');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Download save from cloud
   */
  const handleCloudLoad = async (slotId) => {
    setLoading(true);
    try {
      const result = await CloudSaveService.downloadSave(slotId);
      
      if (result.success && onCloudLoad) {
        onCloudLoad(result);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to download save from cloud');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync saves
   */
  const handleSync = async () => {
    setLoading(true);
    try {
      const result = await CloudSaveService.syncSaves();
      
      if (result.success) {
        await loadCloudSaves();
        updateSyncStatus();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete cloud save
   */
  const handleDelete = async (slotId) => {
    if (!confirm('Delete this cloud save? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const result = await CloudSaveService.deleteSave(slotId);
      
      if (result.success) {
        await loadCloudSaves();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to delete cloud save');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="cloud-save-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="cloud-save-panel"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="panel-header">
            <h2 className="panel-title">
              <span className="cloud-icon">☁️</span>
              Cloud Saves
            </h2>
            <button className="close-button" onClick={onClose}>✕</button>
          </div>

          {/* Content */}
          <div className="panel-content">
            {!isAuthenticated ? (
              // Authentication Form
              <div className="auth-section">
                <div className="auth-tabs">
                  <button 
                    className={`auth-tab ${authMode === 'signin' ? 'active' : ''}`}
                    onClick={() => setAuthMode('signin')}
                  >
                    Sign In
                  </button>
                  <button 
                    className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
                    onClick={() => setAuthMode('signup')}
                  >
                    Sign Up
                  </button>
                </div>

                <form onSubmit={handleAuth} className="auth-form">
                  {authMode === 'signup' && (
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <input
                        id="username"
                        type="text"
                        value={authForm.username}
                        onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                        required
                        placeholder="Enter username"
                      />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                      required
                      placeholder="Enter email"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={authForm.password}
                      onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                      required
                      placeholder="Enter password"
                      minLength="6"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="auth-button"
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                  </button>
                </form>
              </div>
            ) : (
              // Cloud Saves Interface
              <div className="cloud-saves-section">
                {/* User Info & Sync Status */}
                <div className="user-info">
                  <div className="user-details">
                    <span className="welcome-text">Welcome, {user?.email}</span>
                    <button className="sign-out-button" onClick={handleSignOut}>
                      Sign Out
                    </button>
                  </div>
                  
                  <div className="sync-status">
                    <div className={`status-indicator ${syncStatus?.isOnline ? 'online' : 'offline'}`}>
                      {syncStatus?.isOnline ? '🟢 Online' : '🔴 Offline'}
                    </div>
                    
                    <button 
                      className="sync-button"
                      onClick={handleSync}
                      disabled={loading || !syncStatus?.isOnline}
                    >
                      <span className="sync-icon">🔄</span>
                      Sync
                    </button>
                  </div>
                </div>

                {/* Cloud Saves List */}
                <div className="cloud-saves-list">
                  <h3 className="saves-heading">Your Cloud Saves</h3>
                  
                  {loading && (
                    <div className="loading-indicator">
                      <span className="loading-spinner">🔄</span>
                      Loading...
                    </div>
                  )}

                  {!loading && cloudSaves.length === 0 && (
                    <div className="no-saves">
                      <p>No cloud saves found</p>
                      <p className="no-saves-hint">Upload a local save to get started</p>
                    </div>
                  )}

                  {!loading && cloudSaves.map((save) => (
                    <div key={save.id} className="cloud-save-item">
                      <div className="save-info">
                        <div className="save-header">
                          <h4 className="save-name">{save.save_name}</h4>
                          <span className="save-slot">Slot {save.save_slot}</span>
                        </div>
                        
                        <div className="save-metadata">
                          <span className="save-date">
                            Saved: {formatDate(save.updated_at)}
                          </span>
                          <span className="save-size">
                            {formatFileSize(save.save_size)}
                          </span>
                          <span className="game-version">
                            v{save.game_version}
                          </span>
                        </div>
                      </div>

                      <div className="save-actions">
                        <button 
                          className="download-button"
                          onClick={() => handleCloudLoad(save.save_slot)}
                          disabled={loading}
                        >
                          📥 Download
                        </button>
                        
                        <button 
                          className="upload-button"
                          onClick={() => handleCloudSave(save.save_slot)}
                          disabled={loading || !currentGameData}
                        >
                          📤 Upload
                        </button>
                        
                        <button 
                          className="delete-button"
                          onClick={() => handleDelete(save.save_slot)}
                          disabled={loading}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Upload New Save */}
                {currentGameData && (
                  <div className="upload-section">
                    <h3>Upload Current Game</h3>
                    <div className="slot-selection">
                      {[1, 2, 3, 4, 5].map(slotId => (
                        <button
                          key={slotId}
                          className={`slot-button ${cloudSaves.find(s => s.save_slot === slotId) ? 'occupied' : 'empty'}`}
                          onClick={() => handleCloudSave(slotId)}
                          disabled={loading}
                        >
                          Slot {slotId}
                          {cloudSaves.find(s => s.save_slot === slotId) && <span className="occupied-indicator">●</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                <span>{error}</span>
                <button 
                  className="error-dismiss"
                  onClick={() => setError(null)}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CloudSavePanel; 
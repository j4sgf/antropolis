import React from 'react';
import { motion } from 'framer-motion';
import './SaveSlot.css';

const SaveSlot = ({ 
  slot, 
  isSelected, 
  mode, 
  onClick, 
  onDelete 
}) => {
  
  /**
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString();
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * Get slot type icon
   */
  const getSlotTypeIcon = () => {
    if (slot.is_auto_save) return '🔄';
    if (slot.is_quick_save) return '⚡';
    return '💾';
  };

  /**
   * Get difficulty color
   */
  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#4CAF50',
      medium: '#FF9800',
      hard: '#f44336',
      nightmare: '#9C27B0'
    };
    return colors[difficulty] || '#4CAF50';
  };

  /**
   * Get overall rating icon
   */
  const getRatingIcon = (rating) => {
    const icons = {
      struggling: '😰',
      stable: '😐',
      thriving: '😊',
      legendary: '🏆'
    };
    return icons[rating] || '😐';
  };

  /**
   * Generate thumbnail placeholder
   */
  const generateThumbnail = () => {
    if (!slot.save_game) return null;
    
    const { colony } = slot.save_game;
    const population = colony.population || 0;
    const happiness = colony.happiness || 50;
    
    // Simple visual representation
    const antCount = Math.min(population, 20);
    const ants = Array.from({ length: antCount }, (_, i) => (
      <span key={i} className="thumbnail-ant" style={{ 
        left: `${(i % 5) * 20}%`, 
        top: `${Math.floor(i / 5) * 25}%`,
        opacity: happiness > 70 ? 1 : happiness > 40 ? 0.7 : 0.5
      }}>
        🐜
      </span>
    ));

    return (
      <div className="save-thumbnail">
        <div className="thumbnail-background">
          <div className="thumbnail-ants">
            {ants}
          </div>
          <div className="thumbnail-overlay">
            <span className="thumbnail-population">{population}</span>
          </div>
        </div>
      </div>
    );
  };

  // Handle delete button click
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(slot);
  };

  return (
    <motion.div
      className={`save-slot ${isSelected ? 'selected' : ''} ${slot.is_empty ? 'empty' : 'occupied'}`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Slot Header */}
      <div className="slot-header">
        <div className="slot-info">
          <span className="slot-type-icon">{getSlotTypeIcon()}</span>
          <span className="slot-number">Slot {slot.slot_id}</span>
        </div>
        
        {!slot.is_empty && (
          <button 
            className="delete-button"
            onClick={handleDeleteClick}
            title="Delete save"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Slot Content */}
      {slot.is_empty ? (
        <div className="empty-slot-content">
          <div className="empty-icon">📝</div>
          <p className="empty-text">Empty Slot</p>
          {mode === 'save' && (
            <p className="empty-hint">Click to save here</p>
          )}
        </div>
      ) : (
        <div className="save-content">
          {/* Thumbnail */}
          {generateThumbnail()}

          {/* Save Information */}
          <div className="save-info">
            <h3 className="save-name" title={slot.save_game.save_name}>
              {slot.save_game.save_name}
            </h3>
            
            <div className="save-metadata">
              <div className="metadata-row">
                <span className="metadata-label">Colony:</span>
                <span className="metadata-value">
                  {slot.save_game.colony.name}
                </span>
              </div>
              
              <div className="metadata-row">
                <span className="metadata-label">Population:</span>
                <span className="metadata-value">
                  {slot.save_game.colony.population.toLocaleString()}
                </span>
              </div>
              
              <div className="metadata-row">
                <span className="metadata-label">Days:</span>
                <span className="metadata-value">
                  {slot.save_game.colony.daysSurvived}
                </span>
              </div>
              
              <div className="metadata-row">
                <span className="metadata-label">Difficulty:</span>
                <span 
                  className="metadata-value difficulty"
                  style={{ color: getDifficultyColor(slot.save_game.colony.difficulty) }}
                >
                  {slot.save_game.colony.difficulty.charAt(0).toUpperCase() + 
                   slot.save_game.colony.difficulty.slice(1)}
                </span>
              </div>
              
              <div className="metadata-row">
                <span className="metadata-label">Status:</span>
                <span className="metadata-value status">
                  {getRatingIcon(slot.save_game.colony.overallRating)}
                  {slot.save_game.colony.overallRating.charAt(0).toUpperCase() + 
                   slot.save_game.colony.overallRating.slice(1)}
                </span>
              </div>
            </div>

            {/* Resources Summary */}
            <div className="resources-summary">
              <div className="resource-item">
                <span className="resource-icon">🍯</span>
                <span className="resource-amount">
                  {Math.floor(slot.save_game.resources.food).toLocaleString()}
                </span>
              </div>
              <div className="resource-item">
                <span className="resource-icon">💧</span>
                <span className="resource-amount">
                  {Math.floor(slot.save_game.resources.water).toLocaleString()}
                </span>
              </div>
              <div className="resource-item">
                <span className="resource-icon">🔬</span>
                <span className="resource-amount">
                  {Math.floor(slot.save_game.resources.research_points).toLocaleString()}
                </span>
              </div>
              <div className="resource-item">
                <span className="resource-icon">🧬</span>
                <span className="resource-amount">
                  {Math.floor(slot.save_game.resources.evolution_points).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slot Footer */}
      <div className="slot-footer">
        {!slot.is_empty && (
          <>
            <div className="save-stats">
              <span className="save-date">
                Saved: {formatDate(slot.save_game.last_saved)}
              </span>
              <span className="save-size">
                {formatFileSize(slot.save_game.save_size)}
              </span>
            </div>
            
            {slot.save_game.version && (
              <div className="save-version">
                v{slot.save_game.version.major}.{slot.save_game.version.minor}.{slot.save_game.version.patch}
              </div>
            )}
          </>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div 
          className="selection-indicator"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
};

export default SaveSlot; 
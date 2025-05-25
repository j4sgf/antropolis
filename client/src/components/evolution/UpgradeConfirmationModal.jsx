import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './UpgradeConfirmationModal.css';

const UpgradeConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  tech, 
  evolutionPoints, 
  unlockedTechs 
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsConfirming(false);
      setError(null);
      setShowDetails(false);
    }
  }, [isOpen]);

  if (!isOpen || !tech) return null;

  // Get category-specific icon
  const getCategoryIcon = () => {
    const icons = {
      physical: '💪',
      specialized: '🎯',
      environmental: '🌍',
      combat: '⚔️',
      efficiency: '⚡'
    };
    return icons[tech.category] || '🧬';
  };

  // Format effects for display
  const formatEffects = (effects) => {
    return Object.entries(effects).map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const formattedValue = typeof value === 'boolean' 
        ? (value ? 'Enabled' : 'Disabled')
        : typeof value === 'number' && key.includes('bonus')
        ? `+${value}%`
        : typeof value === 'number' && key.includes('multiplier')
        ? `×${value}`
        : value;
      
      return { key: formattedKey, value: formattedValue };
    });
  };

  // Format visual changes for display
  const formatVisualChanges = (changes) => {
    return Object.entries(changes).map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const formattedValue = typeof value === 'boolean' 
        ? (value ? 'Yes' : 'No')
        : value;
      
      return { key: formattedKey, value: formattedValue };
    });
  };

  // Check if prerequisites are met
  const checkPrerequisites = () => {
    if (!tech.prerequisite_techs || tech.prerequisite_techs.length === 0) {
      return { met: true, missing: [] };
    }
    
    const missing = tech.prerequisite_techs.filter(prereq => !unlockedTechs.includes(prereq));
    return { met: missing.length === 0, missing };
  };

  // Check if player can afford the upgrade
  const canAfford = evolutionPoints >= tech.required_research_points;
  const prerequisiteCheck = checkPrerequisites();
  const canPurchase = canAfford && prerequisiteCheck.met;

  const handleConfirm = async () => {
    if (!canPurchase) return;

    setIsConfirming(true);
    setError(null);

    try {
      await onConfirm(tech);
    } catch (err) {
      setError(err.message || 'Failed to purchase upgrade');
      setIsConfirming(false);
    }
  };

  const getRemainingPoints = () => {
    return evolutionPoints - tech.required_research_points;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="upgrade-confirmation-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="upgrade-confirmation-modal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <div className="header-content">
              <div className="tech-icon-large">
                {getCategoryIcon()}
              </div>
              <div className="header-text">
                <h2 className="tech-name">{tech.name}</h2>
                <span className="tech-category">{tech.category.toUpperCase()}</span>
              </div>
            </div>
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Description */}
          <div className="modal-body">
            <div className="tech-description">
              <p>{tech.description}</p>
            </div>

            {/* Cost and Affordability */}
            <div className="cost-section">
              <div className="cost-display">
                <div className="cost-item">
                  <span className="cost-label">Evolution Points Required:</span>
                  <span className={`cost-value ${canAfford ? 'affordable' : 'expensive'}`}>
                    {tech.required_research_points}
                  </span>
                </div>
                <div className="balance-info">
                  <div className="balance-item">
                    <span>Current Balance:</span>
                    <span className="current-balance">{evolutionPoints}</span>
                  </div>
                  <div className="balance-item">
                    <span>After Purchase:</span>
                    <span className={`remaining-balance ${getRemainingPoints() >= 0 ? 'positive' : 'negative'}`}>
                      {getRemainingPoints()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prerequisites Check */}
            {tech.prerequisite_techs && tech.prerequisite_techs.length > 0 && (
              <div className="prerequisites-section">
                <h4>Prerequisites:</h4>
                <div className={`prerequisites-status ${prerequisiteCheck.met ? 'met' : 'unmet'}`}>
                  {prerequisiteCheck.met ? (
                    <div className="prerequisites-met">
                      <span className="status-icon">✅</span>
                      <span>All prerequisites satisfied</span>
                    </div>
                  ) : (
                    <div className="prerequisites-unmet">
                      <span className="status-icon">❌</span>
                      <span>Missing prerequisites: {prerequisiteCheck.missing.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Effects Preview */}
            <div className="effects-section">
              <div className="section-header">
                <h4>Upgrade Effects</h4>
                <button 
                  className="toggle-details"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              <div className="effects-grid">
                {formatEffects(tech.effects).slice(0, showDetails ? undefined : 3).map(({ key, value }) => (
                  <div key={key} className="effect-item">
                    <span className="effect-name">{key}:</span>
                    <span className="effect-value">{value}</span>
                  </div>
                ))}
                {!showDetails && formatEffects(tech.effects).length > 3 && (
                  <div className="effect-item more-effects">
                    <span>+ {formatEffects(tech.effects).length - 3} more effects</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Changes */}
            {tech.visual_changes && Object.keys(tech.visual_changes).length > 0 && showDetails && (
              <div className="visual-changes-section">
                <h4>Visual Changes</h4>
                <div className="visual-changes-grid">
                  {formatVisualChanges(tech.visual_changes).map(({ key, value }) => (
                    <div key={key} className="visual-change-item">
                      <span className="change-name">{key}:</span>
                      <span className="change-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warning Messages */}
            {!canAfford && (
              <div className="warning-message insufficient-points">
                <span className="warning-icon">⚠️</span>
                <span>Insufficient evolution points! You need {tech.required_research_points - evolutionPoints} more points.</span>
              </div>
            )}

            {!prerequisiteCheck.met && (
              <div className="warning-message missing-prerequisites">
                <span className="warning-icon">🔒</span>
                <span>You must unlock the required prerequisites first.</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="modal-footer">
            <button 
              className="cancel-button"
              onClick={onClose}
              disabled={isConfirming}
            >
              Cancel
            </button>
            <button 
              className={`confirm-button ${canPurchase ? 'enabled' : 'disabled'}`}
              onClick={handleConfirm}
              disabled={!canPurchase || isConfirming}
            >
              {isConfirming ? (
                <>
                  <span className="loading-spinner">🔄</span>
                  Purchasing...
                </>
              ) : (
                <>
                  <span className="confirm-icon">🧬</span>
                  Purchase Upgrade
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpgradeConfirmationModal; 
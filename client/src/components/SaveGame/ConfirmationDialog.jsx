import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConfirmationDialog.css';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm
}) => {
  
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="confirmation-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={`confirmation-dialog ${isDestructive ? 'destructive' : ''}`}
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="dialog-header">
            <h3 className="dialog-title">
              <span className="dialog-icon">
                {isDestructive ? '⚠️' : '❓'}
              </span>
              {title}
            </h3>
          </div>

          <div className="dialog-content">
            <p className="dialog-message">{message}</p>
          </div>

          <div className="dialog-footer">
            <button
              className="cancel-button"
              onClick={onClose}
            >
              {cancelText}
            </button>
            
            <button
              className={`confirm-button ${isDestructive ? 'destructive' : ''}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmationDialog; 
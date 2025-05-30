import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TechTreePath from './TechTreePath';
import TechTreeNode from './TechTreeNode';
import EvolutionPointsDisplay from './EvolutionPointsDisplay';
import UpgradeConfirmationModal from './UpgradeConfirmationModal';
import UpgradeSuccessNotification from './UpgradeSuccessNotification';
import evolutionManager from '../../services/EvolutionManager';
import './TechTreeView.css';

const TechTreeView = ({ colonyId, onTechUnlock }) => {
  const [techTreeData, setTechTreeData] = useState(null);
  const [evolutionPoints, setEvolutionPoints] = useState(0);
  const [unlockedTechs, setUnlockedTechs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('physical');
  const [selectedTech, setSelectedTech] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // New state for upgrade flow
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTech, setConfirmationTech] = useState(null);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successData, setSuccessData] = useState(null);
  
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Categories with their display information
  const categories = [
    { id: 'physical', name: 'Physical Traits', icon: '💪', color: '#e74c3c' },
    { id: 'specialized', name: 'Specialized Castes', icon: '🎯', color: '#3498db' },
    { id: 'environmental', name: 'Environmental', icon: '🌍', color: '#27ae60' },
    { id: 'combat', name: 'Combat', icon: '⚔️', color: '#e67e22' },
    { id: 'efficiency', name: 'Efficiency', icon: '⚡', color: '#9b59b6' }
  ];

  // Fetch tech tree data and evolution points
  useEffect(() => {
    const fetchTechTreeData = async () => {
      try {
        setLoading(true);
        
        // Fetch tech tree structure
        const treeResponse = await fetch('/api/techtree');
        const treeData = await treeResponse.json();
        
        if (!treeData.success) {
          throw new Error(treeData.error || 'Failed to fetch tech tree');
        }
        
        // Fetch evolution points
        const pointsResponse = await fetch(`/api/evolution/points/${colonyId}`);
        const pointsData = await pointsResponse.json();
        
        if (pointsData.success) {
          setEvolutionPoints(pointsData.data.currentPoints);
        }
        
        // Fetch colony progress (mock for now)
        const progressResponse = await fetch(`/api/progress/${colonyId}`);
        const progressData = await progressResponse.json();
        
        if (progressData.success) {
          const unlockedTechIds = progressData.data.unlockedTechnologies || [];
          setUnlockedTechs(unlockedTechIds);
          
          // Initialize evolution manager
          await evolutionManager.initialize(colonyId, unlockedTechIds);
        }
        
        setTechTreeData(treeData.data);
        setError(null);
        
      } catch (err) {
        console.error('Error fetching tech tree data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (colonyId) {
      fetchTechTreeData();
    }
  }, [colonyId]);

  // Handle mouse wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(2, zoomLevel + delta));
    setZoomLevel(newZoom);
  };

  // Handle mouse drag for panning
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle tech selection
  const handleTechSelect = (tech) => {
    setSelectedTech(tech);
  };

  // Handle tech unlock request (open confirmation)
  const handleTechUnlock = (techId) => {
    const tech = findTechById(techId);
    if (tech) {
      setConfirmationTech(tech);
      setShowConfirmation(true);
      setSelectedTech(null); // Close detail modal
    }
  };

  // Find tech by ID from all categories
  const findTechById = (techId) => {
    if (!techTreeData?.structuredTree) return null;
    
    for (const category of Object.values(techTreeData.structuredTree)) {
      const tech = category.find(t => t.id === techId);
      if (tech) return tech;
    }
    return null;
  };

  // Handle actual tech purchase (from confirmation modal)
  const handleConfirmPurchase = async (tech) => {
    try {
      const response = await fetch(`/api/techtree/unlock/${colonyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technologyId: tech.id }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        const newUnlockedTechs = [...unlockedTechs, tech.id];
        setUnlockedTechs(newUnlockedTechs);
        setEvolutionPoints(result.data.remainingPoints);
        
        // Add to evolution manager
        evolutionManager.addUpgrade(tech);
        
        // Close confirmation and show success
        setShowConfirmation(false);
        setConfirmationTech(null);
        
        // Show success notification
        setSuccessData({
          tech,
          remainingPoints: result.data.remainingPoints,
          pointsSpent: tech.required_research_points
        });
        setShowSuccessNotification(true);
        
        // Notify parent component
        if (onTechUnlock) {
          onTechUnlock(result.data);
        }
      } else {
        throw new Error(result.error || 'Failed to unlock technology');
      }
    } catch (err) {
      console.error('Error unlocking technology:', err);
      throw err; // Let the modal handle the error display
    }
  };

  // Handle undo purchase
  const handleUndoPurchase = async (tech) => {
    try {
      const response = await fetch(`/api/techtree/undo/${colonyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ technologyId: tech.id }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setUnlockedTechs(prev => prev.filter(id => id !== tech.id));
        setEvolutionPoints(result.data.currentPoints);
        
        // Remove from evolution manager
        evolutionManager.removeUpgrade(tech.id);
        
        // Close success notification
        setShowSuccessNotification(false);
        setSuccessData(null);
        
        console.log(`🔄 Undid upgrade: ${tech.name}`);
      } else {
        throw new Error(result.error || 'Failed to undo technology');
      }
    } catch (err) {
      console.error('Error undoing technology:', err);
      throw err;
    }
  };

  // Reset view
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className="tech-tree-loading">
        <div className="loading-spinner"></div>
        <p>Loading Evolution Tree...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tech-tree-error">
        <h3>Error Loading Tech Tree</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!techTreeData) {
    return <div className="tech-tree-error">No tech tree data available</div>;
  }

  return (
    <div className="tech-tree-view">
      {/* Header with evolution points and controls */}
      <div className="tech-tree-header">
        <EvolutionPointsDisplay points={evolutionPoints} />
        
        <div className="tech-tree-controls">
          <button onClick={resetView} className="control-button">
            🎯 Reset View
          </button>
          <div className="zoom-controls">
            <button 
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
              className="control-button"
            >
              🔍-
            </button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button 
              onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
              className="control-button"
            >
              🔍+
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="tech-tree-categories">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
            style={{ '--category-color': category.color }}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Main tech tree container */}
      <div 
        className="tech-tree-container"
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="tech-tree-content"
          ref={contentRef}
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TechTreePath
                category={selectedCategory}
                technologies={techTreeData.structuredTree[selectedCategory] || []}
                unlockedTechs={unlockedTechs}
                evolutionPoints={evolutionPoints}
                onTechSelect={handleTechSelect}
                onTechUnlock={handleTechUnlock}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Tech details modal */}
      <AnimatePresence>
        {selectedTech && (
          <motion.div
            className="tech-details-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTech(null)}
          >
            <motion.div
              className="tech-details-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <TechTreeNode
                tech={selectedTech}
                isUnlocked={unlockedTechs.includes(selectedTech.id)}
                canAfford={evolutionPoints >= selectedTech.required_research_points}
                onUnlock={() => handleTechUnlock(selectedTech.id)}
                onClose={() => setSelectedTech(null)}
                detailed={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="tech-tree-instructions">
        <p>🖱️ Click and drag to pan • 🖱️ Scroll to zoom • 🎯 Click technologies for details</p>
      </div>

      {/* Upgrade Confirmation Modal */}
      <UpgradeConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setConfirmationTech(null);
        }}
        onConfirm={handleConfirmPurchase}
        tech={confirmationTech}
        evolutionPoints={evolutionPoints}
        unlockedTechs={unlockedTechs}
      />

      {/* Success Notification */}
      <UpgradeSuccessNotification
        isVisible={showSuccessNotification}
        onClose={() => {
          setShowSuccessNotification(false);
          setSuccessData(null);
        }}
        onUndo={handleUndoPurchase}
        tech={successData?.tech}
        remainingPoints={successData?.remainingPoints}
        pointsSpent={successData?.pointsSpent}
      />
    </div>
  );
};

export default TechTreeView; 
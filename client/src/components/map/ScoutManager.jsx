import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import scoutService from '../../services/scoutService';
import './ScoutManager.css';

const SCOUT_TYPES = {
  WORKER: { icon: '🐜', color: '#8B4513', name: 'Worker' },
  SCOUT: { icon: '🔍', color: '#228B22', name: 'Scout' },
  SOLDIER: { icon: '⚔️', color: '#B22222', name: 'Soldier' },
  RANGER: { icon: '🏹', color: '#4169E1', name: 'Ranger' }
};

const ScoutManager = ({
  colonyId,
  mapWidth = 100,
  mapHeight = 100,
  tileSize = 32,
  viewportX = 0,
  viewportY = 0,
  viewportWidth = 800,
  viewportHeight = 600,
  onScoutUpdate,
  onExplorationUpdate,
  enabled = true
}) => {
  const [scouts, setScouts] = useState([]);
  const [selectedScout, setSelectedScout] = useState(null);
  const [isManaging, setIsManaging] = useState(false);
  const [explorationStats, setExplorationStats] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  const scoutCanvasRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Initialize scout service
  useEffect(() => {
    if (colonyId && enabled) {
      scoutService.initialize(colonyId).then(() => {
        console.log('🕵️ ScoutManager initialized');
        loadInitialScouts();
        startUpdateLoop();
      });
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [colonyId, enabled]);

  // Load initial scouts (mock data for now)
  const loadInitialScouts = useCallback(() => {
    // Add some demo scouts around the base
    const baseX = 50;
    const baseY = 50;
    
    const initialScouts = [
      { id: 'scout-1', x: baseX + 5, y: baseY, type: 'SCOUT' },
      { id: 'scout-2', x: baseX - 3, y: baseY + 2, type: 'WORKER' },
      { id: 'scout-3', x: baseX + 2, y: baseY - 4, type: 'SOLDIER' }
    ];

    initialScouts.forEach(scoutData => {
      scoutService.addScout(scoutData);
    });

    updateScouts();
  }, []);

  // Start update loop for real-time changes
  const startUpdateLoop = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(() => {
      updateScouts();
      updateExplorationStats();
    }, 2000);
  }, []);

  // Update scouts from service
  const updateScouts = useCallback(() => {
    const currentScouts = scoutService.getAllScouts();
    setScouts(currentScouts);
    setLastUpdate(Date.now());

    // Notify parent component
    if (onScoutUpdate) {
      onScoutUpdate(scoutService.getScoutPositions());
    }
  }, [onScoutUpdate]);

  // Update exploration statistics
  const updateExplorationStats = useCallback(async () => {
    try {
      const status = await scoutService.getExplorationStatus();
      if (status?.success) {
        setExplorationStats(status.data.stats);
        
        if (onExplorationUpdate) {
          onExplorationUpdate(status.data);
        }
      }
    } catch (error) {
      console.error('Error updating exploration stats:', error);
    }
  }, [onExplorationUpdate]);

  // Add new scout
  const addScout = useCallback((type = 'WORKER') => {
    const newScoutId = `scout-${Date.now()}`;
    const baseX = 50; // Base position
    const baseY = 50;
    
    // Random position near base
    const x = baseX + (Math.random() - 0.5) * 10;
    const y = baseY + (Math.random() - 0.5) * 10;
    
    const scoutData = {
      id: newScoutId,
      x: Math.max(0, Math.min(mapWidth - 1, x)),
      y: Math.max(0, Math.min(mapHeight - 1, y)),
      type
    };

    scoutService.addScout(scoutData);
    updateScouts();
  }, [mapWidth, mapHeight]);

  // Remove scout
  const removeScout = useCallback((scoutId) => {
    scoutService.removeScout(scoutId);
    if (selectedScout?.id === scoutId) {
      setSelectedScout(null);
    }
    updateScouts();
  }, [selectedScout]);

  // Send scout to location
  const sendScoutTo = useCallback((scoutId, x, y) => {
    scoutService.sendScoutTo(scoutId, x, y);
    updateScouts();
  }, []);

  // Handle map click for scout movement
  const handleMapClick = useCallback((event) => {
    if (!selectedScout) return;

    const canvas = scoutCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left + viewportX) / tileSize);
    const y = ((event.clientY - rect.top + viewportY) / tileSize);

    sendScoutTo(selectedScout.id, x, y);
  }, [selectedScout, viewportX, viewportY, tileSize, sendScoutTo]);

  // Render scouts on canvas
  useEffect(() => {
    const canvas = scoutCanvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    scouts.forEach(scout => {
      const screenX = (scout.x * tileSize) - viewportX;
      const screenY = (scout.y * tileSize) - viewportY;

      // Skip if outside canvas
      if (screenX < -tileSize || screenX > canvas.width || 
          screenY < -tileSize || screenY > canvas.height) {
        return;
      }

      const scoutType = SCOUT_TYPES[scout.type] || SCOUT_TYPES.WORKER;
      
      // Draw visibility range
      if (scout.isActive) {
        ctx.beginPath();
        ctx.arc(
          screenX + tileSize/2, 
          screenY + tileSize/2, 
          scout.visibilityRange * tileSize, 
          0, 
          2 * Math.PI
        );
        ctx.strokeStyle = scoutType.color + '40';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = scoutType.color + '10';
        ctx.fill();
      }

      // Draw scout
      ctx.fillStyle = scout.isActive ? scoutType.color : '#666666';
      ctx.beginPath();
      ctx.arc(screenX + tileSize/2, screenY + tileSize/2, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw selection indicator
      if (selectedScout?.id === scout.id) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenX + tileSize/2, screenY + tileSize/2, 12, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Draw stamina bar
      if (scout.isActive) {
        const barWidth = 20;
        const barHeight = 4;
        const staminaPercent = scout.stamina / scout.maxStamina;
        
        // Background
        ctx.fillStyle = '#333333';
        ctx.fillRect(screenX + tileSize/2 - barWidth/2, screenY - 5, barWidth, barHeight);
        
        // Stamina
        ctx.fillStyle = staminaPercent > 0.5 ? '#00FF00' : staminaPercent > 0.25 ? '#FFFF00' : '#FF0000';
        ctx.fillRect(screenX + tileSize/2 - barWidth/2, screenY - 5, barWidth * staminaPercent, barHeight);
      }
    });

    // Draw target indicators for selected scout
    if (selectedScout?.currentTarget) {
      const targetScreenX = (selectedScout.currentTarget.x * tileSize) - viewportX;
      const targetScreenY = (selectedScout.currentTarget.y * tileSize) - viewportY;
      
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(targetScreenX + tileSize/2, targetScreenY + tileSize/2, 15, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw path line
      const scoutScreenX = (selectedScout.x * tileSize) - viewportX;
      const scoutScreenY = (selectedScout.y * tileSize) - viewportY;
      
      ctx.beginPath();
      ctx.moveTo(scoutScreenX + tileSize/2, scoutScreenY + tileSize/2);
      ctx.lineTo(targetScreenX + tileSize/2, targetScreenY + tileSize/2);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [scouts, selectedScout, viewportX, viewportY, tileSize, enabled]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="scout-manager">
      {/* Scout canvas overlay */}
      <canvas
        ref={scoutCanvasRef}
        width={viewportWidth}
        height={viewportHeight}
        className="scout-canvas"
        onClick={handleMapClick}
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: selectedScout ? 'auto' : 'none',
          zIndex: 20
        }}
      />

      {/* Scout management panel */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isManaging ? 0 : -250 }}
        className="scout-panel"
      >
        <div className="scout-panel-header">
          <h3>🕵️ Scout Management</h3>
          <button
            onClick={() => setIsManaging(!isManaging)}
            className="toggle-panel-btn"
          >
            {isManaging ? '◀' : '▶'}
          </button>
        </div>

        {isManaging && (
          <div className="scout-panel-content">
            {/* Exploration stats */}
            {explorationStats && (
              <div className="exploration-stats">
                <h4>📊 Exploration Progress</h4>
                <div className="stat-row">
                  <span>Explored:</span>
                  <span>{explorationStats.explorationPercentage}%</span>
                </div>
                <div className="stat-row">
                  <span>Tiles:</span>
                  <span>{explorationStats.totalExploredTiles}/{explorationStats.totalMapTiles}</span>
                </div>
                <div className="stat-row">
                  <span>Visible:</span>
                  <span>{explorationStats.currentlyVisible}</span>
                </div>
              </div>
            )}

            {/* Scout list */}
            <div className="scout-list">
              <h4>🐜 Active Scouts ({scouts.length})</h4>
              <div className="scout-items">
                {scouts.map(scout => {
                  const scoutType = SCOUT_TYPES[scout.type] || SCOUT_TYPES.WORKER;
                  return (
                    <motion.div
                      key={scout.id}
                      className={`scout-item ${selectedScout?.id === scout.id ? 'selected' : ''} ${!scout.isActive ? 'inactive' : ''}`}
                      onClick={() => setSelectedScout(scout)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="scout-info">
                        <span className="scout-icon" style={{ color: scoutType.color }}>
                          {scoutType.icon}
                        </span>
                        <div className="scout-details">
                          <div className="scout-name">{scoutType.name}</div>
                          <div className="scout-pos">({Math.floor(scout.x)}, {Math.floor(scout.y)})</div>
                        </div>
                        <div className="scout-stamina">
                          <div 
                            className="stamina-bar"
                            style={{ 
                              width: `${(scout.stamina / scout.maxStamina) * 100}%`,
                              backgroundColor: scout.stamina > 50 ? '#00FF00' : scout.stamina > 25 ? '#FFFF00' : '#FF0000'
                            }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeScout(scout.id);
                        }}
                        className="remove-scout-btn"
                      >
                        ✕
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Add scout buttons */}
            <div className="add-scout-section">
              <h4>➕ Add Scout</h4>
              <div className="scout-type-buttons">
                {Object.entries(SCOUT_TYPES).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => addScout(type)}
                    className="add-scout-btn"
                    style={{ borderColor: config.color }}
                  >
                    {config.icon} {config.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            {selectedScout && (
              <div className="scout-instructions">
                <h4>🎯 Scout Selected</h4>
                <p>Click on the map to send <strong>{SCOUT_TYPES[selectedScout.type]?.name}</strong> to that location.</p>
                {selectedScout.currentTarget && (
                  <p>Target: ({Math.floor(selectedScout.currentTarget.x)}, {Math.floor(selectedScout.currentTarget.y)})</p>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Status indicator */}
      <div className="scout-status">
        <div className="status-indicator">
          <span className="status-dot active"></span>
          <span>Scouts Active: {scouts.filter(s => s.isActive).length}</span>
        </div>
        <div className="last-update">
          Last Update: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ScoutManager; 
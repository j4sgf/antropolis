import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import scoutService from '../../services/scoutService';
import './ExplorationMiniMap.css';

const ExplorationMiniMap = ({
  colonyId,
  mapWidth = 100,
  mapHeight = 100,
  miniMapSize = 200,
  onTileClick,
  onAreaSelect,
  showMemoryDecay = true,
  showScouts = true,
  showStatistics = true,
  updateInterval = 3000,
  enabled = true
}) => {
  const [explorationData, setExplorationData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState(null);
  
  const canvasRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Colors for different states
  const COLORS = {
    UNEXPLORED: '#1a1a2e',
    EXPLORED: '#16213e',
    FRESH: '#0f3460',
    FADING: '#16537e',
    VISIBLE: '#87ceeb',
    SCOUT: '#32cd32',
    BASE: '#ffd700',
    DISCOVERY: '#ff6347',
    GRID: '#16537e33'
  };

  // Initialize and start updates
  useEffect(() => {
    if (colonyId && enabled) {
      fetchExplorationData();
      startUpdateLoop();
    }

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [colonyId, enabled]);

  // Start update loop
  const startUpdateLoop = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = setInterval(() => {
      fetchExplorationData();
    }, updateInterval);
  }, [updateInterval]);

  // Fetch exploration data from service
  const fetchExplorationData = useCallback(async () => {
    try {
      const data = await scoutService.getExplorationStatus();
      if (data?.success) {
        setExplorationData(data.data);
      }
    } catch (error) {
      console.error('Error fetching exploration data for mini-map:', error);
    }
  }, []);

  // Render mini-map
  useEffect(() => {
    if (!explorationData || !enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = isExpanded ? miniMapSize * 2 : miniMapSize;
    
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Calculate scale
    const scaleX = size / mapWidth;
    const scaleY = size / mapHeight;

    // Draw background
    ctx.fillStyle = COLORS.UNEXPLORED;
    ctx.fillRect(0, 0, size, size);

    // Draw explored tiles
    if (explorationData.exploredTiles) {
      Object.entries(explorationData.exploredTiles).forEach(([tileKey, tileInfo]) => {
        const [x, y] = tileKey.split(',').map(Number);
        const screenX = x * scaleX;
        const screenY = y * scaleY;
        
        let color = COLORS.EXPLORED;
        
        // Determine color based on memory decay
        if (showMemoryDecay && explorationData.memoryDecayMap?.[tileKey]) {
          const decay = explorationData.memoryDecayMap[tileKey];
          if (decay < 0.25) {
            color = COLORS.FRESH;
          } else if (decay < 0.75) {
            color = COLORS.FADING;
          } else {
            color = COLORS.EXPLORED;
          }
        }

        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(screenX), 
          Math.floor(screenY), 
          Math.max(1, Math.floor(scaleX)), 
          Math.max(1, Math.floor(scaleY))
        );
      });
    }

    // Draw currently visible tiles
    if (explorationData.visibleTiles) {
      explorationData.visibleTiles.forEach(tileKey => {
        const [x, y] = tileKey.split(',').map(Number);
        const screenX = x * scaleX;
        const screenY = y * scaleY;
        
        ctx.fillStyle = COLORS.VISIBLE;
        ctx.fillRect(
          Math.floor(screenX), 
          Math.floor(screenY), 
          Math.max(1, Math.floor(scaleX)), 
          Math.max(1, Math.floor(scaleY))
        );
      });
    }

    // Draw scouts
    if (showScouts) {
      const scouts = scoutService.getActiveScouts();
      scouts.forEach(scout => {
        const screenX = scout.x * scaleX;
        const screenY = scout.y * scaleY;
        
        // Scout visibility range
        ctx.beginPath();
        ctx.arc(screenX, screenY, scout.visibilityRange * scaleX, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.SCOUT + '20';
        ctx.fill();
        ctx.strokeStyle = COLORS.SCOUT + '60';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Scout dot
        ctx.beginPath();
        ctx.arc(screenX, screenY, 2, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.SCOUT;
        ctx.fill();
      });
    }

    // Draw base
    const baseX = 50 * scaleX; // Default base position
    const baseY = 50 * scaleY;
    
    ctx.beginPath();
    ctx.arc(baseX, baseY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = COLORS.BASE;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw grid (if expanded)
    if (isExpanded) {
      ctx.strokeStyle = COLORS.GRID;
      ctx.lineWidth = 0.5;
      
      // Vertical lines
      for (let x = 0; x <= mapWidth; x += 10) {
        const screenX = x * scaleX;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, size);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= mapHeight; y += 10) {
        const screenY = y * scaleY;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(size, screenY);
        ctx.stroke();
      }
    }

    // Draw selected area
    if (selectedArea) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(
        selectedArea.x * scaleX,
        selectedArea.y * scaleY,
        selectedArea.width * scaleX,
        selectedArea.height * scaleY
      );
      ctx.setLineDash([]);
    }

  }, [explorationData, isExpanded, miniMapSize, mapWidth, mapHeight, showMemoryDecay, showScouts, selectedArea, enabled]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event) => {
    if (!onTileClick) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const size = isExpanded ? miniMapSize * 2 : miniMapSize;
    
    const x = Math.floor(((event.clientX - rect.left) / size) * mapWidth);
    const y = Math.floor(((event.clientY - rect.top) / size) * mapHeight);
    
    onTileClick(x, y);
  }, [onTileClick, isExpanded, miniMapSize, mapWidth, mapHeight]);

  // Handle mouse move for tooltip
  const handleMouseMove = useCallback((event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const size = isExpanded ? miniMapSize * 2 : miniMapSize;
    
    const x = Math.floor(((event.clientX - rect.left) / size) * mapWidth);
    const y = Math.floor(((event.clientY - rect.top) / size) * mapHeight);
    
    setMousePosition({ x: event.clientX, y: event.clientY });
    
    // Get tile information for tooltip
    const tileKey = `${x},${y}`;
    const tileInfo = explorationData?.exploredTiles?.[tileKey];
    const isVisible = explorationData?.visibleTiles?.includes(tileKey);
    const memoryDecay = explorationData?.memoryDecayMap?.[tileKey];
    
    if (tileInfo || isVisible) {
      setTooltipData({
        x,
        y,
        explored: !!tileInfo,
        visible: isVisible,
        memoryDecay: memoryDecay || 0,
        exploredAt: tileInfo?.exploredAt,
        lastVisited: tileInfo?.lastVisited
      });
      setShowTooltip(true);
    } else {
      setShowTooltip(false);
      setTooltipData(null);
    }
  }, [explorationData, isExpanded, miniMapSize, mapWidth, mapHeight]);

  // Process memory decay manually
  const processMemoryDecay = useCallback(async () => {
    try {
      await scoutService.processMemoryDecay();
      fetchExplorationData();
    } catch (error) {
      console.error('Error processing memory decay:', error);
    }
  }, [fetchExplorationData]);

  if (!enabled) {
    return null;
  }

  const size = isExpanded ? miniMapSize * 2 : miniMapSize;
  const stats = explorationData?.stats;

  return (
    <div className="exploration-minimap">
      {/* Main mini-map */}
      <motion.div
        className={`minimap-container ${isExpanded ? 'expanded' : ''}`}
        animate={{ 
          width: size + 32, 
          height: size + (showStatistics ? 100 : 32) 
        }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="minimap-header">
          <h4>🗺️ Exploration Map</h4>
          <div className="minimap-controls">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="expand-btn"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '⤡' : '⤢'}
            </button>
            <button
              onClick={processMemoryDecay}
              className="decay-btn"
              title="Process Memory Decay"
            >
              🧠
            </button>
          </div>
        </div>

        <div className="minimap-canvas-container">
          <canvas
            ref={canvasRef}
            className="minimap-canvas"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ cursor: onTileClick ? 'crosshair' : 'default' }}
          />

          {/* Legend */}
          <div className="minimap-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: COLORS.UNEXPLORED }}></div>
              <span>Unexplored</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: COLORS.EXPLORED }}></div>
              <span>Explored</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: COLORS.VISIBLE }}></div>
              <span>Visible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: COLORS.SCOUT }}></div>
              <span>Scouts</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ backgroundColor: COLORS.BASE }}></div>
              <span>Base</span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {showStatistics && stats && (
          <div className="minimap-stats">
            <div className="stat-item">
              <span className="stat-label">Explored:</span>
              <span className="stat-value">{stats.explorationPercentage}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Tiles:</span>
              <span className="stat-value">{stats.totalExploredTiles}/{stats.totalMapTiles}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Visible:</span>
              <span className="stat-value">{stats.currentlyVisible}</span>
            </div>
            {stats.memoryDecayStats && (
              <div className="decay-stats">
                <div className="decay-item">
                  <span style={{ color: COLORS.FRESH }}>●</span>
                  <span>Fresh: {stats.memoryDecayStats.fresh}</span>
                </div>
                <div className="decay-item">
                  <span style={{ color: COLORS.FADING }}>●</span>
                  <span>Fading: {stats.memoryDecayStats.fading}</span>
                </div>
                <div className="decay-item">
                  <span style={{ color: COLORS.EXPLORED }}>●</span>
                  <span>Old: {stats.memoryDecayStats.lost}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Tooltip */}
      {showTooltip && tooltipData && (
        <motion.div
          className="minimap-tooltip"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 60
          }}
        >
          <div className="tooltip-header">
            📍 Tile ({tooltipData.x}, {tooltipData.y})
          </div>
          <div className="tooltip-content">
            <div>Status: {tooltipData.visible ? 'Visible' : tooltipData.explored ? 'Explored' : 'Unexplored'}</div>
            {tooltipData.memoryDecay > 0 && (
              <div>Memory: {Math.round((1 - tooltipData.memoryDecay) * 100)}%</div>
            )}
            {tooltipData.lastVisited && (
              <div>Last Visited: {new Date(tooltipData.lastVisited).toLocaleTimeString()}</div>
            )}
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="minimap-actions">
        <button
          onClick={() => scoutService.exploreArea(50, 50, 5)}
          className="action-btn"
          title="Explore around base"
        >
          🏠 Explore Base
        </button>
        <button
          onClick={fetchExplorationData}
          className="action-btn"
          title="Refresh map"
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default ExplorationMiniMap; 
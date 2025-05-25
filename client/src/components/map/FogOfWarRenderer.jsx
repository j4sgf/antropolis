import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const FOG_COLORS = {
  UNEXPLORED: 'rgba(30, 30, 40, 0.9)',     // Dark fog for unexplored areas
  EXPLORED: 'rgba(60, 60, 80, 0.4)',       // Light fog for previously explored areas
  VISIBLE: 'rgba(0, 0, 0, 0)',             // No fog for currently visible areas
  TRANSITION: 'rgba(45, 45, 60, 0.65)'     // Medium fog for transition areas
};

const FogOfWarRenderer = ({ 
  colonyId,
  mapWidth = 100,
  mapHeight = 100,
  tileSize = 32,
  viewportX = 0,
  viewportY = 0,
  viewportWidth = 800,
  viewportHeight = 600,
  explorationData = null,
  scoutPositions = [],
  enabled = true,
  refreshInterval = 1000,
  onDiscovery = null
}) => {
  const canvasRef = useRef(null);
  const [fogData, setFogData] = useState(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Animation state for fog transitions
  const [animatingTiles, setAnimatingTiles] = useState(new Set());
  const [fogOpacityCache, setFogOpacityCache] = useState(new Map());

  // Performance optimization - only update visible tiles
  const getVisibleTileRange = useCallback(() => {
    const startX = Math.floor(viewportX / tileSize);
    const startY = Math.floor(viewportY / tileSize);
    const endX = Math.min(mapWidth - 1, Math.ceil((viewportX + viewportWidth) / tileSize));
    const endY = Math.min(mapHeight - 1, Math.ceil((viewportY + viewportHeight) / tileSize));
    
    return { startX, startY, endX, endY };
  }, [viewportX, viewportY, viewportWidth, viewportHeight, tileSize, mapWidth, mapHeight]);

  // Fetch exploration data from the server
  const fetchExplorationData = useCallback(async () => {
    if (!colonyId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/exploration/${colonyId}/status`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch exploration data');
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        updateFogData(result.data);
        setLastUpdate(Date.now());
      } else {
        setError(result.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching exploration data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [colonyId, enabled]);

  // Update fog data with new exploration information
  const updateFogData = useCallback((explorationInfo) => {
    const newFogData = new Map();
    const newAnimatingTiles = new Set();

    // Process each tile in the visible range
    const { startX, startY, endX, endY } = getVisibleTileRange();
    
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tileKey = `${x},${y}`;
        const currentFog = fogData.get(tileKey);
        
        // Determine new fog level based on exploration data
        let newFogLevel = 1.0; // Default: unexplored
        let fogType = 'UNEXPLORED';
        
        if (explorationInfo.visibleTiles?.includes(tileKey)) {
          newFogLevel = 0.0;
          fogType = 'VISIBLE';
        } else if (explorationInfo.exploredTiles?.includes(tileKey)) {
          const tileInfo = explorationInfo.tileDetails?.[tileKey];
          newFogLevel = tileInfo?.memoryDecay || 0.4;
          fogType = 'EXPLORED';
        }

        // Check if fog level changed (animate transition)
        if (currentFog && Math.abs(currentFog.fogLevel - newFogLevel) > 0.1) {
          newAnimatingTiles.add(tileKey);
        }

        newFogData.set(tileKey, {
          fogLevel: newFogLevel,
          fogType: fogType,
          lastUpdate: Date.now(),
          discovered: newFogLevel < 1.0 && (!currentFog || currentFog.fogLevel >= 1.0)
        });
      }
    }

    setFogData(newFogData);
    setAnimatingTiles(newAnimatingTiles);

    // Clear animations after 500ms
    setTimeout(() => {
      setAnimatingTiles(new Set());
    }, 500);
  }, [fogData, getVisibleTileRange]);

  // Handle scout position updates for real-time visibility
  const updateScoutVisibility = useCallback(() => {
    if (!scoutPositions.length) return;

    const newFogData = new Map(fogData);
    
    scoutPositions.forEach(scout => {
      const scoutRange = scout.visibilityRange || 5;
      const scoutX = Math.floor(scout.x / tileSize);
      const scoutY = Math.floor(scout.y / tileSize);
      
      for (let dy = -scoutRange; dy <= scoutRange; dy++) {
        for (let dx = -scoutRange; dx <= scoutRange; dx++) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= scoutRange) {
            const x = scoutX + dx;
            const y = scoutY + dy;
            const tileKey = `${x},${y}`;
            
            if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
              newFogData.set(tileKey, {
                fogLevel: 0.0,
                fogType: 'VISIBLE',
                lastUpdate: Date.now(),
                discovered: false
              });
            }
          }
        }
      }
    });

    setFogData(newFogData);
  }, [scoutPositions, tileSize, mapWidth, mapHeight, fogData]);

  // Auto-refresh exploration data
  useEffect(() => {
    fetchExplorationData();
    
    const interval = setInterval(fetchExplorationData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchExplorationData, refreshInterval]);

  // Update scout visibility when positions change
  useEffect(() => {
    updateScoutVisibility();
  }, [scoutPositions]);

  // Use external exploration data if provided
  useEffect(() => {
    if (explorationData) {
      updateFogData(explorationData);
    }
  }, [explorationData, updateFogData]);

  // Render fog of war on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get visible tile range for optimization
    const { startX, startY, endX, endY } = getVisibleTileRange();

    // Render fog for each tile
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const tileKey = `${x},${y}`;
        const fogInfo = fogData.get(tileKey);
        
        if (!fogInfo || fogInfo.fogLevel === 0) continue;

        // Calculate screen position
        const screenX = (x * tileSize) - viewportX;
        const screenY = (y * tileSize) - viewportY;
        
        // Skip if outside canvas
        if (screenX + tileSize < 0 || screenX > width || 
            screenY + tileSize < 0 || screenY > height) {
          continue;
        }

        // Determine fog color and opacity
        let fogColor = FOG_COLORS.UNEXPLORED;
        let opacity = fogInfo.fogLevel;
        
        switch (fogInfo.fogType) {
          case 'EXPLORED':
            fogColor = FOG_COLORS.EXPLORED;
            opacity = Math.min(0.7, fogInfo.fogLevel);
            break;
          case 'TRANSITION':
            fogColor = FOG_COLORS.TRANSITION;
            break;
          case 'UNEXPLORED':
          default:
            fogColor = FOG_COLORS.UNEXPLORED;
            break;
        }

        // Apply animation effect for transitioning tiles
        if (animatingTiles.has(tileKey)) {
          const animationTime = (Date.now() - fogInfo.lastUpdate) / 500; // 500ms animation
          opacity *= Math.max(0, 1 - animationTime);
        }

        // Draw fog tile with gradient effect
        if (opacity > 0.05) {
          ctx.save();
          ctx.globalAlpha = opacity;
          
          // Create gradient for more natural fog effect
          const gradient = ctx.createRadialGradient(
            screenX + tileSize/2, screenY + tileSize/2, 0,
            screenX + tileSize/2, screenY + tileSize/2, tileSize/2
          );
          
          gradient.addColorStop(0, fogColor);
          gradient.addColorStop(1, fogColor.replace(/[\d\.]+\)$/, `${opacity * 0.6})`));
          
          ctx.fillStyle = gradient;
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
          
          ctx.restore();
        }
      }
    }

    // Draw fog edge effects for smoother transitions
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'blur(2px)';
    ctx.restore();

  }, [fogData, animatingTiles, viewportX, viewportY, tileSize, enabled, getVisibleTileRange]);

  // Handle discovery events
  useEffect(() => {
    if (!onDiscovery) return;

    fogData.forEach((fogInfo, tileKey) => {
      if (fogInfo.discovered) {
        const [x, y] = tileKey.split(',').map(Number);
        onDiscovery({
          type: 'tile_discovered',
          location: { x, y },
          timestamp: fogInfo.lastUpdate
        });
      }
    });
  }, [fogData, onDiscovery]);

  if (!enabled) {
    return null;
  }

  return (
    <div className="fog-of-war-renderer relative">
      {/* Main fog canvas */}
      <canvas
        ref={canvasRef}
        width={viewportWidth}
        height={viewportHeight}
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          imageRendering: 'pixelated'
        }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-20"
        >
          Updating visibility...
        </motion.div>
      )}

      {/* Error indicator */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded text-xs z-20"
        >
          Fog Error: {error}
        </motion.div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-20">
          <div>Fog Tiles: {fogData.size}</div>
          <div>Animating: {animatingTiles.size}</div>
          <div>Last Update: {new Date(lastUpdate).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
};

export default FogOfWarRenderer; 
import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid as Grid, VariableSizeList } from 'react-window';
import { motion, AnimatePresence } from 'framer-motion';
import AntVisual from './AntVisual';
import AntStatusBadge from './AntStatusBadge';
import AntTooltip from './AntTooltip';

/**
 * AntRenderer - High-performance ant rendering system
 * Part of Task 15.5: Optimize Ant Rendering for Performance
 */
const AntRenderer = memo(({ 
  ants = [],
  viewport = { width: 800, height: 600 },
  renderMode = 'auto', // 'auto', 'virtualized', 'canvas', 'simple'
  maxVisibleAnts = 1000,
  lodDistances = { high: 200, medium: 500, low: 1000 },
  showTooltips = true,
  showStatusBadges = true,
  onAntClick,
  onAntHover,
  className = ''
}) => {
  const [hoveredAnt, setHoveredAnt] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const [visibleAnts, setVisibleAnts] = useState([]);
  const [viewportBounds, setViewportBounds] = useState({
    left: 0, top: 0, right: viewport.width, bottom: viewport.height
  });

  // Performance metrics tracking
  const [renderStats, setRenderStats] = useState({
    totalAnts: 0,
    visibleAnts: 0,
    renderTime: 0,
    lastUpdate: Date.now()
  });

  // Determine optimal render mode based on ant count
  const optimalRenderMode = useMemo(() => {
    if (renderMode !== 'auto') return renderMode;
    
    if (ants.length < 50) return 'simple';
    if (ants.length < 500) return 'optimized';
    if (ants.length < 2000) return 'virtualized';
    return 'canvas';
  }, [ants.length, renderMode]);

  // Memoized ant processing with LOD
  const processedAnts = useMemo(() => {
    const startTime = performance.now();
    
    // Sort ants by distance for LOD
    const antsWithDistance = ants.map(ant => ({
      ...ant,
      distance: calculateDistance(ant.position, viewportBounds),
      inViewport: isInViewport(ant.position, viewportBounds)
    }));

    // Apply LOD based on distance
    const processedWithLOD = antsWithDistance.map(ant => ({
      ...ant,
      lod: getLODLevel(ant.distance, lodDistances),
      shouldRender: ant.inViewport || ant.distance < lodDistances.low
    }));

    // Limit visible ants for performance
    const visible = processedWithLOD
      .filter(ant => ant.shouldRender)
      .slice(0, maxVisibleAnts);

    const processingTime = performance.now() - startTime;
    
    // Update performance stats
    setRenderStats(prev => ({
      totalAnts: ants.length,
      visibleAnts: visible.length,
      renderTime: processingTime,
      lastUpdate: Date.now()
    }));

    return visible;
  }, [ants, viewportBounds, lodDistances, maxVisibleAnts]);

  // Update visible ants when processed ants change
  useEffect(() => {
    setVisibleAnts(processedAnts);
  }, [processedAnts]);

  // Handle ant interactions
  const handleAntHover = useCallback((ant, event) => {
    if (!showTooltips) return;
    
    setHoveredAnt(ant);
    setTooltipPosition({
      x: event.clientX + 10,
      y: event.clientY - 10
    });
    
    onAntHover && onAntHover(ant, event);
  }, [showTooltips, onAntHover]);

  const handleAntLeave = useCallback(() => {
    setHoveredAnt(null);
  }, []);

  const handleAntClick = useCallback((ant, event) => {
    onAntClick && onAntClick(ant, event);
  }, [onAntClick]);

  // Render based on optimal mode
  const renderContent = () => {
    switch (optimalRenderMode) {
      case 'canvas':
        return <CanvasRenderer 
          ants={visibleAnts} 
          viewport={viewport}
          onAntHover={handleAntHover}
          onAntClick={handleAntClick}
        />;
      
      case 'virtualized':
        return <VirtualizedRenderer
          ants={visibleAnts}
          viewport={viewport}
          onAntHover={handleAntHover}
          onAntClick={handleAntClick}
          onAntLeave={handleAntLeave}
          showStatusBadges={showStatusBadges}
        />;
      
      case 'optimized':
        return <OptimizedRenderer
          ants={visibleAnts}
          onAntHover={handleAntHover}
          onAntClick={handleAntClick}
          onAntLeave={handleAntLeave}
          showStatusBadges={showStatusBadges}
        />;
      
      default:
        return <SimpleRenderer
          ants={visibleAnts}
          onAntHover={handleAntHover}
          onAntClick={handleAntClick}
          onAntLeave={handleAntLeave}
          showStatusBadges={showStatusBadges}
        />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width: viewport.width, height: viewport.height }}
    >
      {/* Performance Monitor */}
      <PerformanceMonitor stats={renderStats} mode={optimalRenderMode} />
      
      {/* Main Renderer */}
      {renderContent()}
      
      {/* Tooltip */}
      {hoveredAnt && showTooltips && (
        <AntTooltip
          ant={hoveredAnt}
          isVisible={true}
          position={tooltipPosition}
          onClose={handleAntLeave}
        />
      )}
    </div>
  );
});

/**
 * CanvasRenderer - High-performance canvas-based rendering for large ant counts
 */
const CanvasRenderer = memo(({ ants, viewport, onAntHover, onAntClick }) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [canvasAnts, setCanvasAnts] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Set canvas size with device pixel ratio
    canvas.width = viewport.width * devicePixelRatio;
    canvas.height = viewport.height * devicePixelRatio;
    canvas.style.width = viewport.width + 'px';
    canvas.style.height = viewport.height + 'px';
    
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, viewport.width, viewport.height);
      
      // Render ants efficiently
      ants.forEach(ant => {
        renderAntToCanvas(ctx, ant);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [ants, viewport]);

  const renderAntToCanvas = (ctx, ant) => {
    const { position, role, health = 100, level = 1, lod } = ant;
    const x = position.x;
    const y = position.y;

    // Simple LOD-based rendering
    if (lod === 'low') {
      // Just a colored dot
      ctx.fillStyle = getRoleColor(role);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    } else if (lod === 'medium') {
      // Basic ant shape
      ctx.fillStyle = getRoleColor(role);
      ctx.fillRect(x - 3, y - 2, 6, 4);
      
      // Health indicator
      if (health < 70) {
        ctx.fillStyle = health < 30 ? '#ef4444' : '#f59e0b';
        ctx.fillRect(x - 3, y - 3, (health / 100) * 6, 1);
      }
    } else {
      // Detailed ant
      drawDetailedAnt(ctx, ant, x, y);
    }
  };

  const drawDetailedAnt = (ctx, ant, x, y) => {
    const { role, health = 100, level = 1 } = ant;
    
    // Body
    ctx.fillStyle = getRoleColor(role);
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Head
    ctx.beginPath();
    ctx.arc(x - 3, y, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Legs (simple lines)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Left legs
    ctx.moveTo(x - 1, y);
    ctx.lineTo(x - 3, y + 3);
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + 3);
    ctx.moveTo(x + 1, y);
    ctx.lineTo(x - 1, y + 3);
    // Right legs
    ctx.moveTo(x - 1, y);
    ctx.lineTo(x - 3, y - 3);
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y - 3);
    ctx.moveTo(x + 1, y);
    ctx.lineTo(x - 1, y - 3);
    ctx.stroke();

    // Level indicator
    if (level > 1) {
      ctx.fillStyle = '#3b82f6';
      ctx.font = '8px Arial';
      ctx.fillText(level.toString(), x + 3, y - 3);
    }
  };

  const handleCanvasClick = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked ant
    const clickedAnt = ants.find(ant => {
      const dx = ant.position.x - x;
      const dy = ant.position.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 10;
    });

    if (clickedAnt && onAntClick) {
      onAntClick(clickedAnt, event);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="cursor-pointer"
    />
  );
});

/**
 * VirtualizedRenderer - React-window based virtualization
 */
const VirtualizedRenderer = memo(({ 
  ants, 
  viewport, 
  onAntHover, 
  onAntClick, 
  onAntLeave,
  showStatusBadges 
}) => {
  const ITEM_SIZE = 50;
  const COLUMNS = Math.floor(viewport.width / ITEM_SIZE);

  const getItemData = useCallback((rowIndex, columnIndex) => {
    const index = rowIndex * COLUMNS + columnIndex;
    return ants[index];
  }, [ants, COLUMNS]);

  const GridItem = memo(({ columnIndex, rowIndex, style }) => {
    const ant = getItemData(rowIndex, columnIndex);
    
    if (!ant) return <div style={style} />;

    return (
      <div style={style} className="flex items-center justify-center">
        <OptimizedAntItem
          ant={ant}
          onHover={onAntHover}
          onClick={onAntClick}
          onLeave={onAntLeave}
          showStatusBadge={showStatusBadges}
          size={ant.lod === 'low' ? 'small' : 'medium'}
        />
      </div>
    );
  });

  const rowCount = Math.ceil(ants.length / COLUMNS);

  return (
    <Grid
      columnCount={COLUMNS}
      columnWidth={ITEM_SIZE}
      height={viewport.height}
      rowCount={rowCount}
      rowHeight={ITEM_SIZE}
      width={viewport.width}
      itemData={{ ants, onAntHover, onAntClick, onAntLeave, showStatusBadges }}
    >
      {GridItem}
    </Grid>
  );
});

/**
 * OptimizedRenderer - Optimized standard rendering with memoization
 */
const OptimizedRenderer = memo(({ 
  ants, 
  onAntHover, 
  onAntClick, 
  onAntLeave,
  showStatusBadges 
}) => {
  // Group ants by LOD for batch rendering
  const antsByLOD = useMemo(() => {
    return ants.reduce((groups, ant) => {
      const lod = ant.lod || 'high';
      if (!groups[lod]) groups[lod] = [];
      groups[lod].push(ant);
      return groups;
    }, {});
  }, [ants]);

  return (
    <div className="relative w-full h-full">
      {/* Render low LOD ants with minimal detail */}
      {antsByLOD.low && (
        <LowLODGroup 
          ants={antsByLOD.low}
          onAntClick={onAntClick}
        />
      )}
      
      {/* Render medium LOD ants */}
      {antsByLOD.medium && antsByLOD.medium.map(ant => (
        <OptimizedAntItem
          key={ant.id}
          ant={ant}
          onHover={onAntHover}
          onClick={onAntClick}
          onLeave={onAntLeave}
          showStatusBadge={false}
          size="small"
        />
      ))}
      
      {/* Render high LOD ants with full detail */}
      {antsByLOD.high && antsByLOD.high.map(ant => (
        <OptimizedAntItem
          key={ant.id}
          ant={ant}
          onHover={onAntHover}
          onClick={onAntClick}
          onLeave={onAntLeave}
          showStatusBadge={showStatusBadges}
          size="medium"
        />
      ))}
    </div>
  );
});

/**
 * SimpleRenderer - Basic rendering without optimizations
 */
const SimpleRenderer = memo(({ 
  ants, 
  onAntHover, 
  onAntClick, 
  onAntLeave,
  showStatusBadges 
}) => {
  return (
    <div className="relative w-full h-full">
      {ants.map(ant => (
        <div
          key={ant.id}
          className="absolute"
          style={{
            left: ant.position?.x || 0,
            top: ant.position?.y || 0,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <AntVisual
            ant={ant}
            size={ant.lod === 'low' ? 'small' : 'medium'}
            showStatus={showStatusBadges}
            onClick={(antData) => onAntClick && onAntClick(antData)}
            onMouseEnter={(e) => onAntHover && onAntHover(ant, e)}
            onMouseLeave={onAntLeave}
          />
        </div>
      ))}
    </div>
  );
});

/**
 * OptimizedAntItem - Memoized ant item with minimal re-renders
 */
const OptimizedAntItem = memo(({ 
  ant, 
  onHover, 
  onClick, 
  onLeave, 
  showStatusBadge,
  size = 'medium'
}) => {
  const handleMouseEnter = useCallback((event) => {
    onHover && onHover(ant, event);
  }, [ant, onHover]);

  const handleClick = useCallback((event) => {
    onClick && onClick(ant, event);
  }, [ant, onClick]);

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: ant.position?.x || 0,
        top: ant.position?.y || 0,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      onClick={handleClick}
    >
      <AntVisual
        ant={ant}
        size={size}
        showStatus={showStatusBadge}
      />
      {showStatusBadge && (
        <AntStatusBadge
          ant={ant}
          size="small"
          position="top-right"
        />
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.ant.id === nextProps.ant.id &&
    prevProps.ant.health === nextProps.ant.health &&
    prevProps.ant.stamina === nextProps.ant.stamina &&
    prevProps.ant.status === nextProps.ant.status &&
    prevProps.ant.level === nextProps.ant.level &&
    prevProps.ant.position?.x === nextProps.ant.position?.x &&
    prevProps.ant.position?.y === nextProps.ant.position?.y &&
    prevProps.size === nextProps.size &&
    prevProps.showStatusBadge === nextProps.showStatusBadge
  );
});

/**
 * LowLODGroup - Batch render low detail ants
 */
const LowLODGroup = memo(({ ants, onAntClick }) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {ants.map(ant => (
        <circle
          key={ant.id}
          cx={ant.position?.x || 0}
          cy={ant.position?.y || 0}
          r={3}
          fill={getRoleColor(ant.role)}
          className="pointer-events-auto cursor-pointer"
          onClick={(e) => onAntClick && onAntClick(ant, e)}
        />
      ))}
    </svg>
  );
});

/**
 * PerformanceMonitor - Shows rendering performance metrics
 */
const PerformanceMonitor = memo(({ stats, mode }) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono">
      <div>Mode: {mode}</div>
      <div>Total: {stats.totalAnts}</div>
      <div>Visible: {stats.visibleAnts}</div>
      <div>Render: {stats.renderTime.toFixed(2)}ms</div>
      <div>FPS: {Math.round(1000 / Math.max(stats.renderTime, 16))}</div>
    </div>
  );
});

// Helper functions
const calculateDistance = (position, bounds) => {
  if (!position) return Infinity;
  
  const centerX = (bounds.left + bounds.right) / 2;
  const centerY = (bounds.top + bounds.bottom) / 2;
  const dx = position.x - centerX;
  const dy = position.y - centerY;
  
  return Math.sqrt(dx * dx + dy * dy);
};

const isInViewport = (position, bounds) => {
  if (!position) return false;
  
  return (
    position.x >= bounds.left &&
    position.x <= bounds.right &&
    position.y >= bounds.top &&
    position.y <= bounds.bottom
  );
};

const getLODLevel = (distance, lodDistances) => {
  if (distance <= lodDistances.high) return 'high';
  if (distance <= lodDistances.medium) return 'medium';
  return 'low';
};

const getRoleColor = (role) => {
  const colors = {
    worker: '#d97706',
    soldier: '#b91c1c',
    scout: '#059669',
    nurse: '#db2777',
    forager: '#ca8a04',
    builder: '#ea580c',
    queen: '#7c3aed'
  };
  return colors[role] || '#6b7280';
};

export default AntRenderer; 
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import colonyService from '../../services/colonyService';
import './CenterPanel.css';

const CenterPanel = ({ colonyId, colonyData, isFullscreen, theme, onToggleFullscreen }) => {
  const [zoomLevel, setZoomLevel] = useState(2.5);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState(null);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showPaths, setShowPaths] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);
  const panStartRef = useRef({ x: 0, y: 0 });
  const mouseStartRef = useRef({ x: 0, y: 0 });
  const hasPannedRef = useRef(false);

  // Load simulation data
  useEffect(() => {
    if (colonyId) {
      loadSimulationData();
      // Set up periodic updates if simulation is playing
      const interval = setInterval(() => {
        if (isPlaying) {
          updateSimulation();
        }
      }, 2000 / simulationSpeed); // Speed affects update frequency
      
      return () => clearInterval(interval);
    }
  }, [colonyId, isPlaying, simulationSpeed]);

  // Auto-center when simulation data is first loaded (only once)
  const [hasAutocentered, setHasAutocentered] = useState(false);
  
  useEffect(() => {
    if (simulationData && canvasRef.current && !hasAutocentered) {
      // Use multiple attempts to ensure centering works
      const attemptCenter = () => {
        const viewport = canvasRef.current?.getBoundingClientRect();
        if (viewport && viewport.width > 0 && viewport.height > 0) {
          console.log('🎯 Auto-centering to colony on initial data load');
          centerToColony();
          setHasAutocentered(true); // Prevent repeated auto-centering
        } else {
          // Retry if viewport not ready
          setTimeout(attemptCenter, 50);
        }
      };
      
      setTimeout(attemptCenter, 100);
    }
  }, [simulationData, hasAutocentered]);

  const loadSimulationData = async () => {
    try {
      setLoading(true);
      // Get colony data and ants
      const [colonyResponse, antsResponse] = await Promise.all([
        colonyService.getColony(colonyId, true),
        colonyService.getColonyAnts(colonyId)
      ]);

      // Generate simulation layout
      const colony = colonyResponse.data;
      // Fix: API returns ants directly in data array, not in data.ants
      const ants = antsResponse.data || [];
      
      console.log('🏛️ Colony data received:', {
        colonyId: colonyId,
        colony: colony,
        population: colony?.population
      });
      
      console.log('🐜 Processing ants for simulation:', {
        colonyId: colonyId,
        antCount: ants.length,
        antsResponse: antsResponse.data,
        ants: ants.map(ant => ({
          id: ant.id,
          name: ant.name,
          role: ant.role,
          position: ant.position,
          health: ant.health,
          energy: ant.energy
        }))
      });
      
      setSimulationData({
        colony: {
          x: 300,
          y: 300,
          size: Math.max(50, Math.min(100, colony.population / 2)),
          population: colony.population || 0,
          name: colony.name,
          efficiency: colony.efficiency || 0.8
        },
        ants: ants.slice(0, Math.min(50, ants.length)).map((ant, index) => {
          // Convert ant grid positions to simulation coordinates
          // Grid positions are small integers, scale them to simulation space
          const baseX = 300; // Colony center X
          const baseY = 300; // Colony center Y
          const scale = 20; // Scale factor for grid positions
          
          const processedAnt = {
            id: ant.id,
            x: baseX + (ant.position?.x || 0) * scale,
            y: baseY + (ant.position?.y || 0) * scale,
            type: ant.role,
            activity: getActivityForRole(ant.role),
            energy: ant.energy || Math.random() * 100,
            targetX: baseX + (ant.position?.x || 0) * scale + (Math.random() - 0.5) * 40,
            targetY: baseY + (ant.position?.y || 0) * scale + (Math.random() - 0.5) * 40,
            speed: getRoleSpeed(ant.role),
            health: ant.health || 100,
            name: ant.name,
            state: ant.state || 'idle'
          };
          
          console.log(`🐜 Processed ant ${index + 1}:`, {
            original: { id: ant.id, name: ant.name, position: ant.position },
            processed: { id: processedAnt.id, x: processedAnt.x, y: processedAnt.y, type: processedAnt.type }
          });
          
          return processedAnt;
        }),
        resources: generateResources(),
        territory: generateTerritory(colony),
        structures: generateStructures()
      });
      
      console.log('✅ Simulation data set with processed ants:', {
        antCount: ants.length,
        processedAnts: ants.slice(0, Math.min(50, ants.length)).map((ant, index) => {
          const baseX = 300;
          const baseY = 300;
          const scale = 20;
          return {
            id: ant.id,
            name: ant.name,
            originalPosition: ant.position,
            simulationX: baseX + (ant.position?.x || 0) * scale,
            simulationY: baseY + (ant.position?.y || 0) * scale,
            role: ant.role
          };
        })
      });
    } catch (error) {
      console.error('Error loading simulation data:', error);
      // Fallback to mock data
      setSimulationData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const updateSimulation = () => {
    if (!simulationData) return;

    setSimulationData(prev => ({
      ...prev,
      ants: prev.ants.map(ant => ({
        ...ant,
        // Move ants towards their targets
        x: ant.x + (ant.targetX - ant.x) * 0.02 * ant.speed,
        y: ant.y + (ant.targetY - ant.y) * 0.02 * ant.speed,
        // Update targets occasionally
        targetX: Math.abs(ant.x - ant.targetX) < 10 ? 
          280 + (Math.random() - 0.5) * 200 : ant.targetX,
        targetY: Math.abs(ant.y - ant.targetY) < 10 ? 
          280 + (Math.random() - 0.5) * 200 : ant.targetY,
        // Update energy
        energy: Math.max(0, Math.min(100, ant.energy + (Math.random() - 0.5) * 5))
      }))
    }));
  };

  // Helper functions
  const getActivityForRole = (role) => {
    const activities = {
      worker: ['foraging', 'carrying', 'digging'],
      soldier: ['patrolling', 'defending', 'guarding'],
      scout: ['exploring', 'scouting', 'mapping'],
      nurse: ['caring', 'feeding', 'cleaning'],
      builder: ['building', 'repairing', 'excavating'],
      forager: ['foraging', 'collecting', 'hunting']
    };
    const roleActivities = activities[role] || ['working'];
    return roleActivities[Math.floor(Math.random() * roleActivities.length)];
  };

  const getRoleSpeed = (role) => {
    const speeds = {
      worker: 1.0,
      soldier: 0.8,
      scout: 1.5,
      nurse: 0.7,
      builder: 0.6,
      forager: 1.2
    };
    return speeds[role] || 1.0;
  };

  const generateResources = () => [
    { id: 1, x: 150, y: 150, type: 'food', amount: 85, maxAmount: 100 },
    { id: 2, x: 450, y: 200, type: 'materials', amount: 60, maxAmount: 80 },
    { id: 3, x: 200, y: 450, type: 'water', amount: 95, maxAmount: 100 },
    { id: 4, x: 400, y: 400, type: 'food', amount: 30, maxAmount: 100 },
    { id: 5, x: 100, y: 350, type: 'materials', amount: 45, maxAmount: 80 }
  ];

  const generateTerritory = (colony) => ({
    boundaries: [
      { x: 50, y: 50 },
      { x: 550, y: 50 },
      { x: 550, y: 550 },
      { x: 50, y: 550 }
    ],
    explored: Math.round((colony.efficiency || 0.8) * 100)
  });

  const generateStructures = () => [
    { id: 1, x: 250, y: 200, type: 'nursery', level: 2 },
    { id: 2, x: 350, y: 250, type: 'storage', level: 1 },
    { id: 3, x: 280, y: 350, type: 'barracks', level: 1 }
  ];

  const generateMockData = () => ({
    colony: {
      x: 300, y: 300, size: 60, population: 150,
      name: 'Mock Colony', efficiency: 0.87
    },
    ants: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      x: 280 + (Math.random() - 0.5) * 100,
      y: 280 + (Math.random() - 0.5) * 100,
      type: ['worker', 'soldier', 'scout', 'nurse', 'builder'][i % 5],
      activity: 'working',
      energy: Math.random() * 100,
      targetX: 280 + (Math.random() - 0.5) * 200,
      targetY: 280 + (Math.random() - 0.5) * 200,
      speed: 1
    })),
    resources: generateResources(),
    territory: { boundaries: [{ x: 50, y: 50 }, { x: 550, y: 50 }, { x: 550, y: 550 }, { x: 50, y: 550 }], explored: 75 },
    structures: generateStructures()
  });

  // Event handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  
  const centerToColony = () => {
    if (!simulationData?.colony) {
      console.log('❌ Cannot center: no simulation data or colony');
      return;
    }
    
    // Get viewport dimensions
    const viewport = canvasRef.current?.getBoundingClientRect();
    if (!viewport) {
      console.log('❌ Cannot center: no viewport');
      return;
    }
    
    // Calculate offset to center colony in viewport
    // With transform order: translate(panX, panY) scale(zoom)
    // Screen point = pan + (world point * zoom)
    // So: pan = screen point - (world point * zoom)
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const colonyWorldX = simulationData.colony.x;
    const colonyWorldY = simulationData.colony.y;
    
    // Set pan offset so that colony appears at center of viewport
    const newPanOffset = {
      x: centerX - (colonyWorldX * zoomLevel),
      y: centerY - (colonyWorldY * zoomLevel)
    };
    
    console.log('🎯 Centering to colony:', {
      viewport: { width: viewport.width, height: viewport.height },
      center: { x: centerX, y: centerY },
      colonyWorld: { x: colonyWorldX, y: colonyWorldY },
      zoomLevel,
      currentPanOffset: panOffset,
      newPanOffset,
      transformOrder: 'translate(pan) scale(zoom)',
      colonyScreenPosition: {
        x: newPanOffset.x + (colonyWorldX * zoomLevel),
        y: newPanOffset.y + (colonyWorldY * zoomLevel)
      }
    });
    
    setPanOffset(newPanOffset);
  };

  const handleResetView = () => {
    setZoomLevel(2.5);
    setSelectedElement(null);
    // Center after zoom is set
    setTimeout(() => {
      centerToColony();
    }, 50);
  };

  const handleMouseDown = (event) => {
    if (event.button === 0) { // Left mouse button for panning
      setIsPanning(true);
      panStartRef.current = { x: event.clientX - panOffset.x, y: event.clientY - panOffset.y };
      mouseStartRef.current = { x: event.clientX, y: event.clientY };
      hasPannedRef.current = false;
      event.preventDefault(); // Prevent text selection
    }
  };

  const handleMouseMove = (event) => {
    if (isPanning) {
      const deltaX = Math.abs(event.clientX - mouseStartRef.current.x);
      const deltaY = Math.abs(event.clientY - mouseStartRef.current.y);
      
      // If mouse has moved more than 5 pixels, consider it panning
      if (deltaX > 5 || deltaY > 5) {
        hasPannedRef.current = true;
      }
      
      setPanOffset({
        x: event.clientX - panStartRef.current.x,
        y: event.clientY - panStartRef.current.y
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (event) => {
    event.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const delta = event.deltaY > 0 ? -0.15 : 0.15;
    const newZoomLevel = Math.max(0.5, Math.min(5.0, zoomLevel + delta));
    
    if (newZoomLevel !== zoomLevel) {
      // Google Maps style zoom: keep the point under the mouse cursor fixed
      // With transform order: translate(panX, panY) scale(zoom)
      // Screen point = pan + (world point * zoom)
      // So: world point = (screen point - pan) / zoom
      
      const worldX = (mouseX - panOffset.x) / zoomLevel;
      const worldY = (mouseY - panOffset.y) / zoomLevel;
      
      // Calculate new pan offset to keep the same world point under the mouse
      // mouseX = newPanX + (worldX * newZoom)
      // newPanX = mouseX - (worldX * newZoom)
      const newPanX = mouseX - (worldX * newZoomLevel);
      const newPanY = mouseY - (worldY * newZoomLevel);
      
      setZoomLevel(newZoomLevel);
      setPanOffset({ x: newPanX, y: newPanY });
    }
  };

  const handleCanvasClick = (event) => {
    // Don't handle clicks if we were panning
    if (hasPannedRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    // Convert screen coordinates to world coordinates
    // With transform: translate(panX, panY) scale(zoom)
    // Screen point = pan + (world point * zoom)
    // So: world point = (screen point - pan) / zoom
    const x = (event.clientX - rect.left - panOffset.x) / zoomLevel;
    const y = (event.clientY - rect.top - panOffset.y) / zoomLevel;
    
    let clickedElement = null;
    
    if (simulationData) {
      // Check colony
      const colonyDistance = Math.sqrt(
        Math.pow(x - simulationData.colony.x, 2) + 
        Math.pow(y - simulationData.colony.y, 2)
      );
      if (colonyDistance <= simulationData.colony.size) {
        clickedElement = { type: 'colony', data: simulationData.colony };
      }
      
      // Check ants
      simulationData.ants.forEach(ant => {
        const distance = Math.sqrt(Math.pow(x - ant.x, 2) + Math.pow(y - ant.y, 2));
        if (distance <= 15) {
          clickedElement = { type: 'ant', data: ant };
        }
      });
      
      // Check resources
      simulationData.resources.forEach(resource => {
        const distance = Math.sqrt(Math.pow(x - resource.x, 2) + Math.pow(y - resource.y, 2));
        if (distance <= 25) {
          clickedElement = { type: 'resource', data: resource };
        }
      });

      // Check structures
      simulationData.structures.forEach(structure => {
        const distance = Math.sqrt(Math.pow(x - structure.x, 2) + Math.pow(y - structure.y, 2));
        if (distance <= 30) {
          clickedElement = { type: 'structure', data: structure };
        }
      });
    }
    
    setSelectedElement(clickedElement);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      
      switch (event.key) {
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleResetView();
          break;
        case 'c':
        case 'C':
          console.log('🎯 Manual center keyboard shortcut pressed');
          centerToColony();
          break;
        case ' ':
          event.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'g':
        case 'G':
          setShowGrid(!showGrid);
          break;
        case 'p':
        case 'P':
          setShowPaths(!showPaths);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showGrid, showPaths, isPlaying]);

  // Render functions
  const renderSimulation = () => {
    if (!simulationData) return null;

    // Proper transform order: translate first, then scale
    const transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
    
    return (
      <div className="simulation-content" style={{ transform }}>
        {/* Grid overlay */}
        {showGrid && <div className="grid-overlay" />}
        
        {/* Territory boundaries */}
        <div className="territory-boundary" style={{
          left: simulationData.territory.boundaries[0].x,
          top: simulationData.territory.boundaries[0].y,
          width: simulationData.territory.boundaries[1].x - simulationData.territory.boundaries[0].x,
          height: simulationData.territory.boundaries[2].y - simulationData.territory.boundaries[0].y
        }} />
        
        {/* Ant paths */}
        {showPaths && (
          <div className="ant-paths">
            {simulationData.ants.map(ant => (
              <div
                key={`path-${ant.id}`}
                className="ant-path"
                style={{
                  left: Math.min(ant.x, ant.targetX),
                  top: Math.min(ant.y, ant.targetY),
                  width: Math.abs(ant.targetX - ant.x),
                  height: Math.abs(ant.targetY - ant.y)
                }}
              />
            ))}
          </div>
        )}
        
        {/* Structures */}
        {simulationData.structures.map(structure => (
          <div
            key={structure.id}
            className={`structure ${structure.type} ${selectedElement?.data?.id === structure.id ? 'selected' : ''}`}
            style={{ left: structure.x, top: structure.y }}
            title={`${structure.type} (Level ${structure.level})`}
          >
            {structure.type === 'nursery' && '🏥'}
            {structure.type === 'storage' && '📦'}
            {structure.type === 'barracks' && '🏰'}
            <div className="structure-level">L{structure.level}</div>
          </div>
        ))}
        
        {/* Colony */}
        <div 
          className={`colony-center ${selectedElement?.type === 'colony' ? 'selected' : ''}`}
          style={{
            left: simulationData.colony.x - simulationData.colony.size / 2,
            top: simulationData.colony.y - simulationData.colony.size / 2,
            width: simulationData.colony.size,
            height: simulationData.colony.size
          }}
          title={`${simulationData.colony.name} - ${simulationData.colony.population} ants`}
        >
          <div className="colony-core">🏛️</div>
          <div className="population-indicator">{simulationData.colony.population}</div>
          <div className="efficiency-ring" style={{
            background: `conic-gradient(#10b981 ${simulationData.colony.efficiency * 360}deg, rgba(156, 163, 175, 0.2) 0deg)`
          }} />
        </div>
        
        {/* Ants */}
        <AnimatePresence>
          {simulationData.ants.map(ant => (
            <motion.div
              key={ant.id}
              className={`ant-unit ${ant.type} ${selectedElement?.data?.id === ant.id ? 'selected' : ''}`}
              style={{ 
                left: ant.x - 8, 
                top: ant.y - 8,
                opacity: ant.energy / 100
              }}
              animate={{ 
                x: 0, 
                y: 0,
                rotate: Math.atan2(ant.targetY - ant.y, ant.targetX - ant.x) * 180 / Math.PI
              }}
              transition={{ duration: 0.5 }}
              title={`${ant.type} - ${ant.activity} (${Math.round(ant.energy)}% energy)`}
            >
              <div className="ant-sprite">🐜</div>
              <div className="ant-energy-bar">
                <div className="energy-fill" style={{ width: `${ant.energy}%` }} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Resources */}
        {simulationData.resources.map(resource => (
          <div
            key={resource.id}
            className={`resource-node ${resource.type} ${selectedElement?.data?.id === resource.id ? 'selected' : ''}`}
            style={{ left: resource.x - 20, top: resource.y - 20 }}
            title={`${resource.type}: ${resource.amount}/${resource.maxAmount} units`}
          >
            <div className="resource-icon">
              {resource.type === 'food' && '🍯'}
              {resource.type === 'materials' && '🪨'}
              {resource.type === 'water' && '💧'}
            </div>
            <div className="resource-amount">{resource.amount}</div>
            <div className="resource-bar">
              <div className="resource-fill" style={{ 
                width: `${(resource.amount / resource.maxAmount) * 100}%` 
              }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`center-panel ${theme} ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="simulation-loading">
          <motion.div
            className="loading-ant"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            🐜
          </motion.div>
          <p>Loading simulation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`center-panel ${theme} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Panel Header */}
      <div className="simulation-header">
        <div className="header-left">
          <h2 className="simulation-title">
            <span className="title-icon">🌍</span>
            Simulation View
            {simulationData && <span className="colony-name">- {simulationData.colony.name}</span>}
          </h2>
          <div className="simulation-status">
            <span className={`status-indicator ${isPlaying ? 'active' : 'paused'}`}></span>
            <span className="status-text">{isPlaying ? 'Running' : 'Paused'}</span>
            <span className="speed-indicator">×{simulationSpeed}</span>
          </div>
        </div>
        
        <div className="header-controls">
          {/* Simulation Controls */}
          <div className="simulation-controls">
            <button 
              className={`control-button ${isPlaying ? 'active' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              title="Play/Pause (Space)"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <select 
              className="speed-select"
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              title="Simulation Speed"
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
            </select>
          </div>
          
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button 
              className="control-button"
              onClick={handleZoomOut}
              title="Zoom Out (-)"
            >
              🔍−
            </button>
            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
            <button 
              className="control-button"
              onClick={handleZoomIn}
              title="Zoom In (+)"
            >
              🔍+
            </button>
          </div>
          
          {/* View Controls */}
          <div className="view-controls">
            <button 
              className="control-button"
              onClick={() => {
                console.log('🎯 Manual center button clicked');
                centerToColony();
              }}
              title="Center to Colony (C)"
            >
              🎯
            </button>
            <button 
              className="control-button"
              onClick={handleResetView}
              title="Reset View & Center (R)"
            >
              🔄
            </button>
            <button 
              className={`control-button ${showGrid ? 'active' : ''}`}
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid (G)"
            >
              #
            </button>
            <button 
              className={`control-button ${showPaths ? 'active' : ''}`}
              onClick={() => setShowPaths(!showPaths)}
              title="Toggle Paths (P)"
            >
              🛤️
            </button>
            <button 
              className="control-button"
              onClick={onToggleFullscreen}
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? '🔲' : '⛶'}
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Canvas */}
      <div 
        className="simulation-viewport"
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {renderSimulation()}
        
        {/* Minimap */}
        <div className="minimap">
          <div className="minimap-content">
            <div className="minimap-viewport" style={{
              left: `${-panOffset.x / 5}px`,
              top: `${-panOffset.y / 5}px`,
              width: `${100 / zoomLevel}px`,
              height: `${80 / zoomLevel}px`
            }} />
          </div>
        </div>
      </div>

      {/* Selection Info Panel */}
      <AnimatePresence>
        {selectedElement && (
          <motion.div
            className="selection-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <div className="info-header">
              <h3>{selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Details</h3>
              <button onClick={() => setSelectedElement(null)}>×</button>
            </div>
            <div className="info-content">
              {selectedElement.type === 'colony' && (
                <>
                  <p><strong>Name:</strong> {selectedElement.data.name}</p>
                  <p><strong>Population:</strong> {selectedElement.data.population}</p>
                  <p><strong>Efficiency:</strong> {Math.round(selectedElement.data.efficiency * 100)}%</p>
                </>
              )}
              {selectedElement.type === 'ant' && (
                <>
                  <p><strong>Role:</strong> {selectedElement.data.type}</p>
                  <p><strong>Activity:</strong> {selectedElement.data.activity}</p>
                  <p><strong>Energy:</strong> {Math.round(selectedElement.data.energy)}%</p>
                </>
              )}
              {selectedElement.type === 'resource' && (
                <>
                  <p><strong>Type:</strong> {selectedElement.data.type}</p>
                  <p><strong>Amount:</strong> {selectedElement.data.amount}/{selectedElement.data.maxAmount}</p>
                  <p><strong>Status:</strong> {selectedElement.data.amount > 20 ? 'Abundant' : 'Low'}</p>
                </>
              )}
              {selectedElement.type === 'structure' && (
                <>
                  <p><strong>Type:</strong> {selectedElement.data.type}</p>
                  <p><strong>Level:</strong> {selectedElement.data.level}</p>
                  <p><strong>Status:</strong> Active</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overlay */}
      <div className="stats-overlay">
        {simulationData && (
          <>
            <div className="stat-item">
              <span className="stat-label">Ants:</span>
              <span className="stat-value">{simulationData.colony.population}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Resources:</span>
              <span className="stat-value">{simulationData.resources.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Territory:</span>
              <span className="stat-value">{simulationData.territory.explored}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CenterPanel; 
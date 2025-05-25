import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StructurePlacementConfirmationModal from './StructurePlacementConfirmationModal';

const StructureMap = ({ colonyId, onStructureSelect, selectedStructureType }) => {
  const [structures, setStructures] = useState([]);
  const [gridSize] = useState(20); // 20x20 grid
  const [cellSize] = useState(30); // 30px per cell
  const [hoveredCell, setHoveredCell] = useState(null);
  const [placementMode, setPlacementMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [colonyResources, setColonyResources] = useState({});
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [dragPreview, setDragPreview] = useState(null);
  
  const mapRef = useRef(null);

  useEffect(() => {
    if (colonyId) {
      fetchStructures();
      fetchColonyResources();
    }
  }, [colonyId]);

  useEffect(() => {
    setPlacementMode(!!selectedStructureType);
  }, [selectedStructureType]);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/colonies/${colonyId}/structures`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch structures');
      }
      
      const data = await response.json();
      setStructures(data.data.structures || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching structures:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchColonyResources = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/colonies/${colonyId}/resources`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch colony resources');
      }
      
      const data = await response.json();
      const resourceMap = {};
      if (data.data && data.data.resources) {
        data.data.resources.forEach(resource => {
          resourceMap[resource.type] = resource.amount;
        });
      }
      setColonyResources(resourceMap);
    } catch (err) {
      console.error('Error fetching colony resources:', err);
    }
  };

  const isValidPlacement = (x, y, structureType = selectedStructureType) => {
    if (!structureType) return false;
    
    // Check if cell is within bounds
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return false;
    
    // Check if cell is already occupied
    const isOccupied = structures.some(structure => 
      structure.position.x === x && structure.position.y === y
    );
    
    if (isOccupied) return false;
    
    // Check structure-specific placement rules
    const structureTypes = {
      'GUARD_POST': { requiresPerimeter: true },
      'TUNNEL_SYSTEM': { requiresUnderground: true },
      'FARM_CHAMBER': { requiresWater: true },
      'QUEEN_CHAMBER': { requiresCenter: true, unique: true }
    };
    
    const rules = structureTypes[structureType];
    if (rules) {
      // Queen chamber should be near center
      if (rules.requiresCenter) {
        const centerX = Math.floor(gridSize / 2);
        const centerY = Math.floor(gridSize / 2);
        const distance = Math.abs(x - centerX) + Math.abs(y - centerY);
        if (distance > 3) return false;
      }
      
      // Guard posts should be on perimeter
      if (rules.requiresPerimeter) {
        const isPerimeter = x === 0 || x === gridSize - 1 || y === 0 || y === gridSize - 1;
        if (!isPerimeter) return false;
      }
      
      // Check if unique structure already exists
      if (rules.unique) {
        const existsAlready = structures.some(s => s.type === structureType);
        if (existsAlready) return false;
      }
    }
    
    return true;
  };

  const getGridPositionFromMouseEvent = (event) => {
    if (!mapRef.current) return null;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellSize);
    const y = Math.floor((event.clientY - rect.top) / cellSize);
    
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      return { x, y };
    }
    return null;
  };

  const handleMouseMove = (event) => {
    if (isDragging && selectedStructureType) {
      const gridPos = getGridPositionFromMouseEvent(event);
      if (gridPos) {
        setDragPreview(gridPos);
      }
    }
  };

  const handleMouseDown = (event) => {
    if (placementMode && selectedStructureType) {
      setIsDragging(true);
      const gridPos = getGridPositionFromMouseEvent(event);
      if (gridPos) {
        setDragPreview(gridPos);
      }
    }
  };

  const handleMouseUp = (event) => {
    if (isDragging && selectedStructureType) {
      const gridPos = getGridPositionFromMouseEvent(event);
      if (gridPos && isValidPlacement(gridPos.x, gridPos.y)) {
        // Show confirmation modal instead of placing directly
        setPendingPlacement({ x: gridPos.x, y: gridPos.y });
        setShowConfirmation(true);
      }
      setIsDragging(false);
      setDragPreview(null);
    }
  };

  const handleCellClick = async (x, y) => {
    if (!placementMode || !selectedStructureType) return;
    
    if (!isValidPlacement(x, y)) {
      // Show error feedback
      if (window.notificationSystem) {
        window.notificationSystem.showError('Invalid Placement', 'Cannot place structure at this location');
      }
      return;
    }
    
    // Show confirmation modal
    setPendingPlacement({ x, y });
    setShowConfirmation(true);
  };

  const handleConfirmPlacement = async (placementData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/colonies/${colonyId}/structures`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: placementData.type,
            position_x: placementData.position.x,
            position_y: placementData.position.y,
            level: 1,
            workers_assigned: 1
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place structure');
      }
      
      const data = await response.json();
      
      // Add new structure to state
      setStructures(prev => [...prev, data.data.structure]);
      
      // Update colony resources
      await fetchColonyResources();
      
      // Reset placement mode
      setPlacementMode(false);
      setShowConfirmation(false);
      setPendingPlacement(null);
      
      if (onStructureSelect) {
        onStructureSelect(null);
      }
      
      if (window.notificationSystem) {
        window.notificationSystem.showSuccess(
          'Structure Built', 
          `${placementData.structure.name} construction started successfully!`
        );
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error placing structure:', err);
      
      if (window.notificationSystem) {
        window.notificationSystem.showError('Construction Failed', err.message);
      }
    }
  };

  const handleStructureClick = (structure) => {
    if (onStructureSelect) {
      onStructureSelect(structure);
    }
  };

  const getCellStyle = (x, y) => {
    const baseStyle = "relative border border-earth-200 cursor-pointer transition-all duration-200";
    
    // Check if cell is occupied
    const structure = structures.find(s => s.position.x === x && s.position.y === y);
    if (structure) {
      return `${baseStyle} bg-forest-200 border-forest-400`;
    }
    
    // Check if cell is drag preview
    if (dragPreview && dragPreview.x === x && dragPreview.y === y && isDragging) {
      if (isValidPlacement(x, y)) {
        return `${baseStyle} bg-green-200 border-green-500 shadow-lg`;
      } else {
        return `${baseStyle} bg-red-200 border-red-500 shadow-lg`;
      }
    }
    
    // Check if cell is hovered
    if (hoveredCell && hoveredCell.x === x && hoveredCell.y === y) {
      if (placementMode && isValidPlacement(x, y)) {
        return `${baseStyle} bg-green-100 border-green-400`;
      } else if (placementMode) {
        return `${baseStyle} bg-red-100 border-red-400`;
      } else {
        return `${baseStyle} bg-earth-100 border-earth-300`;
      }
    }
    
    // Default style
    return `${baseStyle} bg-earth-50 hover:bg-earth-100`;
  };

  const getStructureIcon = (structureType) => {
    const icons = {
      'FOOD_STORAGE': '🏪',
      'WATER_RESERVOIR': '💧',
      'MINERAL_STOCKPILE': '⛏️',
      'NURSERY': '🍼',
      'FARM_CHAMBER': '🍄',
      'WORKSHOP': '🔨',
      'GUARD_POST': '🏰',
      'BARRICADE': '🚧',
      'TUNNEL_SYSTEM': '🕳️',
      'LABORATORY': '🔬',
      'QUEEN_CHAMBER': '👑',
      'COMMUNICATION_HUB': '📡'
    };
    return icons[structureType] || '🏗️';
  };

  const getConstructionProgress = (structure) => {
    if (structure.status.construction_progress >= 100) return null;
    return (
      <div 
        className="absolute bottom-0 left-0 bg-blue-500 h-1 transition-all duration-300"
        style={{ width: `${structure.status.construction_progress}%` }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-4xl"
        >
          🏗️
        </motion.div>
        <div className="ml-4 text-lg text-forest-700">Loading colony map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-red-800 font-medium mb-2">Failed to load colony map</div>
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={fetchStructures}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-earth-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-forest-800">Colony Map</h3>
          <p className="text-earth-600 text-sm">
            {placementMode 
              ? `Click or drag to place ${selectedStructureType}` 
              : 'Click on structures to manage them'
            }
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-earth-600">
            Structures: {structures.filter(s => s.status.is_active).length} active
          </div>
          <div className="text-sm text-earth-600">
            Under construction: {structures.filter(s => s.status.construction_progress < 100).length}
          </div>
        </div>
      </div>

      {/* Map Grid */}
      <div 
        ref={mapRef}
        className="inline-block border-2 border-earth-300 rounded-lg overflow-hidden bg-gradient-to-br from-amber-50 to-earth-100 select-none"
        style={{
          width: gridSize * cellSize,
          height: gridSize * cellSize,
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setDragPreview(null);
        }}
      >
        <div 
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
          }}
        >
          {Array.from({ length: gridSize * gridSize }, (_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const structure = structures.find(s => s.position.x === x && s.position.y === y);
            
            return (
              <motion.div
                key={`${x}-${y}`}
                className={getCellStyle(x, y)}
                style={{ width: cellSize, height: cellSize }}
                onMouseEnter={() => !isDragging && setHoveredCell({ x, y })}
                onMouseLeave={() => !isDragging && setHoveredCell(null)}
                onClick={() => structure ? handleStructureClick(structure) : handleCellClick(x, y)}
                whileHover={!isDragging ? { scale: 1.05 } : {}}
                whileTap={!isDragging ? { scale: 0.95 } : {}}
              >
                {/* Structure Icon */}
                {structure && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center text-lg"
                  >
                    <div className="relative">
                      {getStructureIcon(structure.type)}
                      {/* Health indicator */}
                      {structure.status.health < 100 && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </div>
                  </motion.div>
                )}
                
                {/* Construction Progress */}
                {structure && getConstructionProgress(structure)}
                
                {/* Placement Preview */}
                {placementMode && hoveredCell && hoveredCell.x === x && hoveredCell.y === y && 
                 !structure && !isDragging && isValidPlacement(x, y) && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.7 }}
                    className="absolute inset-0 flex items-center justify-center text-lg text-green-600"
                  >
                    {getStructureIcon(selectedStructureType)}
                  </motion.div>
                )}
                
                {/* Drag Preview */}
                {dragPreview && dragPreview.x === x && dragPreview.y === y && isDragging && !structure && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 0.8 }}
                    className={`absolute inset-0 flex items-center justify-center text-lg ${
                      isValidPlacement(x, y) ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {getStructureIcon(selectedStructureType)}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Map Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-forest-200 border border-forest-400 rounded mr-2" />
          <span className="text-earth-600">Active Structure</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-earth-100 border border-earth-300 rounded mr-2" />
          <span className="text-earth-600">Empty Space</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 border border-green-400 rounded mr-2" />
          <span className="text-earth-600">Valid Placement</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-100 border border-red-400 rounded mr-2" />
          <span className="text-earth-600">Invalid Placement</span>
        </div>
        {placementMode && (
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 border border-green-500 rounded mr-2" />
            <span className="text-earth-600">Drag Preview</span>
          </div>
        )}
      </div>

      {/* Placement Instructions */}
      {placementMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">💡</span>
            <div className="text-blue-800 text-sm">
              <strong>Placement Tips:</strong> Click a valid cell to place, or click and drag to preview placement. 
              A confirmation dialog will show resource costs before construction begins.
            </div>
          </div>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      <StructurePlacementConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPendingPlacement(null);
        }}
        onConfirm={handleConfirmPlacement}
        structureType={selectedStructureType}
        position={pendingPlacement}
        colonyId={colonyId}
        colonyResources={colonyResources}
      />
    </div>
  );
};

export default StructureMap; 
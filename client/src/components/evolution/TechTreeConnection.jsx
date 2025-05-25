import React from 'react';
import { motion } from 'framer-motion';

const TechTreeConnection = ({ from, to, isActive, fromTech, toTech }) => {
  // Calculate the path between two points
  const calculatePath = () => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Create a curved path for better visual appeal
    const midX = from.x + dx * 0.5;
    const midY = from.y + dy * 0.5;
    
    // Add some curve based on the distance
    const curveOffset = Math.min(Math.abs(dx) * 0.3, 50);
    const controlX1 = from.x + curveOffset;
    const controlY1 = from.y;
    const controlX2 = to.x - curveOffset;
    const controlY2 = to.y;
    
    return `M ${from.x} ${from.y} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${to.x} ${to.y}`;
  };

  // Get connection styling based on status
  const getConnectionStyle = () => {
    if (isActive) {
      return {
        stroke: '#4CAF50',
        strokeWidth: 3,
        opacity: 0.8
      };
    } else {
      return {
        stroke: '#666',
        strokeWidth: 2,
        opacity: 0.4
      };
    }
  };

  const pathData = calculatePath();
  const style = getConnectionStyle();

  return (
    <g className="tech-tree-connection">
      {/* Background path for better visibility */}
      <motion.path
        d={pathData}
        fill="none"
        stroke="#000"
        strokeWidth={style.strokeWidth + 2}
        opacity={0.2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Main connection path */}
      <motion.path
        d={pathData}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        opacity={style.opacity}
        strokeDasharray={isActive ? "none" : "5,5"}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
      />
      
      {/* Animated flow effect for active connections */}
      {isActive && (
        <motion.circle
          r="4"
          fill="#4CAF50"
          opacity={0.8}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={pathData}
          />
        </motion.circle>
      )}
      
      {/* Arrow head */}
      <motion.polygon
        points={`${to.x-8},${to.y-4} ${to.x},${to.y} ${to.x-8},${to.y+4}`}
        fill={style.stroke}
        opacity={style.opacity}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1 }}
      />
    </g>
  );
};

export default TechTreeConnection; 
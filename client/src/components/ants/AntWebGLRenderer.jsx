import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useAntPerformanceMonitor } from './AntPerformanceOptimizer';

/**
 * AntWebGLRenderer - High-performance WebGL-based ant rendering
 * Part of Task 15.5: Optimize Ant Rendering for Performance
 * 
 * Uses WebGL for hardware-accelerated rendering of large ant populations
 */
const AntWebGLRenderer = React.memo(({
  ants = [],
  viewport = { width: 800, height: 600 },
  camera = { x: 0, y: 0, zoom: 1 },
  onAntClick,
  onAntHover,
  showDebugInfo = false
}) => {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const buffersRef = useRef({});
  const uniformsRef = useRef({});
  const animationFrameRef = useRef(null);
  const { recordFrame, getPerformanceStats } = useAntPerformanceMonitor();

  // Vertex shader for ant rendering
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_antPosition;
    attribute float a_antSize;
    attribute vec3 a_antColor;
    attribute float a_antRotation;
    attribute float a_antHealth;
    
    uniform vec2 u_resolution;
    uniform vec2 u_camera;
    uniform float u_zoom;
    
    varying vec3 v_color;
    varying float v_health;
    varying vec2 v_position;
    
    void main() {
      // Transform ant position relative to camera
      vec2 worldPos = a_antPosition - u_camera;
      vec2 scaledPos = worldPos * u_zoom;
      
      // Apply ant size and rotation
      float cos_r = cos(a_antRotation);
      float sin_r = sin(a_antRotation);
      vec2 rotatedPos = vec2(
        a_position.x * cos_r - a_position.y * sin_r,
        a_position.x * sin_r + a_position.y * cos_r
      ) * a_antSize;
      
      vec2 finalPos = scaledPos + rotatedPos;
      
      // Convert to clip space
      vec2 clipSpace = ((finalPos / u_resolution) * 2.0) - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      
      v_color = a_antColor;
      v_health = a_antHealth;
      v_position = a_position;
    }
  `;

  // Fragment shader for ant rendering
  const fragmentShaderSource = `
    precision mediump float;
    
    varying vec3 v_color;
    varying float v_health;
    varying vec2 v_position;
    
    void main() {
      // Create ant body shape
      float dist = length(v_position);
      float antBody = smoothstep(0.8, 0.6, dist);
      
      // Add health-based color modification
      vec3 healthColor = mix(vec3(1.0, 0.2, 0.2), v_color, v_health);
      
      // Add some shading
      float shading = 1.0 - (dist * 0.3);
      
      gl_FragColor = vec4(healthColor * shading, antBody);
    }
  `;

  // Initialize WebGL context and shaders
  const initWebGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.warn('WebGL not supported, falling back to canvas rendering');
      return false;
    }

    glRef.current = gl;

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return false;
    }

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.error('Failed to create shader program');
      return false;
    }

    programRef.current = program;

    // Get attribute and uniform locations
    const attributes = {
      position: gl.getAttribLocation(program, 'a_position'),
      antPosition: gl.getAttribLocation(program, 'a_antPosition'),
      antSize: gl.getAttribLocation(program, 'a_antSize'),
      antColor: gl.getAttribLocation(program, 'a_antColor'),
      antRotation: gl.getAttribLocation(program, 'a_antRotation'),
      antHealth: gl.getAttribLocation(program, 'a_antHealth')
    };

    const uniforms = {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      camera: gl.getUniformLocation(program, 'u_camera'),
      zoom: gl.getUniformLocation(program, 'u_zoom')
    };

    uniformsRef.current = { attributes, uniforms };

    // Create buffers
    createBuffers(gl);

    return true;
  }, []);

  // Create shader helper function
  const createShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  // Create program helper function
  const createProgram = (gl, vertexShader, fragmentShader) => {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  };

  // Create buffers for ant data
  const createBuffers = (gl) => {
    // Ant quad vertices (for each ant instance)
    const quadVertices = new Float32Array([
      -1, -1,  // Bottom left
       1, -1,  // Bottom right
      -1,  1,  // Top left
       1, -1,  // Bottom right
       1,  1,  // Top right
      -1,  1   // Top left
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    // Instance data buffers (will be updated each frame)
    const antPositionBuffer = gl.createBuffer();
    const antSizeBuffer = gl.createBuffer();
    const antColorBuffer = gl.createBuffer();
    const antRotationBuffer = gl.createBuffer();
    const antHealthBuffer = gl.createBuffer();

    buffersRef.current = {
      position: positionBuffer,
      antPosition: antPositionBuffer,
      antSize: antSizeBuffer,
      antColor: antColorBuffer,
      antRotation: antRotationBuffer,
      antHealth: antHealthBuffer
    };
  };

  // Update ant data in buffers
  const updateAntData = useCallback((ants) => {
    const gl = glRef.current;
    if (!gl || !ants.length) return;

    const antCount = ants.length;
    const positions = new Float32Array(antCount * 2);
    const sizes = new Float32Array(antCount);
    const colors = new Float32Array(antCount * 3);
    const rotations = new Float32Array(antCount);
    const healths = new Float32Array(antCount);

    // Fill arrays with ant data
    ants.forEach((ant, i) => {
      const pos = ant.position || { x: 0, y: 0 };
      positions[i * 2] = pos.x;
      positions[i * 2 + 1] = pos.y;

      sizes[i] = getAntSize(ant);
      
      const color = getAntColor(ant.role);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      rotations[i] = ant.rotation || 0;
      healths[i] = (ant.health || 100) / 100;
    });

    // Update buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.antPosition);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.antSize);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.antColor);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.antRotation);
    gl.bufferData(gl.ARRAY_BUFFER, rotations, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.antHealth);
    gl.bufferData(gl.ARRAY_BUFFER, healths, gl.DYNAMIC_DRAW);
  }, []);

  // Render frame
  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const { attributes, uniforms } = uniformsRef.current;

    if (!gl || !program) return;

    recordFrame();

    // Set viewport
    gl.viewport(0, 0, viewport.width, viewport.height);
    
    // Clear canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Use shader program
    gl.useProgram(program);

    // Set uniforms
    gl.uniform2f(uniforms.resolution, viewport.width, viewport.height);
    gl.uniform2f(uniforms.camera, camera.x, camera.y);
    gl.uniform1f(uniforms.zoom, camera.zoom);

    // Bind position buffer (quad vertices)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffersRef.current.position);
    gl.enableVertexAttribArray(attributes.position);
    gl.vertexAttribPointer(attributes.position, 2, gl.FLOAT, false, 0, 0);

    // Set up instanced attributes
    setupInstancedAttribute(gl, attributes.antPosition, buffersRef.current.antPosition, 2);
    setupInstancedAttribute(gl, attributes.antSize, buffersRef.current.antSize, 1);
    setupInstancedAttribute(gl, attributes.antColor, buffersRef.current.antColor, 3);
    setupInstancedAttribute(gl, attributes.antRotation, buffersRef.current.antRotation, 1);
    setupInstancedAttribute(gl, attributes.antHealth, buffersRef.current.antHealth, 1);

    // Draw instanced
    const antCount = ants.length;
    if (antCount > 0) {
      // Draw 6 vertices (2 triangles) for each ant instance
      for (let i = 0; i < antCount; i++) {
        // Update instance-specific uniforms if needed
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }
  }, [ants, viewport, camera, recordFrame]);

  // Setup instanced attribute helper
  const setupInstancedAttribute = (gl, location, buffer, size) => {
    if (location === -1) return;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  };

  // Get ant size based on role and level
  const getAntSize = (ant) => {
    const baseSizes = {
      worker: 8,
      soldier: 12,
      scout: 6,
      nurse: 10,
      forager: 9,
      builder: 11,
      queen: 20
    };
    
    const baseSize = baseSizes[ant.role] || 8;
    const levelMultiplier = 1 + (ant.level || 1) * 0.1;
    return baseSize * levelMultiplier;
  };

  // Get ant color based on role
  const getAntColor = (role) => {
    const colors = {
      worker: { r: 0.85, g: 0.47, b: 0.02 },
      soldier: { r: 0.73, g: 0.11, b: 0.11 },
      scout: { r: 0.02, g: 0.59, b: 0.41 },
      nurse: { r: 0.86, g: 0.16, b: 0.47 },
      forager: { r: 0.79, g: 0.54, b: 0.02 },
      builder: { r: 0.92, g: 0.35, b: 0.05 },
      queen: { r: 0.49, g: 0.23, b: 0.93 }
    };
    return colors[role] || { r: 0.42, g: 0.45, b: 0.5 };
  };

  // Handle canvas click for ant selection
  const handleCanvasClick = useCallback((event) => {
    if (!onAntClick) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / camera.zoom + camera.x;
    const y = (event.clientY - rect.top) / camera.zoom + camera.y;

    // Find closest ant to click position
    let closestAnt = null;
    let closestDistance = Infinity;

    ants.forEach(ant => {
      if (!ant.position) return;
      
      const dx = ant.position.x - x;
      const dy = ant.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 15 && distance < closestDistance) {
        closestAnt = ant;
        closestDistance = distance;
      }
    });

    if (closestAnt) {
      onAntClick(closestAnt, event);
    }
  }, [ants, camera, onAntClick]);

  // Animation loop
  useEffect(() => {
    if (!glRef.current) return;

    const animate = () => {
      updateAntData(ants);
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [ants, updateAntData, render]);

  // Initialize WebGL on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (!initWebGL()) {
      console.warn('WebGL initialization failed');
    }
  }, [viewport, initWebGL]);

  // Performance stats for debugging
  const performanceStats = useMemo(() => {
    if (!showDebugInfo) return null;
    return getPerformanceStats();
  }, [showDebugInfo, getPerformanceStats]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={viewport.width}
        height={viewport.height}
        onClick={handleCanvasClick}
        className="cursor-pointer"
        style={{ width: viewport.width, height: viewport.height }}
      />
      
      {showDebugInfo && performanceStats && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded font-mono">
          <div>WebGL Renderer</div>
          <div>Ants: {ants.length}</div>
          <div>FPS: {performanceStats.fps}</div>
          <div>Frame: {performanceStats.avgFrameTime}ms</div>
        </div>
      )}
    </div>
  );
});

AntWebGLRenderer.displayName = 'AntWebGLRenderer';

export default AntWebGLRenderer; 
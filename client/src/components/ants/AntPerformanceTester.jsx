import React, { useState, useRef, useCallback, useEffect } from 'react';
import AntRenderer from './AntRenderer';
import AntWebGLRenderer from './AntWebGLRenderer';
import { useAntPerformanceMonitor } from './AntPerformanceOptimizer';

/**
 * AntPerformanceTester - Performance testing and benchmarking utility
 * Part of Task 15.5: Optimize Ant Rendering for Performance
 */
const AntPerformanceTester = () => {
  const [testConfig, setTestConfig] = useState({
    antCount: 100,
    renderMode: 'auto',
    testDuration: 10, // seconds
    viewport: { width: 800, height: 600 },
    enableMovement: true,
    enableStatusUpdates: true,
    showTooltips: false,
    showStatusBadges: true
  });

  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState(null);
  const [testAnts, setTestAnts] = useState([]);
  
  const testStartTimeRef = useRef(null);
  const frameCountRef = useRef(0);
  const performanceDataRef = useRef([]);
  const { recordFrame, getPerformanceStats } = useAntPerformanceMonitor();

  // Generate test ants
  const generateTestAnts = useCallback((count) => {
    const roles = ['worker', 'soldier', 'scout', 'nurse', 'forager', 'builder'];
    const statuses = ['idle', 'working', 'moving', 'carrying', 'resting'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: `test-ant-${i}`,
      role: roles[Math.floor(Math.random() * roles.length)],
      position: {
        x: Math.random() * testConfig.viewport.width,
        y: Math.random() * testConfig.viewport.height
      },
      health: 50 + Math.random() * 50,
      stamina: 30 + Math.random() * 70,
      level: 1 + Math.floor(Math.random() * 10),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      experience: Math.random() * 1000,
      mood: Math.random() * 100,
      hunger: Math.random() * 100,
      rotation: Math.random() * Math.PI * 2,
      velocity: {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2
      }
    }));
  }, [testConfig.viewport]);

  // Update ant positions for movement simulation
  const updateAntPositions = useCallback((ants) => {
    if (!testConfig.enableMovement) return ants;

    return ants.map(ant => {
      const newX = ant.position.x + ant.velocity.x;
      const newY = ant.position.y + ant.velocity.y;

      // Bounce off walls
      let newVelX = ant.velocity.x;
      let newVelY = ant.velocity.y;

      if (newX <= 0 || newX >= testConfig.viewport.width) {
        newVelX = -newVelX;
      }
      if (newY <= 0 || newY >= testConfig.viewport.height) {
        newVelY = -newVelY;
      }

      return {
        ...ant,
        position: {
          x: Math.max(0, Math.min(testConfig.viewport.width, newX)),
          y: Math.max(0, Math.min(testConfig.viewport.height, newY))
        },
        velocity: { x: newVelX, y: newVelY },
        rotation: Math.atan2(newVelY, newVelX)
      };
    });
  }, [testConfig.enableMovement, testConfig.viewport]);

  // Update ant stats for status simulation
  const updateAntStats = useCallback((ants) => {
    if (!testConfig.enableStatusUpdates) return ants;

    return ants.map(ant => ({
      ...ant,
      health: Math.max(10, ant.health + (Math.random() - 0.5) * 2),
      stamina: Math.max(0, Math.min(100, ant.stamina + (Math.random() - 0.5) * 5)),
      mood: Math.max(0, Math.min(100, ant.mood + (Math.random() - 0.5) * 3))
    }));
  }, [testConfig.enableStatusUpdates]);

  // Run performance test
  const runTest = useCallback(async (mode, antCount) => {
    setIsRunning(true);
    setCurrentTest({ mode, antCount });
    
    const ants = generateTestAnts(antCount);
    setTestAnts(ants);
    
    testStartTimeRef.current = Date.now();
    frameCountRef.current = 0;
    performanceDataRef.current = [];

    // Run test for specified duration
    return new Promise((resolve) => {
      const testInterval = setInterval(() => {
        const elapsed = (Date.now() - testStartTimeRef.current) / 1000;
        
        if (elapsed >= testConfig.testDuration) {
          clearInterval(testInterval);
          
          const stats = getPerformanceStats();
          const result = {
            mode,
            antCount,
            duration: elapsed,
            avgFPS: stats.fps,
            avgFrameTime: stats.avgFrameTime,
            minFrameTime: stats.minFrameTime,
            maxFrameTime: stats.maxFrameTime,
            totalFrames: frameCountRef.current,
            timestamp: new Date().toISOString()
          };
          
          resolve(result);
        } else {
          // Update ants during test
          setTestAnts(prevAnts => {
            const moved = updateAntPositions(prevAnts);
            return updateAntStats(moved);
          });
          
          frameCountRef.current++;
          recordFrame();
        }
      }, 16); // ~60 FPS target
    });
  }, [testConfig, generateTestAnts, updateAntPositions, updateAntStats, getPerformanceStats, recordFrame]);

  // Run comprehensive benchmark
  const runBenchmark = useCallback(async () => {
    setTestResults([]);
    setIsRunning(true);

    const testCases = [
      { mode: 'simple', counts: [50, 100, 250, 500] },
      { mode: 'optimized', counts: [100, 250, 500, 1000] },
      { mode: 'virtualized', counts: [500, 1000, 2000, 5000] },
      { mode: 'canvas', counts: [1000, 2000, 5000, 10000] },
      { mode: 'webgl', counts: [2000, 5000, 10000, 20000] }
    ];

    const results = [];

    for (const testCase of testCases) {
      for (const count of testCase.counts) {
        try {
          const result = await runTest(testCase.mode, count);
          results.push(result);
          setTestResults([...results]);
          
          // Brief pause between tests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Test failed for ${testCase.mode} with ${count} ants:`, error);
        }
      }
    }

    setIsRunning(false);
    setCurrentTest(null);
  }, [runTest]);

  // Generate performance report
  const generateReport = useCallback(() => {
    if (testResults.length === 0) return null;

    const report = {
      summary: {
        totalTests: testResults.length,
        bestPerformance: testResults.reduce((best, current) => 
          current.avgFPS > best.avgFPS ? current : best
        ),
        worstPerformance: testResults.reduce((worst, current) => 
          current.avgFPS < worst.avgFPS ? current : worst
        )
      },
      byMode: {},
      recommendations: []
    };

    // Group results by mode
    testResults.forEach(result => {
      if (!report.byMode[result.mode]) {
        report.byMode[result.mode] = [];
      }
      report.byMode[result.mode].push(result);
    });

    // Generate recommendations
    Object.entries(report.byMode).forEach(([mode, results]) => {
      const avgFPS = results.reduce((sum, r) => sum + r.avgFPS, 0) / results.length;
      const maxAnts = Math.max(...results.map(r => r.antCount));
      
      if (avgFPS >= 55) {
        report.recommendations.push({
          mode,
          recommendation: `Excellent performance (${avgFPS.toFixed(1)} FPS avg). Suitable for up to ${maxAnts} ants.`,
          priority: 'high'
        });
      } else if (avgFPS >= 30) {
        report.recommendations.push({
          mode,
          recommendation: `Good performance (${avgFPS.toFixed(1)} FPS avg). Suitable for moderate ant counts.`,
          priority: 'medium'
        });
      } else {
        report.recommendations.push({
          mode,
          recommendation: `Poor performance (${avgFPS.toFixed(1)} FPS avg). Consider optimization or alternative modes.`,
          priority: 'low'
        });
      }
    });

    return report;
  }, [testResults]);

  // Export results
  const exportResults = useCallback(() => {
    const report = generateReport();
    const data = {
      testConfig,
      results: testResults,
      report,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ant-performance-test-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [testConfig, testResults, generateReport]);

  const report = generateReport();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Ant Rendering Performance Tester
        </h1>

        {/* Test Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Duration (seconds)
              </label>
              <input
                type="number"
                value={testConfig.testDuration}
                onChange={(e) => setTestConfig(prev => ({ 
                  ...prev, 
                  testDuration: parseInt(e.target.value) 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="5"
                max="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Viewport Width
              </label>
              <input
                type="number"
                value={testConfig.viewport.width}
                onChange={(e) => setTestConfig(prev => ({ 
                  ...prev, 
                  viewport: { ...prev.viewport, width: parseInt(e.target.value) }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Viewport Height
              </label>
              <input
                type="number"
                value={testConfig.viewport.height}
                onChange={(e) => setTestConfig(prev => ({ 
                  ...prev, 
                  viewport: { ...prev.viewport, height: parseInt(e.target.value) }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableMovement"
                checked={testConfig.enableMovement}
                onChange={(e) => setTestConfig(prev => ({ 
                  ...prev, 
                  enableMovement: e.target.checked 
                }))}
                className="mr-2"
              />
              <label htmlFor="enableMovement" className="text-sm font-medium text-gray-700">
                Enable Movement
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <button
              onClick={runBenchmark}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Running Tests...' : 'Run Full Benchmark'}
            </button>

            {testResults.length > 0 && (
              <button
                onClick={exportResults}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Export Results
              </button>
            )}
          </div>
        </div>

        {/* Current Test Status */}
        {isRunning && currentTest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Running Test: {currentTest.mode} mode with {currentTest.antCount} ants
            </h3>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, ((Date.now() - testStartTimeRef.current) / 1000 / testConfig.testDuration) * 100)}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Test Renderer */}
        {testAnts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Test Renderer</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {currentTest?.mode === 'webgl' ? (
                <AntWebGLRenderer
                  ants={testAnts}
                  viewport={testConfig.viewport}
                  showDebugInfo={true}
                />
              ) : (
                <AntRenderer
                  ants={testAnts}
                  viewport={testConfig.viewport}
                  renderMode={currentTest?.mode || 'auto'}
                  showTooltips={testConfig.showTooltips}
                  showStatusBadges={testConfig.showStatusBadges}
                />
              )}
            </div>
          </div>
        )}

        {/* Results Table */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ant Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg FPS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Frame Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {testResults.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.mode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.antCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.avgFPS.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.avgFrameTime.toFixed(2)}ms
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          result.avgFPS >= 55 ? 'bg-green-100 text-green-800' :
                          result.avgFPS >= 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.avgFPS >= 55 ? 'Excellent' :
                           result.avgFPS >= 30 ? 'Good' : 'Poor'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance Report */}
        {report && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Report</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Best Performance</h4>
                <p className="text-sm text-gray-600">
                  {report.summary.bestPerformance.mode} mode with {report.summary.bestPerformance.antCount} ants: {report.summary.bestPerformance.avgFPS.toFixed(1)} FPS
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Worst Performance</h4>
                <p className="text-sm text-gray-600">
                  {report.summary.worstPerformance.mode} mode with {report.summary.worstPerformance.antCount} ants: {report.summary.worstPerformance.avgFPS.toFixed(1)} FPS
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
              <div className="space-y-2">
                {report.recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-md ${
                    rec.priority === 'high' ? 'bg-green-50 border border-green-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <span className="font-medium">{rec.mode}:</span> {rec.recommendation}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AntPerformanceTester; 
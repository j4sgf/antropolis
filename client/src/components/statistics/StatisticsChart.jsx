import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import statisticsService from '../../services/statisticsService';

const StatisticsChart = ({ colonyId, statistics, timeframe, category }) => {
  const [chartData, setChartData] = useState(null);
  const [selectedStat, setSelectedStat] = useState('population');
  const [loading, setLoading] = useState(false);

  const availableStats = [
    { key: 'population', label: 'Population', color: '#3B82F6' },
    { key: 'food_harvested', label: 'Food Harvested', color: '#10B981' },
    { key: 'battles_won', label: 'Battles Won', color: '#EF4444' },
    { key: 'structures_built', label: 'Structures Built', color: '#8B5CF6' }
  ];

  useEffect(() => {
    if (colonyId && selectedStat) {
      loadChartData();
    }
  }, [colonyId, selectedStat, timeframe]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const result = await statisticsService.getHistoricalData(colonyId, selectedStat, {
        timeframe,
        dataPoints: 20
      });

      if (result.success) {
        setChartData(result.data);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatColor = (statKey) => {
    const stat = availableStats.find(s => s.key === statKey);
    return stat ? stat.color : '#6B7280';
  };

  const renderSimpleLineChart = (data, color) => {
    if (!data || data.chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-earth-500">
          <p>No data available for this timeframe</p>
        </div>
      );
    }

    const points = data.chartData;
    const maxValue = Math.max(...points.map(p => p.value));
    const minValue = Math.min(...points.map(p => p.value));
    const range = maxValue - minValue || 1;

    const chartWidth = 600;
    const chartHeight = 200;
    const padding = 40;

    // Generate SVG path for the line
    const pathData = points.map((point, index) => {
      const x = padding + (index / (points.length - 1)) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((point.value - minValue) / range) * (chartHeight - 2 * padding);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="bg-white p-6 rounded-lg border border-earth-200">
        <h4 className="text-lg font-semibold mb-4 text-earth-800">
          {availableStats.find(s => s.key === selectedStat)?.label || selectedStat} Over Time
        </h4>
        
        <div className="mb-4">
          <svg width={chartWidth} height={chartHeight} className="overflow-visible">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width={chartWidth} height={chartHeight} fill="url(#grid)" />
            
            {/* Data line */}
            <path
              d={pathData}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {points.map((point, index) => {
              const x = padding + (index / (points.length - 1)) * (chartWidth - 2 * padding);
              const y = chartHeight - padding - ((point.value - minValue) / range) * (chartHeight - 2 * padding);
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all cursor-pointer"
                />
              );
            })}
            
            {/* Y-axis labels */}
            <text x="10" y={padding} textAnchor="start" className="text-xs fill-earth-600">
              {maxValue.toLocaleString()}
            </text>
            <text x="10" y={chartHeight - padding + 5} textAnchor="start" className="text-xs fill-earth-600">
              {minValue.toLocaleString()}
            </text>
          </svg>
        </div>

        {/* Data summary */}
        <div className="grid grid-cols-3 gap-4 text-center border-t border-earth-200 pt-4">
          <div>
            <div className="text-xl font-bold text-earth-800">{maxValue.toLocaleString()}</div>
            <div className="text-sm text-earth-600">Peak</div>
          </div>
          <div>
            <div className="text-xl font-bold text-earth-800">{minValue.toLocaleString()}</div>
            <div className="text-sm text-earth-600">Lowest</div>
          </div>
          <div>
            <div className="text-xl font-bold text-earth-800">
              {((maxValue - minValue) / points.length).toFixed(1)}
            </div>
            <div className="text-sm text-earth-600">Avg Change</div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Stat Selector */}
      <div className="flex flex-wrap gap-2">
        {availableStats.map((stat) => (
          <button
            key={stat.key}
            onClick={() => setSelectedStat(stat.key)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedStat === stat.key
                ? 'border-forest-600 bg-forest-50 text-forest-800'
                : 'border-earth-300 bg-white text-earth-600 hover:bg-earth-50'
            }`}
          >
            <div
              className="w-3 h-3 rounded-full inline-block mr-2"
              style={{ backgroundColor: stat.color }}
            ></div>
            {stat.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {chartData ? (
        renderSimpleLineChart(chartData, getStatColor(selectedStat))
      ) : (
        <div className="bg-white p-8 rounded-lg border border-earth-200 text-center">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-xl font-semibold mb-2 text-earth-800">Charts Coming Soon</h3>
          <p className="text-earth-600">
            Historical data visualization will be displayed here once sufficient data is collected.
          </p>
        </div>
      )}

      {/* Current Statistics Overview */}
      {statistics && statistics.aggregated && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {availableStats.map((stat) => {
            const categoryData = Object.values(statistics.aggregated).find(cat => 
              Object.keys(cat).includes(stat.key)
            );
            const statData = categoryData ? categoryData[stat.key] : null;
            
            return (
              <div
                key={stat.key}
                className="bg-white p-4 rounded-lg border border-earth-200 text-center"
              >
                <div
                  className="w-6 h-6 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: stat.color }}
                ></div>
                <div className="text-2xl font-bold text-earth-800">
                  {statData ? statData.value.toLocaleString() : '0'}
                </div>
                <div className="text-sm text-earth-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default StatisticsChart; 
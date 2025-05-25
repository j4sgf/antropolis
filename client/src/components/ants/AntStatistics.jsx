import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import roleAssignmentService from '../../services/roleAssignmentService';
import RoleIndicator from './RoleIndicator';
import './AntStatistics.css';

const AntStatistics = ({ ant, onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ant?.id) {
      fetchAntStatistics();
    }
  }, [ant?.id]);

  const fetchAntStatistics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const statisticsData = await roleAssignmentService.getAntStatistics(ant.id);
      setStats(statisticsData);
    } catch (err) {
      setError('Failed to load ant statistics');
      console.error('Error fetching ant statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!ant) return null;

  if (loading) {
    return (
      <div className="ant-statistics-modal">
        <div className="ant-statistics-content">
          <div className="loading-spinner">Loading ant statistics...</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="ant-statistics-modal"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="ant-statistics-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="ant-stats-header">
          <div className="ant-info">
            <RoleIndicator role={ant.role} size="large" showTooltip={false} />
            <div className="ant-details">
              <h2 className="ant-name">{ant.name || `Ant #${ant.id}`}</h2>
              <p className="ant-role">{ant.role} • ID: {ant.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchAntStatistics} className="retry-button">
              Retry
            </button>
          </div>
        ) : (
          <div className="ant-stats-body">
            {/* Core Stats */}
            <div className="stats-section">
              <h3>Core Statistics</h3>
              <div className="stats-grid">
                <StatCard
                  label="Experience"
                  value={stats?.experience || ant.experience || 0}
                  max={100}
                  unit="XP"
                  color="#3b82f6"
                />
                <StatCard
                  label="Efficiency"
                  value={stats?.efficiency || ant.efficiency || 0}
                  max={100}
                  unit="%"
                  color="#10b981"
                />
                <StatCard
                  label="Health"
                  value={stats?.health || ant.health || 0}
                  max={100}
                  unit="%"
                  color="#ef4444"
                />
                <StatCard
                  label="Energy"
                  value={stats?.energy || ant.energy || 0}
                  max={100}
                  unit="%"
                  color="#f59e0b"
                />
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="stats-section">
              <h3>Performance Metrics</h3>
              <div className="performance-grid">
                <div className="metric-item">
                  <span className="metric-label">Tasks Completed</span>
                  <span className="metric-value">{stats?.tasksCompleted || ant.tasks || 0}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Success Rate</span>
                  <span className="metric-value">{stats?.successRate || ant.successRate || 0}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Time Active</span>
                  <span className="metric-value">
                    {formatTimeActive(stats?.timeActive || Date.now() - (ant.assignedAt || Date.now()))}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Status</span>
                  <span className={`status-badge status-${ant.status}`}>
                    {ant.status || 'active'}
                  </span>
                </div>
              </div>
            </div>

            {/* Skill Levels */}
            {stats?.skillLevels && (
              <div className="stats-section">
                <h3>Skill Levels</h3>
                <div className="skills-grid">
                  {Object.entries(stats.skillLevels).map(([skill, level]) => (
                    <div key={skill} className="skill-item">
                      <div className="skill-header">
                        <span className="skill-name">{capitalize(skill)}</span>
                        <span className="skill-value">{level}</span>
                      </div>
                      <div className="skill-bar">
                        <div 
                          className="skill-fill"
                          style={{ width: `${level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {stats?.achievements && stats.achievements.length > 0 && (
              <div className="stats-section">
                <h3>Achievements</h3>
                <div className="achievements-list">
                  {stats.achievements.map((achievement, index) => (
                    <div key={index} className="achievement-badge">
                      🏆 {achievement}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activities */}
            {stats?.recentActivities && stats.recentActivities.length > 0 && (
              <div className="stats-section">
                <h3>Recent Activities</h3>
                <div className="activities-list">
                  {stats.recentActivities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <span className="activity-action">{activity.action}</span>
                      <span className="activity-time">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Helper component for stat cards
const StatCard = ({ label, value, max, unit, color }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-label">{label}</span>
      <span className="stat-number">{value}{unit}</span>
    </div>
    <div className="stat-bar">
      <div 
        className="stat-fill"
        style={{ 
          width: `${(value / max) * 100}%`,
          backgroundColor: color 
        }}
      />
    </div>
  </div>
);

// Utility functions
function formatTimeActive(milliseconds) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
}

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default AntStatistics; 
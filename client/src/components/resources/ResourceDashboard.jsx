import React, { useState } from 'react';
import { motion } from 'framer-motion';
import NotificationSystem from '../notifications/NotificationSystem';
import ResourceEventPanel from './ResourceEventPanel';
import ResourceStatusPanel from './ResourceStatusPanel';

/**
 * Resource Dashboard - Main hub for resource management, events, and monitoring
 */
const ResourceDashboard = ({ colonyId }) => {
  const [selectedView, setSelectedView] = useState('status');
  const [showEventPanel, setShowEventPanel] = useState(false);

  // View options
  const views = [
    { id: 'status', label: 'Resource Status', icon: '📊' },
    { id: 'events', label: 'Events & Conversions', icon: '🎲' },
    { id: 'storage', label: 'Storage Management', icon: '📦' }
  ];

  /**
   * Quick action buttons for common operations
   */
  const quickActions = [
    {
      id: 'trigger-event',
      label: 'Events & Conversions',
      icon: '⚡',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => setShowEventPanel(true)
    },
    {
      id: 'process-decay',
      label: 'Process Decay',
      icon: '⏰',
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        // This would trigger decay processing
        if (window.notificationSystem) {
          window.notificationSystem.showInfo('Decay Processing', 'Resource decay processing initiated');
        }
      }
    },
    {
      id: 'simulate-events',
      label: 'Simulate Events',
      icon: '🧪',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        // This would simulate random events
        if (window.notificationSystem) {
          window.notificationSystem.showInfo('Event Simulation', 'Random event simulation started');
        }
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Notification System */}
      <NotificationSystem colonyId={colonyId} />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
              <span className="text-sm text-gray-500">Colony #{colonyId}</span>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {quickActions.map((action) => (
                <motion.button
                  key={action.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.action}
                  className={`${action.color} text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2`}
                >
                  <span>{action.icon}</span>
                  <span className="hidden sm:inline">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedView === view.id
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{view.icon}</span>
                <span>{view.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={selectedView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedView === 'status' && (
            <div className="space-y-6">
              {/* Resource Status Overview */}
              <ResourceStatusPanel colonyId={colonyId} />
              
              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 text-lg">🟢</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Quality Status</p>
                      <p className="text-lg font-semibold text-gray-900">Monitoring Active</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 text-lg">⚗️</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Active Conversions</p>
                      <p className="text-lg font-semibold text-gray-900">0 Running</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 text-lg">⏰</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-600">Decay Warnings</p>
                      <p className="text-lg font-semibold text-gray-900">0 Critical</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedView === 'events' && (
            <div className="space-y-6">
              {/* Events Overview */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Resource Events & Conversions</h2>
                <p className="text-gray-600 mb-6">
                  Manage resource events, start conversions, and monitor automated processes.
                </p>
                
                <button
                  onClick={() => setShowEventPanel(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  Open Events Panel
                </button>
              </div>
              
              {/* Event Type Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <div className="text-2xl mb-2">🎲</div>
                  <h3 className="font-semibold text-blue-900">Random Events</h3>
                  <p className="text-sm text-blue-700 mt-2">
                    Spontaneous events that can affect resources, like weather changes or discoveries.
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <div className="text-2xl mb-2">⚗️</div>
                  <h3 className="font-semibold text-green-900">Resource Conversion</h3>
                  <p className="text-sm text-green-700 mt-2">
                    Transform basic resources into more useful materials through recipes.
                  </p>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
                  <div className="text-2xl mb-2">⚠️</div>
                  <h3 className="font-semibold text-orange-900">Decay Management</h3>
                  <p className="text-sm text-orange-700 mt-2">
                    Monitor resource quality and manage spoilage to prevent waste.
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedView === 'storage' && (
            <div className="space-y-6">
              {/* Storage Management */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Storage Management</h2>
                <p className="text-gray-600">
                  Detailed storage management will be available here. Currently showing compact resource status.
                </p>
                
                <div className="mt-6">
                  <ResourceStatusPanel colonyId={colonyId} compact={true} />
                </div>
              </div>
              
              {/* Storage Zone Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">Storage Zones</h3>
                  <div className="space-y-3">
                    {['General Storage', 'Food Storage', 'Liquid Storage', 'Secure Storage'].map((zone) => (
                      <div key={zone} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <span className="font-medium">{zone}</span>
                        <span className="text-sm text-gray-600">Available</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold mb-3">Storage Tips</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Keep food in appropriate storage to reduce decay</p>
                    <p>• Monitor resource quality regularly</p>
                    <p>• Use conversion recipes to preserve resources</p>
                    <p>• Reserve resources for important tasks</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Event Panel Modal */}
      {showEventPanel && (
        <ResourceEventPanel
          colonyId={colonyId}
          onClose={() => setShowEventPanel(false)}
        />
      )}
    </div>
  );
};

export default ResourceDashboard; 
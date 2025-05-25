import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import StorageManager from '../components/storage/StorageManager'
import ColonyOverview from '../components/colony/ColonyOverview'
import AntStatsCard from '../components/AntStatsCard'
import ForagingDashboard from '../components/foraging/ForagingDashboard'
import StructuresDashboard from '../components/structures/StructuresDashboard'
import ResourceDashboard from '../components/resources/ResourceDashboard'
import PopulationDashboard from '../components/ants/PopulationDashboard'
import { useResourceEvents } from '../hooks/useResourceEvents'

function ColonyDashboard() {
  const { colonyId } = useParams()
  const navigate = useNavigate()
  
  const [colony, setColony] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Enable automatic resource event monitoring
  const { triggerEventCheck, triggerDecayCheck } = useResourceEvents(colonyId, {
    pollInterval: 8000, // Check every 8 seconds
    enableNotifications: true,
    autoProcessDecay: false // Don't auto-process decay, let user control it
  })

  useEffect(() => {
    if (colonyId) {
      fetchColonyData()
    }
  }, [colonyId])

  const fetchColonyData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/colonies/${colonyId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch colony data')
      }
      
      const data = await response.json()
      setColony(data.data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching colony:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-earth-50 to-forest-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl"
        >
          🐜
        </motion.div>
        <div className="ml-4 text-xl text-forest-700">Loading colony data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-earth-50 to-forest-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg border border-red-200 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 mb-3">Error Loading Colony</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBackToHome}
            className="bg-forest-600 text-white py-2 px-4 rounded-md hover:bg-forest-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!colony) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-earth-50 to-forest-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg text-center max-w-md">
          <div className="text-4xl mb-4">🏗️</div>
          <h2 className="text-xl font-semibold text-earth-800 mb-3">Colony Not Found</h2>
          <p className="text-earth-600 mb-4">The colony you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={handleBackToHome}
            className="bg-forest-600 text-white py-2 px-4 rounded-md hover:bg-forest-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '🏛️' },
    { id: 'structures', label: 'Structures', icon: '🏗️' },
    { id: 'storage', label: 'Storage', icon: '📦' },
    { id: 'resources', label: 'Resources', icon: '⚗️' },
    { id: 'foraging', label: 'Foraging', icon: '🐜' },
    { id: 'population', label: 'Population', icon: '👥' },
    { id: 'defenses', label: 'Defenses', icon: '🛡️' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-50 to-forest-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToHome}
              className="text-forest-600 hover:text-forest-800 transition-colors"
            >
              ← Back to Home
            </button>
            <div>
              <h1 className="text-3xl font-bold text-forest-800">
                {colony.name}
              </h1>
              <p className="text-earth-600">
                Population: {colony.population} • Founded: {new Date(colony.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/game/${colonyId}`)}
              className="bg-forest-600 text-white px-4 py-2 rounded-md font-medium hover:bg-forest-700 transition-colors flex items-center space-x-2"
            >
              <span>🎮</span>
              <span>Enter Game</span>
            </motion.button>
            <div className="text-4xl">{colony.type === 'warrior' ? '⚔️' : colony.type === 'builder' ? '🏗️' : '🌿'}</div>
          </div>
        </motion.header>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md border border-earth-200 mb-8"
        >
          <div className="flex border-b border-earth-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-forest-50 text-forest-700 border-b-2 border-forest-600'
                    : 'text-earth-600 hover:text-earth-800 hover:bg-earth-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <ColonyOverview colony={colony} onColonyUpdate={setColony} />
          )}
          
          {activeTab === 'structures' && (
            <StructuresDashboard colonyId={colony.id} colonyData={colony} />
          )}
          
          {activeTab === 'storage' && (
            <StorageManager colonyId={colony.id} />
          )}
          
          {activeTab === 'resources' && (
            <ResourceDashboard colonyId={colony.id} />
          )}
          
          {activeTab === 'foraging' && (
            <ForagingDashboard colonyId={colony.id} colonyData={colony} />
          )}
          
          {activeTab === 'population' && (
            <PopulationDashboard colonyId={colony.id} />
          )}
          
          {activeTab === 'defenses' && (
            <div className="bg-white rounded-lg p-6 shadow-md border border-earth-200">
              <h3 className="text-lg font-semibold text-forest-800 mb-4">Colony Defenses</h3>
              <p className="text-earth-600">Defense management features coming soon...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default ColonyDashboard 
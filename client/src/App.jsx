import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom'
import CreateColony from './pages/CreateColony'
import ColonyDashboard from './pages/ColonyDashboard'
import GameLayout from './components/layout/GameLayout'
import { AccessibilityProvider } from './store/AccessibilityContext'
import { TutorialProvider } from './store/TutorialContext'
import ScreenReaderSupport from './components/accessibility/ScreenReaderSupport'
import { TutorialOverlay, TutorialTooltip, TutorialControls } from './components/tutorial'
import colonyService from './services/colonyService'

// Home page component
function HomePage() {
  const navigate = useNavigate()
  const [count, setCount] = useState(0)
  const [colonies, setColonies] = useState([])
  const [coloniesLoading, setColoniesLoading] = useState(true)
  const [coloniesError, setColoniesError] = useState(null)

  // Load user's colonies on component mount
  useEffect(() => {
    const loadColonies = async () => {
      try {
        setColoniesLoading(true)
        
        // Add cache-busting parameter to force fresh request
        const timestamp = new Date().getTime()
        const response = await fetch(`http://localhost:3001/api/colonies?user_id=00000000-0000-0000-0000-000000000001&_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }
        
        const result = await response.json()
        setColonies(result.data || [])
      } catch (err) {
        console.error('Error loading colonies:', err)
        setColoniesError(err.message)
      } finally {
        setColoniesLoading(false)
      }
    }

    loadColonies()
  }, [])

  const handleCreateColony = () => {
    navigate('/create-colony')
  }

  const handleColonyCreated = (colony) => {
    console.log('Colony created successfully:', colony)
    // Navigate to the colony dashboard
    navigate(`/colony/${colony.id}`)
  }

  const handleViewColony = (colonyId) => {
    navigate(`/colony/${colonyId}`)
  }

  const handlePlayColony = (colonyId) => {
    navigate(`/game/${colonyId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-50 to-forest-50">
      <div className="container mx-auto px-4 py-8">
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-6xl mb-4"
          >
            🐜👑
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wide">
            Antopolis
          </h1>
          <p className="text-xl text-earth-600 max-w-2xl mx-auto">
            Build, manage, and defend your ant colony in this strategic simulation game. 
            Lead your ants through battles, resource management, and territorial expansion.
          </p>
        </motion.header>

        <motion.main
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Create Colony Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white rounded-lg p-6 shadow-lg border border-earth-200"
            >
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="text-xl font-semibold text-forest-800 mb-3">Create Colony</h3>
              <p className="text-earth-600 mb-4">
                Start your ant empire by establishing a new colony with custom attributes and strategy.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateColony}
                className="w-full bg-forest-600 text-white py-2 px-4 rounded-md font-medium hover:bg-forest-700 transition-colors"
              >
                Build New Colony
              </motion.button>
            </motion.div>

            {/* Game Features Preview */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white rounded-lg p-6 shadow-lg border border-earth-200"
            >
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="text-xl font-semibold text-forest-800 mb-3">Strategic Combat</h3>
              <p className="text-earth-600 mb-4">
                Deploy your ants in tactical battles against rival colonies and defend your territory.
              </p>
              <div className="text-sm text-earth-500">Coming Soon</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white rounded-lg p-6 shadow-lg border border-earth-200"
            >
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-forest-800 mb-3">Resource Management</h3>
              <p className="text-earth-600 mb-4">
                Manage food, materials, and population growth to ensure your colony thrives.
              </p>
              <div className="text-sm text-earth-500">✅ Now Available!</div>
            </motion.div>

            {/* Community Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -10 }}
              className="bg-white rounded-lg p-6 shadow-lg border border-earth-200 md:col-span-2 lg:col-span-1"
            >
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-forest-800 mb-3">Join the Community</h3>
              <p className="text-earth-600 mb-4">
                Connect with other players, share strategies, and learn from the community. Don't worry - helpful tutorials will guide you as you explore!
              </p>
              <div className="text-sm text-earth-500">Coming Soon</div>
            </motion.div>
          </div>

          {/* My Colonies Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-forest-800 mb-6 text-center">My Colonies</h2>
            
            {coloniesLoading ? (
              <div className="bg-white rounded-lg p-8 shadow-lg border border-earth-200 text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-4xl mb-4"
                >
                  🐜
                </motion.div>
                <p className="text-earth-600">Loading your colonies...</p>
              </div>
            ) : coloniesError ? (
              <div className="bg-white rounded-lg p-8 shadow-lg border border-red-200 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Colonies</h3>
                <p className="text-red-600">{coloniesError}</p>
              </div>
            ) : colonies.length === 0 ? (
              <div className="bg-white rounded-lg p-8 shadow-lg border border-earth-200 text-center">
                <div className="text-4xl mb-4">🏗️</div>
                <h3 className="text-lg font-semibold text-earth-800 mb-2">No Colonies Yet</h3>
                <p className="text-earth-600 mb-4">Create your first colony to begin your ant empire!</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateColony}
                  className="bg-forest-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-forest-700 transition-colors"
                >
                  Create First Colony
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {colonies.map((colony, index) => (
                  <motion.div
                    key={colony.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-white rounded-lg p-6 shadow-lg border border-earth-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-forest-800">{colony.name}</h3>
                      <div className="text-2xl">
                        {colony.type === 'warrior' ? '⚔️' : colony.type === 'builder' ? '🏗️' : '🌿'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-earth-600">Population:</span>
                        <span className="font-medium">{colony.population}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-earth-600">Species:</span>
                        <span className="font-medium capitalize">{colony.species}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-earth-600">Environment:</span>
                        <span className="font-medium capitalize">{colony.environment}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-earth-600">Founded:</span>
                        <span className="font-medium">{new Date(colony.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-earth-600 text-sm mb-4 line-clamp-2">
                      {colony.description}
                    </p>

                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleViewColony(colony.id)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        📊 Dashboard
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePlayColony(colony.id)}
                        className="flex-1 bg-forest-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-forest-700 transition-colors"
                      >
                        🎮 Play
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Development Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-lg p-6 shadow-lg border border-earth-200 text-center"
          >
            <h3 className="text-lg font-semibold text-forest-800 mb-3">🚧 Development Status</h3>
            <p className="text-earth-600 mb-4">
              Welcome to the early development phase! Currently, you can create and customize colonies. 
              More features like combat, resource management, and multiplayer will be added soon.
            </p>
            <div className="flex justify-center items-center space-x-4 text-sm">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">✅ Colony Creation</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">✅ Storage Management</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">🔄 Database Integration</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full">⏳ Combat System</span>
            </div>
          </motion.div>

          {/* Interactive Counter (for demonstration) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-8 text-center"
          >
            <div className="bg-white rounded-lg p-6 shadow-lg border border-earth-200 inline-block">
              <h4 className="text-lg font-semibold text-forest-800 mb-3">Development Demo</h4>
              <p className="text-earth-600 mb-3">Interactive React Counter:</p>
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCount(count - 1)}
                  className="bg-red-500 text-white w-10 h-10 rounded-full font-bold hover:bg-red-600 transition-colors"
                >
                  -
                </motion.button>
                <span className="text-2xl font-bold text-forest-800 w-16 text-center">{count}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCount(count + 1)}
                  className="bg-green-500 text-white w-10 h-10 rounded-full font-bold hover:bg-green-600 transition-colors"
                >
                  +
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.main>
      </div>
    </div>
  )
}

// Game page component that fetches colony data and renders GameLayout
function GamePage() {
  const { colonyId } = useParams();
  const navigate = useNavigate();
  const [colonyData, setColonyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch colony data on mount
  useEffect(() => {
    const fetchColonyData = async () => {
      try {
        setLoading(true);
        console.log('GamePage: Fetching colony data for ID:', colonyId);
        
        // Add cache-busting parameter to force fresh request
        const timestamp = new Date().getTime();
        const response = await fetch(`http://localhost:3001/api/colonies/${colonyId}?details=true&_t=${timestamp}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('GamePage: Colony data received:', result.data);
        setColonyData(result.data);
      } catch (err) {
        console.error('GamePage: Error fetching colony data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (colonyId) {
      fetchColonyData();
    }
  }, [colonyId]);

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
        <div className="ml-4 text-xl text-forest-700">Loading colony...</div>
      </div>
    );
  }

  if (error || !colonyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-earth-50 to-forest-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg border border-red-200 text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 mb-3">Error Loading Game</h2>
          <p className="text-red-600 mb-4">{error || 'Colony not found'}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/')}
              className="bg-forest-600 text-white py-2 px-4 rounded-md hover:bg-forest-700 transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate(`/colony/${colonyId}`)}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Colony Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <GameLayout colonyId={colonyId} colonyData={colonyData} />;
}

// Tutorial Provider wrapper that needs Router context
function TutorialWrapper({ children }) {
  return (
    <TutorialProvider>
      <ScreenReaderSupport>
        <TutorialOverlay>
          {children}
          {/* Tutorial UI Components */}
          <TutorialTooltip />
          <TutorialControls />
        </TutorialOverlay>
      </ScreenReaderSupport>
    </TutorialProvider>
  );
}

// Main App component with routing
function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <TutorialWrapper>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/create-colony" 
              element={
                <CreateColony 
                  onColonyCreated={(colony) => {
                    console.log('Colony created:', colony)
                    // Navigate directly to game (Task 20 implementation)
                    window.location.href = `/game/${colony.id}`
                  }}
                  onCancel={() => {
                    console.log('Colony creation cancelled')
                    // Navigate back to home
                    window.location.href = '/'
                  }}
                />
              } 
            />
            <Route 
              path="/colony/:colonyId" 
              element={<ColonyDashboard />} 
            />
            <Route 
              path="/game/:colonyId" 
              element={<GamePage />} 
            />
          </Routes>
        </TutorialWrapper>
      </Router>
    </AccessibilityProvider>
  )
}

export default App

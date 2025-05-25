import { motion } from 'framer-motion'
import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import CreateColony from './pages/CreateColony'
import ColonyDashboard from './pages/ColonyDashboard'
import GameLayout from './components/layout/GameLayout'

// Home page component
function HomePage() {
  const navigate = useNavigate()
  const [count, setCount] = useState(0)

  const handleCreateColony = () => {
    navigate('/create-colony')
  }

  const handleColonyCreated = (colony) => {
    console.log('Colony created successfully:', colony)
    // Navigate to the colony dashboard
    navigate(`/colony/${colony.id}`)
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
          </div>

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

// Main App component with routing
function App() {
  return (
    <Router>
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
          element={<GameLayout />} 
        />
      </Routes>
    </Router>
  )
}

export default App

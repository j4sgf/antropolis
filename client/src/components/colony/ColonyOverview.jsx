import { motion } from 'framer-motion'

function ColonyOverview({ colony, onColonyUpdate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Colony Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg p-6 shadow-md border border-earth-200"
      >
        <h3 className="text-lg font-semibold text-forest-800 mb-4">Colony Statistics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-earth-600">Population:</span>
            <span className="font-medium text-earth-800">{colony.population}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-earth-600">Type:</span>
            <span className="font-medium text-earth-800 capitalize">{colony.type}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-earth-600">Food Storage:</span>
            <span className="font-medium text-earth-800">{colony.food_storage || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-earth-600">Founded:</span>
            <span className="font-medium text-earth-800">
              {new Date(colony.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Colony Description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg p-6 shadow-md border border-earth-200"
      >
        <h3 className="text-lg font-semibold text-forest-800 mb-4">Description</h3>
        <p className="text-earth-700 leading-relaxed">
          {colony.description || 'No description available for this colony.'}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg p-6 shadow-md border border-earth-200"
      >
        <h3 className="text-lg font-semibold text-forest-800 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button className="w-full bg-forest-600 text-white py-2 px-4 rounded-md hover:bg-forest-700 transition-colors">
            🐜 View Ants
          </button>
          <button className="w-full bg-earth-600 text-white py-2 px-4 rounded-md hover:bg-earth-700 transition-colors">
            📦 Manage Storage
          </button>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
            🏗️ Expand Colony
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default ColonyOverview 
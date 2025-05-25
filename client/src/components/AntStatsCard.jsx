import { motion } from 'framer-motion'

function AntStatsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6 shadow-md border border-earth-200"
    >
      <h3 className="text-lg font-semibold text-forest-800 mb-4 flex items-center">
        <span className="text-2xl mr-2">🐜</span>
        Ant Statistics
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-earth-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-forest-700">42</div>
            <div className="text-xs text-earth-600">Workers</div>
          </div>
          <div className="bg-earth-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-forest-700">8</div>
            <div className="text-xs text-earth-600">Soldiers</div>
          </div>
          <div className="bg-earth-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-forest-700">3</div>
            <div className="text-xs text-earth-600">Scouts</div>
          </div>
          <div className="bg-earth-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-forest-700">2</div>
            <div className="text-xs text-earth-600">Nurses</div>
          </div>
        </div>
        
        <div className="border-t border-earth-200 pt-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-earth-600">Activity Level:</span>
            <span className="font-medium text-green-600">High</span>
          </div>
          <div className="w-full h-2 bg-earth-200 rounded-full mt-2">
            <div className="w-4/5 h-full bg-green-500 rounded-full"></div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-earth-500">
            Detailed ant management coming soon!
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default AntStatsCard

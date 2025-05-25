import { motion } from 'framer-motion';

const AppearanceStep = ({ formData, updateField, COLONY_COLORS }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-forest-800 mb-2">Customize Appearance</h2>
        <p className="text-earth-600">
          Choose colors and visual elements that represent your colony's identity
        </p>
      </div>

      {/* Colony Color Selection */}
      <div>
        <h3 className="text-lg font-semibold text-earth-800 mb-4">Colony Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COLONY_COLORS.map((colorOption, index) => (
            <motion.div
              key={colorOption.value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateField('color', colorOption.value)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${formData.color === colorOption.value
                  ? 'border-forest-500 bg-forest-50 shadow-lg'
                  : 'border-earth-200 bg-white hover:border-earth-300 hover:shadow-md'
                }
              `}
            >
              <div className="text-center">
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white shadow-md"
                  style={{ backgroundColor: colorOption.value }}
                ></div>
                <div className="text-sm font-medium text-earth-800">
                  {colorOption.name}
                </div>
                {formData.color === colorOption.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-2"
                  >
                    <span className="text-forest-600 text-xs">✓ Selected</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Colony Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-medium text-earth-800 mb-4 text-center">Colony Preview</h4>
        
        {/* Ant Colony Visualization */}
        <div className="relative bg-gradient-to-b from-amber-50 to-earth-100 rounded-lg p-8 h-48 overflow-hidden">
          {/* Underground layers */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-200 to-transparent opacity-30"></div>
          
          {/* Colony entrance */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div
              className="w-16 h-16 rounded-full border-4 border-earth-400 flex items-center justify-center text-2xl"
              style={{ backgroundColor: formData.color }}
            >
              🏠
            </div>
          </motion.div>

          {/* Animated ants */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                x: [0, 100, 200, 100, 0],
                y: [0, -20, 0, 20, 0],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              className="absolute text-lg"
              style={{
                left: `${20 + i * 10}%`,
                top: `${60 + (i % 2) * 20}%`,
                color: formData.color,
              }}
            >
              🐜
            </motion.div>
          ))}

          {/* Colony name display */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-white bg-opacity-90 rounded-full px-4 py-2 border border-earth-200">
              <span className="text-sm font-medium text-earth-800">
                {formData.name || 'Your Colony'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Style Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-earth-50 border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-medium text-earth-800 mb-4">Colony Theme Elements</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Territory Style */}
          <div className="text-center p-4 bg-white rounded border border-earth-200">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="font-medium text-earth-800 mb-1">Territory Style</div>
            <div className="text-sm text-earth-600">Natural borders with organic shapes</div>
          </div>

          {/* Structure Style */}
          <div className="text-center p-4 bg-white rounded border border-earth-200">
            <div className="text-2xl mb-2">🏗️</div>
            <div className="font-medium text-earth-800 mb-1">Structure Style</div>
            <div className="text-sm text-earth-600">Earth-toned underground chambers</div>
          </div>

          {/* Ant Appearance */}
          <div className="text-center p-4 bg-white rounded border border-earth-200">
            <div className="text-2xl mb-2">🐜</div>
            <div className="font-medium text-earth-800 mb-1">Ant Appearance</div>
            <div className="text-sm text-earth-600">Color-coded by role and colony</div>
          </div>
        </div>
      </motion.div>

      {/* Color Meaning */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-medium text-earth-800 mb-4">Color Significance</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-earth-700 mb-2">Earthy Tones</h5>
            <div className="space-y-2 text-sm text-earth-600">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-yellow-600 mr-2"></div>
                <span>Earth Brown - Traditional, stable, resourceful</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-600 mr-2"></div>
                <span>Forest Green - Natural, growth-oriented, peaceful</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
                <span>Sunset Orange - Energetic, warm, adventurous</span>
              </div>
            </div>
          </div>
          <div>
            <h5 className="font-medium text-earth-700 mb-2">Bold Colors</h5>
            <div className="space-y-2 text-sm text-earth-600">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-600 mr-2"></div>
                <span>Crimson Red - Aggressive, powerful, dominant</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-purple-600 mr-2"></div>
                <span>Royal Purple - Intelligent, mysterious, sophisticated</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-blue-600 mr-2"></div>
                <span>Ocean Blue - Defensive, calm, strategic</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Customization Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-forest-50 border border-forest-200 rounded-lg p-4"
      >
        <div className="flex items-start">
          <span className="text-forest-600 mr-3 text-xl">🎨</span>
          <div>
            <h4 className="font-medium text-forest-800 mb-1">Customization Notes</h4>
            <p className="text-forest-700 text-sm">
              Your colony's color will be visible to other players on the map and will represent 
              your territory. You can change these visual elements later in the game settings, 
              but your initial choice will be remembered as your colony's signature style.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AppearanceStep; 
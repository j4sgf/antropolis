import { motion } from 'framer-motion';

const AttributesStep = ({ 
  formData, 
  errors, 
  updateAttribute, 
  getRemainingPoints, 
  TOTAL_ATTRIBUTE_POINTS 
}) => {
  const remainingPoints = getRemainingPoints();

  const attributes = [
    {
      key: 'strength',
      name: 'Strength',
      icon: '💪',
      description: 'Affects combat effectiveness and carrying capacity',
      color: 'red',
      examples: ['Stronger in battles', 'Can carry more resources', 'Build structures faster']
    },
    {
      key: 'speed',
      name: 'Speed',
      icon: '⚡',
      description: 'Determines movement and task completion speed',
      color: 'yellow',
      examples: ['Faster movement', 'Quick resource gathering', 'Rapid expansion']
    },
    {
      key: 'intelligence',
      name: 'Intelligence',
      icon: '🧠',
      description: 'Improves efficiency and technology advancement',
      color: 'purple',
      examples: ['Better resource management', 'Faster research', 'Optimal pathfinding']
    },
    {
      key: 'defense',
      name: 'Defense',
      icon: '🛡️',
      description: 'Increases resistance to damage and environmental hazards',
      color: 'blue',
      examples: ['Reduced damage taken', 'Weather resistance', 'Stronger structures']
    }
  ];

  const getColorClasses = (color, isActive = false) => {
    const colors = {
      red: isActive ? 'border-red-500 bg-red-50' : 'border-red-300 bg-red-25',
      yellow: isActive ? 'border-yellow-500 bg-yellow-50' : 'border-yellow-300 bg-yellow-25',
      purple: isActive ? 'border-purple-500 bg-purple-50' : 'border-purple-300 bg-purple-25',
      blue: isActive ? 'border-blue-500 bg-blue-50' : 'border-blue-300 bg-blue-25'
    };
    return colors[color] || 'border-earth-300 bg-earth-50';
  };

  const handleSliderChange = (attribute, value) => {
    const numValue = parseInt(value);
    updateAttribute(attribute, numValue);
  };

  const handleButtonAdjust = (attribute, change) => {
    const currentValue = formData.attributes[attribute];
    const newValue = currentValue + change;
    
    if (newValue >= 1 && newValue <= 10) {
      updateAttribute(attribute, newValue);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-forest-800 mb-2">Distribute Attributes</h2>
        <p className="text-earth-600 mb-4">
          You have {TOTAL_ATTRIBUTE_POINTS} points to distribute among your colony's attributes
        </p>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-lg font-medium text-earth-700">Remaining Points:</span>
          <span className={`text-2xl font-bold ${
            remainingPoints === 0 ? 'text-green-600' : 
            remainingPoints < 0 ? 'text-red-600' : 'text-forest-600'
          }`}>
            {remainingPoints}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {errors.attributes && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6"
        >
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <span className="text-red-800">{errors.attributes}</span>
          </div>
        </motion.div>
      )}

      {/* Attributes Grid */}
      <div className="space-y-6">
        {attributes.map((attr, index) => (
          <motion.div
            key={attr.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              p-6 rounded-lg border-2 transition-all duration-200
              ${getColorClasses(attr.color, formData.attributes[attr.key] > 5)}
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{attr.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-earth-800">{attr.name}</h3>
                  <p className="text-sm text-earth-600">{attr.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-earth-800">
                  {formData.attributes[attr.key]}
                </div>
                <div className="text-xs text-earth-500">points</div>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="mb-4">
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleButtonAdjust(attr.key, -1)}
                  disabled={formData.attributes[attr.key] <= 1}
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                    ${formData.attributes[attr.key] <= 1
                      ? 'border-earth-200 text-earth-300 cursor-not-allowed'
                      : 'border-earth-400 text-earth-600 hover:border-earth-600 hover:text-earth-800'
                    }
                  `}
                >
                  −
                </motion.button>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.attributes[attr.key]}
                    onChange={(e) => handleSliderChange(attr.key, e.target.value)}
                    className={`
                      w-full h-2 rounded-lg appearance-none cursor-pointer
                      bg-earth-200 slider-${attr.color}
                    `}
                  />
                  <div className="flex justify-between text-xs text-earth-400 mt-1">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleButtonAdjust(attr.key, 1)}
                  disabled={formData.attributes[attr.key] >= 10 || remainingPoints <= 0}
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold
                    ${formData.attributes[attr.key] >= 10 || remainingPoints <= 0
                      ? 'border-earth-200 text-earth-300 cursor-not-allowed'
                      : 'border-earth-400 text-earth-600 hover:border-earth-600 hover:text-earth-800'
                    }
                  `}
                >
                  +
                </motion.button>
              </div>
            </div>

            {/* Attribute Benefits */}
            <div className="text-sm">
              <div className="font-medium text-earth-700 mb-2">Benefits:</div>
              <ul className="text-earth-600 space-y-1">
                {attr.examples.map((example, i) => (
                  <li key={i} className="flex items-center">
                    <span className="w-1 h-1 bg-earth-400 rounded-full mr-2"></span>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Presets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-earth-50 border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-medium text-earth-800 mb-4">Quick Presets</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Warrior', values: { strength: 8, speed: 5, intelligence: 3, defense: 4 }, icon: '⚔️' },
            { name: 'Explorer', values: { strength: 4, speed: 8, intelligence: 5, defense: 3 }, icon: '🗺️' },
            { name: 'Scholar', values: { strength: 3, speed: 4, intelligence: 8, defense: 5 }, icon: '📚' }
          ].map((preset) => (
            <motion.button
              key={preset.name}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                Object.entries(preset.values).forEach(([attr, value]) => {
                  updateAttribute(attr, value);
                });
              }}
              className="p-3 bg-white border border-earth-300 rounded-lg hover:border-earth-400 hover:shadow-sm transition-all"
            >
              <div className="text-lg mb-1">{preset.icon}</div>
              <div className="font-medium text-earth-800">{preset.name}</div>
              <div className="text-xs text-earth-600 mt-1">
                {Object.entries(preset.values).map(([attr, value]) => 
                  `${attr.charAt(0).toUpperCase()}${value}`
                ).join(' ')}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Balance Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-forest-50 border border-forest-200 rounded-lg p-4"
      >
        <div className="flex items-start">
          <span className="text-forest-600 mr-3 text-xl">⚖️</span>
          <div>
            <h4 className="font-medium text-forest-800 mb-1">Balance Strategy</h4>
            <p className="text-forest-700 text-sm">
              Balanced attributes work well for beginners, but specializing can create powerful advantages. 
              High strength colonies excel in combat, while high intelligence colonies develop faster technologies.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AttributesStep; 
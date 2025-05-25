import { motion } from 'framer-motion';

const ReviewStep = ({ formData, COLONY_TYPES, COLONY_COLORS, getFinalAttributes }) => {
  const finalAttributes = getFinalAttributes();
  const colonyType = COLONY_TYPES[formData.type];
  const selectedColor = COLONY_COLORS.find(color => color.value === formData.color);

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-forest-800 mb-2">Review Your Colony</h2>
        <p className="text-earth-600">
          Take a final look at your colony settings before creating your ant empire
        </p>
      </div>

      {/* Colony Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-forest-50 to-earth-50 border border-forest-200 rounded-lg p-6"
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block p-4 rounded-full border-4 border-white shadow-lg mb-4"
            style={{ backgroundColor: formData.color }}
          >
            <span className="text-3xl">🏰</span>
          </motion.div>
          <h3 className="text-2xl font-bold text-forest-800 mb-2">
            {formData.name || 'Unnamed Colony'}
          </h3>
          {formData.description && (
            <p className="text-earth-600 italic">"{formData.description}"</p>
          )}
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-white rounded border border-earth-200">
            <div className="text-lg font-bold text-forest-600">
              {colonyType.name}
            </div>
            <div className="text-sm text-earth-500">Colony Type</div>
          </div>
          <div className="text-center p-3 bg-white rounded border border-earth-200">
            <div className="text-lg font-bold text-forest-600">
              {selectedColor?.name || 'Custom'}
            </div>
            <div className="text-sm text-earth-500">Color Theme</div>
          </div>
          <div className="text-center p-3 bg-white rounded border border-earth-200">
            <div className="text-lg font-bold text-forest-600 capitalize">
              {formData.difficulty_level}
            </div>
            <div className="text-sm text-earth-500">Difficulty</div>
          </div>
          <div className="text-center p-3 bg-white rounded border border-earth-200">
            <div className="text-lg font-bold text-forest-600">
              5 Ants
            </div>
            <div className="text-sm text-earth-500">Starting Force</div>
          </div>
        </div>
      </motion.div>

      {/* Attributes Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-semibold text-earth-800 mb-4">Final Attributes</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Object.entries(finalAttributes).map(([attr, value]) => {
            const baseValue = formData.attributes[attr];
            const bonus = colonyType.bonuses[attr] || 0;
            
            return (
              <div key={attr} className="text-center">
                <div className="text-3xl mb-2">
                  {attr === 'strength' && '💪'}
                  {attr === 'speed' && '⚡'}
                  {attr === 'intelligence' && '🧠'}
                  {attr === 'defense' && '🛡️'}
                </div>
                <div className="capitalize font-medium text-earth-800 mb-1">{attr}</div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-forest-600">{value}</div>
                  {bonus !== 0 && (
                    <div className="text-xs text-earth-500">
                      {baseValue} base {bonus > 0 ? '+' : ''}{bonus} type
                    </div>
                  )}
                </div>
                
                {/* Visual Bar */}
                <div className="mt-2">
                  <div className="w-full bg-earth-200 rounded-full h-2">
                    <div
                      className="bg-forest-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(value / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Colony Type Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-semibold text-earth-800 mb-4">Colony Strategy: {colonyType.name}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-earth-700 mb-2">Description</h5>
            <p className="text-earth-600 text-sm mb-4">{colonyType.description}</p>
            
            <h5 className="font-medium text-earth-700 mb-2">Attribute Bonuses</h5>
            <div className="space-y-1">
              {Object.entries(colonyType.bonuses).map(([attr, bonus]) => (
                <div key={attr} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-earth-600">{attr}</span>
                  <span className={`font-medium ${
                    bonus > 0 ? 'text-green-600' : 
                    bonus < 0 ? 'text-red-600' : 'text-earth-500'
                  }`}>
                    {bonus > 0 ? '+' : ''}{bonus}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-earth-700 mb-2">Strategic Advantages</h5>
            <div className="space-y-2 text-sm text-earth-600">
              {formData.type === 'aggressive' && (
                <>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Superior combat effectiveness
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Faster territory expansion
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">-</span>
                    Higher resource consumption
                  </div>
                </>
              )}
              
              {formData.type === 'defensive' && (
                <>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Excellent resource efficiency
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Strong defensive capabilities
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-600 mr-2">-</span>
                    Slower expansion rate
                  </div>
                </>
              )}
              
              {formData.type === 'balanced' && (
                <>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Well-rounded capabilities
                  </div>
                  <div className="flex items-center">
                    <span className="text-green-600 mr-2">✓</span>
                    Adaptable to any strategy
                  </div>
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-2">○</span>
                    No specialized bonuses
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Starting Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-earth-50 border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-semibold text-earth-800 mb-4">Starting Conditions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 className="font-medium text-earth-700 mb-2">Initial Ants</h5>
            <div className="space-y-1 text-sm text-earth-600">
              <div>👑 1 Queen (Nurse)</div>
              <div>👷 2 Workers</div>
              <div>🕵️ 1 Forager</div>
              <div>⚔️ 1 Soldier</div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-earth-700 mb-2">Resources</h5>
            <div className="space-y-1 text-sm text-earth-600">
              <div>🍯 100 Food units</div>
              <div>🏠 Basic nest chamber</div>
              <div>📦 Small storage area</div>
              <div>🌱 Territory: 5x5 tiles</div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-earth-700 mb-2">Difficulty Effects</h5>
            <div className="space-y-1 text-sm text-earth-600">
              {formData.difficulty_level === 'easy' && (
                <>
                  <div>🍃 +50% resource spawns</div>
                  <div>🐌 Slower threat progression</div>
                </>
              )}
              {formData.difficulty_level === 'medium' && (
                <>
                  <div>⚖️ Standard resource spawns</div>
                  <div>🎯 Balanced threat level</div>
                </>
              )}
              {formData.difficulty_level === 'hard' && (
                <>
                  <div>💎 -25% resource spawns</div>
                  <div>💨 Faster threat progression</div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Final Confirmation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-forest-50 border border-forest-200 rounded-lg p-6 text-center"
      >
        <div className="text-4xl mb-4">🐜👑🐜</div>
        <h4 className="font-semibold text-forest-800 mb-2">Ready to Begin Your Colony?</h4>
        <p className="text-forest-700 text-sm mb-4">
          Your ant colony "{formData.name}" is ready to be established. Once created, 
          you'll begin with your starting ants and can immediately begin expanding your territory, 
          gathering resources, and building your underground empire.
        </p>
        <div className="text-xs text-forest-600">
          Click "Create Colony" below to start your adventure!
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewStep; 
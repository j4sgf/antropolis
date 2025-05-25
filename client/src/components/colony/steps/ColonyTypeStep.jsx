import { motion } from 'framer-motion';

const ColonyTypeStep = ({ formData, updateField, COLONY_TYPES, getFinalAttributes }) => {
  const finalAttributes = getFinalAttributes();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-forest-800 mb-2">Choose Your Strategy</h2>
        <p className="text-earth-600">
          Select a colony type that matches your preferred playstyle. Each type provides bonuses to certain attributes.
        </p>
      </div>

      {/* Colony Type Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(COLONY_TYPES).map(([key, type], index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => updateField('type', key)}
            className={`
              p-6 rounded-lg border-2 cursor-pointer transition-all duration-300
              ${formData.type === key
                ? 'border-forest-500 bg-forest-50 shadow-lg'
                : 'border-earth-200 bg-white hover:border-earth-300 hover:shadow-md'
              }
            `}
          >
            {/* Type Header */}
            <div className="text-center mb-4">
              <div 
                className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                style={{ backgroundColor: type.color + '20', borderColor: type.color }}
              >
                {key === 'aggressive' && '⚔️'}
                {key === 'defensive' && '🛡️'}
                {key === 'balanced' && '⚖️'}
              </div>
              <h3 className="text-xl font-bold text-earth-800">{type.name}</h3>
              <p className="text-sm text-earth-600 mt-2">{type.description}</p>
            </div>

            {/* Attribute Bonuses */}
            <div className="mb-4">
              <h4 className="font-medium text-earth-700 mb-2">Attribute Bonuses:</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(type.bonuses).map(([attr, bonus]) => (
                  <div key={attr} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-earth-600">{attr}:</span>
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

            {/* Selection Indicator */}
            <div className="text-center">
              <div className={`
                w-6 h-6 rounded-full border-2 mx-auto transition-all
                ${formData.type === key
                  ? 'bg-forest-500 border-forest-500'
                  : 'border-earth-300'
                }
              `}>
                {formData.type === key && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-full h-full flex items-center justify-center text-white text-xs"
                  >
                    ✓
                  </motion.div>
                )}
              </div>
            </div>

            {/* Playstyle Tips */}
            <div className="mt-4 p-3 bg-earth-25 rounded border border-earth-100">
              <div className="text-xs text-earth-600">
                <strong>Best for:</strong>
                {key === 'aggressive' && ' Players who enjoy combat and rapid expansion'}
                {key === 'defensive' && ' Players who prefer building and resource management'}
                {key === 'balanced' && ' Players who want flexibility and well-rounded gameplay'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Final Attributes Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-medium text-earth-800 mb-4">Final Attributes Preview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(finalAttributes).map(([attr, value]) => {
            const bonus = COLONY_TYPES[formData.type].bonuses[attr] || 0;
            const baseValue = formData.attributes[attr];
            
            return (
              <div key={attr} className="text-center">
                <div className="text-lg font-bold text-earth-800 mb-1">
                  {attr === 'strength' && '💪'}
                  {attr === 'speed' && '⚡'}
                  {attr === 'intelligence' && '🧠'}
                  {attr === 'defense' && '🛡️'}
                </div>
                <div className="capitalize text-sm text-earth-600 mb-1">{attr}</div>
                <div className="flex items-center justify-center space-x-1">
                  <span className="text-earth-500">{baseValue}</span>
                  {bonus !== 0 && (
                    <>
                      <span className="text-earth-400">
                        {bonus > 0 ? '+' : ''}{bonus}
                      </span>
                      <span className="text-earth-400">=</span>
                    </>
                  )}
                  <span className="font-bold text-forest-600">{value}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Strategy Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-earth-50 border border-earth-200 rounded-lg p-6"
      >
        <h4 className="font-medium text-earth-800 mb-4">Strategy Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-earth-200">
                <th className="text-left py-2 text-earth-700">Aspect</th>
                <th className="text-center py-2 text-red-700">Aggressive</th>
                <th className="text-center py-2 text-blue-700">Defensive</th>
                <th className="text-center py-2 text-purple-700">Balanced</th>
              </tr>
            </thead>
            <tbody className="text-earth-600">
              <tr className="border-b border-earth-100">
                <td className="py-2 font-medium">Combat</td>
                <td className="text-center py-2">Excellent</td>
                <td className="text-center py-2">Good</td>
                <td className="text-center py-2">Good</td>
              </tr>
              <tr className="border-b border-earth-100">
                <td className="py-2 font-medium">Expansion</td>
                <td className="text-center py-2">Fast</td>
                <td className="text-center py-2">Slow</td>
                <td className="text-center py-2">Moderate</td>
              </tr>
              <tr className="border-b border-earth-100">
                <td className="py-2 font-medium">Resource Efficiency</td>
                <td className="text-center py-2">Low</td>
                <td className="text-center py-2">High</td>
                <td className="text-center py-2">Moderate</td>
              </tr>
              <tr>
                <td className="py-2 font-medium">Difficulty</td>
                <td className="text-center py-2">High</td>
                <td className="text-center py-2">Medium</td>
                <td className="text-center py-2">Low</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-forest-50 border border-forest-200 rounded-lg p-4"
      >
        <div className="flex items-start">
          <span className="text-forest-600 mr-3 text-xl">💡</span>
          <div>
            <h4 className="font-medium text-forest-800 mb-1">Strategy Tip</h4>
            <p className="text-forest-700 text-sm">
              Your colony type affects your starting bonuses, but you can still adapt your strategy 
              as you play. Aggressive colonies can learn to be defensive, and defensive colonies can 
              become formidable attackers with the right upgrades.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ColonyTypeStep; 
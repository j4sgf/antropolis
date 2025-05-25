import { motion } from 'framer-motion';

const BasicInfoStep = ({ formData, errors, updateField }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-forest-800 mb-2">Basic Information</h2>
        <p className="text-earth-600">
          Let's start by giving your colony a name and description
        </p>
      </div>

      {/* Colony Name */}
      <div>
        <label htmlFor="colony-name" className="block text-sm font-medium text-earth-700 mb-2">
          Colony Name <span className="text-red-500">*</span>
        </label>
        <motion.input
          whileFocus={{ scale: 1.01 }}
          id="colony-name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Enter your colony name"
          className={`
            w-full px-4 py-3 border rounded-lg text-earth-800 placeholder-earth-400
            focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent
            transition-all duration-200
            ${errors.name 
              ? 'border-red-300 bg-red-50' 
              : 'border-earth-300 bg-white hover:border-earth-400'
            }
          `}
          maxLength={20}
        />
        <div className="flex justify-between items-center mt-1">
          {errors.name ? (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-600 text-sm"
            >
              {errors.name}
            </motion.span>
          ) : (
            <span className="text-earth-500 text-sm">
              3-20 characters, letters, numbers, and basic punctuation
            </span>
          )}
          <span className={`text-sm ${formData.name.length > 15 ? 'text-amber-600' : 'text-earth-400'}`}>
            {formData.name.length}/20
          </span>
        </div>
      </div>

      {/* Colony Description */}
      <div>
        <label htmlFor="colony-description" className="block text-sm font-medium text-earth-700 mb-2">
          Colony Description
        </label>
        <motion.textarea
          whileFocus={{ scale: 1.01 }}
          id="colony-description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Describe your colony's background or goals (optional)"
          rows={4}
          className="
            w-full px-4 py-3 border border-earth-300 rounded-lg text-earth-800 placeholder-earth-400
            focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent
            bg-white hover:border-earth-400 transition-all duration-200 resize-none
          "
          maxLength={200}
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-earth-500 text-sm">
            Optional - Tell other players about your colony
          </span>
          <span className={`text-sm ${formData.description.length > 150 ? 'text-amber-600' : 'text-earth-400'}`}>
            {formData.description.length}/200
          </span>
        </div>
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-earth-700 mb-3">
          Difficulty Level
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              value: 'easy', 
              name: 'Easy', 
              description: 'More resources, slower threats',
              icon: '🌱',
              color: 'green' 
            },
            { 
              value: 'medium', 
              name: 'Medium', 
              description: 'Balanced gameplay experience',
              icon: '⚖️',
              color: 'blue' 
            },
            { 
              value: 'hard', 
              name: 'Hard', 
              description: 'Limited resources, faster threats',
              icon: '⚔️',
              color: 'red' 
            }
          ].map((difficulty) => (
            <motion.div
              key={difficulty.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateField('difficulty_level', difficulty.value)}
              className={`
                p-4 rounded-lg border-2 cursor-pointer text-center transition-all duration-200
                ${formData.difficulty_level === difficulty.value
                  ? `border-${difficulty.color}-500 bg-${difficulty.color}-50 shadow-md`
                  : 'border-earth-200 bg-white hover:border-earth-300 hover:shadow-sm'
                }
              `}
            >
              <div className="text-2xl mb-2">{difficulty.icon}</div>
              <div className={`font-medium mb-1 ${
                formData.difficulty_level === difficulty.value 
                  ? `text-${difficulty.color}-800` 
                  : 'text-earth-800'
              }`}>
                {difficulty.name}
              </div>
              <div className="text-sm text-earth-600">
                {difficulty.description}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-forest-50 border border-forest-200 rounded-lg p-4 mt-8"
      >
        <div className="flex items-start">
          <span className="text-forest-600 mr-3 text-xl">💡</span>
          <div>
            <h4 className="font-medium text-forest-800 mb-1">Tip</h4>
            <p className="text-forest-700 text-sm">
              Choose a memorable name for your colony - it will be displayed to other players 
              when they encounter your territory. Your difficulty level affects resource 
              availability and threat frequency but can be changed later in settings.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BasicInfoStep; 
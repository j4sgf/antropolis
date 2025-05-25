import { useState } from 'react';
import { motion } from 'framer-motion';
import ColonyCreationForm from '../components/colony/ColonyCreationForm';

const CreateColony = ({ onColonyCreated, onCancel }) => {
  const [showForm, setShowForm] = useState(false);

  const handleStartCreation = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    onCancel && onCancel();
  };

  const handleColonyCreated = (colony) => {
    console.log('Colony created:', colony);
    onColonyCreated && onColonyCreated(colony);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-earth-50 to-forest-50 py-8">
        <ColonyCreationForm 
          onColonyCreated={handleColonyCreated}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-50 to-forest-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-8xl mb-8"
        >
          🐜🏰
        </motion.div>

        <h1 className="text-4xl font-bold text-forest-800 mb-4">
          Establish Your Colony
        </h1>
        
        <p className="text-xl text-earth-600 mb-8 leading-relaxed">
          Welcome, future colony leader! You're about to embark on an incredible journey 
          of building and managing your own ant civilization. Create a colony that reflects 
          your strategic vision and lead your ants to greatness.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white rounded-lg border border-earth-200 shadow-sm"
          >
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-earth-800 mb-2">Choose Strategy</h3>
            <p className="text-sm text-earth-600">
              Select attributes and colony type that match your preferred playstyle
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white rounded-lg border border-earth-200 shadow-sm"
          >
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-semibold text-earth-800 mb-2">Customize Look</h3>
            <p className="text-sm text-earth-600">
              Design your colony's visual identity with colors and themes
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 bg-white rounded-lg border border-earth-200 shadow-sm"
          >
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-semibold text-earth-800 mb-2">Start Adventure</h3>
            <p className="text-sm text-earth-600">
              Begin with your initial ants and start building your empire
            </p>
          </motion.div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartCreation}
          className="bg-forest-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-forest-700 transition-colors"
        >
          Create Your Colony
        </motion.button>

        <div className="mt-8 text-sm text-earth-500">
          The creation process takes about 2-3 minutes and covers all aspects of your colony setup
        </div>
      </motion.div>
    </div>
  );
};

export default CreateColony; 
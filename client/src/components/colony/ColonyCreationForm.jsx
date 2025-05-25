import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useColonyForm } from '../../hooks/useColonyForm';
import colonyService from '../../services/colonyService';

// Import step components
import BasicInfoStep from './steps/BasicInfoStep';
import AttributesStep from './steps/AttributesStep';
import ColonyTypeStep from './steps/ColonyTypeStep';
import AppearanceStep from './steps/AppearanceStep';
import ReviewStep from './steps/ReviewStep';

const ColonyCreationForm = ({ onColonyCreated, onCancel }) => {
  const {
    currentStep,
    formData,
    errors,
    isSubmitting,
    steps,
    updateField,
    updateAttribute,
    nextStep,
    prevStep,
    goToStep,
    validateForm,
    resetForm,
    setIsSubmitting,
    getFinalAttributes,
    getRemainingPoints,
    COLONY_TYPES,
    COLONY_COLORS,
    TOTAL_ATTRIBUTE_POINTS
  } = useColonyForm();

  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Step components mapping
  const stepComponents = {
    0: BasicInfoStep,
    1: AttributesStep,
    2: ColonyTypeStep,
    3: AppearanceStep,
    4: ReviewStep
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare colony data for API
      const colonyData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        difficulty_level: formData.difficulty_level,
        // For now, use a test user ID (in real app, this would come from auth)
        user_id: '00000000-0000-0000-0000-000000000001',
        // Store attributes and type in the description for now
        // (in the future, we might extend the database schema)
        metadata: {
          type: formData.type,
          base_attributes: formData.attributes,
          final_attributes: getFinalAttributes()
        }
      };

      const result = await colonyService.createColony(colonyData);
      
      if (result.success) {
        setSubmitSuccess(true);
        // Call the callback after a brief delay to show success state
        setTimeout(() => {
          onColonyCreated && onColonyCreated(result.data);
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to create colony');
      }
    } catch (error) {
      console.error('Colony creation error:', error);
      setSubmitError(error.message || 'Failed to create colony. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle navigation
  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      // Last step - submit the form
      handleSubmit();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    if (currentStep === 0) {
      // First step - cancel the form
      onCancel && onCancel();
    } else {
      prevStep();
    }
  };

  // Get current step component
  const CurrentStepComponent = stepComponents[currentStep];

  // Success screen
  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto p-8 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: 2 }}
          className="text-6xl mb-6"
        >
          🐜🎉
        </motion.div>
        <h2 className="text-3xl font-bold text-forest-800 mb-4">
          Colony Created Successfully!
        </h2>
        <p className="text-earth-600 text-lg mb-6">
          Welcome to {formData.name}! Your ant colony is ready to begin its journey.
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600"></div>
          <span className="ml-3 text-forest-600">Starting your colony...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-forest-800">Create Your Colony</h1>
          <button
            onClick={onCancel}
            className="text-earth-500 hover:text-earth-700 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Step Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 cursor-pointer
                  ${index <= currentStep 
                    ? 'bg-forest-600 border-forest-600 text-white' 
                    : 'bg-white border-earth-300 text-earth-400'
                  }
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => goToStep(index)}
              >
                {index + 1}
              </motion.div>
              <div className="ml-3 hidden md:block">
                <div className={`font-medium ${index <= currentStep ? 'text-forest-800' : 'text-earth-400'}`}>
                  {step.title}
                </div>
                <div className={`text-sm ${index <= currentStep ? 'text-forest-600' : 'text-earth-400'}`}>
                  {step.description}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-4 ${index < currentStep ? 'bg-forest-600' : 'bg-earth-300'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-lg p-8 min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentStepComponent
              formData={formData}
              errors={errors}
              updateField={updateField}
              updateAttribute={updateAttribute}
              getFinalAttributes={getFinalAttributes}
              getRemainingPoints={getRemainingPoints}
              COLONY_TYPES={COLONY_TYPES}
              COLONY_COLORS={COLONY_COLORS}
              TOTAL_ATTRIBUTE_POINTS={TOTAL_ATTRIBUTE_POINTS}
            />
          </motion.div>
        </AnimatePresence>

        {/* Error Display */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-800">{submitError}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex justify-between items-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePrevious}
          className="px-6 py-3 border border-earth-300 text-earth-700 rounded-lg hover:bg-earth-50 transition-colors"
          disabled={isSubmitting}
        >
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </motion.button>

        <div className="text-sm text-earth-500">
          Step {currentStep + 1} of {steps.length}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          disabled={isSubmitting}
          className={`
            px-6 py-3 rounded-lg font-medium transition-all
            ${isSubmitting 
              ? 'bg-earth-300 text-earth-500 cursor-not-allowed' 
              : 'bg-forest-600 text-white hover:bg-forest-700'
            }
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </div>
          ) : currentStep === steps.length - 1 ? (
            'Create Colony'
          ) : (
            'Next'
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default ColonyCreationForm; 
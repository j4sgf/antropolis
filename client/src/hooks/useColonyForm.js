import { useState, useCallback } from 'react';

// Colony type configurations
export const COLONY_TYPES = {
  aggressive: {
    name: 'Aggressive',
    description: 'High attack power, faster expansion, but higher food consumption',
    bonuses: { strength: 2, speed: 1, intelligence: -1, defense: 0 },
    color: '#DC2626'
  },
  defensive: {
    name: 'Defensive',
    description: 'Strong defense, efficient resource usage, but slower expansion',
    bonuses: { strength: -1, speed: -1, intelligence: 1, defense: 3 },
    color: '#059669'
  },
  balanced: {
    name: 'Balanced',
    description: 'Well-rounded stats suitable for most strategies',
    bonuses: { strength: 0, speed: 0, intelligence: 0, defense: 0 },
    color: '#7C3AED'
  }
};

// Available colony colors
export const COLONY_COLORS = [
  { name: 'Earth Brown', value: '#8B4513' },
  { name: 'Forest Green', value: '#228B22' },
  { name: 'Sunset Orange', value: '#FF8C00' },
  { name: 'Royal Purple', value: '#6A0DAD' },
  { name: 'Crimson Red', value: '#DC143C' },
  { name: 'Ocean Blue', value: '#4682B4' },
  { name: 'Golden Yellow', value: '#FFD700' },
  { name: 'Charcoal Black', value: '#36454F' }
];

// Default attribute values
const DEFAULT_ATTRIBUTES = {
  strength: 5,
  speed: 5,
  intelligence: 5,
  defense: 5
};

const TOTAL_ATTRIBUTE_POINTS = 20;

export const useColonyForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'balanced',
    attributes: { ...DEFAULT_ATTRIBUTES },
    color: COLONY_COLORS[0].value,
    difficulty_level: 'medium'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form steps
  const steps = [
    { id: 'basic', title: 'Basic Info', description: 'Name and describe your colony' },
    { id: 'attributes', title: 'Attributes', description: 'Distribute attribute points' },
    { id: 'type', title: 'Colony Type', description: 'Choose your strategy' },
    { id: 'appearance', title: 'Appearance', description: 'Customize colors and style' },
    { id: 'review', title: 'Review', description: 'Confirm your choices' }
  ];

  // Validation functions
  const validateName = useCallback((name) => {
    if (!name || name.trim().length === 0) {
      return 'Colony name is required';
    }
    if (name.trim().length < 3) {
      return 'Colony name must be at least 3 characters long';
    }
    if (name.trim().length > 20) {
      return 'Colony name must be no more than 20 characters long';
    }
    if (!/^[a-zA-Z0-9\s\-_']+$/.test(name)) {
      return 'Colony name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes';
    }
    return null;
  }, []);

  const validateAttributes = useCallback((attributes) => {
    const total = Object.values(attributes).reduce((sum, value) => sum + value, 0);
    if (total !== TOTAL_ATTRIBUTE_POINTS) {
      return `You must use exactly ${TOTAL_ATTRIBUTE_POINTS} attribute points (currently using ${total})`;
    }
    
    const minValue = Math.min(...Object.values(attributes));
    const maxValue = Math.max(...Object.values(attributes));
    
    if (minValue < 1) {
      return 'Each attribute must be at least 1';
    }
    if (maxValue > 10) {
      return 'No attribute can exceed 10 points';
    }
    
    return null;
  }, []);

  // Update form data
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when it's updated
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  }, [errors]);

  // Update attributes with point distribution logic
  const updateAttribute = useCallback((attribute, value) => {
    const newValue = Math.max(1, Math.min(10, value));
    
    setFormData(prev => {
      const newAttributes = { ...prev.attributes };
      const oldValue = newAttributes[attribute];
      const difference = newValue - oldValue;
      
      // Check if we have enough points to increase
      const currentTotal = Object.values(newAttributes).reduce((sum, val) => sum + val, 0);
      if (currentTotal + difference > TOTAL_ATTRIBUTE_POINTS) {
        // If increasing would exceed limit, don't update
        if (difference > 0) {
          return prev;
        }
      }
      
      newAttributes[attribute] = newValue;
      
      return {
        ...prev,
        attributes: newAttributes
      };
    });

    // Clear attributes error when updating
    if (errors.attributes) {
      setErrors(prev => ({
        ...prev,
        attributes: null
      }));
    }
  }, [errors.attributes]);

  // Navigation functions
  const nextStep = useCallback(() => {
    // Validate current step before proceeding
    const currentStepId = steps[currentStep].id;
    let stepErrors = {};

    switch (currentStepId) {
      case 'basic':
        const nameError = validateName(formData.name);
        if (nameError) {
          stepErrors.name = nameError;
        }
        break;
      case 'attributes':
        const attributeError = validateAttributes(formData.attributes);
        if (attributeError) {
          stepErrors.attributes = attributeError;
        }
        break;
      default:
        break;
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...stepErrors }));
      return false;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      return true;
    }
    return false;
  }, [currentStep, formData, steps, validateName, validateAttributes]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  // Validation for entire form
  const validateForm = useCallback(() => {
    const formErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) {
      formErrors.name = nameError;
    }

    const attributeError = validateAttributes(formData.attributes);
    if (attributeError) {
      formErrors.attributes = attributeError;
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  }, [formData, validateName, validateAttributes]);

  // Calculate final attributes with colony type bonuses
  const getFinalAttributes = useCallback(() => {
    const typeConfig = COLONY_TYPES[formData.type];
    const finalAttributes = {};

    Object.keys(formData.attributes).forEach(attr => {
      finalAttributes[attr] = Math.max(1, formData.attributes[attr] + (typeConfig.bonuses[attr] || 0));
    });

    return finalAttributes;
  }, [formData.attributes, formData.type]);

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setFormData({
      name: '',
      description: '',
      type: 'balanced',
      attributes: { ...DEFAULT_ATTRIBUTES },
      color: COLONY_COLORS[0].value,
      difficulty_level: 'medium'
    });
    setErrors({});
    setIsSubmitting(false);
  }, []);

  // Calculate remaining attribute points
  const getRemainingPoints = useCallback(() => {
    const used = Object.values(formData.attributes).reduce((sum, value) => sum + value, 0);
    return TOTAL_ATTRIBUTE_POINTS - used;
  }, [formData.attributes]);

  return {
    // Form state
    currentStep,
    formData,
    errors,
    isSubmitting,
    steps,
    
    // Actions
    updateField,
    updateAttribute,
    nextStep,
    prevStep,
    goToStep,
    validateForm,
    resetForm,
    setIsSubmitting,
    
    // Computed values
    getFinalAttributes,
    getRemainingPoints,
    
    // Constants
    COLONY_TYPES,
    COLONY_COLORS,
    TOTAL_ATTRIBUTE_POINTS
  };
}; 
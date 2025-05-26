/**
 * Ant Visual Configuration
 * Part of Task 15.1: Create Ant Type Base Styling Components
 * Defines visual characteristics for different ant roles
 */

export const antVisualConfig = {
  // Worker Ants - Balanced build, medium size
  worker: {
    baseClasses: 'ant-worker text-amber-600',
    bodyClasses: 'ant-body-balanced',
    headClasses: 'ant-head-medium',
    thoraxClasses: 'ant-thorax-balanced',
    abdomenClasses: 'ant-abdomen-medium',
    bodyStyle: {
      backgroundColor: '#d97706',
      borderColor: '#92400e'
    },
    colorScheme: {
      primary: '#d97706',
      secondary: '#92400e',
      accent: '#fbbf24'
    },
    traits: ['balanced', 'versatile', 'reliable']
  },

  // Soldier Ants - Large, robust build with prominent mandibles
  soldier: {
    baseClasses: 'ant-soldier text-red-700',
    bodyClasses: 'ant-body-robust',
    headClasses: 'ant-head-large',
    thoraxClasses: 'ant-thorax-muscular',
    abdomenClasses: 'ant-abdomen-thick',
    bodyStyle: {
      backgroundColor: '#b91c1c',
      borderColor: '#7f1d1d',
      fontWeight: 'bold'
    },
    colorScheme: {
      primary: '#b91c1c',
      secondary: '#7f1d1d',
      accent: '#dc2626'
    },
    traits: ['strong', 'defensive', 'aggressive']
  },

  // Scout Ants - Sleek build with prominent antennae
  scout: {
    baseClasses: 'ant-scout text-green-600',
    bodyClasses: 'ant-body-sleek',
    headClasses: 'ant-head-alert',
    thoraxClasses: 'ant-thorax-agile',
    abdomenClasses: 'ant-abdomen-streamlined',
    bodyStyle: {
      backgroundColor: '#059669',
      borderColor: '#047857'
    },
    colorScheme: {
      primary: '#059669',
      secondary: '#047857',
      accent: '#10b981'
    },
    traits: ['fast', 'perceptive', 'agile']
  },

  // Nurse Ants - Gentle appearance with specialized abdomen
  nurse: {
    baseClasses: 'ant-nurse text-pink-600',
    bodyClasses: 'ant-body-caring',
    headClasses: 'ant-head-gentle',
    thoraxClasses: 'ant-thorax-delicate',
    abdomenClasses: 'ant-abdomen-specialized',
    bodyStyle: {
      backgroundColor: '#db2777',
      borderColor: '#be185d'
    },
    colorScheme: {
      primary: '#db2777',
      secondary: '#be185d',
      accent: '#ec4899'
    },
    traits: ['nurturing', 'careful', 'dedicated']
  },

  // Forager Ants - Medium build optimized for carrying
  forager: {
    baseClasses: 'ant-forager text-yellow-600',
    bodyClasses: 'ant-body-sturdy',
    headClasses: 'ant-head-focused',
    thoraxClasses: 'ant-thorax-strong',
    abdomenClasses: 'ant-abdomen-expandable',
    bodyStyle: {
      backgroundColor: '#ca8a04',
      borderColor: '#a16207'
    },
    colorScheme: {
      primary: '#ca8a04',
      secondary: '#a16207',
      accent: '#eab308'
    },
    traits: ['persistent', 'efficient', 'resourceful']
  },

  // Builder Ants - Robust build with construction adaptations
  builder: {
    baseClasses: 'ant-builder text-orange-600',
    bodyClasses: 'ant-body-construction',
    headClasses: 'ant-head-determined',
    thoraxClasses: 'ant-thorax-powerful',
    abdomenClasses: 'ant-abdomen-armored',
    bodyStyle: {
      backgroundColor: '#ea580c',
      borderColor: '#c2410c'
    },
    colorScheme: {
      primary: '#ea580c',
      secondary: '#c2410c',
      accent: '#fb923c'
    },
    traits: ['methodical', 'strong', 'precise']
  },

  // Queen Ant - Majestic, larger with special markings
  queen: {
    baseClasses: 'ant-queen text-purple-700',
    bodyClasses: 'ant-body-majestic',
    headClasses: 'ant-head-crowned',
    thoraxClasses: 'ant-thorax-regal',
    abdomenClasses: 'ant-abdomen-royal',
    bodyStyle: {
      backgroundColor: '#7c3aed',
      borderColor: '#5b21b6',
      boxShadow: '0 0 10px rgba(124, 58, 237, 0.5)'
    },
    colorScheme: {
      primary: '#7c3aed',
      secondary: '#5b21b6',
      accent: '#8b5cf6'
    },
    traits: ['commanding', 'fertile', 'wise']
  },

  // Size configurations
  sizes: {
    tiny: {
      width: '12px',
      height: '8px',
      classes: 'ant-size-tiny',
      scale: 0.5
    },
    small: {
      width: '16px',
      height: '12px',
      classes: 'ant-size-small',
      scale: 0.7
    },
    medium: {
      width: '24px',
      height: '16px',
      classes: 'ant-size-medium',
      scale: 1.0
    },
    large: {
      width: '32px',
      height: '24px',
      classes: 'ant-size-large',
      scale: 1.3
    },
    huge: {
      width: '48px',
      height: '32px',
      classes: 'ant-size-huge',
      scale: 1.8
    }
  },

  // Status color schemes
  statusColors: {
    idle: {
      color: '#6b7280',
      backgroundColor: '#f3f4f6'
    },
    busy: {
      color: '#059669',
      backgroundColor: '#dcfce7'
    },
    tired: {
      color: '#d97706',
      backgroundColor: '#fef3c7'
    },
    injured: {
      color: '#dc2626',
      backgroundColor: '#fee2e2'
    },
    carrying: {
      color: '#7c3aed',
      backgroundColor: '#ede9fe'
    }
  },

  // Evolution stage visuals
  evolutionStages: {
    1: { // Basic
      effects: [],
      enhancements: []
    },
    2: { // Experienced
      effects: ['subtle-glow'],
      enhancements: ['experience-marks']
    },
    3: { // Veteran
      effects: ['glow', 'experience-marks'],
      enhancements: ['veteran-scars', 'confidence-boost']
    },
    4: { // Elite
      effects: ['strong-glow', 'experience-marks', 'elite-aura'],
      enhancements: ['battle-scars', 'elite-posture', 'enhanced-features']
    },
    5: { // Legendary
      effects: ['legendary-aura', 'power-emanation'],
      enhancements: ['legendary-marks', 'enhanced-all-features', 'commanding-presence']
    }
  },

  // Animation configurations
  animations: {
    idle: {
      duration: 2000,
      type: 'gentle-sway'
    },
    walking: {
      duration: 800,
      type: 'leg-movement'
    },
    working: {
      duration: 1500,
      type: 'focused-activity'
    },
    combat: {
      duration: 600,
      type: 'aggressive-stance'
    }
  }
};

// Helper functions for visual configuration
export const getAntConfig = (role) => {
  return antVisualConfig[role] || antVisualConfig.worker;
};

export const getSizeConfig = (size) => {
  return antVisualConfig.sizes[size] || antVisualConfig.sizes.medium;
};

export const getStatusColor = (status) => {
  return antVisualConfig.statusColors[status] || antVisualConfig.statusColors.idle;
};

export const getEvolutionEffects = (level) => {
  const stage = Math.min(5, Math.max(1, level));
  return antVisualConfig.evolutionStages[stage];
};

export default antVisualConfig; 
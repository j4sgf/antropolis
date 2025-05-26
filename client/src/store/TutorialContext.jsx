import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { TUTORIAL_STEP_DEFINITIONS, getEnhancedStepData } from '../data/tutorialSteps';
import TutorialController from '../services/TutorialController';

// Tutorial steps definitions
export const TUTORIAL_STEPS = {
  WELCOME: 'welcome',
  COLONY_CREATION: 'colony_creation',
  COLONY_NAMING: 'colony_naming',
  COLONY_ATTRIBUTES: 'colony_attributes',
  COLONY_CONFIRM: 'colony_confirm',
  FIRST_VIEW: 'first_view',
  UI_OVERVIEW: 'ui_overview',
  LEFT_PANEL_INTRO: 'left_panel_intro',
  COLONY_STATS: 'colony_stats',
  RESOURCE_OVERVIEW: 'resource_overview',
  ANT_ROLES_INTRO: 'ant_roles_intro',
  ASSIGN_WORKER: 'assign_worker',
  ASSIGN_SCOUT: 'assign_scout',
  CENTER_PANEL_INTRO: 'center_panel_intro',
  ZOOM_CONTROLS: 'zoom_controls',
  ANT_MOVEMENT: 'ant_movement',
  FORAGING_BASICS: 'foraging_basics',
  RESOURCE_COLLECTION: 'resource_collection',
  RIGHT_PANEL_INTRO: 'right_panel_intro',
  EVOLUTION_TREE: 'evolution_tree',
  RESOURCE_MANAGEMENT: 'resource_management',
  BUILDING_INTRO: 'building_intro',
  PLACE_STRUCTURE: 'place_structure',
  STRUCTURE_BENEFITS: 'structure_benefits',
  BATTLE_INTRO: 'battle_intro',
  DEFENSE_BASICS: 'defense_basics',
  ATTACK_TUTORIAL: 'attack_tutorial',
  TUTORIAL_COMPLETE: 'tutorial_complete'
};

// Tutorial step groups for organization
export const TUTORIAL_GROUPS = {
  SETUP: [
    TUTORIAL_STEPS.WELCOME,
    TUTORIAL_STEPS.COLONY_CREATION,
    TUTORIAL_STEPS.COLONY_NAMING,
    TUTORIAL_STEPS.COLONY_ATTRIBUTES,
    TUTORIAL_STEPS.COLONY_CONFIRM
  ],
  UI_BASICS: [
    TUTORIAL_STEPS.FIRST_VIEW,
    TUTORIAL_STEPS.UI_OVERVIEW,
    TUTORIAL_STEPS.LEFT_PANEL_INTRO,
    TUTORIAL_STEPS.CENTER_PANEL_INTRO,
    TUTORIAL_STEPS.RIGHT_PANEL_INTRO
  ],
  COLONY_MANAGEMENT: [
    TUTORIAL_STEPS.COLONY_STATS,
    TUTORIAL_STEPS.RESOURCE_OVERVIEW,
    TUTORIAL_STEPS.ANT_ROLES_INTRO,
    TUTORIAL_STEPS.ASSIGN_WORKER,
    TUTORIAL_STEPS.ASSIGN_SCOUT
  ],
  SIMULATION: [
    TUTORIAL_STEPS.ZOOM_CONTROLS,
    TUTORIAL_STEPS.ANT_MOVEMENT,
    TUTORIAL_STEPS.FORAGING_BASICS,
    TUTORIAL_STEPS.RESOURCE_COLLECTION
  ],
  ADVANCED: [
    TUTORIAL_STEPS.EVOLUTION_TREE,
    TUTORIAL_STEPS.RESOURCE_MANAGEMENT,
    TUTORIAL_STEPS.BUILDING_INTRO,
    TUTORIAL_STEPS.PLACE_STRUCTURE,
    TUTORIAL_STEPS.STRUCTURE_BENEFITS
  ],
  COMBAT: [
    TUTORIAL_STEPS.BATTLE_INTRO,
    TUTORIAL_STEPS.DEFENSE_BASICS,
    TUTORIAL_STEPS.ATTACK_TUTORIAL
  ],
  COMPLETION: [
    TUTORIAL_STEPS.TUTORIAL_COMPLETE
  ]
};

// Initial tutorial state
const initialState = {
  isActive: false,
  isCompleted: false,
  isSkipped: false,
  currentStep: null,
  currentGroup: null,
  completedSteps: [],
  stepProgress: {},
  settings: {
    showTooltips: true,
    autoProgress: false,
    skipIntroduction: false,
    reminderFrequency: 'normal' // 'none', 'low', 'normal', 'high'
  },
  user: null,
  rewardsEarned: []
};

// Tutorial action types
const TUTORIAL_ACTIONS = {
  START_TUTORIAL: 'START_TUTORIAL',
  NEXT_STEP: 'NEXT_STEP',
  PREVIOUS_STEP: 'PREVIOUS_STEP',
  GO_TO_STEP: 'GO_TO_STEP',
  COMPLETE_STEP: 'COMPLETE_STEP',
  SKIP_TUTORIAL: 'SKIP_TUTORIAL',
  COMPLETE_TUTORIAL: 'COMPLETE_TUTORIAL',
  RESET_TUTORIAL: 'RESET_TUTORIAL',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_USER: 'SET_USER',
  LOAD_PROGRESS: 'LOAD_PROGRESS',
  AWARD_REWARD: 'AWARD_REWARD',
  PAUSE_TUTORIAL: 'PAUSE_TUTORIAL',
  RESUME_TUTORIAL: 'RESUME_TUTORIAL'
};

// Tutorial reducer
function tutorialReducer(state, action) {
  switch (action.type) {
    case TUTORIAL_ACTIONS.START_TUTORIAL:
      return {
        ...state,
        isActive: true,
        isCompleted: false,
        isSkipped: false,
        currentStep: action.startStep || TUTORIAL_STEPS.WELCOME,
        currentGroup: determineGroup(action.startStep || TUTORIAL_STEPS.WELCOME)
      };

    case TUTORIAL_ACTIONS.NEXT_STEP:
      const nextStep = getNextStep(state.currentStep);
      return {
        ...state,
        currentStep: nextStep,
        currentGroup: determineGroup(nextStep),
        completedSteps: [...state.completedSteps, state.currentStep].filter(Boolean)
      };

    case TUTORIAL_ACTIONS.PREVIOUS_STEP:
      const prevStep = getPreviousStep(state.currentStep);
      return {
        ...state,
        currentStep: prevStep,
        currentGroup: determineGroup(prevStep),
        completedSteps: state.completedSteps.filter(step => step !== state.currentStep)
      };

    case TUTORIAL_ACTIONS.GO_TO_STEP:
      return {
        ...state,
        currentStep: action.step,
        currentGroup: determineGroup(action.step)
      };

    case TUTORIAL_ACTIONS.COMPLETE_STEP:
      const updatedSteps = [...state.completedSteps];
      if (!updatedSteps.includes(action.step)) {
        updatedSteps.push(action.step);
      }
      
      return {
        ...state,
        completedSteps: updatedSteps,
        stepProgress: {
          ...state.stepProgress,
          [action.step]: {
            completedAt: new Date().toISOString(),
            data: action.data || {}
          }
        }
      };

    case TUTORIAL_ACTIONS.SKIP_TUTORIAL:
      return {
        ...state,
        isActive: false,
        isSkipped: true,
        currentStep: null,
        currentGroup: null
      };

    case TUTORIAL_ACTIONS.COMPLETE_TUTORIAL:
      return {
        ...state,
        isActive: false,
        isCompleted: true,
        currentStep: null,
        currentGroup: null,
        completedSteps: Object.values(TUTORIAL_STEPS)
      };

    case TUTORIAL_ACTIONS.RESET_TUTORIAL:
      return {
        ...initialState,
        settings: state.settings,
        user: state.user
      };

    case TUTORIAL_ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.settings
        }
      };

    case TUTORIAL_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.user
      };

    case TUTORIAL_ACTIONS.LOAD_PROGRESS:
      return {
        ...state,
        ...action.progress,
        settings: {
          ...state.settings,
          ...action.progress.settings
        }
      };

    case TUTORIAL_ACTIONS.AWARD_REWARD:
      return {
        ...state,
        rewardsEarned: [
          ...state.rewardsEarned,
          {
            ...action.reward,
            earnedAt: new Date().toISOString()
          }
        ]
      };

    case TUTORIAL_ACTIONS.PAUSE_TUTORIAL:
      return {
        ...state,
        isActive: false
      };

    case TUTORIAL_ACTIONS.RESUME_TUTORIAL:
      return {
        ...state,
        isActive: true
      };

    default:
      return state;
  }
}

// Helper functions
function determineGroup(step) {
  for (const [groupName, steps] of Object.entries(TUTORIAL_GROUPS)) {
    if (steps.includes(step)) {
      return groupName;
    }
  }
  return null;
}

function getNextStep(currentStep) {
  const allSteps = Object.values(TUTORIAL_STEPS);
  const currentIndex = allSteps.indexOf(currentStep);
  return currentIndex < allSteps.length - 1 ? allSteps[currentIndex + 1] : null;
}

function getPreviousStep(currentStep) {
  const allSteps = Object.values(TUTORIAL_STEPS);
  const currentIndex = allSteps.indexOf(currentStep);
  return currentIndex > 0 ? allSteps[currentIndex - 1] : null;
}

// Create context
const TutorialContext = createContext();

// Custom hook for using tutorial context
export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

// Tutorial provider component
export const TutorialProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tutorialReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize TutorialController and load progress on mount
  useEffect(() => {
    const loadTutorialProgress = async () => {
      try {
        // Initialize the tutorial controller
        TutorialController.initialize();
        
        const savedProgress = localStorage.getItem('tutorial-progress');
        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          dispatch({ type: TUTORIAL_ACTIONS.LOAD_PROGRESS, progress });
        }
      } catch (error) {
        console.warn('Failed to load tutorial progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTutorialProgress();

    // Listen for tutorial controller events
    const handleStepCompleted = (event) => {
      const { step } = event.detail;
      dispatch({ type: TUTORIAL_ACTIONS.COMPLETE_STEP, step });
    };

    const handleSkipStep = (event) => {
      const { step } = event.detail;
      dispatch({ type: TUTORIAL_ACTIONS.NEXT_STEP });
    };

    window.addEventListener('tutorial:step-completed', handleStepCompleted);
    window.addEventListener('tutorial:skip-step', handleSkipStep);

    // Cleanup on unmount
    return () => {
      TutorialController.cleanup();
      window.removeEventListener('tutorial:step-completed', handleStepCompleted);
      window.removeEventListener('tutorial:skip-step', handleSkipStep);
    };
  }, []);

  // Save tutorial progress to localStorage whenever state changes
  useEffect(() => {
    if (!isLoading) {
      try {
        const progressToSave = {
          isCompleted: state.isCompleted,
          isSkipped: state.isSkipped,
          completedSteps: state.completedSteps,
          stepProgress: state.stepProgress,
          settings: state.settings,
          rewardsEarned: state.rewardsEarned
        };
        localStorage.setItem('tutorial-progress', JSON.stringify(progressToSave));
      } catch (error) {
        console.warn('Failed to save tutorial progress:', error);
      }
    }
  }, [state, isLoading]);

  // API functions
  const api = {
    // Save progress to backend
    saveProgress: async () => {
      if (!state.user) return;
      
      try {
        const response = await fetch('/api/tutorial/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: state.user.id,
            completedSteps: state.completedSteps,
            isCompleted: state.isCompleted,
            isSkipped: state.isSkipped,
            stepProgress: state.stepProgress,
            rewardsEarned: state.rewardsEarned
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save tutorial progress');
        }
      } catch (error) {
        console.error('Error saving tutorial progress:', error);
      }
    },

    // Load progress from backend
    loadProgress: async (userId) => {
      try {
        const response = await fetch(`/api/tutorial/progress/${userId}`);
        if (response.ok) {
          const progress = await response.json();
          dispatch({ type: TUTORIAL_ACTIONS.LOAD_PROGRESS, progress });
        }
      } catch (error) {
        console.error('Error loading tutorial progress:', error);
      }
    }
  };

  // Tutorial control functions
  const controls = {
    startTutorial: (startStep) => {
      dispatch({ type: TUTORIAL_ACTIONS.START_TUTORIAL, startStep });
    },

    nextStep: () => {
      if (state.currentStep) {
        dispatch({ type: TUTORIAL_ACTIONS.COMPLETE_STEP, step: state.currentStep });
        dispatch({ type: TUTORIAL_ACTIONS.NEXT_STEP });
      }
    },

    previousStep: () => {
      dispatch({ type: TUTORIAL_ACTIONS.PREVIOUS_STEP });
    },

    goToStep: (step) => {
      dispatch({ type: TUTORIAL_ACTIONS.GO_TO_STEP, step });
    },

    completeStep: (step, data) => {
      dispatch({ type: TUTORIAL_ACTIONS.COMPLETE_STEP, step, data });
    },

    skipTutorial: () => {
      dispatch({ type: TUTORIAL_ACTIONS.SKIP_TUTORIAL });
    },

    completeTutorial: () => {
      dispatch({ type: TUTORIAL_ACTIONS.COMPLETE_TUTORIAL });
      // Award completion reward
      controls.awardReward({
        type: 'tutorial_completion',
        name: 'Tutorial Master',
        description: 'Completed the tutorial',
        rewards: {
          evolutionPoints: 100,
          resources: { food: 500, materials: 200 }
        }
      });
    },

    resetTutorial: () => {
      dispatch({ type: TUTORIAL_ACTIONS.RESET_TUTORIAL });
    },

    updateSettings: (settings) => {
      dispatch({ type: TUTORIAL_ACTIONS.UPDATE_SETTINGS, settings });
    },

    setUser: (user) => {
      dispatch({ type: TUTORIAL_ACTIONS.SET_USER, user });
    },

    awardReward: (reward) => {
      dispatch({ type: TUTORIAL_ACTIONS.AWARD_REWARD, reward });
    },

    pauseTutorial: () => {
      dispatch({ type: TUTORIAL_ACTIONS.PAUSE_TUTORIAL });
    },

    resumeTutorial: () => {
      dispatch({ type: TUTORIAL_ACTIONS.RESUME_TUTORIAL });
    },

    // Helper functions
    isStepCompleted: (step) => {
      return state.completedSteps.includes(step);
    },

    getStepProgress: (step) => {
      return state.stepProgress[step] || null;
    },

    getProgressPercentage: () => {
      const totalSteps = Object.values(TUTORIAL_STEPS).length;
      return Math.round((state.completedSteps.length / totalSteps) * 100);
    },

    shouldShowTutorial: () => {
      return !state.isCompleted && !state.isSkipped && !state.settings.skipIntroduction;
    },

    getCurrentGroupSteps: () => {
      return state.currentGroup ? TUTORIAL_GROUPS[state.currentGroup] : [];
    },

    getStepData: (step) => {
      // Use enhanced step data with completion criteria and flow logic
      const enhancedData = getEnhancedStepData(step);
      if (enhancedData) return enhancedData;
      
      // Fallback to basic step data
      return tutorialStepData[step] || null;
    },

    // Enhanced flow control methods
    canCompleteCurrentStep: () => {
      return state.currentStep ? TutorialController.canCompleteStep(state.currentStep) : false;
    },

    getOptimalNextStep: () => {
      if (!state.currentStep) return null;
      return TutorialController.getNextStep(state.currentStep);
    },

    shouldSkipCurrentSection: () => {
      if (!state.currentStep) return null;
      return TutorialController.shouldSkipSection(state.currentStep);
    }
  };

  const value = {
    ...state,
    ...controls,
    api,
    isLoading,
    TUTORIAL_STEPS,
    TUTORIAL_GROUPS
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

// Tutorial step data with content and targeting information
export const tutorialStepData = {
  [TUTORIAL_STEPS.WELCOME]: {
    title: "Welcome to Antopolis!",
    content: "Ready to build your ant empire? This tutorial will guide you through all the basics of colony management.",
    target: null,
    position: "center",
    canSkip: true,
    estimatedTime: "10 minutes",
    rewards: { evolutionPoints: 10 }
  },
  [TUTORIAL_STEPS.COLONY_CREATION]: {
    title: "Creating Your Colony",
    content: "First, let's create your colony. Choose a name and starting attributes that will define your ants' specialization.",
    target: "#colony-creation-form",
    position: "right",
    canSkip: false,
    rewards: { evolutionPoints: 15 }
  },
  [TUTORIAL_STEPS.UI_OVERVIEW]: {
    title: "Game Interface Overview",
    content: "The game interface has three main panels: colony management (left), simulation view (center), and resources & evolution (right).",
    target: "#game-layout",
    position: "center",
    canSkip: true,
    rewards: { evolutionPoints: 10 }
  },
  [TUTORIAL_STEPS.ANT_ROLES_INTRO]: {
    title: "Ant Roles & Assignments",
    content: "Different ant roles have different abilities. Workers gather food, scouts explore, and soldiers defend your colony.",
    target: "#ant-assignments",
    position: "right",
    canSkip: false,
    rewards: { evolutionPoints: 20 }
  },
  [TUTORIAL_STEPS.FORAGING_BASICS]: {
    title: "Food Foraging",
    content: "Your ants need food to survive and grow. Watch them automatically forage for resources in the simulation view.",
    target: "#simulation-view",
    position: "top",
    canSkip: false,
    rewards: { food: 100, evolutionPoints: 15 }
  },
  [TUTORIAL_STEPS.EVOLUTION_TREE]: {
    title: "Evolution & Upgrades",
    content: "Spend evolution points to unlock new abilities and improve your colony's efficiency.",
    target: "#evolution-tree",
    position: "left",
    canSkip: true,
    rewards: { evolutionPoints: 25 }
  },
  [TUTORIAL_STEPS.BUILDING_INTRO]: {
    title: "Colony Structures",
    content: "Build structures to enhance your colony's capabilities and provide bonuses to your ants.",
    target: "#building-panel",
    position: "left",
    canSkip: true,
    rewards: { materials: 50, evolutionPoints: 20 }
  },
  [TUTORIAL_STEPS.BATTLE_INTRO]: {
    title: "Combat Basics",
    content: "Defend your colony from attacks and launch raids against enemy colonies to expand your territory.",
    target: "#battle-controls",
    position: "top",
    canSkip: true,
    rewards: { evolutionPoints: 30 }
  },
  [TUTORIAL_STEPS.TUTORIAL_COMPLETE]: {
    title: "Tutorial Complete!",
    content: "Congratulations! You're now ready to lead your ant colony to greatness. Remember, you can always access help from the settings menu.",
    target: null,
    position: "center",
    canSkip: false,
    rewards: { evolutionPoints: 100, food: 500, materials: 200 }
  }
};

export default TutorialContext; 
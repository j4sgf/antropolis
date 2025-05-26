import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { TUTORIAL_STEP_DEFINITIONS, getEnhancedStepData } from '../data/tutorialSteps';
import { TUTORIAL_STEPS, TUTORIAL_GROUPS, TUTORIAL_ACTIONS } from '../constants/tutorialConstants';
import TutorialController from '../services/TutorialController';

// Initial tutorial state
const initialState = {
  isActive: false,
  isCompleted: false,
  isSkipped: true, // Temporarily disable tutorials
  currentStep: null,
  currentGroup: null,
  completedSteps: [],
  stepProgress: {},
  settings: {
    showTooltips: true,
    autoProgress: false,
    skipIntroduction: true, // Skip intro by default
    reminderFrequency: 'none', // Disable reminders
    autoTrigger: false, // Temporarily disable auto-triggering
    nonBlocking: true // Position tutorials alongside content, not over it
  },
  user: null,
  rewardsEarned: [],
  // Track which features the user has encountered
  featureDiscovery: {
    hasVisitedCreateColony: false,
    hasCreatedColony: false,
    hasVisitedColonyDashboard: false,
    hasAssignedAntRoles: false,
    hasBuiltStructure: false,
    hasBattled: false,
    hasUpgradedEvolution: false
  }
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
      const updatedCompletedSteps = [...state.completedSteps];
      
      // Add current step to completed if not already there
      if (state.currentStep && !updatedCompletedSteps.includes(state.currentStep)) {
        updatedCompletedSteps.push(state.currentStep);
      }
      
      // If no next step, complete the tutorial
      if (!nextStep) {
        console.log('🎓 Tutorial completed - no next step found');
        return {
          ...state,
          isActive: false,
          isCompleted: true,
          currentStep: null,
          currentGroup: null,
          completedSteps: updatedCompletedSteps
        };
      }
      
      console.log('🎓 Moving to next step:', nextStep, 'isActive remains:', true);
      return {
        ...state,
        currentStep: nextStep,
        currentGroup: determineGroup(nextStep),
        completedSteps: updatedCompletedSteps
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
      console.log('🎓 Resetting tutorial to initial state');
      return {
        ...initialState,
        settings: {
          ...initialState.settings,
          ...state.settings
        },
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
      console.log('🎓 Loading tutorial progress:', action.progress);
      return {
        ...state,
        ...action.progress,
        settings: {
          ...state.settings,
          ...action.progress.settings
        },
        // Ensure featureDiscovery is properly merged
        featureDiscovery: {
          ...state.featureDiscovery,
          ...action.progress.featureDiscovery
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

    case TUTORIAL_ACTIONS.MARK_FEATURE_DISCOVERED:
      return {
        ...state,
        featureDiscovery: {
          ...state.featureDiscovery,
          [action.feature]: true
        }
      };

    case TUTORIAL_ACTIONS.TRIGGER_CONTEXTUAL_TUTORIAL:
      console.log('🎓 TRIGGER_CONTEXTUAL_TUTORIAL reducer:', {
        step: action.step,
        autoTrigger: state.settings.autoTrigger,
        isSkipped: state.isSkipped,
        currentState: { isActive: state.isActive, currentStep: state.currentStep }
      });
      
      // Only auto-trigger if settings allow and user hasn't completed this area
      if (!state.settings.autoTrigger || state.isSkipped) {
        console.log('🎓 Not triggering - autoTrigger disabled or tutorial skipped');
        return state;
      }
      
      console.log('🎓 Activating contextual tutorial for step:', action.step);
      return {
        ...state,
        isActive: true,
        currentStep: action.step,
        currentGroup: determineGroup(action.step)
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

function sanitizeRewards(rewards) {
  if (!rewards || typeof rewards !== 'object') {
    return { evolutionPoints: 5 };
  }
  
  const sanitized = {};
  
  Object.entries(rewards).forEach(([key, value]) => {
    if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (typeof value === 'string' && !isNaN(value)) {
      sanitized[key] = Number(value);
    } else if (typeof value === 'object' && value !== null) {
      // Handle nested objects like starterResources: { food: 100, materials: 50 }
      sanitized[key] = {};
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (typeof subValue === 'number') {
          sanitized[key][subKey] = subValue;
        } else if (typeof subValue === 'string' && !isNaN(subValue)) {
          sanitized[key][subKey] = Number(subValue);
        }
      });
    }
  });
  
  // Ensure at least some reward exists
  if (Object.keys(sanitized).length === 0) {
    sanitized.evolutionPoints = 5;
  }
  
  return sanitized;
}

function getNextStep(currentStep) {
  const allSteps = Object.values(TUTORIAL_STEPS);
  const currentIndex = allSteps.indexOf(currentStep);
  
  if (currentIndex === -1) {
    console.warn('⚠️ Current step not found in tutorial steps:', currentStep);
    return allSteps[0]; // Return first step as fallback
  }
  
  const nextStep = currentIndex < allSteps.length - 1 ? allSteps[currentIndex + 1] : null;
  console.log('🎓 Next step calculated:', { currentStep, nextStep, currentIndex });
  return nextStep;
}

function getPreviousStep(currentStep) {
  const allSteps = Object.values(TUTORIAL_STEPS);
  const currentIndex = allSteps.indexOf(currentStep);
  return currentIndex > 0 ? allSteps[currentIndex - 1] : null;
}

// TODO: Re-implement step navigation requirements in a component that has access to router
// const stepNavigationMap = {
//   [TUTORIAL_STEPS.WELCOME]: { route: '/', waitFor: null },
//   [TUTORIAL_STEPS.COLONY_CREATION]: { route: '/create-colony', waitFor: '.colony-creation-container' },
//   [TUTORIAL_STEPS.COLONY_NAMING]: { route: '/create-colony', waitFor: 'input[name="name"]' },
//   [TUTORIAL_STEPS.COLONY_ATTRIBUTES]: { route: '/create-colony', waitFor: '.attribute-selector' },
//   [TUTORIAL_STEPS.COLONY_CONFIRM]: { route: '/create-colony', waitFor: 'button[type="submit"]' },
//   [TUTORIAL_STEPS.FIRST_VIEW]: { route: '/colony/test-colony-001', waitFor: '.container' },
//   [TUTORIAL_STEPS.UI_OVERVIEW]: { route: '/colony/test-colony-001', waitFor: '.container' },
//   [TUTORIAL_STEPS.LEFT_PANEL_INTRO]: { route: '/colony/test-colony-001', waitFor: '.flex' },
//   [TUTORIAL_STEPS.CENTER_PANEL_INTRO]: { route: '/colony/test-colony-001', waitFor: '.bg-white' },
//   [TUTORIAL_STEPS.RIGHT_PANEL_INTRO]: { route: '/colony/test-colony-001', waitFor: '.text-4xl' },
//   // Most other steps stay on colony dashboard
//   default: { route: '/colony/test-colony-001', waitFor: null }
// };

function generateFallbackStepData(step) {
  // Create meaningful fallback data based on step name
  const stepName = step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  const fallbackData = {
    id: step,
    title: stepName,
    content: `This tutorial step will guide you through ${stepName.toLowerCase()}. Click 'Next' to continue to the next step.`,
    target: null,
    position: "center",
    canSkip: true,
    estimatedTime: "30 seconds",
    rewards: { evolutionPoints: 10 }
  };
  
  // Add specific content based on step type
  if (step.includes('COLONY')) {
    fallbackData.content = `Learn about colony management and setup. ${fallbackData.content}`;
    fallbackData.rewards.evolutionPoints = 15;
    if (step.includes('CREATION')) {
      fallbackData.content = "Let's start by creating your first ant colony! Click 'Next' and we'll navigate to the colony creation page where you can customize your empire.";
      fallbackData.title = "Create Your Colony";
    } else if (step.includes('NAMING')) {
      fallbackData.content = "Choose a unique name for your colony. This will represent your empire throughout the game and help other players identify you.";
      fallbackData.title = "Name Your Colony";
    } else if (step.includes('ATTRIBUTES')) {
      fallbackData.content = "Set your colony's starting attributes. These affect your ants' strengths and determine your strategic approach.";
      fallbackData.title = "Colony Attributes";
    }
  } else if (step.includes('ANT')) {
    fallbackData.content = `Discover ant roles and behaviors. ${fallbackData.content}`;
    fallbackData.rewards.evolutionPoints = 20;
  } else if (step.includes('UI') || step.includes('PANEL') || step.includes('VIEW')) {
    fallbackData.content = `Learn about the game interface and controls. ${fallbackData.content}`;
    fallbackData.rewards.evolutionPoints = 12;
    if (step.includes('OVERVIEW')) {
      fallbackData.content = "Welcome to your colony dashboard! This is your command center where you manage all aspects of your ant empire.";
      fallbackData.title = "Colony Dashboard Overview";
    } else if (step.includes('FIRST_VIEW')) {
      fallbackData.content = "Congratulations! You now have a colony. Let's explore the main interface and learn how to manage your ant empire.";
      fallbackData.title = "Your First Colony";
    }
  } else if (step.includes('BATTLE') || step.includes('COMBAT')) {
    fallbackData.content = `Master combat strategies and defense. ${fallbackData.content}`;
    fallbackData.rewards.evolutionPoints = 25;
  } else if (step.includes('BUILDING') || step.includes('STRUCTURE')) {
    fallbackData.content = `Learn to build and upgrade structures. ${fallbackData.content}`;
    fallbackData.rewards = { evolutionPoints: 20, materials: 50 };
  } else if (step.includes('RESOURCE') || step.includes('FORAGING')) {
    fallbackData.content = `Understand resource management and collection. ${fallbackData.content}`;
    fallbackData.rewards = { evolutionPoints: 15, food: 50 };
  }
  
  fallbackData.rewards = sanitizeRewards(fallbackData.rewards);
  
  // Fallback step data generated successfully
  
  return fallbackData;
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
  // const navigate = useNavigate();
  // const location = useLocation();

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
    startTutorial: async (startStep) => {
      console.log('🎓 Starting tutorial with step:', startStep);
      
      // TODO: Re-implement navigation logic outside of context
      // const step = startStep || TUTORIAL_STEPS.WELCOME;
      // const navigationConfig = stepNavigationMap[step] || stepNavigationMap.default;
      
      dispatch({ type: TUTORIAL_ACTIONS.START_TUTORIAL, startStep });
    },

    nextStep: async () => {
      if (state.currentStep) {
        console.log('🎓 Progressing from step:', state.currentStep, 'isActive:', state.isActive);
        
        // TODO: Re-implement navigation logic outside of context
        // const nextStep = getNextStep(state.currentStep);
        // if (nextStep) {
        //   const navigationConfig = stepNavigationMap[nextStep] || stepNavigationMap.default;
        //   // Navigate if needed
        // }
        
        // The NEXT_STEP action will handle completion detection automatically
        dispatch({ type: TUTORIAL_ACTIONS.NEXT_STEP });
      } else {
        console.warn('⚠️ Attempted to advance tutorial with no current step');
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

    // Contextual tutorial functions
    markFeatureDiscovered: (feature) => {
      dispatch({ type: TUTORIAL_ACTIONS.MARK_FEATURE_DISCOVERED, feature });
    },

    triggerContextualTutorial: (step) => {
      console.log('🎓 TriggerContextualTutorial called:', { 
        step, 
        isCompleted: state.completedSteps.includes(step),
        autoTrigger: state.settings.autoTrigger,
        completedSteps: state.completedSteps 
      });
      
      // Only trigger if this step hasn't been completed
      if (!state.completedSteps.includes(step) && state.settings.autoTrigger) {
        console.log('🎓 Dispatching TRIGGER_CONTEXTUAL_TUTORIAL for step:', step);
        dispatch({ type: TUTORIAL_ACTIONS.TRIGGER_CONTEXTUAL_TUTORIAL, step });
      } else {
        console.log('🎓 Not triggering - step completed or autoTrigger disabled');
      }
    },

    shouldShowContextualHelp: (feature) => {
      // For contextual tutorials, we should show help if:
      // 1. Auto-trigger is enabled
      // 2. Tutorial hasn't been skipped globally  
      // 3. Feature hasn't been discovered yet (OR if it has been discovered but user reset tutorials)
      const shouldShow = state.settings.autoTrigger && 
             !state.isSkipped && 
             (!state.featureDiscovery[feature] || state.completedSteps.length === 0);
      
      console.log('🎓 ShouldShowContextualHelp:', { 
        feature, 
        shouldShow,
        autoTrigger: state.settings.autoTrigger,
        isSkipped: state.isSkipped,
        featureDiscovered: state.featureDiscovery[feature],
        completedStepsCount: state.completedSteps.length,
        allFeatureDiscovery: state.featureDiscovery
      });
      
      return shouldShow;
    },

    getProgressPercentage: () => {
      const totalSteps = Object.values(TUTORIAL_STEPS).length;
      const completedCount = Math.min(state.completedSteps.length, totalSteps);
      return Math.round((completedCount / totalSteps) * 100);
    },

    shouldShowTutorial: () => {
      return !state.isCompleted && !state.isSkipped && !state.settings.skipIntroduction;
    },

    getCurrentGroupSteps: () => {
      return state.currentGroup ? TUTORIAL_GROUPS[state.currentGroup] : [];
    },

    getStepData: (step) => {
      try {
        // Use enhanced step data with completion criteria and flow logic
        const enhancedData = getEnhancedStepData(step);
        // Reduced logging to prevent console spam
        
        if (enhancedData) {
          // Enhanced step data found
          // Ensure rewards is properly formatted
          if (enhancedData.rewards) {
            enhancedData.rewards = sanitizeRewards(enhancedData.rewards);
          }
          return enhancedData;
        }
        
        // Try to use direct TUTORIAL_STEP_DEFINITIONS as a fallback
        if (TUTORIAL_STEP_DEFINITIONS && TUTORIAL_STEP_DEFINITIONS[step]) {
          // Direct step definition found
          const directData = TUTORIAL_STEP_DEFINITIONS[step];
          if (directData.rewards) {
            directData.rewards = sanitizeRewards(directData.rewards);
          }
          return directData;
        }
        
        // Fallback to basic step data
        const basicData = tutorialStepData[step];
        if (basicData) {
          // Basic step data found
          if (basicData.rewards) {
            basicData.rewards = sanitizeRewards(basicData.rewards);
          }
          return basicData;
        }
        
        // Generate fallback data for missing steps
        console.warn('⚠️ No step data found for:', step, 'generating fallback');
        const fallbackData = generateFallbackStepData(step);
        // Fallback data generated
        return fallbackData;
        
      } catch (error) {
        console.warn('Error getting step data:', error);
        return generateFallbackStepData(step);
      }
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

// Re-export tutorial constants for backward compatibility
export { TUTORIAL_STEPS, TUTORIAL_GROUPS, TUTORIAL_ACTIONS }; 
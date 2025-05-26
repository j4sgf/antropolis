const express = require('express');
const router = express.Router();

// Temporary in-memory storage for mock tutorial data (similar to colonies.js pattern)
const mockTutorialProgress = new Map();
const mockTutorialTasks = new Map();
const mockTutorialAnalytics = [];

// Tutorial step definitions (matching frontend)
const TUTORIAL_STEPS = {
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

// Default tutorial rewards for each step
const DEFAULT_STEP_REWARDS = {
  [TUTORIAL_STEPS.WELCOME]: { evolutionPoints: 10 },
  [TUTORIAL_STEPS.COLONY_CREATION]: { evolutionPoints: 15 },
  [TUTORIAL_STEPS.UI_OVERVIEW]: { evolutionPoints: 10 },
  [TUTORIAL_STEPS.ANT_ROLES_INTRO]: { evolutionPoints: 20 },
  [TUTORIAL_STEPS.FORAGING_BASICS]: { food: 100, evolutionPoints: 15 },
  [TUTORIAL_STEPS.EVOLUTION_TREE]: { evolutionPoints: 25 },
  [TUTORIAL_STEPS.BUILDING_INTRO]: { materials: 50, evolutionPoints: 20 },
  [TUTORIAL_STEPS.BATTLE_INTRO]: { evolutionPoints: 30 },
  [TUTORIAL_STEPS.TUTORIAL_COMPLETE]: { evolutionPoints: 100, food: 500, materials: 200 }
};

// Helper function to create default tutorial progress
const createDefaultTutorialProgress = (userId) => {
  const defaultProgress = {
    id: `tutorial-progress-${userId}`,
    user_id: userId,
    is_completed: false,
    is_skipped: false,
    current_step: null,
    current_group: null,
    completed_steps: [],
    step_progress: {},
    settings: {
      showTooltips: true,
      autoProgress: false,
      skipIntroduction: false,
      reminderFrequency: 'normal'
    },
    rewards_earned: [],
    started_at: new Date().toISOString(),
    completed_at: null,
    last_active_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockTutorialProgress.set(userId, defaultProgress);
  return defaultProgress;
};

// Helper function to log analytics
const logAnalytics = (userId, eventType, tutorialStep, eventData = {}) => {
  const analyticsEvent = {
    id: `analytics-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    event_type: eventType,
    tutorial_step: tutorialStep,
    event_data: eventData,
    session_id: `session-${userId}-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  
  mockTutorialAnalytics.push(analyticsEvent);
  console.log('📊 Tutorial analytics logged:', eventType, tutorialStep);
};

// GET /api/tutorial - Get tutorial overview
router.get('/', (req, res) => {
  try {
    const totalUsers = mockTutorialProgress.size;
    const completedUsers = Array.from(mockTutorialProgress.values()).filter(p => p.is_completed).length;
    const activeUsers = Array.from(mockTutorialProgress.values()).filter(p => !p.is_completed && !p.is_skipped).length;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          completedUsers,
          activeUsers,
          completionRate: totalUsers > 0 ? (completedUsers / totalUsers) * 100 : 0,
          averageStepsCompleted: totalUsers > 0 ? 
            Array.from(mockTutorialProgress.values())
              .reduce((sum, p) => sum + p.completed_steps.length, 0) / totalUsers : 0
        },
        availableSteps: Object.values(TUTORIAL_STEPS),
        totalSteps: Object.keys(TUTORIAL_STEPS).length,
        defaultRewards: DEFAULT_STEP_REWARDS,
        recentAnalytics: mockTutorialAnalytics.slice(-10)
      },
      message: 'Tutorial system overview retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting tutorial overview:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get tutorial overview',
      details: error.message 
    });
  }
});

// Get tutorial progress for a user
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('📋 Getting tutorial progress for user:', userId);
    
    let progress = mockTutorialProgress.get(userId);
    
    // Create default progress if it doesn't exist
    if (!progress) {
      progress = createDefaultTutorialProgress(userId);
      console.log('✨ Created default tutorial progress for user:', userId);
    }
    
    console.log('✅ Found tutorial progress:', progress.id);
    
    res.json({
      success: true,
      data: progress
    });
    
  } catch (error) {
    console.error('Error fetching tutorial progress:', error);
    res.status(500).json({ error: 'Failed to fetch tutorial progress' });
  }
});

// Update/Save tutorial progress
router.post('/progress', async (req, res) => {
  try {
    console.log('💾 Tutorial progress update request received');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      userId,
      completedSteps,
      isCompleted,
      isSkipped,
      currentStep,
      currentGroup,
      stepProgress,
      settings,
      rewardsEarned
    } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get existing progress or create new
    let progress = mockTutorialProgress.get(userId) || createDefaultTutorialProgress(userId);
    
    // Update progress data
    const updatedProgress = {
      ...progress,
      completed_steps: completedSteps || progress.completed_steps,
      is_completed: isCompleted !== undefined ? isCompleted : progress.is_completed,
      is_skipped: isSkipped !== undefined ? isSkipped : progress.is_skipped,
      current_step: currentStep !== undefined ? currentStep : progress.current_step,
      current_group: currentGroup !== undefined ? currentGroup : progress.current_group,
      step_progress: stepProgress || progress.step_progress,
      settings: settings ? { ...progress.settings, ...settings } : progress.settings,
      rewards_earned: rewardsEarned || progress.rewards_earned,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Set completion time if tutorial is completed
    if (isCompleted && !progress.is_completed) {
      updatedProgress.completed_at = new Date().toISOString();
      logAnalytics(userId, 'tutorial_completed', currentStep);
    }
    
    // Set skip time if tutorial is skipped
    if (isSkipped && !progress.is_skipped) {
      logAnalytics(userId, 'tutorial_skipped', currentStep);
    }
    
    // Store updated progress
    mockTutorialProgress.set(userId, updatedProgress);
    
    console.log('✅ Tutorial progress updated for user:', userId);
    
    res.json({
      success: true,
      data: updatedProgress,
      message: 'Tutorial progress saved successfully'
    });
    
  } catch (error) {
    console.error('💥 Error saving tutorial progress:', error);
    res.status(500).json({ 
      error: 'Failed to save tutorial progress',
      details: error.message
    });
  }
});

// Start tutorial for a user
router.post('/start', async (req, res) => {
  try {
    const { userId, startStep } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log('🚀 Starting tutorial for user:', userId, 'at step:', startStep);
    
    let progress = mockTutorialProgress.get(userId) || createDefaultTutorialProgress(userId);
    
    // Reset and start tutorial
    const updatedProgress = {
      ...progress,
      is_completed: false,
      is_skipped: false,
      current_step: startStep || TUTORIAL_STEPS.WELCOME,
      current_group: 'SETUP',
      started_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockTutorialProgress.set(userId, updatedProgress);
    
    // Log analytics
    logAnalytics(userId, 'tutorial_started', startStep || TUTORIAL_STEPS.WELCOME);
    
    res.json({
      success: true,
      data: updatedProgress,
      message: 'Tutorial started successfully'
    });
    
  } catch (error) {
    console.error('Error starting tutorial:', error);
    res.status(500).json({ error: 'Failed to start tutorial' });
  }
});

// Complete a tutorial step
router.post('/step-complete', async (req, res) => {
  try {
    const { userId, step, data = {} } = req.body;
    
    if (!userId || !step) {
      return res.status(400).json({ error: 'User ID and step are required' });
    }
    
    console.log('✅ Completing tutorial step:', step, 'for user:', userId);
    
    let progress = mockTutorialProgress.get(userId) || createDefaultTutorialProgress(userId);
    
    // Add step to completed steps if not already completed
    const completedSteps = [...progress.completed_steps];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }
    
    // Update step progress
    const stepProgress = {
      ...progress.step_progress,
      [step]: {
        completedAt: new Date().toISOString(),
        data: data
      }
    };
    
    // Award rewards for completing this step
    const stepReward = DEFAULT_STEP_REWARDS[step];
    const rewardsEarned = [...progress.rewards_earned];
    if (stepReward) {
      rewardsEarned.push({
        step: step,
        rewards: stepReward,
        earnedAt: new Date().toISOString()
      });
    }
    
    const updatedProgress = {
      ...progress,
      completed_steps: completedSteps,
      step_progress: stepProgress,
      rewards_earned: rewardsEarned,
      last_active_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockTutorialProgress.set(userId, updatedProgress);
    
    // Log analytics
    logAnalytics(userId, 'step_completed', step, data);
    
    console.log('🎉 Tutorial step completed:', step);
    
    res.json({
      success: true,
      data: updatedProgress,
      rewards: stepReward,
      message: `Step ${step} completed successfully`
    });
    
  } catch (error) {
    console.error('Error completing tutorial step:', error);
    res.status(500).json({ error: 'Failed to complete tutorial step' });
  }
});

// Get tutorial analytics (for admin/development purposes)
router.get('/analytics', async (req, res) => {
  try {
    const { userId, eventType, limit = 100 } = req.query;
    
    let analytics = [...mockTutorialAnalytics];
    
    // Filter by user if specified
    if (userId) {
      analytics = analytics.filter(event => event.user_id === userId);
    }
    
    // Filter by event type if specified
    if (eventType) {
      analytics = analytics.filter(event => event.event_type === eventType);
    }
    
    // Sort by created_at desc and limit
    analytics = analytics
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: analytics,
      count: analytics.length
    });
    
  } catch (error) {
    console.error('Error fetching tutorial analytics:', error);
    res.status(500).json({ error: 'Failed to fetch tutorial analytics' });
  }
});

// Submit tutorial feedback
router.post('/feedback', async (req, res) => {
  try {
    const {
      userId,
      tutorialStep,
      rating,
      feedbackText,
      isHelpful,
      difficultyRating,
      suggestedImprovements
    } = req.body;
    
    if (!userId || !tutorialStep) {
      return res.status(400).json({ error: 'User ID and tutorial step are required' });
    }
    
    const feedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      tutorial_step: tutorialStep,
      rating: rating,
      feedback_text: feedbackText,
      is_helpful: isHelpful,
      difficulty_rating: difficultyRating,
      suggested_improvements: suggestedImprovements,
      created_at: new Date().toISOString()
    };
    
    // In a real implementation, this would be stored in the database
    console.log('📝 Tutorial feedback received:', feedback);
    
    // Log analytics
    logAnalytics(userId, 'feedback_submitted', tutorialStep, {
      rating: rating,
      isHelpful: isHelpful,
      difficultyRating: difficultyRating
    });
    
    res.json({
      success: true,
      data: feedback,
      message: 'Feedback submitted successfully'
    });
    
  } catch (error) {
    console.error('Error submitting tutorial feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Reset tutorial progress for a user
router.post('/reset', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log('🔄 Resetting tutorial for user:', userId);
    
    // Create fresh tutorial progress
    const resetProgress = createDefaultTutorialProgress(userId);
    
    // Log analytics
    logAnalytics(userId, 'tutorial_reset', null);
    
    res.json({
      success: true,
      data: resetProgress,
      message: 'Tutorial progress reset successfully'
    });
    
  } catch (error) {
    console.error('Error resetting tutorial:', error);
    res.status(500).json({ error: 'Failed to reset tutorial' });
  }
});

// Get tutorial steps configuration (for development/debugging)
router.get('/steps', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        steps: TUTORIAL_STEPS,
        rewards: DEFAULT_STEP_REWARDS,
        totalSteps: Object.keys(TUTORIAL_STEPS).length
      }
    });
  } catch (error) {
    console.error('Error fetching tutorial steps:', error);
    res.status(500).json({ error: 'Failed to fetch tutorial steps' });
  }
});

module.exports = router; 
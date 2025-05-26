const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabaseClient');

// ===== TUTORIAL TASK ENDPOINTS =====

/**
 * Get tutorial tasks for a specific step
 * GET /api/tutorial/tasks/:stepId
 */
router.get('/tasks/:stepId', async (req, res) => {
  try {
    const { stepId } = req.params;
    const { userId } = req.query;

    // Get task completion data if user is logged in
    let completionData = null;
    if (userId) {
      const { data } = await supabase
        .from('tutorial_task_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('step_id', stepId)
        .single();
      
      completionData = data;
    }

    // Return task configuration with completion status
    res.json({
      success: true,
      stepId,
      completionData,
      taskConfig: getTutorialTaskConfig(stepId)
    });

  } catch (error) {
    console.error('Error fetching tutorial tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutorial tasks'
    });
  }
});

/**
 * Start a tutorial task
 * POST /api/tutorial/tasks/start
 */
router.post('/tasks/start', async (req, res) => {
  try {
    const { userId, stepId, taskData } = req.body;

    // Create task attempt record
    const { data, error } = await supabase
      .from('tutorial_task_attempts')
      .insert({
        user_id: userId,
        step_id: stepId,
        started_at: new Date().toISOString(),
        task_data: taskData,
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Tutorial task started',
      attemptId: data.id,
      taskData: data
    });

  } catch (error) {
    console.error('Error starting tutorial task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start tutorial task'
    });
  }
});

/**
 * Complete a tutorial task
 * POST /api/tutorial/tasks/complete
 */
router.post('/tasks/complete', async (req, res) => {
  try {
    const { 
      userId, 
      stepId, 
      attemptId, 
      completionData, 
      timeSpent, 
      efficiency 
    } = req.body;

    // Update attempt record
    const { error: attemptError } = await supabase
      .from('tutorial_task_attempts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completion_data: completionData,
        time_spent: timeSpent,
        efficiency_score: efficiency
      })
      .eq('id', attemptId);

    if (attemptError) throw attemptError;

    // Create or update completion record
    const { data: completion, error: completionError } = await supabase
      .from('tutorial_task_completions')
      .upsert({
        user_id: userId,
        step_id: stepId,
        completed_at: new Date().toISOString(),
        best_time: timeSpent,
        best_efficiency: efficiency,
        total_attempts: 1,
        completion_data: completionData
      }, {
        onConflict: 'user_id,step_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (completionError) throw completionError;

    // Calculate and distribute rewards
    const rewards = calculateTutorialRewards(stepId, efficiency, timeSpent);
    if (rewards) {
      await distributeTutorialRewards(userId, stepId, rewards);
    }

    res.json({
      success: true,
      message: 'Tutorial task completed successfully',
      completion,
      rewards
    });

  } catch (error) {
    console.error('Error completing tutorial task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete tutorial task'
    });
  }
});

/**
 * Get tutorial task statistics
 * GET /api/tutorial/tasks/stats/:userId
 */
router.get('/tasks/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get completion statistics
    const { data: completions } = await supabase
      .from('tutorial_task_completions')
      .select('*')
      .eq('user_id', userId);

    // Get attempt statistics
    const { data: attempts } = await supabase
      .from('tutorial_task_attempts')
      .select('step_id, status, time_spent, efficiency_score')
      .eq('user_id', userId);

    // Calculate statistics
    const stats = calculateTutorialStats(completions || [], attempts || []);

    res.json({
      success: true,
      stats,
      completions: completions || [],
      totalAttempts: attempts?.length || 0
    });

  } catch (error) {
    console.error('Error fetching tutorial stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutorial statistics'
    });
  }
});

// ===== TUTORIAL REWARD ENDPOINTS =====

/**
 * Get pending tutorial rewards
 * GET /api/tutorial/rewards/:userId
 */
router.get('/rewards/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: rewards, error } = await supabase
      .from('tutorial_rewards')
      .select('*')
      .eq('user_id', userId)
      .eq('claimed', false)
      .order('earned_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      pendingRewards: rewards || [],
      totalPending: rewards?.length || 0
    });

  } catch (error) {
    console.error('Error fetching tutorial rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutorial rewards'
    });
  }
});

/**
 * Claim tutorial rewards
 * POST /api/tutorial/rewards/claim
 */
router.post('/rewards/claim', async (req, res) => {
  try {
    const { userId, rewardIds } = req.body;

    // Get reward details before claiming
    const { data: rewards, error: fetchError } = await supabase
      .from('tutorial_rewards')
      .select('*')
      .in('id', rewardIds)
      .eq('user_id', userId)
      .eq('claimed', false);

    if (fetchError) throw fetchError;

    if (!rewards || rewards.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No unclaimed rewards found'
      });
    }

    // Mark rewards as claimed
    const { error: claimError } = await supabase
      .from('tutorial_rewards')
      .update({
        claimed: true,
        claimed_at: new Date().toISOString()
      })
      .in('id', rewardIds);

    if (claimError) throw claimError;

    // Apply rewards to user's resources
    await applyRewardsToUser(userId, rewards);

    res.json({
      success: true,
      message: 'Rewards claimed successfully',
      claimedRewards: rewards,
      totalValue: calculateRewardValue(rewards)
    });

  } catch (error) {
    console.error('Error claiming tutorial rewards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim tutorial rewards'
    });
  }
});

// ===== TUTORIAL ANALYTICS ENDPOINTS =====

/**
 * Record tutorial analytics event
 * POST /api/tutorial/analytics
 */
router.post('/analytics', async (req, res) => {
  try {
    const { 
      userId, 
      eventType, 
      stepId, 
      eventData, 
      timestamp 
    } = req.body;

    const { data, error } = await supabase
      .from('tutorial_analytics')
      .insert({
        user_id: userId,
        event_type: eventType,
        step_id: stepId,
        event_data: eventData,
        timestamp: timestamp || new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Analytics event recorded',
      eventId: data.id
    });

  } catch (error) {
    console.error('Error recording tutorial analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record analytics event'
    });
  }
});

/**
 * Get tutorial completion funnel
 * GET /api/tutorial/analytics/funnel
 */
router.get('/analytics/funnel', async (req, res) => {
  try {
    // Get step completion counts
    const { data: completions } = await supabase
      .from('tutorial_task_completions')
      .select('step_id, user_id')
      .order('step_id');

    // Calculate funnel data
    const funnelData = calculateTutorialFunnel(completions || []);

    res.json({
      success: true,
      funnelData,
      totalUsers: new Set(completions?.map(c => c.user_id)).size || 0
    });

  } catch (error) {
    console.error('Error fetching tutorial funnel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutorial funnel data'
    });
  }
});

// ===== HELPER FUNCTIONS =====

/**
 * Get tutorial task configuration for a step
 */
function getTutorialTaskConfig(stepId) {
  const taskConfigs = {
    'welcome': {
      type: 'introduction',
      objectives: ['Read welcome message'],
      timeLimit: null,
      difficulty: 'easy'
    },
    'colony_creation': {
      type: 'form_completion',
      objectives: [
        'Click on colony creation form',
        'Enter colony name',
        'Select attributes',
        'Confirm creation'
      ],
      timeLimit: 300, // 5 minutes
      difficulty: 'easy'
    },
    'assign_worker': {
      type: 'role_assignment',
      objectives: [
        'Select an ant',
        'Assign worker role',
        'Confirm assignment'
      ],
      timeLimit: 180, // 3 minutes
      difficulty: 'medium'
    },
    'foraging_basics': {
      type: 'simulation_observation',
      objectives: [
        'Wait for ants to start foraging',
        'Observe resource collection',
        'Check resource increase'
      ],
      timeLimit: 240, // 4 minutes
      difficulty: 'easy'
    },
    'place_structure': {
      type: 'building_placement',
      objectives: [
        'Open building menu',
        'Select structure type',
        'Choose placement location',
        'Confirm construction'
      ],
      timeLimit: 300, // 5 minutes
      difficulty: 'medium'
    }
  };

  return taskConfigs[stepId] || { type: 'generic', objectives: [], difficulty: 'medium' };
}

/**
 * Calculate tutorial rewards based on performance
 */
function calculateTutorialRewards(stepId, efficiency, timeSpent) {
  const baseRewards = {
    'welcome': { evolutionPoints: 10 },
    'colony_creation': { evolutionPoints: 15, food: 100 },
    'assign_worker': { evolutionPoints: 20, food: 50 },
    'foraging_basics': { evolutionPoints: 25, food: 150, materials: 75 },
    'place_structure': { evolutionPoints: 30, materials: 100, water: 50 }
  };

  const base = baseRewards[stepId] || { evolutionPoints: 15 };
  
  // Apply efficiency multiplier
  const multiplier = Math.max(0.5, Math.min(2.0, efficiency / 80)); // 50% to 200%
  
  const rewards = {};
  Object.keys(base).forEach(resource => {
    rewards[resource] = Math.floor(base[resource] * multiplier);
  });

  // Bonus for fast completion
  if (timeSpent < 60) { // Under 1 minute
    rewards.speedBonus = true;
    rewards.evolutionPoints = (rewards.evolutionPoints || 0) + 5;
  }

  return rewards;
}

/**
 * Distribute tutorial rewards to user
 */
async function distributeTutorialRewards(userId, stepId, rewards) {
  try {
    // Create reward record
    const { error } = await supabase
      .from('tutorial_rewards')
      .insert({
        user_id: userId,
        step_id: stepId,
        reward_type: 'step_completion',
        reward_data: rewards,
        earned_at: new Date().toISOString(),
        claimed: false
      });

    if (error) throw error;

    // Apply instant rewards to user resources if needed
    // (This would integrate with your existing resource system)
    
  } catch (error) {
    console.error('Error distributing tutorial rewards:', error);
    throw error;
  }
}

/**
 * Apply claimed rewards to user's resources
 */
async function applyRewardsToUser(userId, rewards) {
  // This would integrate with your existing resource management system
  // For now, we'll just log the action
  console.log(`Applying rewards to user ${userId}:`, rewards);
  
  // Example integration:
  // await updateUserResources(userId, rewards);
}

/**
 * Calculate reward value for display
 */
function calculateRewardValue(rewards) {
  return rewards.reduce((total, reward) => {
    const data = reward.reward_data;
    const value = (data.evolutionPoints || 0) + 
                  (data.food || 0) * 0.1 + 
                  (data.materials || 0) * 0.2 + 
                  (data.water || 0) * 0.15;
    return total + value;
  }, 0);
}

/**
 * Calculate tutorial statistics
 */
function calculateTutorialStats(completions, attempts) {
  const totalSteps = 27; // Total tutorial steps
  const completedSteps = completions.length;
  const completionRate = (completedSteps / totalSteps) * 100;
  
  const avgTime = attempts.length > 0 
    ? attempts.reduce((sum, a) => sum + (a.time_spent || 0), 0) / attempts.length 
    : 0;
    
  const avgEfficiency = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + (a.efficiency_score || 0), 0) / attempts.length
    : 0;

  return {
    totalSteps,
    completedSteps,
    completionRate: Math.round(completionRate),
    averageTime: Math.round(avgTime),
    averageEfficiency: Math.round(avgEfficiency),
    totalAttempts: attempts.length,
    successRate: attempts.length > 0 
      ? Math.round((attempts.filter(a => a.status === 'completed').length / attempts.length) * 100)
      : 0
  };
}

/**
 * Calculate tutorial completion funnel
 */
function calculateTutorialFunnel(completions) {
  const stepCounts = {};
  
  completions.forEach(completion => {
    stepCounts[completion.step_id] = (stepCounts[completion.step_id] || 0) + 1;
  });

  const steps = [
    'welcome', 'colony_creation', 'colony_naming', 'colony_attributes', 
    'assign_worker', 'assign_scout', 'foraging_basics', 'place_structure',
    'evolution_tree', 'battle_intro', 'tutorial_complete'
  ];

  return steps.map(step => ({
    step,
    completions: stepCounts[step] || 0,
    dropoffRate: step === 'welcome' ? 0 : calculateDropoff(stepCounts, step, steps)
  }));
}

/**
 * Calculate dropoff rate between steps
 */
function calculateDropoff(stepCounts, currentStep, allSteps) {
  const currentIndex = allSteps.indexOf(currentStep);
  if (currentIndex <= 0) return 0;
  
  const previousStep = allSteps[currentIndex - 1];
  const previousCount = stepCounts[previousStep] || 0;
  const currentCount = stepCounts[currentStep] || 0;
  
  return previousCount > 0 ? Math.round(((previousCount - currentCount) / previousCount) * 100) : 0;
}

module.exports = router; 
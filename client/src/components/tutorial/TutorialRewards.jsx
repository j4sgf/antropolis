import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '../../store/TutorialContext';

/**
 * TutorialRewards - Manages and displays tutorial step rewards
 * Part of subtask 22.3: Tutorial Content and Flow Logic
 */
const TutorialRewards = () => {
  const [pendingRewards, setPendingRewards] = useState([]);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState(null);
  const { rewardsEarned, completeStep } = useTutorial();

  useEffect(() => {
    // Listen for tutorial step completion to show rewards
    const handleStepCompleted = (event) => {
      const { step } = event.detail;
      
      // Fetch step data to get reward information
      const stepData = getStepRewardData(step);
      if (stepData && stepData.rewards) {
        const reward = {
          id: `${step}-${Date.now()}`,
          step,
          stepName: stepData.title || step,
          rewards: stepData.rewards,
          timestamp: Date.now()
        };

        setPendingRewards(prev => [...prev, reward]);
        
        // Show reward modal after a short delay
        setTimeout(() => {
          setCurrentReward(reward);
          setShowRewardModal(true);
        }, 500);
      }
    };

    window.addEventListener('tutorial:step-completed', handleStepCompleted);
    
    return () => {
      window.removeEventListener('tutorial:step-completed', handleStepCompleted);
    };
  }, []);

  const getStepRewardData = (step) => {
    // Import step definitions - fixed circular import by using constants
    try {
      const { TUTORIAL_STEP_DEFINITIONS } = require('../../data/tutorialSteps');
      return TUTORIAL_STEP_DEFINITIONS[step];
    } catch (error) {
      console.warn('Could not load step definitions:', error);
      // Return minimal reward data as fallback
      return {
        title: 'Tutorial Step',
        rewards: { evolutionPoints: 10 }
      };
    }
  };

  const handleClaimReward = async () => {
    if (!currentReward) return;

    try {
      // Apply rewards to game state (this would integrate with your game's resource system)
      await applyRewards(currentReward.rewards);
      
      // Mark reward as claimed
      setPendingRewards(prev => prev.filter(r => r.id !== currentReward.id));
      
      // Close modal
      setShowRewardModal(false);
      setCurrentReward(null);
      
      // Show success feedback
      showRewardSuccess(currentReward);
      
    } catch (error) {
      console.error('Failed to apply rewards:', error);
      // Show error feedback
    }
  };

  const applyRewards = async (rewards) => {
    // This would integrate with your game's actual resource system
    const promises = [];
    
    if (rewards.evolutionPoints) {
      promises.push(addEvolutionPoints(rewards.evolutionPoints));
    }
    
    if (rewards.food) {
      promises.push(addResource('food', rewards.food));
    }
    
    if (rewards.materials) {
      promises.push(addResource('materials', rewards.materials));
    }
    
    if (rewards.water) {
      promises.push(addResource('water', rewards.water));
    }

    // Apply special bonuses
    if (rewards.welcomeBonus) {
      promises.push(applyWelcomeBonus());
    }
    
    if (rewards.starterResources) {
      Object.entries(rewards.starterResources).forEach(([resource, amount]) => {
        promises.push(addResource(resource, amount));
      });
    }

    await Promise.all(promises);
  };

  const addEvolutionPoints = async (points) => {
    // Integrate with your evolution points system
    const currentPoints = parseInt(localStorage.getItem('evolutionPoints') || '0');
    localStorage.setItem('evolutionPoints', (currentPoints + points).toString());
    
    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('evolution:points-changed', {
      detail: { points: currentPoints + points, added: points }
    }));
  };

  const addResource = async (resourceType, amount) => {
    // Integrate with your resource system
    const currentResources = JSON.parse(localStorage.getItem('colonyResources') || '{}');
    currentResources[resourceType] = (currentResources[resourceType] || 0) + amount;
    localStorage.setItem('colonyResources', JSON.stringify(currentResources));
    
    // Emit event for UI updates
    window.dispatchEvent(new CustomEvent('resources:changed', {
      detail: { resourceType, amount: currentResources[resourceType], added: amount }
    }));
  };

  const applyWelcomeBonus = async () => {
    // Apply welcome bonus effects
    localStorage.setItem('tutorial-welcome-bonus', 'true');
  };

  const showRewardSuccess = (reward) => {
    // Show floating success message
    const successEvent = new CustomEvent('ui:show-success', {
      detail: {
        message: `Rewards claimed from ${reward.stepName}!`,
        duration: 3000
      }
    });
    window.dispatchEvent(successEvent);
  };

  const formatRewardText = (rewards) => {
    const rewardTexts = [];
    
    // Helper function to safely get numeric value
    const getNumericValue = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && !isNaN(value)) return Number(value);
      return 0;
    };
    
    if (rewards.evolutionPoints) {
      const points = getNumericValue(rewards.evolutionPoints);
      if (points > 0) rewardTexts.push(`+${points} Evolution Points`);
    }
    
    if (rewards.food) {
      const food = getNumericValue(rewards.food);
      if (food > 0) rewardTexts.push(`+${food} Food`);
    }
    
    if (rewards.materials) {
      const materials = getNumericValue(rewards.materials);
      if (materials > 0) rewardTexts.push(`+${materials} Materials`);
    }
    
    if (rewards.water) {
      const water = getNumericValue(rewards.water);
      if (water > 0) rewardTexts.push(`+${water} Water`);
    }

    // Handle starter resources object safely
    if (rewards.starterResources && typeof rewards.starterResources === 'object') {
      Object.entries(rewards.starterResources).forEach(([resource, amount]) => {
        const numAmount = getNumericValue(amount);
        if (numAmount > 0) {
          rewardTexts.push(`+${numAmount} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`);
        }
      });
    }

    // Handle special bonuses safely
    if (rewards.welcomeBonus === true) {
      rewardTexts.push('Welcome Bonus Unlocked');
    }
    
    if (rewards.roleBonus === true) {
      rewardTexts.push('Role Management Bonus');
    }
    
    if (rewards.visionRange === true) {
      rewardTexts.push('Enhanced Vision Range');
    }

    // Handle any other boolean bonuses
    Object.entries(rewards).forEach(([key, value]) => {
      if (typeof value === 'boolean' && value === true && 
          !['welcomeBonus', 'roleBonus', 'visionRange'].includes(key)) {
        // Convert camelCase to readable text
        const readableKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        rewardTexts.push(`${readableKey.charAt(0).toUpperCase() + readableKey.slice(1)} Unlocked`);
      }
    });

    return rewardTexts;
  };

  const getRewardIcon = (rewardType) => {
    const icons = {
      evolutionPoints: '🧬',
      food: '🍄',
      materials: '🪨',
      water: '💧',
      minerals: '💎',
      energy: '⚡',
      welcomeBonus: '🎉',
      roleBonus: '🎯',
      visionRange: '👁️',
      default: '🎁'
    };
    
    return icons[rewardType] || icons.default;
  };

  return (
    <>
      {/* Reward Notification Modal */}
      <AnimatePresence>
        {showRewardModal && currentReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowRewardModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Step Completed!
                    </h3>
                    <p className="text-yellow-100 text-sm">
                      {currentReward.stepName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rewards List */}
              <div className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🎁</span>
                  Your Rewards
                </h4>
                
                <div className="space-y-3">
                  {formatRewardText(currentReward.rewards).map((reward, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <span className="text-xl">
                        {getRewardIcon(reward.split(' ')[0].toLowerCase())}
                      </span>
                      <span className="text-green-800 font-medium">
                        {reward}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Bonus message */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    💡 <strong>Tip:</strong> Rewards are automatically added to your colony resources and can be used immediately!
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleClaimReward}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Claim Rewards</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Summary Widget */}
      <RewardSummaryWidget 
        pendingRewards={pendingRewards}
        onShowRewards={() => setShowRewardModal(true)}
      />
    </>
  );
};

/**
 * RewardSummaryWidget - Shows pending rewards count
 */
const RewardSummaryWidget = ({ pendingRewards, onShowRewards }) => {
  if (pendingRewards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-40"
    >
      <button
        onClick={onShowRewards}
        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transition-colors"
      >
        <span className="text-sm font-medium">
          {pendingRewards.length} Reward{pendingRewards.length !== 1 ? 's' : ''} Available
        </span>
        <span className="text-lg">🎁</span>
      </button>
    </motion.div>
  );
};

export default TutorialRewards; 
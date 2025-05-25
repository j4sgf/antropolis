const { supabase } = require('../config/database');

class Evolution {
  /**
   * Award evolution points to a colony from various sources
   * @param {string} colonyId - UUID of the colony
   * @param {number} points - Number of points to award
   * @param {string} sourceType - Type of source (resource_collection, combat_victory, milestone)
   * @param {object} sourceDetails - Additional details about the source
   * @param {string} description - Human-readable description
   * @returns {Promise<object>} Result object with success/error status
   */
  static async awardPoints(colonyId, points, sourceType, sourceDetails = {}, description = '') {
    try {
      // Input validation
      if (!colonyId || points <= 0 || !sourceType) {
        return {
          error: 'Invalid parameters: colony ID, positive points, and source type required'
        };
      }

      // Start a transaction to ensure consistency
      // First, check if colony exists and get current points
      const { data: colony, error: colonyError } = await supabase
        .from('colonies')
        .select('id, evolution_points, total_evolution_points_earned')
        .eq('id', colonyId)
        .single();

      if (colonyError || !colony) {
        return { error: 'Colony not found' };
      }

      // Update colony evolution points
      const newPoints = (colony.evolution_points || 0) + points;
      const newTotalEarned = (colony.total_evolution_points_earned || 0) + points;

      const { error: updateError } = await supabase
        .from('colonies')
        .update({
          evolution_points: newPoints,
          total_evolution_points_earned: newTotalEarned,
          updated_at: new Date().toISOString()
        })
        .eq('id', colonyId);

      if (updateError) {
        return { error: 'Failed to update colony points: ' + updateError.message };
      }

      // Record the transaction
      const { error: transactionError } = await supabase
        .from('evolution_point_transactions')
        .insert({
          colony_id: colonyId,
          points_earned: points,
          source_type: sourceType,
          source_details: sourceDetails,
          description: description || `Earned ${points} evolution points from ${sourceType}`
        });

      if (transactionError) {
        console.error('Failed to record evolution point transaction:', transactionError);
        // Don't fail the whole operation if just logging fails
      }

      return {
        success: true,
        data: {
          pointsAwarded: points,
          totalPoints: newPoints,
          totalEarned: newTotalEarned,
          source: sourceType
        }
      };

    } catch (error) {
      console.error('Error awarding evolution points:', error);
      return { error: 'Failed to award evolution points: ' + error.message };
    }
  }

  /**
   * Spend evolution points on a technology/upgrade
   * @param {string} colonyId - UUID of the colony
   * @param {string} technologyId - UUID of the technology to purchase
   * @returns {Promise<object>} Result object with success/error status
   */
  static async spendPoints(colonyId, technologyId) {
    try {
      // Get colony current points
      const { data: colony, error: colonyError } = await supabase
        .from('colonies')
        .select('id, evolution_points')
        .eq('id', colonyId)
        .single();

      if (colonyError || !colony) {
        return { error: 'Colony not found' };
      }

      // Get technology details
      const { data: technology, error: techError } = await supabase
        .from('technologies')
        .select('*')
        .eq('id', technologyId)
        .single();

      if (techError || !technology) {
        return { error: 'Technology not found' };
      }

      // Check if colony has enough points
      const currentPoints = colony.evolution_points || 0;
      const requiredPoints = technology.required_research_points || 0;

      if (currentPoints < requiredPoints) {
        return {
          error: `Insufficient evolution points. Required: ${requiredPoints}, Available: ${currentPoints}`
        };
      }

      // Check prerequisites
      const prerequisiteCheck = await this.checkPrerequisites(colonyId, technology.prerequisite_techs || []);
      if (!prerequisiteCheck.success) {
        return { error: prerequisiteCheck.error };
      }

      // Check if already researched
      const { data: existing } = await supabase
        .from('colony_technologies')
        .select('is_researched')
        .eq('colony_id', colonyId)
        .eq('technology_id', technologyId)
        .single();

      if (existing && existing.is_researched) {
        return { error: 'Technology already researched' };
      }

      // Spend the points
      const newPoints = currentPoints - requiredPoints;

      const { error: updateError } = await supabase
        .from('colonies')
        .update({
          evolution_points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', colonyId);

      if (updateError) {
        return { error: 'Failed to update colony points: ' + updateError.message };
      }

      // Update or insert colony technology record
      const { error: techUpdateError } = await supabase
        .from('colony_technologies')
        .upsert({
          colony_id: colonyId,
          technology_id: technologyId,
          research_progress: requiredPoints,
          is_researched: true,
          researched_at: new Date().toISOString(),
          evolution_points_spent: requiredPoints
        });

      if (techUpdateError) {
        return { error: 'Failed to record technology purchase: ' + techUpdateError.message };
      }

      return {
        success: true,
        data: {
          pointsSpent: requiredPoints,
          remainingPoints: newPoints,
          technologyUnlocked: technology.name
        }
      };

    } catch (error) {
      console.error('Error spending evolution points:', error);
      return { error: 'Failed to spend evolution points: ' + error.message };
    }
  }

  /**
   * Get current evolution points balance for a colony
   * @param {string} colonyId - UUID of the colony
   * @returns {Promise<object>} Result object with points data
   */
  static async getPoints(colonyId) {
    try {
      const { data: colony, error } = await supabase
        .from('colonies')
        .select('evolution_points, total_evolution_points_earned')
        .eq('id', colonyId)
        .single();

      if (error || !colony) {
        return { error: 'Colony not found' };
      }

      return {
        success: true,
        data: {
          currentPoints: colony.evolution_points || 0,
          totalEarned: colony.total_evolution_points_earned || 0,
          totalSpent: (colony.total_evolution_points_earned || 0) - (colony.evolution_points || 0)
        }
      };

    } catch (error) {
      console.error('Error getting evolution points:', error);
      return { error: 'Failed to get evolution points: ' + error.message };
    }
  }

  /**
   * Get evolution point transaction history for a colony
   * @param {string} colonyId - UUID of the colony
   * @param {number} limit - Limit number of results (default 50)
   * @returns {Promise<object>} Result object with transaction history
   */
  static async getTransactionHistory(colonyId, limit = 50) {
    try {
      const { data: transactions, error } = await supabase
        .from('evolution_point_transactions')
        .select('*')
        .eq('colony_id', colonyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { error: 'Failed to get transaction history: ' + error.message };
      }

      return {
        success: true,
        data: transactions || []
      };

    } catch (error) {
      console.error('Error getting transaction history:', error);
      return { error: 'Failed to get transaction history: ' + error.message };
    }
  }

  /**
   * Check if prerequisites are met for a technology
   * @param {string} colonyId - UUID of the colony
   * @param {array} prerequisiteTechs - Array of prerequisite technology IDs
   * @returns {Promise<object>} Result object indicating if prerequisites are met
   */
  static async checkPrerequisites(colonyId, prerequisiteTechs = []) {
    try {
      if (!prerequisiteTechs || prerequisiteTechs.length === 0) {
        return { success: true };
      }

      // Get researched technologies for the colony
      const { data: researchedTechs, error } = await supabase
        .from('colony_technologies')
        .select('technology_id')
        .eq('colony_id', colonyId)
        .eq('is_researched', true);

      if (error) {
        return { error: 'Failed to check prerequisites: ' + error.message };
      }

      const researchedIds = (researchedTechs || []).map(tech => tech.technology_id);

      // Check if all prerequisites are met
      const missingPrereqs = prerequisiteTechs.filter(prereq => !researchedIds.includes(prereq));

      if (missingPrereqs.length > 0) {
        return {
          success: false,
          error: `Missing prerequisite technologies: ${missingPrereqs.join(', ')}`
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error checking prerequisites:', error);
      return { error: 'Failed to check prerequisites: ' + error.message };
    }
  }

  /**
   * Calculate points earned from resource collection
   * @param {string} resourceType - Type of resource collected
   * @param {number} amount - Amount collected
   * @returns {number} Points to award
   */
  static calculateResourcePoints(resourceType, amount) {
    const pointRates = {
      food: 0.1,      // 1 point per 10 food
      wood: 0.2,      // 1 point per 5 wood
      stone: 0.3,     // 1 point per 3 stone
      water: 0.15,    // 1 point per 7 water
      minerals: 0.5   // 1 point per 2 minerals
    };

    const rate = pointRates[resourceType] || 0.1;
    return Math.floor(amount * rate);
  }

  /**
   * Calculate points earned from combat victory
   * @param {object} battleResult - Battle result object
   * @returns {number} Points to award
   */
  static calculateCombatPoints(battleResult) {
    const basePoints = 50; // Base points for any victory
    const enemyStrengthBonus = Math.floor((battleResult.enemyForces || 0) * 2);
    const efficiencyBonus = Math.floor((1 - (battleResult.casualties || 0) / (battleResult.forces || 1)) * 25);
    
    return Math.max(basePoints + enemyStrengthBonus + efficiencyBonus, basePoints);
  }

  /**
   * Award milestone points for colony achievements
   * @param {string} colonyId - UUID of the colony
   * @param {string} milestoneType - Type of milestone achieved
   * @param {object} milestoneData - Additional milestone data
   * @returns {Promise<object>} Result object
   */
  static async awardMilestonePoints(colonyId, milestoneType, milestoneData = {}) {
    const milestonePoints = {
      'first_100_population': 100,
      'first_building': 25,
      'first_battle_victory': 75,
      'first_territory_expansion': 50,
      'queen_maturity': 150,
      'colony_age_1_year': 200,
      'resource_milestone_1000': 30,
      'resource_milestone_5000': 75,
      'resource_milestone_10000': 150
    };

    const points = milestonePoints[milestoneType] || 0;
    if (points === 0) {
      return { error: 'Unknown milestone type' };
    }

    return await this.awardPoints(
      colonyId,
      points,
      'milestone',
      { milestoneType, ...milestoneData },
      `Milestone achieved: ${milestoneType}`
    );
  }
}

module.exports = Evolution; 
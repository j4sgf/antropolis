const express = require('express');
const router = express.Router();
const Evolution = require('../models/Evolution');

// Get current evolution points for a colony
router.get('/points/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    console.log('🧬 Getting evolution points for colony:', colonyId);
    
    const result = await Evolution.getPoints(colonyId);
    
    if (result.error) {
      console.log('❌ Error getting evolution points:', result.error);
      return res.status(404).json({ error: result.error });
    }
    
    console.log('✅ Evolution points retrieved:', result.data);
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error in GET /evolution/points:', error);
    res.status(500).json({ 
      error: 'Failed to get evolution points',
      details: error.message 
    });
  }
});

// Award evolution points from resource collection
router.post('/points/resource/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { resourceType, amount } = req.body;
    
    console.log('🧬 Awarding resource points for colony:', colonyId, { resourceType, amount });
    
    if (!resourceType || !amount || amount <= 0) {
      return res.status(400).json({
        error: 'Resource type and positive amount required'
      });
    }
    
    const points = Evolution.calculateResourcePoints(resourceType, amount);
    
    if (points === 0) {
      return res.json({
        success: true,
        data: { pointsAwarded: 0, message: 'No points awarded for this amount' }
      });
    }
    
    const result = await Evolution.awardPoints(
      colonyId,
      points,
      'resource_collection',
      { resourceType, amount },
      `Collected ${amount} ${resourceType}`
    );
    
    if (result.error) {
      console.log('❌ Error awarding resource points:', result.error);
      return res.status(400).json({ error: result.error });
    }
    
    console.log('✅ Resource points awarded:', result.data);
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error in POST /evolution/points/resource:', error);
    res.status(500).json({ 
      error: 'Failed to award resource points',
      details: error.message 
    });
  }
});

// Award evolution points from combat victory
router.post('/points/combat/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { battleResult } = req.body;
    
    console.log('🧬 Awarding combat points for colony:', colonyId, battleResult);
    
    if (!battleResult) {
      return res.status(400).json({
        error: 'Battle result data required'
      });
    }
    
    const points = Evolution.calculateCombatPoints(battleResult);
    
    const result = await Evolution.awardPoints(
      colonyId,
      points,
      'combat_victory',
      battleResult,
      `Won battle against ${battleResult.enemyType || 'enemy'}`
    );
    
    if (result.error) {
      console.log('❌ Error awarding combat points:', result.error);
      return res.status(400).json({ error: result.error });
    }
    
    console.log('✅ Combat points awarded:', result.data);
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error in POST /evolution/points/combat:', error);
    res.status(500).json({ 
      error: 'Failed to award combat points',
      details: error.message 
    });
  }
});

// Award evolution points from milestone
router.post('/points/milestone/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { milestoneType, milestoneData } = req.body;
    
    console.log('🧬 Awarding milestone points for colony:', colonyId, { milestoneType, milestoneData });
    
    if (!milestoneType) {
      return res.status(400).json({
        error: 'Milestone type required'
      });
    }
    
    const result = await Evolution.awardMilestonePoints(colonyId, milestoneType, milestoneData);
    
    if (result.error) {
      console.log('❌ Error awarding milestone points:', result.error);
      return res.status(400).json({ error: result.error });
    }
    
    console.log('✅ Milestone points awarded:', result.data);
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error in POST /evolution/points/milestone:', error);
    res.status(500).json({ 
      error: 'Failed to award milestone points',
      details: error.message 
    });
  }
});

// Manual point award (for testing/admin purposes)
router.post('/points/manual/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { points, description } = req.body;
    
    console.log('🧬 Manual point award for colony:', colonyId, { points, description });
    
    if (!points || points <= 0) {
      return res.status(400).json({
        error: 'Positive point amount required'
      });
    }
    
    const result = await Evolution.awardPoints(
      colonyId,
      points,
      'manual',
      {},
      description || 'Manual point award'
    );
    
    if (result.error) {
      console.log('❌ Error awarding manual points:', result.error);
      return res.status(400).json({ error: result.error });
    }
    
    console.log('✅ Manual points awarded:', result.data);
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error in POST /evolution/points/manual:', error);
    res.status(500).json({ 
      error: 'Failed to award manual points',
      details: error.message 
    });
  }
});

// Get evolution point transaction history
router.get('/history/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { limit } = req.query;
    
    console.log('🧬 Getting transaction history for colony:', colonyId);
    
    const result = await Evolution.getTransactionHistory(colonyId, parseInt(limit) || 50);
    
    if (result.error) {
      console.log('❌ Error getting transaction history:', result.error);
      return res.status(400).json({ error: result.error });
    }
    
    console.log('✅ Transaction history retrieved:', result.data.length, 'transactions');
    res.json({
      success: true,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error in GET /evolution/history:', error);
    res.status(500).json({ 
      error: 'Failed to get transaction history',
      details: error.message 
    });
  }
});

module.exports = router;

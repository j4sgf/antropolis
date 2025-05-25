const express = require('express');
const router = express.Router();
const { technologies, TechTreeUtils } = require('../data/technologies');
const Evolution = require('../models/Evolution');

// Get full tech tree structure
router.get('/techtree', async (req, res) => {
  try {
    console.log('🌳 Getting full tech tree structure');
    
    const structuredTree = TechTreeUtils.getStructuredTechTree();
    const categories = TechTreeUtils.getCategories();
    
    // Validate tech tree integrity
    const validation = TechTreeUtils.validateTechTree();
    
    res.json({
      success: true,
      data: {
        technologies,
        structuredTree,
        categories,
        validation,
        totalTechnologies: technologies.length
      }
    });
    
  } catch (error) {
    console.error('Error in GET /techtree:', error);
    res.status(500).json({ 
      error: 'Failed to get tech tree',
      details: error.message 
    });
  }
});

// Get available technologies for a specific colony
router.get('/techtree/available/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    console.log('🌳 Getting available technologies for colony:', colonyId);
    
    // For now, we'll use mock data for unlocked technologies
    // In a real implementation, this would come from the database
    const mockUnlockedTechs = req.query.unlocked ? req.query.unlocked.split(',') : [];
    
    const availableTechs = TechTreeUtils.getAvailableTechs(mockUnlockedTechs);
    
    // Get evolution points to show affordability
    const pointsResult = await Evolution.getPoints(colonyId);
    const currentPoints = pointsResult.success ? pointsResult.data.currentPoints : 0;
    
    // Add affordability info to each tech
    const availableWithAffordability = availableTechs.map(tech => ({
      ...tech,
      canAfford: currentPoints >= tech.required_research_points,
      totalCost: TechTreeUtils.calculateTotalCost(tech.id, mockUnlockedTechs)
    }));
    
    console.log('✅ Available technologies:', availableWithAffordability.length);
    
    res.json({
      success: true,
      data: {
        availableTechnologies: availableWithAffordability,
        currentEvolutionPoints: currentPoints,
        unlockedTechnologies: mockUnlockedTechs
      }
    });
    
  } catch (error) {
    console.error('Error in GET /techtree/available:', error);
    res.status(500).json({ 
      error: 'Failed to get available technologies',
      details: error.message 
    });
  }
});

// Get specific technology details
router.get('/techtree/tech/:techId', async (req, res) => {
  try {
    const { techId } = req.params;
    
    console.log('🌳 Getting technology details for:', techId);
    
    const technology = TechTreeUtils.getTechById(techId);
    
    if (!technology) {
      return res.status(404).json({
        error: 'Technology not found'
      });
    }
    
    // Get prerequisite details
    const prerequisiteDetails = technology.prerequisite_techs.map(prereqId => 
      TechTreeUtils.getTechById(prereqId)
    ).filter(Boolean);
    
    res.json({
      success: true,
      data: {
        technology,
        prerequisiteDetails,
        category: technology.category
      }
    });
    
  } catch (error) {
    console.error('Error in GET /techtree/tech:', error);
    res.status(500).json({ 
      error: 'Failed to get technology details',
      details: error.message 
    });
  }
});

// Purchase/unlock a technology
router.post('/techtree/unlock/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { technologyId } = req.body;
    
    console.log('🌳 Unlocking technology for colony:', colonyId, 'Tech:', technologyId);
    
    if (!technologyId) {
      return res.status(400).json({
        error: 'Technology ID required'
      });
    }
    
    const technology = TechTreeUtils.getTechById(technologyId);
    if (!technology) {
      return res.status(404).json({
        error: 'Technology not found'
      });
    }
    
    // For now, use Evolution.spendPoints which checks prerequisites and points
    // Note: This assumes the technologies table exists in the database
    // In a real implementation with mock data, we'd need a different approach
    const result = await Evolution.spendPoints(colonyId, technologyId);
    
    if (result.error) {
      console.log('❌ Error unlocking technology:', result.error);
      return res.status(400).json({ error: result.error });
    }
    
    console.log('✅ Technology unlocked:', result.data);
    res.json({
      success: true,
      data: {
        ...result.data,
        technologyDetails: technology
      }
    });
    
  } catch (error) {
    console.error('Error in POST /techtree/unlock:', error);
    res.status(500).json({ 
      error: 'Failed to unlock technology',
      details: error.message 
    });
  }
});

// Get technologies by category
router.get('/techtree/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    console.log('🌳 Getting technologies for category:', category);
    
    const techsInCategory = TechTreeUtils.getTechsByCategory(category);
    
    if (techsInCategory.length === 0) {
      return res.status(404).json({
        error: 'Category not found or empty'
      });
    }
    
    res.json({
      success: true,
      data: {
        category,
        technologies: techsInCategory,
        count: techsInCategory.length
      }
    });
    
  } catch (error) {
    console.error('Error in GET /techtree/category:', error);
    res.status(500).json({ 
      error: 'Failed to get technologies by category',
      details: error.message 
    });
  }
});

// Get tech tree progress for a colony (mock implementation)
router.get('/progress/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    
    console.log('🌳 Getting tech tree progress for colony:', colonyId);
    
    // Mock implementation - in a real app this would query the database
    const mockProgress = {
      unlockedTechnologies: ['tech-001', 'tech-002'], // Mock unlocked techs
      technologiesInProgress: [], // Mock techs being researched
      totalEvolutionPointsSpent: 100,
      technologiesByCategory: {
        physical: 2,
        specialized: 0,
        environmental: 0,
        combat: 0,
        efficiency: 0
      }
    };
    
    // Get current evolution points
    const pointsResult = await Evolution.getPoints(colonyId);
    const currentPoints = pointsResult.success ? pointsResult.data.currentPoints : 0;
    
    // Get available technologies
    const availableTechs = TechTreeUtils.getAvailableTechs(mockProgress.unlockedTechnologies);
    
    res.json({
      success: true,
      data: {
        ...mockProgress,
        currentEvolutionPoints: currentPoints,
        availableTechnologies: availableTechs.length,
        completionPercentage: Math.round((mockProgress.unlockedTechnologies.length / technologies.length) * 100)
      }
    });
    
  } catch (error) {
    console.error('Error in GET /progress:', error);
    res.status(500).json({ 
      error: 'Failed to get tech tree progress',
      details: error.message 
    });
  }
});

// Simulate research progress (for testing)
router.post('/research/:colonyId', async (req, res) => {
  try {
    const { colonyId } = req.params;
    const { technologyId, researchPoints } = req.body;
    
    console.log('🌳 Adding research progress for colony:', colonyId, 'Tech:', technologyId, 'Points:', researchPoints);
    
    if (!technologyId || !researchPoints || researchPoints <= 0) {
      return res.status(400).json({
        error: 'Technology ID and positive research points required'
      });
    }
    
    const technology = TechTreeUtils.getTechById(technologyId);
    if (!technology) {
      return res.status(404).json({
        error: 'Technology not found'
      });
    }
    
    // Mock research progress implementation
    // In a real app, this would update the colony_technologies table
    const mockProgress = {
      technologyId,
      currentProgress: Math.min(researchPoints, technology.required_research_points),
      requiredProgress: technology.required_research_points,
      isCompleted: researchPoints >= technology.required_research_points
    };
    
    res.json({
      success: true,
      data: {
        researchProgress: mockProgress,
        technology: technology
      }
    });
    
  } catch (error) {
    console.error('Error in POST /research:', error);
    res.status(500).json({ 
      error: 'Failed to add research progress',
      details: error.message 
    });
  }
});

module.exports = router; 
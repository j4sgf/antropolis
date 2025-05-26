const { mockData } = require('../config/database');

/**
 * Populate test milestones data for development/testing
 */
function populateTestMilestones() {
  console.log('📊 Populating test milestones data...');

  // Sample colony IDs (use existing ones from mockData if available)
  const testColonyIds = ['test-colony-001', 'colony-1748236855918-gbd1jbghn'];

  // Clear existing data
  mockData.colony_milestones = [];
  mockData.colony_statistics = [];
  mockData.colony_events = [];

  testColonyIds.forEach(colonyId => {
    // Create default milestones for each test colony
    const milestones = [
      // Population milestones
      { type: 'population', name: 'First Colony', description: 'Reach 25 ants in your colony', threshold: 25, achieved: true, value: 30 },
      { type: 'population', name: 'Growing Colony', description: 'Reach 50 ants in your colony', threshold: 50, achieved: true, value: 65 },
      { type: 'population', name: 'Thriving Colony', description: 'Reach 100 ants in your colony', threshold: 100, achieved: false, value: null },
      
      // Food harvesting milestones
      { type: 'food_harvested', name: 'First Harvest', description: 'Collect 100 food units', threshold: 100, achieved: true, value: 150 },
      { type: 'food_harvested', name: 'Experienced Foragers', description: 'Collect 1,000 food units', threshold: 1000, achieved: false, value: null },
      
      // Combat milestones
      { type: 'battles_won', name: 'First Victory', description: 'Win your first battle', threshold: 1, achieved: true, value: 1 },
      { type: 'battles_won', name: 'Seasoned Warriors', description: 'Win 5 battles', threshold: 5, achieved: false, value: null },
      
      // Construction milestones
      { type: 'structures_built', name: 'First Builder', description: 'Build your first structure', threshold: 1, achieved: true, value: 3 },
      { type: 'structures_built', name: 'Infrastructure Developer', description: 'Build 5 structures', threshold: 5, achieved: false, value: null }
    ];

    milestones.forEach((milestone, index) => {
      const milestoneId = `milestone-${colonyId}-${index}`;
      const achievedDate = milestone.achieved ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null;

      mockData.colony_milestones.push({
        id: milestoneId,
        colony_id: colonyId,
        milestone_type: milestone.type,
        milestone_name: milestone.name,
        description: milestone.description,
        threshold_value: milestone.threshold,
        threshold_type: 'greater_equal',
        achieved_at: achievedDate ? achievedDate.toISOString() : null,
        achieved_game_tick: milestone.achieved ? Math.floor(Math.random() * 1000) : null,
        achievement_value: milestone.value,
        is_achieved: milestone.achieved,
        is_visible: true,
        reward_data: {},
        created_at: new Date().toISOString()
      });
    });

    // Create some sample statistics
    const stats = [
      { type: 'population', category: 'population', value: 65 },
      { type: 'food_harvested', category: 'resources', value: 150 },
      { type: 'battles_won', category: 'combat', value: 1 },
      { type: 'structures_built', category: 'construction', value: 3 },
      { type: 'territory_explored', category: 'exploration', value: 25 }
    ];

    stats.forEach((stat, index) => {
      const statId = `stat-${colonyId}-${index}`;
      
      mockData.colony_statistics.push({
        id: statId,
        colony_id: colonyId,
        stat_type: stat.type,
        stat_category: stat.category,
        stat_subtype: null,
        value_int: stat.value,
        value_float: 0.0,
        value_json: {},
        description: `Current ${stat.type.replace('_', ' ')} value`,
        recorded_at: new Date().toISOString(),
        game_tick: Math.floor(Math.random() * 1000),
        created_at: new Date().toISOString()
      });
    });

    // Create some sample events
    const events = [
      { type: 'milestone', subtype: 'population', title: 'Milestone Achieved: First Colony', description: 'Reached 25 ants in your colony', importance: 3 },
      { type: 'milestone', subtype: 'population', title: 'Milestone Achieved: Growing Colony', description: 'Reached 50 ants in your colony', importance: 3 },
      { type: 'milestone', subtype: 'food_harvested', title: 'Milestone Achieved: First Harvest', description: 'Collected 100 food units', importance: 3 },
      { type: 'milestone', subtype: 'battles_won', title: 'Milestone Achieved: First Victory', description: 'Won your first battle', importance: 3 },
      { type: 'milestone', subtype: 'structures_built', title: 'Milestone Achieved: First Builder', description: 'Built your first structure', importance: 3 },
      { type: 'population', subtype: 'growth', title: 'Population Growth', description: 'Colony population increased to 65 ants', importance: 2 },
      { type: 'resource', subtype: 'harvested', title: 'Food Harvested', description: 'Collected 50 units of food', importance: 1 },
      { type: 'combat', subtype: 'victory', title: 'Battle Won', description: 'Defeated enemy colony in territorial dispute', importance: 2 },
      { type: 'construction', subtype: 'built', title: 'Structure Built', description: 'Completed construction of food storage', importance: 2 },
      { type: 'system', subtype: 'tracking_started', title: 'Statistics Tracking Started', description: 'Colony statistics tracking has been initialized', importance: 1 }
    ];

    events.forEach((event, index) => {
      const eventId = `event-${colonyId}-${index}`;
      const eventDate = new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000);

      mockData.colony_events.push({
        id: eventId,
        colony_id: colonyId,
        event_type: event.type,
        event_subtype: event.subtype,
        title: event.title,
        description: event.description,
        importance_level: event.importance,
        event_data: event.type === 'milestone' ? {
          statType: event.subtype,
          threshold: 25,
          achievedValue: 30
        } : {},
        related_entity_id: null,
        related_entity_type: null,
        location_x: Math.floor(Math.random() * 100),
        location_y: Math.floor(Math.random() * 100),
        occurred_at: eventDate.toISOString(),
        game_tick: Math.floor(Math.random() * 1000),
        created_at: new Date().toISOString()
      });
    });
  });

  console.log(`📊 Created ${mockData.colony_milestones.length} test milestones`);
  console.log(`📊 Created ${mockData.colony_statistics.length} test statistics`);
  console.log(`📊 Created ${mockData.colony_events.length} test events`);
  console.log('✅ Test data population complete!');

  return {
    milestones: mockData.colony_milestones.length,
    statistics: mockData.colony_statistics.length,
    events: mockData.colony_events.length
  };
}

// Auto-populate when required
if (require.main === module) {
  populateTestMilestones();
} else {
  // Auto-populate when imported (for development)
  setTimeout(populateTestMilestones, 100);
}

module.exports = { populateTestMilestones }; 
/**
 * Comprehensive role data for ant types
 * Contains descriptions, benefits, trade-offs, and statistics
 */

export const roleData = {
  worker: {
    name: 'Worker',
    icon: '👷',
    colorClass: 'role-worker',
    description: 'Versatile ants that handle general colony maintenance and basic tasks. The backbone of any successful colony.',
    benefits: [
      'High versatility for multiple tasks',
      'Efficient resource consumption',
      'Quick adaptation to colony needs',
      'Reliable task completion'
    ],
    tradeoffs: [
      'Lower specialization efficiency',
      'Limited combat effectiveness',
      'Cannot perform advanced tasks',
      'Medium movement speed'
    ],
    stats: {
      efficiency: 75,
      specialization: 60,
      combat: 30,
      mobility: 65
    },
    subRoles: ['General Labor', 'Maintenance', 'Basic Construction'],
    optimalCount: {
      small: '40-50%',
      medium: '35-45%',
      large: '30-40%'
    },
    primaryTasks: [
      'Colony maintenance',
      'Basic resource gathering',
      'Simple construction',
      'General upkeep'
    ]
  },

  soldier: {
    name: 'Soldier',
    icon: '⚔️',
    colorClass: 'role-soldier',
    description: 'Specialized combat ants focused on defense and warfare. Essential for protecting the colony from threats.',
    benefits: [
      'Superior combat effectiveness',
      'High defensive capabilities',
      'Intimidation factor vs enemies',
      'Strategic positioning skills'
    ],
    tradeoffs: [
      'High resource consumption',
      'Limited non-combat utility',
      'Requires constant training',
      'Slower at peaceful tasks'
    ],
    stats: {
      efficiency: 60,
      specialization: 90,
      combat: 95,
      mobility: 70
    },
    subRoles: ['Guard', 'Fighter', 'Patrol', 'Elite Guard'],
    optimalCount: {
      small: '15-25%',
      medium: '20-30%',
      large: '25-35%'
    },
    primaryTasks: [
      'Colony defense',
      'Perimeter patrol',
      'Combat operations',
      'Threat elimination'
    ]
  },

  scout: {
    name: 'Scout',
    icon: '🔍',
    colorClass: 'role-scout',
    description: 'Fast and agile ants specialized in exploration and intelligence gathering. Eyes and ears of the colony.',
    benefits: [
      'Fastest movement speed',
      'Excellent exploration range',
      'Early threat detection',
      'Resource discovery'
    ],
    tradeoffs: [
      'Low combat effectiveness',
      'Limited carrying capacity',
      'Higher injury risk',
      'Requires rest frequently'
    ],
    stats: {
      efficiency: 70,
      specialization: 85,
      combat: 40,
      mobility: 95
    },
    subRoles: ['Explorer', 'Detector', 'Messenger', 'Pathfinder'],
    optimalCount: {
      small: '5-10%',
      medium: '8-12%',
      large: '10-15%'
    },
    primaryTasks: [
      'Territory exploration',
      'Threat detection',
      'Resource scouting',
      'Intelligence gathering'
    ]
  },

  nurse: {
    name: 'Nurse',
    icon: '🩺',
    colorClass: 'role-nurse',
    description: 'Caring ants dedicated to larvae care and colony health management. Vital for population growth.',
    benefits: [
      'Accelerated larvae development',
      'Improved colony health',
      'Population growth boost',
      'Disease prevention'
    ],
    tradeoffs: [
      'Non-combat specialization',
      'Limited mobility',
      'Resource intensive',
      'Vulnerable when alone'
    ],
    stats: {
      efficiency: 85,
      specialization: 80,
      combat: 25,
      mobility: 50
    },
    subRoles: ['Caretaker', 'Healer', 'Midwife', 'Health Monitor'],
    optimalCount: {
      small: '10-15%',
      medium: '12-18%',
      large: '15-20%'
    },
    primaryTasks: [
      'Larvae care',
      'Health monitoring',
      'Medical treatment',
      'Population management'
    ]
  },

  builder: {
    name: 'Builder',
    icon: '🔨',
    colorClass: 'role-builder',
    description: 'Construction specialists focused on expanding and improving colony infrastructure.',
    benefits: [
      'Advanced construction skills',
      'Efficient material usage',
      'Complex structure building',
      'Infrastructure planning'
    ],
    tradeoffs: [
      'Slow movement speed',
      'High material requirements',
      'Limited combat ability',
      'Weather dependent'
    ],
    stats: {
      efficiency: 90,
      specialization: 85,
      combat: 35,
      mobility: 45
    },
    subRoles: ['Architect', 'Constructor', 'Engineer', 'Renovator'],
    optimalCount: {
      small: '8-12%',
      medium: '10-15%',
      large: '12-18%'
    },
    primaryTasks: [
      'Structure construction',
      'Infrastructure expansion',
      'Tunnel digging',
      'Facility maintenance'
    ]
  },

  forager: {
    name: 'Forager',
    icon: '🌾',
    colorClass: 'role-forager',
    description: 'Resource gathering specialists who venture out to collect food and materials for the colony.',
    benefits: [
      'Excellent resource finding',
      'High carrying capacity',
      'Efficient collection routes',
      'Food source identification'
    ],
    tradeoffs: [
      'Moderate combat ability',
      'Weather vulnerability',
      'Predation risk',
      'Energy intensive work'
    ],
    stats: {
      efficiency: 85,
      specialization: 75,
      combat: 45,
      mobility: 80
    },
    subRoles: ['Gatherer', 'Collector', 'Harvester', 'Trader'],
    optimalCount: {
      small: '20-30%',
      medium: '18-25%',
      large: '15-22%'
    },
    primaryTasks: [
      'Food collection',
      'Material gathering',
      'Resource transport',
      'Supply management'
    ]
  }
};

/**
 * Get role data by role name
 * @param {string} roleName - Role name
 * @returns {Object} Role data
 */
export function getRoleData(roleName) {
  const normalizedName = roleName?.toLowerCase();
  return roleData[normalizedName] || roleData.worker;
}

/**
 * Get all available roles
 * @returns {Array} Array of role names
 */
export function getAllRoles() {
  return Object.keys(roleData);
}

/**
 * Get optimal role distribution for colony size
 * @param {string} colonySize - small, medium, large
 * @returns {Object} Optimal distribution percentages
 */
export function getOptimalDistribution(colonySize = 'medium') {
  const distribution = {};
  
  Object.entries(roleData).forEach(([role, data]) => {
    const range = data.optimalCount[colonySize];
    if (range) {
      // Extract middle value from range (e.g., "40-50%" -> 45)
      const [min, max] = range.split('-').map(v => parseInt(v));
      distribution[role] = Math.round((min + max) / 2);
    }
  });
  
  return distribution;
}

/**
 * Get role recommendations based on current distribution
 * @param {Object} currentDistribution - Current role counts
 * @param {string} colonySize - Colony size
 * @returns {Array} Recommendations
 */
export function getRoleRecommendations(currentDistribution, colonySize = 'medium') {
  const optimal = getOptimalDistribution(colonySize);
  const total = Object.values(currentDistribution).reduce((sum, count) => sum + count, 0);
  const recommendations = [];
  
  Object.entries(optimal).forEach(([role, optimalPercent]) => {
    const currentCount = currentDistribution[role] || 0;
    const currentPercent = total > 0 ? (currentCount / total) * 100 : 0;
    const difference = Math.abs(currentPercent - optimalPercent);
    
    if (difference > 5) { // 5% threshold
      recommendations.push({
        role,
        type: currentPercent < optimalPercent ? 'increase' : 'decrease',
        current: Math.round(currentPercent),
        optimal: optimalPercent,
        priority: difference > 15 ? 'high' : difference > 10 ? 'medium' : 'low'
      });
    }
  });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Calculate role efficiency based on current tasks
 * @param {string} role - Role name
 * @param {Array} currentTasks - Current tasks assigned
 * @returns {number} Efficiency percentage
 */
export function calculateRoleEfficiency(role, currentTasks = []) {
  const roleInfo = getRoleData(role);
  let efficiency = roleInfo.stats.efficiency;
  
  // Adjust efficiency based on task alignment
  const alignedTasks = currentTasks.filter(task => 
    roleInfo.primaryTasks.some(primaryTask => 
      task.toLowerCase().includes(primaryTask.toLowerCase().split(' ')[0])
    )
  );
  
  const alignmentRatio = currentTasks.length > 0 ? alignedTasks.length / currentTasks.length : 1;
  efficiency = Math.round(efficiency * alignmentRatio);
  
  return Math.min(100, Math.max(0, efficiency));
}

export default roleData; 
/**
 * ColonyMemory class for managing AI colony memory and information storage
 * Handles discovered resources, enemy intelligence, terrain features, and strategic information
 */

class ColonyMemory {
  constructor(colonyId) {
    this.colonyId = colonyId;
    this.memoryCategories = {
      'discovered_resources': [],
      'enemy_movements': [],
      'battle_history': [],
      'territory_changes': [],
      'scout_missions': [],
      'trade_opportunities': [],
      'strategic_positions': [],
      'threat_assessments': [],
      'alliance_information': [],
      'terrain_features': []
    };
    this.memoryLimits = {
      'discovered_resources': 100,
      'enemy_movements': 50,
      'battle_history': 30,
      'territory_changes': 40,
      'scout_missions': 25,
      'trade_opportunities': 20,
      'strategic_positions': 50,
      'threat_assessments': 40,
      'alliance_information': 15,
      'terrain_features': 80
    };
    this.lastCleanup = new Date();
  }

  /**
   * Store a memory entry
   */
  storeMemory(category, data) {
    if (!this.memoryCategories[category]) {
      this.memoryCategories[category] = [];
    }

    const memoryEntry = {
      ...data,
      id: this.generateMemoryId(),
      timestamp: new Date().toISOString(),
      relevance_score: this.calculateRelevanceScore(category, data),
      access_count: 0,
      last_accessed: null
    };

    this.memoryCategories[category].push(memoryEntry);
    
    // Enforce memory limits
    this.enforceMemoryLimits(category);
    
    return memoryEntry.id;
  }

  /**
   * Retrieve memories by category
   */
  getMemories(category, filters = {}) {
    if (!this.memoryCategories[category]) {
      return [];
    }

    let memories = this.memoryCategories[category];

    // Apply filters
    if (filters.limit) {
      memories = memories.slice(-filters.limit);
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      memories = memories.filter(memory => new Date(memory.timestamp) >= sinceDate);
    }

    if (filters.location) {
      memories = memories.filter(memory => {
        if (memory.location) {
          const distance = this.calculateDistance(memory.location, filters.location);
          return distance <= (filters.radius || 10);
        }
        return false;
      });
    }

    if (filters.relevance_threshold) {
      memories = memories.filter(memory => memory.relevance_score >= filters.relevance_threshold);
    }

    // Update access tracking
    memories.forEach(memory => {
      memory.access_count++;
      memory.last_accessed = new Date().toISOString();
    });

    // Sort by relevance and recency
    memories.sort((a, b) => {
      const relevanceWeight = 0.7;
      const recencyWeight = 0.3;
      
      const aScore = a.relevance_score * relevanceWeight + this.getRecencyScore(a.timestamp) * recencyWeight;
      const bScore = b.relevance_score * relevanceWeight + this.getRecencyScore(b.timestamp) * recencyWeight;
      
      return bScore - aScore;
    });

    return memories;
  }

  /**
   * Get specific memory by ID
   */
  getMemoryById(memoryId) {
    for (const category in this.memoryCategories) {
      const memory = this.memoryCategories[category].find(m => m.id === memoryId);
      if (memory) {
        memory.access_count++;
        memory.last_accessed = new Date().toISOString();
        return memory;
      }
    }
    return null;
  }

  /**
   * Search memories across all categories
   */
  searchMemories(searchCriteria) {
    const results = [];

    for (const category in this.memoryCategories) {
      const categoryResults = this.searchInCategory(category, searchCriteria);
      results.push(...categoryResults.map(memory => ({
        ...memory,
        category: category
      })));
    }

    // Sort by relevance to search criteria
    results.sort((a, b) => {
      const aRelevance = this.calculateSearchRelevance(a, searchCriteria);
      const bRelevance = this.calculateSearchRelevance(b, searchCriteria);
      return bRelevance - aRelevance;
    });

    return results;
  }

  /**
   * Search within a specific category
   */
  searchInCategory(category, searchCriteria) {
    if (!this.memoryCategories[category]) {
      return [];
    }

    return this.memoryCategories[category].filter(memory => {
      return this.matchesSearchCriteria(memory, searchCriteria);
    });
  }

  /**
   * Check if memory matches search criteria
   */
  matchesSearchCriteria(memory, criteria) {
    // Text search
    if (criteria.text) {
      const searchText = criteria.text.toLowerCase();
      const memoryText = JSON.stringify(memory).toLowerCase();
      if (!memoryText.includes(searchText)) {
        return false;
      }
    }

    // Location search
    if (criteria.location && memory.location) {
      const distance = this.calculateDistance(memory.location, criteria.location);
      if (distance > (criteria.radius || 10)) {
        return false;
      }
    }

    // Type search
    if (criteria.type && memory.type !== criteria.type) {
      return false;
    }

    // Time range search
    if (criteria.timeRange) {
      const memoryTime = new Date(memory.timestamp);
      if (criteria.timeRange.start && memoryTime < new Date(criteria.timeRange.start)) {
        return false;
      }
      if (criteria.timeRange.end && memoryTime > new Date(criteria.timeRange.end)) {
        return false;
      }
    }

    // Custom filters
    if (criteria.customFilter && !criteria.customFilter(memory)) {
      return false;
    }

    return true;
  }

  /**
   * Update memory entry
   */
  updateMemory(memoryId, updateData) {
    for (const category in this.memoryCategories) {
      const memoryIndex = this.memoryCategories[category].findIndex(m => m.id === memoryId);
      if (memoryIndex !== -1) {
        const memory = this.memoryCategories[category][memoryIndex];
        
        // Update fields
        Object.assign(memory, updateData);
        memory.last_updated = new Date().toISOString();
        
        // Recalculate relevance if data changed
        memory.relevance_score = this.calculateRelevanceScore(category, memory);
        
        return memory;
      }
    }
    return null;
  }

  /**
   * Delete memory entry
   */
  deleteMemory(memoryId) {
    for (const category in this.memoryCategories) {
      const memoryIndex = this.memoryCategories[category].findIndex(m => m.id === memoryId);
      if (memoryIndex !== -1) {
        const deletedMemory = this.memoryCategories[category].splice(memoryIndex, 1)[0];
        return deletedMemory;
      }
    }
    return null;
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    const stats = {
      total_memories: 0,
      categories: {},
      memory_usage: {},
      oldest_memory: null,
      newest_memory: null,
      most_accessed: null
    };

    let oldestTime = Date.now();
    let newestTime = 0;
    let mostAccessed = null;

    for (const category in this.memoryCategories) {
      const memories = this.memoryCategories[category];
      const categoryCount = memories.length;
      
      stats.categories[category] = categoryCount;
      stats.memory_usage[category] = {
        used: categoryCount,
        limit: this.memoryLimits[category],
        usage_percent: (categoryCount / this.memoryLimits[category]) * 100
      };
      
      stats.total_memories += categoryCount;

      // Find oldest and newest memories
      memories.forEach(memory => {
        const memoryTime = new Date(memory.timestamp).getTime();
        if (memoryTime < oldestTime) {
          oldestTime = memoryTime;
          stats.oldest_memory = memory;
        }
        if (memoryTime > newestTime) {
          newestTime = memoryTime;
          stats.newest_memory = memory;
        }
        
        // Find most accessed memory
        if (!mostAccessed || memory.access_count > mostAccessed.access_count) {
          mostAccessed = memory;
        }
      });
    }

    stats.most_accessed = mostAccessed;

    return stats;
  }

  /**
   * Clean up old and irrelevant memories
   */
  cleanupMemories() {
    const cleanupStats = {
      removed_memories: 0,
      categories_cleaned: [],
      cleanup_time: new Date().toISOString()
    };

    for (const category in this.memoryCategories) {
      const beforeCount = this.memoryCategories[category].length;
      
      // Remove very old memories (older than 30 days for most categories)
      const cutoffDays = this.getCutoffDays(category);
      const cutoffDate = new Date(Date.now() - (cutoffDays * 24 * 60 * 60 * 1000));
      
      this.memoryCategories[category] = this.memoryCategories[category].filter(memory => {
        const memoryDate = new Date(memory.timestamp);
        const isRecent = memoryDate >= cutoffDate;
        const isRelevant = memory.relevance_score >= 0.3;
        const isAccessed = memory.access_count > 0;
        
        return isRecent || isRelevant || isAccessed;
      });

      const afterCount = this.memoryCategories[category].length;
      const removedCount = beforeCount - afterCount;
      
      if (removedCount > 0) {
        cleanupStats.removed_memories += removedCount;
        cleanupStats.categories_cleaned.push({
          category: category,
          removed: removedCount,
          remaining: afterCount
        });
      }
    }

    this.lastCleanup = new Date();
    return cleanupStats;
  }

  /**
   * Get related memories based on location, type, or content
   */
  getRelatedMemories(referenceMemory, maxResults = 5) {
    const relatedMemories = [];

    for (const category in this.memoryCategories) {
      this.memoryCategories[category].forEach(memory => {
        if (memory.id === referenceMemory.id) return; // Skip self
        
        const relationScore = this.calculateRelationScore(referenceMemory, memory);
        if (relationScore > 0.3) {
          relatedMemories.push({
            ...memory,
            category: category,
            relation_score: relationScore
          });
        }
      });
    }

    // Sort by relation score and return top results
    relatedMemories.sort((a, b) => b.relation_score - a.relation_score);
    return relatedMemories.slice(0, maxResults);
  }

  /**
   * Generate unique memory ID
   */
  generateMemoryId() {
    return `mem_${this.colonyId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  /**
   * Calculate relevance score for a memory entry
   */
  calculateRelevanceScore(category, data) {
    let score = 0.5; // Base score

    // Category-specific relevance factors
    switch (category) {
      case 'discovered_resources':
        score += (data.abundance || 0) / 100 * 0.3;
        score += (data.accessibility || 0) * 0.2;
        break;
      case 'enemy_movements':
        score += (data.threat_level || 0) * 0.4;
        score += data.unit_count ? Math.min(0.3, data.unit_count / 100) : 0;
        break;
      case 'strategic_positions':
        score += (data.strategic_value || 0) * 0.4;
        break;
      case 'terrain_features':
        score += (data.strategic_value || 0) * 0.3;
        break;
    }

    // Recency bonus
    const age = Date.now() - new Date(data.timestamp || Date.now()).getTime();
    const ageDays = age / (1000 * 60 * 60 * 24);
    score += Math.max(0, 0.2 * (1 - ageDays / 30)); // Bonus decreases over 30 days

    return Math.max(0.1, Math.min(1.0, score));
  }

  /**
   * Calculate recency score (0-1, with 1 being most recent)
   */
  getRecencyScore(timestamp) {
    const age = Date.now() - new Date(timestamp).getTime();
    const ageDays = age / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (ageDays / 30)); // Linear decay over 30 days
  }

  /**
   * Calculate search relevance score
   */
  calculateSearchRelevance(memory, searchCriteria) {
    let relevance = memory.relevance_score * 0.4; // Base relevance

    // Location relevance
    if (searchCriteria.location && memory.location) {
      const distance = this.calculateDistance(memory.location, searchCriteria.location);
      const maxDistance = searchCriteria.radius || 10;
      const locationRelevance = Math.max(0, 1 - (distance / maxDistance));
      relevance += locationRelevance * 0.3;
    }

    // Type relevance
    if (searchCriteria.type && memory.type === searchCriteria.type) {
      relevance += 0.2;
    }

    // Recency relevance
    relevance += this.getRecencyScore(memory.timestamp) * 0.1;

    return Math.min(1.0, relevance);
  }

  /**
   * Calculate relation score between two memories
   */
  calculateRelationScore(memory1, memory2) {
    let relationScore = 0;

    // Location proximity
    if (memory1.location && memory2.location) {
      const distance = this.calculateDistance(memory1.location, memory2.location);
      if (distance <= 5) {
        relationScore += 0.4 * (1 - distance / 5);
      }
    }

    // Type similarity
    if (memory1.type === memory2.type) {
      relationScore += 0.3;
    }

    // Temporal proximity
    const timeDiff = Math.abs(new Date(memory1.timestamp) - new Date(memory2.timestamp));
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (daysDiff <= 7) {
      relationScore += 0.2 * (1 - daysDiff / 7);
    }

    // Content similarity (basic keyword matching)
    const content1 = JSON.stringify(memory1).toLowerCase();
    const content2 = JSON.stringify(memory2).toLowerCase();
    const commonWords = this.findCommonWords(content1, content2);
    if (commonWords > 2) {
      relationScore += Math.min(0.1, commonWords * 0.02);
    }

    return Math.min(1.0, relationScore);
  }

  /**
   * Calculate distance between two locations
   */
  calculateDistance(loc1, loc2) {
    return Math.sqrt(Math.pow(loc1.x - loc2.x, 2) + Math.pow(loc1.y - loc2.y, 2));
  }

  /**
   * Find common words between two text strings
   */
  findCommonWords(text1, text2) {
    const words1 = text1.match(/\b\w+\b/g) || [];
    const words2 = text2.match(/\b\w+\b/g) || [];
    const commonWords = words1.filter(word => words2.includes(word) && word.length > 3);
    return commonWords.length;
  }

  /**
   * Get cutoff days for memory cleanup by category
   */
  getCutoffDays(category) {
    const cutoffDays = {
      'discovered_resources': 45,
      'enemy_movements': 14,
      'battle_history': 60,
      'territory_changes': 30,
      'scout_missions': 21,
      'trade_opportunities': 30,
      'strategic_positions': 60,
      'threat_assessments': 21,
      'alliance_information': 90,
      'terrain_features': 90
    };

    return cutoffDays[category] || 30;
  }

  /**
   * Enforce memory limits for a category
   */
  enforceMemoryLimits(category) {
    const limit = this.memoryLimits[category];
    const memories = this.memoryCategories[category];

    if (memories.length > limit) {
      // Sort by relevance and access count, remove least important
      memories.sort((a, b) => {
        const aScore = a.relevance_score + (a.access_count * 0.1);
        const bScore = b.relevance_score + (b.access_count * 0.1);
        return aScore - bScore; // Ascending, so least important first
      });

      // Remove excess memories
      const excessCount = memories.length - limit;
      this.memoryCategories[category] = memories.slice(excessCount);
    }
  }

  /**
   * Export all memories for backup or analysis
   */
  exportMemories() {
    return {
      colonyId: this.colonyId,
      exportTime: new Date().toISOString(),
      memories: { ...this.memoryCategories },
      stats: this.getMemoryStats()
    };
  }

  /**
   * Import memories from backup
   */
  importMemories(memoryData) {
    if (memoryData.colonyId !== this.colonyId) {
      throw new Error('Memory data belongs to a different colony');
    }

    // Merge imported memories with existing ones
    for (const category in memoryData.memories) {
      if (!this.memoryCategories[category]) {
        this.memoryCategories[category] = [];
      }

      // Add imported memories, avoiding duplicates
      memoryData.memories[category].forEach(memory => {
        const exists = this.memoryCategories[category].some(existing => existing.id === memory.id);
        if (!exists) {
          this.memoryCategories[category].push(memory);
        }
      });

      // Enforce limits after import
      this.enforceMemoryLimits(category);
    }

    return this.getMemoryStats();
  }
}

module.exports = ColonyMemory; 
const Structure = require('../models/Structure');
const { supabase, handleDatabaseError } = require('../config/database');

// Lazy-load to avoid circular dependencies
let StructureEventManager = null;

/**
 * ConstructionManager service handles ongoing construction projects
 * Manages worker assignment, construction progress, and resource consumption
 */
class ConstructionManager {
  constructor() {
    this.activeProjects = new Map(); // colonyId -> array of construction projects
    this.tickInterval = 1000; // 1 second per tick
  }

  // Get construction project data structure
  createConstructionProject(structureId, colonyId, structureType, workersAssigned = 1) {
    const structureTypes = Structure.getStructureTypes();
    const template = structureTypes[structureType];
    
    if (!template) {
      throw new Error('Invalid structure type');
    }

    return {
      id: structureId,
      colonyId: colonyId,
      structureType: structureType,
      startTime: Date.now(),
      totalTime: template.construction_time * 1000, // Convert to milliseconds
      workersAssigned: workersAssigned,
      requiredWorkers: template.required_workers || 1,
      progress: 0,
      status: 'in_progress',
      resourcesConsumed: false
    };
  }

  // Start a new construction project
  async startConstruction(structureId, colonyId, structureType, workersAssigned = 1) {
    try {
      const project = this.createConstructionProject(
        structureId, 
        colonyId, 
        structureType, 
        workersAssigned
      );

      // Add to active projects
      if (!this.activeProjects.has(colonyId)) {
        this.activeProjects.set(colonyId, []);
      }
      this.activeProjects.get(colonyId).push(project);

      console.log(`🏗️ Started construction of ${structureType} for colony ${colonyId}`);
      
      return { 
        success: true, 
        data: project 
      };
    } catch (error) {
      console.error('Error starting construction:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Assign workers to a construction project
  async assignWorkers(structureId, workerCount) {
    try {
      // Find the project
      let targetProject = null;
      let colonyProjects = null;

      for (const [colonyId, projects] of this.activeProjects) {
        const project = projects.find(p => p.id === structureId);
        if (project) {
          targetProject = project;
          colonyProjects = projects;
          break;
        }
      }

      if (!targetProject) {
        return { 
          success: false, 
          error: 'Construction project not found' 
        };
      }

      // Update worker assignment
      targetProject.workersAssigned = Math.max(0, workerCount);
      
      console.log(`👷 Assigned ${workerCount} workers to structure ${structureId}`);
      
      return { 
        success: true, 
        data: targetProject 
      };
    } catch (error) {
      console.error('Error assigning workers:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Calculate construction speed based on workers
  calculateConstructionSpeed(project) {
    const baseSpeed = 1.0;
    const workerEfficiency = Math.min(project.workersAssigned / project.requiredWorkers, 2.0);
    
    // Bonus for having enough workers, penalty for too few
    let speedMultiplier = baseSpeed * workerEfficiency;
    
    // Diminishing returns for extra workers
    if (workerEfficiency > 1.0) {
      const extraWorkers = workerEfficiency - 1.0;
      speedMultiplier = baseSpeed + (extraWorkers * 0.5);
    }

    return Math.max(0.1, speedMultiplier); // Minimum 10% speed
  }

  // Process construction progress for all active projects
  async processConstructionTick() {
    const currentTime = Date.now();
    const completedProjects = [];

    for (const [colonyId, projects] of this.activeProjects) {
      for (let i = projects.length - 1; i >= 0; i--) {
        const project = projects[i];
        
        if (project.status !== 'in_progress') {
          continue;
        }

        // Calculate progress
        const elapsedTime = currentTime - project.startTime;
        const speedMultiplier = this.calculateConstructionSpeed(project);
        const adjustedElapsed = elapsedTime * speedMultiplier;
        const progressPercent = Math.min(100, (adjustedElapsed / project.totalTime) * 100);

        // Update structure in database
        try {
          const structureResult = await Structure.findById(project.id);
          if (structureResult.data) {
            await structureResult.data.updateConstructionProgress(progressPercent);
            project.progress = progressPercent;
          }
        } catch (error) {
          console.error('Error updating construction progress:', error);
          continue;
        }

        // Check if construction is complete
        if (progressPercent >= 100) {
          project.status = 'completed';
          completedProjects.push({
            colonyId: colonyId,
            project: project
          });
          
          // Remove from active projects
          projects.splice(i, 1);
          
          console.log(`✅ Construction completed: ${project.structureType} in colony ${colonyId}`);
        }
      }

      // Clean up empty project arrays
      if (projects.length === 0) {
        this.activeProjects.delete(colonyId);
      }
    }

    return completedProjects;
  }

  // Get construction projects for a colony
  getColonyProjects(colonyId) {
    return this.activeProjects.get(colonyId) || [];
  }

  // Get specific construction project
  getProject(structureId) {
    for (const [colonyId, projects] of this.activeProjects) {
      const project = projects.find(p => p.id === structureId);
      if (project) {
        return {
          ...project,
          colonyId: colonyId
        };
      }
    }
    return null;
  }

  // Cancel construction project
  async cancelConstruction(structureId) {
    try {
      // Find and remove the project
      for (const [colonyId, projects] of this.activeProjects) {
        const projectIndex = projects.findIndex(p => p.id === structureId);
        if (projectIndex !== -1) {
          const project = projects[projectIndex];
          projects.splice(projectIndex, 1);
          
          // Clean up empty arrays
          if (projects.length === 0) {
            this.activeProjects.delete(colonyId);
          }

          // Remove structure from database
          const structureResult = await Structure.findById(structureId);
          if (structureResult.data) {
            await structureResult.data.demolish();
          }

          console.log(`❌ Cancelled construction: ${project.structureType} in colony ${colonyId}`);
          
          return { 
            success: true, 
            data: { message: 'Construction cancelled' } 
          };
        }
      }

      return { 
        success: false, 
        error: 'Construction project not found' 
      };
    } catch (error) {
      console.error('Error cancelling construction:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Get construction statistics for a colony
  getConstructionStats(colonyId) {
    const projects = this.getColonyProjects(colonyId);
    
    const stats = {
      activeProjects: projects.length,
      totalProgress: 0,
      totalWorkersAssigned: 0,
      averageProgress: 0,
      estimatedCompletion: null,
      projects: projects.map(project => ({
        id: project.id,
        type: project.structureType,
        progress: project.progress,
        workersAssigned: project.workersAssigned,
        startTime: project.startTime,
        estimatedCompletion: this.calculateEstimatedCompletion(project)
      }))
    };

    if (projects.length > 0) {
      stats.totalProgress = projects.reduce((sum, p) => sum + p.progress, 0);
      stats.totalWorkersAssigned = projects.reduce((sum, p) => sum + p.workersAssigned, 0);
      stats.averageProgress = stats.totalProgress / projects.length;
      
      // Find earliest completion time
      const completionTimes = projects
        .map(p => this.calculateEstimatedCompletion(p))
        .filter(time => time !== null);
      
      if (completionTimes.length > 0) {
        stats.estimatedCompletion = Math.max(...completionTimes);
      }
    }

    return stats;
  }

  // Calculate estimated completion time for a project
  calculateEstimatedCompletion(project) {
    if (project.progress >= 100) {
      return project.startTime; // Already completed
    }

    const remainingProgress = 100 - project.progress;
    const speedMultiplier = this.calculateConstructionSpeed(project);
    const remainingTime = (project.totalTime * (remainingProgress / 100)) / speedMultiplier;
    
    return Date.now() + remainingTime;
  }

  // Resource validation for construction
  async validateConstructionResources(colonyId, structureType, level = 1) {
    try {
      const structureTypes = Structure.getStructureTypes();
      const template = structureTypes[structureType];
      
      if (!template) {
        return { 
          success: false, 
          error: 'Invalid structure type' 
        };
      }

      const requiredResources = Structure.calculateLevelCost(template.base_cost, level);
      
      // Get colony resources (this would integrate with the resource system)
      const { data: colonyResources, error } = await supabase
        .from('colony_resources')
        .select('resource_type, amount')
        .eq('colony_id', colonyId);

      if (error) {
        return handleDatabaseError(error, 'checking colony resources');
      }

      // Convert to map for easier lookup
      const resourceMap = {};
      colonyResources.forEach(resource => {
        resourceMap[resource.resource_type] = resource.amount;
      });

      // Check if colony has enough resources
      const insufficientResources = [];
      for (const [resourceType, requiredAmount] of Object.entries(requiredResources)) {
        const availableAmount = resourceMap[resourceType] || 0;
        if (availableAmount < requiredAmount) {
          insufficientResources.push({
            type: resourceType,
            required: requiredAmount,
            available: availableAmount,
            shortage: requiredAmount - availableAmount
          });
        }
      }

      if (insufficientResources.length > 0) {
        return {
          success: false,
          error: 'Insufficient resources',
          data: {
            required: requiredResources,
            insufficient: insufficientResources
          }
        };
      }

      return {
        success: true,
        data: {
          required: requiredResources,
          available: resourceMap,
          canConstruct: true
        }
      };
    } catch (error) {
      console.error('Error validating construction resources:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Consume resources for construction
  async consumeConstructionResources(colonyId, structureType, level = 1) {
    try {
      const validation = await this.validateConstructionResources(colonyId, structureType, level);
      
      if (!validation.success) {
        return validation;
      }

      const requiredResources = validation.data.required;

      // Deduct resources from colony
      for (const [resourceType, amount] of Object.entries(requiredResources)) {
        const { error } = await supabase
          .from('colony_resources')
          .update({ 
            amount: supabase.raw(`amount - ${amount}`),
            updated_at: new Date().toISOString()
          })
          .eq('colony_id', colonyId)
          .eq('resource_type', resourceType);

        if (error) {
          console.error(`Error consuming ${resourceType}:`, error);
          return handleDatabaseError(error, `consuming ${resourceType}`);
        }
      }

      console.log(`💰 Consumed resources for ${structureType} construction in colony ${colonyId}`);
      
      return {
        success: true,
        data: {
          consumed: requiredResources,
          message: 'Resources consumed successfully'
        }
      };
    } catch (error) {
      console.error('Error consuming construction resources:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Get all active projects across all colonies (for debugging/monitoring)
  getAllProjects() {
    const allProjects = [];
    for (const [colonyId, projects] of this.activeProjects) {
      allProjects.push(...projects.map(p => ({
        ...p,
        colonyId: colonyId
      })));
    }
    return allProjects;
  }

  // Start the construction processing loop
  startProcessing() {
    if (this.processingInterval) {
      return; // Already running
    }

    this.processingInterval = setInterval(async () => {
      try {
        const completedProjects = await this.processConstructionTick();
        
        // Handle completed projects and trigger events
        for (const completion of completedProjects) {
          console.log(`🎉 Construction completed in colony ${completion.colonyId}: ${completion.project.structureType}`);
          
          // Lazy-load and trigger construction complete event
          if (!StructureEventManager) {
            StructureEventManager = require('./StructureEventManager');
          }
          
          StructureEventManager.triggerConstructionComplete({
            colonyId: completion.colonyId,
            structureId: completion.project.structureId,
            structureName: completion.project.structureName || completion.project.structureType,
            structureType: completion.project.structureType,
            level: completion.project.level || 1,
            completionTime: Date.now()
          });
        }
      } catch (error) {
        console.error('Error processing construction tick:', error);
      }
    }, this.tickInterval);

    console.log('🔄 Construction manager started processing');
  }

  // Stop the construction processing loop
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      console.log('⏹️ Construction manager stopped processing');
    }
  }
}

// Export singleton instance
module.exports = new ConstructionManager(); 
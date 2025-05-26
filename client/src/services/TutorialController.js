import { TUTORIAL_STEPS, TUTORIAL_GROUPS } from '../constants/tutorialConstants';

/**
 * TutorialController - Manages tutorial flow, step sequencing, and completion validation
 * This service implements the core logic for subtask 22.3: Tutorial Content and Flow Logic
 */
class TutorialController {
  constructor() {
    this.eventListeners = new Map();
    this.completionCheckers = new Map();
    this.contextualHelp = new Map();
    this.inactivityTimer = null;
    this.lastAction = Date.now();
    
    this.initializeCompletionCheckers();
    this.initializeEventListeners();
    this.initializeContextualHelp();
  }

  /**
   * Initialize completion checkers for each tutorial step
   */
  initializeCompletionCheckers() {
    // Setup steps completion checkers
    this.completionCheckers.set(TUTORIAL_STEPS.WELCOME, () => true); // Always completable
    this.completionCheckers.set(TUTORIAL_STEPS.COLONY_CREATION, this.verifyColonyCreationStarted.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.COLONY_NAMING, this.verifyColonyNamed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.COLONY_ATTRIBUTES, this.verifyAttributesSelected.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.COLONY_CONFIRM, this.verifyColonyCreated.bind(this));

    // UI basics completion checkers
    this.completionCheckers.set(TUTORIAL_STEPS.FIRST_VIEW, this.verifyGameViewLoaded.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.UI_OVERVIEW, this.verifyUIExplored.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.LEFT_PANEL_INTRO, this.verifyLeftPanelViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.CENTER_PANEL_INTRO, this.verifyCenterPanelViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.RIGHT_PANEL_INTRO, this.verifyRightPanelViewed.bind(this));

    // Colony management completion checkers
    this.completionCheckers.set(TUTORIAL_STEPS.COLONY_STATS, this.verifyStatsViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.RESOURCE_OVERVIEW, this.verifyResourcesViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.ANT_ROLES_INTRO, this.verifyRolesIntroViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.ASSIGN_WORKER, this.verifyWorkerAssigned.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.ASSIGN_SCOUT, this.verifyScoutAssigned.bind(this));

    // Simulation completion checkers
    this.completionCheckers.set(TUTORIAL_STEPS.ZOOM_CONTROLS, this.verifyZoomUsed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.ANT_MOVEMENT, this.verifyAntMovementObserved.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.FORAGING_BASICS, this.verifyForagingStarted.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.RESOURCE_COLLECTION, this.verifyResourceCollected.bind(this));

    // Advanced features completion checkers
    this.completionCheckers.set(TUTORIAL_STEPS.EVOLUTION_TREE, this.verifyEvolutionTreeViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.RESOURCE_MANAGEMENT, this.verifyResourceManagementUsed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.BUILDING_INTRO, this.verifyBuildingIntroViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.PLACE_STRUCTURE, this.verifyStructurePlaced.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.STRUCTURE_BENEFITS, this.verifyStructureBenefitsViewed.bind(this));

    // Combat completion checkers
    this.completionCheckers.set(TUTORIAL_STEPS.BATTLE_INTRO, this.verifyBattleIntroViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.DEFENSE_BASICS, this.verifyDefenseBasicsViewed.bind(this));
    this.completionCheckers.set(TUTORIAL_STEPS.ATTACK_TUTORIAL, this.verifyAttackCompleted.bind(this));

    // Completion checker
    this.completionCheckers.set(TUTORIAL_STEPS.TUTORIAL_COMPLETE, () => true);
  }

  /**
   * Initialize event listeners for detecting user actions
   */
  initializeEventListeners() {
    // Track user activity for contextual help
    this.trackUserActivity();

    // Colony creation events
    this.addEventListener('colony:creation-started', () => {
      this.markStepCompleted(TUTORIAL_STEPS.COLONY_CREATION);
    });

    this.addEventListener('colony:name-changed', () => {
      this.markStepCompleted(TUTORIAL_STEPS.COLONY_NAMING);
    });

    this.addEventListener('colony:attributes-selected', () => {
      this.markStepCompleted(TUTORIAL_STEPS.COLONY_ATTRIBUTES);
    });

    this.addEventListener('colony:created', () => {
      this.markStepCompleted(TUTORIAL_STEPS.COLONY_CONFIRM);
    });

    // UI interaction events
    this.addEventListener('ui:game-view-loaded', () => {
      this.markStepCompleted(TUTORIAL_STEPS.FIRST_VIEW);
    });

    this.addEventListener('ui:panel-clicked', (event) => {
      const { panel } = event.detail || {};
      if (panel === 'left') this.markStepCompleted(TUTORIAL_STEPS.LEFT_PANEL_INTRO);
      if (panel === 'center') this.markStepCompleted(TUTORIAL_STEPS.CENTER_PANEL_INTRO);
      if (panel === 'right') this.markStepCompleted(TUTORIAL_STEPS.RIGHT_PANEL_INTRO);
    });

    // Ant management events
    this.addEventListener('ant:role-assigned', (event) => {
      const { role } = event.detail || {};
      if (role === 'worker') this.markStepCompleted(TUTORIAL_STEPS.ASSIGN_WORKER);
      if (role === 'scout') this.markStepCompleted(TUTORIAL_STEPS.ASSIGN_SCOUT);
    });

    // Simulation events
    this.addEventListener('simulation:zoom-changed', () => {
      this.markStepCompleted(TUTORIAL_STEPS.ZOOM_CONTROLS);
    });

    this.addEventListener('ant:movement-detected', () => {
      this.markStepCompleted(TUTORIAL_STEPS.ANT_MOVEMENT);
    });

    this.addEventListener('foraging:started', () => {
      this.markStepCompleted(TUTORIAL_STEPS.FORAGING_BASICS);
    });

    this.addEventListener('resource:collected', () => {
      this.markStepCompleted(TUTORIAL_STEPS.RESOURCE_COLLECTION);
    });

    // Evolution and building events
    this.addEventListener('evolution:tree-viewed', () => {
      this.markStepCompleted(TUTORIAL_STEPS.EVOLUTION_TREE);
    });

    this.addEventListener('structure:placed', () => {
      this.markStepCompleted(TUTORIAL_STEPS.PLACE_STRUCTURE);
    });

    // Battle events
    this.addEventListener('battle:first-attack', () => {
      this.markStepCompleted(TUTORIAL_STEPS.ATTACK_TUTORIAL);
    });
  }

  /**
   * Initialize contextual help triggers
   */
  initializeContextualHelp() {
    // Help triggers based on user inactivity or confusion
    this.contextualHelp.set('colony-creation-help', {
      trigger: () => this.isUserInactive(30000) && this.getCurrentStep() === TUTORIAL_STEPS.COLONY_CREATION,
      message: "Need help creating your colony? Click on the colony creation form to get started!",
      action: () => this.highlightElement('#colony-creation-form')
    });

    this.contextualHelp.set('ant-assignment-help', {
      trigger: () => this.isUserInactive(45000) && this.getCurrentStep() === TUTORIAL_STEPS.ASSIGN_WORKER,
      message: "Try assigning some ants to the worker role by dragging them or using the assignment buttons.",
      action: () => this.highlightElement('#ant-assignments')
    });

    this.contextualHelp.set('resource-foraging-help', {
      trigger: () => this.isUserInactive(60000) && this.getCurrentStep() === TUTORIAL_STEPS.FORAGING_BASICS,
      message: "Watch your ants in the simulation view - they should start foraging for food automatically!",
      action: () => this.highlightElement('#simulation-view')
    });

    this.contextualHelp.set('evolution-tree-help', {
      trigger: () => this.isUserInactive(30000) && this.getCurrentStep() === TUTORIAL_STEPS.EVOLUTION_TREE,
      message: "Click on the evolution tree panel to explore upgrade options for your colony.",
      action: () => this.highlightElement('#evolution-tree')
    });
  }

  // ===== COMPLETION CHECKER METHODS =====

  verifyColonyCreationStarted() {
    return document.querySelector('#colony-creation-form') !== null;
  }

  verifyColonyNamed() {
    const nameInput = document.querySelector('input[name="colonyName"]');
    return nameInput && nameInput.value.length > 0;
  }

  verifyAttributesSelected() {
    const attributeInputs = document.querySelectorAll('input[name^="attribute"]');
    return Array.from(attributeInputs).some(input => input.checked || input.value);
  }

  verifyColonyCreated() {
    // Check if colony data exists in localStorage or if redirect to game occurred
    return localStorage.getItem('currentColony') !== null || 
           window.location.pathname.includes('/game');
  }

  verifyGameViewLoaded() {
    return document.querySelector('#game-layout') !== null;
  }

  verifyUIExplored() {
    // Check if user has interacted with multiple panels
    const interactions = parseInt(localStorage.getItem('tutorial-ui-interactions') || '0');
    return interactions >= 3;
  }

  verifyLeftPanelViewed() {
    return document.querySelector('#left-panel') !== null;
  }

  verifyCenterPanelViewed() {
    return document.querySelector('#center-panel') !== null;
  }

  verifyRightPanelViewed() {
    return document.querySelector('#right-panel') !== null;
  }

  verifyStatsViewed() {
    return document.querySelector('#colony-stats') !== null;
  }

  verifyResourcesViewed() {
    return document.querySelector('#resource-overview') !== null;
  }

  verifyRolesIntroViewed() {
    return document.querySelector('#ant-assignments') !== null;
  }

  verifyWorkerAssigned() {
    // Check if any ants have been assigned worker role
    const assignmentData = localStorage.getItem('ant-assignments');
    if (assignmentData) {
      const assignments = JSON.parse(assignmentData);
      return assignments.some(assignment => assignment.role === 'worker');
    }
    return false;
  }

  verifyScoutAssigned() {
    // Check if any ants have been assigned scout role
    const assignmentData = localStorage.getItem('ant-assignments');
    if (assignmentData) {
      const assignments = JSON.parse(assignmentData);
      return assignments.some(assignment => assignment.role === 'scout');
    }
    return false;
  }

  verifyZoomUsed() {
    // Check if zoom controls have been used
    return localStorage.getItem('tutorial-zoom-used') === 'true';
  }

  verifyAntMovementObserved() {
    // Check if simulation has been running for a minimum time
    const simulationStart = localStorage.getItem('simulation-start-time');
    if (simulationStart) {
      return Date.now() - parseInt(simulationStart) > 30000; // 30 seconds
    }
    return false;
  }

  verifyForagingStarted() {
    // Check if foraging events have been logged
    return localStorage.getItem('tutorial-foraging-started') === 'true';
  }

  verifyResourceCollected() {
    // Check if resources have been collected
    return localStorage.getItem('tutorial-resource-collected') === 'true';
  }

  verifyEvolutionTreeViewed() {
    return document.querySelector('#evolution-tree') !== null;
  }

  verifyResourceManagementUsed() {
    return localStorage.getItem('tutorial-resource-management-used') === 'true';
  }

  verifyBuildingIntroViewed() {
    return document.querySelector('#building-panel') !== null;
  }

  verifyStructurePlaced() {
    return localStorage.getItem('tutorial-structure-placed') === 'true';
  }

  verifyStructureBenefitsViewed() {
    return localStorage.getItem('tutorial-structure-benefits-viewed') === 'true';
  }

  verifyBattleIntroViewed() {
    return document.querySelector('#battle-controls') !== null;
  }

  verifyDefenseBasicsViewed() {
    return localStorage.getItem('tutorial-defense-basics-viewed') === 'true';
  }

  verifyAttackCompleted() {
    return localStorage.getItem('tutorial-attack-completed') === 'true';
  }

  // ===== FLOW CONTROL METHODS =====

  /**
   * Check if a tutorial step can be completed
   */
  canCompleteStep(step) {
    const checker = this.completionCheckers.get(step);
    return checker ? checker() : false;
  }

  /**
   * Get the next logical step based on current game state
   */
  getNextStep(currentStep) {
    const allSteps = Object.values(TUTORIAL_STEPS);
    const currentIndex = allSteps.indexOf(currentStep);
    
    if (currentIndex === -1 || currentIndex >= allSteps.length - 1) {
      return null;
    }

    // Check if current step is completed
    if (!this.canCompleteStep(currentStep)) {
      return currentStep; // Stay on current step
    }

    // Return next step
    return allSteps[currentIndex + 1];
  }

  /**
   * Get optimal step sequence based on user's game state
   */
  getOptimalSequence(fromStep = TUTORIAL_STEPS.WELCOME) {
    const sequence = [];
    const allSteps = Object.values(TUTORIAL_STEPS);
    const startIndex = allSteps.indexOf(fromStep);

    for (let i = startIndex; i < allSteps.length; i++) {
      const step = allSteps[i];
      sequence.push({
        step,
        isCompleted: this.canCompleteStep(step),
        group: this.getStepGroup(step),
        estimatedTime: this.getStepEstimatedTime(step)
      });
    }

    return sequence;
  }

  /**
   * Determine if user should skip to a different tutorial section
   */
  shouldSkipSection(currentStep) {
    // Skip colony creation if already created
    if (TUTORIAL_GROUPS.SETUP.includes(currentStep) && this.verifyColonyCreated()) {
      return TUTORIAL_STEPS.FIRST_VIEW;
    }

    // Skip UI basics if user has already explored
    if (TUTORIAL_GROUPS.UI_BASICS.includes(currentStep) && this.verifyUIExplored()) {
      return TUTORIAL_STEPS.COLONY_STATS;
    }

    // Skip role assignment if already done
    if (currentStep === TUTORIAL_STEPS.ASSIGN_WORKER && this.verifyWorkerAssigned()) {
      return TUTORIAL_STEPS.ASSIGN_SCOUT;
    }

    return null;
  }

  // ===== UTILITY METHODS =====

  getStepGroup(step) {
    for (const [groupName, steps] of Object.entries(TUTORIAL_GROUPS)) {
      if (steps.includes(step)) {
        return groupName;
      }
    }
    return null;
  }

  getStepEstimatedTime(step) {
    const timeEstimates = {
      [TUTORIAL_STEPS.WELCOME]: 30,
      [TUTORIAL_STEPS.COLONY_CREATION]: 120,
      [TUTORIAL_STEPS.COLONY_NAMING]: 60,
      [TUTORIAL_STEPS.COLONY_ATTRIBUTES]: 90,
      [TUTORIAL_STEPS.COLONY_CONFIRM]: 30,
      [TUTORIAL_STEPS.FIRST_VIEW]: 45,
      [TUTORIAL_STEPS.UI_OVERVIEW]: 90,
      [TUTORIAL_STEPS.LEFT_PANEL_INTRO]: 60,
      [TUTORIAL_STEPS.CENTER_PANEL_INTRO]: 60,
      [TUTORIAL_STEPS.RIGHT_PANEL_INTRO]: 60,
      [TUTORIAL_STEPS.COLONY_STATS]: 75,
      [TUTORIAL_STEPS.RESOURCE_OVERVIEW]: 75,
      [TUTORIAL_STEPS.ANT_ROLES_INTRO]: 90,
      [TUTORIAL_STEPS.ASSIGN_WORKER]: 120,
      [TUTORIAL_STEPS.ASSIGN_SCOUT]: 90,
      [TUTORIAL_STEPS.ZOOM_CONTROLS]: 45,
      [TUTORIAL_STEPS.ANT_MOVEMENT]: 90,
      [TUTORIAL_STEPS.FORAGING_BASICS]: 120,
      [TUTORIAL_STEPS.RESOURCE_COLLECTION]: 90,
      [TUTORIAL_STEPS.EVOLUTION_TREE]: 120,
      [TUTORIAL_STEPS.RESOURCE_MANAGEMENT]: 90,
      [TUTORIAL_STEPS.BUILDING_INTRO]: 90,
      [TUTORIAL_STEPS.PLACE_STRUCTURE]: 150,
      [TUTORIAL_STEPS.STRUCTURE_BENEFITS]: 75,
      [TUTORIAL_STEPS.BATTLE_INTRO]: 90,
      [TUTORIAL_STEPS.DEFENSE_BASICS]: 120,
      [TUTORIAL_STEPS.ATTACK_TUTORIAL]: 180,
      [TUTORIAL_STEPS.TUTORIAL_COMPLETE]: 30
    };

    return timeEstimates[step] || 60; // Default 60 seconds
  }

  getCurrentStep() {
    // This would be connected to the tutorial context
    return localStorage.getItem('current-tutorial-step');
  }

  markStepCompleted(step) {
    // Emit event for tutorial context to handle
    window.dispatchEvent(new CustomEvent('tutorial:step-completed', {
      detail: { step }
    }));
  }

  // ===== EVENT MANAGEMENT =====

  addEventListener(eventName, handler) {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName).push(handler);
    window.addEventListener(eventName, handler);
  }

  removeEventListener(eventName, handler) {
    window.removeEventListener(eventName, handler);
    const handlers = this.eventListeners.get(eventName) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  // ===== CONTEXTUAL HELP =====

  trackUserActivity() {
    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.lastAction = Date.now();
      }, { passive: true });
    });

    // Check for contextual help triggers every 5 seconds
    setInterval(() => {
      this.checkContextualHelp();
    }, 5000);
  }

  isUserInactive(ms) {
    return Date.now() - this.lastAction > ms;
  }

  checkContextualHelp() {
    for (const [id, helpConfig] of this.contextualHelp) {
      if (helpConfig.trigger()) {
        this.showContextualHelp(id, helpConfig);
        break; // Only show one help at a time
      }
    }
  }

  showContextualHelp(id, config) {
    // Emit event for UI to handle
    window.dispatchEvent(new CustomEvent('tutorial:contextual-help', {
      detail: {
        id,
        message: config.message,
        action: config.action
      }
    }));
  }

  highlightElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('tutorial-highlight');
      setTimeout(() => {
        element.classList.remove('tutorial-highlight');
      }, 3000);
    }
  }

  // ===== PUBLIC API =====

  /**
   * Initialize the tutorial controller
   */
  initialize() {
    console.log('🎓 Tutorial Controller initialized');
    
    // Add CSS for highlighting
    this.addHighlightStyles();
    
    return this;
  }

  addHighlightStyles() {
    if (!document.querySelector('#tutorial-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'tutorial-highlight-styles';
      style.textContent = `
        .tutorial-highlight {
          animation: tutorial-pulse 2s ease-in-out infinite;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
          border-radius: 4px !important;
          position: relative;
          z-index: 1000;
        }
        
        @keyframes tutorial-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Clean up event listeners
   */
  cleanup() {
    for (const [eventName, handlers] of this.eventListeners) {
      handlers.forEach(handler => {
        window.removeEventListener(eventName, handler);
      });
    }
    this.eventListeners.clear();

    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
    }
  }
}

// Export singleton instance
export default new TutorialController(); 
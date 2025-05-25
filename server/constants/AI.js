/**
 * AI Constants for Antopolis
 * Shared constants used across AI systems
 */

// AI Colony states
const AI_STATES = {
  GATHERING: 'gathering',
  DEFENDING: 'defending', 
  ATTACKING: 'attacking',
  GROWING: 'growing',
  EXPLORING: 'exploring',
  IDLE: 'idle'
};

// Personality traits that affect AI behavior
const PERSONALITY_TRAITS = {
  AGGRESSIVE: 'aggressive',     // Attacks more frequently
  DEFENSIVE: 'defensive',       // Focuses on defense and growth
  EXPANSIONIST: 'expansionist', // Prioritizes territory expansion
  OPPORTUNIST: 'opportunist',   // Adapts based on circumstances
  MILITANT: 'militant',         // Military-focused approach
  BUILDER: 'builder'            // Infrastructure and development focused
};

module.exports = {
  AI_STATES,
  PERSONALITY_TRAITS
}; 
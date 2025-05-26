import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getEvolutionEffects } from '../../data/antVisualConfig';

/**
 * AntEvolutionVisuals - Visual effects for ant evolution and upgrades
 * Part of Task 15.3: Develop Ant Evolution and Upgrade Visuals
 */
const AntEvolutionVisuals = ({ 
  ant, 
  showEvolutionAnimation = false,
  showUpgradeEffects = true,
  onEvolutionComplete,
  size = 'medium'
}) => {
  const [isEvolving, setIsEvolving] = useState(showEvolutionAnimation);
  const [currentStage, setCurrentStage] = useState(ant.level || 1);
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);

  const evolutionEffects = getEvolutionEffects(ant.level || 1);
  
  useEffect(() => {
    if (showEvolutionAnimation) {
      setIsEvolving(true);
      // Evolution animation sequence
      setTimeout(() => {
        setCurrentStage(ant.level || 1);
        setIsEvolving(false);
        setShowLevelUpEffect(true);
        setTimeout(() => setShowLevelUpEffect(false), 3000);
        onEvolutionComplete && onEvolutionComplete();
      }, 2000);
    }
  }, [showEvolutionAnimation, ant.level, onEvolutionComplete]);

  return (
    <div className="relative">
      {/* Base Ant with Evolution Effects */}
      <div className="relative">
        {/* Evolution Stage Visual Effects */}
        <EvolutionStageEffects 
          stage={currentStage} 
          effects={evolutionEffects}
          size={size}
        />
        
        {/* Level Progression Indicators */}
        <LevelProgressionIndicator 
          level={ant.level || 1}
          experience={ant.experience || 0}
          experienceToNext={ant.experienceToNext || 100}
          size={size}
        />
        
        {/* Skill/Ability Indicators */}
        {ant.skills && (
          <SkillUpgradeIndicators 
            skills={ant.skills}
            size={size}
          />
        )}
      </div>

      {/* Evolution Animation Overlay */}
      <AnimatePresence>
        {isEvolving && (
          <EvolutionAnimation 
            fromLevel={currentStage - 1} 
            toLevel={currentStage}
            size={size}
          />
        )}
      </AnimatePresence>

      {/* Level Up Effect */}
      <AnimatePresence>
        {showLevelUpEffect && (
          <LevelUpEffect 
            level={ant.level || 1}
            size={size}
          />
        )}
      </AnimatePresence>

      {/* Upgrade Indicators */}
      {showUpgradeEffects && (
        <UpgradeEffects 
          ant={ant}
          size={size}
        />
      )}
    </div>
  );
};

/**
 * EvolutionStageEffects - Visual effects based on evolution stage
 */
const EvolutionStageEffects = ({ stage, effects, size }) => {
  const sizeMultiplier = {
    small: 0.7,
    medium: 1.0,
    large: 1.3
  };

  const scale = sizeMultiplier[size];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Aura Effects */}
      {effects.effects.includes('subtle-glow') && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 ${8 * scale}px rgba(59, 130, 246, 0.3)`,
            transform: `scale(${1.1 * scale})`
          }}
          animate={{ 
            boxShadow: [
              `0 0 ${8 * scale}px rgba(59, 130, 246, 0.3)`,
              `0 0 ${12 * scale}px rgba(59, 130, 246, 0.4)`,
              `0 0 ${8 * scale}px rgba(59, 130, 246, 0.3)`
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {effects.effects.includes('glow') && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 ${15 * scale}px rgba(59, 130, 246, 0.5)`,
            transform: `scale(${1.2 * scale})`
          }}
          animate={{ 
            boxShadow: [
              `0 0 ${15 * scale}px rgba(59, 130, 246, 0.5)`,
              `0 0 ${20 * scale}px rgba(59, 130, 246, 0.6)`,
              `0 0 ${15 * scale}px rgba(59, 130, 246, 0.5)`
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {effects.effects.includes('legendary-aura') && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.3) 0%, 
              rgba(147, 51, 234, 0.2) 50%, 
              rgba(236, 72, 153, 0.1) 100%)`,
            transform: `scale(${1.5 * scale})`
          }}
          animate={{ 
            rotate: [0, 360],
            scale: [1.5 * scale, 1.6 * scale, 1.5 * scale]
          }}
          transition={{ 
            rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
            scale: { duration: 4, repeat: Infinity }
          }}
        />
      )}

      {/* Power Emanation Particles */}
      {effects.effects.includes('power-emanation') && (
        <PowerParticles scale={scale} />
      )}
    </div>
  );
};

/**
 * LevelProgressionIndicator - Shows level and experience progression
 */
const LevelProgressionIndicator = ({ level, experience, experienceToNext, size }) => {
  const progress = (experience / experienceToNext) * 100;
  
  const sizeConfig = {
    small: { width: 32, height: 4, text: 'text-xs' },
    medium: { width: 48, height: 6, text: 'text-sm' },
    large: { width: 64, height: 8, text: 'text-base' }
  };

  const config = sizeConfig[size];

  return (
    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
      {/* Level Badge */}
      <div className="flex items-center justify-center mb-1">
        <motion.div
          className={`
            bg-blue-500 text-white rounded-full px-2 py-1 ${config.text} font-bold
            shadow-lg border-2 border-white
          `}
          whileHover={{ scale: 1.1 }}
          animate={{ 
            boxShadow: level >= 5 ? [
              '0 0 0 0 rgba(59, 130, 246, 0.7)',
              '0 0 0 10px rgba(59, 130, 246, 0)',
            ] : undefined
          }}
          transition={{ duration: 2, repeat: level >= 5 ? Infinity : 0 }}
        >
          Lv.{level}
        </motion.div>
      </div>

      {/* Experience Progress Bar */}
      <div 
        className="bg-gray-300 rounded-full overflow-hidden"
        style={{ width: config.width, height: config.height }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-blue-400 to-purple-500 relative"
          style={{ width: `${progress}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
        >
          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        </motion.div>
      </div>
    </div>
  );
};

/**
 * SkillUpgradeIndicators - Shows skill levels and recent upgrades
 */
const SkillUpgradeIndicators = ({ skills, size }) => {
  const sizeConfig = {
    small: { iconSize: 12, spacing: 1 },
    medium: { iconSize: 16, spacing: 2 },
    large: { iconSize: 20, spacing: 3 }
  };

  const config = sizeConfig[size];

  const skillIcons = {
    strength: '💪',
    speed: '⚡',
    intelligence: '🧠',
    endurance: '🛡️',
    stealth: '👤',
    leadership: '👑'
  };

  return (
    <div 
      className={`absolute -right-8 top-0 flex flex-col gap-${config.spacing}`}
    >
      {Object.entries(skills).map(([skillName, skillLevel]) => (
        <SkillIndicator
          key={skillName}
          skill={skillName}
          level={skillLevel}
          icon={skillIcons[skillName] || '⭐'}
          size={config.iconSize}
        />
      ))}
    </div>
  );
};

/**
 * SkillIndicator - Individual skill level indicator
 */
const SkillIndicator = ({ skill, level, icon, size }) => {
  return (
    <motion.div
      className="relative"
      whileHover={{ scale: 1.2 }}
      title={`${skill}: Level ${level}`}
    >
      <div
        className="bg-white rounded-full border-2 border-gray-300 flex items-center justify-center shadow-sm"
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.6 }}>{icon}</span>
      </div>
      
      {/* Skill Level Dots */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
        {Array.from({ length: Math.min(level, 5) }, (_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full ${
              i < level ? 'bg-yellow-400' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
};

/**
 * EvolutionAnimation - Full evolution transformation effect
 */
const EvolutionAnimation = ({ fromLevel, toLevel, size }) => {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Energy Spiral */}
      <motion.div
        className="absolute inset-0 rounded-full border-4 border-blue-400"
        style={{ transform: 'scale(1.5)' }}
        animate={{ 
          rotate: [0, 720],
          scale: [1.5, 2, 1.5],
          borderColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(59, 130, 246, 0.8)'
          ]
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      {/* Light Burst */}
      <motion.div
        className="absolute inset-0 bg-white rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 3, 0],
          opacity: [0, 0.8, 0]
        }}
        transition={{ duration: 0.5, delay: 1 }}
      />

      {/* Evolution Text */}
      <motion.div
        className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          Evolving to Level {toLevel}!
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * LevelUpEffect - Celebration effect for level ups
 */
const LevelUpEffect = ({ level, size }) => {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Celebration Stars */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400 text-lg"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            x: Math.cos(i * Math.PI / 4) * 40,
            y: Math.sin(i * Math.PI / 4) * 40,
            rotate: [0, 360],
            opacity: [1, 0]
          }}
          transition={{ duration: 2, ease: 'easeOut' }}
        >
          ⭐
        </motion.div>
      ))}

      {/* Level Up Text */}
      <motion.div
        className="absolute -top-12 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <div className="bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          Level Up! 🎉
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * UpgradeEffects - Shows recent upgrades and enhancements
 */
const UpgradeEffects = ({ ant, size }) => {
  if (!ant.recentUpgrades?.length) return null;

  return (
    <div className="absolute -left-8 top-0">
      {ant.recentUpgrades.map((upgrade, index) => (
        <motion.div
          key={`${upgrade.type}-${index}`}
          className="mb-1 flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ delay: index * 0.2 }}
        >
          <span>⬆️</span>
          <span>{upgrade.name}</span>
        </motion.div>
      ))}
    </div>
  );
};

/**
 * PowerParticles - Floating power particles for high-level ants
 */
const PowerParticles = ({ scale }) => {
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    size: (Math.random() * 3 + 2) * scale,
    color: ['rgba(59, 130, 246, 0.6)', 'rgba(147, 51, 234, 0.6)', 'rgba(236, 72, 153, 0.6)'][i % 3]
  }));

  return (
    <>
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            left: '50%',
            top: '50%'
          }}
          animate={{
            x: [0, Math.cos(particle.id * Math.PI / 3) * 30 * scale],
            y: [0, Math.sin(particle.id * Math.PI / 3) * 30 * scale],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut'
          }}
        />
      ))}
    </>
  );
};

export default AntEvolutionVisuals; 
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
// SOUND EFFECTS (Web Audio API - no external files)
// ============================================================
const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
let audioCtx = null;

const getAudioCtx = () => {
  if (!audioCtx && AudioCtx) {
    audioCtx = new AudioCtx();
  }
  return audioCtx;
};

const SFX = {
  swordSlash: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    // White noise burst filtered to sound like a slash
    const duration = 0.15;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    source.connect(hp).connect(gain).connect(ctx.destination);
    source.start();
  },

  hit: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  },

  damage: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  },

  clash: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    // Metallic clash - two detuned oscillators
    [600, 900].forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    });
  },

  miss: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    // Whoosh - filtered noise
    const duration = 0.25;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.3;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    source.connect(bp).connect(gain).connect(ctx.destination);
    source.start();
  },

  select: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },

  gameOver: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.2 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.3);
    });
  },

  victory: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const notes = [400, 500, 600, 800];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  },

  timeout: () => {
    const ctx = getAudioCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  },
};

// ============================================================
// COLOR CONSTANTS
// ============================================================
const COLORS = {
  steel: '#8a8e94',
  steelLight: '#b0b5bc',
  steelDark: '#4a4e54',
  steelHighlight: '#d4d8de',
  leather: '#5c3a1e',
  leatherDark: '#3a2210',
  chainmail: '#6e7278',
  tabard: '#8b1a1a',
  tabardDark: '#5c0e0e',
  gold: '#c9a84c',
  goldDark: '#8a7030',
  weapon: '#c0c0c0',
  weaponEdge: '#404040',
  skin: '#c9a882',
  skinShadow: '#a07850',
  cape: '#2a1520',
  blood: '#660000',
};

// ============================================================
// DIFFICULTY CONFIGS
// ============================================================
const DIFFICULTY_CONFIGS = {
  easy: {
    label: 'Easy',
    description: 'Simple arithmetic. Quick reflexes needed.',
    botAccuracy: 0.55,
    questionTimeLimit: 5000,
    clashWindow: 500,
    botDelayMin: 1000,
    botDelayRange: 1500,
    damage: 12,
    botDamage: 12,
    timeoutDamage: 15,
    types: ['add', 'subtract'],
    numberRange: { add: [8, 30], subtract: [10, 35], multiply: [2, 6], divide: [2, 5], percent: [10, 50] },
  },
  medium: {
    label: 'Medium',
    description: 'Mixed operations. Balanced challenge.',
    botAccuracy: 0.6,
    questionTimeLimit: 4000,
    clashWindow: 500,
    botDelayMin: 500,
    botDelayRange: 2200,
    damage: 15,
    botDamage: 15,
    timeoutDamage: 20,
    types: ['add', 'subtract', 'multiply', 'divide'],
    numberRange: { add: [10, 50], subtract: [15, 50], multiply: [2, 12], divide: [2, 10], percent: [10, 75] },
  },
  hard: {
    label: 'Hard',
    description: 'All types + percentages. Ruthless bot.',
    botAccuracy: 0.85,
    questionTimeLimit: 3000,
    clashWindow: 350,
    botDelayMin: 300,
    botDelayRange: 1200,
    damage: 20,
    botDamage: 20,
    timeoutDamage: 30,
    types: ['add', 'subtract', 'multiply', 'divide', 'percentage'],
    numberRange: { add: [20, 80], subtract: [30, 70], multiply: [3, 15], divide: [2, 12], percent: [10, 200] },
  },
};

// ============================================================
// ZONE CONFIGS: 6 attack directions with weapon + transform data
// ============================================================
const ZONE_CONFIGS = [
  { weapon: 'trident',  label: 'Halberd',    torsoRotate: 0,   torsoY: -8,  armAngle: -160, shieldAngle: -20,  leanX: 0,   leanY: -10 },
  { weapon: 'mace',     label: 'Mace',       torsoRotate: 25,  torsoY: -4,  armAngle: -130, shieldAngle: -50,  leanX: 10,  leanY: -8 },
  { weapon: 'sword',    label: 'Sword',      torsoRotate: 35,  torsoY: 2,   armAngle: -80,  shieldAngle: -100, leanX: 12,  leanY: 4 },
  { weapon: 'flail',    label: 'Flail',      torsoRotate: 0,   torsoY: 8,   armAngle: -20,  shieldAngle: -160, leanX: 0,   leanY: 10 },
  { weapon: 'bow',      label: 'Crossbow',   torsoRotate: -35, torsoY: 2,   armAngle: -100, shieldAngle: -80,  leanX: -12, leanY: 4 },
  { weapon: 'club',     label: 'Warhammer',  torsoRotate: -25, torsoY: -4,  armAngle: -50,  shieldAngle: -130, leanX: -10, leanY: -8 },
];

// ============================================================
// CSS KEYFRAMES (injected via <style>)
// ============================================================
const GAME_STYLES = `
  @keyframes breathe {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(3px); }
  }
  @keyframes attackLunge {
    0% { transform: scale(1) translateY(0); opacity: 0.7; }
    40% { transform: scale(1.25) translateY(-15px); opacity: 1; }
    100% { transform: scale(1.1) translateY(-5px); opacity: 0.9; }
  }
  @keyframes recoilFlinch {
    0% { transform: scale(1) translateY(0); }
    30% { transform: scale(0.8) translateY(20px) rotate(-5deg); }
    100% { transform: scale(0.95) translateY(10px); }
  }
  @keyframes clashShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
  }
  @keyframes missSwing {
    0% { transform: scale(1) rotate(0deg) translateX(0); opacity: 0.85; }
    20% { transform: scale(1.1) rotate(-8deg) translateX(10px); opacity: 0.9; }
    50% { transform: scale(0.85) rotate(18deg) translateX(-15px); opacity: 0.5; }
    70% { transform: scale(0.9) rotate(-5deg) translateX(8px); opacity: 0.6; }
    100% { transform: scale(1) rotate(0deg) translateX(0); opacity: 0.85; }
  }
  @keyframes sparkBurst {
    0% { opacity: 1; transform: scale(0); }
    50% { opacity: 1; transform: scale(1.5); }
    100% { opacity: 0; transform: scale(2.5); }
  }
  @keyframes damageFlash {
    0%, 100% { opacity: 0; }
    30% { opacity: 0.5; }
    60% { opacity: 0.3; }
  }
  @keyframes screenShake {
    0%, 100% { transform: translate(0, 0); }
    10% { transform: translate(-4px, -2px); }
    20% { transform: translate(4px, 2px); }
    30% { transform: translate(-3px, 3px); }
    40% { transform: translate(3px, -3px); }
    50% { transform: translate(-2px, 2px); }
  }
  @keyframes slashLine {
    0% { stroke-dashoffset: 200; opacity: 1; }
    60% { stroke-dashoffset: 0; opacity: 1; }
    100% { stroke-dashoffset: 0; opacity: 0; }
  }
  @keyframes fireFlicker {
    0%, 100% { opacity: 0.6; transform: scaleY(1); }
    50% { opacity: 1; transform: scaleY(1.2); }
  }
  @keyframes fogDrift {
    0% { transform: translateX(-5%); opacity: 0.3; }
    50% { transform: translateX(5%); opacity: 0.5; }
    100% { transform: translateX(-5%); opacity: 0.3; }
  }
  @keyframes comboGlow {
    0%, 100% { text-shadow: 0 0 10px #ffd700, 0 0 20px #ff8c00; }
    50% { text-shadow: 0 0 20px #ffd700, 0 0 40px #ff8c00, 0 0 60px #ff4500; }
  }
  @keyframes floatUp {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-30px); opacity: 0; }
  }
  .demon-breathe { animation: breathe 3s ease-in-out infinite; }
  .demon-attack { animation: attackLunge 0.6s ease-out forwards; }
  .demon-recoil { animation: recoilFlinch 0.6s ease-out forwards; }
  .demon-clash { animation: clashShake 0.5s ease-out; }
  .demon-miss { animation: missSwing 0.8s ease-in-out; }
  .screen-shake { animation: screenShake 0.4s ease-out; }
  .spark-effect { animation: sparkBurst 0.6s ease-out forwards; }
  .damage-flash { animation: damageFlash 0.5s ease-out; }
  .slash-anim line { animation: slashLine 0.4s ease-out forwards; stroke-dasharray: 200; }
  .fog-layer { animation: fogDrift 8s ease-in-out infinite; }
  .combo-glow { animation: comboGlow 1s ease-in-out infinite; }
`;

// ============================================================
// WEAPON SVG COMPONENTS
// ============================================================
const TridentSVG = ({ x, y, rotate, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
    <rect x="-2" y="0" width="4" height="60" fill={COLORS.weapon} rx="1" />
    <rect x="-2" y="0" width="4" height="60" fill="url(#weaponShine)" rx="1" />
    {/* Center prong */}
    <path d="M 0,-25 L -4,-5 L 4,-5 Z" fill={COLORS.weapon} stroke={COLORS.weaponEdge} strokeWidth="0.5" />
    {/* Left prong */}
    <path d="M -12,-15 L -8,-5 L -3,-5 Z" fill={COLORS.weapon} stroke={COLORS.weaponEdge} strokeWidth="0.5" />
    <line x1="-10" y1="-5" x2="-3" y2="-5" stroke={COLORS.weapon} strokeWidth="2" />
    {/* Right prong */}
    <path d="M 12,-15 L 8,-5 L 3,-5 Z" fill={COLORS.weapon} stroke={COLORS.weaponEdge} strokeWidth="0.5" />
    <line x1="10" y1="-5" x2="3" y2="-5" stroke={COLORS.weapon} strokeWidth="2" />
    {/* Crossbar */}
    <rect x="-14" y="-6" width="28" height="3" fill={COLORS.goldDark} rx="1" />
  </g>
);

const MaceSVG = ({ x, y, rotate, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
    <rect x="-2" y="5" width="4" height="50" fill={COLORS.goldDark} rx="1" />
    <circle cx="0" cy="0" r="10" fill={COLORS.weapon} stroke={COLORS.weaponEdge} strokeWidth="1" />
    {/* Spikes */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
      <line key={a} x1={Math.cos(a * Math.PI / 180) * 8} y1={Math.sin(a * Math.PI / 180) * 8}
            x2={Math.cos(a * Math.PI / 180) * 14} y2={Math.sin(a * Math.PI / 180) * 14}
            stroke={COLORS.weapon} strokeWidth="2" strokeLinecap="round" />
    ))}
    <circle cx="0" cy="0" r="4" fill={COLORS.goldDark} />
  </g>
);

const SwordSVG = ({ x, y, rotate, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
    {/* Blade */}
    <path d="M 0,-35 L -5,5 L 0,10 L 5,5 Z" fill={COLORS.weapon} stroke={COLORS.weaponEdge} strokeWidth="0.5" />
    <line x1="0" y1="-30" x2="0" y2="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    {/* Crossguard */}
    <rect x="-12" y="8" width="24" height="4" fill={COLORS.gold} rx="2" />
    <circle cx="-12" cy="10" r="2" fill={COLORS.gold} />
    <circle cx="12" cy="10" r="2" fill={COLORS.gold} />
    {/* Handle */}
    <rect x="-2" y="12" width="4" height="18" fill={COLORS.tabard} rx="1" />
    {/* Pommel */}
    <circle cx="0" cy="32" r="3" fill={COLORS.gold} />
  </g>
);

const FlailSVG = ({ x, y, rotate, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
    {/* Handle */}
    <rect x="-2" y="10" width="4" height="40" fill={COLORS.leather} rx="1" />
    <rect x="-2.5" y="12" width="5" height="2" fill={COLORS.gold} rx="0.5" />
    <rect x="-2.5" y="20" width="5" height="2" fill={COLORS.gold} rx="0.5" />
    {/* Chain */}
    {[0, 4, 8, 12].map(i => (
      <ellipse key={i} cx={Math.sin(i * 0.3) * 2} cy={-i * 2} rx="2" ry="1.5" fill="none" stroke={COLORS.weapon} strokeWidth="1.2" />
    ))}
    {/* Spiked ball */}
    <circle cx="0" cy="-12" r="8" fill={COLORS.steelDark} stroke={COLORS.weapon} strokeWidth="1" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
      <line key={a} x1={Math.cos(a * Math.PI / 180) * 6 } y1={-12 + Math.sin(a * Math.PI / 180) * 6}
            x2={Math.cos(a * Math.PI / 180) * 12} y2={-12 + Math.sin(a * Math.PI / 180) * 12}
            stroke={COLORS.weapon} strokeWidth="1.5" strokeLinecap="round" />
    ))}
  </g>
);

const BowSVG = ({ x, y, rotate, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
    {/* Bow arc */}
    <path d="M -2,-30 Q -20,0 -2,30" fill="none" stroke={COLORS.goldDark} strokeWidth="3" strokeLinecap="round" />
    <path d="M -2,-30 Q -18,0 -2,30" fill="none" stroke={COLORS.gold} strokeWidth="1" />
    {/* Bowstring */}
    <line x1="-2" y1="-30" x2="-2" y2="30" stroke="#ddd" strokeWidth="0.8" />
    {/* Arrow */}
    <line x1="-2" y1="0" x2="35" y2="0" stroke={COLORS.weapon} strokeWidth="1.5" />
    <path d="M 35,0 L 28,-3 L 28,3 Z" fill={COLORS.weapon} />
    {/* Fletching */}
    <path d="M -2,-3 L -8,-6 L -2,0" fill={COLORS.tabard} />
    <path d="M -2,3 L -8,6 L -2,0" fill={COLORS.tabard} />
  </g>
);

const ClubSVG = ({ x, y, rotate, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotate}) scale(${scale})`}>
    {/* Handle */}
    <rect x="-2.5" y="10" width="5" height="45" fill={COLORS.goldDark} rx="2" />
    {/* Club head */}
    <ellipse cx="0" cy="5" rx="10" ry="14" fill={COLORS.weapon} stroke={COLORS.weaponEdge} strokeWidth="1" />
    <ellipse cx="0" cy="2" rx="6" ry="8" fill="rgba(255,255,255,0.1)" />
    {/* Metal bands */}
    <rect x="-3" y="12" width="6" height="2" fill={COLORS.gold} rx="1" />
    <rect x="-3" y="20" width="6" height="2" fill={COLORS.gold} rx="1" />
  </g>
);

const WEAPON_COMPONENTS = {
  trident: TridentSVG,
  mace: MaceSVG,
  sword: SwordSVG,
  flail: FlailSVG,
  bow: BowSVG,
  club: ClubSVG,
};

// ============================================================
// KNIGHT SVG COMPONENT (Medieval Swordfighter)
// ============================================================
const KnightSVG = ({ zone = 0, pose = 'idle', visible = true }) => {
  if (!visible) return null;

  const config = ZONE_CONFIGS[zone] || ZONE_CONFIGS[0];
  const WeaponComponent = WEAPON_COMPONENTS[config.weapon];

  const poseClass = pose === 'attack' ? 'demon-attack'
    : pose === 'recoil' ? 'demon-recoil'
    : pose === 'clash' ? 'demon-clash'
    : pose === 'miss' ? 'demon-miss'
    : 'demon-breathe';

  const attackTransform = pose === 'attack'
    ? `translate(${config.leanX}, ${config.leanY})`
    : pose === 'recoil' ? 'translate(0, 8)'
    : 'translate(0, 0)';

  return (
    <div style={{ position: 'fixed', top: '42%', left: '50%', transform: 'translate(-50%, -50%)', width: '480px', height: '480px', pointerEvents: 'none', zIndex: 1 }}>
    <svg viewBox="0 0 200 200" className={poseClass}
         style={{ width: '100%', height: '100%', opacity: 0.85, overflow: 'hidden' }}>
      <defs>
        {/* Filters */}
        <filter id="knightShadow">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.5)" />
        </filter>
        <filter id="metalShine">
          <feSpecularLighting surfaceScale="3" specularConstant="0.8" specularExponent="25" result="spec">
            <fePointLight x="120" y="40" z="80" />
          </feSpecularLighting>
          <feComposite in="SourceGraphic" in2="spec" operator="arithmetic" k1="0" k2="1" k3="0.15" k4="0" />
        </filter>
        <filter id="eyeGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        {/* Weapon metallic shine */}
        <linearGradient id="weaponShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        {/* Armor gradient */}
        <linearGradient id="armorGrad" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={COLORS.steelLight} />
          <stop offset="40%" stopColor={COLORS.steel} />
          <stop offset="100%" stopColor={COLORS.steelDark} />
        </linearGradient>
        {/* Chainmail pattern */}
        <pattern id="chainmailPattern" x="0" y="0" width="6" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.8" fill="none" stroke={COLORS.chainmail} strokeWidth="0.4" />
          <circle cx="4.5" cy="1.5" r="1.8" fill="none" stroke={COLORS.chainmail} strokeWidth="0.4" />
          <circle cx="3" cy="3.8" r="1.8" fill="none" stroke={COLORS.chainmail} strokeWidth="0.4" />
          <circle cx="0" cy="3.8" r="1.8" fill="none" stroke={COLORS.chainmail} strokeWidth="0.4" />
          <circle cx="6" cy="3.8" r="1.8" fill="none" stroke={COLORS.chainmail} strokeWidth="0.4" />
        </pattern>
        {/* Dark aura */}
        <radialGradient id="darkAura" cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor="rgba(10,5,15,0)" />
          <stop offset="70%" stopColor="rgba(10,5,15,0.2)" />
          <stop offset="100%" stopColor="rgba(5,0,10,0.4)" />
        </radialGradient>
        {/* Tabard gradient */}
        <linearGradient id="tabardGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.tabard} />
          <stop offset="100%" stopColor={COLORS.tabardDark} />
        </linearGradient>
      </defs>

      {/* Dark aura */}
      <circle cx="100" cy="100" r="95" fill="url(#darkAura)" />

      <g transform={attackTransform} filter="url(#knightShadow)">
        {/* ---- CAPE (behind body) ---- */}
        <g transform="translate(100, 105)">
          <path d="M -25,-12 Q -35,20 -30,60 L 30,60 Q 35,20 25,-12 Z"
                fill={COLORS.cape} opacity="0.6" />
          <path d="M -20,-10 Q -28,15 -25,55" fill="none" stroke="rgba(60,30,50,0.3)" strokeWidth="0.5" />
          <path d="M 20,-10 Q 28,15 25,55" fill="none" stroke="rgba(60,30,50,0.3)" strokeWidth="0.5" />
        </g>

        {/* ---- TORSO ---- */}
        <g transform={`translate(100, 105) rotate(${pose === 'attack' ? config.torsoRotate : 0})`}>
          {/* Chainmail base layer */}
          <path d="M -30,-16 L -36,32 L 36,32 L 30,-16 Z" fill={COLORS.steelDark} />
          <rect x="-36" y="-16" width="72" height="48" fill="url(#chainmailPattern)" opacity="0.5" />

          {/* Breastplate */}
          <path d="M -26,-16 L -30,28 L 30,28 L 26,-16 Z" fill="url(#armorGrad)" stroke={COLORS.steelDark} strokeWidth="0.8" />
          {/* Breastplate center ridge */}
          <line x1="0" y1="-14" x2="0" y2="26" stroke={COLORS.steelHighlight} strokeWidth="0.8" opacity="0.5" />
          {/* Breastplate plate lines */}
          <path d="M -20,-10 Q -4,2 0,8" fill="none" stroke={COLORS.steelDark} strokeWidth="0.4" opacity="0.5" />
          <path d="M 20,-10 Q 4,2 0,8" fill="none" stroke={COLORS.steelDark} strokeWidth="0.4" opacity="0.5" />

          {/* Shoulder pauldrons - large plate armor */}
          <g transform="translate(-32, -10)">
            <ellipse cx="0" cy="0" rx="10" ry="8" fill="url(#armorGrad)" stroke={COLORS.steelDark} strokeWidth="0.8" />
            <path d="M -8,0 Q 0,-8 8,0" fill="none" stroke={COLORS.steelHighlight} strokeWidth="0.5" opacity="0.4" />
            <path d="M -6,3 Q 0,-4 6,3" fill="none" stroke={COLORS.steelHighlight} strokeWidth="0.4" opacity="0.3" />
            {/* Rivets */}
            <circle cx="-5" cy="2" r="1" fill={COLORS.goldDark} />
            <circle cx="5" cy="2" r="1" fill={COLORS.goldDark} />
          </g>
          <g transform="translate(32, -10)">
            <ellipse cx="0" cy="0" rx="10" ry="8" fill="url(#armorGrad)" stroke={COLORS.steelDark} strokeWidth="0.8" />
            <path d="M -8,0 Q 0,-8 8,0" fill="none" stroke={COLORS.steelHighlight} strokeWidth="0.5" opacity="0.4" />
            <path d="M -6,3 Q 0,-4 6,3" fill="none" stroke={COLORS.steelHighlight} strokeWidth="0.4" opacity="0.3" />
            <circle cx="-5" cy="2" r="1" fill={COLORS.goldDark} />
            <circle cx="5" cy="2" r="1" fill={COLORS.goldDark} />
          </g>

          {/* Tabard / surcoat over armor */}
          <path d="M -16,10 L -20,55 L 20,55 L 16,10 Z" fill="url(#tabardGrad)" />
          {/* Tabard emblem - lion/cross */}
          <g transform="translate(0, 28)">
            <line x1="0" y1="-10" x2="0" y2="10" stroke={COLORS.gold} strokeWidth="2" />
            <line x1="-7" y1="0" x2="7" y2="0" stroke={COLORS.gold} strokeWidth="2" />
            <circle cx="0" cy="0" r="3" fill="none" stroke={COLORS.gold} strokeWidth="0.8" />
          </g>

          {/* Belt / fauld */}
          <rect x="-28" y="26" width="56" height="5" fill={COLORS.leather} stroke={COLORS.leatherDark} strokeWidth="0.5" rx="1" />
          <rect x="-3" y="25" width="6" height="7" fill={COLORS.gold} stroke={COLORS.goldDark} strokeWidth="0.5" rx="1" />

          {/* ---- RIGHT ARM (weapon arm) ---- */}
          <g transform={`rotate(${pose === 'attack' ? config.armAngle : -45}, 30, -8)`}>
            {/* Upper arm - plate armor */}
            <rect x="28" y="-14" width="9" height="26" fill="url(#armorGrad)" stroke={COLORS.steelDark} strokeWidth="0.5" rx="3" />
            {/* Elbow cop */}
            <ellipse cx="32" cy="12" rx="6" ry="4" fill={COLORS.steel} stroke={COLORS.steelDark} strokeWidth="0.5" />
            {/* Forearm - vambrace */}
            <rect x="28" y="14" width="9" height="22" fill="url(#armorGrad)" stroke={COLORS.steelDark} strokeWidth="0.5" rx="3" />
            {/* Gauntlet */}
            <rect x="27" y="36" width="11" height="8" fill={COLORS.steel} stroke={COLORS.steelDark} strokeWidth="0.5" rx="2" />
            {/* Gauntlet fingers */}
            <rect x="28" y="44" width="3" height="4" fill={COLORS.steelDark} rx="1" />
            <rect x="31.5" y="44" width="3" height="4" fill={COLORS.steelDark} rx="1" />
            <rect x="35" y="44" width="3" height="3" fill={COLORS.steelDark} rx="1" />
            {/* Weapon */}
            <WeaponComponent x={32} y={52} rotate={0} scale={0.55} />
          </g>

          {/* ---- LEFT ARM (shield arm) ---- */}
          <g transform={`rotate(${pose === 'attack' ? config.shieldAngle : 45}, -30, -8)`}>
            {/* Upper arm */}
            <rect x="-37" y="-14" width="9" height="26" fill="url(#armorGrad)" stroke={COLORS.steelDark} strokeWidth="0.5" rx="3" />
            {/* Elbow cop */}
            <ellipse cx="-32" cy="12" rx="6" ry="4" fill={COLORS.steel} stroke={COLORS.steelDark} strokeWidth="0.5" />
            {/* Forearm */}
            <rect x="-37" y="14" width="9" height="22" fill="url(#armorGrad)" stroke={COLORS.steelDark} strokeWidth="0.5" rx="3" />
            {/* Gauntlet */}
            <rect x="-38" y="36" width="11" height="8" fill={COLORS.steel} stroke={COLORS.steelDark} strokeWidth="0.5" rx="2" />
            {/* Gauntlet fingers */}
            <rect x="-37" y="44" width="3" height="4" fill={COLORS.steelDark} rx="1" />
            <rect x="-33.5" y="44" width="3" height="4" fill={COLORS.steelDark} rx="1" />
            <rect x="-30" y="44" width="3" height="3" fill={COLORS.steelDark} rx="1" />
          </g>
        </g>

        {/* ---- HELMET ---- */}
        <g transform="translate(100, 62)">
          {/* Neck - gorget (throat armor) */}
          <path d="M -10,12 L -12,20 L 12,20 L 10,12 Z" fill={COLORS.steel} stroke={COLORS.steelDark} strokeWidth="0.5" />
          <line x1="-11" y1="16" x2="11" y2="16" stroke={COLORS.steelDark} strokeWidth="0.3" />

          {/* Chainmail aventail (neck protection hanging from helmet) */}
          <path d="M -18,4 Q -20,12 -14,18 L 14,18 Q 20,12 18,4" fill={COLORS.steelDark} opacity="0.6" />
          <rect x="-18" y="4" width="36" height="14" fill="url(#chainmailPattern)" opacity="0.4" />

          {/* Great helm / Bascinet shape */}
          <path d="M -20,6 Q -22,-8 -18,-18 Q -10,-28 0,-30 Q 10,-28 18,-18 Q 22,-8 20,6 L 16,8 Q 0,10 -16,8 Z"
                fill="url(#armorGrad)" stroke={COLORS.steelDark} strokeWidth="0.8" />

          {/* Helmet center ridge */}
          <path d="M 0,-30 Q 1,-15 0,6" fill="none" stroke={COLORS.steelHighlight} strokeWidth="0.8" opacity="0.5" />

          {/* Visor */}
          <path d="M -16,-2 Q -18,-10 -14,-14 Q 0,-18 14,-14 Q 18,-10 16,-2 Q 0,4 -16,-2 Z"
                fill={COLORS.steelDark} stroke={COLORS.steelDark} strokeWidth="0.5" />

          {/* Visor breathing holes */}
          {[-8, -4, 0, 4, 8].map((vx, i) => (
            <ellipse key={i} cx={vx} cy={-2} rx="0.8" ry="2" fill="#1a1a1a" />
          ))}

          {/* Eye slit - menacing */}
          <path d="M -14,-8 L -2,-6 L 0,-7 L 2,-6 L 14,-8" fill="none" stroke="#0a0a0a" strokeWidth="2.5" />
          {/* Eyes glowing through visor slit */}
          <g filter="url(#eyeGlow)">
            <ellipse cx="-8" cy="-7.5" rx="3" ry="1" fill="rgba(200,60,20,0.7)" />
            <ellipse cx="8" cy="-7.5" rx="3" ry="1" fill="rgba(200,60,20,0.7)" />
            <ellipse cx="-8" cy="-7.5" rx="1.5" ry="0.5" fill="rgba(255,120,40,0.9)" />
            <ellipse cx="8" cy="-7.5" rx="1.5" ry="0.5" fill="rgba(255,120,40,0.9)" />
          </g>

          {/* Helmet edge trim */}
          <path d="M -16,-2 Q 0,4 16,-2" fill="none" stroke={COLORS.goldDark} strokeWidth="0.8" />

          {/* Helmet crest / plume */}
          <g transform="translate(0, -28)">
            <path d="M -2,0 Q -4,-12 -1,-22 Q 2,-14 4,-22 Q 6,-12 2,0 Z"
                  fill={COLORS.tabard} stroke={COLORS.tabardDark} strokeWidth="0.3" />
            <path d="M 0,0 Q 1,-10 0,-20" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
          </g>

          {/* Scratches and battle damage on helmet */}
          <line x1="-12" y1="-16" x2="-6" y2="-10" stroke="rgba(80,80,90,0.5)" strokeWidth="0.4" />
          <line x1="8" y1="-20" x2="14" y2="-12" stroke="rgba(80,80,90,0.4)" strokeWidth="0.3" />
          <line x1="-5" y1="2" x2="3" y2="5" stroke="rgba(80,80,90,0.3)" strokeWidth="0.3" />
        </g>
      </g>
    </svg>
    </div>
  );
};

// ============================================================
// BATTLEFIELD BACKGROUND COMPONENT
// ============================================================
const BattlefieldBackground = () => (
  <div className="absolute inset-0">
    {/* Sky gradient - brighter, temple interior feel */}
    <div className="absolute inset-0" style={{
      background: 'linear-gradient(180deg, #1a1028 0%, #2a1838 25%, #1e1530 50%, #252035 75%, #1a1525 100%)'
    }} />

    {/* Background SVG elements - dark temple */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <radialGradient id="torchGlow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,160,40,0.6)" />
          <stop offset="60%" stopColor="rgba(255,120,20,0.2)" />
          <stop offset="100%" stopColor="rgba(255,140,0,0)" />
        </radialGradient>
        <radialGradient id="torchGlow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,160,40,0.5)" />
          <stop offset="60%" stopColor="rgba(255,100,20,0.15)" />
          <stop offset="100%" stopColor="rgba(255,69,0,0)" />
        </radialGradient>
        <radialGradient id="centerAmbient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(100,60,140,0.12)" />
          <stop offset="100%" stopColor="rgba(100,60,140,0)" />
        </radialGradient>
        {/* Stone texture pattern */}
        <pattern id="stoneTexture" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="rgba(50,35,60,0.3)" />
          <line x1="0" y1="4" x2="8" y2="4" stroke="rgba(70,50,80,0.2)" strokeWidth="0.1" />
          <line x1="4" y1="0" x2="4" y2="8" stroke="rgba(70,50,80,0.15)" strokeWidth="0.1" />
        </pattern>
      </defs>

      {/* Stone floor with perspective */}
      <polygon points="0,55 100,55 100,100 0,100" fill="rgba(35,25,45,0.6)" />
      <polygon points="0,55 100,55 100,100 0,100" fill="url(#stoneTexture)" />

      {/* Floor perspective lines */}
      <line x1="50" y1="40" x2="0" y2="100" stroke="rgba(80,55,90,0.2)" strokeWidth="0.12" />
      <line x1="50" y1="40" x2="15" y2="100" stroke="rgba(80,55,90,0.15)" strokeWidth="0.1" />
      <line x1="50" y1="40" x2="35" y2="100" stroke="rgba(80,55,90,0.15)" strokeWidth="0.1" />
      <line x1="50" y1="40" x2="65" y2="100" stroke="rgba(80,55,90,0.15)" strokeWidth="0.1" />
      <line x1="50" y1="40" x2="85" y2="100" stroke="rgba(80,55,90,0.15)" strokeWidth="0.1" />
      <line x1="50" y1="40" x2="100" y2="100" stroke="rgba(80,55,90,0.2)" strokeWidth="0.12" />
      {/* Horizontal floor lines */}
      <line x1="5" y1="65" x2="95" y2="65" stroke="rgba(80,55,90,0.12)" strokeWidth="0.1" />
      <line x1="10" y1="78" x2="90" y2="78" stroke="rgba(80,55,90,0.1)" strokeWidth="0.08" />
      <line x1="15" y1="90" x2="85" y2="90" stroke="rgba(80,55,90,0.08)" strokeWidth="0.08" />

      {/* Temple pillars - left side (brighter, more visible) */}
      <rect x="3" y="10" width="5" height="60" fill="rgba(55,40,65,0.7)" />
      <rect x="3.5" y="10" width="4" height="60" fill="rgba(65,48,75,0.4)" />
      {/* Pillar capital */}
      <rect x="1" y="8" width="9" height="3" fill="rgba(60,45,70,0.7)" rx="0.5" />
      <rect x="1.5" y="6" width="8" height="3" fill="rgba(55,40,65,0.6)" rx="0.5" />
      {/* Pillar base */}
      <rect x="1" y="68" width="9" height="3" fill="rgba(60,45,70,0.7)" rx="0.5" />

      <rect x="13" y="18" width="4" height="52" fill="rgba(50,35,60,0.5)" />
      <rect x="11.5" y="16" width="7" height="3" fill="rgba(55,40,65,0.5)" rx="0.5" />

      {/* Temple pillars - right side */}
      <rect x="92" y="12" width="5" height="58" fill="rgba(55,40,65,0.7)" />
      <rect x="92.5" y="12" width="4" height="58" fill="rgba(65,48,75,0.4)" />
      <rect x="90" y="10" width="9" height="3" fill="rgba(60,45,70,0.7)" rx="0.5" />
      <rect x="90.5" y="8" width="8" height="3" fill="rgba(55,40,65,0.6)" rx="0.5" />
      <rect x="90" y="68" width="9" height="3" fill="rgba(60,45,70,0.7)" rx="0.5" />

      <rect x="83" y="20" width="4" height="50" fill="rgba(50,35,60,0.5)" />
      <rect x="81.5" y="18" width="7" height="3" fill="rgba(55,40,65,0.5)" rx="0.5" />

      {/* Temple ceiling arch */}
      <path d="M 0,8 Q 50,-5 100,8" fill="none" stroke="rgba(70,50,85,0.4)" strokeWidth="0.3" />
      <path d="M 0,5 Q 50,-8 100,5" fill="none" stroke="rgba(60,42,75,0.3)" strokeWidth="0.2" />

      {/* Wall carvings / decorative elements on pillars */}
      <circle cx="5.5" cy="25" r="1.5" fill="none" stroke="rgba(80,60,100,0.3)" strokeWidth="0.2" />
      <circle cx="5.5" cy="35" r="1.5" fill="none" stroke="rgba(80,60,100,0.3)" strokeWidth="0.2" />
      <circle cx="94.5" cy="27" r="1.5" fill="none" stroke="rgba(80,60,100,0.3)" strokeWidth="0.2" />
      <circle cx="94.5" cy="37" r="1.5" fill="none" stroke="rgba(80,60,100,0.3)" strokeWidth="0.2" />

      {/* Torches - larger and brighter */}
      {/* Left torch */}
      <rect x="8.5" y="22" width="1" height="5" fill="rgba(80,50,40,0.6)" />
      <circle cx="9" cy="20" r="8" fill="url(#torchGlow1)" style={{ animation: 'fireFlicker 2s ease-in-out infinite' }} />
      <ellipse cx="9" cy="20" rx="1.5" ry="2.5" fill="rgba(255,200,50,0.9)" style={{ animation: 'fireFlicker 1.5s ease-in-out infinite' }} />
      <ellipse cx="9" cy="19" rx="0.8" ry="1.5" fill="rgba(255,255,150,0.7)" />

      {/* Right torch */}
      <rect x="90.5" y="24" width="1" height="5" fill="rgba(80,50,40,0.6)" />
      <circle cx="91" cy="22" r="8" fill="url(#torchGlow2)" style={{ animation: 'fireFlicker 2.5s ease-in-out infinite 0.5s' }} />
      <ellipse cx="91" cy="22" rx="1.5" ry="2.5" fill="rgba(255,200,50,0.9)" style={{ animation: 'fireFlicker 1.8s ease-in-out infinite 0.3s' }} />
      <ellipse cx="91" cy="21" rx="0.8" ry="1.5" fill="rgba(255,255,150,0.7)" />

      {/* Additional mid-wall torches for more light */}
      <circle cx="25" cy="30" r="5" fill="url(#torchGlow1)" opacity="0.4" style={{ animation: 'fireFlicker 3s ease-in-out infinite 1s' }} />
      <circle cx="75" cy="32" r="5" fill="url(#torchGlow2)" opacity="0.4" style={{ animation: 'fireFlicker 2.8s ease-in-out infinite 0.8s' }} />

      {/* Ambient center glow */}
      <circle cx="50" cy="50" r="35" fill="url(#centerAmbient)" />

      {/* Low fog layer - lighter */}
      <ellipse cx="50" cy="82" rx="55" ry="10" fill="rgba(120,80,150,0.12)" className="fog-layer" />
      <ellipse cx="30" cy="88" rx="35" ry="7" fill="rgba(100,65,130,0.08)" className="fog-layer" style={{ animationDelay: '2s' }} />
    </svg>

    {/* Vignette overlay - lighter to keep more visible */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.5)_100%)]" />
  </div>
);

// ============================================================
// SLASH EFFECT COMPONENT (player attacks bot)
// ============================================================
const SlashEffect = ({ angle }) => (
  <svg className="slash-anim" viewBox="0 0 200 200" width="420" height="420"
       style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
    <defs>
      <linearGradient id="slashGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(34,197,94,0)" />
        <stop offset="40%" stopColor="rgba(34,197,94,0.8)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.9)" />
      </linearGradient>
      <filter id="slashGlow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <g transform={`rotate(${angle}, 100, 100)`} filter="url(#slashGlow)">
      {/* Main slash arc */}
      <path d="M 95,100 Q 92,55 100,10 Q 108,55 105,100 Z" fill="url(#slashGrad)" opacity="0.9" />
      {/* Side trails */}
      <line x1="88" y1="100" x2="82" y2="18" stroke="rgba(34,197,94,0.5)" strokeWidth="2" strokeLinecap="round" />
      <line x1="112" y1="100" x2="118" y2="18" stroke="rgba(34,197,94,0.5)" strokeWidth="2" strokeLinecap="round" />
      {/* Bright center line */}
      <line x1="100" y1="95" x2="100" y2="15" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" />
      {/* Impact sparks at tip */}
      <circle cx="100" cy="12" r="4" fill="rgba(255,255,200,0.8)" />
      <circle cx="100" cy="12" r="2" fill="rgba(255,255,255,0.9)" />
    </g>
  </svg>
);

// ============================================================
// SPARK EFFECT COMPONENT (clash)
// ============================================================
const SparkEffect = () => (
  <svg className="spark-effect" viewBox="0 0 200 200" width="420" height="420"
       style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
    <defs>
      <filter id="sparkGlow">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <g filter="url(#sparkGlow)">
      {/* Star burst rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => (
        <line key={a} x1={100 + Math.cos(a * Math.PI / 180) * 8} y1={100 + Math.sin(a * Math.PI / 180) * 8}
              x2={100 + Math.cos(a * Math.PI / 180) * (a % 60 === 0 ? 60 : 40)} y2={100 + Math.sin(a * Math.PI / 180) * (a % 60 === 0 ? 60 : 40)}
              stroke={a % 60 === 0 ? '#ffd700' : '#ffe066'} strokeWidth={a % 60 === 0 ? '3' : '1.5'}
              strokeLinecap="round" opacity={a % 60 === 0 ? 1 : 0.7} />
      ))}
      {/* Flying spark particles */}
      {[15, 75, 135, 195, 255, 315].map(a => (
        <circle key={a} cx={100 + Math.cos(a * Math.PI / 180) * 35} cy={100 + Math.sin(a * Math.PI / 180) * 35}
                r="2" fill="#fff" opacity="0.8" />
      ))}
      {/* Center flash */}
      <circle cx="100" cy="100" r="18" fill="rgba(255,215,0,0.5)" />
      <circle cx="100" cy="100" r="10" fill="rgba(255,240,150,0.7)" />
      <circle cx="100" cy="100" r="5" fill="rgba(255,255,255,0.9)" />
    </g>
  </svg>
);

// ============================================================
// DAMAGE OVERLAY COMPONENT (red screen flash)
// ============================================================
const DamageOverlay = ({ active }) => {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none damage-flash"
         style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.4) 100%)' }} />
  );
};

// ============================================================
// ORNAMENTAL HEALTH BAR FRAME
// ============================================================
const OrnamentalFrame = ({ children, position }) => (
  <div className={`absolute ${position === 'top' ? 'top-6' : 'bottom-6'} left-1/2 -translate-x-1/2 w-[420px]`}>
    <div className="relative">
      {/* Gold corner brackets */}
      <svg className="absolute -left-4 -top-2 w-6 h-6" viewBox="0 0 20 20">
        <path d="M 2,18 L 2,2 L 18,2" fill="none" stroke={COLORS.gold} strokeWidth="2" />
        <circle cx="2" cy="2" r="2" fill={COLORS.gold} />
      </svg>
      <svg className="absolute -right-4 -top-2 w-6 h-6" viewBox="0 0 20 20">
        <path d="M 18,18 L 18,2 L 2,2" fill="none" stroke={COLORS.gold} strokeWidth="2" />
        <circle cx="18" cy="2" r="2" fill={COLORS.gold} />
      </svg>
      <svg className="absolute -left-4 -bottom-2 w-6 h-6" viewBox="0 0 20 20">
        <path d="M 2,2 L 2,18 L 18,18" fill="none" stroke={COLORS.gold} strokeWidth="2" />
        <circle cx="2" cy="18" r="2" fill={COLORS.gold} />
      </svg>
      <svg className="absolute -right-4 -bottom-2 w-6 h-6" viewBox="0 0 20 20">
        <path d="M 18,2 L 18,18 L 2,18" fill="none" stroke={COLORS.gold} strokeWidth="2" />
        <circle cx="18" cy="18" r="2" fill={COLORS.gold} />
      </svg>
      {children}
    </div>
  </div>
);

// ============================================================
// MAIN GAME COMPONENT
// ============================================================
const MathBattleGame = () => {
  const [gameState, setGameState] = useState('MENU'); // MENU, IDLE, QUESTION_ACTIVE, RESOLUTION, GAME_OVER
  const [difficulty, setDifficulty] = useState(null);
  const [playerHP, setPlayerHP] = useState(100);
  const [botHP, setBotHP] = useState(100);
  const [combo, setCombo] = useState(0);
  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [playerAnswer, setPlayerAnswer] = useState(null);
  const [botAnswer, setBotAnswer] = useState(null);
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [swordAnimation, setSwordAnimation] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [playerAnswerTime, setPlayerAnswerTime] = useState(null);
  const [botAnswerTime, setBotAnswerTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(4000);
  const [timedOut, setTimedOut] = useState(false);
  const [screenShake, setScreenShake] = useState(false);

  const diff = difficulty ? DIFFICULTY_CONFIGS[difficulty] : DIFFICULTY_CONFIGS.medium;
  const botAccuracy = diff.botAccuracy;
  const clashWindow = diff.clashWindow;
  const questionTimeLimit = diff.questionTimeLimit;

  // Return to menu
  const goToMenu = () => {
    setGameState('MENU');
    setDifficulty(null);
    setPlayerHP(100);
    setBotHP(100);
    setCombo(0);
    setQuestion(null);
    setAnswers([]);
    setPlayerAnswer(null);
    setBotAnswer(null);
    setSwordAnimation(null);
    setResolutionMessage('');
    setScreenShake(false);
  };

  // Start game with selected difficulty
  const startGame = (diff) => {
    setDifficulty(diff);
    setPlayerHP(100);
    setBotHP(100);
    setCombo(0);
    setScreenShake(false);
    setGameState('IDLE');
  };

  // Generate math question based on difficulty
  const generateQuestion = () => {
    const types = diff.types;
    const type = types[Math.floor(Math.random() * types.length)];
    const nr = diff.numberRange;

    let questionText = '';
    let answer = 0;

    switch(type) {
      case 'add':
        const a1 = Math.floor(Math.random() * (nr.add[1] - nr.add[0])) + nr.add[0];
        const a2 = Math.floor(Math.random() * (nr.add[1] - nr.add[0])) + nr.add[0];
        questionText = `${a1} + ${a2}`;
        answer = a1 + a2;
        break;
      case 'subtract':
        const s1 = Math.floor(Math.random() * (nr.subtract[1] - nr.subtract[0])) + nr.subtract[0];
        const s2 = Math.floor(Math.random() * Math.min(s1 - 1, nr.subtract[0])) + 1;
        questionText = `${s1} - ${s2}`;
        answer = s1 - s2;
        break;
      case 'multiply':
        const m1 = Math.floor(Math.random() * (nr.multiply[1] - nr.multiply[0])) + nr.multiply[0];
        const m2 = Math.floor(Math.random() * (nr.multiply[1] - nr.multiply[0])) + nr.multiply[0];
        questionText = `${m1} × ${m2}`;
        answer = m1 * m2;
        break;
      case 'divide':
        const d2 = Math.floor(Math.random() * (nr.divide[1] - nr.divide[0])) + nr.divide[0];
        const d1 = d2 * (Math.floor(Math.random() * 10) + 2);
        questionText = `${d1} ÷ ${d2}`;
        answer = d1 / d2;
        break;
      case 'percentage':
        const percent = [10, 20, 25, 50, 75][Math.floor(Math.random() * 5)];
        const of = Math.floor(Math.random() * 20) * 10 + 20;
        questionText = `${percent}% of ${of}`;
        answer = (percent / 100) * of;
        break;
    }

    const wrongAnswers = new Set();
    while(wrongAnswers.size < 5) {
      const offset = Math.floor(Math.random() * 20) - 10;
      const wrong = answer + offset;
      if (wrong !== answer && wrong > 0) {
        wrongAnswers.add(Math.round(wrong * 10) / 10);
      }
    }

    const allAnswers = [answer, ...Array.from(wrongAnswers)];
    for (let i = allAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
    }

    return { questionText, answer, answers: allAnswers };
  };

  // Start new question (guard against firing after game over)
  const gameOverRef = useRef(false);
  useEffect(() => { gameOverRef.current = (playerHP <= 0 || botHP <= 0); }, [playerHP, botHP]);

  const startNewQuestion = () => {
    if (gameOverRef.current) return;
    const q = generateQuestion();
    setQuestion(q.questionText);
    setCorrectAnswer(q.answer);
    setAnswers(q.answers);
    setPlayerAnswer(null);
    setBotAnswer(null);
    setSelectedSegment(null);
    setSwordAnimation(null);
    setResolutionMessage('');
    setPlayerAnswerTime(null);
    setBotAnswerTime(null);
    setQuestionStartTime(Date.now());
    setTimeRemaining(questionTimeLimit);
    setTimedOut(false);
    setScreenShake(false);
    setGameState('QUESTION_ACTIVE');

    const botDelay = Math.random() * diff.botDelayRange + diff.botDelayMin;
    setTimeout(() => {
      if (!gameOverRef.current) {
        const now = Date.now();
        setBotAnswerTime(now);
        const isCorrect = Math.random() < botAccuracy;
        if (isCorrect) {
          setBotAnswer(q.answer);
        } else {
          const wrongAnswers = q.answers.filter(a => a !== q.answer);
          setBotAnswer(wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)]);
        }
      }
    }, botDelay);
  };

  // Player selects answer
  const selectAnswer = (answer, index) => {
    if (gameState !== 'QUESTION_ACTIVE' || playerAnswer !== null) return;
    SFX.select();
    const now = Date.now();
    setPlayerAnswerTime(now);
    setPlayerAnswer(answer);
    setSelectedSegment(index);
  };

  // Timer countdown
  useEffect(() => {
    if (gameState === 'QUESTION_ACTIVE' && !timedOut && playerAnswer === null) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - questionStartTime;
        const remaining = Math.max(0, questionTimeLimit - elapsed);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(interval);
          setTimedOut(true);
          setPlayerAnswer('TIMEOUT');
          setPlayerAnswerTime(Date.now());
        }
      }, 16);

      return () => clearInterval(interval);
    }
  }, [gameState, questionStartTime, timedOut, playerAnswer]);

  // Resolve combat
  useEffect(() => {
    if (playerAnswer !== null && botAnswer !== null && gameState === 'QUESTION_ACTIVE') {
      setGameState('RESOLUTION');

      const playerCorrect = playerAnswer === correctAnswer;
      const botCorrect = botAnswer === correctAnswer;
      const timeDiff = Math.abs(playerAnswerTime - botAnswerTime);

      setTimeout(() => {
        if (playerAnswer === 'TIMEOUT') {
          setResolutionMessage('TOO SLOW!');
          setPlayerHP(prev => Math.max(0, prev - diff.timeoutDamage));
          setCombo(0);
          setSwordAnimation({ type: 'attack', angle: 0, target: 'player' });
          setScreenShake(true);
          SFX.timeout();
          setTimeout(() => SFX.damage(), 150);
        }
        else if (playerCorrect && botCorrect && timeDiff <= clashWindow) {
          setResolutionMessage('CLASH!');
          setSwordAnimation({ type: 'clash', angle: 0 });
          setScreenShake(true);
          SFX.clash();
        }
        else if (playerCorrect && botCorrect && playerAnswerTime < botAnswerTime) {
          setResolutionMessage('HIT!');
          const damage = diff.damage + (combo * 5);
          setBotHP(prev => Math.max(0, prev - damage));
          setCombo(prev => prev + 1);
          const angle = (selectedSegment * 60) - 90;
          setSwordAnimation({ type: 'attack', angle, target: 'bot' });
          SFX.swordSlash();
          setTimeout(() => SFX.hit(), 100);
        }
        else if (playerCorrect && botCorrect && botAnswerTime < playerAnswerTime) {
          setResolutionMessage('DAMAGE!');
          setPlayerHP(prev => Math.max(0, prev - diff.botDamage));
          setCombo(0);
          const botSegmentIndex = answers.findIndex(a => a === botAnswer);
          const angle = (botSegmentIndex * 60) - 90;
          setSwordAnimation({ type: 'attack', angle, target: 'player' });
          setScreenShake(true);
          SFX.swordSlash();
          setTimeout(() => SFX.damage(), 100);
        }
        else if (playerCorrect && !botCorrect) {
          setResolutionMessage('HIT!');
          const damage = diff.damage + (combo * 5);
          setBotHP(prev => Math.max(0, prev - damage));
          setCombo(prev => prev + 1);
          const angle = (selectedSegment * 60) - 90;
          setSwordAnimation({ type: 'attack', angle, target: 'bot' });
          SFX.swordSlash();
          setTimeout(() => SFX.hit(), 100);
        }
        else if (botCorrect && !playerCorrect) {
          setResolutionMessage('DAMAGE!');
          setPlayerHP(prev => Math.max(0, prev - diff.botDamage));
          setCombo(0);
          const botSegmentIndex = answers.findIndex(a => a === botAnswer);
          const angle = (botSegmentIndex * 60) - 90;
          setSwordAnimation({ type: 'attack', angle, target: 'player' });
          setScreenShake(true);
          SFX.swordSlash();
          setTimeout(() => SFX.damage(), 100);
        }
        else {
          setResolutionMessage('MISS!');
          setCombo(0);
          setSwordAnimation({ type: 'miss', angle: 0, target: null });
          SFX.miss();
        }

        setTimeout(() => {
          startNewQuestion();
        }, 1500);
      }, 500);
    }
  }, [playerAnswer, botAnswer]);

  // Check game over
  useEffect(() => {
    if (playerHP <= 0 || botHP <= 0) {
      setGameState('GAME_OVER');
      if (botHP <= 0) SFX.victory();
      else SFX.gameOver();
    }
  }, [playerHP, botHP]);

  // Start game when IDLE (after difficulty selection)
  useEffect(() => {
    if (gameState === 'IDLE' && difficulty) {
      setTimeout(() => startNewQuestion(), 500);
    }
  }, [gameState, difficulty]);

  // ---- Derived visual state ----
  const activeZone = swordAnimation
    ? Math.round(((swordAnimation.angle + 90) % 360) / 60) % 6
    : 0;

  const currentPose = !swordAnimation ? 'idle'
    : swordAnimation.type === 'clash' ? 'clash'
    : swordAnimation.target === 'player' ? 'attack'
    : swordAnimation.target === 'bot' ? 'recoil'
    : 'miss';

  const showDamageOverlay = resolutionMessage === 'DAMAGE!' || resolutionMessage === 'TOO SLOW!';

  // Radial menu segments
  const segments = answers.map((answer, index) => {
    const angle = (index * 60) - 90;
    const isCorrect = answer === correctAnswer;
    const isSelected = selectedSegment === index;
    const angleRad = (angle * Math.PI) / 180;
    const labelRadius = 35;
    const labelX = 50 + Math.cos(angleRad) * labelRadius;
    const labelY = 50 + Math.sin(angleRad) * labelRadius;

    return {
      answer, angle, isCorrect, isSelected, labelX, labelY,
      path: `M 50 50 L ${50 + Math.cos((angle - 30) * Math.PI / 180) * 50} ${50 + Math.sin((angle - 30) * Math.PI / 180) * 50} A 50 50 0 0 1 ${50 + Math.cos((angle + 30) * Math.PI / 180) * 50} ${50 + Math.sin((angle + 30) * Math.PI / 180) * 50} Z`
    };
  });

  // Resolution message styling
  const getResolutionStyle = () => {
    switch (resolutionMessage) {
      case 'CLASH!':
        return 'text-7xl font-black text-white drop-shadow-[0_0_30px_rgba(100,150,255,0.8)]';
      case 'HIT!':
        return 'text-7xl font-black text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,0.8)]';
      case 'DAMAGE!':
      case 'TOO SLOW!':
        return 'text-7xl font-black text-red-400 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)]';
      case 'MISS!':
        return 'text-7xl font-black text-gray-400 drop-shadow-[0_0_20px_rgba(150,150,150,0.5)]';
      default:
        return 'text-7xl font-black text-white';
    }
  };

  return (
    <div className={`w-full h-screen relative overflow-hidden ${screenShake ? 'screen-shake' : ''}`}>
      <style>{GAME_STYLES}</style>

      {/* Battlefield Background */}
      <BattlefieldBackground />

      {/* Knight Illustration Layer - behind radial menu, visible on menu too */}
      <KnightSVG
        zone={activeZone}
        pose={gameState === 'MENU' ? 'idle' : currentPose}
        visible={gameState !== 'IDLE'}
      />

      {/* Back to Menu Button */}
      {(gameState === 'QUESTION_ACTIVE' || gameState === 'RESOLUTION') && (
        <button
          onClick={goToMenu}
          className="absolute top-7 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm border border-[#ffd70033] text-gray-300 hover:text-white hover:border-[#ffd70066] transition-all text-sm"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M 10,2 L 4,7 L 10,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Menu
        </button>
      )}

      {/* Enemy Health Bar */}
      <OrnamentalFrame position="top">
        <div className="bg-black/60 backdrop-blur-sm px-5 py-3 rounded-lg border border-[#ffd70033]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#ff4500] text-lg">&#x2694;</span>
            <span className="text-[#ffd700] font-bold text-sm tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
              DARK KNIGHT
            </span>
          </div>
          <div className="relative h-5 bg-gray-900 rounded-full overflow-hidden border border-[#4a4e54]">
            <div
              className="absolute inset-0 transition-all duration-500 rounded-full"
              style={{
                width: `${botHP}%`,
                background: 'linear-gradient(to right, #4a4e54, #8b1a1a, #cc0000)'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold"
                 style={{ textShadow: '0 0 4px black' }}>
              {botHP} HP
            </div>
          </div>
        </div>
      </OrnamentalFrame>

      {/* Combo Counter */}
      {combo > 0 && (
        <div className="absolute top-8 right-8 combo-glow">
          <div className="bg-black/70 backdrop-blur-sm border-2 border-[#ffd700] rounded-lg px-6 py-3">
            <span className="text-[#ffd700] font-black text-3xl tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
              {combo}X
            </span>
            <span className="text-[#ff8c00] font-bold text-lg ml-2">COMBO!</span>
          </div>
        </div>
      )}

      {/* Center Radial Menu */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ zIndex: 10, top: '52%' }}>
        <svg width="320" height="320" viewBox="0 0 100 100" className="relative">
          {/* Semi-transparent backing for readability */}
          <circle cx="50" cy="50" r="49" fill="rgba(0,0,0,0.3)" />

          {/* Segments */}
          {segments.map((seg, idx) => (
            <g key={idx}>
              <path
                d={seg.path}
                fill={seg.isSelected ? '#10b981' : gameState === 'RESOLUTION' && seg.isCorrect ? '#22c55e' : 'rgba(30,15,50,0.7)'}
                stroke={COLORS.goldDark}
                strokeWidth="0.3"
                className="cursor-pointer hover:opacity-80 transition-all"
                onClick={() => selectAnswer(seg.answer, idx)}
                opacity={gameState === 'QUESTION_ACTIVE' ? 1 : 0.5}
              />
              <text
                x={seg.labelX}
                y={seg.labelY}
                fill="white"
                fontSize="7.5"
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none select-none"
                style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 0 8px black, 0 0 4px black' }}
              >
                {seg.answer}
              </text>
            </g>
          ))}

          {/* Timer Circle - Background */}
          <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(30,15,50,0.5)" strokeWidth="3" />

          {/* Timer Circle - Progress */}
          {gameState === 'QUESTION_ACTIVE' && (
            <circle
              cx="50" cy="50" r="22"
              fill="none"
              stroke={timeRemaining > 2000 ? '#22c55e' : timeRemaining > 1000 ? '#eab308' : '#ef4444'}
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 22}`}
              strokeDashoffset={`${2 * Math.PI * 22 * (1 - timeRemaining / questionTimeLimit)}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke 0.3s ease' }}
            />
          )}

          {/* Center circle with question */}
          <circle cx="50" cy="50" r="18" fill="rgba(10,5,20,0.9)" stroke={COLORS.goldDark} strokeWidth="0.5" />
          <text
            x="50" y="50"
            fill="#ffd700"
            fontSize="7"
            fontWeight="900"
            textAnchor="middle"
            dominantBaseline="middle"
            className="select-none"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}
          >
            {question}
          </text>
        </svg>

        {/* Effect Overlays */}
        {swordAnimation?.type === 'attack' && swordAnimation.target === 'bot' && (
          <SlashEffect angle={swordAnimation.angle} />
        )}
        {swordAnimation?.type === 'clash' && <SparkEffect />}
      </div>

      {/* Resolution Message */}
      {resolutionMessage && (
        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 20 }}>
          <div className={getResolutionStyle()} style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em' }}>
            {resolutionMessage}
          </div>
        </div>
      )}

      {/* Damage Overlay */}
      <DamageOverlay active={showDamageOverlay} />

      {/* Player Health Bar */}
      <OrnamentalFrame position="bottom">
        <div className="bg-black/60 backdrop-blur-sm px-5 py-3 rounded-lg border border-[#ffd70033]">
          <div className="relative h-5 bg-gray-900 rounded-full overflow-hidden border border-[#1a3a1a]">
            <div
              className="absolute inset-0 transition-all duration-500 rounded-full"
              style={{
                width: `${playerHP}%`,
                background: 'linear-gradient(to right, #0a4a0a, #22c55e, #4ade80)'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold"
                 style={{ textShadow: '0 0 4px black' }}>
              {playerHP} HP
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">&#x1F6E1;</span>
            <span className="text-[#4ade80] font-bold text-sm tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
              WARRIOR
            </span>
          </div>
        </div>
      </OrnamentalFrame>

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <div className="absolute inset-0 bg-black/85 flex items-center justify-center" style={{ zIndex: 30 }}>
          <div className="relative bg-gradient-to-b from-[#1a1520] to-[#0d0d0d] p-12 rounded-2xl border-2 border-[#ffd700] text-center"
               style={{ boxShadow: '0 0 60px rgba(255,215,0,0.2), inset 0 0 30px rgba(255,215,0,0.05)' }}>
            {/* Ornamental top line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <svg width="200" height="20" viewBox="0 0 200 20">
                <path d="M 20,10 L 80,10 L 90,2 L 100,10 L 110,2 L 120,10 L 180,10" fill="none" stroke={COLORS.gold} strokeWidth="1.5" />
              </svg>
            </div>

            <h1 className="text-7xl font-black mb-6" style={{
              fontFamily: 'Inter, sans-serif',
              color: playerHP > 0 ? COLORS.gold : '#cc0000',
              textShadow: playerHP > 0
                ? '0 0 30px rgba(255,215,0,0.5)'
                : '0 0 30px rgba(200,0,0,0.5)'
            }}>
              {playerHP > 0 ? 'VICTORY!' : 'DEFEAT!'}
            </h1>
            <p className="text-xl text-gray-300 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
              {playerHP > 0 ? 'The knight has been defeated!' : 'The knight prevails...'}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setPlayerHP(100);
                  setBotHP(100);
                  setCombo(0);
                  setScreenShake(false);
                  setGameState('IDLE');
                }}
                className="px-10 py-4 rounded-lg text-xl font-bold transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(to bottom, ${COLORS.gold}, ${COLORS.goldDark})`,
                  color: '#1a0a2e',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 0 20px rgba(255,215,0,0.3)'
                }}
              >
                Battle Again
              </button>
              <button
                onClick={goToMenu}
                className="px-8 py-4 rounded-lg text-xl font-bold transition-all hover:scale-105 border border-[#ffd70066] text-[#ffd700] hover:bg-[#ffd70011]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Menu - Difficulty Selection */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 25 }}>
          <div className="bg-black/85 backdrop-blur-md p-10 rounded-2xl border border-[#ffd70033] text-center max-w-md w-full mx-4"
               style={{ boxShadow: '0 0 60px rgba(255,215,0,0.08), 0 0 120px rgba(100,0,150,0.1)' }}>
            <h1 className="text-5xl font-black mb-2 text-[#ffd700]" style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 0 30px rgba(255,215,0,0.3)' }}>
              Math Battle
            </h1>
            <div className="w-24 h-0.5 mx-auto mb-2" style={{ background: `linear-gradient(to right, transparent, ${COLORS.gold}, transparent)` }} />
            <p className="text-gray-400 mb-8 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Solve the equation. Defeat the knight.
            </p>

            <p className="text-[#ffd700] font-bold mb-4 text-sm tracking-widest uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
              Choose Difficulty
            </p>

            <div className="flex flex-col gap-3">
              {Object.entries(DIFFICULTY_CONFIGS).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => startGame(key)}
                  className="group relative px-6 py-4 rounded-lg text-left transition-all hover:scale-[1.02] border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(30,15,50,0.9), rgba(15,5,25,0.9))',
                    borderColor: key === 'easy' ? 'rgba(34,197,94,0.3)' : key === 'medium' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-lg" style={{
                        color: key === 'easy' ? '#4ade80' : key === 'medium' ? '#fbbf24' : '#f87171'
                      }}>
                        {cfg.label}
                      </span>
                      <p className="text-gray-400 text-xs mt-0.5">{cfg.description}</p>
                    </div>
                    <svg width="20" height="20" viewBox="0 0 20 20" className="text-gray-500 group-hover:text-gray-300 transition-colors">
                      <path d="M 7,4 L 13,10 L 7,16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-gray-600 text-xs mt-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Answer quickly to build devastating combos
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MathBattleGame;
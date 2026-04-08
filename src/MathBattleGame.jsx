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
  gold: '#c9a84c',
  goldDark: '#8a7030',
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
// CSS KEYFRAMES (injected via <style>)
// ============================================================
const GAME_STYLES = `
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

  .screen-shake { animation: screenShake 0.4s ease-out; }
  .spark-effect { animation: sparkBurst 0.6s ease-out forwards; }
  .damage-flash { animation: damageFlash 0.5s ease-out; }
  .slash-anim line { animation: slashLine 0.4s ease-out forwards; stroke-dasharray: 200; }
  .fog-layer { animation: fogDrift 8s ease-in-out infinite; }
  .combo-glow { animation: comboGlow 1s ease-in-out infinite; }

  @keyframes bloodDrop {
    0% { opacity: 0; transform: scale(0.3) translateY(-10px); }
    40% { opacity: 0.9; transform: scale(1.2) translateY(0); }
    100% { opacity: 0; transform: scale(0.8) translateY(20px); }
  }

  @keyframes windSwish {
    0% { opacity: 0; transform: translateX(-30px) scaleX(0.5); }
    30% { opacity: 0.7; transform: translateX(0) scaleX(1); }
    100% { opacity: 0; transform: translateX(40px) scaleX(0.3); }
  }

  .vfx-blood { animation: vfxFade 0.8s ease-out forwards; }
  .vfx-wind { animation: vfxFade 0.6s ease-out forwards; }
  @keyframes vfxFade {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
`;

// ============================================================
// VIDEO ASSET PATHS
// ============================================================
const KNIGHT_VIDEOS = {
  idle: '/knight/idle.mp4',
  attack_left: '/knight/attack_left.mp4',
  attack_right: '/knight/attack_right.mp4',
  attack_top: '/knight/attack_top.mp4',
  block_left: '/knight/block_left.mp4',
  block_right: '/knight/block_right.mp4',
  hit: '/knight/hit.mp4',
  finisher: '/knight/finisher.mp4',
};

const ATTACK_CLIPS = ['attack_left', 'attack_right', 'attack_top'];
const BLOCK_CLIPS = ['block_left', 'block_right'];

// ============================================================
// KNIGHT VIDEO COMPONENT
// ============================================================
const KnightVideo = ({ pose = 'idle', visible = true, playerHP = 100, botHP = 100 }) => {
  const videoRefs = useRef({});
  const [activeClip, setActiveClip] = useState('idle');
  const [vfx, setVfx] = useState(null); // 'blood' | 'sparks' | 'wind' | null
  const prevPoseRef = useRef('idle');
  const finisherTriggeredRef = useRef(false);

  // Pick a random clip from a list
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Detect killing blow immediately (before GAME_OVER state)
  useEffect(() => {
    if (playerHP > 0 && botHP > 0) {
      // Game restarted — reset finisher lock
      finisherTriggeredRef.current = false;
      return;
    }
    if (finisherTriggeredRef.current) return;
    if (playerHP <= 0) {
      finisherTriggeredRef.current = true;
      setActiveClip('finisher');
      setVfx(null);
    } else if (botHP <= 0) {
      finisherTriggeredRef.current = true;
      setActiveClip('hit');
      setVfx('blood');
      setTimeout(() => setVfx(null), 800);
    }
  }, [playerHP, botHP]);

  // Map pose to video clip (skip if finisher is playing)
  useEffect(() => {
    if (!visible || finisherTriggeredRef.current) return;

    if (pose === prevPoseRef.current && pose === 'idle') return;
    prevPoseRef.current = pose;

    if (pose === 'attack') {
      // Bot attacks player — DAMAGE
      const clip = pickRandom(ATTACK_CLIPS);
      setActiveClip(clip);
      setVfx('blood');
      setTimeout(() => setVfx(null), 800);
    } else if (pose === 'recoil') {
      // Player hits bot — HIT
      setActiveClip('hit');
      setVfx(null);
    } else if (pose === 'clash') {
      // Both correct — CLASH
      const clip = pickRandom(BLOCK_CLIPS);
      setActiveClip(clip);
      setVfx('sparks');
      setTimeout(() => setVfx(null), 800);
    } else if (pose === 'miss') {
      // Both wrong — MISS
      const clip = pickRandom(ATTACK_CLIPS);
      setActiveClip(clip);
      setVfx('wind');
      setTimeout(() => setVfx(null), 600);
    } else {
      setActiveClip('idle');
      setVfx(null);
    }
  }, [pose, visible]);

  // Play the active clip whenever it changes
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (!video) return;
      if (key === activeClip) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeClip]);

  // When non-idle clip ends, return to idle (unless finisher)
  const handleEnded = useCallback((clipName) => {
    if (finisherTriggeredRef.current) return; // stay on last frame
    if (clipName !== 'idle') {
      setActiveClip('idle');
      setVfx(null);
    }
  }, []);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
      {/* Video layers — all stacked, only active one visible */}
      {Object.entries(KNIGHT_VIDEOS).map(([key, src]) => (
        <video
          key={key}
          ref={el => { videoRefs.current[key] = el; }}
          src={src}
          muted
          playsInline
          preload="auto"
          loop={key === 'idle'}
          onEnded={() => handleEnded(key)}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            height: '100%',
            width: 'auto',
            objectFit: 'cover',
            display: activeClip === key ? 'block' : 'none',
          }}
        />
      ))}

      {/* VFX: Blood Splat */}
      {vfx === 'blood' && (
        <div className="vfx-blood" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 40%, rgba(180,0,0,0.6) 0%, rgba(120,0,0,0.3) 30%, transparent 70%)',
          zIndex: 2,
        }}>
          {/* Blood droplets */}
          {[...Array(8)].map((_, i) => {
            const x = 30 + Math.random() * 40;
            const y = 20 + Math.random() * 40;
            const size = 4 + Math.random() * 12;
            const delay = Math.random() * 0.2;
            return (
              <div key={i} style={{
                position: 'absolute', left: `${x}%`, top: `${y}%`,
                width: `${size}px`, height: `${size * 1.3}px`,
                background: 'radial-gradient(ellipse, #cc0000 30%, #880000 70%, transparent 100%)',
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                opacity: 0, animation: `bloodDrop 0.6s ${delay}s ease-out forwards`,
              }} />
            );
          })}
        </div>
      )}

      {/* VFX: Clash Sparks */}
      {vfx === 'sparks' && (
        <div className="vfx-sparks" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        }}>
          <svg style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px' }}
               viewBox="0 0 200 200" className="spark-effect">
            <defs>
              <filter id="sparkGlow2">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <g filter="url(#sparkGlow2)">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => (
                <line key={a}
                      x1={100 + Math.cos(a * Math.PI / 180) * 8} y1={100 + Math.sin(a * Math.PI / 180) * 8}
                      x2={100 + Math.cos(a * Math.PI / 180) * (a % 60 === 0 ? 70 : 45)}
                      y2={100 + Math.sin(a * Math.PI / 180) * (a % 60 === 0 ? 70 : 45)}
                      stroke={a % 60 === 0 ? '#ffd700' : '#ffe066'}
                      strokeWidth={a % 60 === 0 ? '3' : '1.5'}
                      strokeLinecap="round" opacity={a % 60 === 0 ? 1 : 0.7} />
              ))}
              {[15, 75, 135, 195, 255, 315].map(a => (
                <circle key={a}
                        cx={100 + Math.cos(a * Math.PI / 180) * 40}
                        cy={100 + Math.sin(a * Math.PI / 180) * 40}
                        r="3" fill="#fff" opacity="0.9" />
              ))}
              <circle cx="100" cy="100" r="20" fill="rgba(255,215,0,0.5)" />
              <circle cx="100" cy="100" r="12" fill="rgba(255,240,150,0.7)" />
              <circle cx="100" cy="100" r="5" fill="rgba(255,255,255,0.9)" />
            </g>
          </svg>
        </div>
      )}

      {/* VFX: Miss Wind Swish */}
      {vfx === 'wind' && (
        <div className="vfx-wind" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
        }}>
          {[...Array(5)].map((_, i) => {
            const y = 25 + i * 12;
            const delay = i * 0.08;
            return (
              <div key={i} style={{
                position: 'absolute', left: '20%', top: `${y}%`,
                width: '60%', height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(200,200,255,0.6), rgba(200,200,255,0.3), transparent)',
                opacity: 0, animation: `windSwish 0.5s ${delay}s ease-out forwards`,
                borderRadius: '2px',
              }} />
            );
          })}
        </div>
      )}
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
  <div className={`absolute ${position === 'top' ? 'top-6' : 'bottom-6'} left-1/2 -translate-x-1/2 w-[420px]`} style={{ zIndex: 5 }}>
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

  // Check game over — delay to let finisher/hit video play first
  useEffect(() => {
    if (playerHP <= 0 || botHP <= 0) {
      const delay = 2200; // let the video animation finish (~2s)
      setTimeout(() => {
        setGameState('GAME_OVER');
        if (botHP <= 0) SFX.victory();
        else SFX.gameOver();
      }, delay);
    }
  }, [playerHP, botHP]);

  // Start game when IDLE (after difficulty selection)
  useEffect(() => {
    if (gameState === 'IDLE' && difficulty) {
      setTimeout(() => startNewQuestion(), 500);
    }
  }, [gameState, difficulty]);

  // ---- Derived visual state ----
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

      {/* Knight Video Layer - behind radial menu, visible on menu too */}
      <KnightVideo
        pose={gameState === 'MENU' ? 'idle' : currentPose}
        visible={gameState !== 'IDLE'}
        playerHP={playerHP}
        botHP={botHP}
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
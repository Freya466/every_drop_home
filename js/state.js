import { CONFIG } from './config.js';

export function createState(highScore = 0) {
  return {
    phase: 'start', // 'start' | 'playing' | 'paused' | 'ended'
    distance: 0,
    segment: 1,
    water: CONFIG.water.startLevels, // levels, in steps of 0.5
    dirty: false,
    cleanDeliveries: 0,
    dirtyDeliveries: 0,
    litersDelivered: 0,
    litersSpilled: 0,
    score: 0,
    highScore,
    isNewHighScore: false,
    ending: null, // 'happy' (emptied at a village) | 'outdelivered' (ran dry, but delivered > spilled) | 'spilled'
    popup: null, // { liters, points, clean, line, timeLeft }
    events: [], // this frame's events for effects, UI and sound: { type, ... }
  };
}

// Keeps the same object (other modules hold a reference) and the high score.
export function resetState(state) {
  Object.assign(state, createState(state.highScore));
}

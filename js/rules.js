import { CONFIG } from './config.js';
import { isInvincible, makeInvincible } from './player.js';

const OBSTACLES = new Set(['rock', 'bush', 'branch']);

export function segmentAt(distance) {
  return Math.floor(distance / CONFIG.world.segmentM) + 1;
}

export function computeScore(state) {
  const S = CONFIG.score;
  const base =
    Math.floor(state.distance / S.metersPerPoint) +
    S.cleanDelivery * state.cleanDeliveries +
    S.dirtyDelivery * state.dirtyDeliveries;
  const multiplier = state.ending === 'happy' ? S.happyMultiplier : 1;
  return Math.floor(base * multiplier);
}

// The only place water and score change. Hits come from collision, nearest first.
export function updateRules(hits, state, player, dt) {
  if (state.phase !== 'playing') return;
  state.distance = player.x;
  state.segment = segmentAt(player.x);
  for (const hit of hits) {
    if (state.phase !== 'playing') break;
    if (OBSTACLES.has(hit.type)) onObstacle(state, player);
  }
  state.score = computeScore(state);
}

function onObstacle(state, player) {
  if (isInvincible(player)) return;
  state.water = Math.max(0, state.water - CONFIG.water.hitCost);
  makeInvincible(player);
  state.events.push({ type: 'splash' });
  if (state.water <= 0) endRun(state, 'spilled');
}

function endRun(state, ending) {
  state.ending = ending;
  state.phase = 'ended';
  state.score = computeScore(state);
  state.isNewHighScore = state.score > state.highScore;
  state.highScore = Math.max(state.highScore, state.score);
  state.events.push({ type: 'ended', ending });
}

import { CONFIG, COPY } from './config.js';
import { isInvincible, makeInvincible } from './player.js';
import { OBSTACLE_TYPES } from './world/entities.js';

const OBSTACLES = new Set(OBSTACLE_TYPES);
const HAPPY_ENDINGS = new Set(['happy', 'outdelivered']);

export function segmentAt(distance) {
  return Math.floor(distance / CONFIG.world.segmentM) + 1;
}

export function computeScore(state) {
  const S = CONFIG.score;
  const base =
    Math.floor(state.distance / S.metersPerPoint) +
    S.cleanDelivery * state.cleanDeliveries +
    S.dirtyDelivery * state.dirtyDeliveries;
  const multiplier = HAPPY_ENDINGS.has(state.ending) ? S.happyMultiplier : 1;
  return Math.floor(base * multiplier);
}

// The only place water and score change. Hits come from collision, nearest first.
export function updateRules(hits, state, player, dt) {
  if (state.phase !== 'playing') return;
  state.distance = player.x;
  state.segment = segmentAt(player.x);
  if (state.popup) {
    state.popup.timeLeft -= dt;
    if (state.popup.timeLeft <= 0) state.popup = null;
  }
  for (const hit of hits) {
    if (state.phase !== 'playing') break;
    if (OBSTACLES.has(hit.type)) onObstacle(state, player);
    else if (hit.type === 'refill') onRefill(state);
    else if (hit.type === 'puddle') onPuddle(state);
    else if (hit.type === 'filter') onFilter(state);
    else if (hit.type === 'village') onVillage(state);
  }
  state.score = computeScore(state);
}

function onObstacle(state, player) {
  if (isInvincible(player)) return;
  const W = CONFIG.water;
  const levels = Math.min(W.hitCost, state.water);
  state.water -= levels;
  state.litersSpilled += levels * W.litersPerLevel;
  makeInvincible(player);
  state.events.push({ type: 'splash' });
  // Running dry from a hit is still a happy ending if more water reached villages than was spilled.
  if (state.water <= 0) endRun(state, state.litersDelivered > state.litersSpilled ? 'outdelivered' : 'spilled');
}

function onRefill(state) {
  const W = CONFIG.water;
  state.water = Math.min(W.maxLevels, state.water + W.refillGain);
  state.events.push({ type: 'refill' });
}

function onPuddle(state) {
  if (state.dirty) return;
  state.dirty = true;
  state.events.push({ type: 'dirty' });
}

function onFilter(state) {
  if (!state.dirty) return;
  state.dirty = false;
  state.events.push({ type: 'clean' });
}

function onVillage(state) {
  const W = CONFIG.water;
  const levels = Math.min(W.deliveryCost, state.water);
  if (levels <= 0) return;
  state.water -= levels;
  const liters = levels * W.litersPerLevel;
  const clean = !state.dirty;
  if (clean) state.cleanDeliveries += 1;
  else state.dirtyDeliveries += 1;
  state.litersDelivered += liters;
  const count = state.cleanDeliveries + state.dirtyDeliveries;
  state.popup = {
    liters,
    points: clean ? CONFIG.score.cleanDelivery : CONFIG.score.dirtyDelivery,
    clean,
    line: COPY.impactLines[(count - 1) % COPY.impactLines.length],
    timeLeft: CONFIG.popupS,
  };
  state.events.push({ type: 'deliver', clean });
  if (state.water <= 0) endRun(state, 'happy');
}

function endRun(state, ending) {
  state.ending = ending;
  state.phase = 'ended';
  state.score = computeScore(state);
  state.isNewHighScore = state.score > state.highScore;
  state.highScore = Math.max(state.highScore, state.score);
  state.events.push({ type: 'ended', ending });
}

import { CONFIG } from './config.js';
import { createState, resetState } from './state.js';
import { createPlayer, updatePlayer } from './player.js';

// Everything one run needs, with no DOM, so it can be tested in Node.
export function createGame({ highScore = 0 } = {}) {
  return { state: createState(highScore), player: createPlayer() };
}

export function startRun(game) {
  game.state.phase = 'playing';
}

export function resetRun(game) {
  resetState(game.state);
  Object.assign(game.player, createPlayer());
}

export function togglePause(game) {
  const s = game.state;
  if (s.phase === 'playing') s.phase = 'paused';
  else if (s.phase === 'paused') s.phase = 'playing';
}

export function pauseIfPlaying(game) {
  if (game.state.phase === 'playing') game.state.phase = 'paused';
}

export function clampDt(rawDt) {
  return Math.min(Math.max(rawDt, 0), CONFIG.maxDt);
}

// Game loop steps 1–2 for now (world and rules come later). Returns this frame's events.
export function stepGame(game, input, rawDt) {
  const { state, player } = game;
  state.events = [];
  if (state.phase !== 'playing') return state.events;
  const dt = clampDt(rawDt);
  input.apply(player, dt);
  updatePlayer(player, dt);
  if (player.jumped) state.events.push({ type: 'jump' });
  if (player.landed) state.events.push({ type: 'land' });
  return state.events;
}

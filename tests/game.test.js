import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createGame, startRun, resetRun, togglePause, pauseIfPlaying, clampDt, stepGame } from '../js/game.js';
import { makeEntity } from '../js/world/entities.js';

const idle = { apply() {} };
const jumpOnce = () => {
  let used = false;
  return {
    apply(p) {
      if (!used) p.jumpQueued = true;
      used = true;
    },
  };
};

// Replaces the generated world with hand-placed entities and stops further spawning.
function handWorld(game, entities) {
  game.world.entities = entities;
  game.world.segmentsBuilt = Infinity;
}

// --- loop, pause and dt (Task 5) ---

test('clampDt caps long frames and ignores negative ones', () => {
  assert.equal(clampDt(5), CONFIG.maxDt);
  assert.equal(clampDt(-1), 0);
  assert.equal(clampDt(0.01), 0.01);
});

test('a 5-second hitch moves the can at most one clamped step', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  stepGame(game, idle, 5);
  assert.ok(Math.abs(game.player.x - CONFIG.speed * CONFIG.maxDt) < 1e-9);
});

test('nothing moves before start, while paused, or after the end', () => {
  const game = createGame({ seed: 1 });
  stepGame(game, idle, 1 / 60);
  assert.equal(game.player.x, 0);
  startRun(game);
  togglePause(game);
  stepGame(game, idle, 1 / 60);
  assert.equal(game.player.x, 0);
  game.state.phase = 'ended';
  stepGame(game, idle, 1 / 60);
  assert.equal(game.player.x, 0);
});

test('a jump emits jump then land events', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  const input = jumpOnce();
  const seen = [];
  for (let i = 0; i < 120; i++) seen.push(...stepGame(game, input, 1 / 60).map((e) => e.type));
  assert.deepEqual(seen.filter((t) => t === 'jump' || t === 'land'), ['jump', 'land']);
});

test('togglePause only flips between playing and paused', () => {
  const game = createGame({ seed: 1 });
  togglePause(game);
  assert.equal(game.state.phase, 'start');
  startRun(game);
  togglePause(game);
  assert.equal(game.state.phase, 'paused');
  togglePause(game);
  assert.equal(game.state.phase, 'playing');
});

test('pauseIfPlaying pauses a running game and nothing else', () => {
  const game = createGame({ seed: 1 });
  pauseIfPlaying(game);
  assert.equal(game.state.phase, 'start');
  startRun(game);
  pauseIfPlaying(game);
  assert.equal(game.state.phase, 'paused');
});

// --- world (Task 6) ---

test('play again resets the run but keeps the high score', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  handWorld(game, [makeEntity('rock', 2)]);
  for (let i = 0; i < 60 * 5; i++) stepGame(game, idle, 1 / 60);
  Object.assign(game.state, { phase: 'ended', highScore: 77, dirty: true });
  resetRun(game, 2);
  assert.equal(game.state.phase, 'start');
  assert.equal(game.state.highScore, 77);
  assert.equal(game.state.water, CONFIG.water.startLevels);
  assert.equal(game.state.dirty, false);
  assert.equal(game.state.popup, null);
  assert.equal(game.player.x, 0);
  assert.equal(game.world.entities.length, 0);
});

// --- rules wired in (Task 7) ---

test('walking into rocks costs water and eventually spills', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  handWorld(game, [2, 4, 6, 8, 10].map((x) => makeEntity('rock', x)));
  for (let i = 0; i < 60 * 12 && game.state.phase === 'playing'; i++) stepGame(game, idle, 1 / 60);
  assert.equal(game.state.phase, 'ended');
  assert.equal(game.state.ending, 'spilled');
});

// --- villages (Task 9) ---

test('walking into a village delivers water', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  handWorld(game, [makeEntity('village', 3)]);
  for (let i = 0; i < 60 * 3; i++) stepGame(game, idle, 1 / 60);
  assert.equal(game.state.water, 4);
  assert.equal(game.state.cleanDeliveries, 1);
  assert.ok(game.state.popup);
});

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

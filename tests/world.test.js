import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createWorld, updateWorld, collideWorld } from '../js/world/world.js';
import { createPlayer } from '../js/player.js';

test('builds segments ahead of the can', () => {
  const world = createWorld(createRng(1));
  updateWorld(world, 0);
  assert.equal(world.segmentsBuilt, 1);
  updateWorld(world, CONFIG.world.segmentM - CONFIG.world.spawnAheadM + 0.1);
  assert.equal(world.segmentsBuilt, 2);
});

test('drops entities left behind the can', () => {
  const world = createWorld(createRng(1));
  updateWorld(world, 0);
  updateWorld(world, 50);
  assert.ok(world.entities.every((e) => e.x + e.w / 2 > 50 - CONFIG.world.despawnBehindM));
});

test('collideWorld reports what the can touches', () => {
  const world = createWorld(createRng(1));
  updateWorld(world, 0);
  const rock = world.entities.find((e) => e.type === 'rock');
  const player = createPlayer();
  player.x = rock.x;
  assert.deepEqual(collideWorld(world, player).map((h) => h.type), ['rock']);
});

// --- villages (Task 9) ---

test('each segment ends with a village', () => {
  const world = createWorld(createRng(1));
  updateWorld(world, 100);
  const villages = world.entities.filter((e) => e.type === 'village').map((e) => e.x);
  assert.deepEqual(villages, [120]);
});

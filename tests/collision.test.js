import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../js/player.js';
import { makeEntity, entityBox } from '../js/world/entities.js';
import { overlaps, collide } from '../js/world/collision.js';

test('overlaps detects intersection; touching edges do not count', () => {
  const a = { left: 0, right: 1, bottom: 0, top: 1 };
  assert.equal(overlaps(a, { left: 0.5, right: 2, bottom: 0.5, top: 2 }), true);
  assert.equal(overlaps(a, { left: 1, right: 2, bottom: 0, top: 1 }), false);
  assert.equal(overlaps(a, { left: 0, right: 1, bottom: 1, top: 2 }), false);
});

test('entities use config sizes and default heights', () => {
  const branch = makeEntity('branch', 5);
  assert.deepEqual(entityBox(branch), { left: 4.65, right: 5.35, bottom: 0.5, top: 2 });
  const refill = makeEntity('refill', 3, 1.45);
  assert.equal(refill.y, 1.45);
});

test('each entity is reported once', () => {
  const p = createPlayer();
  const rock = makeEntity('rock', 0);
  assert.equal(collide(p, [rock]).length, 1);
  assert.equal(collide(p, [rock]).length, 0);
  assert.equal(rock.touched, true);
});

test('puddles only count while standing on the ground', () => {
  const p = createPlayer();
  p.onGround = false;
  const puddle = makeEntity('puddle', 0);
  assert.equal(collide(p, [puddle]).length, 0);
  p.onGround = true;
  assert.deepEqual(collide(p, [puddle]).map((h) => h.type), ['puddle']);
});

test('hits come back nearest first', () => {
  const p = createPlayer();
  const far = makeEntity('village', 0.1);
  const near = makeEntity('rock', -0.05);
  assert.deepEqual(collide(p, [far, near]).map((h) => h.type), ['rock', 'village']);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createEffects } from '../js/render/effects.js';
import { createPlayer } from '../js/player.js';

test('a splash spawns particles that fade out', () => {
  const fx = createEffects();
  fx.ingest([{ type: 'splash' }], createPlayer());
  assert.equal(fx.particleCount, CONFIG.fx.splash.count);
  for (let i = 0; i < 60; i++) fx.update(1 / 60);
  assert.equal(fx.particleCount, 0);
});

test('a filter ripple and a refill sparkle both show', () => {
  const fx = createEffects();
  fx.ingest([{ type: 'clean' }, { type: 'refill' }], createPlayer());
  assert.equal(fx.particleCount, 1 + CONFIG.fx.sparkle.count);
});

test('landing squashes the can, then it returns to normal', () => {
  const fx = createEffects();
  const p = createPlayer();
  fx.ingest([{ type: 'land' }], p);
  assert.ok(fx.canTransform(p).sy < 1);
  for (let i = 0; i < 60; i++) fx.update(1 / 60);
  assert.deepEqual(fx.canTransform(p), { sx: 1, sy: 1, tilt: 0 });
});

test('the can stretches in the air, within the limit', () => {
  const fx = createEffects();
  const p = Object.assign(createPlayer(), { onGround: false, vy: 50 });
  assert.equal(fx.canTransform(p).sy, 1 + CONFIG.fx.squash.maxStretch);
});

test('reduced motion: no particles, no squash, a short color flash instead', () => {
  const fx = createEffects();
  fx.setReducedMotion(true);
  const p = createPlayer();
  fx.ingest([{ type: 'splash' }, { type: 'land' }], p);
  assert.equal(fx.particleCount, 0);
  assert.deepEqual(fx.canTransform(p), { sx: 1, sy: 1, tilt: 0 });
  assert.equal(fx.flashColor(), CONFIG.colors.dustyBlue);
  for (let i = 0; i < 30; i++) fx.update(1 / 60);
  assert.equal(fx.flashColor(), null);
});

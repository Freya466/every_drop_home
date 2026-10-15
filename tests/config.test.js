import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, COPY } from '../js/config.js';

test('every obstacle pattern uses known entity types', () => {
  for (const pattern of Object.values(CONFIG.patterns)) {
    for (const { type } of pattern) assert.ok(CONFIG.entities[type], `unknown type ${type}`);
  }
});

test('every weighted pattern exists', () => {
  for (const weights of CONFIG.segments.weights) {
    for (const key of Object.keys(weights)) assert.ok(CONFIG.patterns[key], `unknown pattern ${key}`);
  }
});

test('walking can fits under a branch but does not reach low pickups', () => {
  assert.ok(CONFIG.can.h < CONFIG.entities.branch.y);
  assert.ok(CONFIG.can.h < CONFIG.pickupY.low);
});

test('refills never fall inside a village safe zone', () => {
  const W = CONFIG.world;
  for (let x = W.refillFirstM; x < 10 * W.segmentM; x += W.refillEveryM) {
    const toVillage = Math.min(x % W.segmentM, W.segmentM - (x % W.segmentM));
    assert.ok(toVillage > W.villageSafeM, `refill at ${x} m is inside a safe zone`);
  }
});

test('gaps tighten each segment', () => {
  const { gaps } = CONFIG.segments;
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i][0] < gaps[i - 1][0]);
});

test('colors are valid hex', () => {
  for (const hex of Object.values(CONFIG.colors)) assert.match(hex, /^#[0-9A-F]{6}$/i);
});

test('key copy matches the spec', () => {
  assert.equal(COPY.happyTitle, 'You delivered all 20 liters!');
  assert.equal(COPY.spilledTitle, 'The can ran dry before the next village.');
  assert.equal(COPY.donateNote, '100% of public donations go directly to water projects.');
  assert.equal(CONFIG.donateUrl, 'https://www.charitywater.org/');
});

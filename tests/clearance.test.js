import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { group, runPast, clearWindowS, twoJumpsCanClear, TAP_S, HOLD_S } from './helpers/sim.js';

const P = CONFIG.patterns;
const MIN_WINDOW_S = 0.25;

test('walking into a rock or bush hits it', () => {
  assert.deepEqual(runPast(group(P.rock)), ['rock']);
  assert.deepEqual(runPast(group(P.bush)), ['bush']);
});

test('a tap clears a rock with a fair timing window', () => {
  assert.ok(clearWindowS(group(P.rock), TAP_S) >= MIN_WINDOW_S);
});

test('a tap can never clear a bush', () => {
  assert.equal(clearWindowS(group(P.bush), TAP_S), 0);
});

test('a hold clears a bush with a fair timing window', () => {
  assert.ok(clearWindowS(group(P.bush), HOLD_S) >= MIN_WINDOW_S);
});

test('walking under a branch is safe; jumping into it hits', () => {
  assert.deepEqual(runPast(group(P.branch)), []);
  assert.deepEqual(runPast(group(P.branch), [{ atX: -0.6, holdS: TAP_S }]), ['branch']);
});

test('walking through a puddle touches it; a tap can clear it', () => {
  const puddle = group([{ type: 'puddle', dx: 0 }]);
  assert.deepEqual(runPast(puddle), ['puddle']);
  assert.ok(clearWindowS(puddle, TAP_S) >= MIN_WINDOW_S);
});

test('rock then branch: one tap clears both', () => {
  assert.ok(clearWindowS(group(P.rockBranch), TAP_S) >= MIN_WINDOW_S);
});

test('two rocks: two taps clear both', () => {
  assert.ok(twoJumpsCanClear(group(P.rockRock), TAP_S, TAP_S));
});

test('bush then rock: hold then tap clears both', () => {
  assert.ok(twoJumpsCanClear(group(P.bushRock), HOLD_S, TAP_S));
});

test('a walking or jumping can always reaches the village', () => {
  const village = group([{ type: 'village', dx: 0 }]);
  assert.deepEqual(runPast(village), ['village']);
  assert.deepEqual(runPast(village, [{ atX: -0.3, holdS: HOLD_S }]), ['village']);
});

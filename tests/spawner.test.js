import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createSpawner, gapRange, puddleCount } from '../js/world/spawner.js';
import { isObstacle } from '../js/world/entities.js';

const W = CONFIG.world;
const SEEDS = 150;
const SEGMENTS = 8;
const EPS = 1e-9;

function* allSegments() {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const spawner = createSpawner(createRng(seed));
    for (let n = 1; n <= SEGMENTS; n++) yield { seed, n, ents: spawner.generateSegment(n) };
  }
}
const left = (e) => e.x - e.w / 2;
const right = (e) => e.x + e.w / 2;
const gapBetween = (a, b) => Math.max(left(a) - right(b), left(b) - right(a));

test('fixed positions: village, refills, filter', () => {
  for (const { n, ents } of allSegments()) {
    const start = (n - 1) * W.segmentM;
    const xs = (type) => ents.filter((e) => e.type === type).map((e) => e.x);
    assert.deepEqual(xs('village'), [n * W.segmentM]);
    assert.deepEqual(xs('refill'), [start + 15, start + 45]);
    assert.deepEqual(xs('filter'), [start + 50]);
  }
});

test('no obstacles in the first 5 m or near any village', () => {
  for (const { n, ents } of allSegments()) {
    const start = (n - 1) * W.segmentM;
    const safeFrom = start + (n === 1 ? W.startEmptyM : W.villageSafeM);
    const safeTo = n * W.segmentM - W.villageSafeM;
    for (const e of ents.filter(isObstacle)) {
      assert.ok(left(e) >= safeFrom - EPS && right(e) <= safeTo + EPS, `segment ${n}: ${e.type} at ${e.x}`);
    }
  }
});

test('puddles: none in segment 1, one in 2–3, two from 4, inside 20–40 m', () => {
  for (const { n, ents } of allSegments()) {
    const start = (n - 1) * W.segmentM;
    const puddles = ents.filter((e) => e.type === 'puddle');
    assert.equal(puddles.length, puddleCount(n));
    for (const p of puddles) assert.ok(p.x >= start + 20 && p.x <= start + 40);
  }
  assert.deepEqual([1, 2, 3, 4, 9].map(puddleCount), [0, 1, 1, 2, 2]);
});

test('new obstacle types appear in the right segments', () => {
  for (const { n, ents } of allSegments()) {
    const kinds = new Set(ents.filter(isObstacle).map((e) => e.type));
    if (n === 1) assert.deepEqual([...kinds].filter((k) => k !== 'rock'), []);
    if (n === 2) assert.ok(!kinds.has('branch'));
  }
});

test('no random obstacle within 1.5 m of a refill, filter or puddle', () => {
  for (const { n, ents } of allSegments()) {
    const keepClear = ents.filter((e) => ['refill', 'filter', 'puddle'].includes(e.type));
    for (const o of ents.filter((e) => isObstacle(e) && !e.setPiece)) {
      for (const k of keepClear) {
        assert.ok(gapBetween(o, k) >= W.pickupClearM - EPS, `segment ${n}: ${o.type} at ${o.x} near ${k.type} at ${k.x}`);
      }
    }
  }
});

test('high-jump obstacles are at least 2.5 m apart', () => {
  for (const { ents } of allSegments()) {
    const held = ents.filter((e) => CONFIG.heldJumpTypes.includes(e.type));
    for (let i = 1; i < held.length; i++) assert.ok(held[i].x - held[i - 1].x >= W.heldJumpMinSpacingM - EPS);
  }
});

test('no branch directly after a puddle', () => {
  for (const { ents } of allSegments()) {
    for (const p of ents.filter((e) => e.type === 'puddle')) {
      for (const b of ents.filter((e) => e.type === 'branch')) {
        const after = left(b) - right(p);
        assert.ok(!(after >= 0 && after < W.branchAfterPuddleM), `branch ${after} m after puddle`);
      }
    }
  }
});

test('random gaps respect the segment minimum', () => {
  for (const { n, ents } of allSegments()) {
    const groups = new Map();
    for (const e of ents.filter((e) => isObstacle(e) && !e.setPiece)) {
      if (!groups.has(e.group)) groups.set(e.group, []);
      groups.get(e.group).push(e);
    }
    const ordered = [...groups.values()];
    for (let i = 1; i < ordered.length; i++) {
      const gap = ordered[i][0].x - ordered[i - 1].at(-1).x;
      assert.ok(gap >= gapRange(n)[0] - EPS, `segment ${n}: gap ${gap}`);
    }
  }
});

test('gap ranges shrink 10% per segment from 5, floored at 1.8 m', () => {
  assert.deepEqual(gapRange(1), [6, 9]);
  assert.deepEqual(gapRange(4), [2.5, 4]);
  const [min5, max5] = gapRange(5);
  assert.ok(Math.abs(min5 - 2.25) < EPS && Math.abs(max5 - 3.6) < EPS);
  assert.deepEqual(gapRange(30), [1.8, 1.8]);
});

test('average obstacle counts roughly match the spec', () => {
  const totals = new Array(SEGMENTS + 1).fill(0);
  for (const { n, ents } of allSegments()) totals[n] += ents.filter((e) => isObstacle(e) && !e.setPiece).length;
  const avg = (n) => totals[n] / SEEDS;
  assert.ok(avg(1) >= 3.5 && avg(1) <= 7.5, `segment 1 avg ${avg(1)}`);
  assert.ok(avg(4) >= 9 && avg(4) <= 18, `segment 4 avg ${avg(4)}`);
  assert.ok(avg(4) > avg(1));
});

test('the same seed builds the same world', () => {
  const strip = (ents) => ents.map(({ type, x, y }) => [type, x, y]);
  const a = createSpawner(createRng(9));
  const b = createSpawner(createRng(9));
  for (let n = 1; n <= 5; n++) assert.deepEqual(strip(a.generateSegment(n)), strip(b.generateSegment(n)));
});

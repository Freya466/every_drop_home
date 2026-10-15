import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, randRange, pickWeighted } from '../js/rng.js';

test('same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});

test('values are in [0, 1)', () => {
  const rng = createRng(7);
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
  }
});

test('randRange stays inside the range', () => {
  const rng = createRng(1);
  for (let i = 0; i < 1000; i++) {
    const v = randRange(rng, [6, 9]);
    assert.ok(v >= 6 && v < 9);
  }
});

test('pickWeighted follows weights and never picks zero weight', () => {
  const rng = createRng(3);
  const counts = { a: 0, b: 0, never: 0 };
  for (let i = 0; i < 10000; i++) counts[pickWeighted(rng, { a: 0.75, b: 0.25, never: 0 })]++;
  assert.equal(counts.never, 0);
  assert.ok(counts.a > 7000 && counts.a < 8000);
});

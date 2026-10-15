import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { computeScale, createCamera } from '../js/render/renderer.js';

const V = CONFIG.view;

test('desktop screens use 200–250 px per meter', () => {
  assert.equal(computeScale(1280, 720), 240);
  assert.equal(computeScale(1920, 1080), V.ppmMax);
});

test('phones zoom out so at least minViewWidthM of world shows', () => {
  for (const [w, h] of [[844, 390], [390, 844], [360, 640]]) {
    const ppm = computeScale(w, h);
    assert.ok(w / ppm >= V.minViewWidthM - 1e-9, `${w}x${h} shows ${w / ppm} m`);
  }
});

test('tiny screens stop at ppmMin', () => {
  assert.equal(computeScale(100, 100), V.ppmMin);
});

test('camera keeps the can at canScreenXM and the ground at groundRatio', () => {
  const cam = createCamera(1280, 720, 100);
  assert.ok(Math.abs(cam.toX(100) - V.canScreenXM * cam.ppm) < 1e-6);
  assert.equal(cam.toY(0), 720 * V.groundRatio);
  assert.equal(cam.toY(1), 720 * V.groundRatio - cam.ppm);
  assert.ok(cam.right - cam.left >= V.minViewWidthM);
});

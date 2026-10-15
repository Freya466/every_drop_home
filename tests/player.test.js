import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createPlayer, updatePlayer, playerHitbox, makeInvincible, isInvincible } from '../js/player.js';

const TAP_S = 0.045; // not a multiple of a 60 Hz or 120 Hz frame, so both hold for the same time
const HOLD_S = 0.4;

function jumpPeak(holdS, dt) {
  const p = createPlayer();
  p.jumpQueued = true;
  let held = 0;
  let peak = 0;
  do {
    p.holding = held < holdS;
    held += dt;
    updatePlayer(p, dt);
    peak = Math.max(peak, p.y);
  } while (!p.onGround);
  return peak;
}

test('walks at a constant 1.2 m/s', () => {
  const p = createPlayer();
  for (let i = 0; i < 60; i++) updatePlayer(p, 1 / 60);
  assert.ok(Math.abs(p.x - 1.2) < 1e-9);
});

test('jump height is the same at 60 Hz and 120 Hz', () => {
  for (const holdS of [TAP_S, HOLD_S]) {
    const a = jumpPeak(holdS, 1 / 60);
    const b = jumpPeak(holdS, 1 / 120);
    assert.ok(Math.abs(a - b) / b < 0.02, `peaks ${a} vs ${b}`);
  }
});

test('holding jumps clearly higher than tapping', () => {
  assert.ok(jumpPeak(HOLD_S, 1 / 120) > jumpPeak(TAP_S, 1 / 120) + 0.3);
});

test('tap reaches low and over-rock pickups; only a hold reaches high ones', () => {
  const { h } = CONFIG.can;
  const Y = CONFIG.pickupY;
  const tapTop = jumpPeak(TAP_S, 1 / 120) + h;
  const holdTop = jumpPeak(HOLD_S, 1 / 120) + h;
  assert.ok(tapTop > Y.overRock + 0.1);
  assert.ok(tapTop < Y.high);
  assert.ok(holdTop > Y.high + 0.1);
});

test('a jump only starts from the ground', () => {
  const p = createPlayer();
  p.jumpQueued = true;
  updatePlayer(p, 1 / 60);
  for (let i = 0; i < 20; i++) updatePlayer(p, 1 / 60);
  const vyBefore = p.vy;
  p.jumpQueued = true;
  updatePlayer(p, 1 / 60);
  assert.ok(p.vy < vyBefore);
  assert.equal(p.jumpQueued, false);
});

test('jumped and landed are each true for exactly one frame', () => {
  const p = createPlayer();
  p.jumpQueued = true;
  let jumped = 0;
  let landed = 0;
  for (let i = 0; i < 240; i++) {
    updatePlayer(p, 1 / 120);
    jumped += p.jumped ? 1 : 0;
    landed += p.landed ? 1 : 0;
  }
  assert.equal(jumped, 1);
  assert.equal(landed, 1);
  assert.equal(p.y, 0);
});

test('invincibility lasts invincibleS', () => {
  const p = createPlayer();
  makeInvincible(p);
  for (let i = 0; i < 30; i++) updatePlayer(p, 1 / 60);
  assert.equal(isInvincible(p), true);
  for (let i = 0; i < 31; i++) updatePlayer(p, 1 / 60);
  assert.equal(isInvincible(p), false);
});

test('hitbox is centered on x and sits on y', () => {
  const p = createPlayer();
  p.x = 10;
  p.y = 0.5;
  const { w, h } = CONFIG.can;
  assert.deepEqual(playerHitbox(p), { left: 10 - w / 2, right: 10 + w / 2, bottom: 0.5, top: 0.5 + h });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, COPY } from '../js/config.js';
import { createState } from '../js/state.js';
import { createPlayer, updatePlayer } from '../js/player.js';
import { updateRules, computeScore, segmentAt } from '../js/rules.js';

function setup(overrides = {}) {
  const state = Object.assign(createState(), { phase: 'playing' }, overrides);
  return { state, player: createPlayer() };
}
const hit = (type) => ({ type, entity: { x: 0 } });
const types = (state) => state.events.map((e) => e.type);

// --- obstacles and spilling (Task 7) ---

test('a hit costs one level, starts invincibility and splashes', () => {
  const { state, player } = setup();
  updateRules([hit('rock')], state, player, 1 / 60);
  assert.equal(state.water, 4);
  assert.ok(player.invincibleTimer > 0);
  assert.deepEqual(types(state), ['splash']);
});

test('hits during invincibility are ignored; after it ends they count', () => {
  const { state, player } = setup();
  updateRules([hit('rock')], state, player, 1 / 60);
  updateRules([hit('bush')], state, player, 1 / 60);
  assert.equal(state.water, 4);
  for (let i = 0; i < 61; i++) updatePlayer(player, 1 / 60);
  updateRules([hit('branch')], state, player, 1 / 60);
  assert.equal(state.water, 3);
});

test('emptying the can with a hit gives the spilled ending', () => {
  const { state, player } = setup({ water: 1 });
  updateRules([hit('rock')], state, player, 1 / 60);
  assert.equal(state.water, 0);
  assert.equal(state.phase, 'ended');
  assert.equal(state.ending, 'spilled');
  assert.ok(types(state).includes('ended'));
});

test('a hit with half a level left spills to exactly 0', () => {
  const { state, player } = setup({ water: 0.5 });
  updateRules([hit('rock')], state, player, 1 / 60);
  assert.equal(state.water, 0);
  assert.equal(state.ending, 'spilled');
});

test('distance, segment and live score follow the can', () => {
  const { state, player } = setup();
  player.x = 125.7;
  updateRules([], state, player, 1 / 60);
  assert.equal(state.distance, 125.7);
  assert.equal(state.segment, 3);
  assert.equal(state.score, 12);
  assert.equal(segmentAt(59.99), 1);
  assert.equal(segmentAt(60), 2);
});

test('nothing changes unless playing', () => {
  const { state, player } = setup({ phase: 'paused' });
  player.x = 50;
  updateRules([hit('rock')], state, player, 1 / 60);
  assert.equal(state.water, 5);
  assert.equal(state.distance, 0);
});

test('high score updates at the end only when beaten', () => {
  const beat = setup({ water: 1, highScore: 3 });
  beat.player.x = 100;
  updateRules([hit('rock')], beat.state, beat.player, 1 / 60);
  assert.equal(beat.state.highScore, 10);
  assert.equal(beat.state.isNewHighScore, true);

  const miss = setup({ water: 1, highScore: 50 });
  miss.player.x = 100;
  updateRules([hit('rock')], miss.state, miss.player, 1 / 60);
  assert.equal(miss.state.highScore, 50);
  assert.equal(miss.state.isNewHighScore, false);
});

// --- villages, deliveries, scoring (Task 9) ---

test('a clean delivery drops one level, banks 4 L and +10, shows a pop-up', () => {
  const { state, player } = setup();
  updateRules([hit('village')], state, player, 1 / 60);
  assert.equal(state.water, 4);
  assert.equal(state.cleanDeliveries, 1);
  assert.equal(state.litersDelivered, 4);
  assert.deepEqual(state.popup, { liters: 4, points: 10, clean: true, line: COPY.impactLines[0], timeLeft: CONFIG.popupS });
  assert.deepEqual(types(state), ['deliver']);
});

test('a dirty delivery scores +5 and the water stays dirty', () => {
  const { state, player } = setup({ dirty: true });
  updateRules([hit('village')], state, player, 1 / 60);
  assert.equal(state.dirtyDeliveries, 1);
  assert.equal(state.popup.points, 5);
  assert.equal(state.dirty, true);
  assert.equal(state.score, 5);
});

test('the pop-up disappears after popupS without pausing play', () => {
  const { state, player } = setup();
  updateRules([hit('village')], state, player, 1 / 60);
  for (let t = 0; t < CONFIG.popupS + 0.05; t += 1 / 60) updateRules([], state, player, 1 / 60);
  assert.equal(state.popup, null);
  assert.equal(state.phase, 'playing');
});

test('delivering the last level gives the happy ending with ×1.5', () => {
  const { state, player } = setup({ water: 1, cleanDeliveries: 3 });
  player.x = 240;
  updateRules([hit('village')], state, player, 1 / 60);
  assert.equal(state.phase, 'ended');
  assert.equal(state.ending, 'happy');
  assert.equal(state.score, Math.floor((24 + 40) * 1.5));
});

test('half a level at a village delivers 2 L and still ends happy', () => {
  const { state, player } = setup({ water: 0.5 });
  updateRules([hit('village')], state, player, 1 / 60);
  assert.equal(state.litersDelivered, 2);
  assert.equal(state.popup.liters, 2);
  assert.equal(state.ending, 'happy');
});

test('spec score examples', () => {
  const casual = Object.assign(createState(), { distance: 216, cleanDeliveries: 2, dirtyDeliveries: 1, ending: 'spilled' });
  assert.equal(computeScore(casual), 46);
  const skilled = Object.assign(createState(), { distance: 400, cleanDeliveries: 6, ending: 'happy' });
  assert.equal(computeScore(skilled), 150);
});

test('hits after the run ends in the same frame are ignored', () => {
  const { state, player } = setup({ water: 1 });
  updateRules([hit('rock'), hit('village')], state, player, 1 / 60);
  assert.equal(state.ending, 'spilled');
  assert.equal(state.cleanDeliveries, 0);
});

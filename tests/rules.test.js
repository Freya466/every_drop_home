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

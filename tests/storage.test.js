import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { loadHighScore, saveHighScore, loadSettings, saveSettings } from '../js/storage.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)) };
}
const throwingStorage = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
};
const K = CONFIG.storageKeys;

test('high score round-trips', () => {
  const s = memoryStorage();
  assert.equal(loadHighScore(s), 0);
  assert.equal(saveHighScore(42, s), true);
  assert.equal(loadHighScore(s), 42);
});

test('blocked or missing storage never throws', () => {
  assert.equal(loadHighScore(throwingStorage), 0);
  assert.equal(saveHighScore(5, throwingStorage), false);
  assert.equal(loadHighScore(null), 0);
  assert.equal(saveHighScore(5, null), true);
});

test('corrupted high scores read as 0', () => {
  for (const bad of ['abc', '-5', '', 'NaN']) assert.equal(loadHighScore(memoryStorage({ [K.highScore]: bad })), 0);
});

test('settings default to the OS reduced-motion preference', () => {
  assert.deepEqual(loadSettings(memoryStorage(), true), { reducedMotion: true, muted: false });
  assert.deepEqual(loadSettings(throwingStorage, false), { reducedMotion: false, muted: false });
});

test('saved settings win; bad JSON or wrong types fall back to defaults', () => {
  const s = memoryStorage();
  saveSettings({ reducedMotion: false, muted: true }, s);
  assert.deepEqual(loadSettings(s, true), { reducedMotion: false, muted: true });
  assert.deepEqual(loadSettings(memoryStorage({ [K.settings]: '{oops' }), true), { reducedMotion: true, muted: false });
  assert.deepEqual(loadSettings(memoryStorage({ [K.settings]: '{"muted":"yes"}' }), false), { reducedMotion: false, muted: false });
});

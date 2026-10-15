import { createGame, startRun, resetRun, togglePause, pauseIfPlaying, clampDt, stepGame } from './game.js';
import { createInput } from './input.js';
import { createRenderer } from './render/renderer.js';
import { createEffects } from './render/effects.js';
import { createUI } from './ui.js';
import { createAudio } from './audio.js';
import { loadHighScore, saveHighScore, loadSettings, saveSettings } from './storage.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let settings = loadSettings(undefined, prefersReducedMotion);

const game = createGame({ highScore: loadHighScore() });
const effects = createEffects();
const audio = createAudio();
const renderer = createRenderer(document.getElementById('game-canvas'));
const input = createInput({
  keyTarget: window,
  pointerTarget: document.getElementById('game'),
  isActive: () => game.state.phase === 'playing',
  onPause: () => togglePause(game),
});

function applySettings(next) {
  settings = next;
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  effects.setReducedMotion(settings.reducedMotion);
  audio.setMuted(settings.muted);
}

function begin() {
  input.clear();
  effects.clear();
  audio.unlock();
  startRun(game);
}

const ui = createUI({
  settings,
  onStart: begin,
  onPause: () => togglePause(game),
  onResume: () => togglePause(game),
  onPlayAgain: () => {
    resetRun(game);
    begin();
  },
  onSettingsChange: (next) => {
    saveSettings(next);
    applySettings(next);
  },
});
applySettings(settings);

// Leaving the tab or window pauses the walk.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseIfPlaying(game);
});
window.addEventListener('blur', () => pauseIfPlaying(game));

let last = performance.now();
function frame(now) {
  const rawDt = (now - last) / 1000;
  last = now;
  const events = stepGame(game, input, rawDt);
  effects.ingest(events, game.player);
  if (game.state.phase === 'playing') effects.update(clampDt(rawDt));
  for (const e of events) audio.play(e.type);
  if (events.some((e) => e.type === 'ended')) saveHighScore(game.state.highScore);
  renderer.draw(game.state, game.player, game.world.entities, effects);
  ui.update(game.state, events);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

import { createGame, startRun, resetRun, togglePause, stepGame } from './game.js';
import { createInput } from './input.js';
import { createRenderer } from './render/renderer.js';
import { createUI } from './ui.js';
import { loadHighScore, saveHighScore, loadSettings, saveSettings } from './storage.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let settings = loadSettings(undefined, prefersReducedMotion);

const game = createGame({ highScore: loadHighScore() });
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
}

function begin() {
  input.clear();
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

let last = performance.now();
function frame(now) {
  const rawDt = (now - last) / 1000;
  last = now;
  const events = stepGame(game, input, rawDt);
  if (events.some((e) => e.type === 'ended')) saveHighScore(game.state.highScore);
  renderer.draw(game.state, game.player, game.world.entities);
  ui.update(game.state, events);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

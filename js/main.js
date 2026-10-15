import { createGame, startRun, resetRun, togglePause, stepGame } from './game.js';
import { createInput } from './input.js';
import { createRenderer } from './render/renderer.js';
import { createUI } from './ui.js';

const game = createGame();
const renderer = createRenderer(document.getElementById('game-canvas'));
const input = createInput({
  keyTarget: window,
  pointerTarget: document.getElementById('game'),
  isActive: () => game.state.phase === 'playing',
  onPause: () => togglePause(game),
});

function begin() {
  input.clear();
  startRun(game);
}

const ui = createUI({
  onStart: begin,
  onPause: () => togglePause(game),
  onResume: () => togglePause(game),
  onPlayAgain: () => {
    resetRun(game);
    begin();
  },
});

let last = performance.now();
function frame(now) {
  const rawDt = (now - last) / 1000;
  last = now;
  const events = stepGame(game, input, rawDt);
  renderer.draw(game.state, game.player, game.world.entities);
  ui.update(game.state, events);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

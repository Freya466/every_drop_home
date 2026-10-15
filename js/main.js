import { createGame, startRun, stepGame } from './game.js';
import { createInput } from './input.js';
import { createRenderer } from './render/renderer.js';

const game = createGame();
const renderer = createRenderer(document.getElementById('game-canvas'));
const input = createInput({
  keyTarget: window,
  pointerTarget: document.getElementById('game'),
  isActive: () => game.state.phase === 'playing',
});
startRun(game); // temporary: the start screen replaces this in Task 8

let last = performance.now();
function frame(now) {
  const rawDt = (now - last) / 1000;
  last = now;
  stepGame(game, input, rawDt);
  renderer.draw(game.state, game.player, game.world.entities);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

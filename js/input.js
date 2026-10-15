import { CONFIG } from './config.js';

const JUMP_KEY = 'Space';
const PAUSE_KEYS = ['Escape', 'KeyP'];

// Turns Space / tap / hold into intents. Never moves the can itself.
// keyTarget: usually window. pointerTarget: the game area.
// isActive(): true while playing; otherwise Space is left alone (so it can press focused buttons).
export function createInput({ keyTarget, pointerTarget, isActive = () => true, onPause = () => {} }) {
  let pressed = false;
  let requestAge = null; // seconds since an unused jump press; null = none

  function press() {
    pressed = true;
    requestAge = 0;
  }
  function release() {
    pressed = false;
  }

  keyTarget.addEventListener('keydown', (e) => {
    if (PAUSE_KEYS.includes(e.code)) {
      if (!e.repeat) onPause();
      return;
    }
    if (e.code !== JUMP_KEY || !isActive()) return;
    e.preventDefault();
    if (!e.repeat) press();
  });
  keyTarget.addEventListener('keyup', (e) => {
    if (e.code === JUMP_KEY) release();
  });
  keyTarget.addEventListener('blur', release);
  keyTarget.addEventListener('pointerup', release);
  keyTarget.addEventListener('pointercancel', release);

  pointerTarget.addEventListener('pointerdown', (e) => {
    if (!isActive() || e.target?.closest?.('[data-no-jump]')) return;
    e.preventDefault();
    press();
  });

  return {
    apply(player, dt) {
      player.holding = pressed;
      if (requestAge === null) return;
      if (player.onGround) {
        player.jumpQueued = true;
        requestAge = null;
        return;
      }
      requestAge += dt;
      if (requestAge > CONFIG.jump.bufferS) requestAge = null;
    },
    clear() {
      pressed = false;
      requestAge = null;
    },
  };
}

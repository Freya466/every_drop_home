import { CONFIG } from '../../js/config.js';
import { createPlayer, updatePlayer } from '../../js/player.js';
import { makeEntity } from '../../js/world/entities.js';
import { collide } from '../../js/world/collision.js';

export const DT = 1 / 120;
export const TAP_S = 0.05;
export const HOLD_S = 0.4;

// Fresh entities from a pattern [{ type, dx }], first one at x = 0.
export function group(pattern) {
  return () => pattern.map(({ type, dx }) => makeEntity(type, dx));
}

// Walks the can past the entities, pressing jump when the can's center reaches each atX
// and holding for holdS. Returns the types of everything touched.
export function runPast(makeEntities, jumps = [], dt = DT) {
  const entities = makeEntities();
  const p = createPlayer();
  p.x = Math.min(...entities.map((e) => e.x)) - 3;
  const end = Math.max(...entities.map((e) => e.x + e.w / 2)) + CONFIG.can.w;
  const queue = [...jumps].sort((a, b) => a.atX - b.atX);
  const hits = [];
  let holdLeft = 0;
  while (p.x < end) {
    if (queue.length && p.onGround && p.x >= queue[0].atX) {
      holdLeft = queue.shift().holdS;
      p.jumpQueued = true;
    }
    p.holding = holdLeft > 0;
    holdLeft -= dt;
    updatePlayer(p, dt);
    hits.push(...collide(p, entities).map((h) => h.type));
  }
  return hits;
}

// Seconds of timing window in which one jump (held holdS) touches nothing.
export function clearWindowS(makeEntities, holdS, step = 0.005) {
  let clear = 0;
  for (let atX = -2.5; atX <= 0.5; atX += step) {
    if (runPast(makeEntities, [{ atX, holdS }]).length === 0) clear++;
  }
  return (clear * step) / CONFIG.speed;
}

// True if some pair of jump timings touches nothing.
export function twoJumpsCanClear(makeEntities, holdA, holdB, step = 0.02) {
  const last = Math.max(...makeEntities().map((e) => e.x));
  for (let a = -2.5; a <= 0.5; a += step) {
    for (let b = a + 0.3; b <= last + 0.5; b += step) {
      if (runPast(makeEntities, [{ atX: a, holdS: holdA }, { atX: b, holdS: holdB }]).length === 0) return true;
    }
  }
  return false;
}

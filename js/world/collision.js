import { playerHitbox } from '../player.js';
import { entityBox } from './entities.js';

export function overlaps(a, b) {
  return a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;
}

// Reports what the can touched, each entity once, nearest first.
// Puddles only count while the can stands on the ground, so jumping over is safe.
export function collide(player, entities) {
  const box = playerHitbox(player);
  const hits = [];
  for (const e of entities) {
    if (e.touched) continue;
    if (e.type === 'puddle' && !player.onGround) continue;
    if (overlaps(box, entityBox(e))) {
      e.touched = true;
      hits.push({ type: e.type, entity: e });
    }
  }
  return hits.sort((a, b) => a.entity.x - b.entity.x);
}

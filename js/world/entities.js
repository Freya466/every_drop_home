import { CONFIG } from '../config.js';

export const OBSTACLE_TYPES = ['rock', 'bush', 'branch'];

let nextId = 1;

// x = center (m). y = bottom edge; defaults to the type's height from config.
export function makeEntity(type, x, y = CONFIG.entities[type].y, extra = {}) {
  const { w, h } = CONFIG.entities[type];
  return { id: nextId++, type, x, y, w, h, touched: false, ...extra };
}

export function entityBox(e) {
  return { left: e.x - e.w / 2, right: e.x + e.w / 2, bottom: e.y, top: e.y + e.h };
}

export function isObstacle(e) {
  return OBSTACLE_TYPES.includes(e.type);
}

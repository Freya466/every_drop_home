import { CONFIG } from '../config.js';
import { createSpawner } from './spawner.js';
import { collide } from './collision.js';

export function createWorld(rng) {
  return { spawner: createSpawner(rng), entities: [], segmentsBuilt: 0 };
}

// Builds whole segments ahead of the can and drops entities left behind.
export function updateWorld(world, playerX) {
  const { segmentM, spawnAheadM, despawnBehindM } = CONFIG.world;
  while (world.segmentsBuilt * segmentM < playerX + spawnAheadM) {
    world.segmentsBuilt += 1;
    world.entities.push(...world.spawner.generateSegment(world.segmentsBuilt));
  }
  world.entities = world.entities.filter((e) => e.x + e.w / 2 > playerX - despawnBehindM);
}

export function collideWorld(world, player) {
  return collide(player, world.entities);
}

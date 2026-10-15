import { CONFIG } from '../config.js';
import { makeEntity } from './entities.js';
import { randRange } from '../rng.js';

const W = CONFIG.world;

// Starter spawner: segment-1 rocks in every segment. Task 11 replaces it with the full segment rules.
export function createSpawner(rng) {
  return {
    generateSegment(n) {
      const start = (n - 1) * W.segmentM;
      const limit = n * W.segmentM - W.villageSafeM;
      const half = CONFIG.entities.rock.w / 2;
      const out = [];
      let cursor = start + (n === 1 ? W.startEmptyM : W.villageSafeM);
      for (;;) {
        const x = cursor + randRange(rng, CONFIG.segments.gaps[0]);
        if (x + half > limit) break;
        out.push(makeEntity('rock', x));
        cursor = x;
      }
      return out;
    },
  };
}

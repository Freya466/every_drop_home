import { CONFIG } from '../config.js';
import { makeEntity } from './entities.js';
import { randRange, pickWeighted } from '../rng.js';

const W = CONFIG.world;

export function gapRange(segment) {
  const { gaps, lateShrink, gapFloorM } = CONFIG.segments;
  if (segment <= gaps.length) return gaps[segment - 1];
  const factor = lateShrink ** (segment - gaps.length);
  const [min, max] = gaps[gaps.length - 1];
  return [Math.max(gapFloorM, min * factor), Math.max(gapFloorM, max * factor)];
}

export function weightsFor(segment) {
  const { weights } = CONFIG.segments;
  return weights[Math.min(segment, weights.length) - 1];
}

export function puddleCount(segment) {
  if (segment < W.puddlesFromSegment) return 0;
  return segment < W.doublePuddlesFromSegment ? 1 : 2;
}

export function pickupMode(tier, rng) {
  const modes = CONFIG.pickupModes;
  const options = modes[Math.min(Math.max(tier, 1), modes.length) - 1];
  return options[Math.floor(rng() * options.length)];
}

function extent(group) {
  return {
    left: Math.min(...group.map((e) => e.x - e.w / 2)),
    right: Math.max(...group.map((e) => e.x + e.w / 2)),
  };
}

// A refill or filter, plus the obstacle that makes it risky, if any.
function placePickup(type, x, mode) {
  const Y = CONFIG.pickupY;
  if (mode === 'low') return [makeEntity(type, x, Y.low)];
  if (mode === 'high') return [makeEntity(type, x, Y.high)];
  if (mode === 'overRock') {
    return [makeEntity(type, x, Y.overRock), makeEntity('rock', x, undefined, { setPiece: true })];
  }
  return [makeEntity(type, x, Y.low), makeEntity('branch', x + CONFIG.setPiece.beforeBranchDx, undefined, { setPiece: true })];
}

export function createSpawner(rng) {
  return {
    // Everything in segment n (1-based): [(n-1)*60, n*60], ending with its village.
    generateSegment(n) {
      const start = (n - 1) * W.segmentM;
      const villageX = n * W.segmentM;
      const out = [makeEntity('village', villageX)];
      const blocked = []; // [left, right] spans random obstacles must stay out of
      const puddles = [];

      function reserve(group) {
        const { left, right } = extent(group);
        blocked.push([left - W.pickupClearM, right + W.pickupClearM]);
        out.push(...group);
      }

      for (let dx = W.refillFirstM; dx < W.segmentM; dx += W.refillEveryM) {
        reserve(placePickup('refill', start + dx, pickupMode(n, rng)));
      }
      reserve(placePickup('filter', start + W.filterOffsetM, pickupMode(n - CONFIG.filterLagSegments, rng)));

      for (let i = 0; i < puddleCount(n); i++) {
        for (let tries = 0; tries < W.puddleTries; tries++) {
          const x = start + randRange(rng, W.puddleWindowM);
          if (puddles.every((p) => Math.abs(p.x - x) >= W.puddleMinSpacingM)) {
            puddles.push(makeEntity('puddle', x));
            break;
          }
        }
      }
      puddles.forEach((p) => reserve([p]));

      let lastHeldX = -Infinity;
      const isFair = (pattern, x) =>
        pattern.every(({ type, dx }) => {
          const ex = x + dx;
          if (CONFIG.heldJumpTypes.includes(type) && ex - lastHeldX < W.heldJumpMinSpacingM) return false;
          if (type === 'branch') {
            const left = ex - CONFIG.entities.branch.w / 2;
            return !puddles.some((p) => {
              const after = left - (p.x + p.w / 2);
              return after >= 0 && after < W.branchAfterPuddleM;
            });
          }
          return true;
        });

      const range = gapRange(n);
      const weights = weightsFor(n);
      const limit = villageX - W.villageSafeM;
      let cursor = start + (n === 1 ? W.startEmptyM : W.villageSafeM);
      let group = 0;
      for (;;) {
        let x = cursor + randRange(rng, range);
        const wanted = CONFIG.patterns[pickWeighted(rng, weights)];
        let ents;
        let box;
        for (;;) {
          const pattern = isFair(wanted, x) ? wanted : CONFIG.patterns.rock;
          ents = pattern.map(({ type, dx }) => makeEntity(type, x + dx, undefined, { group }));
          box = extent(ents);
          const clash = blocked.find(([bl, br]) => box.left < br && box.right > bl);
          if (!clash) break;
          x += clash[1] - box.left; // slide just past the reserved span
        }
        if (box.right > limit) break;
        out.push(...ents);
        for (const e of ents) if (CONFIG.heldJumpTypes.includes(e.type)) lastHeldX = e.x;
        cursor = ents[ents.length - 1].x;
        group += 1;
      }
      return out.sort((a, b) => a.x - b.x);
    },
  };
}

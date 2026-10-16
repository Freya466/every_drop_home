# Every Drop Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the one-button jerry-can runner from the spec as a static web game that is playable after every task and ends on a charity: water Donate call to action.

**Architecture:** Pure game-logic modules (config, player, input, world, rules, state, game loop) have no DOM access, so they are unit-tested in Node. A thin browser layer (renderer, effects, ui, audio, main) reads state each frame and draws it. Only `rules.js` changes water and score. Positions are in meters and only `renderer.js` turns them into pixels.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Canvas 2D, Web Audio. Tests use Node's built-in `node:test` (Node 24, no npm packages). No build step.

**Spec:** [game_concept.md](../../../game_concept.md) (design) and [CLAUDE.md](../../../CLAUDE.md) (architecture rules and numbers). Read both before starting.

## Global Constraints

- Plain HTML, CSS, vanilla JS (ES modules), HTML canvas. No frameworks, no build step, no npm dependencies.
- Serve over HTTP (VS Code Live Server, or `npx --yes http-server -c-1 -p 8080`); ES module imports fail over `file://`.
- **Only `rules.js` changes water and score.** Collision reports what was hit; rules decides what it means.
- **Renderer and UI only read state**, never change it.
- **Input never moves the can directly**; it sets intents that `player.js` applies.
- **All positions are in meters.** Only `renderer.js` converts to pixels (1 m ≈ 200–250 px on desktop).
- **All numbers live in `config.js`.** Exception taken by this plan: drawing proportions (for example "the handle is 50% of the can's width") stay as local constants in `renderer.js`, because they are art, not tuning.
- **Use delta time (`dt`, seconds)** for all movement so speed is identical on 60 Hz and 120 Hz screens.
- **HUD, pop-ups and screens are DOM elements** over the canvas, not drawn on it.
- Speed is a constant **1.2 m/s**. Start **5 levels** (20 L). Hit **−1 level** then **1 s invincibility**. Refill **+½ level**, max 5. Village delivery **−1 level**. Score `(floor(d/10) + 10·clean + 5·dirty) × (1.5 if happy else 1)`.
- Colors: yellow `#FFC907`, navy `#003366`, dusty blue `#77A8BB`, cream `#FFF7E1`, peach `#FED8C1`, terracotta `#BF6C46`, light gray `#CBCCD1`, near-black `#1A1A1A`, teal `#2A8C88` / `#1F6B68` / `#00A19D`.
- Contrast: never white text on yellow; never yellow text on cream; navy and cream are safe together.
- Copy is hopeful and never guilt-driven. Key lines, verbatim: "You delivered all 20 liters!", "The can ran dry before the next village.", "100% of public donations go directly to water projects."
- Donate links to `https://www.charitywater.org/`. Any statistic must come from charitywater.org; until then use the clearly marked placeholders in `COPY`.

## Review Focus

These inputs are implied by the spec but easy to miss. Each has a test in the task that owns the code.

1. **Long frames and tab switching.** A 5-second hitch or a hidden tab must not teleport the can through obstacles. Expect: each simulated step is capped at `maxDt` (0.05 s), and the game pauses itself when the tab is hidden or the window loses focus. Tests: Task 5 ("a 5-second hitch…", "pauseIfPlaying…"); wiring in Task 14.
2. **Space on a focused button, taps on the HUD or screens.** Pressing Space after clicking "Play again", or tapping the pause button, must not also make the can jump. Expect: no jump. Tests: Task 4 ("pointer down jumps, except on [data-no-jump]", "Space is ignored when not playing", "clear() drops a pending press"); buttons blur themselves (Task 8) and `begin()` clears input (Task 8).
3. **Holding Space and key auto-repeat.** Holding Space produces repeated `keydown` events. Expect: one jump per press, no hopping while held. Test: Task 4 ("holding Space through landing…").
4. **Fractional water.** Half a level left when hit, half a level at a village, refills at the cap. Expect: water never goes below 0 or above 5; half a level delivers 2 L and still earns the happy ending. Tests: Task 7 ("a hit with half a level left…"), Task 9 ("half a level at a village…"), Task 10 ("a refill never goes above 5 levels").
5. **Blocked or corrupted storage.** Private browsing, blocked cookies, or a hand-edited value. Expect: the game runs, the high score reads as 0, nothing throws. Tests: Task 12.

## Working Agreements (agreed with Freya, 2026-10-15)

1. **Game-logic flaws: confirm before fixing.** If building reveals a flaw in game logic (physics, input, spawner, rules, scoring, endings, difficulty, or anything that changes how the game plays compared with the spec or this plan), stop, describe the flaw and the proposed fix, and wait for approval. Then fix it and log it below. Mechanical slips that don't change behavior (typo, import path, syntax) are fixed straight away but still logged. When unsure which kind it is, ask.
2. **Every deviation is documented.** Any difference between this plan and what gets built (code, numbers, files, tests, order) gets a row in the [Deviations Log](#deviations-log) during the task where it happens, and is mentioned in that task's commit message.
3. **Placeholder prompts.** The builder reminds Freya when placeholders first appear on screen (logo wordmark and end fact in Task 8, impact lines in Task 9), and gives a full replacement checklist at the end of Task 14. Statistics are never invented; sourced text comes from Freya.

## Interpretations (decided here; change them if you disagree)

- **Tap vs hold:** a jump starts on press. While the button is held and the can is rising, gravity is reduced for up to 0.3 s. Numbers were checked by simulation: a tap clears a rock (0.36 s timing window) but never a bush; a hold clears a bush (0.34 s window). Task 3 pins this with tests.
- **Two-rock combo** = two rocks 1.8 m apart, cleared with two quick taps.
- **Set-piece obstacles** (the rock under a segment-2 refill, the branch after a "before branch" refill) are exempt from the 1.5 m clearance rule, since the spec requires them. Random obstacles keep 1.5 m clear of the whole set piece.
- **Partial delivery:** half a level at a village delivers 2 L, scores full delivery points, and ends the run happily.
- **Happy-ending score** is rounded down after ×1.5.
- **Late-segment density:** reserved space around pickups and puddles leaves segments 3–4 a little below the spec's "about 12 / about 15" obstacles (they average about 10–11). Tune `CONFIG.segments` after playtesting.
- **Phones:** the camera zooms out below 200 px/m when needed so at least 5 m of world is always visible.
- **Logo:** a text wordmark "charity: water" until the official logo file is added to `assets/images/`.
- **Extra files beyond CLAUDE.md's tree:** `js/game.js` (loop steps 1–4 with no DOM, so it is testable), `js/world/world.js` (owns the entity list), `js/rng.js` (seeded randomness for repeatable tests), `js/audio.js`, `package.json` (only `"type": "module"` and a test script), `tests/`.
- **Loop signatures** differ slightly from CLAUDE.md: `input.apply(player, dt)` (dt for jump buffering) and `rules.update(hits, state, player, dt)` (player for invincibility, dt for the pop-up timer).

## File Structure

```
every-drop-home/
├── package.json             # "type": "module" so Node runs the tests; no dependencies
├── index.html               # canvas + DOM overlays (HUD, pop-up, start/pause/end screens)
├── css/style.css            # brand colors, HUD, pop-up, screens, gauge effects
├── js/
│   ├── config.js            # CONFIG (all numbers) and COPY (all text)
│   ├── rng.js               # seeded random, randRange, pickWeighted
│   ├── state.js             # createState, resetState
│   ├── player.js            # jump physics, hitbox, invincibility
│   ├── input.js             # Space / tap / hold → intents; Esc / P → pause
│   ├── rules.js             # water, deliveries, score, endings
│   ├── game.js              # createGame, startRun, resetRun, togglePause, pauseIfPlaying, stepGame
│   ├── world/
│   │   ├── entities.js      # makeEntity, entityBox, isObstacle
│   │   ├── collision.js     # overlaps, collide
│   │   ├── spawner.js       # segment rules → entities
│   │   └── world.js         # builds segments ahead, drops passed entities
│   ├── render/
│   │   ├── renderer.js      # camera (meters → pixels), all canvas drawing
│   │   └── effects.js       # particles, ripple, squash/stretch, slosh, reduced motion
│   ├── ui.js                # DOM screens, HUD, pop-up, gauge effects
│   ├── storage.js           # high score + settings in localStorage (try/catch)
│   ├── audio.js             # synthesized tones
│   └── main.js              # wires everything; requestAnimationFrame loop
├── tests/                   # node:test files, one per module; helpers/sim.js
└── assets/{images,audio}/   # empty for now; shapes are drawn in code
```

Run all tests at any point with `node --test` (it finds `tests/*.test.js`).

---

### Task 1: Project scaffold, config and seeded random

**Files:**
- Create: `package.json`, `.gitignore`, `js/config.js`, `js/rng.js`, `assets/images/.gitkeep`, `assets/audio/.gitkeep`
- Test: `tests/config.test.js`, `tests/rng.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `CONFIG` and `COPY` (named exports of `js/config.js`; every later task reads numbers and text from here). `createRng(seed) → () => number in [0,1)`, `randRange(rng, [min, max]) → number`, `pickWeighted(rng, { key: weight }) → key` from `js/rng.js`.

- [ ] **Step 1: Create package.json and .gitignore**

`package.json`:
```json
{
  "name": "every-drop-home",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

`.gitignore`:
```
node_modules/
.DS_Store
Thumbs.db
```

Create the empty folders with placeholder files: `assets/images/.gitkeep`, `assets/audio/.gitkeep`.

- [ ] **Step 2: Write the failing tests**

`tests/config.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, COPY } from '../js/config.js';

test('every obstacle pattern uses known entity types', () => {
  for (const pattern of Object.values(CONFIG.patterns)) {
    for (const { type } of pattern) assert.ok(CONFIG.entities[type], `unknown type ${type}`);
  }
});

test('every weighted pattern exists', () => {
  for (const weights of CONFIG.segments.weights) {
    for (const key of Object.keys(weights)) assert.ok(CONFIG.patterns[key], `unknown pattern ${key}`);
  }
});

test('walking can fits under a branch but does not reach low pickups', () => {
  assert.ok(CONFIG.can.h < CONFIG.entities.branch.y);
  assert.ok(CONFIG.can.h < CONFIG.pickupY.low);
});

test('refills never fall inside a village safe zone', () => {
  const W = CONFIG.world;
  for (let x = W.refillFirstM; x < 10 * W.segmentM; x += W.refillEveryM) {
    const toVillage = Math.min(x % W.segmentM, W.segmentM - (x % W.segmentM));
    assert.ok(toVillage > W.villageSafeM, `refill at ${x} m is inside a safe zone`);
  }
});

test('gaps tighten each segment', () => {
  const { gaps } = CONFIG.segments;
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i][0] < gaps[i - 1][0]);
});

test('colors are valid hex', () => {
  for (const hex of Object.values(CONFIG.colors)) assert.match(hex, /^#[0-9A-F]{6}$/i);
});

test('key copy matches the spec', () => {
  assert.equal(COPY.happyTitle, 'You delivered all 20 liters!');
  assert.equal(COPY.spilledTitle, 'The can ran dry before the next village.');
  assert.equal(COPY.donateNote, '100% of public donations go directly to water projects.');
  assert.equal(CONFIG.donateUrl, 'https://www.charitywater.org/');
});
```

`tests/rng.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, randRange, pickWeighted } from '../js/rng.js';

test('same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});

test('values are in [0, 1)', () => {
  const rng = createRng(7);
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
  }
});

test('randRange stays inside the range', () => {
  const rng = createRng(1);
  for (let i = 0; i < 1000; i++) {
    const v = randRange(rng, [6, 9]);
    assert.ok(v >= 6 && v < 9);
  }
});

test('pickWeighted follows weights and never picks zero weight', () => {
  const rng = createRng(3);
  const counts = { a: 0, b: 0, never: 0 };
  for (let i = 0; i < 10000; i++) counts[pickWeighted(rng, { a: 0.75, b: 0.25, never: 0 })]++;
  assert.equal(counts.never, 0);
  assert.ok(counts.a > 7000 && counts.a < 8000);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --test tests/config.test.js tests/rng.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/config.js` and `js/rng.js`.

- [ ] **Step 4: Write config.js**

This is the complete config for the whole game. Later tasks only read from it. Gameplay numbers (jump, sizes, spawn rules) were checked by simulation; Task 3's tests guard them.

`js/config.js`:
```js
// All tuning numbers live here. Positions and sizes are meters, times are seconds.

export const CONFIG = {
  speed: 1.2, // m/s walking pace; never changes
  maxDt: 0.05, // longest step simulated in one frame (tab switches, hitches)

  jump: {
    velocity: 3.6, // m/s upward at take-off
    gravity: 8, // m/s²
    holdGravityScale: 0.3, // gravity multiplier while held and rising
    holdMaxS: 0.3, // hold boost lasts at most this long into a jump
    bufferS: 0.12, // a press this long before landing still jumps on landing
  },

  can: { w: 0.28, h: 0.4, drawW: 0.36, drawH: 0.46 }, // hitbox smaller than the art, to feel fair
  invincibleS: 1,

  water: { startLevels: 5, maxLevels: 5, litersPerLevel: 4, hitCost: 1, refillGain: 0.5, deliveryCost: 1 },
  score: { metersPerPoint: 10, cleanDelivery: 10, dirtyDelivery: 5, happyMultiplier: 1.5 },
  popupS: 2,

  // Hitbox sizes; y = bottom edge above the ground.
  entities: {
    rock: { w: 0.3, h: 0.22, y: 0 },
    bush: { w: 0.45, h: 0.6, y: 0 },
    branch: { w: 0.7, h: 1.5, y: 0.5 }, // hangs low: walk under it, any jump hits it
    puddle: { w: 0.45, h: 0.05, y: 0 },
    refill: { w: 0.3, h: 0.3, y: 0 },
    filter: { w: 0.3, h: 0.3, y: 0 },
    village: { w: 0.2, h: 10, y: 0 }, // tall so delivery happens whether walking or jumping
  },

  // Bottom edge of a refill or filter for each placement style.
  pickupY: { low: 0.5, overRock: 0.6, high: 1.45 },
  // Placement styles by tier. Refills use tier = segment; filters use tier = segment - filterLagSegments.
  pickupModes: [['low'], ['overRock'], ['high', 'beforeBranch']],
  filterLagSegments: 1,
  setPiece: { beforeBranchDx: 1.3 }, // branch this far after a "before branch" pickup

  world: {
    segmentM: 60,
    startEmptyM: 5,
    villageSafeM: 5,
    refillFirstM: 15,
    refillEveryM: 30,
    filterOffsetM: 50,
    puddleWindowM: [20, 40],
    puddlesFromSegment: 2,
    doublePuddlesFromSegment: 4,
    puddleMinSpacingM: 3,
    puddleTries: 20,
    pickupClearM: 1.5,
    heldJumpMinSpacingM: 2.5,
    branchAfterPuddleM: 2.5,
    spawnAheadM: 15,
    despawnBehindM: 3,
  },

  segments: {
    gaps: [[6, 9], [4, 7], [3, 5], [2.5, 4]], // segments 1–4
    lateShrink: 0.9, // segment 5+ multiplies the segment-4 gaps by this once per segment
    gapFloorM: 1.8,
    weights: [
      { rock: 1 },
      { rock: 0.6, bush: 0.4 },
      { rock: 0.4, bush: 0.25, rockRock: 0.2, branch: 0.15 },
      { rock: 0.25, bush: 0.2, branch: 0.15, rockRock: 0.15, rockBranch: 0.125, bushRock: 0.125 },
      { rock: 0.15, bush: 0.15, branch: 0.1, rockRock: 0.2, rockBranch: 0.2, bushRock: 0.2 }, // 5+
    ],
  },

  // Obstacle groups; dx = offset from the group's first obstacle.
  patterns: {
    rock: [{ type: 'rock', dx: 0 }],
    bush: [{ type: 'bush', dx: 0 }],
    branch: [{ type: 'branch', dx: 0 }],
    rockRock: [{ type: 'rock', dx: 0 }, { type: 'rock', dx: 1.8 }], // two quick taps
    rockBranch: [{ type: 'rock', dx: 0 }, { type: 'branch', dx: 1.6 }], // tap, then stay down
    bushRock: [{ type: 'bush', dx: 0 }, { type: 'rock', dx: 2.5 }], // hold, then tap
  },
  heldJumpTypes: ['bush'],

  view: {
    ppmMax: 250, // pixels per meter on large screens (spec: 200–250)
    ppmMin: 70,
    minViewWidthM: 5, // always show at least this much world across
    minViewHeightM: 3,
    canScreenXM: 1.2, // can stands this far from the left edge
    groundRatio: 0.78, // ground line at this fraction of canvas height
    cullMarginM: 4,
    hillParallax: 0.3,
    hillStepPx: 8,
    hillWaves: [[0.7, 1, 0], [1.9, 0.5, 1]], // [frequency per m, weight, phase]
    plains: { base: 0.5, amp: 0.12 }, // segment 1
    hills: { base: 0.9, amp: 0.35 }, // reached by the end of segment 2
    groundDash: { everyM: 0.5, lengthM: 0.2, depthM: 0.06, thicknessM: 0.02 },
  },

  fx: {
    blinkS: 0.1,
    blinkAlpha: 0.4,
    gaugeFxS: 0.6,
    flashS: 0.3, // reduced-motion stand-in for particles
    gravity: 6,
    fan: [0.15, 0.85], // particle launch angles, fractions of π (upward fan)
    splash: { count: 12, speed: [1, 2.2], lifeS: 0.6, size: 0.04 },
    sparkle: { count: 8, speed: [0.3, 0.8], lifeS: 0.7, size: 0.035 },
    dirty: { count: 6, speed: [0.3, 0.9], lifeS: 0.5, size: 0.04 },
    ripple: { lifeS: 0.7, maxRadiusM: 0.5 },
    squash: { landS: 0.15, landSquash: 0.18, airStretchPerMps: 0.04, maxStretch: 0.15 },
    slosh: { durationS: 0.5, amplitudeRad: 0.06, hz: 6 },
  },

  audio: {
    volume: 0.15,
    tones: { jump: [520, 0.08], splash: [180, 0.2], refill: [880, 0.12], clean: [740, 0.15], dirty: [220, 0.15], deliver: [660, 0.3], ended: [440, 0.4] }, // [Hz, seconds]
  },

  colors: {
    yellow: '#FFC907',
    navy: '#003366',
    dustyBlue: '#77A8BB',
    cream: '#FFF7E1',
    peach: '#FED8C1',
    terracotta: '#BF6C46',
    mud: '#7A3F26', // darkened terracotta: dirty water and puddles
    rock: '#CBCCD1',
    text: '#1A1A1A',
    teal: '#2A8C88',
    tealShadow: '#1F6B68',
    tealHighlight: '#00A19D',
  },

  donateUrl: 'https://www.charitywater.org/',
  storageKeys: { highScore: 'edh.highScore', settings: 'edh.settings' },
};

export const COPY = {
  tagline: 'Every drop you carry counts.',
  premise: 'You are the jerry can. Carry clean water home to every village.',
  howTo: 'Tap or press Space to hop. Hold for a high jump. Stay low under branches.',
  happyTitle: 'You delivered all 20 liters!',
  happyBody: 'Every drop made it home.',
  spilledTitle: 'The can ran dry before the next village.',
  spilledBody: 'You made it further than you think. One more walk?',
  // PLACEHOLDER: replace with impact lines sourced from charitywater.org before launch.
  impactLines: ['A family can cook and drink today.', 'Water for a whole household today.', 'One more home reached.'],
  // PLACEHOLDER: replace with one fact sourced from charitywater.org before launch.
  endFact: 'Placeholder: add one sourced charity: water fact about real water collection here.',
  donateNote: '100% of public donations go directly to water projects.',
};
```

- [ ] **Step 5: Write rng.js**

`js/rng.js`:
```js
// Seeded random numbers (mulberry32) so spawner tests are repeatable.
export function createRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(rng, [min, max]) {
  return min + rng() * (max - min);
}

export function pickWeighted(rng, weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = rng() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r < 0) return key;
  }
  return entries[entries.length - 1][0];
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, 11 tests.

- [ ] **Step 7: Commit**

```bash
git add package.json .gitignore assets js/config.js js/rng.js tests/config.test.js tests/rng.test.js
git commit -m "feat: scaffold project with config and seeded random"
```

---

### Task 2: Player jump physics

**Files:**
- Create: `js/player.js`
- Test: `tests/player.test.js`

**Interfaces:**
- Consumes: `CONFIG.speed`, `CONFIG.jump`, `CONFIG.can`, `CONFIG.invincibleS`, `CONFIG.pickupY`.
- Produces (from `js/player.js`):
  - `createPlayer() → { x, y, vy, onGround, airTime, holding, jumpQueued, invincibleTimer, jumped, landed }` (x = center in m, y = bottom in m)
  - `updatePlayer(p, dt)`: walks, starts a queued jump when grounded, applies hold-reduced gravity, lands, ticks invincibility. Sets `p.jumped` / `p.landed` true only on the frame it happens.
  - `playerHitbox(p) → { left, right, bottom, top }`
  - `makeInvincible(p)`, `isInvincible(p) → boolean`

- [ ] **Step 1: Write the failing test**

`tests/player.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createPlayer, updatePlayer, playerHitbox, makeInvincible, isInvincible } from '../js/player.js';

const TAP_S = 0.045; // not a multiple of a 60 Hz or 120 Hz frame, so both hold for the same time
const HOLD_S = 0.4;

function jumpPeak(holdS, dt) {
  const p = createPlayer();
  p.jumpQueued = true;
  let held = 0;
  let peak = 0;
  do {
    p.holding = held < holdS;
    held += dt;
    updatePlayer(p, dt);
    peak = Math.max(peak, p.y);
  } while (!p.onGround);
  return peak;
}

test('walks at a constant 1.2 m/s', () => {
  const p = createPlayer();
  for (let i = 0; i < 60; i++) updatePlayer(p, 1 / 60);
  assert.ok(Math.abs(p.x - 1.2) < 1e-9);
});

test('jump height is the same at 60 Hz and 120 Hz', () => {
  for (const holdS of [TAP_S, HOLD_S]) {
    const a = jumpPeak(holdS, 1 / 60);
    const b = jumpPeak(holdS, 1 / 120);
    assert.ok(Math.abs(a - b) / b < 0.02, `peaks ${a} vs ${b}`);
  }
});

test('holding jumps clearly higher than tapping', () => {
  assert.ok(jumpPeak(HOLD_S, 1 / 120) > jumpPeak(TAP_S, 1 / 120) + 0.3);
});

test('tap reaches low and over-rock pickups; only a hold reaches high ones', () => {
  const { h } = CONFIG.can;
  const Y = CONFIG.pickupY;
  const tapTop = jumpPeak(TAP_S, 1 / 120) + h;
  const holdTop = jumpPeak(HOLD_S, 1 / 120) + h;
  assert.ok(tapTop > Y.overRock + 0.1);
  assert.ok(tapTop < Y.high);
  assert.ok(holdTop > Y.high + 0.1);
});

test('a jump only starts from the ground', () => {
  const p = createPlayer();
  p.jumpQueued = true;
  updatePlayer(p, 1 / 60);
  for (let i = 0; i < 20; i++) updatePlayer(p, 1 / 60);
  const vyBefore = p.vy;
  p.jumpQueued = true;
  updatePlayer(p, 1 / 60);
  assert.ok(p.vy < vyBefore);
  assert.equal(p.jumpQueued, false);
});

test('jumped and landed are each true for exactly one frame', () => {
  const p = createPlayer();
  p.jumpQueued = true;
  let jumped = 0;
  let landed = 0;
  for (let i = 0; i < 240; i++) {
    updatePlayer(p, 1 / 120);
    jumped += p.jumped ? 1 : 0;
    landed += p.landed ? 1 : 0;
  }
  assert.equal(jumped, 1);
  assert.equal(landed, 1);
  assert.equal(p.y, 0);
});

test('invincibility lasts invincibleS', () => {
  const p = createPlayer();
  makeInvincible(p);
  for (let i = 0; i < 30; i++) updatePlayer(p, 1 / 60);
  assert.equal(isInvincible(p), true);
  for (let i = 0; i < 31; i++) updatePlayer(p, 1 / 60);
  assert.equal(isInvincible(p), false);
});

test('hitbox is centered on x and sits on y', () => {
  const p = createPlayer();
  p.x = 10;
  p.y = 0.5;
  const { w, h } = CONFIG.can;
  assert.deepEqual(playerHitbox(p), { left: 10 - w / 2, right: 10 + w / 2, bottom: 0.5, top: 0.5 + h });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/player.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/player.js`.

- [ ] **Step 3: Write player.js**

The position update averages old and new velocity, which is exact for constant gravity, so jump height does not depend on frame rate.

`js/player.js`:
```js
import { CONFIG } from './config.js';

export function createPlayer() {
  return {
    x: 0, // m, center of the can
    y: 0, // m, bottom of the can above the ground
    vy: 0,
    onGround: true,
    airTime: 0,
    holding: false, // set by input each frame
    jumpQueued: false, // set by input; consumed here
    invincibleTimer: 0,
    jumped: false, // true only on the frame a jump starts
    landed: false, // true only on the frame the can lands
  };
}

export function updatePlayer(p, dt) {
  const J = CONFIG.jump;
  p.jumped = false;
  p.landed = false;
  p.x += CONFIG.speed * dt;

  if (p.jumpQueued && p.onGround) {
    p.vy = J.velocity;
    p.onGround = false;
    p.airTime = 0;
    p.jumped = true;
  }
  p.jumpQueued = false;

  if (!p.onGround) {
    p.airTime += dt;
    const boosting = p.holding && p.vy > 0 && p.airTime <= J.holdMaxS;
    const g = J.gravity * (boosting ? J.holdGravityScale : 1);
    const v0 = p.vy;
    p.vy -= g * dt;
    p.y += ((v0 + p.vy) / 2) * dt; // exact for constant gravity, so 60 Hz and 120 Hz match
    if (p.y <= 0) {
      p.y = 0;
      p.vy = 0;
      p.onGround = true;
      p.landed = true;
    }
  }

  if (p.invincibleTimer > 0) p.invincibleTimer = Math.max(0, p.invincibleTimer - dt);
}

export function playerHitbox(p) {
  const { w, h } = CONFIG.can;
  return { left: p.x - w / 2, right: p.x + w / 2, bottom: p.y, top: p.y + h };
}

export function makeInvincible(p) {
  p.invincibleTimer = CONFIG.invincibleS;
}

export function isInvincible(p) {
  return p.invincibleTimer > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/player.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add js/player.js tests/player.test.js
git commit -m "feat: add jerry can jump physics with tap and hold"
```

---

### Task 3: Entities, collision and fair-jump checks

**Files:**
- Create: `js/world/entities.js`, `js/world/collision.js`
- Test: `tests/collision.test.js`, `tests/helpers/sim.js`, `tests/clearance.test.js`

**Interfaces:**
- Consumes: `createPlayer`, `updatePlayer`, `playerHitbox` (Task 2); `CONFIG.entities`, `CONFIG.patterns`.
- Produces:
  - `makeEntity(type, x, y = CONFIG.entities[type].y, extra = {}) → { id, type, x, y, w, h, touched, ...extra }` (types: `rock`, `bush`, `branch`, `puddle`, `refill`, `filter`, `village`)
  - `entityBox(e) → { left, right, bottom, top }`, `isObstacle(e) → boolean`, `OBSTACLE_TYPES`
  - `overlaps(a, b) → boolean`
  - `collide(player, entities) → [{ type, entity }]`: each entity reported once (sets `entity.touched = true`), nearest first; puddles count only while the can is on the ground.
  - Test helpers `group`, `runPast`, `clearWindowS`, `twoJumpsCanClear`, `TAP_S`, `HOLD_S`, `DT` (tests only).

- [ ] **Step 1: Write the failing tests**

`tests/collision.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../js/player.js';
import { makeEntity, entityBox } from '../js/world/entities.js';
import { overlaps, collide } from '../js/world/collision.js';

test('overlaps detects intersection; touching edges do not count', () => {
  const a = { left: 0, right: 1, bottom: 0, top: 1 };
  assert.equal(overlaps(a, { left: 0.5, right: 2, bottom: 0.5, top: 2 }), true);
  assert.equal(overlaps(a, { left: 1, right: 2, bottom: 0, top: 1 }), false);
  assert.equal(overlaps(a, { left: 0, right: 1, bottom: 1, top: 2 }), false);
});

test('entities use config sizes and default heights', () => {
  const branch = makeEntity('branch', 5);
  assert.deepEqual(entityBox(branch), { left: 4.65, right: 5.35, bottom: 0.5, top: 2 });
  const refill = makeEntity('refill', 3, 1.45);
  assert.equal(refill.y, 1.45);
});

test('each entity is reported once', () => {
  const p = createPlayer();
  const rock = makeEntity('rock', 0);
  assert.equal(collide(p, [rock]).length, 1);
  assert.equal(collide(p, [rock]).length, 0);
  assert.equal(rock.touched, true);
});

test('puddles only count while standing on the ground', () => {
  const p = createPlayer();
  p.onGround = false;
  const puddle = makeEntity('puddle', 0);
  assert.equal(collide(p, [puddle]).length, 0);
  p.onGround = true;
  assert.deepEqual(collide(p, [puddle]).map((h) => h.type), ['puddle']);
});

test('hits come back nearest first', () => {
  const p = createPlayer();
  const far = makeEntity('village', 0.1);
  const near = makeEntity('rock', -0.05);
  assert.deepEqual(collide(p, [far, near]).map((h) => h.type), ['rock', 'village']);
});
```

`tests/helpers/sim.js` (a test helper, not a test file; it walks a real can past real entities):
```js
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
```

`tests/clearance.test.js` (guards the jump numbers in config: every obstacle and combo must be clearable, and a tap must never clear a bush):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { group, runPast, clearWindowS, twoJumpsCanClear, TAP_S, HOLD_S } from './helpers/sim.js';

const P = CONFIG.patterns;
const MIN_WINDOW_S = 0.25;

test('walking into a rock or bush hits it', () => {
  assert.deepEqual(runPast(group(P.rock)), ['rock']);
  assert.deepEqual(runPast(group(P.bush)), ['bush']);
});

test('a tap clears a rock with a fair timing window', () => {
  assert.ok(clearWindowS(group(P.rock), TAP_S) >= MIN_WINDOW_S);
});

test('a tap can never clear a bush', () => {
  assert.equal(clearWindowS(group(P.bush), TAP_S), 0);
});

test('a hold clears a bush with a fair timing window', () => {
  assert.ok(clearWindowS(group(P.bush), HOLD_S) >= MIN_WINDOW_S);
});

test('walking under a branch is safe; jumping into it hits', () => {
  assert.deepEqual(runPast(group(P.branch)), []);
  assert.deepEqual(runPast(group(P.branch), [{ atX: -0.6, holdS: TAP_S }]), ['branch']);
});

test('walking through a puddle touches it; a tap can clear it', () => {
  const puddle = group([{ type: 'puddle', dx: 0 }]);
  assert.deepEqual(runPast(puddle), ['puddle']);
  assert.ok(clearWindowS(puddle, TAP_S) >= MIN_WINDOW_S);
});

test('rock then branch: one tap clears both', () => {
  assert.ok(clearWindowS(group(P.rockBranch), TAP_S) >= MIN_WINDOW_S);
});

test('two rocks: two taps clear both', () => {
  assert.ok(twoJumpsCanClear(group(P.rockRock), TAP_S, TAP_S));
});

test('bush then rock: hold then tap clears both', () => {
  assert.ok(twoJumpsCanClear(group(P.bushRock), HOLD_S, TAP_S));
});

test('a walking or jumping can always reaches the village', () => {
  const village = group([{ type: 'village', dx: 0 }]);
  assert.deepEqual(runPast(village), ['village']);
  assert.deepEqual(runPast(village, [{ atX: -0.3, holdS: HOLD_S }]), ['village']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/collision.test.js tests/clearance.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/world/entities.js`.

- [ ] **Step 3: Write entities.js**

`js/world/entities.js`:
```js
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
```

- [ ] **Step 4: Write collision.js**

`js/world/collision.js`:
```js
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, 34 tests. `clearance.test.js` takes a second or two; it simulates thousands of jumps.

- [ ] **Step 6: Commit**

```bash
git add js/world/entities.js js/world/collision.js tests/collision.test.js tests/helpers/sim.js tests/clearance.test.js
git commit -m "feat: add entities and AABB collision with fair-jump tests"
```

---

### Task 4: Input (Space, tap, hold, pause)

**Files:**
- Create: `js/input.js`
- Test: `tests/input.test.js`

**Interfaces:**
- Consumes: `CONFIG.jump.bufferS`; player fields `onGround`, `holding`, `jumpQueued`.
- Produces: `createInput({ keyTarget, pointerTarget, isActive, onPause }) → { apply(player, dt), clear() }`.
  - `apply` sets `player.holding` and, when grounded, `player.jumpQueued`. A press up to `bufferS` before landing still jumps.
  - Pointer presses on elements inside `[data-no-jump]` are ignored. Space is ignored, and not `preventDefault`ed, while `isActive()` is false.
  - `clear()` drops any pending press (called when a run starts).

- [ ] **Step 1: Write the failing test**

Node has `EventTarget` and `Event` built in, so input is tested without a browser.

`tests/input.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createInput } from '../js/input.js';
import { createPlayer } from '../js/player.js';

function key(type, code, repeat = false) {
  const e = new Event(type, { cancelable: true });
  e.code = code;
  e.repeat = repeat;
  return e;
}

// Pointer target whose closest('[data-no-jump]') finds itself when noJump is true.
class FakeElement extends EventTarget {
  constructor(noJump = false) {
    super();
    this.noJump = noJump;
  }
  closest() {
    return this.noJump ? this : null;
  }
}

function setup({ active = true, noJump = false } = {}) {
  const keys = new EventTarget();
  const pointer = new FakeElement(noJump);
  let pauses = 0;
  const input = createInput({ keyTarget: keys, pointerTarget: pointer, isActive: () => active, onPause: () => pauses++ });
  return { keys, pointer, input, player: createPlayer(), pauses: () => pauses };
}

test('Space press queues a jump and holds until keyup', () => {
  const { keys, input, player } = setup();
  keys.dispatchEvent(key('keydown', 'Space'));
  input.apply(player, 1 / 60);
  assert.equal(player.jumpQueued, true);
  assert.equal(player.holding, true);
  keys.dispatchEvent(key('keyup', 'Space'));
  input.apply(player, 1 / 60);
  assert.equal(player.holding, false);
});

test('Space keydown is prevented while playing (no page scroll)', () => {
  const { keys } = setup();
  const e = key('keydown', 'Space');
  keys.dispatchEvent(e);
  assert.equal(e.defaultPrevented, true);
});

test('holding Space through landing, with key auto-repeat, does not jump again', () => {
  const { keys, input, player } = setup();
  keys.dispatchEvent(key('keydown', 'Space'));
  input.apply(player, 1 / 60);
  player.jumpQueued = false;
  player.onGround = false;
  for (let i = 0; i < 30; i++) {
    keys.dispatchEvent(key('keydown', 'Space', true));
    input.apply(player, 1 / 60);
  }
  player.onGround = true;
  input.apply(player, 1 / 60);
  assert.equal(player.jumpQueued, false);
});

test('a press just before landing is buffered; an early press is dropped', () => {
  const { keys, input, player } = setup();
  player.onGround = false;
  keys.dispatchEvent(key('keydown', 'Space'));
  keys.dispatchEvent(key('keyup', 'Space'));
  input.apply(player, CONFIG.jump.bufferS / 2);
  player.onGround = true;
  input.apply(player, 1 / 60);
  assert.equal(player.jumpQueued, true);

  const late = setup();
  late.player.onGround = false;
  late.keys.dispatchEvent(key('keydown', 'Space'));
  late.input.apply(late.player, CONFIG.jump.bufferS * 2);
  late.player.onGround = true;
  late.input.apply(late.player, 1 / 60);
  assert.equal(late.player.jumpQueued, false);
});

test('Escape and P pause once per press', () => {
  const { keys, pauses } = setup();
  keys.dispatchEvent(key('keydown', 'Escape'));
  keys.dispatchEvent(key('keydown', 'Escape', true));
  keys.dispatchEvent(key('keydown', 'KeyP'));
  assert.equal(pauses(), 2);
});

test('pointer down jumps, except on [data-no-jump] elements', () => {
  const ok = setup();
  ok.pointer.dispatchEvent(new Event('pointerdown', { cancelable: true }));
  ok.input.apply(ok.player, 1 / 60);
  assert.equal(ok.player.jumpQueued, true);

  const blocked = setup({ noJump: true });
  blocked.pointer.dispatchEvent(new Event('pointerdown', { cancelable: true }));
  blocked.input.apply(blocked.player, 1 / 60);
  assert.equal(blocked.player.jumpQueued, false);
});

test('pointer released anywhere ends the hold', () => {
  const { keys, pointer, input, player } = setup();
  pointer.dispatchEvent(new Event('pointerdown', { cancelable: true }));
  keys.dispatchEvent(new Event('pointerup'));
  input.apply(player, 1 / 60);
  assert.equal(player.holding, false);
});

test('Space is ignored when not playing, and not prevented', () => {
  const { keys, input, player } = setup({ active: false });
  const e = key('keydown', 'Space');
  keys.dispatchEvent(e);
  input.apply(player, 1 / 60);
  assert.equal(player.jumpQueued, false);
  assert.equal(e.defaultPrevented, false);
});

test('clear() drops a pending press; blur releases a hold', () => {
  const { keys, input, player } = setup();
  keys.dispatchEvent(key('keydown', 'Space'));
  input.clear();
  input.apply(player, 1 / 60);
  assert.equal(player.jumpQueued, false);
  assert.equal(player.holding, false);

  keys.dispatchEvent(key('keydown', 'Space'));
  keys.dispatchEvent(new Event('blur'));
  input.apply(player, 1 / 60);
  assert.equal(player.holding, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/input.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/input.js`.

- [ ] **Step 3: Write input.js**

`js/input.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/input.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add js/input.js tests/input.test.js
git commit -m "feat: add one-button input with hold, buffer and pause keys"
```

---

### Task 5: Can walks and jumps on the canvas (build step 1)

**Files:**
- Create: `js/state.js`, `js/game.js`, `js/render/renderer.js`, `js/main.js`, `index.html`, `css/style.css`
- Test: `tests/camera.test.js`, `tests/game.test.js`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
  - `createState(highScore = 0) → { phase, distance, segment, water, dirty, cleanDeliveries, dirtyDeliveries, litersDelivered, score, highScore, isNewHighScore, ending, popup, events }`; `resetState(state)` (keeps the same object and the high score).
  - `js/game.js`: `createGame({ highScore }) → { state, player }`, `startRun(game)`, `resetRun(game)`, `togglePause(game)`, `pauseIfPlaying(game)`, `clampDt(rawDt) → seconds`, `stepGame(game, input, rawDt) → events[]`. (Task 6 adds `world` and a `seed` option.)
  - `js/render/renderer.js`: `computeScale(cssW, cssH) → px per m`, `createCamera(cssW, cssH, playerX) → { ppm, left, right, groundY, cssW, cssH, toX, toY, len }`, `createRenderer(canvas) → { draw(state, player, entities, effects?) }`, `drawCanShape(ctx, w, h, look?)` (also used by the start screen and village icon).
  - Events in `state.events` this task: `{ type: 'jump' }`, `{ type: 'land' }`.

- [ ] **Step 1: Write the failing tests**

`tests/camera.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { computeScale, createCamera } from '../js/render/renderer.js';

const V = CONFIG.view;

test('desktop screens use 200–250 px per meter', () => {
  assert.equal(computeScale(1280, 720), 240);
  assert.equal(computeScale(1920, 1080), V.ppmMax);
});

test('phones zoom out so at least minViewWidthM of world shows', () => {
  for (const [w, h] of [[844, 390], [390, 844], [360, 640]]) {
    const ppm = computeScale(w, h);
    assert.ok(w / ppm >= V.minViewWidthM - 1e-9, `${w}x${h} shows ${w / ppm} m`);
  }
});

test('tiny screens stop at ppmMin', () => {
  assert.equal(computeScale(100, 100), V.ppmMin);
});

test('camera keeps the can at canScreenXM and the ground at groundRatio', () => {
  const cam = createCamera(1280, 720, 100);
  assert.ok(Math.abs(cam.toX(100) - V.canScreenXM * cam.ppm) < 1e-6);
  assert.equal(cam.toY(0), 720 * V.groundRatio);
  assert.equal(cam.toY(1), 720 * V.groundRatio - cam.ppm);
  assert.ok(cam.right - cam.left >= V.minViewWidthM);
});
```

`tests/game.test.js` (later tasks append sections to this file):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createGame, startRun, resetRun, togglePause, pauseIfPlaying, clampDt, stepGame } from '../js/game.js';
import { makeEntity } from '../js/world/entities.js';

const idle = { apply() {} };
const jumpOnce = () => {
  let used = false;
  return {
    apply(p) {
      if (!used) p.jumpQueued = true;
      used = true;
    },
  };
};

// Replaces the generated world with hand-placed entities and stops further spawning.
function handWorld(game, entities) {
  game.world.entities = entities;
  game.world.segmentsBuilt = Infinity;
}

// --- loop, pause and dt (Task 5) ---

test('clampDt caps long frames and ignores negative ones', () => {
  assert.equal(clampDt(5), CONFIG.maxDt);
  assert.equal(clampDt(-1), 0);
  assert.equal(clampDt(0.01), 0.01);
});

test('a 5-second hitch moves the can at most one clamped step', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  stepGame(game, idle, 5);
  assert.ok(Math.abs(game.player.x - CONFIG.speed * CONFIG.maxDt) < 1e-9);
});

test('nothing moves before start, while paused, or after the end', () => {
  const game = createGame({ seed: 1 });
  stepGame(game, idle, 1 / 60);
  assert.equal(game.player.x, 0);
  startRun(game);
  togglePause(game);
  stepGame(game, idle, 1 / 60);
  assert.equal(game.player.x, 0);
  game.state.phase = 'ended';
  stepGame(game, idle, 1 / 60);
  assert.equal(game.player.x, 0);
});

test('a jump emits jump then land events', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  const input = jumpOnce();
  const seen = [];
  for (let i = 0; i < 120; i++) seen.push(...stepGame(game, input, 1 / 60).map((e) => e.type));
  assert.deepEqual(seen.filter((t) => t === 'jump' || t === 'land'), ['jump', 'land']);
});

test('togglePause only flips between playing and paused', () => {
  const game = createGame({ seed: 1 });
  togglePause(game);
  assert.equal(game.state.phase, 'start');
  startRun(game);
  togglePause(game);
  assert.equal(game.state.phase, 'paused');
  togglePause(game);
  assert.equal(game.state.phase, 'playing');
});

test('pauseIfPlaying pauses a running game and nothing else', () => {
  const game = createGame({ seed: 1 });
  pauseIfPlaying(game);
  assert.equal(game.state.phase, 'start');
  startRun(game);
  pauseIfPlaying(game);
  assert.equal(game.state.phase, 'paused');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/camera.test.js tests/game.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/render/renderer.js` and `js/game.js`.

- [ ] **Step 3: Write state.js**

`js/state.js`:
```js
import { CONFIG } from './config.js';

export function createState(highScore = 0) {
  return {
    phase: 'start', // 'start' | 'playing' | 'paused' | 'ended'
    distance: 0,
    segment: 1,
    water: CONFIG.water.startLevels, // levels, in steps of 0.5
    dirty: false,
    cleanDeliveries: 0,
    dirtyDeliveries: 0,
    litersDelivered: 0,
    score: 0,
    highScore,
    isNewHighScore: false,
    ending: null, // 'happy' | 'spilled'
    popup: null, // { liters, points, clean, line, timeLeft }
    events: [], // this frame's events for effects, UI and sound: { type, ... }
  };
}

// Keeps the same object (other modules hold a reference) and the high score.
export function resetState(state) {
  Object.assign(state, createState(state.highScore));
}
```

- [ ] **Step 4: Write game.js (first version: player only)**

`js/game.js`:
```js
import { CONFIG } from './config.js';
import { createState, resetState } from './state.js';
import { createPlayer, updatePlayer } from './player.js';

// Everything one run needs, with no DOM, so it can be tested in Node.
export function createGame({ highScore = 0 } = {}) {
  return { state: createState(highScore), player: createPlayer() };
}

export function startRun(game) {
  game.state.phase = 'playing';
}

export function resetRun(game) {
  resetState(game.state);
  Object.assign(game.player, createPlayer());
}

export function togglePause(game) {
  const s = game.state;
  if (s.phase === 'playing') s.phase = 'paused';
  else if (s.phase === 'paused') s.phase = 'playing';
}

export function pauseIfPlaying(game) {
  if (game.state.phase === 'playing') game.state.phase = 'paused';
}

export function clampDt(rawDt) {
  return Math.min(Math.max(rawDt, 0), CONFIG.maxDt);
}

// Game loop steps 1–2 for now (world and rules come later). Returns this frame's events.
export function stepGame(game, input, rawDt) {
  const { state, player } = game;
  state.events = [];
  if (state.phase !== 'playing') return state.events;
  const dt = clampDt(rawDt);
  input.apply(player, dt);
  updatePlayer(player, dt);
  if (player.jumped) state.events.push({ type: 'jump' });
  if (player.landed) state.events.push({ type: 'land' });
  return state.events;
}
```

- [ ] **Step 5: Write renderer.js**

This is the complete renderer, including drawings for every entity type. Entities start appearing in Task 6. `effects` is optional until Task 13.

`js/render/renderer.js`:
```js
import { CONFIG } from '../config.js';

const C = CONFIG.colors;
const V = CONFIG.view;

// Art proportions (shape ratios and village layout) stay here; gameplay tuning lives in config.js.
const VILLAGE_ART = { huts: [-2.2, -1.2, 1.4], hutW: 0.8, hutH: 0.7, wellX: 0.4, wellW: 0.5, wellH: 0.45 };

export function computeScale(cssW, cssH) {
  const fit = Math.min(cssW / V.minViewWidthM, cssH / V.minViewHeightM);
  return Math.min(V.ppmMax, Math.max(V.ppmMin, fit));
}

// The only place meters become pixels.
export function createCamera(cssW, cssH, playerX) {
  const ppm = computeScale(cssW, cssH);
  const left = playerX - V.canScreenXM;
  const groundY = cssH * V.groundRatio;
  return {
    ppm,
    left,
    right: left + cssW / ppm,
    groundY,
    cssW,
    cssH,
    toX: (m) => (m - left) * ppm,
    toY: (m) => groundY - m * ppm,
    len: (m) => m * ppm,
  };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let cssW = 1;
  let cssH = 1;
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  return {
    draw(state, player, entities, effects) {
      const cam = createCamera(cssW, cssH, player.x);
      drawSky(ctx, cam);
      drawHills(ctx, cam);
      drawGround(ctx, cam);
      const visible = entities.filter((e) => e.x > cam.left - V.cullMarginM && e.x < cam.right + V.cullMarginM);
      for (const e of visible) if (e.type === 'village') drawVillage(ctx, cam, e);
      for (const e of visible) if (e.type !== 'village') drawEntity(ctx, cam, e);
      drawCan(ctx, cam, player, state, effects);
      effects?.draw(ctx, cam);
    },
  };
}

function drawSky(ctx, cam) {
  const g = ctx.createLinearGradient(0, 0, 0, cam.groundY);
  g.addColorStop(0, C.dustyBlue);
  g.addColorStop(1, C.cream);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cam.cssW, cam.groundY);
}

// Plains in segment 1 rise into hills through segment 2, with no pop at the village.
function drawHills(ctx, cam) {
  const segmentM = CONFIG.world.segmentM;
  ctx.fillStyle = C.peach;
  ctx.beginPath();
  ctx.moveTo(0, cam.groundY);
  for (let px = 0; px <= cam.cssW + V.hillStepPx; px += V.hillStepPx) {
    const worldM = cam.left + px / cam.ppm;
    const t = Math.min(1, Math.max(0, (worldM - segmentM) / segmentM));
    const base = V.plains.base + (V.hills.base - V.plains.base) * t;
    const amp = V.plains.amp + (V.hills.amp - V.plains.amp) * t;
    const m = cam.left * V.hillParallax + px / cam.ppm;
    const wave = V.hillWaves.reduce((sum, [freq, weight, phase]) => sum + weight * Math.sin(m * freq + phase), 0);
    ctx.lineTo(px, cam.groundY - (base + amp * wave) * cam.ppm);
  }
  ctx.lineTo(cam.cssW, cam.groundY);
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx, cam) {
  const D = V.groundDash;
  ctx.fillStyle = C.terracotta;
  ctx.fillRect(0, cam.groundY, cam.cssW, cam.cssH - cam.groundY);
  ctx.fillStyle = C.mud;
  for (let m = Math.floor(cam.left / D.everyM) * D.everyM; m <= cam.right; m += D.everyM) {
    ctx.fillRect(cam.toX(m), cam.groundY + cam.len(D.depthM), cam.len(D.lengthM), Math.max(1, cam.len(D.thicknessM)));
  }
}

function drawCan(ctx, cam, player, state, effects) {
  const { drawW, drawH } = CONFIG.can;
  const t = effects ? effects.canTransform(player) : { sx: 1, sy: 1, tilt: 0 };
  ctx.save();
  if (player.invincibleTimer > 0) {
    const blinkOn = effects?.reducedMotion || Math.floor(player.invincibleTimer / CONFIG.fx.blinkS) % 2 === 0;
    if (blinkOn) ctx.globalAlpha = CONFIG.fx.blinkAlpha;
  }
  ctx.translate(cam.toX(player.x), cam.toY(player.y));
  ctx.rotate(t.tilt);
  ctx.scale(t.sx, t.sy);
  drawCanShape(ctx, cam.len(drawW), cam.len(drawH), { dirty: state.dirty, outline: effects?.flashColor() });
  ctx.restore();
}

// Yellow jerry can, bottom center at the origin. Also used for the start-screen hero and the village icon.
export function drawCanShape(ctx, w, h, look = {}) {
  const bodyTop = -h * 0.85;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, w * 0.07);
  ctx.strokeStyle = look.outline || C.navy;

  // handle
  ctx.beginPath();
  ctx.roundRect(-w * 0.32, -h, w * 0.5, h * 0.2, w * 0.06);
  ctx.stroke();
  // spout
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.roundRect(w * 0.22, -h * 0.97, w * 0.18, h * 0.14, w * 0.03);
  ctx.fill();
  ctx.stroke();
  // body
  ctx.beginPath();
  ctx.roundRect(-w / 2, bodyTop, w, h * 0.85, w * 0.12);
  ctx.fill();
  if (look.dirty) {
    ctx.save();
    ctx.globalAlpha *= 0.35;
    ctx.fillStyle = C.mud;
    ctx.fill();
    ctx.restore();
  }
  ctx.stroke();
  // embossed X on the side
  ctx.save();
  ctx.globalAlpha *= 0.35;
  ctx.lineWidth = Math.max(1, w * 0.05);
  ctx.beginPath();
  ctx.moveTo(-w * 0.32, bodyTop + h * 0.14);
  ctx.lineTo(w * 0.32, -h * 0.1);
  ctx.moveTo(w * 0.32, bodyTop + h * 0.14);
  ctx.lineTo(-w * 0.32, -h * 0.1);
  ctx.stroke();
  ctx.restore();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawEntity(ctx, cam, e) {
  if (e.type === 'rock') drawRock(ctx, cam, e);
  else if (e.type === 'bush') drawBush(ctx, cam, e);
  else if (e.type === 'branch') drawBranch(ctx, cam, e);
  else if (e.type === 'puddle') drawPuddle(ctx, cam, e);
  else if (e.type === 'refill' && !e.touched) drawDrop(ctx, cam, e);
  else if (e.type === 'filter' && !e.touched) drawFilter(ctx, cam, e);
}

function drawRock(ctx, cam, e) {
  const l = cam.toX(e.x - e.w / 2);
  const r = cam.toX(e.x + e.w / 2);
  const b = cam.toY(e.y);
  const t = cam.toY(e.y + e.h);
  const w = r - l;
  const h = b - t;
  ctx.fillStyle = C.rock;
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(l, b);
  ctx.lineTo(l + w * 0.1, t + h * 0.35);
  ctx.lineTo(l + w * 0.4, t);
  ctx.lineTo(l + w * 0.8, t + h * 0.15);
  ctx.lineTo(r, b);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = C.navy;
  ctx.beginPath();
  ctx.moveTo(l + w * 0.55, b);
  ctx.lineTo(l + w * 0.8, t + h * 0.15);
  ctx.lineTo(r, b);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBush(ctx, cam, e) {
  const cx = cam.toX(e.x);
  const b = cam.toY(e.y);
  const w = cam.len(e.w);
  const h = cam.len(e.h);
  const r = w * 0.3;
  ctx.fillStyle = C.tealShadow;
  circle(ctx, cx - w * 0.2, b - r, r);
  circle(ctx, cx + w * 0.2, b - r, r);
  ctx.fillStyle = C.teal;
  circle(ctx, cx - w * 0.2, b - h * 0.55, r);
  circle(ctx, cx + w * 0.2, b - h * 0.55, r);
  circle(ctx, cx, b - h + r, r);
  ctx.strokeStyle = C.tealHighlight;
  ctx.lineWidth = Math.max(2, w * 0.05);
  ctx.beginPath();
  ctx.arc(cx, b - h + r, r * 0.8, Math.PI * 1.15, Math.PI * 1.6);
  ctx.stroke();
}

function drawBranch(ctx, cam, e) {
  const l = cam.toX(e.x - e.w / 2);
  const r = cam.toX(e.x + e.w / 2);
  const low = cam.toY(e.y);
  const thick = cam.len(e.w) * 0.12;
  const limbY = low - thick * 2;
  ctx.fillStyle = C.navy;
  ctx.strokeStyle = C.navy;
  ctx.fillRect(r - thick, 0, thick, limbY); // stem from the canopy above
  ctx.fillRect(l, limbY - thick, r - l, thick); // limb
  ctx.lineWidth = Math.max(2, thick * 0.4);
  for (let i = 0; i < 4; i++) {
    const x = l + (r - l) * (0.1 + i * 0.25);
    ctx.beginPath();
    ctx.moveTo(x, limbY);
    ctx.lineTo(x + thick * 0.5, low - thick * 0.45);
    ctx.stroke();
    circle(ctx, x + thick * 0.5, low - thick * 0.45, thick * 0.45);
  }
}

function drawPuddle(ctx, cam, e) {
  const ry = cam.len(e.w) * 0.1;
  ctx.fillStyle = C.mud;
  ctx.beginPath();
  ctx.ellipse(cam.toX(e.x), cam.groundY + ry * 0.3, cam.len(e.w / 2), ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawDrop(ctx, cam, e) {
  const cx = cam.toX(e.x);
  const b = cam.toY(e.y);
  const s = cam.len(e.h);
  ctx.fillStyle = C.dustyBlue;
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, b - s);
  ctx.bezierCurveTo(cx + s * 0.55, b - s * 0.45, cx + s * 0.45, b, cx, b);
  ctx.bezierCurveTo(cx - s * 0.45, b, cx - s * 0.55, b - s * 0.45, cx, b - s);
  ctx.fill();
  ctx.stroke();
}

function drawFilter(ctx, cam, e) {
  const cx = cam.toX(e.x);
  const cy = cam.toY(e.y + e.h / 2);
  const r = cam.len(e.w / 2);
  ctx.fillStyle = C.cream;
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 3;
  circle(ctx, cx, cy, r);
  ctx.stroke();
  ctx.strokeStyle = C.dustyBlue;
  ctx.lineWidth = 2;
  for (const dy of [-0.3, 0, 0.3]) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy + dy * r);
    ctx.quadraticCurveTo(cx, cy + dy * r - r * 0.25, cx + r * 0.6, cy + dy * r);
    ctx.stroke();
  }
}

function drawVillage(ctx, cam, e) {
  const A = VILLAGE_ART;
  const g = cam.groundY;
  ctx.strokeStyle = C.navy;
  ctx.lineWidth = 2;
  for (const dx of A.huts) {
    const l = cam.toX(e.x + dx - A.hutW / 2);
    const w = cam.len(A.hutW);
    const h = cam.len(A.hutH);
    ctx.fillStyle = C.cream;
    ctx.fillRect(l, g - h, w, h);
    ctx.strokeRect(l, g - h, w, h);
    ctx.fillStyle = C.mud;
    ctx.beginPath();
    ctx.moveTo(l - w * 0.1, g - h);
    ctx.lineTo(l + w / 2, g - h * 1.6);
    ctx.lineTo(l + w * 1.1, g - h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.navy;
    ctx.fillRect(l + w * 0.4, g - h * 0.55, w * 0.2, h * 0.55);
  }
  const wl = cam.toX(e.x + A.wellX - A.wellW / 2);
  const ww = cam.len(A.wellW);
  const wh = cam.len(A.wellH);
  ctx.fillStyle = C.rock;
  ctx.fillRect(wl, g - wh, ww, wh);
  ctx.strokeRect(wl, g - wh, ww, wh);
  ctx.fillStyle = C.navy;
  ctx.fillRect(wl + ww * 0.05, g - wh * 2.2, ww * 0.08, wh * 1.2);
  ctx.fillRect(wl + ww * 0.87, g - wh * 2.2, ww * 0.08, wh * 1.2);
  ctx.fillRect(wl - ww * 0.1, g - wh * 2.4, ww * 1.2, wh * 0.25);
  ctx.save();
  ctx.translate(wl + ww / 2, g - wh * 0.15);
  drawCanShape(ctx, ww * 0.35, ww * 0.45);
  ctx.restore();
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, 53 tests.

- [ ] **Step 7: Write index.html, style.css and main.js (first versions)**

`index.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Every Drop Home</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main id="game">
    <canvas id="game-canvas" aria-label="Every Drop Home"></canvas>
  </main>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

`css/style.css`:
```css
html, body { margin: 0; height: 100%; overflow: hidden; background: #FFF7E1; }
#game { position: fixed; inset: 0; touch-action: none; user-select: none; -webkit-user-select: none; }
#game-canvas { display: block; width: 100%; height: 100%; }
```

`js/main.js`:
```js
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
  renderer.draw(game.state, game.player, []);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

- [ ] **Step 8: Check it in the browser**

Serve the folder (VS Code Live Server, or `npx --yes http-server -c-1 -p 8080`) and open the page. Expected:
- Sky fades from dusty blue to cream, peach hills, terracotta ground with dashes scrolling left at walking pace.
- The yellow can, outlined in navy, stands left of center. A tap or Space press makes a small hop; holding makes a clearly higher jump. Holding Space does not keep hopping.
- No errors in the DevTools console.

- [ ] **Step 9: Commit**

```bash
git add js/state.js js/game.js js/render/renderer.js js/main.js index.html css/style.css tests/camera.test.js tests/game.test.js
git commit -m "feat: can walks and jumps on the canvas"
```

---

### Task 6: Rocks scroll by and collisions are detected (build step 2)

**Files:**
- Create: `js/world/spawner.js` (starter version), `js/world/world.js`
- Modify: `js/game.js` (replace whole file), `js/main.js` (one line), `tests/game.test.js` (append)
- Test: `tests/world.test.js`

**Interfaces:**
- Consumes: `makeEntity`, `collide` (Task 3); `createRng`, `randRange` (Task 1).
- Produces:
  - `createSpawner(rng) → { generateSegment(n) → entities[] }` (n is 1-based; segment n covers `[(n-1)·60, n·60]`). This starter version places segment-1 rocks everywhere; Task 9 adds villages and Task 11 replaces it.
  - `createWorld(rng) → { spawner, entities, segmentsBuilt }`, `updateWorld(world, playerX)`, `collideWorld(world, player) → hits`.
  - `createGame({ seed = Date.now(), highScore = 0 }) → { state, player, world }`; `resetRun(game, seed = Date.now())` rebuilds the world.

- [ ] **Step 1: Write the failing tests**

`tests/world.test.js` (Task 9 appends to it):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createWorld, updateWorld, collideWorld } from '../js/world/world.js';
import { createPlayer } from '../js/player.js';

test('builds segments ahead of the can', () => {
  const world = createWorld(createRng(1));
  updateWorld(world, 0);
  assert.equal(world.segmentsBuilt, 1);
  updateWorld(world, CONFIG.world.segmentM - CONFIG.world.spawnAheadM + 0.1);
  assert.equal(world.segmentsBuilt, 2);
});

test('drops entities left behind the can', () => {
  const world = createWorld(createRng(1));
  updateWorld(world, 0);
  updateWorld(world, 50);
  assert.ok(world.entities.every((e) => e.x + e.w / 2 > 50 - CONFIG.world.despawnBehindM));
});

test('collideWorld reports what the can touches', () => {
  const world = createWorld(createRng(1));
  updateWorld(world, 0);
  const rock = world.entities.find((e) => e.type === 'rock');
  const player = createPlayer();
  player.x = rock.x;
  assert.deepEqual(collideWorld(world, player).map((h) => h.type), ['rock']);
});
```

Append to `tests/game.test.js`:
```js
// --- world (Task 6) ---

test('play again resets the run but keeps the high score', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  handWorld(game, [makeEntity('rock', 2)]);
  for (let i = 0; i < 60 * 5; i++) stepGame(game, idle, 1 / 60);
  Object.assign(game.state, { phase: 'ended', highScore: 77, dirty: true });
  resetRun(game, 2);
  assert.equal(game.state.phase, 'start');
  assert.equal(game.state.highScore, 77);
  assert.equal(game.state.water, CONFIG.water.startLevels);
  assert.equal(game.state.dirty, false);
  assert.equal(game.state.popup, null);
  assert.equal(game.player.x, 0);
  assert.equal(game.world.entities.length, 0);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/world.test.js tests/game.test.js`
Expected: FAIL. `world.test.js` with `ERR_MODULE_NOT_FOUND` for `js/world/world.js`; "play again resets the run…" with `TypeError` (game has no `world`).

- [ ] **Step 3: Write the starter spawner**

`js/world/spawner.js`:
```js
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
```

- [ ] **Step 4: Write world.js**

`js/world/world.js`:
```js
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
```

- [ ] **Step 5: Replace game.js with the world-aware version**

`js/game.js`:
```js
import { CONFIG } from './config.js';
import { createState, resetState } from './state.js';
import { createPlayer, updatePlayer } from './player.js';
import { createWorld, updateWorld, collideWorld } from './world/world.js';
import { createRng } from './rng.js';

// Everything one run needs, with no DOM, so it can be tested in Node.
export function createGame({ seed = Date.now(), highScore = 0 } = {}) {
  return { state: createState(highScore), player: createPlayer(), world: createWorld(createRng(seed)) };
}

export function startRun(game) {
  game.state.phase = 'playing';
}

export function resetRun(game, seed = Date.now()) {
  resetState(game.state);
  Object.assign(game.player, createPlayer());
  game.world = createWorld(createRng(seed));
}

export function togglePause(game) {
  const s = game.state;
  if (s.phase === 'playing') s.phase = 'paused';
  else if (s.phase === 'paused') s.phase = 'playing';
}

export function pauseIfPlaying(game) {
  if (game.state.phase === 'playing') game.state.phase = 'paused';
}

export function clampDt(rawDt) {
  return Math.min(Math.max(rawDt, 0), CONFIG.maxDt);
}

// Game loop steps 1–3 (rules come in Task 7). Returns this frame's events.
export function stepGame(game, input, rawDt) {
  const { state, player } = game;
  state.events = [];
  if (state.phase !== 'playing') return state.events;
  const dt = clampDt(rawDt);
  input.apply(player, dt);
  updatePlayer(player, dt);
  if (player.jumped) state.events.push({ type: 'jump' });
  if (player.landed) state.events.push({ type: 'land' });
  updateWorld(game.world, player.x);
  collideWorld(game.world, player); // hits are detected; rules.js decides what they mean in Task 7
  return state.events;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, 57 tests.

- [ ] **Step 7: Draw the world in main.js**

In `js/main.js`:

Find:
```js
  renderer.draw(game.state, game.player, []);
```

Replace with:
```js
  renderer.draw(game.state, game.player, game.world.entities);
```

- [ ] **Step 8: Check it in the browser**

Expected: the first rock appears after about 11 m (the first 5 m are always empty), then rocks every 6–9 m. Rocks are light gray with navy shading. Walking into a rock does nothing yet (rules arrive in Task 7). Tapping clears a rock comfortably.

- [ ] **Step 9: Commit**

```bash
git add js/world/spawner.js js/world/world.js js/game.js js/main.js tests/world.test.js tests/game.test.js
git commit -m "feat: spawn scrolling rocks and detect collisions"
```

---

### Task 7: Hits cost water, invincibility, spilled ending (build step 3, logic)

**Files:**
- Create: `js/rules.js` (first version)
- Modify: `js/game.js` (replace whole file), `tests/game.test.js` (append)
- Test: `tests/rules.test.js`

**Interfaces:**
- Consumes: `isInvincible`, `makeInvincible` (Task 2); hits from `collideWorld`.
- Produces (from `js/rules.js`):
  - `updateRules(hits, state, player, dt)`: the only writer of `water`, `score`, deliveries, `dirty`, `ending`, and the `playing → ended` transition.
  - `computeScore(state) → integer`, `segmentAt(distance) → 1-based segment`.
  - Events: `{ type: 'splash' }` on a hit, `{ type: 'ended', ending }` when the run ends.
  - `stepGame` now runs all loop steps 1–4.

- [ ] **Step 1: Write the failing tests**

`tests/rules.test.js` (Tasks 9 and 10 append to it):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, COPY } from '../js/config.js';
import { createState } from '../js/state.js';
import { createPlayer, updatePlayer } from '../js/player.js';
import { updateRules, computeScore, segmentAt } from '../js/rules.js';

function setup(overrides = {}) {
  const state = Object.assign(createState(), { phase: 'playing' }, overrides);
  return { state, player: createPlayer() };
}
const hit = (type) => ({ type, entity: { x: 0 } });
const types = (state) => state.events.map((e) => e.type);

// --- obstacles and spilling (Task 7) ---

test('a hit costs one level, starts invincibility and splashes', () => {
  const { state, player } = setup();
  updateRules([hit('rock')], state, player, 1 / 60);
  assert.equal(state.water, 4);
  assert.ok(player.invincibleTimer > 0);
  assert.deepEqual(types(state), ['splash']);
});

test('hits during invincibility are ignored; after it ends they count', () => {
  const { state, player } = setup();
  updateRules([hit('rock')], state, player, 1 / 60);
  updateRules([hit('bush')], state, player, 1 / 60);
  assert.equal(state.water, 4);
  for (let i = 0; i < 61; i++) updatePlayer(player, 1 / 60);
  updateRules([hit('branch')], state, player, 1 / 60);
  assert.equal(state.water, 3);
});

test('emptying the can with a hit gives the spilled ending', () => {
  const { state, player } = setup({ water: 1 });
  updateRules([hit('rock')], state, player, 1 / 60);
  assert.equal(state.water, 0);
  assert.equal(state.phase, 'ended');
  assert.equal(state.ending, 'spilled');
  assert.ok(types(state).includes('ended'));
});

test('a hit with half a level left spills to exactly 0', () => {
  const { state, player } = setup({ water: 0.5 });
  updateRules([hit('rock')], state, player, 1 / 60);
  assert.equal(state.water, 0);
  assert.equal(state.ending, 'spilled');
});

test('distance, segment and live score follow the can', () => {
  const { state, player } = setup();
  player.x = 125.7;
  updateRules([], state, player, 1 / 60);
  assert.equal(state.distance, 125.7);
  assert.equal(state.segment, 3);
  assert.equal(state.score, 12);
  assert.equal(segmentAt(59.99), 1);
  assert.equal(segmentAt(60), 2);
});

test('nothing changes unless playing', () => {
  const { state, player } = setup({ phase: 'paused' });
  player.x = 50;
  updateRules([hit('rock')], state, player, 1 / 60);
  assert.equal(state.water, 5);
  assert.equal(state.distance, 0);
});

test('high score updates at the end only when beaten', () => {
  const beat = setup({ water: 1, highScore: 3 });
  beat.player.x = 100;
  updateRules([hit('rock')], beat.state, beat.player, 1 / 60);
  assert.equal(beat.state.highScore, 10);
  assert.equal(beat.state.isNewHighScore, true);

  const miss = setup({ water: 1, highScore: 50 });
  miss.player.x = 100;
  updateRules([hit('rock')], miss.state, miss.player, 1 / 60);
  assert.equal(miss.state.highScore, 50);
  assert.equal(miss.state.isNewHighScore, false);
});
```

Append to `tests/game.test.js`:
```js
// --- rules wired in (Task 7) ---

test('walking into rocks costs water and eventually spills', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  handWorld(game, [2, 4, 6, 8, 10].map((x) => makeEntity('rock', x)));
  for (let i = 0; i < 60 * 12 && game.state.phase === 'playing'; i++) stepGame(game, idle, 1 / 60);
  assert.equal(game.state.phase, 'ended');
  assert.equal(game.state.ending, 'spilled');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/rules.test.js tests/game.test.js`
Expected: FAIL. `rules.test.js` with `ERR_MODULE_NOT_FOUND` for `js/rules.js`; "walking into rocks…" with `AssertionError` (phase stays `playing`).

- [ ] **Step 3: Write rules.js**

`js/rules.js`:
```js
import { CONFIG } from './config.js';
import { isInvincible, makeInvincible } from './player.js';

const OBSTACLES = new Set(['rock', 'bush', 'branch']);

export function segmentAt(distance) {
  return Math.floor(distance / CONFIG.world.segmentM) + 1;
}

export function computeScore(state) {
  const S = CONFIG.score;
  const base =
    Math.floor(state.distance / S.metersPerPoint) +
    S.cleanDelivery * state.cleanDeliveries +
    S.dirtyDelivery * state.dirtyDeliveries;
  const multiplier = state.ending === 'happy' ? S.happyMultiplier : 1;
  return Math.floor(base * multiplier);
}

// The only place water and score change. Hits come from collision, nearest first.
export function updateRules(hits, state, player, dt) {
  if (state.phase !== 'playing') return;
  state.distance = player.x;
  state.segment = segmentAt(player.x);
  for (const hit of hits) {
    if (state.phase !== 'playing') break;
    if (OBSTACLES.has(hit.type)) onObstacle(state, player);
  }
  state.score = computeScore(state);
}

function onObstacle(state, player) {
  if (isInvincible(player)) return;
  state.water = Math.max(0, state.water - CONFIG.water.hitCost);
  makeInvincible(player);
  state.events.push({ type: 'splash' });
  if (state.water <= 0) endRun(state, 'spilled');
}

function endRun(state, ending) {
  state.ending = ending;
  state.phase = 'ended';
  state.score = computeScore(state);
  state.isNewHighScore = state.score > state.highScore;
  state.highScore = Math.max(state.highScore, state.score);
  state.events.push({ type: 'ended', ending });
}
```

- [ ] **Step 4: Replace game.js with the full loop**

This is the final `game.js`.

`js/game.js`:
```js
import { CONFIG } from './config.js';
import { createState, resetState } from './state.js';
import { createPlayer, updatePlayer } from './player.js';
import { createWorld, updateWorld, collideWorld } from './world/world.js';
import { updateRules } from './rules.js';
import { createRng } from './rng.js';

// Everything one run needs, with no DOM, so it can be tested in Node.
export function createGame({ seed = Date.now(), highScore = 0 } = {}) {
  return { state: createState(highScore), player: createPlayer(), world: createWorld(createRng(seed)) };
}

export function startRun(game) {
  game.state.phase = 'playing';
}

export function resetRun(game, seed = Date.now()) {
  resetState(game.state);
  Object.assign(game.player, createPlayer());
  game.world = createWorld(createRng(seed));
}

export function togglePause(game) {
  const s = game.state;
  if (s.phase === 'playing') s.phase = 'paused';
  else if (s.phase === 'paused') s.phase = 'playing';
}

export function pauseIfPlaying(game) {
  if (game.state.phase === 'playing') game.state.phase = 'paused';
}

export function clampDt(rawDt) {
  return Math.min(Math.max(rawDt, 0), CONFIG.maxDt);
}

// Game loop steps 1–4. Returns this frame's events (empty unless playing).
export function stepGame(game, input, rawDt) {
  const { state, player } = game;
  state.events = [];
  if (state.phase !== 'playing') return state.events;
  const dt = clampDt(rawDt);
  input.apply(player, dt);
  updatePlayer(player, dt);
  if (player.jumped) state.events.push({ type: 'jump' });
  if (player.landed) state.events.push({ type: 'land' });
  updateWorld(game.world, player.x);
  const hits = collideWorld(game.world, player);
  updateRules(hits, state, player, dt);
  return state.events;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, 65 tests.

- [ ] **Step 6: Check it in the browser**

Expected: walking into a rock makes the can blink for 1 s. After 5 hits the world freezes (phase `ended`; the end screen arrives in Task 8).

- [ ] **Step 7: Commit**

```bash
git add js/rules.js js/game.js tests/rules.test.js tests/game.test.js
git commit -m "feat: hits spill water with invincibility and spilled ending"
```

---

### Task 8: HUD, pop-up, start, pause and end screens with Donate (build steps 3 and 6, UI)

**Files:**
- Modify: `index.html` (replace whole file), `css/style.css` (replace whole file), `js/main.js` (replace whole file)
- Create: `js/ui.js`
- Test: manual browser check (DOM layer; game logic it reads is already tested)

**Interfaces:**
- Consumes: `state` fields from Task 5; `COPY`, `CONFIG.donateUrl`, `CONFIG.water.maxLevels`, `CONFIG.score.cleanDelivery`; `drawCanShape` (Task 5); `startRun`, `resetRun`, `togglePause` (Task 5/6).
- Produces: `createUI({ onStart, onPause, onResume, onPlayAgain }) → { update(state) }`. Element ids used later: `gauge`, `opt-reduced-motion`, `opt-sound` (Task 12), `start-btn`. Screens are shown by phase: `start` → `#screen-start`, `paused` → `#screen-pause`, `ended` → `#screen-end`.

- [ ] **Step 1: Replace index.html**

All overlays carry `data-no-jump` (or sit in a `pointer-events: none` layer) so taps on them never make the can jump.

`index.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Every Drop Home</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700;900&display=swap">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main id="game">
    <canvas id="game-canvas" aria-label="Every Drop Home"></canvas>

    <div id="hud" class="hud" hidden>
      <div id="gauge" class="hud-panel gauge" role="img" aria-label="Water: 5 of 5 levels, clean">
        <div class="gauge-cells">
          <span class="gauge-cell"><span class="gauge-fill"></span></span>
          <span class="gauge-cell"><span class="gauge-fill"></span></span>
          <span class="gauge-cell"><span class="gauge-fill"></span></span>
          <span class="gauge-cell"><span class="gauge-fill"></span></span>
          <span class="gauge-cell"><span class="gauge-fill"></span></span>
        </div>
        <span id="hud-villages" class="hud-label">0 villages</span>
      </div>
      <div class="hud-right">
        <div class="hud-panel hud-distance"><span id="hud-distance">0</span><small> m</small></div>
        <button id="pause-btn" class="icon-btn" type="button" data-no-jump aria-label="Pause">II</button>
      </div>
    </div>

    <div id="popup" class="popup" hidden aria-live="polite">
      <span class="popup-accent" aria-hidden="true"></span>
      <p id="popup-title" class="popup-title"></p>
      <p id="popup-points" class="popup-points"></p>
      <p id="popup-line" class="popup-line"></p>
    </div>

    <section id="screen-start" class="screen" data-no-jump>
      <div class="card">
        <!-- Swap for the official charity: water logo (assets/images/) once you have the file and permission. -->
        <p class="logo">charity: water</p>
        <h1>Every Drop Home</h1>
        <p id="start-tagline" class="tagline"></p>
        <p id="start-premise" class="body-text"></p>
        <canvas id="start-can" width="160" height="200" aria-hidden="true"></canvas>
        <p id="start-howto" class="body-text"></p>
        <p class="best">Best score: <strong id="start-best">0</strong></p>
        <button id="start-btn" class="btn btn-primary" type="button">Start walking</button>
      </div>
    </section>

    <section id="screen-pause" class="screen" data-no-jump hidden>
      <div class="card">
        <h2>Paused</h2>
        <button id="resume-btn" class="btn btn-primary" type="button">Keep walking</button>
      </div>
    </section>

    <section id="screen-end" class="screen" data-no-jump hidden>
      <div class="card">
        <p class="logo">charity: water</p>
        <h2 id="end-title"></h2>
        <p id="end-body" class="body-text"></p>
        <dl class="stats">
          <div><dt>Distance</dt><dd id="end-distance"></dd></div>
          <div><dt>Liters delivered</dt><dd id="end-liters"></dd></div>
          <div><dt>Deliveries</dt><dd id="end-deliveries"></dd></div>
          <div><dt>Score</dt><dd id="end-score"></dd></div>
          <div class="wide"><dt>Best</dt><dd id="end-best"></dd></div>
        </dl>
        <p id="end-fact" class="body-text fact"></p>
        <a id="donate-btn" class="btn btn-primary" target="_blank" rel="noopener">Donate</a>
        <p id="donate-note" class="donate-note"></p>
        <button id="again-btn" class="btn btn-secondary" type="button">Play again</button>
      </div>
    </section>
  </main>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Replace style.css**

`css/style.css`:
```css
:root {
  --yellow: #FFC907;
  --navy: #003366;
  --dusty-blue: #77A8BB;
  --cream: #FFF7E1;
  --peach: #FED8C1;
  --mud: #7A3F26;
  --text: #1A1A1A;
  --font: 'Nunito Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --gutter: max(12px, env(safe-area-inset-left), env(safe-area-inset-right));
}

* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; overflow: hidden; background: var(--cream); color: var(--text); font-family: var(--font); }
[hidden] { display: none !important; }

#game { position: fixed; inset: 0; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
#game-canvas { display: block; width: 100%; height: 100%; }

/* HUD */
.hud { position: absolute; inset: 0 0 auto 0; display: flex; justify-content: space-between; align-items: flex-start; padding: max(12px, env(safe-area-inset-top)) var(--gutter) 0; pointer-events: none; }
.hud-panel { background: var(--navy); color: var(--cream); border-radius: 12px; padding: 8px 12px; font-weight: 700; }
.gauge { display: flex; flex-direction: column; gap: 6px; }
.gauge-cells { display: flex; gap: 4px; }
.gauge-cell { position: relative; width: 22px; height: 30px; border: 2px solid var(--cream); border-radius: 5px; overflow: hidden; }
.gauge-fill { position: absolute; inset: auto 0 0 0; height: calc(var(--fill, 1) * 100%); background: var(--dusty-blue); transition: height 0.2s, background-color 0.3s; }
.gauge.dirty .gauge-fill { background: var(--mud); }
.hud-label { font-size: 0.85rem; }
.hud-right { display: flex; gap: 8px; align-items: flex-start; }
.hud-distance { font-size: 1.6rem; font-weight: 900; line-height: 1.2; }
.hud-distance small { font-size: 0.9rem; }
#hud-distance { color: var(--yellow); }
.icon-btn { pointer-events: auto; width: 48px; height: 48px; border: 0; border-radius: 12px; background: var(--navy); color: var(--cream); font: 900 1.1rem var(--font); letter-spacing: 2px; cursor: pointer; }
.icon-btn:focus-visible { outline: 3px solid var(--yellow); outline-offset: 2px; }

/* Delivery pop-up */
.popup { position: absolute; top: 20%; left: 50%; width: min(calc(100vw - 32px), 360px); transform: translateX(-50%); padding: 14px 18px 14px 28px; border-radius: 16px; background: var(--cream); color: var(--navy); box-shadow: 0 6px 20px rgba(0, 51, 102, 0.2); pointer-events: none; animation: pop-in 0.25s ease-out; }
.popup-accent { position: absolute; inset: 0 auto 0 0; width: 10px; border-radius: 16px 0 0 16px; background: var(--yellow); }
.popup-title { margin: 0; font-size: 1.3rem; font-weight: 900; }
.popup-points, .popup-line { margin: 4px 0 0; }
@keyframes pop-in { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }

/* Screens */
.screen { position: absolute; inset: 0; display: grid; place-items: center; padding: 16px; overflow-y: auto; background: rgba(255, 247, 225, 0.94); }
.card { width: min(100%, 440px); text-align: center; color: var(--navy); }
.logo { margin: 0 0 4px; font-weight: 900; letter-spacing: 0.02em; }
h1, h2 { margin: 0 0 8px; font-weight: 900; line-height: 1.1; color: var(--navy); }
h1 { font-size: clamp(2rem, 8vw, 3rem); }
h2 { font-size: clamp(1.4rem, 5vw, 2rem); }
.tagline { margin: 0 0 8px; font-size: 1.1rem; font-weight: 700; }
.body-text { margin: 8px 0; color: var(--text); }
.best { margin: 8px 0 0; }
#start-can { display: block; width: 96px; height: 120px; margin: 4px auto; }
.btn { display: block; width: 100%; max-width: 320px; margin: 12px auto 0; padding: 14px 20px; border: 3px solid transparent; border-radius: 999px; font: 900 1.15rem var(--font); text-decoration: none; cursor: pointer; }
.btn-primary { background: var(--yellow); color: var(--text); }
.btn-secondary { background: transparent; color: var(--navy); border-color: var(--navy); }
.btn:focus-visible { outline: 3px solid var(--navy); outline-offset: 3px; }
.stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; }
.stats div { padding: 8px; border-radius: 12px; background: var(--navy); color: var(--cream); }
.stats .wide { grid-column: 1 / -1; }
.stats dt { font-size: 0.8rem; }
.stats dd { margin: 2px 0 0; font-size: 1.2rem; font-weight: 900; }
.fact { font-style: italic; }
.donate-note { margin: 6px 0 0; font-size: 0.9rem; color: var(--text); }
.options { display: flex; justify-content: center; gap: 16px; margin-top: 14px; }
.toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 0.95rem; cursor: pointer; }
.toggle input { width: 20px; height: 20px; accent-color: var(--navy); }

/* Short landscape phones: tighter cards */
@media (max-height: 480px) {
  .card { width: min(100%, 560px); }
  #start-can { display: none; }
  .btn { margin-top: 8px; padding: 10px 16px; }
}
```

- [ ] **Step 3: Write ui.js**

Buttons blur themselves after a click so the next Space press goes to the game, not the button. `update` only writes to the DOM when a shown value changes.

`js/ui.js`:
```js
import { CONFIG, COPY } from './config.js';
import { drawCanShape } from './render/renderer.js';

const $ = (id) => document.getElementById(id);

// DOM screens and HUD. Reads state; never changes it. Buttons call the handlers.
export function createUI({ onStart, onPause, onResume, onPlayAgain }) {
  const el = {
    hud: $('hud'),
    gauge: $('gauge'),
    fills: [...document.querySelectorAll('.gauge-fill')],
    distance: $('hud-distance'),
    villages: $('hud-villages'),
    popup: $('popup'),
    screens: { start: $('screen-start'), paused: $('screen-pause'), ended: $('screen-end') },
  };

  $('start-tagline').textContent = COPY.tagline;
  $('start-premise').textContent = COPY.premise;
  $('start-howto').textContent = COPY.howTo;
  $('end-fact').textContent = COPY.endFact;
  $('donate-note').textContent = COPY.donateNote;
  $('donate-btn').href = CONFIG.donateUrl;
  drawHeroCan($('start-can'));

  // blur() so a later Space press goes to the game, not the button.
  const onClick = (id, handler) =>
    $(id).addEventListener('click', (e) => {
      e.currentTarget.blur();
      handler();
    });
  onClick('start-btn', onStart);
  onClick('pause-btn', onPause);
  onClick('resume-btn', onResume);
  onClick('again-btn', onPlayAgain);

  const shown = {}; // last value written per field, to skip unchanged DOM writes
  function set(key, value, apply) {
    if (shown[key] === value) return;
    shown[key] = value;
    apply(value);
  }

  return {
    update(state) {
      set('phase', state.phase, (phase) => {
        el.hud.hidden = phase === 'start';
        for (const [name, screen] of Object.entries(el.screens)) screen.hidden = name !== phase;
        if (phase === 'ended') fillEnd(state);
      });
      set('gauge', `${state.water}|${state.dirty}`, () => renderGauge(el, state));
      set('distance', Math.floor(state.distance), (m) => {
        el.distance.textContent = m;
      });
      set('villages', state.cleanDeliveries + state.dirtyDeliveries, (n) => {
        el.villages.textContent = `${n} ${n === 1 ? 'village' : 'villages'}`;
      });
      set('popup', state.popup ? state.cleanDeliveries + state.dirtyDeliveries : null, (n) => {
        el.popup.hidden = n === null;
        if (n !== null) fillPopup(state.popup);
      });
      set('best', state.highScore, (best) => {
        $('start-best').textContent = best;
      });
    },
  };
}

function renderGauge(el, state) {
  el.fills.forEach((fill, i) => {
    fill.style.setProperty('--fill', Math.min(1, Math.max(0, state.water - i)));
  });
  el.gauge.classList.toggle('dirty', state.dirty);
  el.gauge.setAttribute('aria-label', `Water: ${state.water} of ${CONFIG.water.maxLevels} levels, ${state.dirty ? 'dirty' : 'clean'}`);
}

function fillPopup(popup) {
  $('popup-title').textContent = `${popup.liters} liters delivered!`;
  $('popup-points').textContent = popup.clean ? `+${popup.points} points` : `+${popup.points} points (filter it next time for +${CONFIG.score.cleanDelivery})`;
  $('popup-line').textContent = popup.line;
}

function fillEnd(state) {
  const happy = state.ending === 'happy';
  $('end-title').textContent = happy ? COPY.happyTitle : COPY.spilledTitle;
  $('end-body').textContent = happy ? COPY.happyBody : COPY.spilledBody;
  $('end-distance').textContent = `${Math.floor(state.distance)} m`;
  $('end-liters').textContent = `${state.litersDelivered} L`;
  $('end-deliveries').textContent = `${state.cleanDeliveries} clean / ${state.dirtyDeliveries} dirty`;
  $('end-score').textContent = state.score;
  $('end-best').textContent = state.isNewHighScore ? `${state.highScore} (new best!)` : state.highScore;
}

function drawHeroCan(canvas) {
  const ctx = canvas.getContext('2d');
  const pad = canvas.height * 0.05;
  ctx.translate(canvas.width / 2, canvas.height - pad);
  drawCanShape(ctx, canvas.width * 0.7, canvas.height - pad * 2);
}
```

- [ ] **Step 4: Replace main.js**

`begin()` clears input so a press that started the run does not also jump.

`js/main.js`:
```js
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
```

- [ ] **Step 5: Run the test suite**

Run: `node --test`
Expected: PASS, 65 tests (no change in logic).

- [ ] **Step 6: Check it in the browser**

Expected:
- Start screen: "charity: water" above the navy "Every Drop Home" title, tagline, one-line premise, yellow jerry can, how-to line, "Best score: 0", yellow "Start walking" button with near-black text.
- After Start: HUD shows the gauge top-left (5 dusty-blue cells, "0 villages"), the distance in yellow on navy top-right, and a pause button. Distance counts whole meters (about 12 after 10 s).
- Each hit empties one gauge cell. The pause button, Esc and P all open "Paused"; "Keep walking" resumes. Tapping the pause button does not make the can jump.
- After 5 hits: end screen with "The can ran dry before the next village.", stats, placeholder fact, yellow Donate button (opens charitywater.org in a new tab), the 100% line under it, and a navy-outlined "Play again".
- "Play again" restarts immediately at 0 m with 5 clean levels. Press Space right after clicking it: one normal jump, no surprise jump.

- [ ] **Step 7: Commit**

```bash
git add index.html css/style.css js/ui.js js/main.js
git commit -m "feat: add HUD, delivery pop-up, start/pause/end screens and Donate"
```

---

### Task 9: Villages, deliveries, scoring and happy ending (build step 4)

**Files:**
- Modify: `js/rules.js` (replace whole file), `js/world/spawner.js` (one line), `tests/rules.test.js`, `tests/game.test.js`, `tests/world.test.js` (append)

**Interfaces:**
- Consumes: Task 7 rules; `COPY.impactLines`, `CONFIG.popupS`, `CONFIG.score`.
- Produces: village hits deliver `min(1, water)` levels; `state.popup = { liters, points, clean, line, timeLeft }`, cleared after `popupS`; event `{ type: 'deliver', clean }`; happy ending when a delivery empties the can. The spawner now puts a village at `n · 60` in every segment.

- [ ] **Step 1: Write the failing tests**

Append to `tests/rules.test.js`:
```js
// --- villages, deliveries, scoring (Task 9) ---

test('a clean delivery drops one level, banks 4 L and +10, shows a pop-up', () => {
  const { state, player } = setup();
  updateRules([hit('village')], state, player, 1 / 60);
  assert.equal(state.water, 4);
  assert.equal(state.cleanDeliveries, 1);
  assert.equal(state.litersDelivered, 4);
  assert.deepEqual(state.popup, { liters: 4, points: 10, clean: true, line: COPY.impactLines[0], timeLeft: CONFIG.popupS });
  assert.deepEqual(types(state), ['deliver']);
});

test('a dirty delivery scores +5 and the water stays dirty', () => {
  const { state, player } = setup({ dirty: true });
  updateRules([hit('village')], state, player, 1 / 60);
  assert.equal(state.dirtyDeliveries, 1);
  assert.equal(state.popup.points, 5);
  assert.equal(state.dirty, true);
  assert.equal(state.score, 5);
});

test('the pop-up disappears after popupS without pausing play', () => {
  const { state, player } = setup();
  updateRules([hit('village')], state, player, 1 / 60);
  for (let t = 0; t < CONFIG.popupS + 0.05; t += 1 / 60) updateRules([], state, player, 1 / 60);
  assert.equal(state.popup, null);
  assert.equal(state.phase, 'playing');
});

test('delivering the last level gives the happy ending with ×1.5', () => {
  const { state, player } = setup({ water: 1, cleanDeliveries: 3 });
  player.x = 240;
  updateRules([hit('village')], state, player, 1 / 60);
  assert.equal(state.phase, 'ended');
  assert.equal(state.ending, 'happy');
  assert.equal(state.score, Math.floor((24 + 40) * 1.5));
});

test('half a level at a village delivers 2 L and still ends happy', () => {
  const { state, player } = setup({ water: 0.5 });
  updateRules([hit('village')], state, player, 1 / 60);
  assert.equal(state.litersDelivered, 2);
  assert.equal(state.popup.liters, 2);
  assert.equal(state.ending, 'happy');
});

test('spec score examples', () => {
  const casual = Object.assign(createState(), { distance: 216, cleanDeliveries: 2, dirtyDeliveries: 1, ending: 'spilled' });
  assert.equal(computeScore(casual), 46);
  const skilled = Object.assign(createState(), { distance: 400, cleanDeliveries: 6, ending: 'happy' });
  assert.equal(computeScore(skilled), 150);
});

test('hits after the run ends in the same frame are ignored', () => {
  const { state, player } = setup({ water: 1 });
  updateRules([hit('rock'), hit('village')], state, player, 1 / 60);
  assert.equal(state.ending, 'spilled');
  assert.equal(state.cleanDeliveries, 0);
});
```

Append to `tests/game.test.js`:
```js
// --- villages (Task 9) ---

test('walking into a village delivers water', () => {
  const game = createGame({ seed: 1 });
  startRun(game);
  handWorld(game, [makeEntity('village', 3)]);
  for (let i = 0; i < 60 * 3; i++) stepGame(game, idle, 1 / 60);
  assert.equal(game.state.water, 4);
  assert.equal(game.state.cleanDeliveries, 1);
  assert.ok(game.state.popup);
});
```

Append to `tests/world.test.js`:
```js
// --- villages (Task 9) ---

test('each segment ends with a village', () => {
  const world = createWorld(createRng(1));
  updateWorld(world, 100);
  const villages = world.entities.filter((e) => e.type === 'village').map((e) => e.x);
  assert.deepEqual(villages, [120]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test`
Expected: FAIL. Delivery tests fail with `AssertionError` (water stays 5, no pop-up); "each segment ends with a village" fails (no villages).

- [ ] **Step 3: Replace rules.js with the delivery-aware version**

`js/rules.js`:
```js
import { CONFIG, COPY } from './config.js';
import { isInvincible, makeInvincible } from './player.js';

const OBSTACLES = new Set(['rock', 'bush', 'branch']);

export function segmentAt(distance) {
  return Math.floor(distance / CONFIG.world.segmentM) + 1;
}

export function computeScore(state) {
  const S = CONFIG.score;
  const base =
    Math.floor(state.distance / S.metersPerPoint) +
    S.cleanDelivery * state.cleanDeliveries +
    S.dirtyDelivery * state.dirtyDeliveries;
  const multiplier = state.ending === 'happy' ? S.happyMultiplier : 1;
  return Math.floor(base * multiplier);
}

// The only place water and score change. Hits come from collision, nearest first.
export function updateRules(hits, state, player, dt) {
  if (state.phase !== 'playing') return;
  state.distance = player.x;
  state.segment = segmentAt(player.x);
  if (state.popup) {
    state.popup.timeLeft -= dt;
    if (state.popup.timeLeft <= 0) state.popup = null;
  }
  for (const hit of hits) {
    if (state.phase !== 'playing') break;
    if (OBSTACLES.has(hit.type)) onObstacle(state, player);
    else if (hit.type === 'village') onVillage(state);
  }
  state.score = computeScore(state);
}

function onObstacle(state, player) {
  if (isInvincible(player)) return;
  state.water = Math.max(0, state.water - CONFIG.water.hitCost);
  makeInvincible(player);
  state.events.push({ type: 'splash' });
  if (state.water <= 0) endRun(state, 'spilled');
}

function onVillage(state) {
  const W = CONFIG.water;
  const levels = Math.min(W.deliveryCost, state.water);
  if (levels <= 0) return;
  state.water -= levels;
  const liters = levels * W.litersPerLevel;
  const clean = !state.dirty;
  if (clean) state.cleanDeliveries += 1;
  else state.dirtyDeliveries += 1;
  state.litersDelivered += liters;
  const count = state.cleanDeliveries + state.dirtyDeliveries;
  state.popup = {
    liters,
    points: clean ? CONFIG.score.cleanDelivery : CONFIG.score.dirtyDelivery,
    clean,
    line: COPY.impactLines[(count - 1) % COPY.impactLines.length],
    timeLeft: CONFIG.popupS,
  };
  state.events.push({ type: 'deliver', clean });
  if (state.water <= 0) endRun(state, 'happy');
}

function endRun(state, ending) {
  state.ending = ending;
  state.phase = 'ended';
  state.score = computeScore(state);
  state.isNewHighScore = state.score > state.highScore;
  state.highScore = Math.max(state.highScore, state.score);
  state.events.push({ type: 'ended', ending });
}
```

- [ ] **Step 4: Add a village to every segment**

In `js/world/spawner.js`:

Find:
```js
      const out = [];
```

Replace with:
```js
      const out = [makeEntity('village', n * W.segmentM)];
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, 74 tests.

- [ ] **Step 6: Check it in the browser**

Expected: at 60 m a village (cream huts, well with a small yellow can icon) appears with no rocks 5 m either side. Passing it shows the cream pop-up with a yellow bar ("4 liters delivered!", "+10 points", impact line) for about 2 s while walking continues; one gauge cell empties and the HUD reads "1 village". Arrive at a village with 1 level left: end screen says "You delivered all 20 liters!" and the score includes ×1.5.

- [ ] **Step 7: Commit**

```bash
git add js/rules.js js/world/spawner.js tests/rules.test.js tests/game.test.js tests/world.test.js
git commit -m "feat: deliver water at villages with scoring and happy ending"
```

---

### Task 10: Refills, puddles and filters (build step 5, rules)

**Files:**
- Modify: `js/rules.js` (replace whole file), `tests/rules.test.js` (append)

**Interfaces:**
- Consumes: Task 9 rules.
- Produces: refill `+0.5` level capped at 5 (event `refill`); landing in a puddle sets `dirty` (event `dirty`, only when it changes); a filter clears `dirty` (event `clean`, only when it changes). This is the final `rules.js`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/rules.test.js`:
```js
// --- refills, puddles, filters (Task 10) ---

test('a refill adds half a level', () => {
  const { state, player } = setup({ water: 3 });
  updateRules([hit('refill')], state, player, 1 / 60);
  assert.equal(state.water, 3.5);
  assert.deepEqual(types(state), ['refill']);
});

test('a refill never goes above 5 levels', () => {
  const { state, player } = setup({ water: 4.5 });
  updateRules([hit('refill'), hit('refill')], state, player, 1 / 60);
  assert.equal(state.water, 5);
});

test('landing in a puddle makes water dirty but keeps the amount', () => {
  const { state, player } = setup({ water: 3 });
  updateRules([hit('puddle')], state, player, 1 / 60);
  assert.equal(state.dirty, true);
  assert.equal(state.water, 3);
  assert.deepEqual(types(state), ['dirty']);
  state.events = [];
  updateRules([hit('puddle')], state, player, 1 / 60);
  assert.deepEqual(types(state), []);
});

test('a filter cleans dirty water; on clean water it does nothing', () => {
  const { state, player } = setup({ dirty: true });
  updateRules([hit('filter')], state, player, 1 / 60);
  assert.equal(state.dirty, false);
  assert.deepEqual(types(state), ['clean']);
  state.events = [];
  updateRules([hit('filter')], state, player, 1 / 60);
  assert.deepEqual(types(state), []);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/rules.test.js`
Expected: FAIL with `AssertionError` (water stays 3, `dirty` unchanged).

- [ ] **Step 3: Replace rules.js with the final version**

`js/rules.js`:
```js
import { CONFIG, COPY } from './config.js';
import { isInvincible, makeInvincible } from './player.js';

const OBSTACLES = new Set(['rock', 'bush', 'branch']);

export function segmentAt(distance) {
  return Math.floor(distance / CONFIG.world.segmentM) + 1;
}

export function computeScore(state) {
  const S = CONFIG.score;
  const base =
    Math.floor(state.distance / S.metersPerPoint) +
    S.cleanDelivery * state.cleanDeliveries +
    S.dirtyDelivery * state.dirtyDeliveries;
  const multiplier = state.ending === 'happy' ? S.happyMultiplier : 1;
  return Math.floor(base * multiplier);
}

// The only place water and score change. Hits come from collision, nearest first.
export function updateRules(hits, state, player, dt) {
  if (state.phase !== 'playing') return;
  state.distance = player.x;
  state.segment = segmentAt(player.x);
  if (state.popup) {
    state.popup.timeLeft -= dt;
    if (state.popup.timeLeft <= 0) state.popup = null;
  }
  for (const hit of hits) {
    if (state.phase !== 'playing') break;
    if (OBSTACLES.has(hit.type)) onObstacle(state, player);
    else if (hit.type === 'refill') onRefill(state);
    else if (hit.type === 'puddle') onPuddle(state);
    else if (hit.type === 'filter') onFilter(state);
    else if (hit.type === 'village') onVillage(state);
  }
  state.score = computeScore(state);
}

function onObstacle(state, player) {
  if (isInvincible(player)) return;
  state.water = Math.max(0, state.water - CONFIG.water.hitCost);
  makeInvincible(player);
  state.events.push({ type: 'splash' });
  if (state.water <= 0) endRun(state, 'spilled');
}

function onRefill(state) {
  const W = CONFIG.water;
  state.water = Math.min(W.maxLevels, state.water + W.refillGain);
  state.events.push({ type: 'refill' });
}

function onPuddle(state) {
  if (state.dirty) return;
  state.dirty = true;
  state.events.push({ type: 'dirty' });
}

function onFilter(state) {
  if (!state.dirty) return;
  state.dirty = false;
  state.events.push({ type: 'clean' });
}

function onVillage(state) {
  const W = CONFIG.water;
  const levels = Math.min(W.deliveryCost, state.water);
  if (levels <= 0) return;
  state.water -= levels;
  const liters = levels * W.litersPerLevel;
  const clean = !state.dirty;
  if (clean) state.cleanDeliveries += 1;
  else state.dirtyDeliveries += 1;
  state.litersDelivered += liters;
  const count = state.cleanDeliveries + state.dirtyDeliveries;
  state.popup = {
    liters,
    points: clean ? CONFIG.score.cleanDelivery : CONFIG.score.dirtyDelivery,
    clean,
    line: COPY.impactLines[(count - 1) % COPY.impactLines.length],
    timeLeft: CONFIG.popupS,
  };
  state.events.push({ type: 'deliver', clean });
  if (state.water <= 0) endRun(state, 'happy');
}

function endRun(state, ending) {
  state.ending = ending;
  state.phase = 'ended';
  state.score = computeScore(state);
  state.isNewHighScore = state.score > state.highScore;
  state.highScore = Math.max(state.highScore, state.score);
  state.events.push({ type: 'ended', ending });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, 78 tests.

- [ ] **Step 5: Commit**

```bash
git add js/rules.js tests/rules.test.js
git commit -m "feat: add refill, puddle and filter rules"
```

---

### Task 11: Full segment spawner (build step 5, world)

**Files:**
- Modify: `js/world/spawner.js` (replace whole file), `tests/game.test.js` (append)
- Test: `tests/spawner.test.js`

**Interfaces:**
- Consumes: `CONFIG.world`, `CONFIG.segments`, `CONFIG.patterns`, `CONFIG.pickupY`, `CONFIG.pickupModes`, `CONFIG.filterLagSegments`, `CONFIG.setPiece`, `CONFIG.heldJumpTypes`; `makeEntity`; `randRange`, `pickWeighted`.
- Produces: `createSpawner(rng)` (same interface as Task 6) plus exported helpers `gapRange(n) → [min, max]`, `weightsFor(n)`, `puddleCount(n)`, `pickupMode(tier, rng)`. Entities may carry `setPiece: true` (risk obstacle tied to a pickup) or `group` (index of a random obstacle group within the segment).

Algorithm per segment, in order:
1. Village at `n·60`.
2. Refills at `start+15` and `start+45`, filter at `start+50`, each placed in the style for its tier (`low`, `overRock`, `high`, `beforeBranch`); filters use the tier one segment behind. Each reserves its span ± 1.5 m.
3. Puddles (0 / 1 / 2 by segment) at random spots 20–40 m in, at least 3 m apart; each reserves ± 1.5 m.
4. Random obstacle groups from `start+5` to `villageX−5`: gap drawn from the segment's range, pattern drawn from the segment's weights, swapped for a single rock if it would break a fairness rule (bush within 2.5 m of a bush, branch within 2.5 m after a puddle). A group that overlaps a reserved span slides just past it, so reserved space does not also cost a whole gap.

- [ ] **Step 1: Write the failing tests**

`tests/spawner.test.js` (checks every fairness rule over 150 seeds × 8 segments):
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createRng } from '../js/rng.js';
import { createSpawner, gapRange, puddleCount } from '../js/world/spawner.js';
import { isObstacle } from '../js/world/entities.js';

const W = CONFIG.world;
const SEEDS = 150;
const SEGMENTS = 8;
const EPS = 1e-9;

function* allSegments() {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const spawner = createSpawner(createRng(seed));
    for (let n = 1; n <= SEGMENTS; n++) yield { seed, n, ents: spawner.generateSegment(n) };
  }
}
const left = (e) => e.x - e.w / 2;
const right = (e) => e.x + e.w / 2;
const gapBetween = (a, b) => Math.max(left(a) - right(b), left(b) - right(a));

test('fixed positions: village, refills, filter', () => {
  for (const { n, ents } of allSegments()) {
    const start = (n - 1) * W.segmentM;
    const xs = (type) => ents.filter((e) => e.type === type).map((e) => e.x);
    assert.deepEqual(xs('village'), [n * W.segmentM]);
    assert.deepEqual(xs('refill'), [start + 15, start + 45]);
    assert.deepEqual(xs('filter'), [start + 50]);
  }
});

test('no obstacles in the first 5 m or near any village', () => {
  for (const { n, ents } of allSegments()) {
    const start = (n - 1) * W.segmentM;
    const safeFrom = start + (n === 1 ? W.startEmptyM : W.villageSafeM);
    const safeTo = n * W.segmentM - W.villageSafeM;
    for (const e of ents.filter(isObstacle)) {
      assert.ok(left(e) >= safeFrom - EPS && right(e) <= safeTo + EPS, `segment ${n}: ${e.type} at ${e.x}`);
    }
  }
});

test('puddles: none in segment 1, one in 2–3, two from 4, inside 20–40 m', () => {
  for (const { n, ents } of allSegments()) {
    const start = (n - 1) * W.segmentM;
    const puddles = ents.filter((e) => e.type === 'puddle');
    assert.equal(puddles.length, puddleCount(n));
    for (const p of puddles) assert.ok(p.x >= start + 20 && p.x <= start + 40);
  }
  assert.deepEqual([1, 2, 3, 4, 9].map(puddleCount), [0, 1, 1, 2, 2]);
});

test('new obstacle types appear in the right segments', () => {
  for (const { n, ents } of allSegments()) {
    const kinds = new Set(ents.filter(isObstacle).map((e) => e.type));
    if (n === 1) assert.deepEqual([...kinds].filter((k) => k !== 'rock'), []);
    if (n === 2) assert.ok(!kinds.has('branch'));
  }
});

test('no random obstacle within 1.5 m of a refill, filter or puddle', () => {
  for (const { n, ents } of allSegments()) {
    const keepClear = ents.filter((e) => ['refill', 'filter', 'puddle'].includes(e.type));
    for (const o of ents.filter((e) => isObstacle(e) && !e.setPiece)) {
      for (const k of keepClear) {
        assert.ok(gapBetween(o, k) >= W.pickupClearM - EPS, `segment ${n}: ${o.type} at ${o.x} near ${k.type} at ${k.x}`);
      }
    }
  }
});

test('high-jump obstacles are at least 2.5 m apart', () => {
  for (const { ents } of allSegments()) {
    const held = ents.filter((e) => CONFIG.heldJumpTypes.includes(e.type));
    for (let i = 1; i < held.length; i++) assert.ok(held[i].x - held[i - 1].x >= W.heldJumpMinSpacingM - EPS);
  }
});

test('no branch directly after a puddle', () => {
  for (const { ents } of allSegments()) {
    for (const p of ents.filter((e) => e.type === 'puddle')) {
      for (const b of ents.filter((e) => e.type === 'branch')) {
        const after = left(b) - right(p);
        assert.ok(!(after >= 0 && after < W.branchAfterPuddleM), `branch ${after} m after puddle`);
      }
    }
  }
});

test('random gaps respect the segment minimum', () => {
  for (const { n, ents } of allSegments()) {
    const groups = new Map();
    for (const e of ents.filter((e) => isObstacle(e) && !e.setPiece)) {
      if (!groups.has(e.group)) groups.set(e.group, []);
      groups.get(e.group).push(e);
    }
    const ordered = [...groups.values()];
    for (let i = 1; i < ordered.length; i++) {
      const gap = ordered[i][0].x - ordered[i - 1].at(-1).x;
      assert.ok(gap >= gapRange(n)[0] - EPS, `segment ${n}: gap ${gap}`);
    }
  }
});

test('gap ranges shrink 10% per segment from 5, floored at 1.8 m', () => {
  assert.deepEqual(gapRange(1), [6, 9]);
  assert.deepEqual(gapRange(4), [2.5, 4]);
  const [min5, max5] = gapRange(5);
  assert.ok(Math.abs(min5 - 2.25) < EPS && Math.abs(max5 - 3.6) < EPS);
  assert.deepEqual(gapRange(30), [1.8, 1.8]);
});

test('average obstacle counts roughly match the spec', () => {
  const totals = new Array(SEGMENTS + 1).fill(0);
  for (const { n, ents } of allSegments()) totals[n] += ents.filter((e) => isObstacle(e) && !e.setPiece).length;
  const avg = (n) => totals[n] / SEEDS;
  assert.ok(avg(1) >= 3.5 && avg(1) <= 7.5, `segment 1 avg ${avg(1)}`);
  assert.ok(avg(4) >= 9 && avg(4) <= 18, `segment 4 avg ${avg(4)}`);
  assert.ok(avg(4) > avg(1));
});

test('the same seed builds the same world', () => {
  const strip = (ents) => ents.map(({ type, x, y }) => [type, x, y]);
  const a = createSpawner(createRng(9));
  const b = createSpawner(createRng(9));
  for (let n = 1; n <= 5; n++) assert.deepEqual(strip(a.generateSegment(n)), strip(b.generateSegment(n)));
});
```

Append to `tests/game.test.js`:
```js
// --- full spawner (Task 11) ---

test('seeded full world: never jumping, the run ends within four segments', () => {
  const game = createGame({ seed: 5 });
  startRun(game);
  let hitInFirstSegment = false;
  for (let i = 0; i < 60 * 300 && game.state.phase === 'playing'; i++) {
    const events = stepGame(game, idle, 1 / 60);
    if (game.player.x < 60 && events.some((e) => e.type === 'splash')) hitInFirstSegment = true;
  }
  assert.equal(game.state.phase, 'ended');
  assert.ok(game.state.distance < 240, `ended at ${game.state.distance}`);
  assert.ok(hitInFirstSegment);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/spawner.test.js`
Expected: FAIL with `SyntaxError: The requested module '../js/world/spawner.js' does not provide an export named 'gapRange'`.

- [ ] **Step 3: Replace spawner.js with the full version**

`js/world/spawner.js`:
```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test`
Expected: PASS, 90 tests.

- [ ] **Step 5: Check it in the browser**

Expected, segment by segment:
- 0–60 m: rocks only; refill drops floating low at 15 m and 45 m (a small hop collects them, gauge rises half a cell); filter disc at 50 m.
- 60–120 m: teal bushes (need a held jump), one mud puddle (landing in it turns the gauge cells brown; jumping over is safe), refills floating above rocks.
- 120–180 m: low navy branches (walk under; jumping hits), rock pairs, high refills or refills just before a branch; the filter at 170 m turns brown water blue again.
- 180 m+: combos and two puddles; it gets intense but every gap stays clearable.

- [ ] **Step 6: Commit**

```bash
git add js/world/spawner.js tests/spawner.test.js tests/game.test.js
git commit -m "feat: full segment spawner with pickups, puddles, combos and fairness rules"
```

---

### Task 12: High score and settings in localStorage

**Files:**
- Create: `js/storage.js`
- Modify: `index.html` (add options), `js/ui.js` (two edits), `js/main.js` (replace whole file)
- Test: `tests/storage.test.js`

**Interfaces:**
- Consumes: `CONFIG.storageKeys`.
- Produces (from `js/storage.js`; every function takes an optional `storage` argument and never throws):
  - `loadHighScore(storage?) → integer ≥ 0`, `saveHighScore(score, storage?) → boolean`
  - `loadSettings(storage?, prefersReducedMotion = false) → { reducedMotion, muted }`, `saveSettings(settings, storage?) → boolean`
  - `createUI` gains `settings` and `onSettingsChange(nextSettings)`. `document.body` gets class `reduced-motion` when that setting is on (used in Task 13).

- [ ] **Step 1: Write the failing test**

`tests/storage.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { loadHighScore, saveHighScore, loadSettings, saveSettings } from '../js/storage.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)) };
}
const throwingStorage = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('QuotaExceededError'); },
};
const K = CONFIG.storageKeys;

test('high score round-trips', () => {
  const s = memoryStorage();
  assert.equal(loadHighScore(s), 0);
  assert.equal(saveHighScore(42, s), true);
  assert.equal(loadHighScore(s), 42);
});

test('blocked or missing storage never throws', () => {
  assert.equal(loadHighScore(throwingStorage), 0);
  assert.equal(saveHighScore(5, throwingStorage), false);
  assert.equal(loadHighScore(null), 0);
  assert.equal(saveHighScore(5, null), true);
});

test('corrupted high scores read as 0', () => {
  for (const bad of ['abc', '-5', '', 'NaN']) assert.equal(loadHighScore(memoryStorage({ [K.highScore]: bad })), 0);
});

test('settings default to the OS reduced-motion preference', () => {
  assert.deepEqual(loadSettings(memoryStorage(), true), { reducedMotion: true, muted: false });
  assert.deepEqual(loadSettings(throwingStorage, false), { reducedMotion: false, muted: false });
});

test('saved settings win; bad JSON or wrong types fall back to defaults', () => {
  const s = memoryStorage();
  saveSettings({ reducedMotion: false, muted: true }, s);
  assert.deepEqual(loadSettings(s, true), { reducedMotion: false, muted: true });
  assert.deepEqual(loadSettings(memoryStorage({ [K.settings]: '{oops' }), true), { reducedMotion: true, muted: false });
  assert.deepEqual(loadSettings(memoryStorage({ [K.settings]: '{"muted":"yes"}' }), false), { reducedMotion: false, muted: false });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/storage.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/storage.js`.

- [ ] **Step 3: Write storage.js**

`js/storage.js`:
```js
import { CONFIG } from './config.js';

const DEFAULT_SETTINGS = { reducedMotion: false, muted: false };

// Reading localStorage itself can throw when storage is blocked.
function defaultStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadHighScore(storage = defaultStorage()) {
  try {
    const n = Number.parseInt(storage?.getItem(CONFIG.storageKeys.highScore) ?? '0', 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score, storage = defaultStorage()) {
  try {
    storage?.setItem(CONFIG.storageKeys.highScore, String(Math.floor(score)));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(storage = defaultStorage(), prefersReducedMotion = false) {
  const defaults = { ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion };
  try {
    const saved = JSON.parse(storage?.getItem(CONFIG.storageKeys.settings) ?? 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    const pick = (key) => (typeof saved[key] === 'boolean' ? saved[key] : defaults[key]);
    return { reducedMotion: pick('reducedMotion'), muted: pick('muted') };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings, storage = defaultStorage()) {
  try {
    storage?.setItem(CONFIG.storageKeys.settings, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS, 95 tests.

- [ ] **Step 5: Add the option toggles to the start screen**

In `index.html`:

Find:
```html
        <button id="start-btn" class="btn btn-primary" type="button">Start walking</button>
```

Replace with:
```html
        <button id="start-btn" class="btn btn-primary" type="button">Start walking</button>
        <div class="options">
          <label class="toggle"><input id="opt-reduced-motion" type="checkbox"> Reduced motion</label>
          <label class="toggle"><input id="opt-sound" type="checkbox" checked> Sound</label>
        </div>
```

- [ ] **Step 6: Wire settings into ui.js**

In `js/ui.js`:

Find:
```js
export function createUI({ onStart, onPause, onResume, onPlayAgain }) {
```

Replace with:
```js
export function createUI({ settings, onStart, onPause, onResume, onPlayAgain, onSettingsChange }) {
```

Find:
```js
  onClick('again-btn', onPlayAgain);
```

Replace with:
```js
  onClick('again-btn', onPlayAgain);

  let current = { ...settings };
  const change = (patch) => {
    current = { ...current, ...patch };
    onSettingsChange(current);
  };
  const reduced = $('opt-reduced-motion');
  reduced.checked = current.reducedMotion;
  reduced.addEventListener('change', () => change({ reducedMotion: reduced.checked }));
  const sound = $('opt-sound');
  sound.checked = !current.muted;
  sound.addEventListener('change', () => change({ muted: !sound.checked }));
```

- [ ] **Step 7: Replace main.js**

`js/main.js`:
```js
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
```

- [ ] **Step 8: Check it in the browser**

Expected: finish a run, reload: "Best score" shows it. Tick "Reduced motion", reload: still ticked, and `<body>` has class `reduced-motion`. In a private window with storage blocked (or after running `localStorage.setItem('edh.highScore', 'abc')` in the console and reloading), the game still starts and shows best score 0.

- [ ] **Step 9: Commit**

```bash
git add js/storage.js tests/storage.test.js index.html js/ui.js js/main.js
git commit -m "feat: save high score and settings with safe localStorage"
```

---

### Task 13: Effects, squash and stretch, reduced motion (build step 7, part 1)

**Files:**
- Create: `js/render/effects.js`
- Modify: `js/ui.js` (five edits), `css/style.css` (one edit), `js/main.js` (replace whole file)
- Test: `tests/effects.test.js`

**Interfaces:**
- Consumes: events `splash`, `refill`, `deliver`, `dirty`, `clean`, `land` from `stepGame`; `CONFIG.fx`; `CONFIG.colors`.
- Produces: `createEffects() → { reducedMotion, particleCount, setReducedMotion(on), clear(), ingest(events, player), update(dt), flashColor() → color | null, canTransform(player) → { sx, sy, tilt }, draw(ctx, cam) }`. The renderer from Task 5 already calls `canTransform`, `flashColor`, `reducedMotion` and `draw` when it is given an effects object. `ui.update(state, events)` pulses the gauge.

- [ ] **Step 1: Write the failing test**

`tests/effects.test.js`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { createEffects } from '../js/render/effects.js';
import { createPlayer } from '../js/player.js';

test('a splash spawns particles that fade out', () => {
  const fx = createEffects();
  fx.ingest([{ type: 'splash' }], createPlayer());
  assert.equal(fx.particleCount, CONFIG.fx.splash.count);
  for (let i = 0; i < 60; i++) fx.update(1 / 60);
  assert.equal(fx.particleCount, 0);
});

test('a filter ripple and a refill sparkle both show', () => {
  const fx = createEffects();
  fx.ingest([{ type: 'clean' }, { type: 'refill' }], createPlayer());
  assert.equal(fx.particleCount, 1 + CONFIG.fx.sparkle.count);
});

test('landing squashes the can, then it returns to normal', () => {
  const fx = createEffects();
  const p = createPlayer();
  fx.ingest([{ type: 'land' }], p);
  assert.ok(fx.canTransform(p).sy < 1);
  for (let i = 0; i < 60; i++) fx.update(1 / 60);
  assert.deepEqual(fx.canTransform(p), { sx: 1, sy: 1, tilt: 0 });
});

test('the can stretches in the air, within the limit', () => {
  const fx = createEffects();
  const p = Object.assign(createPlayer(), { onGround: false, vy: 50 });
  assert.equal(fx.canTransform(p).sy, 1 + CONFIG.fx.squash.maxStretch);
});

test('reduced motion: no particles, no squash, a short color flash instead', () => {
  const fx = createEffects();
  fx.setReducedMotion(true);
  const p = createPlayer();
  fx.ingest([{ type: 'splash' }, { type: 'land' }], p);
  assert.equal(fx.particleCount, 0);
  assert.deepEqual(fx.canTransform(p), { sx: 1, sy: 1, tilt: 0 });
  assert.equal(fx.flashColor(), CONFIG.colors.dustyBlue);
  for (let i = 0; i < 30; i++) fx.update(1 / 60);
  assert.equal(fx.flashColor(), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/effects.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/render/effects.js`.

- [ ] **Step 3: Write effects.js**

Effects keep only visual state (particles, timers) and never touch game state. With reduced motion there are no particles, no squash, no blink: a short colored outline on the can and a static highlight on the gauge show the same events.

`js/render/effects.js`:
```js
import { CONFIG } from '../config.js';

const FX = CONFIG.fx;
const C = CONFIG.colors;

// How each game event looks on the can.
const EVENT_LOOK = {
  splash: { kind: 'splash', color: 'dustyBlue' },
  refill: { kind: 'sparkle', color: 'yellow' },
  deliver: { kind: 'sparkle', color: 'yellow' },
  dirty: { kind: 'dirty', color: 'mud' },
  clean: { ripple: true, color: 'dustyBlue' },
};

// Visual-only state (particles, timers). Reads game events; never changes game state.
export function createEffects() {
  let particles = [];
  let ripples = [];
  let flash = null; // { color, timeLeft }: reduced-motion stand-in for particles
  let landT = Infinity; // seconds since the last landing
  let reducedMotion = false;

  function burst(kind, x, y, color) {
    const spec = FX[kind];
    const [a0, a1] = FX.fan;
    for (let i = 0; i < spec.count; i++) {
      const angle = Math.PI * (a0 + Math.random() * (a1 - a0));
      const speed = spec.speed[0] + Math.random() * (spec.speed[1] - spec.speed[0]);
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: spec.lifeS, maxLife: spec.lifeS, size: spec.size, color });
    }
  }

  return {
    get reducedMotion() {
      return reducedMotion;
    },
    get particleCount() {
      return particles.length + ripples.length;
    },
    setReducedMotion(on) {
      reducedMotion = on;
      if (on) {
        particles = [];
        ripples = [];
      }
    },
    clear() {
      particles = [];
      ripples = [];
      flash = null;
      landT = Infinity;
    },
    ingest(events, player) {
      for (const e of events) {
        if (e.type === 'land') landT = 0;
        const look = EVENT_LOOK[e.type];
        if (!look) continue;
        if (reducedMotion) {
          flash = { color: C[look.color], timeLeft: FX.flashS };
        } else if (look.ripple) {
          ripples.push({ x: player.x, y: player.y + CONFIG.can.drawH / 2, life: FX.ripple.lifeS });
        } else {
          burst(look.kind, player.x, player.y + CONFIG.can.drawH, C[look.color]);
        }
      }
    },
    update(dt) {
      landT += dt;
      if (flash) {
        flash.timeLeft -= dt;
        if (flash.timeLeft <= 0) flash = null;
      }
      for (const p of particles) {
        p.vy -= FX.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
      }
      particles = particles.filter((p) => p.life > 0);
      for (const r of ripples) r.life -= dt;
      ripples = ripples.filter((r) => r.life > 0);
    },
    flashColor() {
      return flash ? flash.color : null;
    },
    // Squash and stretch on jumps, a small slosh tilt after landing.
    canTransform(player) {
      if (reducedMotion) return { sx: 1, sy: 1, tilt: 0 };
      const S = FX.squash;
      const L = FX.slosh;
      let sy = 1;
      if (!player.onGround) sy = 1 + Math.min(S.maxStretch, Math.abs(player.vy) * S.airStretchPerMps);
      else if (landT < S.landS) sy = 1 - S.landSquash * (1 - landT / S.landS);
      const tilt = landT < L.durationS ? Math.sin(landT * L.hz * 2 * Math.PI) * L.amplitudeRad * (1 - landT / L.durationS) : 0;
      return { sx: 1 / sy, sy, tilt };
    },
    draw(ctx, cam) {
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(cam.toX(p.x), cam.toY(p.y), cam.len(p.size), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = C.dustyBlue;
      ctx.lineWidth = 3;
      for (const r of ripples) {
        const t = 1 - r.life / FX.ripple.lifeS;
        ctx.globalAlpha = 1 - t;
        ctx.beginPath();
        ctx.arc(cam.toX(r.x), cam.toY(r.y), cam.len(FX.ripple.maxRadiusM * t), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test`
Expected: PASS, 100 tests.

- [ ] **Step 5: Pulse the gauge on events (ui.js)**

In `js/ui.js`, make these five edits:

Find:
```js
const $ = (id) => document.getElementById(id);
```

Replace with:
```js
const $ = (id) => document.getElementById(id);

// Gauge animation class for each game event.
const GAUGE_FX = { splash: 'fx-splash', refill: 'fx-sparkle', clean: 'fx-ripple', dirty: 'fx-dirty' };
```

Find:
```js
  const shown = {}; // last value written per field, to skip unchanged DOM writes
```

Replace with:
```js
  const shown = {}; // last value written per field, to skip unchanged DOM writes
  const fxTimers = {};
```

Find:
```js
    shown[key] = value;
    apply(value);
  }
```

Replace with:
```js
    shown[key] = value;
    apply(value);
  }
  function pulse(cls) {
    el.gauge.classList.remove(cls);
    void el.gauge.offsetWidth; // restart the animation
    el.gauge.classList.add(cls);
    clearTimeout(fxTimers[cls]);
    fxTimers[cls] = setTimeout(() => el.gauge.classList.remove(cls), CONFIG.fx.gaugeFxS * 1000);
  }
```

Find:
```js
    update(state) {
```

Replace with:
```js
    update(state, events = []) {
```

Find:
```js
        $('start-best').textContent = best;
      });
```

Replace with:
```js
        $('start-best').textContent = best;
      });
      for (const e of events) if (GAUGE_FX[e.type]) pulse(GAUGE_FX[e.type]);
```

- [ ] **Step 6: Add gauge effect styles**

In `css/style.css`:

Find:
```css
/* Short landscape phones: tighter cards */
```

Replace with:
```css
/* Gauge effects. Each has a static highlight, so reduced motion still shows what happened. */
.gauge.fx-splash { box-shadow: 0 0 0 3px var(--dusty-blue); animation: gauge-shake 0.4s; }
.gauge.fx-sparkle { box-shadow: 0 0 0 3px var(--yellow); animation: gauge-glow 0.6s; }
.gauge.fx-ripple { box-shadow: 0 0 0 3px var(--dusty-blue); }
.gauge.fx-ripple .gauge-fill { animation: gauge-ripple 0.6s; }
.gauge.fx-dirty { box-shadow: 0 0 0 3px var(--mud); }
@keyframes gauge-shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes gauge-glow { 50% { box-shadow: 0 0 0 7px var(--yellow); } }
@keyframes gauge-ripple { 50% { filter: brightness(1.5); } }

body.reduced-motion .gauge,
body.reduced-motion .gauge *,
body.reduced-motion .popup { animation: none !important; transition: none !important; }

/* Short landscape phones: tighter cards */
```

- [ ] **Step 7: Replace main.js**

`js/main.js`:
```js
import { createGame, startRun, resetRun, togglePause, clampDt, stepGame } from './game.js';
import { createInput } from './input.js';
import { createRenderer } from './render/renderer.js';
import { createEffects } from './render/effects.js';
import { createUI } from './ui.js';
import { loadHighScore, saveHighScore, loadSettings, saveSettings } from './storage.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let settings = loadSettings(undefined, prefersReducedMotion);

const game = createGame({ highScore: loadHighScore() });
const effects = createEffects();
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
  effects.setReducedMotion(settings.reducedMotion);
}

function begin() {
  input.clear();
  effects.clear();
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
  effects.ingest(events, game.player);
  if (game.state.phase === 'playing') effects.update(clampDt(rawDt));
  if (events.some((e) => e.type === 'ended')) saveHighScore(game.state.highScore);
  renderer.draw(game.state, game.player, game.world.entities, effects);
  ui.update(game.state, events);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

- [ ] **Step 8: Check it in the browser**

Expected:
- Jump: the can stretches tall in the air, squashes on landing and tilts back and forth briefly (slosh).
- Hit: blue droplets burst from the can and the gauge shakes with a blue ring.
- Refill: yellow sparkles and a yellow glow on the gauge.
- Puddle: brown drops, the can gets a brown tint, the gauge cells turn brown.
- Filter: a blue ripple ring on the can and the gauge brightens.
- Tick "Reduced motion" and replay: none of the movement above; instead the can's outline flashes the event color and the gauge shows a static colored ring for about half a second. The can does not blink while invincible (it stays semi-transparent).

- [ ] **Step 9: Commit**

```bash
git add js/render/effects.js tests/effects.test.js js/ui.js css/style.css js/main.js
git commit -m "feat: add splash, sparkle, ripple and squash effects with reduced motion"
```

---

### Task 14: Sound, auto-pause and final playtest (build step 7, part 2)

**Files:**
- Create: `js/audio.js`
- Modify: `js/main.js` (replace whole file; final version)
- Test: existing suite plus the playtest checklist below

**Interfaces:**
- Consumes: event types, `CONFIG.audio`, `settings.muted`, `pauseIfPlaying` (Task 5).
- Produces: `createAudio() → { unlock(), setMuted(muted), play(eventType) }`. Audio failures are swallowed so sound can never break the game.

- [ ] **Step 1: Write audio.js**

Browsers only allow sound after a user gesture, so `unlock()` runs from the Start / Play again click.

`js/audio.js`:
```js
import { CONFIG } from './config.js';

// Short synthesized tones; no audio files needed. Failures never break the game.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function context() {
    if (!ctx) {
      const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  return {
    unlock() {
      try {
        context(); // browsers only allow audio after a user gesture
      } catch {
        ctx = null;
      }
    },
    setMuted(value) {
      muted = value;
    },
    play(type) {
      const tone = CONFIG.audio.tones[type];
      if (muted || !tone) return;
      try {
        const ac = context();
        if (!ac) return;
        const [freq, seconds] = tone;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(CONFIG.audio.volume, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + seconds);
        osc.connect(gain).connect(ac.destination);
        osc.start();
        osc.stop(ac.currentTime + seconds);
      } catch {
        // sound is optional
      }
    },
  };
}
```

- [ ] **Step 2: Replace main.js with the final version**

Adds sound and pauses the walk when the tab is hidden or the window loses focus (Review Focus 1).

`js/main.js`:
```js
import { createGame, startRun, resetRun, togglePause, pauseIfPlaying, clampDt, stepGame } from './game.js';
import { createInput } from './input.js';
import { createRenderer } from './render/renderer.js';
import { createEffects } from './render/effects.js';
import { createUI } from './ui.js';
import { createAudio } from './audio.js';
import { loadHighScore, saveHighScore, loadSettings, saveSettings } from './storage.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let settings = loadSettings(undefined, prefersReducedMotion);

const game = createGame({ highScore: loadHighScore() });
const effects = createEffects();
const audio = createAudio();
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
  effects.setReducedMotion(settings.reducedMotion);
  audio.setMuted(settings.muted);
}

function begin() {
  input.clear();
  effects.clear();
  audio.unlock();
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

// Leaving the tab or window pauses the walk.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseIfPlaying(game);
});
window.addEventListener('blur', () => pauseIfPlaying(game));

let last = performance.now();
function frame(now) {
  const rawDt = (now - last) / 1000;
  last = now;
  const events = stepGame(game, input, rawDt);
  effects.ingest(events, game.player);
  if (game.state.phase === 'playing') effects.update(clampDt(rawDt));
  for (const e of events) audio.play(e.type);
  if (events.some((e) => e.type === 'ended')) saveHighScore(game.state.highScore);
  renderer.draw(game.state, game.player, game.world.entities, effects);
  ui.update(game.state, events);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

- [ ] **Step 3: Run the full suite**

Run: `node --test`
Expected: PASS, 100 tests.

- [ ] **Step 4: Playtest checklist**

Serve the game and go through each item. Use DevTools device mode for the phone sizes.

- [ ] Sound: short tones on jump, hit, refill, filter, puddle, delivery and the end. Unticking "Sound" silences them, and that survives a reload.
- [ ] Switch tabs mid-run and come back: the game is on "Paused" and the can has not moved.
- [ ] 1280×720 and 1920×1080: can and obstacles large, about 5 m of world visible.
- [ ] 844×390 (phone landscape) and 390×844 (phone portrait): the whole HUD fits, the start and end cards fit or scroll, at least 5 m of world is visible, and tap / press-and-hold jump works with touch emulation.
- [ ] A casual run (miss about one obstacle per segment, catch about half the refills) lasts roughly 2:40–3:05.
- [ ] A late-game screenshot: the yellow can catches the eye before the bushes. If not, darken `teal` / `tealShadow` one step in `CONFIG.colors`.
- [ ] Text contrast: no white on yellow, no yellow on cream.
- [ ] End screen: Donate opens https://www.charitywater.org/ in a new tab; "100% of public donations go directly to water projects." sits directly under it.
- [ ] Before launch: replace `COPY.impactLines` and `COPY.endFact` with lines sourced from charitywater.org, and swap the text wordmark for the official logo in `assets/images/` if you have permission to use it.

- [ ] **Step 5: Commit**

```bash
git add js/audio.js js/main.js
git commit -m "feat: add sound and auto-pause on hidden tab"
```

---

## Deviations Log

Every difference between this plan and the code that gets built. Newest last.

| Date | Task | What changed | Why | Approved by Freya? |
|---|---|---|---|---|
| 2026-10-15 | Final review | `js/render/renderer.js`: the can's rounded rectangles go through a `roundRect(ctx, …)` helper that falls back to `ctx.rect` when `ctx.roundRect` is missing. New test `tests/renderer.test.js` ("the can draws on browsers without ctx.roundRect"); suite is now 101 tests. | On Safari < 16 / Firefox < 112 `ctx.roundRect` does not exist, so building the start screen threw and the game never started. Not game logic (drawing only). | Not needed (non-logic fix, per Working Agreement 1); reported to Freya |
| 2026-10-15 | Post-review | **Second happy ending.** `rules.js` tracks `state.litersSpilled` (a hit spills `min(1, water)` levels × 4 L). Running dry from a hit ends `outdelivered` (happy, ×1.5) when liters delivered > liters spilled; a tie is `spilled`. Emptying at a village is still `happy`. 5 new tests in `tests/rules.test.js`. | Review found refills (+½ +½) exactly offset each village (−1), so a player who caught every refill could never reach the happy ending, and skipping refills scored best. | Yes: Freya chose option B with this modification |
| 2026-10-15 | Post-review | **End title** `COPY.happyTitle` is now a function: "You delivered [N] liters!" with N = liters delivered; new `COPY.outdeliveredBody` "More water made it home than spilled on the way." Config test updated. | "You delivered all 20 liters!" was untrue on most happy endings. | Yes: Freya chose both lines |
| 2026-10-15 | Post-review | **HUD tally:** "Delivered N L / Spilled N L" beside the water cells (`index.html`, `css/style.css`, `js/ui.js`); Delivered turns yellow while ahead. Stacks under the cells below 480 px wide. Gauge role changed from `img` to `group` so the tally text is readable by screen readers. | Players need to see the new happy-ending rule while playing. | Yes: Freya chose the delivered-vs-spilled design |
| 2026-10-15 | Post-review | **End card** adds a "Liters spilled" stat; Best is no longer full width. | Explains which ending you got. Claude's call, easy to remove. | Not asked; reported to Freya |
| 2026-10-15 | Post-review | **Settings toggles** (reduced motion, sound) also on the end screen; all copies use `data-setting` and stay in sync. | "Play again" skips the start screen, so settings were unreachable after the first run. | Yes: Freya asked for it |
| 2026-10-15 | Post-review | `rules.js` imports `OBSTACLE_TYPES` from `world/entities.js` instead of repeating the list. No behavior change. | Removes a duplicate that could drift when adding obstacle types. | Yes: Freya chose "fix now" |
| 2026-10-15 | Post-review | `CLAUDE.md` endings, scoring multiplier, HUD and end-screen lines updated to the rules above. | Keep the project brief true for future sessions. | Reported to Freya |
| 2026-10-15 | Post-review | **Start-screen hero** is Freya's `assets/images/jerry_can_yellow.png` (163×226 px) in an `<img>`, shown 112 CSS px tall so it stays sharp on 2× screens; the canvas-drawn hero and `drawHeroCan` in `ui.js` are removed. A CSS `drop-shadow` adds the navy outline the brand spec asks for. Fixes the deferred "blurry hero" minor. | Freya supplied the art. | Yes: Freya asked; the outline is Claude's call, easy to remove |
| 2026-10-15 | Post-review | **Logo:** the "charity: water" text on the start and end screens is replaced by Freya's `charitywater_logo_horizontal_BlackText.png`. The file is a 751×751 square with the logo in a thin band, so a tightly cropped copy (`…_cropped.png`, 672×86, transparent) is what the page uses, shown 220 px wide; the original is kept. | Placeholder replaced with the official logo Freya supplied. | Yes: Freya asked; cropping is Claude's call |
| 2026-10-15 | Post-review | **End fact:** `COPY.endFactTitle` "why water?" and `COPY.endFact` "696 million people in the world live without clean water." (shown as a bold title plus a line, no longer italic). Config test pins both. `COPY.impactLines` are still placeholders. | Placeholder replaced with Freya's sourced line. | Yes: Freya supplied the text |

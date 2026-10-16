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
  happyTitle: (liters) => `You delivered ${liters} liters!`,
  happyBody: 'Every drop made it home.',
  outdeliveredBody: 'More water made it home than spilled on the way.',
  spilledTitle: 'The can ran dry before the next village.',
  spilledBody: 'You made it further than you think. One more walk?',
  // PLACEHOLDER: replace with impact lines sourced from charitywater.org before launch.
  impactLines: ['A family can cook and drink today.', 'Water for a whole household today.', 'One more home reached.'],
  // PLACEHOLDER: replace with one fact sourced from charitywater.org before launch.
  endFact: 'Placeholder: add one sourced charity: water fact about real water collection here.',
  donateNote: '100% of public donations go directly to water projects.',
};

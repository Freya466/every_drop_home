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

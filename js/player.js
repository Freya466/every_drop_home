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

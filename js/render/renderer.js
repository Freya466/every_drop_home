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

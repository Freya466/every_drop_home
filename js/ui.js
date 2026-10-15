import { CONFIG, COPY } from './config.js';
import { drawCanShape } from './render/renderer.js';

const $ = (id) => document.getElementById(id);

// DOM screens and HUD. Reads state; never changes it. Buttons call the handlers.
export function createUI({ settings, onStart, onPause, onResume, onPlayAgain, onSettingsChange }) {
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

import { CONFIG, COPY } from './config.js';

const $ = (id) => document.getElementById(id);

// Gauge animation class for each game event.
const GAUGE_FX = { splash: 'fx-splash', refill: 'fx-sparkle', clean: 'fx-ripple', dirty: 'fx-dirty' };

// DOM screens and HUD. Reads state; never changes it. Buttons call the handlers.
export function createUI({ settings, onStart, onPause, onResume, onPlayAgain, onSettingsChange }) {
  const el = {
    hud: $('hud'),
    gauge: $('gauge'),
    fills: [...document.querySelectorAll('.gauge-fill')],
    distance: $('hud-distance'),
    villages: $('hud-villages'),
    delivered: $('hud-delivered'),
    spilled: $('hud-spilled'),
    popup: $('popup'),
    screens: { start: $('screen-start'), paused: $('screen-pause'), ended: $('screen-end') },
  };

  $('start-tagline').textContent = COPY.tagline;
  $('start-premise').textContent = COPY.premise;
  $('start-howto').textContent = COPY.howTo;
  $('end-fact').textContent = COPY.endFact;
  $('donate-note').textContent = COPY.donateNote;
  $('donate-btn').href = CONFIG.donateUrl;

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

  // Settings toggles appear on more than one screen; all copies stay in sync.
  let current = { ...settings };
  const toggles = [...document.querySelectorAll('[data-setting]')];
  const showSettings = () => {
    for (const t of toggles) t.checked = t.dataset.setting === 'sound' ? !current.muted : current.reducedMotion;
  };
  for (const t of toggles) {
    t.addEventListener('change', () => {
      current = { ...current, ...(t.dataset.setting === 'sound' ? { muted: !t.checked } : { reducedMotion: t.checked }) };
      showSettings();
      onSettingsChange(current);
    });
  }
  showSettings();

  const shown = {}; // last value written per field, to skip unchanged DOM writes
  const fxTimers = {};
  function set(key, value, apply) {
    if (shown[key] === value) return;
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

  return {
    update(state, events = []) {
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
      set('tally', `${state.litersDelivered}|${state.litersSpilled}`, () => {
        el.delivered.textContent = `Delivered ${state.litersDelivered} L`;
        el.spilled.textContent = `Spilled ${state.litersSpilled} L`;
        el.delivered.classList.toggle('ahead', state.litersDelivered > state.litersSpilled);
      });
      set('popup', state.popup ? state.cleanDeliveries + state.dirtyDeliveries : null, (n) => {
        el.popup.hidden = n === null;
        if (n !== null) fillPopup(state.popup);
      });
      set('best', state.highScore, (best) => {
        $('start-best').textContent = best;
      });
      for (const e of events) if (GAUGE_FX[e.type]) pulse(GAUGE_FX[e.type]);
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
  const happy = state.ending !== 'spilled';
  $('end-title').textContent = happy ? COPY.happyTitle(state.litersDelivered) : COPY.spilledTitle;
  $('end-body').textContent = { happy: COPY.happyBody, outdelivered: COPY.outdeliveredBody, spilled: COPY.spilledBody }[state.ending];
  $('end-distance').textContent = `${Math.floor(state.distance)} m`;
  $('end-liters').textContent = `${state.litersDelivered} L`;
  $('end-spilled').textContent = `${state.litersSpilled} L`;
  $('end-deliveries').textContent = `${state.cleanDeliveries} clean / ${state.dirtyDeliveries} dirty`;
  $('end-score').textContent = state.score;
  $('end-best').textContent = state.isNewHighScore ? `${state.highScore} (new best!)` : state.highScore;
}

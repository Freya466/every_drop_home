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

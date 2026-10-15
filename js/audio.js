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

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

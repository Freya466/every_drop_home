import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawCanShape } from '../js/render/renderer.js';

// A 2D context with every method as a no-op, but without roundRect
// (Safari < 16, Firefox < 112).
function contextWithoutRoundRect() {
  const props = {};
  return new Proxy(props, {
    get(target, key) {
      if (key === 'roundRect') return undefined;
      if (key in target) return target[key];
      return () => {};
    },
    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
}

test('the can draws on browsers without ctx.roundRect', () => {
  assert.doesNotThrow(() => drawCanShape(contextWithoutRoundRect(), 36, 46, { dirty: true }));
});

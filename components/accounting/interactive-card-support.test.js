import test from 'node:test';
import assert from 'node:assert/strict';

import { getCardPressStyle } from './interactive-card-support.js';

test('returns the idle card shadow when not pressed', () => {
  const cardShadow = {
    shadowColor: '#1F2A24',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };

  assert.deepEqual(getCardPressStyle(cardShadow, false), {
    transform: [{ scale: 1 }],
    shadowColor: '#1F2A24',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  });
});

test('reduces scale and shadow depth while pressed', () => {
  const cardShadow = {
    shadowColor: '#1F2A24',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  };

  assert.deepEqual(getCardPressStyle(cardShadow, true), {
    transform: [{ scale: 0.985 }],
    shadowColor: '#1F2A24',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  });
});

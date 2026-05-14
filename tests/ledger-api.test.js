import test from 'node:test';
import assert from 'node:assert/strict';

import { createLedgerApi } from '../lib/ledger-api.js';

test('ledger api lists user ledgers with bearer auth and normalizes current selection', async () => {
  /** @type {Array<{ method: string, path: string, headers?: Record<string, string>, body?: unknown }>} */
  const requests = [];
  const api = createLedgerApi({
    apiClient: {
      async get(path, options = {}) {
        requests.push({
          method: 'GET',
          path,
          headers: options.headers ?? {},
        });

        return {
          status: true,
          data: {
            currentLedgerId: 'ledger-home',
            ledgers: [
              {
                id: 'ledger-home',
                name: 'Home',
                base_currency: 'CNY',
              },
              {
                id: 'ledger-travel',
                name: 'Travel',
                base_currency: 'USD',
              },
            ],
          },
        };
      },
      async post() {
        return { status: true, data: {} };
      },
    },
  });

  const result = await api.listMyLedgers('token-ledger');

  assert.deepEqual(requests, [
    {
      method: 'GET',
      path: '/ledgers',
      headers: {
        authorization: 'Bearer token-ledger',
      },
    },
  ]);
  assert.equal(result.currentLedgerId, 'ledger-home');
  assert.deepEqual(result.ledgers, [
    {
      id: 'ledger-home',
      name: 'Home',
      baseCurrency: 'CNY',
      ownerUserId: null,
    },
    {
      id: 'ledger-travel',
      name: 'Travel',
      baseCurrency: 'USD',
      ownerUserId: null,
    },
  ]);
});

test('ledger api creates and selects ledgers with the existing server contract', async () => {
  /** @type {Array<{ method: string, path: string, headers?: Record<string, string>, body?: unknown }>} */
  const requests = [];
  const api = createLedgerApi({
    apiClient: {
      async get() {
        return { status: true, data: { ledgers: [], currentLedgerId: null } };
      },
      async post(path, body, options = {}) {
        requests.push({
          method: 'POST',
          path,
          body,
          headers: options.headers ?? {},
        });

        if (path === '/ledgers') {
          return {
            status: true,
            data: {
              currentLedgerId: 'ledger-business',
              ledger: {
                id: 'ledger-business',
                name: 'Business',
                base_currency: 'USD',
                owner_user_id: 'user-1',
              },
            },
          };
        }

        return {
          status: true,
          data: {
            currentLedgerId: 'ledger-travel',
          },
        };
      },
    },
  });

  const created = await api.createLedger('token-ledger', {
    name: 'Business',
    baseCurrency: 'USD',
  });
  const switched = await api.switchLedger('token-ledger', 'ledger-travel');

  assert.deepEqual(requests, [
    {
      method: 'POST',
      path: '/ledgers',
      body: {
        name: 'Business',
        base_currency: 'USD',
      },
      headers: {
        authorization: 'Bearer token-ledger',
      },
    },
    {
      method: 'POST',
      path: '/ledgers/ledger-travel/select',
      body: undefined,
      headers: {
        authorization: 'Bearer token-ledger',
      },
    },
  ]);
  assert.deepEqual(created, {
    currentLedgerId: 'ledger-business',
    ledger: {
      id: 'ledger-business',
      name: 'Business',
      baseCurrency: 'USD',
      ownerUserId: 'user-1',
    },
  });
  assert.equal(switched.currentLedgerId, 'ledger-travel');
});

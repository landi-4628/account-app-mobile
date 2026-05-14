import test from 'node:test';
import assert from 'node:assert/strict';

import { createAuthApi } from '../lib/auth-api.js';

test('login persists the bearer session payload returned by the auth endpoint contract', async () => {
  /** @type {Array<{ url: string, init: RequestInit }>} */
  const requests = [];
  const api = createAuthApi({
    apiClient: {
      async post(path, body, options = {}) {
        requests.push({
          url: path,
          init: {
            method: 'POST',
            headers: options.headers ?? {},
            body,
          },
        });

        return {
          status: true,
          data: {
            user: {
              id: 19,
              name: 'Remote User',
              email: 'remote@example.com',
            },
            tokens: {
              accessToken: 'header.payload.signature',
            },
          },
        };
      },
    },
    now: () => '2026-05-13T12:00:00.000Z',
  });

  const result = await api.login({
    email: 'remote@example.com',
    password: 'secret-123',
  });

  assert.deepEqual(requests, [
    {
      url: '/auth/login',
      init: {
        method: 'POST',
        headers: {},
        body: {
          email: 'remote@example.com',
          password: 'secret-123',
        },
      },
    },
  ]);
  assert.equal(result.session.userId, '19');
  assert.equal(result.session.accessToken, 'header.payload.signature');
  assert.equal(result.session.updatedAt, '2026-05-13T12:00:00.000Z');
  assert.equal(result.user.email, 'remote@example.com');
});

test('authenticated auth api calls attach the bearer token and preserve returned user fields', async () => {
  /** @type {Array<{ method: string, path: string, body?: unknown, headers?: Record<string, string> }>} */
  const requests = [];
  const api = createAuthApi({
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
            user: {
              id: 7,
              name: 'Current User',
              email: 'current@example.com',
            },
          },
        };
      },
      async patch(path, body, options = {}) {
        requests.push({
          method: 'PATCH',
          path,
          body,
          headers: options.headers ?? {},
        });

        return {
          status: true,
          data: {
            user: {
              id: 7,
              name: 'Updated User',
              email: 'updated@example.com',
            },
          },
        };
      },
      async post(path, body, options = {}) {
        requests.push({
          method: 'POST',
          path,
          body,
          headers: options.headers ?? {},
        });

        return {
          status: true,
          data: {},
        };
      },
    },
  });

  const user = await api.getCurrentUser('token-7');
  const updated = await api.updateProfile('token-7', {
    name: 'Updated User',
    email: 'updated@example.com',
  });
  await api.changePassword('token-7', {
    currentPassword: 'old-secret',
    nextPassword: 'new-secret',
  });
  await api.logout();

  assert.deepEqual(requests, [
    {
      method: 'GET',
      path: '/me',
      headers: {
        authorization: 'Bearer token-7',
      },
    },
    {
      method: 'PATCH',
      path: '/me',
      body: {
        name: 'Updated User',
        email: 'updated@example.com',
      },
      headers: {
        authorization: 'Bearer token-7',
      },
    },
    {
      method: 'POST',
      path: '/me/change-password',
      body: {
        currentPassword: 'old-secret',
        newPassword: 'new-secret',
      },
      headers: {
        authorization: 'Bearer token-7',
      },
    },
    {
      method: 'POST',
      path: '/auth/logout',
      body: undefined,
      headers: {},
    },
  ]);
  assert.equal(user.name, 'Current User');
  assert.equal(updated.email, 'updated@example.com');
});

test('auth api normalizes snake_case current ledger ids from /me responses', async () => {
  const api = createAuthApi({
    apiClient: {
      async get() {
        return {
          status: true,
          data: {
            user: {
              id: 42,
              name: 'Ledger User',
              email: 'ledger@example.com',
              current_ledger_id: 'ledger-42',
            },
          },
        };
      },
      async post() {
        return { status: true, data: {} };
      },
    },
  });

  const user = await api.getCurrentUser('token-42');

  assert.equal(user.currentLedgerId, 'ledger-42');
});

test('auth api rejects malformed success payloads defensively', async () => {
  const api = createAuthApi({
    apiClient: {
      async post() {
        return {
          status: true,
          data: {
            tokens: {},
          },
        };
      },
    },
  });

  await assert.rejects(
    () =>
      api.register({
        name: 'Broken Payload',
        email: 'broken@example.com',
        password: 'secret-123',
      }),
    /Auth response is missing required session fields/
  );
});

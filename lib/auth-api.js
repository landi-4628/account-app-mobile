/**
 * @typedef {import('../data/repositories/auth-repository.js').AuthSession} AuthSession
 */
/** @typedef {{ email: string, password: string }} LoginInput */
/** @typedef {{ name: string, email: string, password: string }} RegisterInput */
/** @typedef {{ name: string, email: string, ledgerName?: string, timezone?: string, defaultAccountId?: string }} ProfileInput */
/** @typedef {{ currentPassword: string, nextPassword: string }} PasswordChangeInput */

/**
 * @typedef {object} RemoteAuthUser
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string | null | undefined} [currentLedgerId]
 */

/**
 * @param {{
 *   apiClient: {
 *     get?: (path: string, options?: { headers?: Record<string, string> }) => Promise<any>,
 *     post: (path: string, body: unknown, options?: { headers?: Record<string, string> }) => Promise<any>,
 *     patch?: (path: string, body: unknown, options?: { headers?: Record<string, string> }) => Promise<any>,
 *   },
 *   now?: () => string,
 * }} input
 */
export function createAuthApi(input) {
  const now = input.now ?? (() => new Date().toISOString());

  return {
    /**
     * @param {LoginInput} credentials
     */
    async login(credentials) {
      const response = await input.apiClient.post('/auth/login', credentials);
      return readAuthResponse(response, now);
    },

    /**
     * @param {RegisterInput} payload
     */
    async register(payload) {
      const response = await input.apiClient.post('/auth/register', payload);
      return readAuthResponse(response, now);
    },

    /**
     * @param {string} accessToken
     */
    async getCurrentUser(accessToken) {
      if (!input.apiClient.get) {
        throw new Error('API client does not support GET requests');
      }

      const response = await input.apiClient.get('/me', {
        headers: buildAuthHeaders(accessToken),
      });
      return readUserResponse(response);
    },

    /**
     * @param {string} accessToken
     * @param {ProfileInput} profile
     */
    async updateProfile(accessToken, profile) {
      if (!input.apiClient.patch) {
        throw new Error('API client does not support PATCH requests');
      }

      const response = await input.apiClient.patch(
        '/me',
        {
          name: profile.name,
          email: profile.email,
        },
        {
          headers: buildAuthHeaders(accessToken),
        }
      );
      return readUserResponse(response);
    },

    /**
     * @param {string} accessToken
     * @param {PasswordChangeInput} draft
     */
    async changePassword(accessToken, draft) {
      await input.apiClient.post(
        '/me/change-password',
        {
          currentPassword: draft.currentPassword,
          newPassword: draft.nextPassword,
        },
        {
          headers: buildAuthHeaders(accessToken),
        }
      );
    },

    async logout() {
      await input.apiClient.post('/auth/logout');
    },
  };
}

/**
 * @param {string} accessToken
 */
function buildAuthHeaders(accessToken) {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}

/**
 * @param {any} response
 * @param {() => string} now
 * @returns {{ session: AuthSession, user: RemoteAuthUser }}
 */
function readAuthResponse(response, now) {
  const user = response?.data?.user;
  const accessToken = response?.data?.tokens?.accessToken;

  if (!user?.id || typeof user?.name !== 'string' || typeof user?.email !== 'string' || !accessToken) {
    throw new Error('Auth response is missing required session fields');
  }

  const updatedAt = now();

  return {
    session: {
      userId: String(user.id),
      accessToken: String(accessToken),
      refreshToken: null,
      encryptionKey: 'remote-api-session',
      expiresAt: resolveAccessTokenExpiry(String(accessToken), updatedAt),
      updatedAt,
    },
    user: normalizeRemoteUser(user),
  };
}

/**
 * @param {any} response
 * @returns {RemoteAuthUser}
 */
function readUserResponse(response) {
  const user = response?.data?.user;
  if (!user?.id || typeof user?.name !== 'string' || typeof user?.email !== 'string') {
    throw new Error('User response is missing required fields');
  }

  return normalizeRemoteUser(user);
}

/**
 * @param {RemoteAuthUser} user
 * @returns {RemoteAuthUser}
 */
function normalizeRemoteUser(user) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    currentLedgerId: user.currentLedgerId ?? user.current_ledger_id ?? null,
  };
}

/**
 * @param {string} token
 * @param {string} fallbackIso
 */
function resolveAccessTokenExpiry(token, fallbackIso) {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return fallbackIso;
    }

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    if (typeof decoded?.exp === 'number') {
      return new Date(decoded.exp * 1000).toISOString();
    }
  } catch {
    // Ignore malformed local tokens and fall back to the current timestamp.
  }

  return fallbackIso;
}

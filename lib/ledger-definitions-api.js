/**
 * @param {string} accessToken
 */
function authHeaders(accessToken) {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}

/**
 * @param {{
 *   apiClient: {
 *     get: (path: string, options?: { headers?: Record<string, string> }) => Promise<any>,
 *     post: (path: string, body: unknown, options?: { headers?: Record<string, string> }) => Promise<any>,
 *     patch: (path: string, body: unknown, options?: { headers?: Record<string, string> }) => Promise<any>,
 *     delete: (path: string, options?: { headers?: Record<string, string> }) => Promise<any>,
 *   },
 * }} input
 */
export function createLedgerDefinitionsApi(input) {
  return {
    /**
     * @param {string} accessToken
     * @param {string | null | undefined} [ledgerId]
     */
    async listAccounts(accessToken, ledgerId) {
      const query =
        ledgerId != null && ledgerId !== ''
          ? `?ledger_id=${encodeURIComponent(String(ledgerId))}`
          : '';
      return input.apiClient.get(`/api/accounts${query}`, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {Record<string, unknown>} body
     */
    async createAccount(accessToken, body) {
      return input.apiClient.post('/api/accounts', body, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {string} remoteId
     * @param {Record<string, unknown>} body
     */
    async updateAccount(accessToken, remoteId, body) {
      return input.apiClient.patch(`/api/accounts/${encodeURIComponent(remoteId)}`, body, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {string} remoteId
     */
    async deleteAccount(accessToken, remoteId) {
      return input.apiClient.delete(`/api/accounts/${encodeURIComponent(remoteId)}`, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {string} remoteId
     */
    async getAccount(accessToken, remoteId) {
      return input.apiClient.get(`/api/accounts/${encodeURIComponent(remoteId)}`, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {string | null | undefined} [ledgerId]
     */
    async listCategories(accessToken, ledgerId) {
      const query =
        ledgerId != null && ledgerId !== ''
          ? `?ledger_id=${encodeURIComponent(String(ledgerId))}`
          : '';
      return input.apiClient.get(`/api/categories${query}`, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {Record<string, unknown>} body
     */
    async createCategory(accessToken, body) {
      return input.apiClient.post('/api/categories', body, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {string} remoteId
     * @param {Record<string, unknown>} body
     */
    async updateCategory(accessToken, remoteId, body) {
      return input.apiClient.patch(`/api/categories/${encodeURIComponent(remoteId)}`, body, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {string} remoteId
     */
    async deleteCategory(accessToken, remoteId) {
      return input.apiClient.delete(`/api/categories/${encodeURIComponent(remoteId)}`, {
        headers: authHeaders(accessToken),
      });
    },

    /**
     * @param {string} accessToken
     * @param {string} remoteId
     */
    async getCategory(accessToken, remoteId) {
      return input.apiClient.get(`/api/categories/${encodeURIComponent(remoteId)}`, {
        headers: authHeaders(accessToken),
      });
    },
  };
}

/**
 * @typedef {{ id: string, name: string, baseCurrency: string | null, ownerUserId: string | null }} RemoteLedger
 */

/**
 * @param {{
 *   apiClient: {
 *     get?: (path: string, options?: { headers?: Record<string, string> }) => Promise<any>,
 *     post: (path: string, body?: unknown, options?: { headers?: Record<string, string> }) => Promise<any>,
 *   },
 * }} input
 */
export function createLedgerApi(input) {
  return {
    /**
     * @param {string} accessToken
     */
    async listMyLedgers(accessToken) {
      if (!input.apiClient.get) {
        throw new Error('API client does not support GET requests');
      }

      const response = await input.apiClient.get('/ledgers', {
        headers: buildAuthHeaders(accessToken),
      });

      return {
        currentLedgerId: normalizeLedgerId(response?.data?.currentLedgerId),
        ledgers: normalizeLedgerList(response?.data?.ledgers),
      };
    },

    /**
     * @param {string} accessToken
     * @param {{ name: string, baseCurrency?: string | null | undefined }} inputValue
     */
    async createLedger(accessToken, inputValue) {
      const response = await input.apiClient.post(
        '/ledgers',
        {
          name: String(inputValue.name).trim(),
          ...(inputValue.baseCurrency ? { base_currency: inputValue.baseCurrency } : null),
        },
        {
          headers: buildAuthHeaders(accessToken),
        }
      );

      return {
        currentLedgerId: normalizeLedgerId(response?.data?.currentLedgerId),
        ledger: normalizeLedger(response?.data?.ledger),
      };
    },

    /**
     * @param {string} accessToken
     * @param {string} ledgerId
     */
    async switchLedger(accessToken, ledgerId) {
      const response = await input.apiClient.post(
        `/ledgers/${encodeURIComponent(String(ledgerId))}/select`,
        undefined,
        {
          headers: buildAuthHeaders(accessToken),
        }
      );

      return {
        currentLedgerId: normalizeLedgerId(response?.data?.currentLedgerId) ?? String(ledgerId),
      };
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
 * @param {any} payload
 * @returns {RemoteLedger}
 */
function normalizeLedger(payload) {
  const id = normalizeLedgerId(payload?.id);
  const name = typeof payload?.name === 'string' ? payload.name : '';

  if (!id || !name) {
    throw new Error('Ledger response is missing required fields');
  }

  return {
    id,
    name,
    baseCurrency:
      typeof payload?.base_currency === 'string'
        ? payload.base_currency
        : typeof payload?.baseCurrency === 'string'
          ? payload.baseCurrency
          : null,
    ownerUserId:
      normalizeLedgerId(payload?.owner_user_id) ?? normalizeLedgerId(payload?.ownerUserId),
  };
}

/**
 * @param {any} payload
 * @returns {RemoteLedger[]}
 */
function normalizeLedgerList(payload) {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.map((ledger) => normalizeLedger(ledger));
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeLedgerId(value) {
  if (value == null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

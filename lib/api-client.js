/**
 * @typedef {{ headers?: Record<string, string> }} ApiRequestOptions
 */

/**
 * @param {{ baseUrl?: string, fetchImpl?: typeof fetch, defaultHeaders?: Record<string, string> }} [input]
 */
export function createApiClient(input = {}) {
  const baseUrl = input.baseUrl ?? '';
  const fetchImpl = input.fetchImpl ?? fetch;
  const defaultHeaders = input.defaultHeaders ?? {};

  /**
   * @param {string} path
   * @param {RequestInit} init
   */
  async function request(path, init) {
    const response = await fetchImpl(`${baseUrl}${path}`, init);
    const payload = await response.json();

    if (!response.ok || payload?.status === false) {
      const message = Array.isArray(payload?.errors) && payload.errors.length > 0
        ? String(payload.errors[0])
        : String(payload?.message || 'Request failed');
      throw new Error(message);
    }

    return payload;
  }

  return {
    /**
     * @param {string} path
     * @param {ApiRequestOptions} [options]
     */
    async get(path, options = {}) {
      return request(path, {
        method: 'GET',
        headers: {
          ...defaultHeaders,
          ...(options.headers ?? {}),
        },
      });
    },

    /**
     * @param {string} path
     * @param {unknown} body
     * @param {ApiRequestOptions} [options]
     */
    async post(path, body, options = {}) {
      return request(path, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...defaultHeaders,
          ...(options.headers ?? {}),
        },
        body: JSON.stringify(body),
      });
    },

    /**
     * @param {string} path
     * @param {unknown} body
     * @param {ApiRequestOptions} [options]
     */
    async patch(path, body, options = {}) {
      return request(path, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          ...defaultHeaders,
          ...(options.headers ?? {}),
        },
        body: JSON.stringify(body),
      });
    },

    /**
     * @param {string} path
     * @param {ApiRequestOptions} [options]
     */
    async delete(path, options = {}) {
      return request(path, {
        method: 'DELETE',
        headers: {
          ...defaultHeaders,
          ...(options.headers ?? {}),
        },
      });
    },
  };
}

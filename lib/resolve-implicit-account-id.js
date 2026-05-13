/**
 * 解析用于新建流水、同步的本地 account client id。
 *
 * @param {string | undefined} implicitFromState hydrate / pull 后写入的默认 id
 * @param {string | undefined} userPreference 一般为 mock 或用户资料里的 defaultAccountId
 * @returns {string}
 */
export function resolveImplicitAccountId(implicitFromState, userPreference) {
  const fromState = String(implicitFromState ?? '').trim();
  if (fromState) {
    return fromState;
  }

  const preferred = String(userPreference ?? '').trim();
  return preferred;
}

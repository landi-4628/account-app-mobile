import { toAccountInsertRow } from '../data/repositories/account-repository.js';
import { toCategoryInsertRow } from '../data/repositories/category-repository.js';

/**
 * @param {{
 *   id: string,
 *   name: string,
 *   type: string,
 *   initialBalance: number,
 *   currentBalance: number,
 *   isActive: boolean,
 *   isCustom: boolean,
 *   updatedAt: string,
 *   deletedAt: string | null,
 *   remoteId?: string,
 *   ownerUserId?: string,
 * }} row
 * @returns {import('../types/accounting').LedgerAccount}
 */
export function repoAccountRowToLedger(row) {
  return {
    id: row.id,
    name: row.name,
    type: /** @type {import('../types/accounting').AccountType} */ (row.type),
    initialBalance: row.initialBalance,
    currentBalance: row.currentBalance,
    isActive: row.isActive,
    isCustom: true,
    remoteId: row.remoteId,
    deletedAt: row.deletedAt ?? undefined,
  };
}

/**
 * @param {{
 *   id: string,
 *   name: string,
 *   type: string,
 *   isActive: boolean,
 *   isCustom: boolean,
 *   updatedAt: string,
 *   deletedAt: string | null,
 *   remoteId?: string,
 *   color?: string,
 *   ownerUserId?: string,
 * }} row
 * @returns {import('../types/accounting').LedgerCategory}
 */
export function repoCategoryRowToLedger(row) {
  return {
    id: row.id,
    name: row.name,
    type: /** @type {import('../types/accounting').EntryType} */ (row.type),
    isActive: row.isActive,
    isCustom: true,
    remoteId: row.remoteId,
    deletedAt: row.deletedAt ?? undefined,
    color: row.color,
  };
}

/**
 * @param {import('../types/accounting').LedgerAccount} account
 * @param {string} ownerUserId
 */
export function ledgerAccountToInsert(account, ownerUserId) {
  const updatedAt = new Date().toISOString();
  return toAccountInsertRow({
    id: account.id,
    name: account.name,
    type: account.type,
    initialBalance: account.initialBalance ?? 0,
    currentBalance: account.currentBalance ?? account.initialBalance ?? 0,
    isActive: account.isActive !== false,
    isCustom: true,
    updatedAt,
    deletedAt: account.deletedAt ?? null,
    remoteId: account.remoteId ?? null,
    ownerUserId,
  });
}

/**
 * @param {import('../types/accounting').LedgerCategory} category
 * @param {string} ownerUserId
 */
export function ledgerCategoryToInsert(category, ownerUserId) {
  const updatedAt = new Date().toISOString();
  return toCategoryInsertRow({
    id: category.id,
    name: category.name,
    type: category.type,
    isActive: category.isActive !== false,
    isCustom: true,
    updatedAt,
    deletedAt: category.deletedAt ?? null,
    remoteId: category.remoteId ?? null,
    color: category.color ?? null,
    ownerUserId,
  });
}

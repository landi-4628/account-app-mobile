import { toCategoryInsertRow } from '../data/repositories/category-repository.js';

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

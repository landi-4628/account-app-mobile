/**
 * @param {unknown} value
 */
function toBooleanFlag(value) {
  return value === true || value === 1;
}

/**
 * @param {Record<string, unknown>} row
 */
export function mapCategoryRow(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    isActive: toBooleanFlag(row.is_active),
    isCustom: toBooleanFlag(row.is_custom),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at == null ? null : String(row.deleted_at),
    remoteId: row.remote_id == null || row.remote_id === '' ? undefined : String(row.remote_id),
    color: row.color == null || row.color === '' ? undefined : String(row.color),
    ownerUserId: row.owner_user_id == null || row.owner_user_id === '' ? undefined : String(row.owner_user_id),
  };
}

/**
 * @param {{
 *   id: string,
 *   name: string,
 *   type: string,
 *   isActive?: boolean,
 *   isCustom?: boolean,
 *   updatedAt: string,
 *   deletedAt?: string | null,
 *   remoteId?: string | null,
 *   color?: string | null,
 *   ownerUserId: string,
 * }} category
 */
export function toCategoryInsertRow(category) {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    isActive: category.isActive !== false,
    isCustom: category.isCustom === true,
    updatedAt: category.updatedAt,
    deletedAt: category.deletedAt ?? null,
    remoteId: category.remoteId ?? null,
    color: category.color ?? null,
    ownerUserId: category.ownerUserId,
  };
}

/**
 * @param {{ runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>, getAllAsync: (sql: string, ...params: unknown[]) => Promise<Record<string, unknown>[]> }} database
 */
export function createCategoryRepository(database) {
  return {
    /**
     * @param {string} ownerUserId
     */
    async listCategories(ownerUserId) {
      if (!ownerUserId) {
        return [];
      }

      const rows = await database.getAllAsync(
        `SELECT
          id,
          name,
          type,
          is_active,
          is_custom,
          updated_at,
          deleted_at,
          remote_id,
          color,
          owner_user_id
        FROM categories
        WHERE deleted_at IS NULL AND owner_user_id = ?
        ORDER BY type ASC, name COLLATE NOCASE ASC;`,
        ownerUserId
      );

      return rows.map(mapCategoryRow);
    },

    /**
     * @param {string} id
     * @param {string} ownerUserId
     */
    async getCategoryById(id, ownerUserId) {
      if (!ownerUserId) {
        return null;
      }

      const rows = await database.getAllAsync(
        `SELECT
          id,
          name,
          type,
          is_active,
          is_custom,
          updated_at,
          deleted_at,
          remote_id,
          color,
          owner_user_id
        FROM categories
        WHERE id = ? AND owner_user_id = ?
        LIMIT 1;`,
        id,
        ownerUserId
      );

      const row = rows[0];
      if (!row) {
        return null;
      }

      return mapCategoryRow(row);
    },

    /**
     * @param {ReturnType<typeof toCategoryInsertRow>} category
     */
    async saveCategory(category) {
      await database.runAsync(
        `INSERT OR REPLACE INTO categories (
          id,
          name,
          type,
          is_active,
          is_custom,
          updated_at,
          deleted_at,
          remote_id,
          color,
          owner_user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        category.id,
        category.name,
        category.type,
        category.isActive === false ? 0 : 1,
        category.isCustom === true ? 1 : 0,
        category.updatedAt,
        category.deletedAt ?? null,
        category.remoteId ?? null,
        category.color ?? null,
        category.ownerUserId
      );

      return category;
    },

    /**
     * @param {any[]} categories
     */
    async saveCategories(categories) {
      for (const category of categories) {
        await this.saveCategory(/** @type {any} */ (category));
      }

      return categories;
    },

    /**
     * @param {string} id
     * @param {string} deletedAtIso
     * @param {string} ownerUserId
     */
    async softDeleteCategory(id, deletedAtIso, ownerUserId) {
      if (!ownerUserId) {
        return;
      }

      await database.runAsync(
        `UPDATE categories
        SET deleted_at = ?, updated_at = ?, is_active = 0
        WHERE id = ? AND owner_user_id = ?;`,
        deletedAtIso,
        deletedAtIso,
        id,
        ownerUserId
      );
    },
  };
}

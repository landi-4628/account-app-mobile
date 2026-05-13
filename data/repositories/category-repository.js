function toBooleanFlag(value) {
  return value === true || value === 1;
}

/**
 * @param {Record<string, unknown>} row
 */
function mapCategoryRow(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    isActive: toBooleanFlag(row.is_active),
    isCustom: toBooleanFlag(row.is_custom),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at == null ? null : String(row.deleted_at),
  };
}

/**
 * @param {{ runAsync: (sql: string, ...params: unknown[]) => Promise<unknown>, getAllAsync: (sql: string, ...params: unknown[]) => Promise<Record<string, unknown>[]> }} database
 */
export function createCategoryRepository(database) {
  return {
    async listCategories() {
      const rows = await database.getAllAsync(
        `SELECT
          id,
          name,
          type,
          is_active,
          is_custom,
          updated_at,
          deleted_at
        FROM categories
        WHERE deleted_at IS NULL
        ORDER BY type ASC, name COLLATE NOCASE ASC;`
      );

      return rows.map(mapCategoryRow);
    },

    async saveCategory(category) {
      await database.runAsync(
        `INSERT OR REPLACE INTO categories (
          id,
          name,
          type,
          is_active,
          is_custom,
          updated_at,
          deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        category.id,
        category.name,
        category.type,
        category.isActive === false ? 0 : 1,
        category.isCustom === true ? 1 : 0,
        category.updatedAt,
        category.deletedAt ?? null
      );

      return category;
    },

    async saveCategories(categories) {
      for (const category of categories) {
        await this.saveCategory(category);
      }

      return categories;
    },
  };
}

/** @typedef {import('@/types/accounting').CategoryId} CategoryId */

/**
 * @typedef {'food' | 'commute' | 'groceries' | 'coffee' | 'salary' | 'freelance'} AccountingCategoryIconName
 */

/**
 * @typedef {'brand' | 'expense' | 'warning' | 'danger' | 'income'} AccountingCategoryColorRole
 */

/** @typedef {'light' | 'dark' | 'unspecified'} AccountingColorScheme */

/**
 * @typedef {object} AccountingThemeColors
 * @property {string} background
 * @property {string} surface
 * @property {string} surfaceAlt
 * @property {string} border
 * @property {string} borderStrong
 * @property {string} brand
 * @property {string} brandSoft
 * @property {string} brandContrast
 * @property {string} income
 * @property {string} expense
 * @property {string} warning
 * @property {string} danger
 * @property {string} text
 * @property {string} textSecondary
 * @property {string} textMuted
 * @property {string} textInverse
 * @property {string} tint
 * @property {string} icon
 * @property {string} tabIconDefault
 * @property {string} tabIconSelected
 * @property {string} overlay
 */

const baseSpacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

const baseRadius = {
  sm: 10,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

const baseTypography = {
  caption: 12,
  body: 14,
  bodyLarge: 16,
  title: 20,
  headline: 28,
};

/** @type {AccountingThemeColors} */
export const accountingLightColors = {
  background: '#F7F8F4',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF2EC',
  border: '#E6EBE7',
  borderStrong: '#CED7D1',
  brand: '#2F8F83',
  brandSoft: '#DFF3EE',
  brandContrast: '#1D5E55',
  income: '#2E9B62',
  expense: '#E07A5F',
  warning: '#D97706',
  danger: '#C65A46',
  text: '#1F2A24',
  textSecondary: '#66736D',
  textMuted: '#94A19B',
  textInverse: '#FFFFFF',
  tint: '#2F8F83',
  icon: '#7A8780',
  tabIconDefault: '#94A19B',
  tabIconSelected: '#2F8F83',
  overlay: 'rgba(31, 42, 36, 0.12)',
};

/** @type {AccountingThemeColors} */
export const accountingDarkColors = {
  background: '#161B18',
  surface: '#1E2421',
  surfaceAlt: '#27302B',
  border: '#313A35',
  borderStrong: '#445049',
  brand: '#58B6A8',
  brandSoft: '#20413B',
  brandContrast: '#9FE2D8',
  income: '#55C487',
  expense: '#F19A80',
  warning: '#F2B45D',
  danger: '#E57B67',
  text: '#F3F5F2',
  textSecondary: '#B2BCB6',
  textMuted: '#87928B',
  textInverse: '#0F1311',
  tint: '#58B6A8',
  icon: '#A7B1AB',
  tabIconDefault: '#87928B',
  tabIconSelected: '#58B6A8',
  overlay: 'rgba(15, 19, 17, 0.3)',
};

/** @type {Record<AccountingColorScheme, AccountingThemeColors>} */
export const accountingColorSchemes = {
  light: accountingLightColors,
  dark: accountingDarkColors,
  unspecified: accountingLightColors,
};

/** @type {Record<CategoryId, AccountingCategoryColorRole>} */
export const accountingCategoryColorRoles = {
  'cat-food': 'expense',
  'cat-commute': 'warning',
  'cat-groceries': 'brand',
  'cat-coffee': 'danger',
  'cat-salary': 'income',
  'cat-freelance': 'brand',
};

/** @type {Record<CategoryId, AccountingCategoryIconName>} */
export const accountingCategoryIcons = {
  'cat-food': 'food',
  'cat-commute': 'commute',
  'cat-groceries': 'groceries',
  'cat-coffee': 'coffee',
  'cat-salary': 'salary',
  'cat-freelance': 'freelance',
};

export const accountingTheme = {
  colorSchemes: accountingColorSchemes,
  categoryColorRoles: accountingCategoryColorRoles,
  categoryIcons: accountingCategoryIcons,
  spacing: baseSpacing,
  radius: baseRadius,
  typography: baseTypography,
  shadow: {
    card: {
      shadowColor: '#1F2A24',
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
};

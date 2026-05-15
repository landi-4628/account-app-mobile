/** @typedef {import('@/types/accounting').LedgerCategory} LedgerCategory */

/** @type {Array<[string, string, string, string]>} */
const expenseCategories = [
  ['cat-food', '餐饮', 'restaurant-outline', '#F39C6B'],
  ['cat-expense-shopping', '购物', 'bag-handle-outline', '#E88F8B'],
  ['cat-groceries', '日用', 'receipt-outline', '#9AA9F8'],
  ['cat-commute', '交通', 'bus-outline', '#7EC8A5'],
  ['cat-expense-vegetables', '蔬菜', 'leaf-outline', '#83C97A'],
  ['cat-expense-fruit', '水果', 'nutrition-outline', '#F6B85C'],
  ['cat-expense-snacks', '零食', 'ice-cream-outline', '#F29CC1'],
  ['cat-coffee', '咖啡茶饮', 'cafe-outline', '#A58BE0'],
  ['cat-expense-sports', '运动', 'bicycle-outline', '#63B6D9'],
  ['cat-expense-entertainment', '娱乐', 'mic-outline', '#B28DFF'],
  ['cat-expense-communication', '通讯', 'call-outline', '#79C2A0'],
  ['cat-expense-clothing', '服饰', 'shirt-outline', '#E59B8D'],
  ['cat-expense-beauty', '美容', 'sparkles-outline', '#F3A9B9'],
  ['cat-expense-housing', '住房', 'home-outline', '#A68BF0'],
  ['cat-expense-home', '居家', 'bed-outline', '#97B0A8'],
  ['cat-expense-children', '孩子', 'happy-outline', '#7BB5F7'],
  ['cat-expense-elders', '长辈', 'people-outline', '#F1AE73'],
  ['cat-expense-social', '社交', 'chatbubbles-outline', '#71C6D4'],
  ['cat-expense-travel', '旅行', 'airplane-outline', '#6AA8FF'],
  ['cat-expense-smoking-drinks', '烟酒', 'wine-outline', '#D18DB1'],
  ['cat-expense-digital', '数码', 'hardware-chip-outline', '#8FA3C8'],
  ['cat-expense-car', '汽车', 'car-sport-outline', '#7E98A8'],
  ['cat-expense-medical', '医疗', 'medkit-outline', '#8AD0B0'],
  ['cat-expense-books', '书籍', 'book-outline', '#8EA9FF'],
  ['cat-expense-study', '学习', 'school-outline', '#B3A0F5'],
  ['cat-expense-pets', '宠物', 'paw-outline', '#F0A574'],
  ['cat-expense-cash-gift', '礼金', 'wallet-outline', '#E8B267'],
  ['cat-expense-gifts', '礼物', 'gift-outline', '#F1A8A8'],
  ['cat-expense-office', '办公', 'briefcase-outline', '#9BAFA2'],
];

/** @type {Array<[string, string, string, string]>} */
const incomeCategories = [
  ['cat-salary', '工资', 'receipt-outline', '#7EC8A5'],
  ['cat-income-part-time', '兼职', 'time-outline', '#F1AE73'],
  ['cat-income-finance', '理财', 'trending-up-outline', '#63B6D9'],
  ['cat-income-gift', '礼金', 'gift-outline', '#E59B8D'],
  ['cat-income-bonus', '奖金', 'trophy-outline', '#F6B85C'],
  ['cat-income-reimburse', '报销', 'document-text-outline', '#9AA9F8'],
  ['cat-freelance', '副业', 'briefcase-outline', '#B28DFF'],
  ['cat-income-other', '其它', 'wallet-outline', '#97B0A8'],
];

/**
 * @param {Array<[string, string, string, string]>} source
 * @param {'expense' | 'income'} type
 * @returns {LedgerCategory[]}
 */
function buildCategories(source, type) {
  return source.map(([id, name, iconName, color], index) => ({
    id,
    name,
    type,
    isActive: true,
    isSystem: true,
    iconName,
    color,
    sortOrder: index,
  }));
}

export const builtInExpenseCategories = buildCategories(expenseCategories, 'expense');
export const builtInIncomeCategories = buildCategories(incomeCategories, 'income');
export const builtInLedgerCategories = [...builtInExpenseCategories, ...builtInIncomeCategories];

export const categoryColorSwatches = [
  '#F39C6B',
  '#E88F8B',
  '#F6B85C',
  '#7EC8A5',
  '#63B6D9',
  '#9AA9F8',
  '#B28DFF',
  '#F29CC1',
];

/**
 * @param {LedgerCategory[]} categories
 * @returns {LedgerCategory[]}
 */
export function mergeWithBuiltInCategories(categories) {
  const incomingById = new Map(categories.map((category) => [category.id, category]));
  const mergedBuiltIns = builtInLedgerCategories.map((category) => {
    const incoming = incomingById.get(category.id);
    return incoming
      ? {
          ...category,
          ...incoming,
          isSystem: true,
          isCustom: false,
          deletedAt: undefined,
        }
      : { ...category };
  });
  const builtInIds = new Set(builtInLedgerCategories.map((category) => category.id));
  const customCategories = categories
    .filter((category) => !builtInIds.has(category.id))
    .map((category, index) => ({
      ...category,
      isCustom: category.isCustom ?? true,
      sortOrder: category.sortOrder ?? builtInLedgerCategories.length + index,
    }));

  return [...mergedBuiltIns, ...customCategories];
}

/**
 * @param {'expense' | 'income'} type
 * @param {number} index
 * @returns {{ iconName: string, color: string }}
 */
export function getCustomCategoryAppearance(type, index) {
  const color = categoryColorSwatches[index % categoryColorSwatches.length];

  return {
    color,
    iconName: type === 'expense' ? 'pricetag-outline' : 'cash-outline',
  };
}

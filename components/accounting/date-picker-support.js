/**
 * @param {string | Date} value
 * @returns {Date}
 */
export function createUtcDateFromDateInput(value) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
export function formatDatePickerValue(value) {
  const date = value instanceof Date ? value : createUtcDateFromDateInput(value);

  return [
    date.getUTCFullYear(),
    `${date.getUTCMonth() + 1}`.padStart(2, '0'),
    `${date.getUTCDate()}`.padStart(2, '0'),
  ].join('-');
}

/**
 * @param {string} value
 * @returns {string}
 */
export function formatDatePickerLabel(value) {
  const date = createUtcDateFromDateInput(value);
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return formatter.format(date);
}

/**
 * @param {string} value
 * @param {string} maxValue
 * @returns {boolean}
 */
export function isDateInputAfter(value, maxValue) {
  return formatDatePickerValue(value) > formatDatePickerValue(maxValue);
}

/**
 * Keeps Android calendar day numbers visually centered by removing
 * the platform's extra font padding.
 *
 * @returns {{ includeFontPadding: false, textAlign: 'center' }}
 */
export function createCalendarDayLabelTextStyle() {
  return {
    includeFontPadding: false,
    textAlign: 'center',
  };
}

/**
 * @param {string} value
 * @param {number} monthDelta
 * @returns {string}
 */
export function addMonthsToDateInput(value, monthDelta) {
  const date = createUtcDateFromDateInput(value);
  return formatDatePickerValue(
    new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthDelta, 1))
  );
}

/**
 * @param {string} visibleMonth
 * @returns {Array<Array<{ key: string, dayNumber: number, value: string, inCurrentMonth: boolean }>>}
 */
export function buildCalendarWeeks(visibleMonth) {
  const monthStart = createUtcDateFromDateInput(`${visibleMonth}-01`);
  const startDay = monthStart.getUTCDay();
  const gridStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), 1 - startDay)
  );
  const weeks = [];

  for (let weekIndex = 0; weekIndex < 6; weekIndex += 1) {
    const week = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const offset = weekIndex * 7 + dayIndex;
      const date = new Date(gridStart.getTime() + offset * 24 * 60 * 60 * 1000);
      const value = formatDatePickerValue(date);

      week.push({
        key: value,
        dayNumber: date.getUTCDate(),
        value,
        inCurrentMonth:
          date.getUTCFullYear() === monthStart.getUTCFullYear()
          && date.getUTCMonth() === monthStart.getUTCMonth(),
      });
    }

    weeks.push(week);
  }

  return weeks;
}

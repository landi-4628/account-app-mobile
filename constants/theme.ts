import { Platform } from 'react-native';

import {
  accountingCategoryColorRoles,
  accountingCategoryIcons,
  accountingColorSchemes,
  accountingDarkColors,
  accountingLightColors,
  accountingTheme,
} from '@/constants/accounting-theme';

export const Colors = accountingColorSchemes;
export const ThemeColors = Colors;
export const Theme = accountingTheme;
export const Spacing = accountingTheme.spacing;
export const Radius = accountingTheme.radius;
export const Typography = accountingTheme.typography;
export const ColorSchemes = accountingColorSchemes;
export const CategoryColorRoles = accountingCategoryColorRoles;
export const CategoryIcons = accountingCategoryIcons;
export const LightThemeColors = accountingLightColors;
export const DarkThemeColors = accountingDarkColors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// These mirror the web app's design tokens (apps/web/src/app/globals.css) so the
// citizen interface looks the same whether it's opened in a browser or the app.
export const Colors = {
  light: {
    text: '#14181c',
    background: '#f4f5f2',
    backgroundElement: '#ffffff',
    backgroundSelected: '#eef0ec',
    textSecondary: '#6b7280',
  },
  dark: {
    text: '#eef2f6',
    background: '#0b0f14',
    backgroundElement: '#12181f',
    backgroundSelected: '#0e141a',
    textSecondary: '#8b96a3',
  },
} as const;

/** Shared across both themes — status and accent colours from the web tokens. */
export const Brand = {
  accent: '#2dd4bf',
  accentContrast: '#06201c',
  critical: '#ff6b5e',
  high: '#ff9d5c',
  medium: '#eab84d',
  available: '#4ade80',
  assigned: '#38bdf8',
  border: '#232c35',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

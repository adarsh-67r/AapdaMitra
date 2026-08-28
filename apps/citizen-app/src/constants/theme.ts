/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Mirrors the web tokens in apps/web/src/app/globals.css so the citizen
 * interface is one product whether it is opened in a browser or the app.
 *
 * Severity colours are per-theme rather than shared constants. The previous
 * `Brand` object held one set of values for both themes, which cannot work: a
 * red legible on paper is not the red legible on ink. Anything reading a status
 * colour goes through the themed lookup.
 *
 * constants/theme.test.ts asserts these against the web values, because the
 * only thing keeping the two clients aligned is that both lists are written
 * down.
 */
export const Colors = {
  light: {
    text: '#1b1a16',
    textSecondary: '#6d6759',
    background: '#f2efe6',
    backgroundElement: '#fbfaf5',
    backgroundSelected: '#e7e2d4',
    border: '#cdc6b5',
    accent: '#b3322a',
    accentContrast: '#fbfaf5',
    critical: '#b3322a',
    high: '#ad5f11',
    medium: '#866c13',
    available: '#2c6742',
    assigned: '#1d537c',
  },
  dark: {
    text: '#f2efe6',
    textSecondary: '#98917f',
    background: '#14120f',
    backgroundElement: '#1c1a16',
    backgroundSelected: '#0f0e0c',
    border: '#35312a',
    accent: '#e0574a',
    accentContrast: '#14120f',
    critical: '#e0574a',
    high: '#d4872f',
    medium: '#c4a844',
    available: '#56ad78',
    assigned: '#57a0d4',
  },
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

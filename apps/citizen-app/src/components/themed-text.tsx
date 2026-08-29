import { StyleSheet, Text, type TextProps } from 'react-native';

import type { ScriptType } from '@/constants/script-fonts';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useType } from '@/lib/i18n/use-language';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  // The family depends on the language: Plex has no Tamil, so a Tamil reader's
  // text has to come from a face that does. Every piece of text in the app goes
  // through here, which is what makes one lookup enough.
  const font = useType();

  return (
    <Text
      style={[
        // linkPrimary carries the accent; it is theme-dependent, so it cannot
        // live in the module-scope stylesheet below.
        { color: type === 'linkPrimary' ? theme.accent : theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        { fontFamily: font[WEIGHT_FOR_TYPE[type]] },
        style,
      ]}
      {...rest}
    />
  );
}

// React Native will not synthesise a bold cut from a custom regular face, so
// every style names the loaded family it wants instead of a fontWeight. The
// stylesheet below keeps the sizes; the family is applied over it per language.
const WEIGHT_FOR_TYPE: Record<NonNullable<ThemedTextProps['type']>, keyof ScriptType> = {
  default: 'regular',
  title: 'semibold',
  subtitle: 'semibold',
  small: 'medium',
  smallBold: 'bold',
  link: 'medium',
  linkPrimary: 'medium',
  code: 'mono',
};

const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 48,
    lineHeight: 52,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
  },
  code: {
    fontSize: 12,
  },
});

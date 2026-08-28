import { StyleSheet, Text, type TextProps } from 'react-native';

import { Type } from '@/constants/fonts';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

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
        style,
      ]}
      {...rest}
    />
  );
}

// React Native will not synthesise a bold cut from a custom regular face, so
// every style names the loaded family it wants instead of a fontWeight.
const styles = StyleSheet.create({
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Type.medium,
  },
  smallBold: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Type.bold,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Type.regular,
  },
  title: {
    fontSize: 48,
    lineHeight: 52,
    fontFamily: Type.semibold,
  },
  subtitle: {
    fontSize: 32,
    lineHeight: 44,
    fontFamily: Type.semibold,
  },
  link: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: Type.medium,
  },
  linkPrimary: {
    lineHeight: 30,
    fontSize: 14,
    fontFamily: Type.medium,
  },
  code: {
    fontFamily: Type.mono,
    fontSize: 12,
  },
});

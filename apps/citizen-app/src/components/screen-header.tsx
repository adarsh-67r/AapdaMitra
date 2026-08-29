import { StyleSheet, View } from "react-native";

import { BrandMark } from "@/components/brand-mark";
import { LanguagePicker } from "@/components/language-picker";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * The bar every screen starts with: the product mark, the screen's name, and
 * the way out.
 *
 * The web client carries this on every citizen section; the app had none at all.
 * There is no sign-out here because there is no sign-in: the app authenticates
 * itself on boot and opens on the dashboard.
 *
 * The rule under the title does the work a card border would: it separates the
 * heading from the content without introducing a floating surface.
 */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.border }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <BrandMark />
          <ThemedText type="smallBold">Aapda Mitra</ThemedText>
        </View>
        {/* On every screen, because someone who cannot read this one cannot be
            expected to find a settings screen to fix it. */}
        <LanguagePicker />
      </View>

      <ThemedText type="title" style={styles.title}>
        {title}
      </ThemedText>
      {subtitle && (
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderBottomWidth: 1,
    gap: Spacing.one,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  title: { fontSize: 26, lineHeight: 32, marginTop: Spacing.two },
});

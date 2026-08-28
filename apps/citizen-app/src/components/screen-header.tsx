import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/use-auth";

/**
 * The bar every screen starts with: the product mark, the screen's name, and
 * the way out.
 *
 * The web client carries this on every citizen section; the app had no header
 * at all and — more to the point — no way to sign out from inside the app, so a
 * demo account could be entered and never left without deleting the app's data.
 *
 * The rule under the title does the work a card border would: it separates the
 * heading from the content without introducing a floating surface.
 */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  const { signOut } = useAuth();

  return (
    <View style={[styles.wrap, { borderBottomColor: theme.border }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={[styles.mark, { borderColor: theme.accent }]}>
            <View style={[styles.markPulse, { backgroundColor: theme.accent }]} />
          </View>
          <ThemedText type="smallBold">AapdaMitra</ThemedText>
        </View>
        <Pressable onPress={signOut} accessibilityRole="button" hitSlop={8}>
          <ThemedText type="small" themeColor="textSecondary">
            Sign out
          </ThemedText>
        </Pressable>
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
  mark: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  markPulse: { width: 8, height: 2 },
  title: { fontSize: 26, lineHeight: 32, marginTop: Spacing.two },
});

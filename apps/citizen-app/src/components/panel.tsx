import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * A bordered cell on the same ground as everything else: opaque, hairline edge,
 * corners barely rounded, no elevation shadow. Depth comes from rules and
 * spacing, which is what makes the interface read as an instrument rather than
 * a stack of floating cards — and matches the `.panel` class on the web client.
 */
export function Panel({
  children,
  style,
  tone = "default",
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "recessed";
}) {
  const theme = useTheme();
  const background = tone === "recessed" ? theme.backgroundSelected : theme.backgroundElement;

  return (
    <View style={[styles.panel, { backgroundColor: background, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 2,
    padding: Spacing.three,
    gap: Spacing.two,
  },
});

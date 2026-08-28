import { Linking, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Panel } from "@/components/panel";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** The same list as the web client, in the same order. */
const CONTACTS = [
  { name: "National Emergency Number", number: "112" },
  { name: "Police", number: "100" },
  { name: "Fire", number: "101" },
  { name: "Ambulance", number: "102" },
  { name: "NDMA Disaster Management Helpline", number: "1070" },
  { name: "Women's Helpline", number: "1091" },
];

export default function EmergencyScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader title="Emergency Contacts" subtitle="Tap any number to call directly" />

        <ScrollView contentContainerStyle={styles.list}>
          {CONTACTS.map((c) => (
            <Pressable
              key={c.number}
              onPress={() => Linking.openURL(`tel:${c.number}`)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${c.name} on ${c.number}`}
            >
              <Panel style={styles.card}>
                <ThemedText type="smallBold" style={styles.name}>
                  {c.name}
                </ThemedText>
                <ThemedText style={[styles.number, { color: theme.accent }]}>{c.number}</ThemedText>
              </Panel>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  list: { gap: Spacing.two, padding: Spacing.three, paddingBottom: Spacing.five },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  name: { flexShrink: 1 },
  number: { fontSize: 20, fontWeight: "700" },
});

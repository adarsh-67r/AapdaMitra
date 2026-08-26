import { Linking, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Brand, Spacing } from "@/constants/theme";

const CONTACTS = [
  { name: "National Emergency Number", number: "112" },
  { name: "Police", number: "100" },
  { name: "Fire", number: "101" },
  { name: "Ambulance", number: "102" },
  { name: "NDMA Disaster Management Helpline", number: "1070" },
  { name: "Women's Helpline", number: "1091" },
];

export default function EmergencyScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Emergency Contacts
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Tap any number to call directly
        </ThemedText>

        <ScrollView contentContainerStyle={styles.list}>
          {CONTACTS.map((c) => (
            <Pressable key={c.number} onPress={() => Linking.openURL(`tel:${c.number}`)}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold" style={styles.name}>
                  {c.name}
                </ThemedText>
                <ThemedText style={styles.number}>{c.number}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  title: { fontSize: 28, lineHeight: 34, marginTop: Spacing.two },
  subtitle: { marginBottom: Spacing.three },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  name: { flexShrink: 1 },
  number: { fontSize: 20, fontWeight: "700", color: Brand.accent },
});

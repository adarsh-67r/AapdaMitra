import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { LANGUAGES } from "@/lib/i18n/languages";
import { useLanguage } from "@/lib/i18n/use-language";

/**
 * Choosing the language the app speaks.
 *
 * Every name is written in its own script, so a speaker finds their language by
 * recognising it rather than by reading English first — which is the whole
 * point for someone who does not read English. The English name sits under it
 * as the fallback for the two scripts a device may not carry.
 *
 * The names deliberately do NOT use the app's own fonts. Only the active
 * language's faces are loaded, so a list styled with them would render
 * twenty-two rows of empty boxes. A bare Text falls through to the platform's
 * own font stack, and both Android and iOS ship broad Indic coverage — the one
 * place in this app where the system font is the right answer.
 */
export function LanguagePicker() {
  const theme = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("Change language")}
        style={[styles.trigger, { borderColor: theme.border }]}
      >
        <Ionicons name="language-outline" size={14} color={theme.textSecondary} />
        <Text style={[styles.triggerLabel, { color: theme.textSecondary }]}>
          {language.endonym}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="smallBold">{t("Choose your language")}</ThemedText>
              <Pressable
                onPress={() => setOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={t("Close")}
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <FlatList
              data={LANGUAGES}
              keyExtractor={(l) => l.code}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => {
                const selected = item.code === language.code;
                return (
                  <Pressable
                    onPress={() => {
                      setLanguage(item.code);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.row,
                      {
                        borderColor: selected ? theme.accent : theme.border,
                        backgroundColor: selected
                          ? theme.backgroundSelected
                          : theme.backgroundElement,
                      },
                    ]}
                  >
                    <View style={styles.rowText}>
                      <Text style={[styles.endonym, { color: theme.text }]}>{item.endonym}</Text>
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.english}
                      </ThemedText>
                    </View>
                    {selected && <Ionicons name="checkmark" size={18} color={theme.accent} />}
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  triggerLabel: { fontSize: 13 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  list: { padding: Spacing.three, gap: Spacing.two, paddingBottom: Spacing.five },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowText: { gap: 2 },
  endonym: { fontSize: 18 },
});

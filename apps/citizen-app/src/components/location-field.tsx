import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Brand, Spacing } from "@/constants/theme";
import {
  CITY_COUNT,
  DISTRICT_COUNT,
  labelFor,
  searchPlaces,
  type Place,
} from "@/lib/india-places";
import type { Coords, LocationSource, LocationStatus } from "@/lib/use-location";

/**
 * What went wrong, and what can be done about it. "Location unavailable" on its
 * own is useless to someone standing in water, so each case names the cause and
 * offers the way forward.
 */
const EXPLANATION: Record<Exclude<LocationStatus, "idle" | "locating" | "ready">, string> = {
  denied: "Location access is turned off for this app. Allow it in Settings, or name your place below.",
  disabled: "Location Services is switched off on this device. Turn it on, or name your place below.",
  timeout: "Your device didn't return a location in time. Moving outdoors often helps.",
  failed: "Location lookup failed. You can name your place instead.",
};

/**
 * The position readout and, when the lookup fails, the way past it.
 *
 * A report that cannot be placed cannot be filed, so this never dead-ends: every
 * failure offers naming a district or city by hand. A named place is a centroid,
 * not an address, and is labelled approximate wherever it is shown.
 */
export function LocationField({
  coords,
  status,
  source,
  placeLabel,
  accuracyM,
  onRetry,
  onManual,
}: {
  coords: Coords | null;
  status: LocationStatus;
  source: LocationSource;
  placeLabel: string | null;
  accuracyM: number | null;
  onRetry: () => void;
  onManual: (c: Coords, label: string) => void;
}) {
  const [picking, setPicking] = useState(false);

  const choose = (p: Place) => {
    onManual({ lat: p.lat, lng: p.lng }, labelFor(p));
    setPicking(false);
  };

  const failed = status !== "idle" && status !== "locating" && status !== "ready";

  return (
    <ThemedView style={styles.wrap}>
      {status === "locating" && <ThemedText type="small">Finding your location…</ThemedText>}

      {status === "ready" && coords && (
        <ThemedText type="small">
          📍 {placeLabel ?? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
          {source === "manual"
            ? "  ·  approximate"
            : accuracyM !== null
              ? `  ·  ±${Math.round(accuracyM)} m`
              : ""}
        </ThemedText>
      )}

      {failed && (
        <ThemedText type="small" style={styles.problem}>
          {EXPLANATION[status]}
        </ThemedText>
      )}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={onRetry} accessibilityRole="button">
          <ThemedText type="small">
            {status === "ready" ? "Update location" : "Use my location"}
          </ThemedText>
        </Pressable>
        <Pressable
          style={styles.action}
          onPress={() => setPicking(true)}
          accessibilityRole="button"
        >
          <ThemedText type="small">Name my place</ThemedText>
        </Pressable>
      </View>

      <PlacePicker visible={picking} onClose={() => setPicking(false)} onPick={choose} />
    </ThemedView>
  );
}

function PlacePicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (p: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchPlaces(query, 60), [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent={false}>
      <ThemedView style={styles.sheet}>
        <View style={styles.sheetHead}>
          <ThemedText type="subtitle">Where are you?</ThemedText>
          <Pressable onPress={onClose} accessibilityRole="button">
            <ThemedText type="small">Close</ThemedText>
          </Pressable>
        </View>

        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder={`Search ${CITY_COUNT} cities, ${DISTRICT_COUNT} districts`}
          style={styles.search}
        />

        {query.trim().length === 0 ? (
          <ThemedText type="small" style={styles.hint}>
            Type a city or district name. Your report will be placed at its centre — close enough to
            route a response, and marked approximate.
          </ThemedText>
        ) : results.length === 0 ? (
          <ThemedText type="small" style={styles.hint}>
            Nothing matches “{query.trim()}”.
          </ThemedText>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            {results.map((p) => (
              <Pressable
                key={`${p.kind}-${p.state}-${p.district}-${p.name}`}
                style={styles.row}
                onPress={() => onPick(p)}
                accessibilityRole="button"
              >
                <ThemedText>{p.name}</ThemedText>
                <ThemedText type="small">
                  {p.kind === "city" && p.name !== p.district ? `${p.district} · ` : ""}
                  {p.state}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two, backgroundColor: "transparent" },
  problem: { color: Brand.high },
  actions: { flexDirection: "row", gap: Spacing.two, backgroundColor: "transparent" },
  action: {
    borderWidth: 1,
    borderColor: "#8888",
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  sheet: { flex: 1, padding: Spacing.four, gap: Spacing.three },
  sheetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  search: {
    borderWidth: 1,
    borderColor: "#8888",
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  hint: { paddingVertical: Spacing.two },
  row: { paddingVertical: Spacing.three, borderBottomWidth: 1, borderBottomColor: "#8882" },
});

import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  CITY_COUNT,
  DISTRICT_COUNT,
  STATES,
  citiesIn,
  districtsIn,
  labelFor,
  searchPlaces,
  type Place,
} from "@/lib/india-places";
import { useLanguage } from "@/lib/i18n/use-language";
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
 * failure offers naming a district or town by hand. A named place is a centroid,
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
  const theme = useTheme();
  const { t } = useLanguage();
  const [picking, setPicking] = useState(false);

  const choose = (p: Place) => {
    onManual({ lat: p.lat, lng: p.lng }, labelFor(p));
    setPicking(false);
  };

  const failed = status !== "idle" && status !== "locating" && status !== "ready";

  return (
    <ThemedView style={styles.wrap}>
      {status === "locating" && <ThemedText type="small">{t("Finding your location…")}</ThemedText>}

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
        <ThemedText type="small" style={{ color: theme.high }}>
          {t(EXPLANATION[status])}
        </ThemedText>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.action, { borderColor: theme.border }]}
          onPress={onRetry}
          accessibilityRole="button"
        >
          <ThemedText type="small">
            {status === "ready" ? t("Update location") : t("Use my location")}
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.action, { borderColor: theme.border }]}
          onPress={() => setPicking(true)}
          accessibilityRole="button"
        >
          <ThemedText type="small">{t("Name my place")}</ThemedText>
        </Pressable>
      </View>

      <PlacePicker visible={picking} onClose={() => setPicking(false)} onPick={choose} />
    </ThemedView>
  );
}

/**
 * Naming a place by hand: search, or state → district → town.
 *
 * The cascade is the reliable path — everyone knows their state, and narrowing
 * from there always terminates somewhere real. Search sits above it for the
 * common case where someone can simply type where they are; a person in an
 * emergency should not be made to drill through three menus to say "Rourkela".
 *
 * Nearly every district has towns in the index — 592 of 594 — and the largest
 * carry over a hundred, so the town step filters as well as lists. Where none is
 * known the district itself is the answer, and the step says so.
 */
function PlacePicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (p: Place) => void;
}) {
  const theme = useTheme();
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [townQuery, setTownQuery] = useState("");

  const results = useMemo(() => searchPlaces(query, 60), [query]);
  const districts = useMemo(() => (state ? districtsIn(state) : []), [state]);
  const allTowns = useMemo(
    () => (state && district ? citiesIn(state, district) : []),
    [state, district]
  );
  const towns = useMemo(() => {
    const q = townQuery.trim().toLowerCase();
    return q ? allTowns.filter((t) => t.name.toLowerCase().includes(q)) : allTowns;
  }, [allTowns, townQuery]);
  const districtPlace = useMemo(
    () => districts.find((d) => d.district === district) ?? null,
    [districts, district]
  );

  // The picker keeps no state between openings: someone who mis-tapped a state
  // and closed the sheet should not find it still selected next time.
  const close = () => {
    setQuery("");
    setState(null);
    setDistrict(null);
    setTownQuery("");
    onClose();
  };

  const take = (p: Place) => {
    onPick(p);
    close();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close} transparent={false}>
      <ThemedView style={styles.sheet}>
        <View style={styles.sheetHead}>
          <ThemedText type="subtitle">{t("Where are you?")}</ThemedText>
          <Pressable onPress={close} accessibilityRole="button">
            <ThemedText type="small">{t("Close")}</ThemedText>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("Search {towns} towns, {districts} districts", {
            towns: CITY_COUNT,
            districts: DISTRICT_COUNT,
          })}
          placeholderTextColor={theme.textSecondary}
          style={[styles.search, { borderColor: theme.border, color: theme.text }]}
        />

        {query.trim().length > 0 ? (
          results.length === 0 ? (
            <ThemedText type="small" style={styles.hint}>
              Nothing matches “{query.trim()}”.
            </ThemedText>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {results.map((p) => (
                <Pressable
                  key={`${p.kind}-${p.state}-${p.district}-${p.name}`}
                  style={[styles.row, { borderBottomColor: theme.border }]}
                  onPress={() => take(p)}
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
          )
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            <Step n={1} label={t("State")}>
              {state ? (
                <Chosen
                  value={state}
                  onChange={() => {
                    setState(null);
                    setDistrict(null);
                    setTownQuery("");
                  }}
                />
              ) : (
                STATES.map((st) => (
                  <Pressable
                    key={st}
                    style={[styles.row, { borderBottomColor: theme.border }]}
                    onPress={() => setState(st)}
                    accessibilityRole="button"
                  >
                    <ThemedText>{st}</ThemedText>
                  </Pressable>
                ))
              )}
            </Step>

            {state && (
              <Step n={2} label={t("District")}>
                {district ? (
                  <Chosen
                    value={district}
                    onChange={() => {
                      setDistrict(null);
                      setTownQuery("");
                    }}
                  />
                ) : (
                  districts.map((d) => (
                    <Pressable
                      key={d.district}
                      style={[styles.row, { borderBottomColor: theme.border }]}
                      onPress={() => setDistrict(d.district)}
                      accessibilityRole="button"
                    >
                      <ThemedText>{d.district}</ThemedText>
                    </Pressable>
                  ))
                )}
              </Step>
            )}

            {state && district && (
              <Step n={3} label={t("Town or city")}>
                {allTowns.length === 0
                  ? districtPlace && (
                      <Pressable
                        style={[styles.row, { borderBottomColor: theme.border }]}
                        onPress={() => take(districtPlace)}
                        accessibilityRole="button"
                      >
                        <ThemedText>Use {district} district</ThemedText>
                        <ThemedText type="small">{t("No town is listed here")}</ThemedText>
                      </Pressable>
                    )
                  : (
                    <>
                      {/* A district can hold 130 towns. Scrolling all of them is
                          slower than typing three letters of the right one. */}
                      {allTowns.length > 12 && (
                        <TextInput
                          value={townQuery}
                          onChangeText={setTownQuery}
                          placeholder={t("Filter {n} towns", { n: allTowns.length })}
                          placeholderTextColor={theme.textSecondary}
                          style={[styles.search, { borderColor: theme.border, color: theme.text }]}
                        />
                      )}
                      {towns.map((t) => (
                        <Pressable
                          key={t.name}
                          style={[styles.row, { borderBottomColor: theme.border }]}
                          onPress={() => take(t)}
                          accessibilityRole="button"
                        >
                          <ThemedText>{t.name}</ThemedText>
                        </Pressable>
                      ))}
                      {towns.length === 0 && (
                        <ThemedText type="small" style={styles.hint}>
                          No town in {district} matches “{townQuery.trim()}”.
                        </ThemedText>
                      )}
                      {districtPlace && (
                        <Pressable
                          style={[styles.row, { borderBottomColor: theme.border }]}
                          onPress={() => take(districtPlace)}
                          accessibilityRole="button"
                        >
                          <ThemedText type="small">
                            None of these — use {district} district
                          </ThemedText>
                        </Pressable>
                      )}
                    </>
                  )}
              </Step>
            )}
          </ScrollView>
        )}
      </ThemedView>
    </Modal>
  );
}

function Step({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <ThemedText type="small" style={styles.stepLabel}>
        {n} · {label.toUpperCase()}
      </ThemedText>
      {children}
    </View>
  );
}

/** A step already answered, collapsed to its answer and a way back. */
function Chosen({ value, onChange }: { value: string; onChange: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.chosen}>
      <ThemedText>{value}</ThemedText>
      <Pressable onPress={onChange} accessibilityRole="button">
        <ThemedText type="small">{t("Change")}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two, backgroundColor: "transparent" },
  actions: { flexDirection: "row", gap: Spacing.two, backgroundColor: "transparent" },
  action: {
    borderWidth: 1,
    borderRadius: 2,
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
    borderRadius: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  hint: { paddingVertical: Spacing.two },
  row: { paddingVertical: Spacing.three, borderBottomWidth: 1 },
  step: { paddingTop: Spacing.three, gap: Spacing.one },
  stepLabel: { letterSpacing: 1.4 },
  chosen: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.three,
  },
});

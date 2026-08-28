import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationField } from "@/components/location-field";
import { Panel } from "@/components/panel";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Type } from "@/constants/fonts";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiFetchJson } from "@/lib/api-client";
import {
  NEARBY_RADIUS_KM,
  formatKm,
  summarise,
  type AlertLike,
  type ReportLike,
  type ResourceLike,
} from "@/lib/citizen-summary";
import { labelFor, nearestPlace } from "@/lib/india-places";
import { useLocation } from "@/lib/use-location";

const TYPE_LABEL: Record<ResourceLike["type"], string> = {
  shelter: "Shelter",
  rescue_team: "Rescue team",
  supply_stock: "Supply stock",
};

/** A labelled readout. The label sits above the value, as on a real instrument. */
function Field({
  label,
  value,
  hint,
  color,
  last,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[styles.field, !last && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
    >
      <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
        {label.toUpperCase()}
      </ThemedText>
      <ThemedText style={[styles.fieldValue, color ? { color } : null]}>{value}</ThemedText>
      {hint && (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

/**
 * What is true at the citizen's position right now, assembled only from data the
 * system actually holds: the live alert feed, the resource registry, and their
 * own reports.
 *
 * Nothing here is estimated or illustrative — where a value cannot be computed
 * the field says so instead of showing a plausible number.
 */
export default function DashboardScreen() {
  const theme = useTheme();
  const geo = useLocation();
  const coords = geo.coords;

  const [alerts, setAlerts] = useState<AlertLike[]>([]);
  const [resources, setResources] = useState<ResourceLike[]>([]);
  const [myReports, setMyReports] = useState<ReportLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const SEVERITY_COLOR: Record<AlertLike["severity_color"], string> = {
    red: theme.critical,
    orange: theme.high,
    yellow: theme.medium,
    green: theme.available,
  };

  const load = useCallback(async () => {
    try {
      const [a, r, m] = await Promise.all([
        apiFetchJson<AlertLike[]>("/alerts"),
        apiFetchJson<ResourceLike[]>("/resources"),
        apiFetchJson<ReportLike[]>("/reports"),
      ]);
      setAlerts(a);
      setResources(r);
      setMyReports(m);
    } catch (e) {
      console.error("dashboard poll failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, [load]);

  const summary = useMemo(
    () => (coords ? summarise(coords, alerts, resources, myReports) : null),
    [coords, alerts, resources, myReports]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader
          title="Dashboard"
          subtitle="Alerts, shelters and teams nearest to where you are"
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
        >
          <Panel>
            <ThemedText type="smallBold">Your location</ThemedText>
            <LocationField
              coords={geo.coords}
              status={geo.status}
              source={geo.source}
              placeLabel={geo.placeLabel}
              accuracyM={geo.accuracyM}
              onRetry={geo.retry}
              onManual={geo.setManual}
            />
          </Panel>

          {loading ? (
            <ActivityIndicator style={{ marginTop: Spacing.four }} />
          ) : !coords || !summary ? (
            <Panel>
              <ThemedText type="small" themeColor="textSecondary">
                Once your location is set, this screen shows the alerts, shelters and rescue teams
                nearest to you.
              </ThemedText>
            </Panel>
          ) : (
            <>
              <Panel style={styles.readout}>
                <Field
                  label="Your position"
                  value={geo.placeLabel ?? labelFor(nearestPlace(coords.lat, coords.lng))}
                  hint={
                    `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` +
                    (geo.source === "manual" ? "  ·  approximate, set by hand" : "")
                  }
                />
                <Field
                  label={`Active alerts within ${NEARBY_RADIUS_KM} km`}
                  value={String(summary.nearbyAlerts.length)}
                  color={
                    summary.worstAlert
                      ? SEVERITY_COLOR[summary.worstAlert.row.severity_color]
                      : undefined
                  }
                  hint={
                    summary.worstAlert
                      ? `Most severe: ${summary.worstAlert.row.disaster_type}${
                          summary.worstAlert.row.issuing_agency
                            ? ` · ${summary.worstAlert.row.issuing_agency}`
                            : ""
                        } · ${formatKm(summary.worstAlert.km)} away`
                      : "No official warnings currently cover your area."
                  }
                />
                <Field
                  label="Nearest available shelter"
                  value={summary.nearestShelter ? formatKm(summary.nearestShelter.km) : "None listed"}
                  hint={
                    summary.nearestShelter
                      ? `${summary.nearestShelter.row.name}${
                          summary.nearestShelter.row.capacity
                            ? ` · capacity ${summary.nearestShelter.row.capacity}`
                            : ""
                        }`
                      : "No shelter is currently marked available in the registry."
                  }
                />
                <Field
                  label="Nearest available rescue team"
                  value={summary.nearestTeam ? formatKm(summary.nearestTeam.km) : "None listed"}
                  hint={
                    summary.nearestTeam
                      ? summary.nearestTeam.row.name
                      : "No rescue team is currently marked available."
                  }
                />
                <Field
                  last
                  label="Your open reports"
                  value={String(summary.openReports)}
                  hint={
                    summary.openReports > 0
                      ? "Still being worked. Track them under My Reports."
                      : "Nothing outstanding from you right now."
                  }
                />
              </Panel>

              {summary.nearbyAlerts.length > 0 && (
                <View style={styles.section}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
                    NEAREST WARNINGS
                  </ThemedText>
                  {summary.nearbyAlerts.slice(0, 4).map(({ row, km }) => (
                    <Panel key={row.id} style={styles.rowPanel}>
                      <View style={styles.rowMain}>
                        <View
                          style={[styles.dot, { backgroundColor: SEVERITY_COLOR[row.severity_color] }]}
                        />
                        <View style={styles.rowText}>
                          <ThemedText type="smallBold">{row.disaster_type}</ThemedText>
                          {row.area_description && (
                            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                              {row.area_description}
                            </ThemedText>
                          )}
                        </View>
                      </View>
                      <ThemedText type="small" themeColor="textSecondary">
                        {formatKm(km)}
                      </ThemedText>
                    </Panel>
                  ))}
                </View>
              )}

              {(summary.nearestShelter || summary.nearestTeam) && (
                <View style={styles.section}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.sectionTitle}>
                    CLOSEST HELP
                  </ThemedText>
                  {[summary.nearestShelter, summary.nearestTeam]
                    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
                    .map((entry) => (
                      <Panel key={entry.row.id} style={styles.rowPanel}>
                        <View style={styles.rowText}>
                          <ThemedText type="smallBold" numberOfLines={1}>
                            {entry.row.name}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {TYPE_LABEL[entry.row.type]}
                            {entry.row.capacity ? ` · capacity ${entry.row.capacity}` : ""}
                          </ThemedText>
                        </View>
                        <ThemedText type="small">{formatKm(entry.km)}</ThemedText>
                      </Panel>
                    ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
  readout: { paddingVertical: 0, gap: 0 },
  field: { paddingVertical: Spacing.three, gap: Spacing.one },
  fieldLabel: { letterSpacing: 1.4, fontSize: 11 },
  fieldValue: { fontSize: 20, fontFamily: Type.semibold },
  section: { gap: Spacing.two },
  sectionTitle: { letterSpacing: 1.4, fontSize: 11 },
  rowPanel: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowMain: { flexDirection: "row", alignItems: "center", gap: Spacing.two, flexShrink: 1 },
  rowText: { flexShrink: 1, gap: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

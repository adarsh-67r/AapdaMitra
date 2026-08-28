import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Panel } from "@/components/panel";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiFetchJson } from "@/lib/api-client";
import { haversineKm } from "@/lib/geo";
import { tryGetPosition } from "@/lib/use-location";

interface Alert {
  id: string;
  disaster_type: string;
  area_description: string | null;
  severity_color: "green" | "yellow" | "orange" | "red";
  warning_message: string | null;
  issuing_agency: string | null;
  language: string | null;
  lat: number;
  lng: number;
  effective_end: string | null;
}

// SACHET publishes each alert in a single language, and roughly half are not
// English — label them so the text isn't unexplained.
const LANGUAGE_LABEL: Record<string, string> = {
  en: "English",
  hi: "हिन्दी",
  ml: "മലയാളം",
  te: "తెలుగు",
  or: "ଓଡ଼ିଆ",
  ta: "தமிழ்",
  bn: "বাংলা",
  mr: "मराठी",
  gu: "ગુજરાતી",
  kn: "ಕನ್ನಡ",
};

const NEARBY_RADIUS_KM = 150;

export default function AlertsScreen() {
  const theme = useTheme();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Severity colour from the shared palette, so an alert reads the same on both
  // clients and in both themes.
  const SEVERITY_COLOR: Record<Alert["severity_color"], string> = {
    green: theme.available,
    yellow: theme.medium,
    orange: theme.high,
    red: theme.critical,
  };
  const SEVERITY_WORD: Record<Alert["severity_color"], string> = {
    green: "advisory",
    yellow: "watch",
    orange: "warning",
    red: "severe",
  };

  const load = useCallback(async () => {
    try {
      // Alerts first. Position only narrows the list, so it must never be able
      // to keep the feed from rendering — this used to sit in front of the fetch
      // with no deadline, and a lookup that never resolved left the screen on
      // its loading state indefinitely.
      const data = await apiFetchJson<Alert[]>("/alerts");
      const origin = await tryGetPosition();
      const list = origin ? data.filter((a) => haversineKm(origin!, a) <= NEARBY_RADIUS_KM) : data;
      setAlerts(list);
    } catch (e) {
      console.error("alerts poll failed", e);
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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader
          title="Live Alerts"
          subtitle={`Official warnings within ${NEARBY_RADIUS_KM} km of you`}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.four }} />
        ) : alerts.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            No active alerts nearby.
          </ThemedText>
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(a) => a.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
              />
            }
            renderItem={({ item }) => (
              <Panel>
                <View style={styles.cardHeader}>
                  <View style={styles.titleRow}>
                    <View
                      style={[styles.dot, { backgroundColor: SEVERITY_COLOR[item.severity_color] }]}
                    />
                    <ThemedText type="smallBold">{item.disaster_type}</ThemedText>
                  </View>
                  {/* Colour is never the only signal. */}
                  <ThemedText type="small" style={{ color: SEVERITY_COLOR[item.severity_color] }}>
                    {SEVERITY_WORD[item.severity_color].toUpperCase()}
                  </ThemedText>
                </View>

                {(item.issuing_agency || (item.language && item.language !== "en")) && (
                  <View style={styles.badgeRow}>
                    {item.language && item.language !== "en" && (
                      <View style={[styles.badge, { borderColor: theme.accent }]}>
                        <ThemedText type="small" style={{ color: theme.accent }}>
                          {LANGUAGE_LABEL[item.language] ?? item.language.toUpperCase()}
                        </ThemedText>
                      </View>
                    )}
                    {item.issuing_agency && (
                      <View
                        style={[
                          styles.badge,
                          { borderColor: theme.border, backgroundColor: theme.backgroundSelected },
                        ]}
                      >
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.issuing_agency}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                )}

                {item.area_description && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.area_description}
                  </ThemedText>
                )}
                {item.warning_message && (
                  <ThemedText type="small">{item.warning_message}</ThemedText>
                )}
              </Panel>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  empty: { textAlign: "center", marginTop: Spacing.five },
  list: { gap: Spacing.two, padding: Spacing.three, paddingBottom: Spacing.five },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.two, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
  },
});

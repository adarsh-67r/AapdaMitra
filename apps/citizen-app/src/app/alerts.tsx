import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Brand, Spacing } from "@/constants/theme";
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

const COLOR_HEX: Record<Alert["severity_color"], string> = {
  green: "#2E9E4A",
  yellow: "#D8B400",
  orange: "#E08A00",
  red: "#D64545",
};

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        <ThemedText type="title" style={styles.title}>
          Live Alerts
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Within {NEARBY_RADIUS_KM}km of your location
        </ThemedText>

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
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedView style={styles.cardHeader}>
                  <ThemedView
                    style={[styles.dot, { backgroundColor: COLOR_HEX[item.severity_color] }]}
                  />
                  <ThemedText type="smallBold">{item.disaster_type}</ThemedText>
                </ThemedView>
                {(item.issuing_agency || (item.language && item.language !== "en")) && (
                  <ThemedView style={styles.badgeRow}>
                    {item.language && item.language !== "en" && (
                      <ThemedView style={[styles.badge, styles.langBadge]}>
                        <ThemedText type="small" style={styles.langBadgeText}>
                          {LANGUAGE_LABEL[item.language] ?? item.language.toUpperCase()}
                        </ThemedText>
                      </ThemedView>
                    )}
                    {item.issuing_agency && (
                      <ThemedView type="backgroundSelected" style={styles.badge}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {item.issuing_agency}
                        </ThemedText>
                      </ThemedView>
                    )}
                  </ThemedView>
                )}
                {item.area_description && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.area_description}
                  </ThemedText>
                )}
                {item.warning_message && (
                  <ThemedText type="small">{item.warning_message}</ThemedText>
                )}
              </ThemedView>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.three },
  title: { fontSize: 28, lineHeight: 34, marginTop: Spacing.two },
  subtitle: { marginBottom: Spacing.three },
  empty: { textAlign: "center", marginTop: Spacing.five },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.two, backgroundColor: "transparent" },
  dot: { width: 10, height: 10, borderRadius: 5 },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.one,
    backgroundColor: "transparent",
    marginTop: Spacing.half,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.five,
  },
  langBadge: { backgroundColor: `${Brand.accent}26` },
  langBadgeText: { color: Brand.accent },
});

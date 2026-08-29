import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Panel } from "@/components/panel";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiFetchJson } from "@/lib/api-client";
import { useLanguage } from "@/lib/i18n/use-language";
import { usePoll } from "@/lib/use-poll";

interface Report {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string | null;
  status: "open" | "assigned" | "resolved";
  created_at: string;
  place_label: string | null;
  location_source: string | null;
  photo_url: string | null;
}

export default function MyReportsScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const STATUS_COLOR: Record<Report["status"], string> = {
    open: theme.high,
    assigned: theme.assigned,
    resolved: theme.available,
  };
  const SEVERITY_COLOR: Record<Report["severity"], string> = {
    low: theme.textSecondary,
    medium: theme.medium,
    high: theme.high,
    critical: theme.critical,
  };

  const load = useCallback(async () => {
    try {
      const data = await apiFetchJson<Report[]>("/reports");
      setReports(data);
    } catch (e) {
      console.error("my-reports poll failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  usePoll(load);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader
          title={t("My Reports")}
          subtitle={t("Track the status of what you have reported")}
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.four }} />
        ) : reports.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            {t("You haven't submitted any reports yet.")}
          </ThemedText>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(r) => r.id}
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
                  <View style={styles.severity}>
                    <View
                      style={[styles.dot, { backgroundColor: SEVERITY_COLOR[item.severity] }]}
                    />
                    {/* Severity is never colour alone — the word carries it. */}
                    <ThemedText type="smallBold" style={{ color: SEVERITY_COLOR[item.severity] }}>
                      {t(item.severity).toUpperCase()}
                    </ThemedText>
                  </View>
                  <ThemedText type="small" style={{ color: STATUS_COLOR[item.status] }}>
                    {t(item.status).toUpperCase()}
                  </ThemedText>
                </View>

                {item.description && <ThemedText type="small">{item.description}</ThemedText>}

                {/* The citizen's own evidence, shown back to them: it is proof
                    the photo actually reached the authorities. */}
                {item.photo_url && (
                  <Image
                    source={{ uri: item.photo_url }}
                    style={[styles.photo, { borderColor: theme.border }]}
                    resizeMode="cover"
                  />
                )}

                {item.place_label && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.place_label}
                    {/* Anything but a device fix is approximate. This read
                        "manual" only, so a report filed by SMS — placed from
                        where that number last reported — was shown as if it
                        were a GPS position. */}
                    {item.location_source !== "device" ? `  ·  ${t("approximate")}` : ""}
                  </ThemedText>
                )}

                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(item.created_at).toLocaleString()}
                </ThemedText>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  severity: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
  photo: { width: "100%", height: 150, borderWidth: 1, borderRadius: 2 },
});

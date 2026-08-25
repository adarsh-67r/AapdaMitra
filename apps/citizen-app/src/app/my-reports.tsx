import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

interface Report {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string | null;
  status: "open" | "assigned" | "resolved";
  created_at: string;
}

const STATUS_COLOR: Record<Report["status"], string> = {
  open: "#E08A00",
  assigned: "#3C87F7",
  resolved: "#2E9E4A",
};

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("id, severity, description, status, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setReports(data as Report[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("my-reports-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          My Reports
        </ThemedText>

        {loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.four }} />
        ) : reports.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            You haven&apos;t submitted any reports yet.
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
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedView style={styles.cardHeader}>
                  <ThemedText type="smallBold">{item.severity} severity</ThemedText>
                  <ThemedView
                    style={[styles.statusPill, { backgroundColor: STATUS_COLOR[item.status] }]}>
                    <ThemedText type="small" style={styles.statusText}>
                      {item.status}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                {item.description && (
                  <ThemedText type="small">{item.description}</ThemedText>
                )}
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(item.created_at).toLocaleString()}
                </ThemedText>
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
  title: { fontSize: 28, lineHeight: 34, marginTop: Spacing.two, marginBottom: Spacing.three },
  empty: { textAlign: "center", marginTop: Spacing.five },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  statusPill: { borderRadius: Spacing.five, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  statusText: { color: "#fff" },
});

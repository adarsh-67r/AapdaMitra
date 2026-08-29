import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/lib/i18n/use-language";
import { apiFetchJson } from "@/lib/api-client";
import { haversineKm } from "@/lib/geo";
import { leafletHtml, type MapPin } from "@/lib/leaflet-html";
import { tryGetPosition } from "@/lib/use-location";

interface Resource {
  id: string;
  type: "shelter" | "rescue_team" | "supply_stock";
  name: string;
  lat: number;
  lng: number;
  status: "available" | "full" | "dispatched";
}

// Chennai — the demo region seeded in supabase/seed.sql. Used as the initial
// map center before (or if) device location is available.
const DEFAULT_CENTER = { lat: 13.0674, lng: 80.2376 };

export default function SheltersScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const scheme = useColorScheme();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);

  const PIN_COLOR: Record<Resource["status"], string> = {
    available: theme.available,
    full: theme.critical,
    dispatched: theme.high,
  };

  useEffect(() => {
    // Centres the map on the citizen when a position is available, and quietly
    // stays on the default region when it is not.
    (async () => {
      const position = await tryGetPosition();
      if (position) {
        setCenter(position);
        setHere(position);
      }
    })();

    async function load() {
      try {
        const data = await apiFetchJson<Resource[]>("/resources");
        setResources(data);
      } catch (e) {
        console.error("shelters poll failed", e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, []);

  const pins: MapPin[] = useMemo(
    () =>
      resources.map((r) => ({
        lat: r.lat,
        lng: r.lng,
        color: PIN_COLOR[r.status],
        title: r.name,
        // Status in words as well as colour, inside the popup.
        description: `${t(r.type.replace("_", " "))} — ${t(r.status)}`,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resources, theme]
  );

  /** The nearest shelter that can actually take someone, named in text. */
  const nearestShelter = useMemo(() => {
    if (!here) return null;
    const open = resources.filter((r) => r.type === "shelter" && r.status === "available");
    if (open.length === 0) return null;
    return open
      .map((r) => ({ resource: r, km: haversineKm(here, r) }))
      .sort((a, b) => a.km - b.km)[0];
  }, [here, resources]);

  const html = useMemo(
    () =>
      leafletHtml(center, pins, {
        dark: scheme === "dark",
        panel: theme.backgroundElement,
        border: theme.border,
        text: theme.text,
        ground: theme.backgroundSelected,
      }),
    [center, pins, scheme, theme]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScreenHeader
          title={t("Find Shelter")}
          subtitle={
            nearestShelter
              ? t("Nearest open shelter: {name}, {km} km", {
                  name: nearestShelter.resource.name,
                  km: nearestShelter.km.toFixed(1),
                })
              : t("Shelters, teams and supply points on the map")
          }
        />

        {loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.four }} />
        ) : (
          <View style={styles.mapWrap}>
            <WebView originWhitelist={["*"]} source={{ html }} style={styles.map} />
          </View>
        )}

        <View style={[styles.legend, { borderTopColor: theme.border }]}>
          {(
            [
              ["available", t("Open")],
              ["full", t("Full")],
              ["dispatched", t("Out on a call")],
            ] as const
          ).map(([status, label]) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: PIN_COLOR[status] }]} />
              <ThemedText type="small" themeColor="textSecondary">
                {label}
              </ThemedText>
            </View>
          ))}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

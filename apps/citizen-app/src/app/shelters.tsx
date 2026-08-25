import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { apiFetchJson } from "@/lib/api-client";
import { leafletHtml, type MapPin } from "@/lib/leaflet-html";

interface Resource {
  id: string;
  type: "shelter" | "rescue_team" | "supply_stock";
  name: string;
  lat: number;
  lng: number;
  status: "available" | "full" | "dispatched";
}

const PIN_COLOR: Record<Resource["status"], string> = {
  available: "#2E9E4A",
  full: "#D64545",
  dispatched: "#E08A00",
};

// Chennai — the demo region seeded in supabase/seed.sql. Used as the initial
// map center before (or if) device location is available.
const DEFAULT_CENTER = { lat: 13.0674, lng: 80.2376 };

export default function SheltersScreen() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(DEFAULT_CENTER);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({});
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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
        description: `${r.type.replace("_", " ")} — ${r.status}`,
      })),
    [resources]
  );

  const html = useMemo(() => leafletHtml(center, pins), [center, pins]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ThemedText type="title" style={styles.title}>
          Nearby Shelters
        </ThemedText>

        {loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.four }} />
        ) : (
          <WebView originWhitelist={["*"]} source={{ html }} style={styles.map} />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  title: { fontSize: 28, lineHeight: 34, paddingHorizontal: Spacing.three, marginBottom: Spacing.two },
  map: { flex: 1 },
});

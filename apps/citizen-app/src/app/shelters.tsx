import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/lib/i18n/use-language";
import { apiFetchJson } from "@/lib/api-client";
import {
  FACILITY_KINDS,
  FACILITY_LABEL,
  FACILITY_MIN_ZOOM,
  facilityQuery,
  type FacilityKind,
} from "@/lib/facilities";
import { haversineKm } from "@/lib/geo";
import { leafletHtml, type MapFacility, type MapPin, type MapView } from "@/lib/leaflet-html";
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

/**
 * How long the map has to sit still before its facilities are fetched.
 *
 * A pan across a city crosses several viewfuls. Asking for each one spends a
 * request on ground nobody stopped to look at, which on the connection this app
 * is built for is the difference between an answer and a spinner.
 */
const SETTLE_MS = 400;

interface FacilityAnswer {
  shown: MapFacility[];
  total: number;
}

export default function SheltersScreen() {
  const theme = useTheme();
  const { t } = useLanguage();
  const scheme = useColorScheme();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);

  const webRef = useRef<WebView>(null);
  const [kinds, setKinds] = useState<Set<FacilityKind>>(new Set());
  const [view, setView] = useState<MapView | null>(null);
  const [answer, setAnswer] = useState<FacilityAnswer | "error" | null>(null);
  // Kept so a WebView reload — which the shelters poll can cause by rebuilding
  // the HTML — can be redrawn without asking the server again.
  const drawn = useRef<MapFacility[]>([]);

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
        muted: theme.textSecondary,
      }),
    [center, pins, scheme, theme]
  );

  const draw = useCallback((list: MapFacility[]) => {
    drawn.current = list;
    webRef.current?.injectJavaScript(
      `window.setFacilities && window.setFacilities(${JSON.stringify(list)}); true;`
    );
  }, []);

  /** The map telling React Native where it has come to rest. */
  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === "view") setView(message as MapView);
    } catch {
      // Not ours. The WebView is our own document, but a stray postMessage from
      // a script we did not write must not take the screen down.
    }
  }, []);

  // Fetch whatever the current view and switches call for, once the map has
  // settled.
  useEffect(() => {
    if (!view) return;

    const path = facilityQuery(view, kinds);
    if (!path) {
      draw([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const next = await apiFetchJson<FacilityAnswer>(path);
        if (cancelled) return;
        draw(next.shown);
        setAnswer(next);
      } catch {
        if (cancelled) return;
        // The layer is context, not the reason anyone opened this screen. Say
        // it is missing and leave the shelters on the map.
        setAnswer("error");
      }
    }, SETTLE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [view, kinds, draw]);

  /**
   * The line under the chips.
   *
   * Derived rather than stored: every case but the answer itself is decided by
   * what is already on screen, and storing those would mean writing state from
   * inside an effect to describe state the effect can already see.
   */
  const facilityNote = useMemo(() => {
    if (kinds.size === 0) return null;
    if (view && view.zoom < FACILITY_MIN_ZOOM) return t("Zoom in to see facilities");
    if (answer === "error") return t("Could not load facilities");
    if (!answer) return null;
    if (answer.total === 0) return t("None nearby");
    if (answer.shown.length < answer.total) {
      return t("Showing {shown} of {total}", {
        shown: String(answer.shown.length),
        total: String(answer.total),
      });
    }
    return t("{n} nearby", { n: String(answer.total) });
  }, [kinds, view, answer, t]);

  const toggleKind = useCallback((kind: FacilityKind) => {
    // The old count describes a layer that is no longer the one on screen.
    setAnswer(null);
    setKinds((previous) => {
      const next = new Set(previous);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

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

        <View style={styles.chips}>
          {FACILITY_KINDS.map((kind) => {
            const on = kinds.has(kind);
            return (
              <Pressable
                key={kind}
                onPress={() => toggleKind(kind)}
                accessibilityRole="switch"
                accessibilityState={{ checked: on }}
                style={[
                  styles.chip,
                  {
                    borderColor: on ? theme.text : theme.border,
                    backgroundColor: on ? theme.backgroundSelected : "transparent",
                  },
                ]}
              >
                <ThemedText type="small" themeColor={on ? "text" : "textSecondary"}>
                  {t(FACILITY_LABEL[kind])}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {facilityNote ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.facilityNote}>
            {facilityNote}
          </ThemedText>
        ) : null}

        {loading ? (
          <ActivityIndicator style={{ marginTop: Spacing.four }} />
        ) : (
          <View style={styles.mapWrap}>
            <WebView
              ref={webRef}
              originWhitelist={["*"]}
              source={{ html }}
              style={styles.map}
              onMessage={onMessage}
              // The HTML is rebuilt when the shelters poll returns something
              // new, which reloads the document and empties the facility layer.
              // Putting back what was there costs nothing and saves a request.
              onLoadEnd={() => draw(drawn.current)}
            />
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: 2,
  },
  facilityNote: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  legendItem: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

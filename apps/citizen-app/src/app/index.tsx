import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { LocationField } from "@/components/location-field";
import { Brand, Spacing } from "@/constants/theme";
import { apiFetch, apiFetchJson } from "@/lib/api-client";
import { enqueueReport, flushQueue, subscribeToQueue } from "@/lib/offline-queue";
import { useLocation } from "@/lib/use-location";

type Severity = "low" | "medium" | "high" | "critical";
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

export default function ReportScreen() {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const geo = useLocation();
  const location = geo.coords;
  const [submitting, setSubmitting] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => subscribeToQueue(setPendingCount), []);

  // Retry queued reports on mount and whenever the app comes back to the
  // foreground — the most likely moment for connectivity to have returned.
  useEffect(() => {
    flushQueue();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") flushQueue();
    });
    return () => sub.remove();
  }, []);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo permission needed", "Enable photo access to attach an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function submit() {
    if (!location) {
      Alert.alert("Location required", "Tag your location before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const report = await apiFetchJson<{ id: string }>("/reports", {
        method: "POST",
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          severity,
          description,
          place_label: geo.placeLabel,
          location_source: geo.source,
        }),
      });

      if (photoUri) {
        const form = new FormData();
        form.append("file", { uri: photoUri, name: "photo.jpg", type: "image/jpeg" } as any);
        const res = await apiFetch(`/reports/${report.id}/photo`, { method: "POST", body: form, headers: {} });
        if (!res.ok) throw new Error(`photo upload failed: ${res.status}`);
      }

      Alert.alert("Report submitted", "Authorities have been notified.");
      setDescription("");
      setPhotoUri(null);
      setSeverity("medium");
    } catch (e) {
      // Couldn't reach the server — hold the report locally and replay it when
      // the network returns, rather than making the citizen retype it.
      await enqueueReport({
        lat: location.lat,
        lng: location.lng,
        severity,
        description,
        photoUri,
        placeLabel: geo.placeLabel,
        locationSource: geo.source,
      });
      setDescription("");
      setPhotoUri(null);
      setSeverity("medium");
      Alert.alert(
        "Saved offline",
        "No connection right now. Your report is saved and will be sent automatically when you're back online."
      );
      console.warn("report queued offline:", e instanceof Error ? e.message : e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ThemedText type="title" style={styles.title}>
            Report an Incident
          </ThemedText>

          {pendingCount > 0 && (
            <ThemedView type="backgroundElement" style={styles.pendingBanner}>
              <ThemedText type="smallBold">
                {pendingCount} report{pendingCount === 1 ? "" : "s"} waiting to send
              </ThemedText>
              <ThemedText type="small">
                Saved on this device. They&apos;ll upload automatically once you&apos;re back online.
              </ThemedText>
            </ThemedView>
          )}

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Location</ThemedText>
            <LocationField
              coords={geo.coords}
              status={geo.status}
              source={geo.source}
              placeLabel={geo.placeLabel}
              accuracyM={geo.accuracyM}
              onRetry={geo.retry}
              onManual={geo.setManual}
            />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Severity</ThemedText>
            <ThemedView style={styles.severityRow}>
              {SEVERITIES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setSeverity(s)}
                  style={[styles.severityChip, severity === s && styles.severityChipSelected]}>
                  <ThemedText type="small">{s}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Description</ThemedText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What's happening? Who's affected?"
              multiline
              numberOfLines={4}
              style={styles.textArea}
            />
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Photo (optional)</ThemedText>
            <Pressable style={styles.secondaryButton} onPress={pickPhoto}>
              <ThemedText>{photoUri ? "Change photo" : "Attach a photo"}</ThemedText>
            </Pressable>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.preview} />}
          </ThemedView>

          <Pressable style={styles.submitButton} onPress={submit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={Brand.accentContrast} />
            ) : (
              <ThemedText style={styles.submitText}>Submit Report</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { padding: Spacing.three, gap: Spacing.three },
  title: { fontSize: 28, lineHeight: 34 },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  pendingBanner: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    borderWidth: 1,
    borderColor: "#E08A00",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#8888",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: "center",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#8888",
    borderRadius: Spacing.two,
    padding: Spacing.two,
    minHeight: 90,
    textAlignVertical: "top",
  },
  severityRow: { flexDirection: "row", gap: Spacing.two, backgroundColor: "transparent" },
  severityChip: {
    borderWidth: 1,
    borderColor: "#8888",
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  severityChipSelected: { backgroundColor: Brand.accent, borderColor: Brand.accent },
  preview: { width: "100%", height: 160, borderRadius: Spacing.two, marginTop: Spacing.two },
  submitButton: {
    backgroundColor: Brand.accent,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  submitText: { color: Brand.accentContrast, fontWeight: "700", fontSize: 16 },
});

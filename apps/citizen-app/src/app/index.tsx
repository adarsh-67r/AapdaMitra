import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { apiFetch, apiFetchJson } from "@/lib/api-client";

type Severity = "low" | "medium" | "high" | "critical";
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

export default function ReportScreen() {
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function captureLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location permission needed", "Enable location access to tag your report.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } finally {
      setLocating(false);
    }
  }

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
        body: JSON.stringify({ lat: location.lat, lng: location.lng, severity, description }),
      });

      if (photoUri) {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const form = new FormData();
        form.append("file", blob, "photo.jpg");
        await apiFetch(`/reports/${report.id}/photo`, { method: "POST", body: form, headers: {} });
      }

      Alert.alert("Report submitted", "Authorities have been notified.");
      setDescription("");
      setPhotoUri(null);
      setSeverity("medium");
    } catch (e) {
      Alert.alert("Submission failed", e instanceof Error ? e.message : "unknown error");
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

          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Location</ThemedText>
            <Pressable style={styles.secondaryButton} onPress={captureLocation}>
              {locating ? (
                <ActivityIndicator />
              ) : (
                <ThemedText>
                  {location
                    ? `📍 ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                    : "Tag my current location"}
                </ThemedText>
              )}
            </Pressable>
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
              <ActivityIndicator color="#fff" />
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
  severityChipSelected: { backgroundColor: "#208AEF", borderColor: "#208AEF" },
  preview: { width: "100%", height: 160, borderRadius: Spacing.two, marginTop: Spacing.two },
  submitButton: {
    backgroundColor: "#208AEF",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});

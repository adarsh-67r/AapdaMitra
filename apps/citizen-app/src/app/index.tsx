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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LocationField } from "@/components/location-field";
import { Panel } from "@/components/panel";
import { ScreenHeader } from "@/components/screen-header";
import { SosButton } from "@/components/sos-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { fileReport } from "@/lib/file-report";
import { flushQueue, subscribeToQueue } from "@/lib/offline-queue";
import { useLocation } from "@/lib/use-location";

type Severity = "low" | "medium" | "high" | "critical";
const SEVERITIES: Severity[] = ["low", "medium", "high", "critical"];

export default function ReportScreen() {
  const theme = useTheme();
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const geo = useLocation();
  const location = geo.coords;
  const [submitting, setSubmitting] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const SEVERITY_COLOR: Record<Severity, string> = {
    low: theme.textSecondary,
    medium: theme.medium,
    high: theme.high,
    critical: theme.critical,
  };

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

  /**
   * Photograph the incident.
   *
   * This is the path that matters: someone standing in front of a collapsed
   * bridge photographs it, they do not go looking for it in their camera roll.
   * The app declared a camera permission from the start but never opened the
   * camera, so the only way to attach anything was to have taken it earlier.
   */
  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera permission needed",
        "Allow camera access to photograph the incident, or choose an existing photo instead."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      // The upload is a second call over whatever connection is left in a
      // disaster; one photo in the live data is already 4.3 MB.
      quality: 0.6,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
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
    const outcome = await fileReport({
      lat: location.lat,
      lng: location.lng,
      severity,
      description,
      photoUri,
      placeLabel: geo.placeLabel,
      locationSource: geo.source,
    });
    setSubmitting(false);

    if (outcome.status === "failed") {
      Alert.alert("Could not save your report", `${outcome.reason}. Please try again.`);
      return;
    }

    setDescription("");
    setPhotoUri(null);
    setSeverity("medium");

    if (outcome.status === "queued") {
      Alert.alert(
        "Saved offline",
        "No connection right now. Your report is saved and will be sent automatically when you're back online."
      );
      return;
    }

    Alert.alert(
      "Report submitted",
      outcome.photo === "failed"
        ? "Authorities have been notified. Your photo could not be uploaded."
        : "Authorities have been notified."
    );
  }

  async function sendSos() {
    if (!location) return;
    setSubmitting(true);
    const outcome = await fileReport({
      lat: location.lat,
      lng: location.lng,
      severity: "critical",
      // Matches the web client's SOS wording, so one incident reported from
      // either client reads the same in the console queue.
      description: "SOS - immediate emergency assistance needed",
      photoUri: null,
      placeLabel: geo.placeLabel,
      locationSource: geo.source,
    });
    setSubmitting(false);

    if (outcome.status === "failed") {
      Alert.alert("SOS could not be saved", `${outcome.reason}. Try again, or call 112.`);
      return;
    }
    Alert.alert(
      outcome.status === "queued" ? "SOS saved offline" : "SOS sent",
      outcome.status === "queued"
        ? "No connection right now. It will send automatically when you are back online. If you can, call 112."
        : "Authorities have been notified of your location."
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader
          title="Report an Incident"
          subtitle="Photo, location, severity — filed in under a minute"
        />

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {pendingCount > 0 && (
            <Panel tone="recessed" style={{ borderColor: theme.high }}>
              <ThemedText type="smallBold">
                {pendingCount} report{pendingCount === 1 ? "" : "s"} waiting to send
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Saved on this device. They&apos;ll upload automatically once you&apos;re back online.
              </ThemedText>
            </Panel>
          )}

          {/* The emergency path comes first: it must be reachable without
              scrolling past a form. */}
          <SosButton disabled={!location} busy={submitting} onSend={sendSos} />

          <Panel>
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
          </Panel>

          <Panel>
            <ThemedText type="smallBold">Severity</ThemedText>
            <View style={styles.severityRow}>
              {SEVERITIES.map((s) => {
                const selected = severity === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSeverity(s)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[
                      styles.severityChip,
                      {
                        borderColor: selected ? SEVERITY_COLOR[s] : theme.border,
                        backgroundColor: selected ? SEVERITY_COLOR[s] : "transparent",
                      },
                    ]}
                  >
                    {/* Label as well as colour, always. */}
                    <ThemedText
                      type="small"
                      style={selected ? styles.severityTextSelected : undefined}
                    >
                      {s}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Panel>

          <Panel>
            <ThemedText type="smallBold">Description</ThemedText>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What's happening? Who's affected?"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
            />
          </Panel>

          <Panel>
            <ThemedText type="smallBold">Photo (optional)</ThemedText>
            <View style={styles.photoRow}>
              <Pressable
                style={[styles.secondaryButton, styles.photoButton, { borderColor: theme.border }]}
                onPress={takePhoto}
                accessibilityRole="button"
              >
                <ThemedText type="small">Take a photo</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, styles.photoButton, { borderColor: theme.border }]}
                onPress={pickPhoto}
                accessibilityRole="button"
              >
                <ThemedText type="small">Choose existing</ThemedText>
              </Pressable>
            </View>
            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={[styles.preview, { borderColor: theme.border }]}
              />
            )}
          </Panel>

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: theme.accent },
              submitting && styles.disabled,
            ]}
            onPress={submit}
            disabled={submitting}
            accessibilityRole="button"
          >
            {submitting ? (
              <ActivityIndicator color={theme.accentContrast} />
            ) : (
              <ThemedText style={[styles.submitText, { color: theme.accentContrast }]}>
                Submit Report
              </ThemedText>
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
  scroll: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.five },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: Spacing.two,
    alignItems: "center",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 2,
    padding: Spacing.two,
    minHeight: 90,
    textAlignVertical: "top",
  },
  photoRow: { flexDirection: "row", gap: Spacing.two },
  photoButton: { flex: 1 },
  severityRow: { flexDirection: "row", gap: Spacing.two },
  severityChip: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  severityTextSelected: { color: "#fff" },
  preview: { width: "100%", height: 160, borderWidth: 1, borderRadius: 2, marginTop: Spacing.two },
  submitButton: {
    borderRadius: 2,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  submitText: { fontWeight: "700", fontSize: 16 },
  disabled: { opacity: 0.5 },
});

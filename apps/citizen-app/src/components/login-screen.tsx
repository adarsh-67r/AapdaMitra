import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useAuth } from "@/lib/use-auth";

type Mode = "login" | "signup";

export function LoginScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await signup(email, password, "citizen");
      } else {
        await login(email, password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          AapdaMitra
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Report incidents. Find shelters. Stay informed.
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedView style={styles.modeRow}>
            {(["login", "signup"] as Mode[]).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={[styles.modeButton, mode === m && styles.modeButtonActive]}>
                <ThemedText style={mode === m ? styles.modeTextActive : undefined}>{m}</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            style={styles.input}
          />
          <Pressable style={styles.button} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator /> : <ThemedText style={styles.buttonText}>{mode === "signup" ? "Create Account" : "Sign In"}</ThemedText>}
          </Pressable>
        </ThemedView>

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, justifyContent: "center", gap: Spacing.three },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", fontSize: 16, lineHeight: 22 },
  card: { borderRadius: Spacing.four, padding: Spacing.four, gap: Spacing.three },
  modeRow: { flexDirection: "row", gap: Spacing.one, backgroundColor: "transparent" },
  modeButton: { flex: 1, paddingVertical: Spacing.two, alignItems: "center", borderRadius: Spacing.two },
  modeButtonActive: { backgroundColor: "#208AEF" },
  modeTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#8888",
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  button: { backgroundColor: "#208AEF", borderRadius: Spacing.two, paddingVertical: Spacing.three, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#D64545", textAlign: "center" },
});

import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Panel } from "@/components/panel";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { DEMO_CITIZEN } from "@/lib/demo-accounts";
import { useAuth } from "@/lib/use-auth";

type Mode = "login" | "signup";

export function LoginScreen() {
  const theme = useTheme();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * One tap into a real pre-created account. Someone opening this during an
   * emergency, or a judge with two minutes at a stall, should not have to invent
   * a password first. Real auth still runs; only the typing is skipped.
   */
  async function enterDemo() {
    setError(null);
    setLoading(true);
    try {
      await login(DEMO_CITIZEN.email, DEMO_CITIZEN.password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "could not open the demo account");
    } finally {
      setLoading(false);
    }
  }

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
          Aapda Mitra
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Report incidents. Find shelters. Stay informed.
        </ThemedText>

        <Panel style={styles.card}>
          <ThemedView style={styles.modeRow}>
            {(["login", "signup"] as Mode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === m }}
                style={[styles.modeButton, mode === m && { backgroundColor: theme.accent }]}
              >
                <ThemedText style={mode === m ? { color: theme.accentContrast } : undefined}>
                  {m}
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { borderColor: theme.border, color: theme.text }]}
          />
          <Pressable
            style={[styles.button, { backgroundColor: theme.accent }]}
            onPress={submit}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={theme.accentContrast} />
            ) : (
              <ThemedText style={[styles.buttonText, { color: theme.accentContrast }]}>
                {mode === "signup" ? "Create Account" : "Sign In"}
              </ThemedText>
            )}
          </Pressable>
        </Panel>

        <Pressable
          style={[styles.demoButton, { borderColor: theme.border }]}
          onPress={enterDemo}
          disabled={loading}
          accessibilityRole="button"
        >
          <ThemedText style={styles.demoText}>Explore with the demo account</ThemedText>
        </Pressable>

        {error && (
          <ThemedText type="small" style={[styles.error, { color: theme.critical }]}>
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
  card: { gap: Spacing.three, padding: Spacing.four },
  modeRow: { flexDirection: "row", gap: Spacing.one, backgroundColor: "transparent" },
  modeButton: { flex: 1, paddingVertical: Spacing.two, alignItems: "center", borderRadius: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  demoButton: {
    borderWidth: 1,
    borderRadius: 2,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  demoText: { fontWeight: "600" },
  button: { borderRadius: 2, paddingVertical: Spacing.three, alignItems: "center" },
  buttonText: { fontWeight: "600" },
  error: { textAlign: "center" },
});

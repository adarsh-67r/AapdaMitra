import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

type Step = "email" | "code";

export function LoginScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode() {
    setError(null);
    if (code.trim().length === 0) {
      setError("Enter the code from your email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email",
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    }
    // On success, the auth state listener in useAuth picks up the new
    // session automatically and the app re-renders past this screen.
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

        {step === "email" ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Sign in with email</ThemedText>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <Pressable style={styles.button} onPress={sendCode} disabled={loading}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <ThemedText style={styles.buttonText}>Send code</ThemedText>
              )}
            </Pressable>
          </ThemedView>
        ) : (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">Enter the code sent to {email}</ThemedText>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              keyboardType="number-pad"
              style={styles.input}
            />
            <Pressable style={styles.button} onPress={verifyCode} disabled={loading}>
              {loading ? (
                <ActivityIndicator />
              ) : (
                <ThemedText style={styles.buttonText}>Verify</ThemedText>
              )}
            </Pressable>
            <Pressable onPress={() => setStep("email")}>
              <ThemedText type="link" themeColor="textSecondary">
                Use a different email
              </ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {error && (
          <ThemedText type="small" themeColor="text" style={styles.error}>
            {error}
          </ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    justifyContent: "center",
    gap: Spacing.three,
  },
  title: { textAlign: "center" },
  subtitle: { textAlign: "center", fontSize: 16, lineHeight: 22 },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: "#8888",
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#208AEF",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  error: { color: "#D64545", textAlign: "center" },
});

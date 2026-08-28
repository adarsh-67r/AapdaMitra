import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Long enough that a phone loose in a pocket cannot file a critical report,
 * short enough to complete with shaking hands. The web client sends on one
 * click, but a phone is carried against the body and a false critical report
 * costs a dispatched team.
 */
const HOLD_MS = 1200;
const RELEASE_MS = 200;

/**
 * Hold to send an emergency report.
 *
 * The bar fills for as long as the press is held and fires when it is full, so
 * the motion is not decoration — it is the progress of the action, and letting
 * go visibly undoes it.
 */
export function SosButton({
  disabled,
  busy,
  onSend,
}: {
  disabled: boolean;
  busy: boolean;
  onSend: () => void;
}) {
  const theme = useTheme();
  // A lazy useState initialiser rather than a ref: the animated value is read
  // during render to build the fill style, and reading a ref there is exactly
  // what React's rules forbid. The value is still created once.
  const [progress] = useState(() => new Animated.Value(0));
  const [holding, setHolding] = useState(false);
  // Without this the release animation would re-arm the control after the hold
  // has already fired, mid-send.
  const fired = useRef(false);

  // Built once per value rather than on every render, so the interpolation is
  // not rebuilt mid-animation.
  const [fillWidth] = useState(() =>
    progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] })
  );

  useEffect(() => () => progress.stopAnimation(), [progress]);

  const start = useCallback(() => {
    if (disabled || busy) return;
    fired.current = false;
    setHolding(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      // Width cannot be driven natively. This is one interpolated value on one
      // view; the alternative is a scaleX that has to be re-anchored to the
      // left edge by hand, which is more moving parts for the same result.
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      fired.current = true;
      setHolding(false);
      progress.setValue(0);
      onSend();
    });
  }, [disabled, busy, progress, onSend]);

  const cancel = useCallback(() => {
    if (fired.current) return;
    setHolding(false);
    // Starting this cancels the fill, whose callback then arrives with
    // finished: false and does nothing.
    Animated.timing(progress, {
      toValue: 0,
      duration: RELEASE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const label = busy ? "Sending…" : holding ? "Keep holding…" : "SOS — hold to send";

  return (
    <>
      <Pressable
        onPressIn={start}
        onPressOut={cancel}
        disabled={disabled || busy}
        accessibilityRole="button"
        accessibilityLabel="Send an SOS"
        accessibilityHint="Press and hold for just over a second to file a critical report at your location"
        accessibilityState={{ disabled: disabled || busy, busy }}
        style={[
          styles.button,
          { backgroundColor: theme.critical },
          (disabled || busy) && styles.disabled,
        ]}
      >
        <Animated.View pointerEvents="none" style={[styles.fill, { width: fillWidth }]} />
        <ThemedText style={styles.label}>{label}</ThemedText>
      </Pressable>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        {disabled
          ? "Set your location below before sending an SOS."
          : "Files a critical report at your location. No description needed."}
      </ThemedText>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 2,
    paddingVertical: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    // Keeps the fill inside the corners.
    overflow: "hidden",
  },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "#00000038" },
  label: { color: "#fff", fontWeight: "700", fontSize: 16, letterSpacing: 0.5 },
  disabled: { opacity: 0.5 },
  hint: { textAlign: "center", marginTop: Spacing.one },
});

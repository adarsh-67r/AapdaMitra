import { IBMPlexMono_400Regular } from "@expo-google-fonts/ibm-plex-mono/400Regular";
import { IBMPlexSans_400Regular } from "@expo-google-fonts/ibm-plex-sans/400Regular";
import { IBMPlexSans_500Medium } from "@expo-google-fonts/ibm-plex-sans/500Medium";
import { IBMPlexSans_600SemiBold } from "@expo-google-fonts/ibm-plex-sans/600SemiBold";
import { IBMPlexSans_700Bold } from "@expo-google-fonts/ibm-plex-sans/700Bold";

/**
 * IBM Plex, the same face the web client sets in apps/web/src/app/layout.tsx.
 *
 * Until this existed the app ran on the platform default — Roboto on Android,
 * San Francisco on iOS — so the two clients shared a palette and a layout but
 * not a voice, which is most of what makes them read as one product.
 *
 * React Native does not synthesise weights for a custom family the way a
 * browser does: asking for `fontWeight: 700` on a family that only loaded its
 * regular cut gets you regular, silently. Each weight is therefore a separate
 * loaded family, and the text styles name the family rather than a weight.
 * Only the four cuts actually used are imported, by their per-weight subpath,
 * so the other twelve never reach the bundle.
 */
export const FONT_ASSETS = {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
  IBMPlexMono_400Regular,
};

export const Type = {
  regular: "IBMPlexSans_400Regular",
  medium: "IBMPlexSans_500Medium",
  semibold: "IBMPlexSans_600SemiBold",
  bold: "IBMPlexSans_700Bold",
  mono: "IBMPlexMono_400Regular",
} as const;

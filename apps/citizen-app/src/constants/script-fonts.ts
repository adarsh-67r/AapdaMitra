import { IBMPlexSansDevanagari_400Regular } from "@expo-google-fonts/ibm-plex-sans-devanagari/400Regular";
import { IBMPlexSansDevanagari_500Medium } from "@expo-google-fonts/ibm-plex-sans-devanagari/500Medium";
import { IBMPlexSansDevanagari_600SemiBold } from "@expo-google-fonts/ibm-plex-sans-devanagari/600SemiBold";
import { IBMPlexSansDevanagari_700Bold } from "@expo-google-fonts/ibm-plex-sans-devanagari/700Bold";
import { NotoSansArabic_400Regular } from "@expo-google-fonts/noto-sans-arabic/400Regular";
import { NotoSansArabic_700Bold } from "@expo-google-fonts/noto-sans-arabic/700Bold";
import { NotoSansBengali_400Regular } from "@expo-google-fonts/noto-sans-bengali/400Regular";
import { NotoSansBengali_700Bold } from "@expo-google-fonts/noto-sans-bengali/700Bold";
import { NotoSansGujarati_400Regular } from "@expo-google-fonts/noto-sans-gujarati/400Regular";
import { NotoSansGujarati_700Bold } from "@expo-google-fonts/noto-sans-gujarati/700Bold";
import { NotoSansGurmukhi_400Regular } from "@expo-google-fonts/noto-sans-gurmukhi/400Regular";
import { NotoSansGurmukhi_700Bold } from "@expo-google-fonts/noto-sans-gurmukhi/700Bold";
import { NotoSansKannada_400Regular } from "@expo-google-fonts/noto-sans-kannada/400Regular";
import { NotoSansKannada_700Bold } from "@expo-google-fonts/noto-sans-kannada/700Bold";
import { NotoSansMalayalam_400Regular } from "@expo-google-fonts/noto-sans-malayalam/400Regular";
import { NotoSansMalayalam_700Bold } from "@expo-google-fonts/noto-sans-malayalam/700Bold";
import { NotoSansOriya_400Regular } from "@expo-google-fonts/noto-sans-oriya/400Regular";
import { NotoSansOriya_700Bold } from "@expo-google-fonts/noto-sans-oriya/700Bold";
import { NotoSansTamil_400Regular } from "@expo-google-fonts/noto-sans-tamil/400Regular";
import { NotoSansTamil_700Bold } from "@expo-google-fonts/noto-sans-tamil/700Bold";
import { NotoSansTelugu_400Regular } from "@expo-google-fonts/noto-sans-telugu/400Regular";
import { NotoSansTelugu_700Bold } from "@expo-google-fonts/noto-sans-telugu/700Bold";

import { Type } from "@/constants/fonts";
import type { Script } from "@/lib/i18n/languages";

/**
 * A face for every script the app can be read in.
 *
 * IBM Plex — the web client's voice, and this app's — covers Latin and
 * Devanagari and nothing else in India. The other nine scripts come from Noto,
 * which is the only family that reaches all of them. They will not look like
 * Plex, and that is the right trade: a citizen reading Tamil needs Tamil to
 * render, not to render in the house style.
 *
 * Two weights for the Noto scripts rather than four. Each face is a couple of
 * hundred kilobytes in the APK, and the app leans on regular and bold; medium
 * and semibold borrow the nearest cut rather than doubling the weight of every
 * script nobody in a given install will ever select.
 */

/** The family names for one script, in the shape the text styles ask for. */
export interface ScriptType {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
  mono: string;
}

function notoType(family: string): ScriptType {
  return {
    regular: `${family}_400Regular`,
    medium: `${family}_400Regular`,
    semibold: `${family}_700Bold`,
    bold: `${family}_700Bold`,
    // No monospace face exists for these scripts. Plex Mono covers the Latin
    // digits and identifiers that the code style is actually used for.
    mono: Type.mono,
  };
}

export const TYPE_BY_SCRIPT: Record<Script, ScriptType> = {
  latin: Type,
  devanagari: {
    regular: "IBMPlexSansDevanagari_400Regular",
    medium: "IBMPlexSansDevanagari_500Medium",
    semibold: "IBMPlexSansDevanagari_600SemiBold",
    bold: "IBMPlexSansDevanagari_700Bold",
    mono: Type.mono,
  },
  bengali: notoType("NotoSansBengali"),
  gujarati: notoType("NotoSansGujarati"),
  gurmukhi: notoType("NotoSansGurmukhi"),
  odia: notoType("NotoSansOriya"),
  tamil: notoType("NotoSansTamil"),
  telugu: notoType("NotoSansTelugu"),
  kannada: notoType("NotoSansKannada"),
  malayalam: notoType("NotoSansMalayalam"),
  arabic: notoType("NotoSansArabic"),
};

export const FONTS_BY_SCRIPT: Record<Script, Record<string, unknown>> = {
  latin: {},
  devanagari: {
    IBMPlexSansDevanagari_400Regular,
    IBMPlexSansDevanagari_500Medium,
    IBMPlexSansDevanagari_600SemiBold,
    IBMPlexSansDevanagari_700Bold,
  },
  bengali: { NotoSansBengali_400Regular, NotoSansBengali_700Bold },
  gujarati: { NotoSansGujarati_400Regular, NotoSansGujarati_700Bold },
  gurmukhi: { NotoSansGurmukhi_400Regular, NotoSansGurmukhi_700Bold },
  odia: { NotoSansOriya_400Regular, NotoSansOriya_700Bold },
  tamil: { NotoSansTamil_400Regular, NotoSansTamil_700Bold },
  telugu: { NotoSansTelugu_400Regular, NotoSansTelugu_700Bold },
  kannada: { NotoSansKannada_400Regular, NotoSansKannada_700Bold },
  malayalam: { NotoSansMalayalam_400Regular, NotoSansMalayalam_700Bold },
  arabic: { NotoSansArabic_400Regular, NotoSansArabic_700Bold },
};

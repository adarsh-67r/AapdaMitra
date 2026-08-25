import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Expo Router's dev/build tooling does an internal server-side render pass
// for its web platform even when only native clients connect. AsyncStorage's
// web implementation reads `window`/`localStorage` synchronously, which
// doesn't exist during that SSR pass — crashing the whole Metro server, not
// just that one request. Guard every call so it's a no-op off-browser.
const ssrSafeStorage = {
  getItem: (key: string) => {
    if (typeof window === "undefined") return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === "undefined") return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === "undefined") return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ssrSafeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

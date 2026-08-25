import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL!;
const TOKEN_KEY = "token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export async function apiFetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, options);
  if (res.status === 401) {
    // Clear the stale/expired token so the next auth check (next poll tick
    // or next app foreground) sees "signed-out". We deliberately don't
    // reach into the auth store from here — importing use-auth.ts would
    // create a circular import, and clearing the token is enough since
    // nothing re-checks status faster than the next poll cycle anyway.
    await clearToken();
    throw new Error("session expired");
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail ?? `request failed: ${res.status}`);
  }
  return data as T;
}

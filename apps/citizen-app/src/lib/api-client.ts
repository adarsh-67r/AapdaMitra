import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;
const TOKEN_KEY = "token";

/**
 * How long to wait before calling a request dead.
 *
 * The default `fetch` has no timeout at all, and RN's underlying stack will sit
 * on a half-open socket for minutes on a bad cell. But the opposite mistake is
 * worse here: a 2G connection in a flood zone is not "offline", and cutting it
 * off at a desktop-shaped five seconds files a perfectly sendable report into
 * the offline queue. These are deliberately patient.
 */
const READ_TIMEOUT_MS = 20000;
const WRITE_TIMEOUT_MS = 60000;

export interface NetworkOptions {
  timeoutMs?: number;
  /** Extra attempts after the first. Only ever use this on idempotent reads. */
  retries?: number;
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * The server address, or a loud failure.
 *
 * EXPO_PUBLIC_* values are inlined at bundle time, so a build made without them
 * — an EAS build, whose upload never includes the gitignored .env — produced a
 * base URL of the literal string "undefined". Every request then failed at the
 * DNS layer and surfaced as "no connection right now", which sent citizens
 * hunting for signal they already had. A missing address is a broken build, and
 * it should say so rather than impersonate a broken network.
 */
function baseUrl(): string {
  if (!API_BASE) {
    throw new Error(
      "this build has no server address (EXPO_PUBLIC_API_URL was missing when it was built)"
    );
  }
  return API_BASE.replace(/\/+$/, "");
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function fetchOnce(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (isTimeout(error)) throw new Error("the connection was too slow to reach the server");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  net: NetworkOptions = {}
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const method = (options.method ?? "GET").toUpperCase();
  const timeoutMs = net.timeoutMs ?? (method === "GET" ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS);
  // Reads retry themselves; writes never do. A retried GET costs a duplicate
  // round trip, a retried POST /reports costs a duplicate incident in the
  // console — and a write that got through but whose response was lost is
  // indistinguishable from one that never arrived.
  const attempts = 1 + (net.retries ?? (method === "GET" ? 2 : 0));

  // Resolved before the retry loop: a build with no server address is a broken
  // build, and retrying it three times only delays saying so.
  const url = `${baseUrl()}${path}`;

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fetchOnce(url, { ...options, headers }, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 800 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

export async function apiFetchJson<T>(
  path: string,
  options: RequestInit = {},
  net: NetworkOptions = {}
): Promise<T> {
  const res = await apiFetch(path, options, net);
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

import { useEffect, useSyncExternalStore } from "react";
import { apiFetchJson, clearToken, getToken, setToken } from "./api-client";

export type Role = "citizen" | "authority";
export type AuthStatus = "loading" | "signed-out" | Role;

function decodeRole(token: string): Role | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;
  } catch {
    return null;
  }
}

// Module-level store shared by every useAuth() call site. Without this,
// _layout.tsx and login-screen.tsx would each get their own isolated
// useState, so a successful login/signup in login-screen.tsx would never be
// seen by _layout.tsx's render branch (the app would stay stuck on the
// login screen forever after a real sign-in).
let status: AuthStatus = "loading";
const listeners = new Set<() => void>();

function setStatus(next: AuthStatus) {
  status = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return status;
}

let initialized = false;
function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  (async () => {
    const token = await getToken();
    if (!token) {
      setStatus("signed-out");
      return;
    }
    setStatus(decodeRole(token) ?? "signed-out");
  })();
}

export function useAuth() {
  const currentStatus = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    ensureInitialized();
  }, []);

  const signup = async (email: string, password: string, role: Role) => {
    const data = await apiFetchJson<{ token: string; role: Role }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    await setToken(data.token);
    setStatus(data.role);
  };

  const login = async (email: string, password: string) => {
    const data = await apiFetchJson<{ token: string; role: Role }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await setToken(data.token);
    setStatus(data.role);
  };

  const signOut = async () => {
    await clearToken();
    setStatus("signed-out");
  };

  return { status: currentStatus, login, signup, signOut };
}

import { useEffect, useSyncExternalStore } from "react";
import { apiFetchJson, clearToken, getToken, setToken } from "./api-client";
import { DEMO_CITIZEN } from "./demo-accounts";

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
    if (token) {
      setStatus(decodeRole(token) ?? "signed-out");
      return;
    }

    // The citizen app has no sign-in step: someone opening it during an
    // emergency should reach the dashboard, not a form. Real auth still runs —
    // this signs into a pre-created account on the live backend and stores the
    // JWT that every screen needs — only the typing is skipped.
    //
    // The consequence is deliberate and worth knowing: every device shares this
    // one account, so My Reports shows what anyone filed from any device. That
    // is correct for a demo and wrong for real use, where this becomes a real
    // sign-in again (login-screen.tsx is still here for that).
    try {
      const data = await apiFetchJson<{ token: string; role: Role }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(DEMO_CITIZEN),
      });
      await setToken(data.token);
      setStatus(data.role);
    } catch (e) {
      // Offline on first launch. The screens still open; reports filed now go
      // to the offline queue and replay once the network — and a token — come
      // back on the next launch.
      console.warn("could not sign in:", e instanceof Error ? e.message : e);
      setStatus("citizen");
    }
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

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { apiFetchJson, clearToken, getToken, setToken } from "./api-client";

export type Role = "citizen" | "authority";
export type AuthStatus = "loading" | "signed-out" | Role;

interface DecodedToken {
  role: Role;
}

function decodeRole(token: string): Role | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as DecodedToken;
    return payload.role;
  } catch {
    return null;
  }
}

// Module-level store shared by every useAuth() call site. Without this,
// each call site would get its own isolated useState, so a successful
// login/signup would never be seen by page.tsx's render branch (the app
// would stay stuck on the same view forever after a real sign-in).
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
  const token = getToken();
  if (!token) {
    setStatus("signed-out");
    return;
  }
  setStatus(decodeRole(token) ?? "signed-out");
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
    setToken(data.token);
    setStatus(data.role);
  };

  const login = async (email: string, password: string) => {
    const data = await apiFetchJson<{ token: string; role: Role }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setStatus(data.role);
  };

  const signOut = () => {
    clearToken();
    setStatus("signed-out");
  };

  return { status: currentStatus, login, signup, signOut };
}

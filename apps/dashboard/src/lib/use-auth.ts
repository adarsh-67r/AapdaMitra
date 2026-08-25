"use client";

import { useEffect, useState } from "react";
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

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus("signed-out");
      return;
    }
    const role = decodeRole(token);
    setStatus(role ?? "signed-out");
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

  return { status, login, signup, signOut };
}

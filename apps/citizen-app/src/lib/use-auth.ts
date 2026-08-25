import { useEffect, useState } from "react";
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

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setStatus("signed-out");
        return;
      }
      setStatus(decodeRole(token) ?? "signed-out");
    })();
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

  return { status, login, signup, signOut };
}

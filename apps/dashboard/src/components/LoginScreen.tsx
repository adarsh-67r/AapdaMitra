"use client";

import { useState } from "react";
import { useAuth } from "@/lib/use-auth";

type Mode = "login" | "signup";
type Role = "citizen" | "authority";

export default function LoginScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!email.includes("@") || password.length < 6) {
      setError("Enter a valid email and a password of at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await signup(email, password, role);
      } else {
        await login(email, password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-bg text-text">
      <div className="w-full max-w-sm flex flex-col gap-5 px-6">
        <div className="flex items-center gap-3 justify-center">
          <div className="w-9 h-9 border border-accent rounded-md flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l2-7 4 14 2-7h6" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">AapdaMitra</span>
        </div>

        <div className="flex bg-panel-alt border border-border rounded-lg p-1 gap-1">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 py-2 rounded-md text-sm font-semibold uppercase tracking-wide cursor-pointer"
              style={mode === m ? { background: "var(--accent)", color: "var(--accent-contrast)" } : { color: "var(--text-muted)" }}
            >
              {m}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <div className="flex bg-panel-alt border border-border rounded-lg p-1 gap-1">
            {(["citizen", "authority"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="flex-1 py-2 rounded-md text-sm font-semibold uppercase tracking-wide cursor-pointer"
                style={role === r ? { background: "var(--accent)", color: "var(--accent-contrast)" } : { color: "var(--text-muted)" }}
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col gap-3.5">
          <label className="font-mono text-xs uppercase tracking-wider text-text-muted">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="bg-panel-alt border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <label className="font-mono text-xs uppercase tracking-wider text-text-muted">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="bg-panel-alt border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-accent"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button
            onClick={submit}
            disabled={loading}
            className="py-2.5 rounded text-sm font-bold uppercase tracking-wide disabled:opacity-50 cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            {loading ? "..." : mode === "signup" ? "Create Account" : "Sign In"}
          </button>
          {error && <p className="text-sm text-critical">{error}</p>}
        </div>
      </div>
    </div>
  );
}

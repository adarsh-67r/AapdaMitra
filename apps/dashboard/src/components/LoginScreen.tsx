"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";

type Step = "email" | "code";
type Role = "citizen" | "authority";

export default function LoginScreen() {
  const [role, setRole] = useState<Role>("citizen");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Only used if this turns out to be a brand-new account — an existing
    // profile keeps its own stored role regardless of this selection.
    localStorage.setItem("intended_role", role);
    setStep("code");
  }

  async function verifyCode() {
    setError(null);
    if (code.trim().length === 0) {
      setError("Enter the code from your email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setLoading(false);
    if (error) setError(error.message);
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
        <p className="text-sm text-text-muted text-center">Sign in to continue</p>

        {step === "email" && (
          <div className="flex bg-panel-alt border border-border rounded-lg p-1 gap-1">
            {(["citizen", "authority"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="flex-1 py-2 rounded-md text-sm font-semibold uppercase tracking-wide cursor-pointer"
                style={
                  role === r
                    ? { background: "var(--accent)", color: "var(--accent-contrast)" }
                    : { color: "var(--text-muted)" }
                }
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col gap-3.5">
          {step === "email" ? (
            <>
              <label className="font-mono text-xs uppercase tracking-wider text-text-muted">
                Email address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                className="bg-panel-alt border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-accent"
                onKeyDown={(e) => e.key === "Enter" && sendCode()}
              />
              <button
                onClick={sendCode}
                disabled={loading}
                className="py-2.5 rounded text-sm font-bold uppercase tracking-wide disabled:opacity-50 cursor-pointer"
                style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>
                {loading ? "Sending…" : "Send Code"}
              </button>
            </>
          ) : (
            <>
              <label className="font-mono text-xs uppercase tracking-wider text-text-muted">
                Code sent to {email}
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                inputMode="numeric"
                className="bg-panel-alt border border-border rounded px-3 py-2.5 text-sm outline-none focus:border-accent font-mono tracking-widest"
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
              />
              <button
                onClick={verifyCode}
                disabled={loading}
                className="py-2.5 rounded text-sm font-bold uppercase tracking-wide disabled:opacity-50 cursor-pointer"
                style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}>
                {loading ? "Verifying…" : "Verify"}
              </button>
              <button
                onClick={() => setStep("email")}
                className="text-xs text-text-muted underline cursor-pointer"
              >
                Use a different email
              </button>
            </>
          )}

          {error && <p className="text-sm text-critical">{error}</p>}
        </div>
      </div>
    </div>
  );
}

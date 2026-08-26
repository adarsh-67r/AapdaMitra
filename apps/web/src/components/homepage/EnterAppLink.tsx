"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/use-auth";
import { DEMO_CITIZEN, DEMO_AUTHORITY } from "@/lib/demo-accounts";

export default function EnterAppLink({
  role,
  className,
  pendingLabel,
  children,
}: {
  role: "citizen" | "authority";
  className?: string;
  pendingLabel?: string;
  children: React.ReactNode;
}) {
  const { login } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      const demo = role === "citizen" ? DEMO_CITIZEN : DEMO_AUTHORITY;
      await login(demo.email, demo.password);
      router.push("/");
    } catch {
      setPending(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={pending} className={className}>
      {pending ? pendingLabel ?? "Entering…" : children}
    </button>
  );
}

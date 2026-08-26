"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginScreen from "@/components/LoginScreen";
import { useAuth } from "@/lib/use-auth";

export default function LoginPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "citizen" || status === "authority") {
      router.replace("/");
    }
  }, [status, router]);

  return <LoginScreen />;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getRoleHome } from "@/lib/roles";
import { saveSessionToken } from "@/lib/session";

export function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("Invalid login details");
        return;
      }
      const json = (await res.json()) as {
        token: string;
        user: { role: "admin" | "teacher" | "student" };
      };
      saveSessionToken(json.token);
      router.push(getRoleHome(json.user.role));
    } catch {
      setError("Invalid login details");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <Card>
        <h1 className="mb-8 text-center text-2xl font-bold text-foreground">
          {t("login")}
        </h1>

        <div className="flex flex-col gap-6">
          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">Email</span>
            <input
              type="email"
              name="email"
              inputMode="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className="min-h-16 w-full rounded-xl border border-neutral-300 bg-white px-4 text-center text-lg tracking-wide outline-none ring-primary transition-[box-shadow] focus-visible:border-primary focus-visible:ring-2 sm:text-left"
            />
          </label>

          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              className="min-h-16 w-full rounded-xl border border-neutral-300 bg-white px-4 text-center text-lg tracking-wide outline-none ring-primary transition-[box-shadow] focus-visible:border-primary focus-visible:ring-2 sm:text-left"
            />
          </label>

          {error ? (
            <p className="text-center text-sm text-accent" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="button" onClick={handleLogin}>
            Login
          </Button>
        </div>
      </Card>

      <p className="text-center text-sm text-neutral-500">
        <Link
          href="/"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          ← {t("home")}
        </Link>
      </p>
    </div>
  );
}

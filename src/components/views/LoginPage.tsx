"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getRoleHome, parseRole } from "@/lib/roles";
import { saveSessionToken } from "@/lib/session";

export function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [credential, setCredential] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    try {
      const isEmailLogin = login.includes("@");
      const res = await fetch(isEmailLogin ? "/api/admin/login" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          isEmailLogin
            ? { login: login.trim(), password: credential }
            : { mobile: login, pin: credential },
        ),
      });
      const json = (await res.json().catch(() => null)) as
        | { token?: string; role?: string; user?: { role: string }; error?: string }
        | null;
      if (!res.ok || !json?.token) {
        setError(json?.error ?? "Invalid mobile number or PIN");
        return;
      }
      saveSessionToken(json.token);
      router.push(getRoleHome(parseRole(json.role ?? json.user?.role)));
    } catch {
      setError("Invalid mobile number or PIN");
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
            <span className="mb-2 block">Mobile number or admin email</span>
            <input
              type="text"
              name="login"
              inputMode="text"
              autoComplete="username"
              placeholder="10-digit mobile or admin email"
              value={login}
              onChange={(e) => {
                setLogin(e.target.value.trim());
                if (error) setError(null);
              }}
              className="min-h-16 w-full rounded-xl border border-neutral-300 bg-white px-4 text-center text-lg tracking-wide outline-none ring-primary transition-[box-shadow] focus-visible:border-primary focus-visible:ring-2 sm:text-left"
            />
          </label>

          <label className="block text-left text-sm font-medium text-neutral-700">
            <span className="mb-2 block">PIN or password</span>
            <input
              type="password"
              name="credential"
              autoComplete="current-password"
              placeholder="PIN or password"
              value={credential}
              onChange={(e) => {
                setCredential(e.target.value);
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
          Back to {t("home")}
        </Link>
      </p>
    </div>
  );
}

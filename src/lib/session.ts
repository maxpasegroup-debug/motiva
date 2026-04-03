import type { Role } from "@/lib/roles";

export const AUTH_TOKEN_STORAGE_KEY = "motiva-auth-token";

export type UserSession = {
  userId: string;
  role: Role;
  email: string;
  name: string;
  exp?: number;
};

export function saveSessionToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function decodeJwtPayload(token: string): unknown {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payloadB64Url = parts[1];
  const payloadB64 = payloadB64Url.replace(/-/g, "+").replace(/_/g, "/");

  // atob expects standard base64.
  const json = atob(payloadB64);
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

export function getSession(): UserSession | null {
  const token = getAuthToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token) as Record<string, unknown> | null;
  if (!payload) return null;

  const role = payload.role as Role | undefined;
  if (
    role !== "admin" &&
    role !== "teacher" &&
    role !== "student" &&
    role !== "parent"
  ) {
    return null;
  }

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string"
  ) {
    return null;
  }

  const exp = typeof payload.exp === "number" ? payload.exp : undefined;
  if (typeof exp === "number") {
    const nowSec = Date.now() / 1000;
    if (nowSec > exp) return null;
  }

  return {
    userId: payload.sub,
    role,
    email: payload.email,
    name: payload.name,
    exp,
  };
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

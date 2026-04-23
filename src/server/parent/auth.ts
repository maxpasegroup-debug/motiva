import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";

const ADMIN_AUTH_COOKIE = "motiva_admin_auth";
const USER_AUTH_COOKIE = "motiva_user_auth";

export type ParentSession = JwtPayload & {
  userId: string;
};

export function getParentSession(): ParentSession | null {
  const store = cookies();
  const token =
    store.get(USER_AUTH_COOKIE)?.value ?? store.get(ADMIN_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyJwt(token);
    if (payload.role !== "parent" && payload.role !== "admin") {
      return null;
    }

    return {
      ...payload,
      userId: payload.sub,
    };
  } catch {
    return null;
  }
}

export function requireParentSession(): ParentSession {
  const session = getParentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

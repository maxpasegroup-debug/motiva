import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/server/auth/http-auth";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";

export type ParentSession = JwtPayload & {
  userId: string;
};

export function getParentSession(): ParentSession | null {
  const store = cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;

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

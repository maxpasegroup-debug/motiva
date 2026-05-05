import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/server/auth/http-auth";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";

export type MentorSession = JwtPayload & {
  userId: string;
};

export function getMentorSession(): MentorSession | null {
  const store = cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyJwt(token);
    if (payload.role !== "mentor" && payload.role !== "admin") {
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

export function requireMentorSession(): MentorSession {
  const session = getMentorSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

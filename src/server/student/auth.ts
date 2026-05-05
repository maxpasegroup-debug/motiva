import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME } from "@/server/auth/http-auth";
import { verifyJwt, type JwtPayload } from "@/server/auth/jwt";

export type StudentSession = JwtPayload & {
  userId: string;
};

export function getStudentSession(): StudentSession | null {
  const store = cookies();
  const token = store.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = verifyJwt(token);
    if (payload.role !== "student" && payload.role !== "admin") {
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

export function requireStudentSession(): StudentSession {
  const session = getStudentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

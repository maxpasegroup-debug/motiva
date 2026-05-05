import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/jwt-env";
import { isRole, type Role } from "@/lib/roles";

export type JwtPayload = {
  sub: string;
  userId: string;
  role: Role;
  name: string;
  mobile?: string | null;
  email?: string | null;
  profileData?: unknown;
  exp?: number;
  iat?: number;
};

export type JwtSignUser = {
  id: string;
  role: string;
  name: string;
  mobile?: string | null;
  email?: string | null;
  profileData?: unknown;
};

export function signJwt(user: JwtSignUser) {
  if (!isRole(user.role)) {
    throw new Error("Invalid user role");
  }

  const secret = getJwtSecret();
  const payload: Omit<JwtPayload, "exp" | "iat"> = {
    sub: user.id,
    userId: user.id,
    role: user.role,
    name: user.name,
    mobile: user.mobile ?? null,
    email: user.email ?? null,
    profileData: user.profileData ?? null,
  };
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyJwt(token: string): JwtPayload {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret) as JwtPayload;
  if (!decoded.sub || !isRole(decoded.role)) {
    throw new Error("Invalid token payload");
  }
  return decoded;
}

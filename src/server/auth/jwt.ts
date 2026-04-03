import jwt from "jsonwebtoken";
import type { Role } from "@/lib/roles";
import type { AuthUser } from "@/server/auth/auth-users-store";

export type JwtPayload = {
  sub: string; // user id
  role: Role;
  email: string;
  name: string;
  exp?: number;
  iat?: number;
};

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev-jwt-secret";
}

export function signJwt(user: AuthUser) {
  const secret = getJwtSecret();
  const payload: Omit<JwtPayload, "exp" | "iat"> = {
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  };
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyJwt(token: string): JwtPayload {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret) as JwtPayload;
  return decoded;
}


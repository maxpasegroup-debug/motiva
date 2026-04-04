import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/jwt-env";
import type { Role } from "@/lib/roles";

export type JwtPayload = {
  sub: string; // user id
  role: Role;
  email: string;
  name: string;
  exp?: number;
  iat?: number;
};

export type JwtSignUser = {
  id: string;
  role: Role;
  email: string;
  name: string;
};

export function signJwt(user: JwtSignUser) {
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


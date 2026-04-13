import { getJwtSecretKey } from "@/lib/jwt-env";
import { isRole, type Role } from "@/lib/roles";
import { jwtVerify } from "jose/jwt/verify";

export type EdgeJwtPayload = {
  sub: string;
  role: Role;
  email: string;
  name: string;
};

export async function verifyJwtEdge(token: string): Promise<EdgeJwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecretKey(), {
    algorithms: ["HS256"],
  });
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  const name = typeof payload.name === "string" ? payload.name : "";
  const roleRaw = payload.role;
  const role = isRole(roleRaw) ? roleRaw : null;
  if (!sub || !role) {
    throw new Error("Invalid token payload");
  }
  return { sub, role, email, name };
}

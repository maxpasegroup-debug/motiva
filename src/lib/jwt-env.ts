import { requiredEnv } from "@/lib/required-env";

/** JWT signing (Node) and verification (Node + Edge middleware). */
export function getJwtSecret(): string {
  return requiredEnv("JWT_SECRET", process.env.JWT_SECRET);
}

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

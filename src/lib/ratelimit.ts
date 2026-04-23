import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type AppRateLimiter = Ratelimit | null;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

function createLimiter(limit: number): AppRateLimiter {
  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, "60 s"),
    analytics: true,
    prefix: "motiva:ratelimit",
  });
}

export const authLimiter = createLimiter(10);
export const publicLimiter = createLimiter(30);
export const apiLimiter = createLimiter(100);

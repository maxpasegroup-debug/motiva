import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

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

function clientIdentifier(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return (
    firstForwardedIp ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "anonymous"
  );
}

export async function rateLimitRequest(
  req: NextRequest,
  limiter: AppRateLimiter,
  scope: string,
): Promise<NextResponse | null> {
  if (!limiter) return null;

  const result = await limiter.limit(`${scope}:${clientIdentifier(req)}`);
  if (result.success) return null;

  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(
          Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
        ),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    },
  );
}

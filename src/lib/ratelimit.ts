import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

export type AppRateLimiter = Ratelimit | null;
export type AppRateLimiterGetter = () => AppRateLimiter;

let _redis: Redis | null | undefined = undefined;

function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token || !url.startsWith("https")) {
    _redis = null;
    return null;
  }

  try {
    _redis = Redis.fromEnv();
  } catch {
    _redis = null;
  }

  return _redis;
}

function createLimiter(limit: number): AppRateLimiterGetter {
  let _limiter: AppRateLimiter | undefined = undefined;

  return () => {
    if (_limiter !== undefined) return _limiter;

    const redis = getRedis();
    if (!redis) {
      _limiter = null;
      return null;
    }

    _limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, "60 s"),
      analytics: true,
      prefix: "motiva:ratelimit",
    });

    return _limiter;
  };
}

export const authLimiter: AppRateLimiterGetter = createLimiter(10);
export const publicLimiter: AppRateLimiterGetter = createLimiter(30);
export const apiLimiter: AppRateLimiterGetter = createLimiter(100);

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
  limiter: AppRateLimiter | AppRateLimiterGetter,
  scope: string,
): Promise<NextResponse | null> {
  const resolved = typeof limiter === "function" ? limiter() : limiter;
  if (!resolved) return null;

  const result = await resolved.limit(`${scope}:${clientIdentifier(req)}`);
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

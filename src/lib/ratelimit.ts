import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Different rate limits for different operations
export const usernameRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "60 s"), // 3 username changes per minute
  analytics: true,
});

export const generalApiLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, "60 s"), // 30 requests per minute
  analytics: true,
});

// Helper to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP.trim();
  }

  return "127.0.0.1"; // Fallback for local development
}

// app/api/profile/username/claim/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { usernameRateLimit, getClientIP } from "@/lib/ratelimit";
import * as Sentry from "@sentry/nextjs";

const RESERVED_USERNAMES = [
  "admin",
  "root",
  "api",
  "www",
  "mail",
  "ftp",
  "support",
  "help",
  "contact",
  "about",
  "login",
  "signup",
  "register",
  "dashboard",
  "profile",
  "settings",
  "account",
  "user",
  "users",
  "moderator",
  "mod",
  "administrator",
  "system",
  "service",
  "bot",
  "null",
  "undefined",
];
const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(
    /^[a-z0-9]+$/,
    "Username can only contain lowercase letters and numbers"
  )
  .refine(
    (name) => !RESERVED_USERNAMES.includes(name.toLowerCase()),
    "Username is reserved"
  );
export async function POST(req: Request) {
  const clientIP = getClientIP(req);
  const session = await getServerSession(authOptions);
  try {
    const { success, limit, remaining, reset } = await usernameRateLimit.limit(
      clientIP
    );
    if (!success) {
      // Log suspicious activity
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      Sentry.captureMessage(`Username rate limit exceeded`, {
        tags: { ip: clientIP },
        level: "warning",
      });

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.round((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await req.json();
    const desiredUsername = usernameSchema.parse(username.toLowerCase().trim());

    // Check if username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: desiredUsername },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    // Update user with the new username
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { username: desiredUsername },
      select: { username: true },
    });

    // Log successful username change for audit
    console.log(`Username changed: ${session.user.id} -> ${desiredUsername}`);

    return NextResponse.json({ username: user.username });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      }));
      return NextResponse.json(
        { error: "Invalid username", details: issues },
        { status: 400 }
      );
    }

    console.error("Username claim error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "username-claim",
        ip: clientIP,
        userId: session?.user?.id,
      },
    });

    // Don't leak error details in production
    const isProduction = process.env.NODE_ENV === "production";
    const errorMessage = isProduction
      ? "An error occurred while updating username"
      : error instanceof Error
      ? error.message
      : "Unknown error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

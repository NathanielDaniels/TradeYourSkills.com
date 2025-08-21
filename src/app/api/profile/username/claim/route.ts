// app/api/profile/username/claim/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { usernameRateLimit, getClientIP } from "@/lib/ratelimit";
import { sanitizeText } from "@/lib/sanitize";
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.username || typeof body.username !== "string") {
      return NextResponse.json(
        { error: "Username is required and must be a string" },
        { status: 400 }
      );
    }

    const { username } = body;
    const sanitizedUsername = sanitizeText(username, 20);
    const desiredUsername = usernameSchema.parse(
      sanitizedUsername.toLowerCase().trim()
    );

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, createdAt: true },
    });

    if (currentUser?.username === desiredUsername) {
      // Username isn't changing, just return current username (no rate limiting needed)
      return NextResponse.json({ username: desiredUsername });
    }

    const userCreatedRecently =
      new Date(currentUser?.createdAt || 0) >
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    const { success, limit, remaining, reset } = userCreatedRecently
      ? await usernameRateLimit.limit(`new-${session.user.id}`) // Different key for new users
      : await usernameRateLimit.limit(session.user.id);

    if (!success) {
      const userHash = session.user.id.slice(-8);
      // Log suspicious activity
      console.warn(`Rate limit exceeded for user: ***${userHash}`);

      const errorMessage = userCreatedRecently
        ? "Too many username changes. New users can change usernames more frequently, but you've reached your limit. Please try again later."
        : "Too many username changes. You can only change your username 2 times per month.";

      Sentry.captureMessage(`Username rate limit exceeded`, {
        tags: {
          userId: session.user.id,
          newUser: userCreatedRecently,
        },
        level: "warning",
      });

      return NextResponse.json(
        {
          error: errorMessage,
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

    // Check if username is already taken
    const user = await prisma.$transaction(async (tx) => {
      // Re-check availability within transaction
      const existingUser = await tx.user.findUnique({
        where: { username: desiredUsername },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        throw new Error("Username is already taken");
      }

      return tx.user.update({
        where: { id: session.user.id },
        data: { username: desiredUsername },
        select: { username: true },
      });
    });

    // Audit log
    const userHash = session.user.id.slice(-8);
    console.log(`Username changed: ***${userHash} -> ${desiredUsername}`);

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

    if (
      error instanceof Error &&
      error.message === "Username is already taken"
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
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

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generalApiLimit, getClientIP } from "@/lib/ratelimit";
import { sanitizeText } from "@/lib/sanitize";
import * as Sentry from "@sentry/nextjs";
import type { Session } from "next-auth";

const profileUpdateSchema = z.object({
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .nullable(),
  location: z
    .string()
    .max(100, "Location must be less than 100 characters")
    .optional()
    .nullable(),
});

export async function GET(request: Request) {
  const clientIP = getClientIP(request);
  let session: Session | null = null;

  try {
    const { success, limit, remaining, reset } = await generalApiLimit.limit(
      clientIP
    );
    if (!success) {
      console.warn(`Profile GET rate limit exceeded for IP: ${clientIP}`);
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

    // Authentication
    session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        bio: true,
        location: true,
        username: true,
        name: true,
        email: true,
        avatar: true,
        skills: {
          select: { id: true, name: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        area: "profile-get",
        ip: clientIP,
        userId: session?.user?.id,
      },
    });
    return NextResponse.json(
      { error: "An error occurred while fetching profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const clientIP = getClientIP(request);
  let session: Session | null = null;

  try {
    // Rate limiting (stricter for POST operations)
    const { success, limit, remaining, reset } = await generalApiLimit.limit(
      clientIP
    );
    if (!success) {
      console.warn(`Profile POST rate limit exceeded for IP: ${clientIP}`);
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

    // Authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Input validation and sanitization
    const body = await request.json();

    // Sanitize input to prevent XSS
    const sanitizedInput = {
      bio: body.bio ? sanitizeText(body.bio, 500) : body.bio,
      location: body.location
        ? sanitizeText(body.location, 100)
        : body.location,
    };

    // Validate with Zod schema
    const validatedData = profileUpdateSchema.parse(sanitizedInput);

    // Update profile data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bio: validatedData.bio,
        location: validatedData.location,
      },
      select: {
        bio: true,
        location: true,
      },
    });

    // Log successful profile update for audit trail
    console.log(
      `Profile updated: ${
        session.user.id
      } - bio: ${!!validatedData.bio}, location: ${!!validatedData.location}`
    );

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
        code: i.code,
      }));

      return NextResponse.json(
        { error: "Invalid input data", details: issues },
        { status: 400 }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // Log unexpected errors
    console.error("Profile POST error:", error);
    Sentry.captureException(error, {
      tags: {
        area: "profile-update",
        ip: clientIP,
        userId: session?.user?.id,
      },
    });

    // Don't leak error details in production
    const isProduction = process.env.NODE_ENV === "production";
    const errorMessage = isProduction
      ? "An error occurred while updating profile"
      : error instanceof Error
      ? error.message
      : "Unknown error";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

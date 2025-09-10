import { NextResponse } from "next/server";
import { sendEmail, emailTemplates } from "../../../lib/email";
import { sanitizeEmail } from "../../../lib/sanitize";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getClientIP } from "../../../lib/ratelimit";
import { prisma } from "../../../lib/prisma";

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// Signup-specific rate limiting
const signupRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 signups per 15 minutes
  analytics: true,
  prefix: "signup",
});

async function verifyRecaptcha(token?: string): Promise<boolean> {
  if (!process.env.RECAPTCHA_SECRET) {
    console.warn("RECAPTCHA_SECRET not configured");
    return process.env.NODE_ENV === "development"; // Allow in dev
  }

  if (!token) return false;

  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET!,
        response: token,
      }),
    });

    const data = await res.json();
    return Boolean(data.success && data.score && data.score >= 0.3);
  } catch (error) {
    console.error("reCAPTCHA verification failed:", error);
    return false;
  }
}

// Email validation schema
const signupSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .max(254, "Email too long")
    .refine((email) => !email.includes(".."), "Invalid email format")
    .refine((email) => !/[<>'"&]/.test(email), "Invalid characters in email"),
});

export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    // const referer = req.headers.get("referer");
    const allowedOrigins = [
      process.env.NEXTAUTH_URL,
      process.env.VERCEL_URL,
    ].filter(Boolean);

    if (
      origin &&
      !allowedOrigins.some((allowed) => origin.includes(allowed || ""))
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid request origin" },
        { status: 403 }
      );
    }
    // Rate limiting with Upstash
    const clientIP = getClientIP(req);
    const { success: rateLimitSuccess } = await signupRateLimit.limit(clientIP);

    if (!rateLimitSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many signup attempts. Please try again in 15 minutes.",
        },
        { status: 429 }
      );
    }

    // Parse request body
    const ct = req.headers.get("content-type") || "";
    let rawEmail: unknown = null;
    let token: string | null = null;

    if (ct.includes("application/json")) {
      const body = await req.json();
      rawEmail = body.email;
      token = body["g-recaptcha-response"];
    } else {
      const form = await req.formData();
      rawEmail = form.get("email");
      token = form.get("g-recaptcha-response")?.toString() || null;
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmail(rawEmail ?? "");
    const validation = signupSchema.safeParse({ email: sanitizedEmail });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    const existingEarly = await prisma.earlyAccess.findUnique({
      where: { email },
    });
    if (existingUser || existingEarly) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    // Create early-access record (handle unique constraint race)
    try {
      await prisma.earlyAccess.create({
        data: { email, source: "early_access" },
      });
    } catch (err: any) {
      // P2002 = unique constraint violation (concurrent race)
      if (err?.code === "P2002") {
        return NextResponse.json(
          { success: false, error: "Email already registered" },
          { status: 409 }
        );
      }
      throw err;
    }

    // Verify reCAPTCHA
    const recaptchaValid = await verifyRecaptcha(token || undefined);
    if (!recaptchaValid) {
      return NextResponse.json(
        { success: false, error: "reCAPTCHA verification failed" },
        { status: 403 }
      );
    }

    // Send emails (consider using a queue for production)
    try {
      await sendEmail(email, emailTemplates.beta(email));

      const adminTo = process.env.BUSINESS_EMAIL || process.env.EMAIL_FROM;
      if (adminTo) {
        await sendEmail(adminTo, emailTemplates.newSignupNotification(email));
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't expose email errors to client
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    // Optional: Log successful signup (for analytics)
    if (process.env.NODE_ENV !== "production") {
      console.log(`New signup: ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

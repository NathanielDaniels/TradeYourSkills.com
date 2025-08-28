import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailTemplates } from "@/lib/email";
import { createVerificationToken, VerificationType } from "@/lib/verification";
import { emailRateLimit } from "@/lib/ratelimit";
import { sanitizeEmail } from "@/lib/sanitize";
import { NextResponse } from "next/server";
import { z } from "zod";
import { maskEmail } from "@/lib/sanitize";

// Email validation schema
const emailChangeSchema = z.object({
  newEmail: z.string().email({ message: "Please enter a valid email address" }),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: 2 email changes per month
    const { success } = await emailRateLimit.limit(
      `email-change:${session.user.id}`
    );

    if (!success) {
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. You can only change your email 2 times per month.",
          retryAfter: 30 * 24 * 60 * 60 * 1000, // 30 days
        },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await req.json();
    const safeEmail = sanitizeEmail(body.newEmail);
    const { newEmail } = emailChangeSchema.parse({ newEmail: safeEmail });

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, provider: true },
    });

    if (currentUser?.provider !== "credentials") {
      return NextResponse.json(
        { error: "You cannot change your email if you signed in with Google." },
        { status: 403 }
      );
    }

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if new email is the same as current
    if (newEmail.toLowerCase() === currentUser.email?.toLowerCase()) {
      return NextResponse.json(
        { error: "This is already your current email address" },
        { status: 400 }
      );
    }

    // Check if new email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({
        message:
          "If this email can be used, you will receive a verification email shortly.",
        newEmail: newEmail,
        expiresIn: 30,
      });
    }

    console.log(
      "🔍 DEBUG - About to send email change verification to:",
      maskEmail(newEmail)
    );

    // Create verification token using your existing system
    const verificationToken = await createVerificationToken({
      userId: session.user.id,
      email: newEmail, // Send to NEW email address
      type: VerificationType.EMAIL_CHANGE,
      data: {
        newEmail: newEmail,
        oldEmail: currentUser.email,
      },
      expiresInMinutes: 30, // 30 minutes for email changes
    });

    // Send verification email to NEW email address
    const emailResult = await sendEmail(
      newEmail, // Send to NEW email, not old email
      emailTemplates.emailChangeVerification(newEmail, verificationToken.token),
      { userId: session.user.id, action: "email-change-verification" }
    );

    console.log("🔍 DEBUG - Email result:", emailResult);

    if (!emailResult.success) {
      // Clean up the verification token if email fails
      try {
        await prisma.emailVerificationToken.delete({
          where: { token: verificationToken.token },
        });
        console.log(
          "🔍 DEBUG - Cleaned up verification token after email failure"
        );
      } catch (cleanupError) {
        console.error("🔍 DEBUG - Failed to cleanup token:", cleanupError);
      }

      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    // Send security alert to OLD email address
    await sendEmail(
      currentUser.email!,
      emailTemplates.securityAlert(
        "Email change requested",
        req.headers.get("x-forwarded-for") || "unknown",
        new Date()
      ),
      { userId: session.user.id, action: "email-change-security-alert" }
    );

    // Audit log
    const userHash = session.user.id.slice(-8);
    console.log(
      `Email change verification sent: ***${userHash} -> ${maskEmail(newEmail)}`
    );

    return NextResponse.json({
      message: "Verification email sent successfully",
      newEmail: newEmail,
      expiresIn: 30,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Email change request error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

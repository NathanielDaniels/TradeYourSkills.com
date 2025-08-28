import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { verifyToken, logSecurityAction } from "@/lib/verification";
import { prisma } from "@/lib/prisma";
import { getClientIP } from "@/lib/ratelimit";
import * as Sentry from "@sentry/nextjs";

export async function POST(req: Request) {
  const clientIP = getClientIP(req);

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Verify the token
    const verification = await verifyToken(token);
    if (!verification.success) {
      const status = verification.error?.includes("expired") ? 410 : 400;
      return NextResponse.json({ error: verification.error }, { status });
    }

    // Ensure the token belongs to the current user
    if (verification.token?.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Invalid token for current user" },
        { status: 403 }
      );
    }

    // Ensure it's a username change token
    if (verification.token?.type !== "USERNAME_CHANGE") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 400 }
      );
    }

    const newUsername = verification.token.data?.newUsername;
    if (!newUsername) {
      return NextResponse.json(
        { error: "Invalid token data" },
        { status: 400 }
      );
    }

    // Update username with race condition protection
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Check if username is still available
      const existingUser = await tx.user.findUnique({
        where: { username: newUsername },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        throw new Error("Username is no longer available");
      }

      // Update the username
      return tx.user.update({
        where: { id: session.user.id },
        data: { username: newUsername },
        select: { username: true, email: true },
      });
    });

    // Log successful username change
    logSecurityAction(
      session.user.id,
      "username_change_completed",
      {
        newUsername,
        verificationMethod: "email",
      },
      clientIP,
      req.headers.get("user-agent") || undefined
    );

    console.log(
      `Username verified and updated: ***${session.user.id.slice(
        -8
      )} -> ${newUsername}`
    );

    return NextResponse.json({
      success: true,
      username: updatedUser.username,
      message: "Username updated successfully",
    });
  } catch (error) {
    console.error("Username verification error:", error);

    Sentry.captureException(error, {
      tags: {
        area: "username-verification",
        ip: clientIP,
      },
    });

    // Handle specific errors
    if (
      error instanceof Error &&
      error.message === "Username is no longer available"
    ) {
      return NextResponse.json(
        { error: "Username is no longer available" },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

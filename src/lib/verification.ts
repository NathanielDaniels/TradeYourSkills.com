import { prisma } from "./prisma";
import { randomBytes } from "crypto";
import * as Sentry from "@sentry/nextjs";

export enum VerificationType {
  USERNAME_CHANGE = "USERNAME_CHANGE",
  EMAIL_CHANGE = "EMAIL_CHANGE",
  ACCOUNT_VERIFICATION = "ACCOUNT_VERIFICATION",
  PASSWORD_RESET = "PASSWORD_RESET",
}

interface CreateTokenOptions {
  userId: string;
  email: string;
  type: VerificationType;
  data?: any;
  expiresInMinutes?: number;
}

export async function createVerificationToken({
  userId,
  email,
  type,
  data,
  expiresInMinutes = 15,
}: CreateTokenOptions) {
  // Generate secure token
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Store data in identifier as JSON for the existing VerificationToken model
  const identifier = JSON.stringify({ userId, email, type, data });

  // Invalidate existing tokens of the same type for this user
  await prisma.verificationToken.deleteMany({
    where: {
      identifier: {
        contains: `"userId":"${userId}","email":"${email}","type":"${type}"`,
      },
    },
  });

  const verificationToken = await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return verificationToken;
}

export async function verifyToken(token: string) {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
    return { success: false, error: "Invalid verification token" };
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return { success: false, error: "Verification token expired" };
  }

  const tokenData = JSON.parse(verificationToken.identifier);

  // Delete the token (one-time use)
  await prisma.verificationToken.delete({
    where: { token },
  });

  const user = await prisma.user.findUnique({
    where: { id: tokenData.userId },
  });

  return {
    success: true,
    token: { ...verificationToken, ...tokenData },
    user,
  };
}

export async function logSecurityAction(
  userId: string,
  action: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string,
  success: boolean = true
) {
  Sentry.addBreadcrumb({
    message: `Security Action: ${action}`,
    category: "security",
    level: success ? "info" : "warning",
    data: {
      userId: userId.slice(-8), // Partial ID for privacy
      action,
      details,
      ipAddress,
      userAgent,
      success,
      timestamp: new Date().toISOString(),
    },
  });
  // Also capture as event for important security actions
  if (
    !success ||
    action.includes("failed") ||
    action.includes("unauthorized")
  ) {
    Sentry.captureMessage(`Security Alert: ${action}`, {
      level: "warning",
      tags: {
        area: "security",
        action,
        userId: userId.slice(-8),
      },
      extra: {
        details,
        ipAddress,
        userAgent,
        success,
      },
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`🔒 Security Action [${userId.slice(-8)}]: ${action}`, {
      details,
      ipAddress,
      success,
    });
  }
}

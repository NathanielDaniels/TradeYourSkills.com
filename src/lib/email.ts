// src/lib/email.ts
import nodemailer from "nodemailer";
import * as Sentry from "@sentry/nextjs";

// Email service configuration
const getEmailConfig = () => {
  // Parse EMAIL_SERVER env var (works for both dev and production)
  const emailServer = process.env.EMAIL_SERVER;
  const emailFrom =
    process.env.EMAIL_FROM || "TradeMySkills <noreply@trademyskills.com>";

  // Handle missing EMAIL_SERVER in development
  if (!emailServer) {
    const error = new Error("EMAIL_SERVER environment variable is required");
    Sentry.captureException(error, {
      tags: { area: "email-config" },
      level: "error",
    });
    throw error;
  }

  try {
    const url = new URL(emailServer);
    return {
      smtp: {
        host: url.hostname,
        port: parseInt(url.port) || 587,
        secure: false,
        auth: {
          user: decodeURIComponent(url.username),
          pass: decodeURIComponent(url.password),
        },
        tls: { rejectUnauthorized: false },
      },
      from: emailFrom,
      mockMode: false,
    };
  } catch (error) {
    throw new Error(
      `Invalid EMAIL_SERVER format. Expected: smtp://user:pass@host:port`
    );
  }
};

// Create transporter
export const createEmailTransporter = async () => {
  const config = getEmailConfig();

  // Handle mock mode for development
  if (config.mockMode) {
    return {
      transporter: null,
      from: config.from,
      mockMode: true,
    };
  }

  const transporter = nodemailer.createTransport(config.smtp);

  // Verify connection
  try {
    await transporter.verify();

    Sentry.addBreadcrumb({
      message: "Email service connected successfully",
      category: "email",
      level: "info",
      data: { host: config.smtp.host },
    });

    return { transporter, from: config.from, mockMode: false };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        area: "email-connection",
        smtp_host: config.smtp.host,
      },
      level: "error",
    });
    throw new Error(
      `Email service configuration failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Email templates (keeping your existing templates)
export const emailTemplates = {
  usernameChangeVerification: (username: string, token: string) => ({
    subject: "Verify Your Username Change - TradeMySkills",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Username Change</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f8fafc; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            .security-note { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TradeMySkills</h1>
            </div>
            <div class="content">
              <h2>Username Change Request</h2>
              <p>Hello!</p>
              <p>You've requested to change your username to: <strong>@${username}</strong></p>
              <p>To confirm this change, please click the button below:</p>
              <a href="${process.env.NEXTAUTH_URL}/verify/username?token=${token}" class="button">
                Verify Username Change
              </a>
              <div class="security-note">
                <strong>🔒 Security Note:</strong>
                <ul>
                  <li>This link will expire in 15 minutes</li>
                  <li>If you didn't request this change, please ignore this email</li>
                  <li>You can only change your username 2 times per month</li>
                </ul>
              </div>
              <p>If the button doesn't work, copy and paste this link:</p>
              <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">
                ${process.env.NEXTAUTH_URL}/verify/username?token=${token}
              </p>
            </div>
            <div class="footer">
              <p>This email was sent by TradeMySkills. If you have questions, contact our support team.</p>
              <p>© 2025 TradeMySkills. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      TradeMySkills - Username Change Verification
      
      You've requested to change your username to: @${username}
      
      To confirm this change, visit: ${process.env.NEXTAUTH_URL}/verify/username?token=${token}
      
      This link will expire in 15 minutes.
      
      If you didn't request this change, please ignore this email.
    `,
  }),

  emailChangeVerification: (newEmail: string, token: string) => ({
    subject: "Verify Your Email Change - TradeMySkills",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Email Change</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f8fafc; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            .security-note { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>TradeMySkills</h1>
            </div>
            <div class="content">
              <h2>Email Change Request</h2>
              <p>Hello!</p>
              <p>You've requested to change your email address to: <strong>${newEmail}</strong></p>
              <p>To confirm this change, please click the button below:</p>
              <a href="${process.env.NEXTAUTH_URL}/verify/email?token=${token}" class="button">
                Verify Email Change
              </a>
              <div class="security-note">
                <strong>🔒 Security Note:</strong>
                <ul>
                  <li>This link will expire in 30 minutes</li>
                  <li>If you didn't request this change, please secure your account immediately</li>
                  <li>Changing your email will require re-verification</li>
                </ul>
              </div>
              <p>If the button doesn't work, copy and paste this link:</p>
              <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">
                ${process.env.NEXTAUTH_URL}/verify/email?token=${token}
              </p>
            </div>
            <div class="footer">
              <p>This email was sent by TradeMySkills. If you have questions, contact our support team.</p>
              <p>© 2025 TradeMySkills. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      TradeMySkills - Email Change Verification
      
      You've requested to change your email address to: ${newEmail}
      
      To confirm this change, visit: ${process.env.NEXTAUTH_URL}/verify/email?token=${token}
      
      This link will expire in 30 minutes.
      
      If you didn't request this change, please secure your account immediately.
    `,
  }),

  securityAlert: (action: string, ip: string, timestamp: Date) => ({
    subject: "Security Alert - TradeMySkills Account Activity",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Security Alert</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f8fafc; }
            .alert-box { background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 Security Alert</h1>
            </div>
            <div class="content">
              <h2>Account Activity Detected</h2>
              <div class="alert-box">
                <strong>Action:</strong> ${action}<br>
                <strong>Time:</strong> ${timestamp.toLocaleString()}<br>
                <strong>IP Address:</strong> ${ip}
              </div>
              <p>If this was you, no action is needed.</p>
              <p>If this wasn't you, please secure your account immediately by:</p>
              <ul>
                <li>Changing your password</li>
                <li>Reviewing your account settings</li>
                <li>Checking for unauthorized changes</li>
              </ul>
            </div>
            <div class="footer">
              <p>This is an automated security notification from TradeMySkills.</p>
              <p>© 2025 TradeMySkills. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      TradeMySkills - Security Alert
      
      Account Activity Detected:
      Action: ${action}
      Time: ${timestamp.toLocaleString()}
      IP Address: ${ip}
      
      If this wasn't you, please secure your account immediately.
    `,
  }),
};

// Send email function with console logging for development
export async function sendEmail(
  to: string,
  template: { subject: string; html: string; text: string },
  context?: { userId?: string; action?: string }
) {
  const maskedEmail = to.replace(/(.{2})(.*)(@.*)/, "$1***$3");

  try {
    const { transporter, from } = await createEmailTransporter();

    // PRODUCTION: Actually send email via PrivateEmail.com
    const result = await transporter!.sendMail({
      from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    Sentry.addBreadcrumb({
      message: `Email sent successfully: ${template.subject}`,
      category: "email",
      level: "info",
      data: {
        messageId: result.messageId,
        to: maskedEmail,
        subject: template.subject,
        userId: context?.userId || undefined,
        action: context?.action || undefined,
      },
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unknown email error";
    console.error("Email sending failed:", errorMessage);

    Sentry.captureException(error, {
      tags: {
        area: "email-sending",
        emailType: template.subject.includes("Username")
          ? "username-verification"
          : template.subject.includes("Email")
          ? "email-verification"
          : template.subject.includes("Security")
          ? "security-alert"
          : "unknown",
      },
      extra: {
        to: maskedEmail,
        subject: template.subject,
        userId: context?.userId || undefined,
        action: context?.action || undefined,
      },
      level: "error",
    });
    return { success: false, error: errorMessage };
  }
}

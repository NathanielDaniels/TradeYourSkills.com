import nodemailer from "nodemailer";
import * as Sentry from "@sentry/nextjs";
import fs from "fs";
import path from "path";

// Email service configuration
const getEmailConfig = () => {
  const emailServer = process.env.EMAIL_SERVER;
  const emailFrom =
    process.env.EMAIL_FROM || "TradeMySkills <noreply@trademyskills.com>";

  if (!emailServer) {
    const error = new Error("EMAIL_SERVER environment variable is required");
    Sentry.captureException(error, {
      tags: { area: "email-config" },
      level: "error",
    });
    throw error;
  }

  // Parse URL and validate
  let url: URL;
  try {
    url = new URL(emailServer);
  } catch (err) {
    throw new Error(
      `Invalid EMAIL_SERVER format. Expected: smtp://user:pass@host:port`
    );
  }

  const smtp = {
    host: url.hostname,
    port: parseInt(url.port) || 587,
    secure: false,
    auth: {
      user: decodeURIComponent(url.username),
      pass: decodeURIComponent(url.password),
    },
    tls: {
      // default: strict verification unless explicitly disabled for dev
      rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== "false",
    },
  };

  // Safety: never allow disabling TLS verification in production
  if (
    process.env.NODE_ENV === "production" &&
    process.env.EMAIL_TLS_REJECT_UNAUTHORIZED === "false"
  ) {
    throw new Error(
      "EMAIL_TLS_REJECT_UNAUTHORIZED=false is not permitted in production. Re-enable TLS verification."
    );
  }

  return {
    smtp,
    from: emailFrom,
    mockMode: false,
  };
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

// <div style="display:flex;gap:12px;align-items:center;margin-bottom:18px;">
//   <a href="${
//     "https://TradeMySkills.com"
//   }" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;box-shadow:0 6px 18px rgba(37,99,235,0.18);">Visit the site</a>
//   <a href="${
//     "https://TradeMySkills.com"
//   }/how-it-works" style="color:#2563eb;font-size:13px;text-decoration:none;">See how it works →</a>
// </div>

// Email templates (keeping your existing templates)
export const emailTemplates = {
  beta: (email: string) => ({
    subject: "You're In — Welcome to Early Access for TradeMySkills 🎉",
    html: `
      <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#0f172a; padding:24px; background:#f7fafc;">
        <div style="max-width:680px;margin:0 auto;background:linear-gradient(180deg,#ffffff,#fbfdff);border-radius:12px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,0.08);">
          <div style="padding:28px 32px;border-bottom:1px solid rgba(15,23,42,0.06);background:linear-gradient(90deg, rgba(59,130,246,0.06), rgba(99,102,241,0.03));">
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="${
                process.env.NEXT_PUBLIC_SITE_URL ||
                process.env.NEXTAUTH_URL ||
                ""
              }/trade_icon_updated.png"
              alt="TradeMySkills" style="height:40px;width:auto;display:block;border-radius:6px;">
              <img src="cid:tm-logo" alt="TradeMySkills" style="height:40px;width:auto;display:block;border-radius:6px;margin-right:12px;">
              <h1 style="margin:0;font-size:20px;color:#0b1220;">Welcome to TradeMySkills</h1>
            </div>
            <p style="margin:8px 0 0;font-size:13px;color:#475569;">You're on the Early Access list - thanks for joining the movement to trade skills, goods, and services in your neighborhood.</p>
          </div>

          <div style="padding:28px 32px;">
            <h2 style="margin:0 0 12px;font-size:18px;color:#0b1220;">What to expect next</h2>
            <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.5">
              We'll email you when Early Access opens. In the meantime, here's a peek at what TradeMySkills will help you do.
            </p>

            <ul style="margin:0 0 18px;padding-left:18px;color:#334155;font-size:14px;line-height:1.6">
              <li><strong>Create a simple profile</strong> that tells your neighbors what you offer.</li>
              <li><strong>List trades and requests</strong> - swap lessons, handmade goods, and services locally.</li>
              <li><strong>Discover trusted neighbors</strong> using location and short reviews.</li>
            </ul>


            <div style="background:#f1f5f9;border-radius:8px;padding:14px;font-size:13px;color:#0f172a;">
              <strong style="display:block;margin-bottom:6px;">Why TradeMySkills?</strong>
              <p style="margin:0;color:#475569;line-height:1.4">
                Local, low-friction swaps build real value - whether it's guitar lessons for a logo design or a loaf of sourdough for a small woodworking piece. We keep it simple, safe, and community-first.
              </p>
            </div>

            <h3 style="margin:22px 0 8px;font-size:15px;color:#0b1220;">Quick tips to get ready</h3>
            <ol style="margin:0 0 8px;padding-left:18px;color:#334155;font-size:14px;line-height:1.6">
              <li>Think of one clear offering (e.g., “30-min guitar lesson”) and one clear request.</li>
              <li>Use a friendly photo or sample image - listings with images get more interest.</li>
              <li>Keep your location general (neighborhood/city) for safety and discoverability.</li>
            </ol>

            <p style="margin:18px 0 0;color:#64748b;font-size:13px">Thanks again! We can't wait to see what you'll trade. If you have questions or early feedback, reply to this email and we'll read it personally.</p>
          </div>

          <div style="padding:18px 32px;border-top:1px solid rgba(15,23,42,0.04);font-size:12px;color:#94a3b8;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:600;color:#0b1220">TradeMySkills</div>
              <div style="margin-top:6px">Building a better way to trade locally</div>
            </div>
            <div style="text-align:right">
              <div>Need help?</div>
              <div style="margin-top:6px"><a href="mailto:${
                process.env.BUSINESS_EMAIL || process.env.EMAIL_FROM
              }" style="color:#2563eb;text-decoration:none;">Contact us</a></div>
            </div>
          </div>
        </div>

        <p style="max-width:680px;margin:12px auto 0;font-size:11px;color:#94a3b8;text-align:center;">
          You received this because you signed up for Early Access at TradeMySkills. If you no longer want these updates, reply with "unsubscribe" or visit our site to manage preferences.
        </p>
      </div>
    `,
    text: `Welcome to TradeMySkills - Early Access
Thanks for joining the Early Access list (${email}).

What to expect next:
- We'll notify you when Early Access opens.
- Soon you'll be able to create a profile, list offers/requests, and find local neighbors to trade with.

Quick tips:
- Start with one clear offering/request.
- Add a friendly photo.
- Use your neighborhood/city for discoverability.

Visit: "https://TradeMySkills.com"}
Contact: ${process.env.BUSINESS_EMAIL || process.env.EMAIL_FROM}
`,
  }),
  unsubscribeConfirmation: (email: string) => ({
    subject: "You have been unsubscribed — TradeMySkills",
    html: `
      <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#0f172a; padding:24px;">
        <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:10px;padding:24px;box-shadow:0 8px 20px rgba(2,6,23,0.06);">
          <h2 style="margin:0 0 8px;font-size:18px;">You’re unsubscribed</h2>
          <p style="margin:0 0 12px;color:#475569;">We removed <strong>${email}</strong> from the Early Access list. You will no longer receive Early Access updates.</p>
          <p style="margin:0 0 12px;color:#475569;">If that was a mistake, reply with <strong>resubscribe</strong> or visit <a href="https://TradeMySkills.com"
          }" style="color:#2563eb;">TradeMySkills</a>.</p>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:12px;">Thanks — TradeMySkills</p>
        </div>
      </div>
    `,
    text: `You’re unsubscribed from TradeMySkills Early Access (${email}). If this was a mistake, reply "resubscribe" or visit "https://TradeMySkills.com".`,
  }),
  welcome: (email: string) => ({
    subject: "Welcome to TradeMySkills 🎉",
    html: `
      <div style="font-family: system-ui, Arial, sans-serif; color: #0f172a;">
        <h2>Welcome to TradeMySkills</h2>
        <p>Thanks for joining the community. You can now list what you offer and what you're looking for — trade skills, creations, or services with neighbors.</p>
        <p><strong>Quick tips:</strong></p>
        <ul>
          <li>Create a clear title (e.g. "Logo design → Guitar lessons")</li>
          <li>Add location and a short description</li>
          <li>Use photos for handmade items or portfolios</li>
        </ul>
        <p>See you in the community - TradeMySkills</p>
      </div>
    `,
    text: `Welcome to TradeMySkills!
Thanks for joining. Create a listing and start trading skills, creations, or services with neighbors.
 Tip: use clear titles and photos
 Tip: add location to match locally
Visit: ${process.env.NEXTAUTH_URL || "TradeMySkills.com"}`,
  }),
  newSignupNotification: (email: string) => ({
    subject: `New signup: ${email}`,
    html: `<p>New user signed up with email: <strong>${email}</strong></p>`,
    text: `New user signed up: ${email}`,
  }),
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

    // Attach logo as inline CID if file exists
    const logoCid = "tm-logo";
    const logoPath = path.join(
      process.cwd(),
      "public",
      "trade_icon_updated.png"
    );
    const attachments = fs.existsSync(logoPath)
      ? [{ filename: "trade_icon_updated.png", path: logoPath, cid: logoCid }]
      : [];

    // PRODUCTION: Actually send email via PrivateEmail.com
    const result = await transporter!.sendMail({
      from,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
      attachments: attachments.length ? attachments : undefined,
      headers: {
        "List-Unsubscribe": `<mailto:${
          process.env.BUSINESS_EMAIL || process.env.EMAIL_FROM
        }?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
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

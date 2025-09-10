import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { sanitizeEmail } from "../../../../lib/sanitize";
import { sendEmail, emailTemplates } from "../../../../lib/email";

function normalizeInbound(p: any) {
  const from =
    p.From ||
    p.from ||
    p.from_address ||
    p.envelope?.from ||
    p.sender ||
    p.mail?.commonHeaders?.from?.[0] ||
    "";
  const subject =
    p.Subject || p.subject || p.mail?.commonHeaders?.subject || "";
  const text =
    p.TextBody ||
    p.text ||
    p["body-plain"] ||
    p.body ||
    p.content ||
    p.mail?.text ||
    "";
  return { from: String(from), subject: String(subject), text: String(text) };
}

export async function POST(req: Request) {
  const secret = req.headers.get("x-inbound-secret");
  if (
    process.env.INBOUND_WEBHOOK_SECRET &&
    secret !== process.env.INBOUND_WEBHOOK_SECRET
  ) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  const ct = req.headers.get("content-type") || "";
  let payload: any = {};
  try {
    if (ct.includes("application/json")) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      form.forEach((v, k) => (payload[k] = String(v)));
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Invalid payload" },
      { status: 400 }
    );
  }

  const { from: rawFrom, subject, text } = normalizeInbound(payload);
  const match = String(rawFrom).match(/<([^>]+)>/);
  const senderEmail = sanitizeEmail(match ? match[1] : String(rawFrom).trim());
  if (!senderEmail)
    return NextResponse.json(
      { success: false, error: "Missing sender" },
      { status: 400 }
    );

  const body = `${subject} ${text}`.toLowerCase();

  try {
    if (body.includes("unsubscribe")) {
      await prisma.earlyAccess.deleteMany({ where: { email: senderEmail } });
      await sendEmail(
        senderEmail,
        emailTemplates.unsubscribeConfirmation(senderEmail)
      );
      return NextResponse.json({ success: true, action: "unsubscribed" });
    }

    if (body.includes("resubscribe")) {
      await prisma.earlyAccess.upsert({
        where: { email: senderEmail },
        update: {},
        create: { email: senderEmail, source: "inbound-resubscribe" },
      });
      await sendEmail(senderEmail, emailTemplates.beta(senderEmail));
      return NextResponse.json({ success: true, action: "resubscribed" });
    }

    return NextResponse.json({ success: true, action: "no-op" });
  } catch (err) {
    console.error("Inbound handler error:", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

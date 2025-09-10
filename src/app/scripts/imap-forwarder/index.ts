import "dotenv/config.js";
import Imap from "imap";
import { simpleParser } from "mailparser";
import fetch from "node-fetch";
import path from "path";
import fs from "fs";

// Set CA bundle for Windows development
if (process.platform === "win32" && !process.env.NODE_EXTRA_CA_CERTS) {
  const caCertPath = path.join(
    process.env.USERPROFILE || "",
    ".certs",
    "cacert.pem"
  );
  if (fs.existsSync(caCertPath)) {
    process.env.NODE_EXTRA_CA_CERTS = caCertPath;
    console.log(`Using CA bundle: ${caCertPath}`);
  }
}

const {
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  INBOUND_WEBHOOK_URL = "http://localhost:3000/api/email/inbound",
  INBOUND_WEBHOOK_SECRET,
  POLL_INTERVAL_MS = "30000",
  MAX_MESSAGES_PER_POLL = "50",
} = process.env;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  console.error("Set GMAIL_USER and GMAIL_APP_PASSWORD (app password) in env.");
  process.exit(1);
}

const imapConfig = {
  user: GMAIL_USER,
  password: GMAIL_APP_PASSWORD,
  host: "imap.gmail.com",
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: true },
};

function openInbox(imap: Imap, cb: (err?: Error) => void) {
  imap.openBox("INBOX", false, cb);
}

function extractFrom(parsed: any) {
  try {
    if (parsed?.from?.value && parsed.from.value.length > 0) {
      return parsed.from.value[0].address || parsed.from.text || "";
    }
    return parsed.from?.text || "";
  } catch {
    return "";
  }
}

async function forwardMessage(parsed: any, raw: string) {
  const from = extractFrom(parsed);
  const payload = {
    from: from || "",
    subject: parsed.subject || "",
    text: parsed.text || parsed.html || "",
    raw,
  };

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (INBOUND_WEBHOOK_SECRET)
      headers["x-inbound-secret"] = INBOUND_WEBHOOK_SECRET;

    const res = await fetch(INBOUND_WEBHOOK_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        "Forward failed:",
        res.status,
        await res.text().catch(() => "")
      );
    } else {
      console.log("Forwarded:", payload.subject, payload.from);
    }
  } catch (err) {
    console.error("Forward error:", err);
  }
}

function poll() {
  console.log(`${new Date().toISOString()}: Starting IMAP poll...`);

  const imap = new Imap(imapConfig);
  let ended = false;

  imap.once("ready", () => {
    openInbox(imap, (err) => {
      if (err) {
        console.error("Open inbox error:", err);
        imap.end();
        return;
      }

      // search unseen and limit results to avoid huge batches
      imap.search(["UNSEEN"], (err: Error | null, results: number[]) => {
        if (err) {
          console.error("Search error:", err);
          imap.end();
          return;
        }

        if (!results || results.length === 0) {
          console.log("No new messages found");
          imap.end();
          return;
        }

        console.log(`Found ${results.length} new messages`);
        const limited = results.slice(0, Number(MAX_MESSAGES_PER_POLL || 50));
        const f = imap.fetch(limited, { bodies: "", markSeen: true });

        f.on("message", (msg) => {
          let raw = "";
          msg.on("body", (stream) => {
            stream.on("data", (chunk) => (raw += chunk.toString("utf8")));
          });
          msg.once("end", async () => {
            try {
              const parsed = await simpleParser(raw);
              await forwardMessage(parsed, raw);
            } catch (parseErr) {
              console.error("Parse error:", parseErr);
            }
          });
        });

        f.once("error", (fetchErr) => console.error("Fetch error:", fetchErr));
        f.once("end", () => {
          if (!ended) imap.end();
        });
      });
    });
  });

  imap.once("error", (err: Error) => {
    console.error("IMAP error:", err);
  });

  imap.once("end", () => {
    ended = true;
    console.log(
      `Poll completed. Next poll in ${
        Number(POLL_INTERVAL_MS) / 1000
      } seconds...`
    );
    setTimeout(poll, Number(POLL_INTERVAL_MS));
  });

  // graceful shutdown
  const shutdown = () => {
    console.log("Graceful shutdown initiated...");
    try {
      imap.end();
    } catch (e) {}
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  try {
    imap.connect();
  } catch (err) {
    console.error("IMAP connect error:", err);
    console.log(`Retrying in ${Number(POLL_INTERVAL_MS) / 1000} seconds...`);
    setTimeout(poll, Number(POLL_INTERVAL_MS));
  }
}

// Start the continuous polling
console.log("Starting IMAP forwarder...");
console.log(
  `Polling Gmail (${GMAIL_USER}) every ${
    Number(POLL_INTERVAL_MS) / 1000
  } seconds`
);
console.log(`Webhook URL: ${INBOUND_WEBHOOK_URL}`);
poll();

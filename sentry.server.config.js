// "use strict";
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c14b90494c25d10f59ebf850fbc56c5c@o4509826524577792.ingest.us.sentry.io/4509826602041344",
  tracesSampleRate: 1,
  enableLogs: true,
  debug: false,
});

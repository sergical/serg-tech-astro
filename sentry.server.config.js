import * as Sentry from "@sentry/astro";

Sentry.init({
  dsn: "https://7a826202533fe83524393296b14dbf41@o4505994951065600.ingest.us.sentry.io/4510002828410880",
  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/astro/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  // Enable logs to be sent to Sentry
  enableLogs: true,
  // Define how likely traces are sampled. Adjust this value in production,
  // or use tracesSampler for greater control.
  tracesSampleRate: 1.0,
});
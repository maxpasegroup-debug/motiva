let initialized = false;
let sentryModulePromise: Promise<typeof import("@sentry/nextjs")> | null = null;

function loadSentry() {
  if (!sentryModulePromise) {
    sentryModulePromise = import("@sentry/nextjs");
  }
  return sentryModulePromise;
}

async function ensureSentry() {
  if (initialized) {
    return null;
  }

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    initialized = true;
    return null;
  }

  const Sentry = await loadSentry();
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: true,
  });
  initialized = true;
  return Sentry;
}

export async function captureException(
  error: unknown,
  context?: Record<string, unknown>,
) {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    console.error("[captureException]", context ?? {}, error);
    return;
  }

  const Sentry = (await ensureSentry()) ?? (await loadSentry());
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

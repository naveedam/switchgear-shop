/**
 * Error tracking (Sentry) and product analytics (PostHog).
 * Both are off unless their env vars are set, and both load lazily after the
 * page is interactive so they never slow down the first paint.
 *
 *   VITE_SENTRY_DSN        https://...@o0.ingest.sentry.io/0
 *   VITE_POSTHOG_KEY       phc_...
 *   VITE_POSTHOG_HOST      https://eu.i.posthog.com  (or us.i.posthog.com)
 */

type Props = Record<string, string | number | boolean | null | undefined>;

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || "https://eu.i.posthog.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentry: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let posthog: any = null;
const queue: [string, Props | undefined][] = [];

const idle = (fn: () => void) =>
  "requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500);

export function initMonitoring() {
  if (!import.meta.env.PROD) return;
  idle(async () => {
    if (SENTRY_DSN) {
      const S = await import("@sentry/react");
      S.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.VITE_VERCEL_ENV || "production",
        tracesSampleRate: 0.1,
        // Never send typed values (GSTIN, bank details, UTRs) to Sentry.
        sendDefaultPii: false,
        ignoreErrors: ["ResizeObserver loop", "Failed to fetch dynamically imported module", "Load failed"],
      });
      sentry = S;
    }
    if (POSTHOG_KEY) {
      const { default: ph } = await import("posthog-js");
      ph.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        mask_all_text: false,
        session_recording: { maskAllInputs: true },
      });
      posthog = ph;
      queue.splice(0).forEach(([e, p]) => ph.capture(e, p));
    }
  });
}

/** Funnel events. Keep names stable: they become PostHog insights. */
export type FunnelEvent =
  | "bom_uploaded"
  | "instant_quote_shown"
  | "instant_quote_added_to_cart"
  | "rfq_created"
  | "checkout_started"
  | "order_placed"
  | "payment_succeeded"
  | "payment_failed";

export function track(event: FunnelEvent, props?: Props) {
  if (posthog) posthog.capture(event, props);
  else if (POSTHOG_KEY && queue.length < 50) queue.push([event, props]);
}

export function identify(user: { id: string; role?: string | null } | null) {
  if (user) {
    posthog?.identify(user.id, { role: user.role ?? undefined });
    sentry?.setUser({ id: user.id });
  } else {
    posthog?.reset();
    sentry?.setUser(null);
  }
}

export function reportError(err: unknown, context?: Props) {
  if (sentry) sentry.captureException(err, { extra: context });
  else console.error(err, context);
}

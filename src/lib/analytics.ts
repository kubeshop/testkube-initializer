import posthog from "posthog-js";

import { APP_VERSION } from "./defaults";

let enabled = false;

/** Safe properties only — never send license keys, DSNs, emails, or YAML. */
export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

export function initAnalytics(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  const host = import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com";
  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    person_profiles: "identified_only",
  });
  enabled = true;
  captureEvent("wizard_opened");
}

export function captureEvent(name: string, props?: AnalyticsProps): void {
  if (!enabled) return;
  posthog.capture(name, { app_version: APP_VERSION, ...props });
}

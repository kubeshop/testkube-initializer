import posthog from "posthog-js";

import { APP_VERSION } from "./defaults";

let enabled = false;
let wizardOpenedAt: number | null = null;

export function wizardSessionSeconds(): number | undefined {
  if (wizardOpenedAt === null) return undefined;
  return Math.round((Date.now() - wizardOpenedAt) / 1000);
}

/**
 * Safe event properties only — never send license keys, DSNs, emails, or YAML
 * on capture(). Person identity uses Admin Email via identifyUser().
 */
export type AnalyticsProps = Record<string, string | number | boolean | undefined>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  wizardOpenedAt = Date.now();
  captureEvent("wizard_opened");
}

/**
 * Link anonymous wizard activity to the Admin Email person in PostHog.
 * No-op until the address looks valid. Company is stored as a person property.
 */
export function identifyUser(email: string, props?: { company?: string }): void {
  if (!enabled) return;
  const distinctId = email.trim().toLowerCase();
  if (!EMAIL_RE.test(distinctId)) return;

  const person: Record<string, string> = { email: distinctId };
  const company = props?.company?.trim();
  if (company) person.company = company;

  posthog.identify(distinctId, person);
}

export function captureEvent(name: string, props?: AnalyticsProps): void {
  if (!enabled) return;
  posthog.capture(name, { app_version: APP_VERSION, ...props });
}

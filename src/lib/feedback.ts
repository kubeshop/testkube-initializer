import type { TestkubeConfig } from "../types/config";

export type FeedbackRating = "yes" | "no";

export interface FeedbackPayload {
  helpful: boolean;
  rating: FeedbackRating;
  comment: string;
  envType: string;
  appVersion: string;
  timestamp: string;
}

export async function submitFeedback(
  config: TestkubeConfig,
  rating: FeedbackRating,
  comment: string,
  appVersion: string
): Promise<void> {
  const payload: FeedbackPayload = {
    helpful: rating === "yes",
    rating,
    comment: comment.trim(),
    envType: config.initial.envType,
    appVersion,
    timestamp: new Date().toISOString(),
  };

  const url = import.meta.env.VITE_FEEDBACK_WEBHOOK_URL;
  if (url) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Feedback submission failed (${res.status})`);
    }
    return;
  }

  // No webhook configured — persist locally so feedback is not lost during dev.
  try {
    const key = "testkube-initializer-feedback";
    const prev = JSON.parse(localStorage.getItem(key) ?? "[]") as FeedbackPayload[];
    prev.push(payload);
    localStorage.setItem(key, JSON.stringify(prev.slice(-20)));
  } catch {
    // ignore storage errors
  }
}

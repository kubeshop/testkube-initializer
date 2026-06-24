import { useEffect, useRef, useState } from "react";
import { captureEvent } from "../lib/analytics";
import { APP_VERSION } from "../lib/defaults";
import { submitFeedback, type FeedbackRating } from "../lib/feedback";
import type { TestkubeConfig } from "../types/config";

type Phase = "form" | "thanks" | "error";

export default function FeedbackModal({
  open,
  onClose,
  onSkip,
  config,
}: {
  open: boolean;
  onClose: () => void;
  onSkip?: () => void;
  config: TestkubeConfig;
}) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const dismiss = (skipped: boolean) => {
    if (skipped && phaseRef.current === "form") onSkip?.();
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    setRating(null);
    setComment("");
    setPhase("form");
    setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    try {
      await submitFeedback(config, rating, comment, APP_VERSION);
      captureEvent("feedback_submitted", {
        env_type: config.initial.envType,
        helpful: rating === "yes",
      });
      setPhase("thanks");
    } catch {
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) dismiss(true);
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="relative w-full max-w-md rounded-tk border border-white/10 bg-tk-ink/95 p-6 shadow-panel backdrop-blur-xl"
      >
        {phase === "form" && (
          <>
            <h2 id="feedback-title" className="text-lg font-extrabold text-white">
              Quick feedback
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Was the Testkube Initializer useful for generating your{" "}
              <span className="font-semibold text-tk-pink">values.yaml</span>?
            </p>

            <div className="mt-5 inline-flex w-full gap-2 rounded-tk-md border border-white/10 bg-black/30 p-1">
              {(
                [
                  { value: "yes" as const, label: "Yes, helpful" },
                  { value: "no" as const, label: "Not really" },
                ] as const
              ).map((o) => {
                const active = rating === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setRating(o.value)}
                    className={
                      "flex-1 rounded-[0.45rem] px-3 py-2.5 text-sm font-semibold transition " +
                      (active
                        ? "bg-tk-yellow text-tk-ink shadow-sm"
                        : "text-white/70 hover:bg-white/10")
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-semibold text-white">
                Anything we could improve?{" "}
                <span className="font-normal text-tk-purple-200/70">(optional)</span>
              </span>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Missing options, confusing steps, deployment issues…"
                className="w-full resize-y rounded-tk-md border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-tk-purple-400/80 focus:ring-2 focus:ring-tk-purple-500/30"
              />
            </label>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => dismiss(true)}
                className="tk-btn-outline"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!rating || submitting}
                className="tk-btn-demo"
              >
                {submitting ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </>
        )}

        {phase === "thanks" && (
          <div className="text-center">
            <p className="text-3xl" aria-hidden>
              ✓
            </p>
            <h2 className="mt-2 text-lg font-extrabold text-white">Thank you!</h2>
            <p className="mt-2 text-sm text-tk-purple-200/90">
              Your feedback helps us improve the initializer.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-full bg-white/10 px-5 py-2 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="text-center">
            <h2 className="text-lg font-extrabold text-tk-error">Could not send feedback</h2>
            <p className="mt-2 text-sm text-tk-purple-200/90">
              Please try again in a moment or use Skip to continue.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="tk-btn-outline"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setPhase("form")}
                className="tk-btn-demo"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { captureEvent } from "../lib/analytics";
import { generateYaml } from "../lib/yaml";
import { validate } from "../lib/validation";
import type { TestkubeConfig } from "../types/config";

// Always-visible live preview of the generated values.yaml, pinned to the
// bottom of the screen and updated as the wizard configuration changes.
export default function PreviewDrawer({
  config,
  open,
  onToggle,
  validateActive = false,
  onDownloadYaml,
}: {
  config: TestkubeConfig;
  open: boolean;
  onToggle: () => void;
  validateActive?: boolean;
  onDownloadYaml: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const yaml = useMemo(() => generateYaml(config), [config]);
  const lines = yaml.split("\n").length;
  const realErrors = useMemo(() => validate(config).errors.length, [config]);
  const badgeCount = validateActive ? realErrors : 0;

  const copy = async () => {
    await navigator.clipboard.writeText(yaml);
    captureEvent("yaml_copied", { env_type: config.initial.envType });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close YAML preview"
          onClick={onToggle}
          className="fixed inset-0 z-20 bg-black/80 backdrop-blur-sm"
        />
      )}
      <div
        className={
          "fixed bottom-0 left-0 right-0 z-30 border-t border-tk-purple-200/15 bg-tk-purple-900/95 backdrop-blur-xl " +
          (open
            ? "shadow-[0_-16px_48px_rgba(0,0,0,0.65)]"
            : "shadow-[0_-8px_32px_rgba(0,0,0,0.5)]")
        }
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-6 py-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2 text-sm font-bold text-white"
          >
            <span className="text-white/50">{open ? "▾" : "▸"}</span>
            Live <span className="text-tk-pink">values.yaml</span>
            <span className="rounded-full border border-tk-purple-200/20 bg-tk-surface/60 px-2 py-0.5 text-xs font-semibold text-tk-purple-200/80">
              {lines} lines
            </span>
            {badgeCount > 0 && (
              <span className="rounded-full bg-tk-error px-2 py-0.5 text-xs font-bold text-white">
                {badgeCount} error{badgeCount > 1 ? "s" : ""}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copy} className="tk-btn-outline px-3 py-1 text-xs">
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={onDownloadYaml}
              disabled={realErrors > 0}
              title={realErrors > 0 ? `Resolve ${realErrors} error(s) to download` : undefined}
              className="tk-btn-demo px-3 py-1 text-xs"
            >
              Download
            </button>
          </div>
        </div>
        {open && (
          <div className="mx-auto max-w-[1200px] px-6 pb-4">
            <pre className="max-h-[min(50vh,420px)] overflow-auto rounded-tk-md border border-tk-purple-200/20 bg-tk-sidebar/90 p-3 text-xs leading-relaxed text-tk-purple-200/90">
              <code>{yaml}</code>
            </pre>
          </div>
        )}
      </div>
    </>
  );
}

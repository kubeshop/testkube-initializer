import { useMemo, useState } from "react";
import { downloadYaml, generateYaml } from "../lib/yaml";
import { validate } from "../lib/validation";
import type { TestkubeConfig } from "../types/config";

// Always-visible live preview of the generated values.yaml, pinned to the
// bottom of the screen and updated as the wizard configuration changes.
export default function PreviewDrawer({
  config,
  open,
  onToggle,
}: {
  config: TestkubeConfig;
  open: boolean;
  onToggle: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const yaml = useMemo(() => generateYaml(config), [config]);
  const lines = yaml.split("\n").length;
  const errorCount = useMemo(() => validate(config).errors.length, [config]);

  const copy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-t border-tk-purple-600/50 bg-tk-purple-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-6 py-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-sm font-bold text-tk-purple-100"
        >
          <span className="text-tk-purple-200">{open ? "▾" : "▸"}</span>
          Live <span className="text-tk-pink">values.yaml</span>
          <span className="rounded-full bg-tk-purple-600/60 px-2 py-0.5 text-xs font-semibold text-tk-purple-100">
            {lines} lines
          </span>
          {errorCount > 0 && (
            <span className="rounded-full bg-tk-error px-2 py-0.5 text-xs font-bold text-white">
              {errorCount} error{errorCount > 1 ? "s" : ""}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-full border border-tk-purple-400 px-3 py-1 text-xs font-semibold text-tk-purple-200 transition hover:bg-tk-purple-500/20"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => downloadYaml(config)}
            disabled={errorCount > 0}
            title={errorCount > 0 ? `Resolve ${errorCount} error(s) to download` : undefined}
            className="rounded-full bg-tk-yellow px-3 py-1 text-xs font-bold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download
          </button>
        </div>
      </div>
      {open && (
        <div className="mx-auto max-w-[1200px] px-6 pb-3">
          <pre className="max-h-[260px] overflow-auto rounded-tk-md border border-tk-purple-600/60 bg-tk-purple-900 p-3 text-xs leading-relaxed text-tk-purple-100">
            <code>{yaml}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

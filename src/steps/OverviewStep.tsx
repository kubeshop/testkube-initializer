import { useMemo, useState } from "react";
import { Card } from "../components/ui";
import { isEnterprise } from "../types/config";
import {
  detectPlaintextSecrets,
  downloadSecrets,
  generateYaml,
  referencedSecrets,
} from "../lib/yaml";
import { validate } from "../lib/validation";
import { STEPS } from "../lib/steps";
import type { StepProps } from "./types";

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-tk-purple-600/40 py-2 text-sm">
      <span className="text-tk-purple-200/80">{label}</span>
      <span className="font-semibold text-white">{value || "—"}</span>
    </div>
  );
}

export default function OverviewStep({ config, goToStep, onDownloadYaml }: StepProps) {
  const [copied, setCopied] = useState(false);
  const yaml = useMemo(() => generateYaml(config), [config]);
  const enterprise = isEnterprise(config.initial.envType);
  const plaintext = useMemo(() => detectPlaintextSecrets(config), [config]);
  const secrets = useMemo(() => referencedSecrets(config), [config]);
  const { errors, warnings } = useMemo(() => validate(config), [config]);

  const copy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const IssueList = ({
    items,
    tone,
    title,
  }: {
    items: { id: string; step: number; message: string }[];
    tone: "error" | "warning";
    title: string;
  }) => (
    <div
      className={
        "rounded-tk border p-4 " +
        (tone === "error"
          ? "border-tk-error/50 bg-tk-error/10"
          : "border-tk-warning/50 bg-tk-warning/10")
      }
    >
      <h3
        className={
          "text-sm font-bold " +
          (tone === "error" ? "text-tk-error" : "text-tk-warning")
        }
      >
        {tone === "error" ? "✕" : "⚠"} {items.length} {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-xs text-tk-purple-100/90">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-3">
            <span>{it.message}</span>
            {goToStep && (
              <button
                type="button"
                onClick={() => goToStep(it.step)}
                className="tk-btn-outline flex-shrink-0 px-2.5 py-0.5 text-[11px]"
              >
                {STEPS[it.step].title} →
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-5">
      {errors.length > 0 && (
        <IssueList items={errors} tone="error" title="error(s) — fix before exporting" />
      )}
      {warnings.length > 0 && (
        <IssueList items={warnings} tone="warning" title="warning(s)" />
      )}

      {plaintext.length > 0 && (
        <div className="rounded-tk border border-tk-warning/50 bg-tk-warning/10 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-tk-warning">
            ⚠ {plaintext.length} plaintext secret
            {plaintext.length > 1 ? "s" : ""} in values.yaml
          </h3>
          <ul className="mt-2 space-y-1 text-xs text-tk-purple-100/90">
            {plaintext.map((s) => (
              <li key={s.label}>
                <span className="font-semibold">{s.label}</span> — {s.hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {secrets.length > 0 && (
        <Card title="Referenced Kubernetes Secrets">
          <p className="text-sm text-tk-purple-200/80">
            Your values reference {secrets.length} existing Secret
            {secrets.length > 1 ? "s" : ""}:{" "}
            {secrets.map((s) => (
              <code key={s.name} className="mr-2 text-tk-pink">
                {s.name}
              </code>
            ))}
            . Create them before installing — download a skeleton to fill in.
          </p>
          <div>
            <button
              type="button"
              onClick={() => downloadSecrets(config)}
              className="tk-btn-outline px-4 py-1.5 text-sm"
            >
              Download secrets.yaml template
            </button>
          </div>
        </Card>
      )}

      <Card title="Summary">
        <div className="grid gap-x-8 sm:grid-cols-2">
          <Summary label="Company" value={config.initial.companyName} />
          <Summary label="Admin email" value={config.initial.adminEmail} />
          <Summary
            label="Flavor"
            value={enterprise ? `Enterprise (${config.initial.envType})` : "OSS"}
          />
          <Summary label="Kubernetes" value={config.initial.kubernetesType} />
          <Summary
            label="Database"
            value={`${config.database.type}${config.database.external ? " (external)" : ""}`}
          />
          <Summary
            label="Artifacts"
            value={`${config.artifacts.type}${config.artifacts.external ? " (external)" : ""}`}
          />
          <Summary label="NATS" value={config.nats.embedded ? "embedded" : "external"} />
          <Summary label="Domain" value={config.endpoints.domain} />
        </div>
      </Card>

      <Card title="Generated values.yaml">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-full border border-tk-purple-500 px-4 py-1.5 text-sm font-semibold text-tk-purple-200 transition hover:bg-tk-purple-500/20"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onDownloadYaml}
            disabled={errors.length > 0 || !onDownloadYaml}
            title={errors.length > 0 ? `Resolve ${errors.length} error(s) to download` : undefined}
            className="rounded-full bg-tk-yellow px-4 py-1.5 text-sm font-bold text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download
          </button>
        </div>
        <pre className="max-h-[420px] overflow-auto rounded-tk-md border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-white/85">
          <code>{yaml}</code>
        </pre>
        <p className="text-xs text-tk-purple-200/70">
          Install with:{" "}
          <code className="text-tk-pink">
            helm upgrade --install testkube {enterprise ? "testkube/testkube-enterprise" : "testkube/testkube"} -f values.yaml
          </code>
        </p>
      </Card>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Card } from "../components/ui";
import { isEnterprise } from "../types/config";
import { downloadYaml, generateYaml } from "../lib/yaml";
import type { StepProps } from "./types";

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-tk-purple-600/40 py-2 text-sm">
      <span className="text-tk-purple-200/80">{label}</span>
      <span className="font-semibold text-white">{value || "—"}</span>
    </div>
  );
}

export default function OverviewStep({ config }: StepProps) {
  const [copied, setCopied] = useState(false);
  const yaml = useMemo(() => generateYaml(config), [config]);
  const enterprise = isEnterprise(config.initial.envType);

  const copy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
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
            className="rounded-full border border-tk-purple-400 px-4 py-1.5 text-sm font-semibold text-tk-purple-200 transition hover:bg-tk-purple-500/20"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => downloadYaml(config)}
            className="rounded-full bg-tk-yellow px-4 py-1.5 text-sm font-bold text-black transition hover:brightness-95"
          >
            Download
          </button>
        </div>
        <pre className="max-h-[420px] overflow-auto rounded-tk-md border border-tk-purple-600/60 bg-tk-purple-900 p-4 text-xs leading-relaxed text-tk-purple-100">
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

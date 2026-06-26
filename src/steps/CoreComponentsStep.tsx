import { Card, Toggle } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import { captureEvent } from "../lib/analytics";
import { applyHaPreset } from "../lib/presets";
import { isEnterprise } from "../types/config";
import type { StepProps } from "./types";

export default function CoreComponentsStep({ config, update, setAdvanced }: StepProps) {
  const c = config.core;
  const enterprise = isEnterprise(config.initial.envType);
  return (
    <div className="space-y-4">
      <Card title="Core Components">
        {!enterprise && (
          <p className="mb-4 rounded-tk border border-tk-border bg-tk-slate-800/50 px-4 py-3 text-sm text-tk-slate-300">
            OSS deploys the agent (API) and optional dashboard. Worker Service and AI
            are <strong className="text-white">Enterprise-only</strong> components.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Dashboard"
            description="Web UI for managing tests and results."
            help="Deploy the Testkube web dashboard for browsing tests, results and artifacts."
            checked={c.dashboard}
            onChange={(v) => update("core", { dashboard: v })}
          />
          <Toggle
            label="API"
            description="Control-plane backend service."
            help="The control-plane backend that orchestrates executions and serves the REST/gRPC API. Required for a functional install."
            checked={c.api}
            onChange={(v) => update("core", { api: v })}
          />
          {enterprise && (
            <Toggle
              label="Worker Service"
              description="Runs scheduled and async workloads."
              help="Background worker that runs scheduled and asynchronous workloads (Enterprise)."
              checked={c.workerService}
              onChange={(v) => update("core", { workerService: v })}
            />
          )}
          {enterprise && (
            <Toggle
              label="AI"
              description="AI failure analysis & remediation."
              help="Enable the AI service for automated failure analysis and remediation suggestions."
              checked={c.ai}
              onChange={(v) => update("core", { ai: v })}
            />
          )}
        </div>
      </Card>

      <Card title="High availability">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            Apply an HA baseline: PodDisruptionBudgets, 2 replicas for stateless
            components, and pod anti-affinity. You can fine-tune it in the
            Customize panels below.
          </p>
          <button
            type="button"
            onClick={() => {
              applyHaPreset(config, setAdvanced);
              captureEvent("ha_preset_applied", { env_type: config.initial.envType });
            }}
            className="tk-btn-primary flex-shrink-0 px-4 py-2"
          >
            Apply HA preset
          </button>
        </div>
      </Card>

      <CustomizePanel stepId="core" config={config} setAdvanced={setAdvanced} />
    </div>
  );
}

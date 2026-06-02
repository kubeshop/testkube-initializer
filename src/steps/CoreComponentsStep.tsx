import { Card, Toggle } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import type { StepProps } from "./types";

export default function CoreComponentsStep({ config, update, setAdvanced }: StepProps) {
  const c = config.core;
  return (
    <div className="space-y-5">
      <Card title="Core Components">
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
          <Toggle
            label="Worker Service"
            description="Runs scheduled and async workloads."
            help="Background worker that runs scheduled and asynchronous workloads (Enterprise)."
            checked={c.workerService}
            onChange={(v) => update("core", { workerService: v })}
          />
          <Toggle
            label="AI"
            description="AI failure analysis & remediation."
            help="Enable the AI service for automated failure analysis and remediation suggestions."
            checked={c.ai}
            onChange={(v) => update("core", { ai: v })}
          />
        </div>
      </Card>

      <CustomizePanel stepId="core" config={config} setAdvanced={setAdvanced} />
    </div>
  );
}

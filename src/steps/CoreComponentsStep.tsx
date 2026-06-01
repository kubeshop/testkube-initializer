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
            checked={c.dashboard}
            onChange={(v) => update("core", { dashboard: v })}
          />
          <Toggle
            label="API"
            description="Control-plane backend service."
            checked={c.api}
            onChange={(v) => update("core", { api: v })}
          />
          <Toggle
            label="Worker Service"
            description="Runs scheduled and async workloads."
            checked={c.workerService}
            onChange={(v) => update("core", { workerService: v })}
          />
          <Toggle
            label="AI"
            description="AI failure analysis & remediation."
            checked={c.ai}
            onChange={(v) => update("core", { ai: v })}
          />
        </div>
      </Card>

      <CustomizePanel stepId="core" config={config} setAdvanced={setAdvanced} />
    </div>
  );
}

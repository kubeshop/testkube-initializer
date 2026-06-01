import { Card, Field, ResourceEditor, TextInput, Toggle } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import type { StepProps } from "./types";

export default function NatsStep({ config, update, setAdvanced }: StepProps) {
  const c = config.nats;
  return (
    <div className="space-y-5">
      <Card title="NATS">
        <Toggle
          label="Deploy embedded NATS"
          description="Disable to connect to an existing external NATS cluster."
          checked={c.embedded}
          onChange={(v) => update("nats", { embedded: v })}
        />
        {!c.embedded && (
          <Field label="External NATS URI">
            <TextInput
              placeholder="nats://nats.example.com:4222"
              value={c.uri}
              onChange={(e) => update("nats", { uri: e.target.value })}
            />
          </Field>
        )}
      </Card>

      {c.embedded && (
        <Card title="JetStream & persistence">
          <Toggle
            label="Enable JetStream"
            description="Persistent streaming layer for events."
            checked={c.jetstreamEnabled}
            onChange={(v) => update("nats", { jetstreamEnabled: v })}
          />
          <Toggle
            label="Persistent storage (PVC)"
            checked={c.persistent}
            onChange={(v) => update("nats", { persistent: v })}
          />
          {c.persistent && (
            <Field label="Storage size">
              <TextInput
                value={c.storageSize}
                onChange={(e) => update("nats", { storageSize: e.target.value })}
              />
            </Field>
          )}
          <Field label="Resources" hint="Requests / limits for the NATS pods.">
            <ResourceEditor
              value={c.resources}
              onChange={(patch) =>
                update("nats", { resources: { ...c.resources, ...patch } })
              }
            />
          </Field>
        </Card>
      )}

      <CustomizePanel stepId="nats" config={config} setAdvanced={setAdvanced} />
    </div>
  );
}

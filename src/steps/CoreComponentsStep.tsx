import { Card, Field, SegmentedControl, TextInput, Toggle } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import { captureEvent } from "../lib/analytics";
import { applyHaPreset } from "../lib/presets";
import { AI_PROVIDER_PRESETS, aiProviderPatch } from "../lib/aiPresets";
import { isEnterprise } from "../types/config";
import type {
  AiCredentialSource,
  AiPostgresMode,
  AiProviderPreset,
} from "../types/config";
import type { StepProps } from "./types";

export default function CoreComponentsStep({ config, update, setAdvanced }: StepProps) {
  const c = config.core;
  const ai = config.ai;
  const enterprise = isEnterprise(config.initial.envType);
  const providerPreset = AI_PROVIDER_PRESETS[ai.provider];
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
              help="Enable the AI service for automated failure analysis and remediation suggestions. Requires an LLM endpoint and a PostgreSQL backing store."
              checked={c.ai}
              onChange={(v) => update("core", { ai: v })}
            />
          )}
        </div>
      </Card>

      {enterprise && c.ai && (
        <>
          <Card title="AI — LLM inference">
            <p className="rounded-tk border border-tk-border bg-tk-slate-800/50 px-4 py-3 text-sm text-tk-slate-300">
              Configures the AI service <code className="text-tk-link">inference</code> schema
              (chart 2.10+). Point it at any OpenAI-compatible endpoint.
            </p>
            <Field
              label="Provider"
              help="Preset that prefills the base URL and default model names. Pick Custom for self-hosted / proxied LLMs."
            >
              <SegmentedControl<AiProviderPreset>
                value={ai.provider}
                onChange={(v) => update("ai", aiProviderPatch(v))}
                options={[
                  { value: "openai", label: "OpenAI" },
                  { value: "azure-openai", label: "Azure OpenAI" },
                  { value: "custom", label: "Custom" },
                ]}
              />
            </Field>
            <Field
              label="Base URL"
              hint={providerPreset.hint}
              help="inference.defaults.url — base URL of the OpenAI-compatible LLM API. Leave empty for the public OpenAI API."
              helpPath="testkube-ai-service.inference.defaults.url"
            >
              <TextInput
                placeholder={providerPreset.baseUrl || "https://api.openai.com/v1"}
                value={ai.baseUrl}
                onChange={(e) => update("ai", { baseUrl: e.target.value })}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Agent model"
                help="inference.agent — main reasoning model used by the assistant."
                helpPath="testkube-ai-service.inference.agent"
              >
                <TextInput
                  placeholder="gpt-4o"
                  value={ai.agentModel}
                  onChange={(e) => update("ai", { agentModel: e.target.value })}
                />
              </Field>
              <Field
                label="Tasks model"
                hint="Optional — lightweight tasks."
                help="inference.tasks.model — lightweight model for titles/classification. Leave empty to reuse the agent model."
                helpPath="testkube-ai-service.inference.tasks.model"
              >
                <TextInput
                  placeholder="gpt-4o-mini"
                  value={ai.tasksModel}
                  onChange={(e) => update("ai", { tasksModel: e.target.value })}
                />
              </Field>
              <Field
                label="Embeddings model"
                hint="Optional — vector search."
                help="inference.embeddings.model — embeddings model for vector search. Leave empty to disable embeddings."
                helpPath="testkube-ai-service.inference.embeddings.model"
              >
                <TextInput
                  placeholder="text-embedding-3-small"
                  value={ai.embeddingsModel}
                  onChange={(e) => update("ai", { embeddingsModel: e.target.value })}
                />
              </Field>
            </div>
            <Field
              label="API key source"
              help="Inline writes the key into values.yaml; Existing Secret references a pre-created Kubernetes Secret (recommended)."
            >
              <SegmentedControl<AiCredentialSource>
                value={ai.credentialSource}
                onChange={(v) => update("ai", { credentialSource: v })}
                options={[
                  { value: "secret", label: "Existing Secret" },
                  { value: "inline", label: "Inline" },
                ]}
              />
            </Field>
            {ai.credentialSource === "inline" ? (
              <Field
                label="API key"
                help="inference.defaults.apiKey — written verbatim into values.yaml."
                helpPath="testkube-ai-service.inference.defaults.apiKey"
              >
                <TextInput
                  type="password"
                  placeholder="sk-…"
                  value={ai.apiKey}
                  onChange={(e) => update("ai", { apiKey: e.target.value })}
                />
              </Field>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Secret name"
                  help="inference.defaults.secretRef — existing Kubernetes Secret holding the API key."
                  helpPath="testkube-ai-service.inference.defaults.secretRef"
                >
                  <TextInput
                    placeholder="testkube-ai-llm"
                    value={ai.apiKeySecretRef}
                    onChange={(e) => update("ai", { apiKeySecretRef: e.target.value })}
                  />
                </Field>
                <Field
                  label="Secret key"
                  help="inference.defaults.secretRefKey — key inside the Secret that holds the API key."
                  helpPath="testkube-ai-service.inference.defaults.secretRefKey"
                >
                  <TextInput
                    placeholder="apiKey"
                    value={ai.apiKeySecretKey}
                    onChange={(e) => update("ai", { apiKeySecretKey: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </Card>

          <Card title="AI — PostgreSQL">
            <p className="rounded-tk border border-tk-border bg-tk-slate-800/50 px-4 py-3 text-sm text-tk-slate-300">
              The AI service stores its state in PostgreSQL. Deploy the bundled database or
              point it at an external one.
            </p>
            <Field
              label="Backing store"
              help="In-cluster deploys the bundled PostgreSQL subchart and enables global.postgres. External reuses your own PostgreSQL via a DSN."
            >
              <SegmentedControl<AiPostgresMode>
                value={ai.postgresMode}
                onChange={(v) => update("ai", { postgresMode: v })}
                options={[
                  { value: "in-cluster", label: "In-cluster" },
                  { value: "external", label: "External" },
                ]}
              />
            </Field>
            {ai.postgresMode === "external" && (
              <>
                <Field
                  label="Connection DSN"
                  hint="Leave empty if you reference a Secret below."
                  help="global.postgres.dsn — full PostgreSQL connection URI used by the control plane and AI service."
                  helpPath="global.postgres.dsn"
                >
                  <TextInput
                    placeholder="postgresql://user:pass@host:5432/backend?sslmode=require"
                    value={ai.postgresDsn}
                    onChange={(e) => update("ai", { postgresDsn: e.target.value })}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="DSN Secret name"
                    hint="Takes precedence over the DSN above."
                    help="global.postgres.dsnSecretRef — existing Secret holding the PostgreSQL DSN."
                    helpPath="global.postgres.dsnSecretRef"
                  >
                    <TextInput
                      placeholder="testkube-postgres-dsn"
                      value={ai.postgresDsnSecretRef}
                      onChange={(e) => update("ai", { postgresDsnSecretRef: e.target.value })}
                    />
                  </Field>
                  <Field
                    label="DSN Secret key"
                    help="global.postgres.dsnSecretKey — key inside the Secret holding the DSN."
                    helpPath="global.postgres.dsnSecretKey"
                  >
                    <TextInput
                      placeholder="dsn"
                      value={ai.postgresDsnSecretKey}
                      onChange={(e) => update("ai", { postgresDsnSecretKey: e.target.value })}
                    />
                  </Field>
                </div>
              </>
            )}
          </Card>
        </>
      )}

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

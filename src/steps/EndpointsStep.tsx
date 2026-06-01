import { Card, Field, TextInput, Toggle } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import { isEnterprise } from "../types/config";
import type { StepProps } from "./types";

export default function EndpointsStep({ config, update, setAdvanced }: StepProps) {
  const c = config.endpoints;
  const enterprise = isEnterprise(config.initial.envType);

  return (
    <div className="space-y-5">
      <Card title="Domain">
        <Field label="Base domain" hint="Endpoints are exposed as <prefix>.<domain>.">
          <TextInput
            placeholder="testkube.example.com"
            value={c.domain}
            onChange={(e) => update("endpoints", { domain: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="Prefixes">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="UI (dashboard)">
            <TextInput
              value={c.uiSubdomain}
              onChange={(e) => update("endpoints", { uiSubdomain: e.target.value })}
            />
          </Field>
          <Field label="REST API">
            <TextInput
              value={c.apiSubdomain}
              onChange={(e) => update("endpoints", { apiSubdomain: e.target.value })}
            />
          </Field>
          {enterprise && (
            <>
              <Field label="gRPC agent">
                <TextInput
                  value={c.agentSubdomain}
                  onChange={(e) => update("endpoints", { agentSubdomain: e.target.value })}
                />
              </Field>
              <Field label="Websockets">
                <TextInput
                  value={c.websocketsSubdomain}
                  onChange={(e) =>
                    update("endpoints", { websocketsSubdomain: e.target.value })
                  }
                />
              </Field>
              <Field label="Storage">
                <TextInput
                  value={c.storageSubdomain}
                  onChange={(e) =>
                    update("endpoints", { storageSubdomain: e.target.value })
                  }
                />
              </Field>
              <Field label="AI">
                <TextInput
                  value={c.aiSubdomain}
                  onChange={(e) => update("endpoints", { aiSubdomain: e.target.value })}
                />
              </Field>
            </>
          )}
        </div>
      </Card>

      <Card title="Integration & TLS">
        <Toggle
          label="Use Kubernetes Service for component integrations?"
          description="Wire components via in-cluster Services instead of public Ingress."
          checked={c.useKubernetesService}
          onChange={(v) => update("endpoints", { useKubernetesService: v })}
        />
        <Toggle
          label="Using cert-manager?"
          description="Automate TLS certificate issuance."
          checked={c.certManager}
          onChange={(v) => update("endpoints", { certManager: v })}
        />
        {c.certManager && (
          <Field label="Issuer reference" hint="cert-manager ClusterIssuer / Issuer name.">
            <TextInput
              value={c.certManagerIssuerRef}
              onChange={(e) =>
                update("endpoints", { certManagerIssuerRef: e.target.value })
              }
            />
          </Field>
        )}
      </Card>

      <CustomizePanel stepId="endpoints" config={config} setAdvanced={setAdvanced} />
    </div>
  );
}

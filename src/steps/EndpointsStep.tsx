import { Card, Field, TextInput, Toggle } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import { tipFor } from "../lib/tips";
import { isEnterprise } from "../types/config";
import { isLabEnv, isProdEnv } from "../lib/envPresets";
import type { StepProps } from "./types";

export default function EndpointsStep({ config, update, setAdvanced }: StepProps) {
  const c = config.endpoints;
  const enterprise = isEnterprise(config.initial.envType);
  const lab = isLabEnv(config.initial.envType);
  const prod = isProdEnv(config.initial.envType);
  const env = config.initial.envType;
  const t = (path: string, fallback: string) => tipFor(env, path) ?? fallback;

  return (
    <div className="space-y-5">
      {prod && (
        <p className="rounded-tk-md border border-tk-yellow/40 bg-tk-yellow/10 px-4 py-3 text-sm text-tk-purple-100/90">
          <strong className="text-tk-yellow">Ent. Prod</strong> exposes Testkube via Ingress
          and TLS. Use your real DNS base domain and a cert-manager issuer that already
          exists in the cluster (e.g. <code className="text-tk-pink">letsencrypt-prod</code>).
        </p>
      )}
      {lab && (
        <p className="rounded-tk-md border border-tk-purple-400/40 bg-tk-purple-500/10 px-4 py-3 text-sm text-tk-purple-100/90">
          <strong className="text-white">Ent. Lab</strong> uses in-cluster Services and
          port-forward — leave <strong className="text-tk-pink">Base domain</strong> empty.
          Kubernetes Service integration is enabled automatically.
        </p>
      )}
      <Card title="Domain">
        <Field
          label="Base domain"
          hint={
            lab
              ? "Optional for lab — leave empty for kind / local clusters."
              : "Endpoints are exposed as <prefix>.<domain>."
          }
          help={t(
            "global.domain",
            "Base domain under which all Testkube endpoints are exposed."
          )}
          helpPath="global.domain"
        >
          <TextInput
            placeholder={lab ? "(leave empty for lab)" : "testkube.example.com"}
            value={c.domain}
            disabled={lab}
            onChange={(e) => update("endpoints", { domain: e.target.value })}
          />
        </Field>
      </Card>

      <Card title="Prefixes">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="UI (dashboard)"
            help={t("global.uiSubdomain", "Subdomain prepended to the domain for the dashboard UI.")}
            helpPath="global.uiSubdomain"
          >
            <TextInput
              value={c.uiSubdomain}
              onChange={(e) => update("endpoints", { uiSubdomain: e.target.value })}
            />
          </Field>
          <Field
            label="REST API"
            help={t("global.restApiSubdomain", "Subdomain prepended to the domain for the REST API.")}
            helpPath="global.restApiSubdomain"
          >
            <TextInput
              value={c.apiSubdomain}
              onChange={(e) => update("endpoints", { apiSubdomain: e.target.value })}
            />
          </Field>
          {enterprise && (
            <>
              <Field
                label="gRPC agent"
                help={t("global.grpcApiSubdomain", "Subdomain for the gRPC API used by agents.")}
                helpPath="global.grpcApiSubdomain"
              >
                <TextInput
                  value={c.agentSubdomain}
                  onChange={(e) => update("endpoints", { agentSubdomain: e.target.value })}
                />
              </Field>
              <Field
                label="Websockets"
                help={t("global.websocketApiSubdomain", "Subdomain for the Websocket API.")}
                helpPath="global.websocketApiSubdomain"
              >
                <TextInput
                  value={c.websocketsSubdomain}
                  onChange={(e) =>
                    update("endpoints", { websocketsSubdomain: e.target.value })
                  }
                />
              </Field>
              <Field
                label="Storage"
                help={t("global.storageApiSubdomain", "Subdomain for the storage API.")}
                helpPath="global.storageApiSubdomain"
              >
                <TextInput
                  value={c.storageSubdomain}
                  onChange={(e) =>
                    update("endpoints", { storageSubdomain: e.target.value })
                  }
                />
              </Field>
              <Field
                label="AI"
                help={t("global.aiApiSubdomain", "Subdomain for the AI API.")}
                helpPath="global.aiApiSubdomain"
              >
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
        {!lab && (
          <Toggle
            label="Use Kubernetes Service for component integrations?"
            description="Wire components via in-cluster Services instead of public Ingress."
            help="When enabled, components talk to each other through in-cluster Kubernetes Services instead of going through public Ingress endpoints."
            checked={c.useKubernetesService}
            onChange={(v) => update("endpoints", { useKubernetesService: v })}
          />
        )}
        {!lab && (
          <Toggle
            label="Using cert-manager?"
            description="Automate TLS certificate issuance."
            help={t(
              "global.certificateProvider",
              "Use cert-manager to automatically issue and renew TLS certificates for the endpoints."
            )}
            helpPath="global.certificateProvider"
            checked={c.certManager}
            onChange={(v) => update("endpoints", { certManager: v })}
          />
        )}
        {c.certManager && !lab && (
          <Field
            label="cert-manager issuer name"
            hint="Must match a ClusterIssuer or Issuer in your cluster."
            help={t(
              "global.certManager.issuerRef",
              "Reference to the cert-manager Issuer/ClusterIssuer used to sign certificates (e.g. letsencrypt-prod, letsencrypt-edge)."
            )}
            helpPath="global.certManager.issuerRef"
          >
            <TextInput
              placeholder="letsencrypt-prod"
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

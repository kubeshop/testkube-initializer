import { Card, Field, Select, TextInput, Toggle } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import { tipFor } from "../lib/tips";
import { isEnterprise, type AuthConnectorType } from "../types/config";
import type { StepProps } from "./types";

export default function AuthenticationStep({ config, update, setAdvanced }: StepProps) {
  const c = config.auth;
  const enterprise = isEnterprise(config.initial.envType);
  const env = config.initial.envType;

  if (!enterprise) {
    return (
      <Card title="Authentication">
        <p className="text-sm text-tk-purple-200">
          Built-in SSO / Dex is an Enterprise feature. The OSS chart relies on
          your cluster's access controls. Switch <strong>Env type</strong> to an
          Enterprise flavor in step 1 to configure authentication.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card title="Identity broker (Dex)">
        <Toggle
          label="Enable Dex"
          description="Identity broker placed in front of your IdP."
          help={tipFor(env, "dex.enabled") ?? "Deploy Dex as the identity broker that federates your IdP (OIDC, Google, GitHub, ...)."}
          helpPath="dex.enabled"
          checked={c.dexEnabled}
          onChange={(v) => update("auth", { dexEnabled: v })}
        />
        <Field
          label="Issuer URL"
          hint="Public OIDC issuer URL exposed by Dex."
          help={tipFor(env, "global.dex.issuer") ?? "Public OIDC issuer URL exposed by Dex; must be reachable by clients and the API."}
          helpPath="global.dex.issuer"
        >
          <TextInput
            placeholder="https://dashboard.testkube.example.com/idp"
            value={c.issuerUrl}
            onChange={(e) => update("auth", { issuerUrl: e.target.value })}
          />
        </Field>
      </Card>

      {c.dexEnabled && (
        <Card title="Connector">
          <Field
            label="Connector type"
            help="Upstream identity provider Dex federates to (generic OIDC, Google, GitHub, GitLab or LDAP)."
          >
            <Select
              value={c.connector}
              onChange={(v) => update("auth", { connector: v as AuthConnectorType })}
              options={[
                { value: "oidc", label: "Generic OIDC" },
                { value: "google", label: "Google" },
                { value: "github", label: "GitHub" },
                { value: "gitlab", label: "GitLab" },
                { value: "ldap", label: "LDAP" },
              ]}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Client ID"
              help="OAuth/OIDC client ID issued by your identity provider for Testkube."
            >
              <TextInput
                value={c.clientId}
                onChange={(e) => update("auth", { clientId: e.target.value })}
              />
            </Field>
            <Field
              label="Client Secret"
              help="OAuth/OIDC client secret paired with the client ID."
            >
              <TextInput
                type="password"
                value={c.clientSecret}
                onChange={(e) => update("auth", { clientSecret: e.target.value })}
              />
            </Field>
          </div>
          <Field
            label="Admin emails"
            hint="Comma-separated list granted admin access."
            help="Comma-separated emails that are granted administrator access on first login."
          >
            <TextInput
              placeholder="admin@acme.com, ops@acme.com"
              value={c.adminEmails}
              onChange={(e) => update("auth", { adminEmails: e.target.value })}
            />
          </Field>
        </Card>
      )}

      <CustomizePanel stepId="auth" config={config} setAdvanced={setAdvanced} />
    </div>
  );
}

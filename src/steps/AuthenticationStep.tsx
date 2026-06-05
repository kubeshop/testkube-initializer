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
          label="Dex issuer URL"
          hint="Leave empty to auto-derive from your domain (or localhost for internal access)."
          help={tipFor(env, "global.dex.issuer") ?? "Public OIDC issuer URL exposed by Dex; must be reachable by clients and the API."}
          helpPath="global.dex.issuer"
        >
          <TextInput
            placeholder="https://api.testkube.example.com/idp"
            value={c.issuerUrl}
            onChange={(e) => update("auth", { issuerUrl: e.target.value })}
          />
        </Field>
      </Card>

      {c.dexEnabled && (
        <Card title="Upstream identity provider">
          <p className="mb-4 text-sm text-tk-purple-200">
            Provide IdP credentials for production. For lab / internal access without
            an IdP, leave these empty — the chart will configure a static local user
            (password: <code className="text-tk-pink">password</code>).
          </p>
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
          {c.connector === "oidc" && (
            <Field
              label="Upstream OIDC issuer"
              hint="Your IdP issuer URL — not the Dex URL."
              help="Issuer URL of your upstream OIDC provider (e.g. https://login.microsoftonline.com/{tenant}/v2.0)."
            >
              <TextInput
                placeholder="https://accounts.google.com"
                value={c.upstreamIssuerUrl}
                onChange={(e) => update("auth", { upstreamIssuerUrl: e.target.value })}
              />
            </Field>
          )}
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
            hint="Used for static local login when no IdP is configured."
            help="Email for the built-in static user (lab/internal). Also used to grant admin access on first SSO login."
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

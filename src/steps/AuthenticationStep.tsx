import { Card, Field, Select, TextInput, Toggle } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import { tipFor } from "../lib/tips";
import { isEnterprise, type AuthConnectorType } from "../types/config";
import { isLabEnv, isProdEnv } from "../lib/envPresets";
import type { StepProps } from "./types";

export default function AuthenticationStep({ config, update, setAdvanced }: StepProps) {
  const c = config.auth;
  const enterprise = isEnterprise(config.initial.envType);
  const lab = isLabEnv(config.initial.envType);
  const prod = isProdEnv(config.initial.envType);
  const env = config.initial.envType;

  if (!enterprise) {
    return (
      <Card title="Authentication">
        <p className="text-sm text-tk-muted">
          Built-in SSO / Dex is an Enterprise feature. The OSS chart relies on
          your cluster's access controls. Switch <strong>Env type</strong> to an
          Enterprise flavor in step 1 to configure authentication.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {lab && (
        <p className="rounded-tk border border-tk-border bg-tk-slate-800/50 px-4 py-3 text-sm text-tk-slate-300">
          <strong className="text-white">Ent. Lab</strong> — leave Dex issuer and IdP fields
          empty. After install, port-forward Dex/UI and sign in with your{" "}
          <strong className="text-white">Admin email</strong> (step 1) and password{" "}
          <code className="text-tk-link">password</code>.
        </p>
      )}
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
          hint={
            lab
              ? "Leave empty → http://localhost:5556 (port-forward)."
              : prod
                ? "Leave empty → https://api.<your-domain>/idp"
                : "Leave empty to auto-derive from your domain."
          }
          help={
            tipFor(env, "global.dex.issuer") ??
            "Public OIDC issuer URL for Dex. Leave empty to auto-derive — do not enter random text."
          }
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
          <p className="mb-4 text-sm text-tk-muted">
            {lab
              ? "Leave IdP fields empty for static local login."
              : "Configure your corporate IdP for production SSO."}{" "}
            When Client ID and Secret are empty, sign in with your Admin email from step 1
            and password <code className="text-tk-link">password</code>.
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

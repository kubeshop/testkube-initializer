import { Card, Field, SegmentedControl, TextInput } from "../components/ui";
import CustomizePanel from "../components/CustomizePanel";
import { tipFor } from "../lib/tips";
import { useSetHelp } from "../lib/helpContext";
import type { EnvType, KubernetesType, LicenseMode } from "../types/config";
import { isEnterprise } from "../types/config";
import type { StepProps } from "./types";

export default function InitialConfigStep({ config, update, setAdvanced }: StepProps) {
  const setHelp = useSetHelp();
  const c = config.initial;
  const enterprise = isEnterprise(c.envType);

  const addRow = () =>
    update("initial", {
      orgsEnvs: [
        ...c.orgsEnvs,
        { id: `org-${Date.now()}`, organization: "", environment: "" },
      ],
    });

  const removeRow = (id: string) =>
    update("initial", { orgsEnvs: c.orgsEnvs.filter((r) => r.id !== id) });

  const updateRow = (id: string, patch: Partial<{ organization: string; environment: string }>) =>
    update("initial", {
      orgsEnvs: c.orgsEnvs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });

  return (
    <div className="space-y-5">
      <Card title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Company Name"
            help="Logical name for your installation. Used in the generated file header for reference."
          >
            <TextInput
              placeholder="Acme Inc."
              value={c.companyName}
              onChange={(e) => update("initial", { companyName: e.target.value })}
            />
          </Field>
          <Field
            label="Admin Email"
            help="Primary administrator contact for this deployment."
          >
            <TextInput
              type="email"
              placeholder="admin@acme.com"
              value={c.adminEmail}
              onChange={(e) => update("initial", { adminEmail: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      <Card title="Environment">
        <Field
          label="Kubernetes type"
          help="Where the cluster runs: on-prem/self-managed or a cloud provider. Affects recommended defaults."
        >
          <SegmentedControl<KubernetesType>
            value={c.kubernetesType}
            onChange={(v) => update("initial", { kubernetesType: v })}
            options={[
              { value: "onprem", label: "On-prem" },
              { value: "cloud", label: "Cloud" },
            ]}
          />
        </Field>
        <Field
          label="Env type"
          hint="Drives whether OSS or Enterprise values are generated."
          help="OSS uses the open-source chart (testkube/testkube). Enterprise Prod/Lab use the control-plane chart (testkube/testkube-enterprise) with licensing and SSO."
        >
          <SegmentedControl<EnvType>
            value={c.envType}
            onChange={(v) => update("initial", { envType: v })}
            options={[
              { value: "oss", label: "OSS" },
              { value: "enterprise-prod", label: "Ent. Prod" },
              { value: "enterprise-lab", label: "Ent. Lab" },
            ]}
          />
        </Field>
      </Card>

      {enterprise && (
        <Card title="License">
          <Field
            label="License activation"
            help={tipFor(c.envType, "global.enterpriseOfflineAccess") ?? "Online validates the key against the licensing service; Offline mounts the license from a Kubernetes secret (air-gapped)."}
          >
            <SegmentedControl<LicenseMode>
              value={c.licenseMode}
              onChange={(v) => update("initial", { licenseMode: v })}
              options={[
                { value: "online", label: "Online" },
                { value: "offline", label: "Offline" },
              ]}
            />
          </Field>
          {c.licenseMode === "online" ? (
            <Field
              label="License key"
              hint="Stored in global.enterpriseLicenseKey."
              help={tipFor(c.envType, "global.enterpriseLicenseKey") ?? "Enterprise license key validated online against the licensing service."}
              helpPath="global.enterpriseLicenseKey"
            >
              <TextInput
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={c.licenseKey}
                onChange={(e) => update("initial", { licenseKey: e.target.value })}
              />
            </Field>
          ) : (
            <Field
              label="License secret reference"
              hint="Name of the secret with LICENSE_KEY and license.lic keys."
              help={tipFor(c.envType, "global.enterpriseLicenseSecretRef") ?? "Secret holding the offline license (keys LICENSE_KEY and license.lic)."}
              helpPath="global.enterpriseLicenseSecretRef"
            >
              <TextInput
                placeholder="testkube-enterprise-license"
                value={c.licenseSecretRef}
                onChange={(e) =>
                  update("initial", { licenseSecretRef: e.target.value })
                }
              />
            </Field>
          )}
        </Card>
      )}

      <Card title="Organizations / Environments">
        <div
          className="space-y-2"
          onFocus={() =>
            setHelp({
              title: "Organizations / Environments",
              body: "Initial organizations and their environments to bootstrap in the control plane. Each row is one organization with an environment (e.g. default / production).",
            })
          }
          onMouseEnter={() =>
            setHelp({
              title: "Organizations / Environments",
              body: "Initial organizations and their environments to bootstrap in the control plane. Each row is one organization with an environment (e.g. default / production).",
            })
          }
        >
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-xs font-semibold uppercase text-tk-purple-200/70">
            <span>Organization</span>
            <span>Environment</span>
            <span />
          </div>
          {c.orgsEnvs.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <TextInput
                placeholder="default"
                value={row.organization}
                onChange={(e) => updateRow(row.id, { organization: e.target.value })}
              />
              <TextInput
                placeholder="production"
                value={row.environment}
                onChange={(e) => updateRow(row.id, { environment: e.target.value })}
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={c.orgsEnvs.length <= 1}
                className="rounded-tk-md border border-tk-purple-600 px-3 text-tk-purple-200 transition hover:border-tk-error hover:text-tk-error disabled:opacity-30"
                aria-label="Remove row"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="mt-1 rounded-full border border-tk-purple-400 px-4 py-1.5 text-sm font-semibold text-tk-purple-200 transition hover:bg-tk-purple-500/20"
          >
            + Add organization / environment
          </button>
        </div>
      </Card>

      <CustomizePanel stepId="initial" config={config} setAdvanced={setAdvanced} />
    </div>
  );
}

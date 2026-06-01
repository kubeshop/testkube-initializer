import { isEnterprise, type TestkubeConfig } from "../types/config";

export type AdvancedType = "text" | "number" | "boolean" | "select";

export interface AdvancedFieldDef {
  // Exact dotted Helm value path. Used both as the override key and to look
  // up the official chart comment (tip).
  path: string;
  label: string;
  type: AdvancedType;
  placeholder?: string;
  options?: { value: string; label: string }[];
  // Which flavor(s) this field applies to.
  flavor?: "oss" | "enterprise" | "both";
  // Optional extra predicate (e.g. only show for a given database type).
  when?: (cfg: TestkubeConfig) => boolean;
}

// Advanced fields per wizard step. Tips are pulled live from the official
// chart comments (see lib/tips.ts), so labels stay short here.
const CATALOG: Record<string, AdvancedFieldDef[]> = {
  initial: [
    {
      path: "global.imageRegistry",
      label: "Global image registry",
      type: "text",
      placeholder: "registry.mycompany.com",
      flavor: "both",
    },
    {
      path: "global.enterpriseOfflineAccess",
      label: "Enterprise offline access",
      type: "boolean",
      flavor: "enterprise",
    },
  ],
  core: [
    {
      path: "testkube-api.analyticsEnabled",
      label: "API analytics enabled",
      type: "boolean",
      flavor: "oss",
    },
    {
      path: "testkube-api.image.pullPolicy",
      label: "API image pull policy",
      type: "select",
      options: [
        { value: "IfNotPresent", label: "IfNotPresent" },
        { value: "Always", label: "Always" },
        { value: "Never", label: "Never" },
      ],
      flavor: "oss",
    },
    {
      path: "testkube-api.prometheus.enabled",
      label: "Prometheus metrics",
      type: "boolean",
      flavor: "oss",
    },
    {
      path: "testkube-cloud-api.scim.enabled",
      label: "SCIM provisioning",
      type: "boolean",
      flavor: "enterprise",
    },
    {
      path: "testkube-cloud-api.audit.logger.enabled",
      label: "Audit logging",
      type: "boolean",
      flavor: "enterprise",
    },
    {
      path: "testkube-cloud-api.api.migrations.enabled",
      label: "Run DB migrations",
      type: "boolean",
      flavor: "enterprise",
    },
  ],
  database: [
    {
      path: "mongodb.auth.enabled",
      label: "MongoDB auth enabled",
      type: "boolean",
      flavor: "oss",
      when: (c) => c.database.type === "mongodb" && !c.database.external,
    },
    {
      path: "mongodb.image.tag",
      label: "MongoDB image tag",
      type: "text",
      placeholder: "6.0.5-debian-11-r64",
      flavor: "oss",
      when: (c) => c.database.type === "mongodb" && !c.database.external,
    },
    {
      path: "postgresql.architecture",
      label: "PostgreSQL architecture",
      type: "select",
      options: [
        { value: "standalone", label: "standalone" },
        { value: "replication", label: "replication" },
      ],
      flavor: "oss",
      when: (c) => c.database.type === "postgresql" && !c.database.external,
    },
    {
      path: "postgresql.image.tag",
      label: "PostgreSQL image tag",
      type: "text",
      flavor: "oss",
      when: (c) => c.database.type === "postgresql" && !c.database.external,
    },
    {
      path: "global.mongo.database",
      label: "Mongo database name",
      type: "text",
      placeholder: "testkubeEnterpriseDB",
      flavor: "enterprise",
    },
    {
      path: "global.mongo.readPreference",
      label: "Mongo read preference",
      type: "select",
      options: [
        { value: "primary", label: "primary" },
        { value: "primaryPreferred", label: "primaryPreferred" },
        { value: "secondary", label: "secondary" },
        { value: "secondaryPreferred", label: "secondaryPreferred" },
        { value: "nearest", label: "nearest" },
      ],
      flavor: "enterprise",
    },
    {
      path: "global.mongo.allowDiskUse",
      label: "Mongo allow disk use",
      type: "boolean",
      flavor: "enterprise",
    },
  ],
  artifacts: [
    {
      path: "testkube-api.storage.SSL",
      label: "Storage SSL",
      type: "boolean",
      flavor: "oss",
    },
    {
      path: "testkube-api.storage.scrapperEnabled",
      label: "Artifact scraper enabled",
      type: "boolean",
      flavor: "oss",
    },
    {
      path: "global.storage.secure",
      label: "Use HTTPS (secure)",
      type: "boolean",
      flavor: "enterprise",
    },
    {
      path: "global.storage.skipVerify",
      label: "Skip TLS verification",
      type: "boolean",
      flavor: "enterprise",
    },
    {
      path: "global.storage.token",
      label: "S3 session token",
      type: "text",
      flavor: "enterprise",
    },
    {
      path: "global.storage.public.endpoint",
      label: "Public storage endpoint",
      type: "text",
      flavor: "enterprise",
    },
  ],
  nats: [
    {
      path: "nats.config.cluster.enabled",
      label: "NATS clustering",
      type: "boolean",
      flavor: "oss",
      when: (c) => c.nats.embedded,
    },
    {
      path: "nats.config.cluster.replicas",
      label: "NATS cluster replicas",
      type: "number",
      placeholder: "3",
      flavor: "oss",
      when: (c) => c.nats.embedded,
    },
    {
      path: "nats.promExporter.enabled",
      label: "Prometheus exporter",
      type: "boolean",
      flavor: "oss",
      when: (c) => c.nats.embedded,
    },
  ],
  auth: [
    {
      path: "dex.replicas",
      label: "Dex replicas",
      type: "number",
      placeholder: "1",
      flavor: "enterprise",
      when: (c) => c.auth.dexEnabled,
    },
    {
      path: "global.customCaSecretRef",
      label: "Custom CA secret ref",
      type: "text",
      flavor: "enterprise",
    },
  ],
  endpoints: [
    {
      path: "testkube-api.cliIngress.enabled",
      label: "CLI Ingress enabled",
      type: "boolean",
      flavor: "oss",
    },
    {
      path: "global.redirectSubdomain",
      label: "Redirect subdomain",
      type: "text",
      placeholder: "app",
      flavor: "enterprise",
    },
    {
      path: "global.ingress.enabled",
      label: "Create Ingress resources",
      type: "boolean",
      flavor: "enterprise",
    },
  ],
};

export function advancedFieldsFor(
  stepId: string,
  config: TestkubeConfig
): AdvancedFieldDef[] {
  const all = CATALOG[stepId] ?? [];
  const enterprise = isEnterprise(config.initial.envType);
  return all.filter((f) => {
    const flavor = f.flavor ?? "both";
    const flavorOk =
      flavor === "both" ||
      (flavor === "enterprise" && enterprise) ||
      (flavor === "oss" && !enterprise);
    if (!flavorOk) return false;
    if (f.when && !f.when(config)) return false;
    return true;
  });
}

// Maps every dotted path valid for the current flavor to its field definition.
// Used by the YAML generator to coerce values and to ignore stale overrides
// after the user switches flavor.
export function advancedDefsMap(
  config: TestkubeConfig
): Map<string, AdvancedFieldDef> {
  const map = new Map<string, AdvancedFieldDef>();
  for (const stepId of Object.keys(CATALOG)) {
    for (const f of advancedFieldsFor(stepId, config)) map.set(f.path, f);
  }
  return map;
}

import { isEnterprise, type TestkubeConfig } from "../types/config";

export type AdvancedType = "text" | "number" | "boolean" | "select" | "yaml";

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
    // --- Workflow runner defaults (OSS chart >= 2.12) ---
    {
      path: "testkube-api.defaultImagePullPolicy",
      label: "Runner image pull policy",
      type: "select",
      options: [
        { value: "IfNotPresent", label: "IfNotPresent" },
        { value: "Always", label: "Always" },
        { value: "Never", label: "Never" },
      ],
      flavor: "oss",
    },
    {
      path: "testkube-api.defaultRunnerResources",
      label: "Runner default resources (YAML)",
      type: "yaml",
      placeholder:
        "requests:\n  cpu: 100m\n  memory: 128Mi\nlimits:\n  cpu: 500m\n  memory: 512Mi",
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
    // --- Control Plane API autoscaling / shutdown (Enterprise chart >= 2.335 / app 2.12) ---
    {
      path: "testkube-cloud-api.autoscaling.enabled",
      label: "API autoscaling (HPA)",
      type: "boolean",
      flavor: "enterprise",
    },
    {
      path: "testkube-cloud-api.autoscaling.minReplicas",
      label: "API HPA min replicas",
      type: "number",
      placeholder: "1",
      flavor: "enterprise",
      when: (c) => c.advanced["testkube-cloud-api.autoscaling.enabled"] === true,
    },
    {
      path: "testkube-cloud-api.autoscaling.maxReplicas",
      label: "API HPA max replicas",
      type: "number",
      placeholder: "10",
      flavor: "enterprise",
      when: (c) => c.advanced["testkube-cloud-api.autoscaling.enabled"] === true,
    },
    {
      path: "testkube-cloud-api.autoscaling.targetCPUUtilizationPercentage",
      label: "API HPA target CPU %",
      type: "number",
      placeholder: "80",
      flavor: "enterprise",
      when: (c) => c.advanced["testkube-cloud-api.autoscaling.enabled"] === true,
    },
    {
      path: "testkube-cloud-api.autoscaling.targetMemoryUtilizationPercentage",
      label: "API HPA target memory %",
      type: "number",
      placeholder: "80",
      flavor: "enterprise",
      when: (c) => c.advanced["testkube-cloud-api.autoscaling.enabled"] === true,
    },
    {
      path: "testkube-cloud-api.terminationGracePeriodSeconds",
      label: "API termination grace period (s)",
      type: "number",
      placeholder: "30",
      flavor: "enterprise",
    },
    {
      path: "testkube-cloud-api.lifecycle.preStop.sleepSeconds",
      label: "API preStop sleep (s)",
      type: "number",
      placeholder: "0",
      flavor: "enterprise",
    },
    {
      path: "testkube-cloud-api.gracefulShutdownTimeout",
      label: "API graceful shutdown timeout",
      type: "text",
      placeholder: "25s",
      flavor: "enterprise",
    },
    // --- Scheduling (cluster-wide, both flavors) ---
    {
      path: "global.nodeSelector",
      label: "Global nodeSelector (YAML)",
      type: "yaml",
      placeholder: "disktype: ssd",
      flavor: "both",
    },
    {
      path: "global.tolerations",
      label: "Global tolerations (YAML)",
      type: "yaml",
      placeholder: "- key: dedicated\n  operator: Equal\n  value: testkube\n  effect: NoSchedule",
      flavor: "both",
    },
    {
      path: "global.affinity",
      label: "Global affinity (YAML)",
      type: "yaml",
      placeholder:
        "podAntiAffinity:\n  preferredDuringSchedulingIgnoredDuringExecution:\n    - weight: 100\n      podAffinityTerm:\n        topologyKey: kubernetes.io/hostname",
      flavor: "both",
    },
    // --- High availability ---
    {
      path: "global.podDisruptionBudget.enabled",
      label: "Enable PodDisruptionBudgets",
      type: "boolean",
      flavor: "both",
    },
    {
      path: "testkube-api.replicaCount",
      label: "API server replicas",
      type: "number",
      placeholder: "1",
      flavor: "oss",
    },
    {
      path: "testkube-cloud-api.replicaCount",
      label: "Control Plane API replicas",
      type: "number",
      placeholder: "1",
      flavor: "enterprise",
    },
    {
      path: "testkube-cloud-ui.replicaCount",
      label: "Dashboard replicas",
      type: "number",
      placeholder: "1",
      flavor: "enterprise",
    },
    {
      path: "testkube-worker-service.replicaCount",
      label: "Worker Service replicas",
      type: "number",
      placeholder: "1",
      flavor: "enterprise",
    },
    // --- AI service (only relevant when AI is enabled) ---
    {
      path: "testkube-ai-service.replicaCount",
      label: "AI service replicas",
      type: "number",
      placeholder: "1",
      flavor: "enterprise",
      when: (c) => c.core.ai,
    },
    {
      path: "testkube-ai-service.logLevel",
      label: "AI service log level",
      type: "select",
      options: [
        { value: "info", label: "info" },
        { value: "debug", label: "debug" },
        { value: "warn", label: "warn" },
        { value: "error", label: "error" },
      ],
      flavor: "enterprise",
      when: (c) => c.core.ai,
    },
    {
      path: "testkube-ai-service.runspaceBridge.enabled",
      label: "AI runspace bridge (gRPC)",
      type: "boolean",
      flavor: "enterprise",
      when: (c) => c.core.ai,
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

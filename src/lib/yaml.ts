import { parse, stringify } from "yaml";
import {
  isEnterprise,
  type AiConfig,
  type ConnectionMode,
  type ResourceSpec,
  type TestkubeConfig,
} from "../types/config";
import { advancedDefsMap } from "./advancedFields";
import {
  buildEnterpriseApiBlock,
  buildEnterpriseApiEnv,
  buildEnterpriseDexBlock,
  buildEnterpriseStorage,
  buildEnterpriseUiBlock,
  dexIssuerUrl,
  ENT_SECRETS,
  minioInCluster,
  seaweedInCluster,
} from "./enterpriseDefaults";

type Dict = Record<string, unknown>;

// Published SeaweedFS image tag. The enterprise chart's default (4.23) is not
// pushed to docker.io, so we pin a released tag to keep SeaweedFS deployable.
// Remove once the chart ships a valid default.
const SEAWEED_IMAGE_TAG = "4.39";

// Sets a value at a dotted path, creating intermediate objects as needed.
function setPath(root: Dict, path: string, value: unknown): void {
  const parts = path.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (typeof node[key] !== "object" || node[key] === null || Array.isArray(node[key])) {
      node[key] = {};
    }
    node = node[key] as Dict;
  }
  node[parts[parts.length - 1]] = value;
}

// Merges the per-component "Customize" overrides onto the base values object.
// Only paths that are valid for the current flavor are applied, so switching
// between OSS / Enterprise never leaks stale keys.
function applyAdvanced(base: Dict, cfg: TestkubeConfig): Dict {
  const defs = advancedDefsMap(cfg);
  for (const [path, raw] of Object.entries(cfg.advanced)) {
    const def = defs.get(path);
    if (!def) continue;
    if (raw === "" || raw === undefined || raw === null) continue;
    let value: unknown = raw;
    if (def.type === "number") {
      const n = Number(raw);
      if (Number.isNaN(n)) continue;
      value = n;
    } else if (def.type === "yaml") {
      // The field stores raw YAML/JSON text; parse it into structured data.
      try {
        const parsed = parse(String(raw));
        if (parsed === null || parsed === undefined) continue;
        value = parsed;
      } catch {
        continue; // skip invalid YAML rather than breaking the whole document
      }
    }
    setPath(base, path, value);
  }
  return base;
}

function resourcesToValues(r: ResourceSpec): Dict {
  return {
    requests: { cpu: r.requestsCpu, memory: r.requestsMemory },
    limits: { cpu: r.limitsCpu, memory: r.limitsMemory },
  };
}

// Drops empty strings / empty objects so the rendered values.yaml stays clean.
function prune<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => prune(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Dict = {};
    for (const [k, v] of Object.entries(value as Dict)) {
      const pruned = prune(v);
      const isEmptyString = pruned === "";
      const isEmptyObject =
        pruned &&
        typeof pruned === "object" &&
        !Array.isArray(pruned) &&
        Object.keys(pruned as Dict).length === 0;
      if (isEmptyString || isEmptyObject || pruned === undefined) continue;
      out[k] = pruned;
    }
    return out as unknown as T;
  }
  return value;
}

// Builds the modern unified `inference:` block for the AI service subchart.
// This replaces the deprecated llmApi/model/models keys (chart >= 2.10).
function buildAiInference(ai: AiConfig): Dict {
  const defaults: Dict = { url: ai.baseUrl };
  if (ai.credentialSource === "inline") {
    defaults.apiKey = ai.apiKey;
  } else {
    defaults.secretRef = ai.apiKeySecretRef;
    defaults.secretRefKey = ai.apiKeySecretKey;
  }

  const inference: Dict = {
    defaults: prune(defaults),
    agent: [prune({ model: ai.agentModel, default: true })],
  };
  if (ai.tasksModel.trim()) inference.tasks = { model: ai.tasksModel.trim() };
  if (ai.embeddingsModel.trim()) {
    inference.embeddings = { model: ai.embeddingsModel.trim() };
  }
  return inference;
}

// The AI service persists state in PostgreSQL. Returns the `global.postgres`
// patch needed to back it, based on the selected mode.
function buildAiPostgres(ai: AiConfig): Dict {
  if (ai.postgresMode === "in-cluster") {
    return { enabled: true };
  }
  // external
  if (ai.postgresDsnSecretRef.trim()) {
    return prune({
      enabled: true,
      dsnSecretRef: ai.postgresDsnSecretRef,
      dsnSecretKey: ai.postgresDsnSecretKey,
    });
  }
  return prune({ enabled: true, dsn: ai.postgresDsn });
}

// Secret key holding the Control Plane PostgreSQL DSN, mirroring MONGO_DSN.
const ENT_POSTGRES_DSN_KEY = "POSTGRES_DSN";

// Database the charts' default PostgreSQL DSNs point at.
const IN_CLUSTER_PG_DATABASE = "backend";

// Values for the bundled PostgreSQL subchart. Its image runs the upstream
// postgres entrypoint, which creates the initial database from POSTGRES_DB,
// while the chart only passes the Bitnami-style POSTGRES_DATABASE. Without the
// extra variable the database named in the generated DSN is never created, and
// the Control Plane migration job fails to connect.
function inClusterPostgres(resources?: ResourceSpec): Dict {
  return {
    enabled: true,
    auth: { database: IN_CLUSTER_PG_DATABASE },
    primary: {
      extraEnvVars: [{ name: "POSTGRES_DB", value: IN_CLUSTER_PG_DATABASE }],
      ...(resources ? { resources: resourcesToValues(resources) } : {}),
    },
  };
}

function buildEnterpriseMongo(cfg: TestkubeConfig): Dict {
  const { database } = cfg;
  const enabled = database.type === "mongodb";
  if (!enabled || !database.external) return { enabled };
  return prune({
    enabled,
    ...(database.connectionMode === "secret"
      ? { dsnSecretRef: database.secretName }
      : { dsn: database.connectionString }),
  });
}

// Postgres backs the Control Plane when it is the selected database, and always
// backs the AI service, which can run on its own instance when Postgres is not
// already the primary store.
function buildEnterprisePostgres(cfg: TestkubeConfig): Dict {
  const { database, core, ai } = cfg;
  if (database.type !== "postgresql") {
    return core.ai ? buildAiPostgres(ai) : {};
  }
  if (!database.external) return { enabled: true };
  if (database.connectionMode === "secret") {
    return prune({
      enabled: true,
      dsnSecretRef: database.secretName,
      dsnSecretKey: ENT_POSTGRES_DSN_KEY,
    });
  }
  return prune({ enabled: true, dsn: database.connectionString });
}

function connectionComment(mode: ConnectionMode): string {
  switch (mode) {
    case "autogenerated":
      return "Connection auto-generated by the chart (in-cluster service).";
    case "manual":
      return "Connection provided manually below.";
    case "vault":
      return "Connection sourced from Vault (see annotations / secretRef).";
    case "secret":
      return "Credentials referenced from an existing Kubernetes Secret.";
  }
}

function buildEnterpriseValues(cfg: TestkubeConfig): Dict {
  const { initial, core, database, artifacts, nats, ai, auth, endpoints } = cfg;
  const minioCluster = minioInCluster(cfg);
  const seaweedCluster = seaweedInCluster(cfg);
  const aiEnabled = core.ai;
  const aiInCluster = aiEnabled && ai.postgresMode === "in-cluster";
  const pgPrimary = database.type === "postgresql";
  const pgPrimaryInCluster = pgPrimary && !database.external;
  // The bundled PostgreSQL is deployed when it is the primary store, or when
  // only the AI service needs it and it has nowhere else to go.
  const pgSubchart =
    pgPrimaryInCluster || (aiInCluster && !(pgPrimary && database.external));
  // The chart resolves `api.mongo` / `api.postgres` from YAML anchors when its
  // own values are parsed, so overriding `global` alone never reaches the API
  // and worker services. Both have to be set explicitly.
  const mongoBlock = buildEnterpriseMongo(cfg);
  const postgresBlock = buildEnterprisePostgres(cfg);
  const apiDbBlock = {
    mongo: mongoBlock,
    postgres: pgPrimary ? postgresBlock : { enabled: false },
  };
  // Gateway API only applies to publicly-exposed (non-internal) deployments.
  const useGateway =
    endpoints.exposureMode === "gateway" && !endpoints.useKubernetesService;

  const global: Dict = {
    enterpriseMode: true,
    enterpriseOfflineAccess: initial.licenseMode === "offline",
    enterpriseLicenseKey:
      initial.licenseMode === "online" ? initial.licenseKey : "",
    enterpriseLicenseSecretRef:
      initial.licenseMode === "offline" ? initial.licenseSecretRef : "",
    domain: endpoints.domain,
    uiSubdomain: endpoints.uiSubdomain,
    restApiSubdomain: endpoints.apiSubdomain,
    grpcApiSubdomain: endpoints.agentSubdomain,
    websocketApiSubdomain: endpoints.websocketsSubdomain,
    storageApiSubdomain: endpoints.storageSubdomain,
    aiApiSubdomain: endpoints.aiSubdomain,
    certificateProvider: endpoints.certManager ? "cert-manager" : "",
    certManager: endpoints.certManager
      ? { issuerRef: endpoints.certManagerIssuerRef }
      : {},
    ingress: { enabled: !endpoints.useKubernetesService && !useGateway },
    dex: { issuer: auth.dexEnabled ? dexIssuerUrl(cfg) : auth.issuerUrl },
    credentials: {
      masterPassword: {
        secretKeyRef: { name: ENT_SECRETS.master, key: "password" },
      },
    },
    mongo: mongoBlock,
    nats: nats.embedded ? {} : { uri: nats.uri },
    storage: buildEnterpriseStorage(cfg),
  };

  global.postgres = postgresBlock;

  // Gateway API exposure: render HTTPRoutes instead of Ingress resources.
  if (useGateway) {
    global.exposure = { mode: "gateway" };
    global.gatewayAPI = prune({
      createHTTPRoutes: true,
      gateway: {
        create: endpoints.gatewayCreate,
        className: endpoints.gatewayClassName,
      },
      ...(endpoints.certManager ? { certificate: { create: true } } : {}),
    });
  }

  const apiEnv = buildEnterpriseApiEnv(cfg);

  const values: Dict = {
    global: prune(global),
    sharedSecretGenerator: { enabled: true },
    minio: {
      enabled: minioCluster,
      ...(minioCluster && artifacts.connectionMode === "autogenerated"
        ? { auth: { existingSecret: ENT_SECRETS.minio } }
        : {}),
      // Per-service HTTPRoute must be enabled explicitly for Gateway API.
      ...(useGateway && minioCluster ? { gatewayAPI: { createHTTPRoute: true } } : {}),
    },
    // SeaweedFS is the alternative in-cluster S3 store (chart >= 2.11). When on,
    // MinIO must be disabled (handled above since minioCluster is false).
    // Pin a published image tag: the chart's default (4.23) is not on docker.io.
    ...(seaweedCluster
      ? {
          seaweedfs: {
            enabled: true,
            image: { tag: SEAWEED_IMAGE_TAG },
            ...(useGateway ? { gatewayAPI: { createHTTPRoute: true } } : {}),
          },
        }
      : {}),
    mongodb: { enabled: database.type === "mongodb" && !database.external },
    nats: {
      enabled: nats.embedded,
      config: { cluster: { enabled: false } },
    },
    "testkube-cloud-ui": {
      enabled: core.dashboard,
      ...buildEnterpriseUiBlock(cfg),
      // Surface AI features in the dashboard when the AI service is deployed.
      ...(aiEnabled ? { ai: { enabled: true } } : {}),
      ...(useGateway ? { gatewayAPI: { createHTTPRoute: true } } : {}),
    },
    "testkube-cloud-api": {
      enabled: core.api,
      api: {
        resources: resourcesToValues(database.resources),
        ...buildEnterpriseApiBlock(cfg),
        ...apiDbBlock,
      },
      ...(Object.keys(apiEnv).length > 0 ? { additionalEnv: apiEnv } : {}),
      prometheus: { enabled: false },
      // REST + gRPC routes are separate per-service flags for Gateway API.
      ...(useGateway
        ? { gatewayAPI: { createRESTHTTPRoute: true, createGRPCRoute: true } }
        : {}),
    },
    "testkube-worker-service": {
      enabled: core.workerService,
      api: apiDbBlock,
      ...(minioCluster || seaweedCluster ? { additionalEnv: { USE_MINIO: true } } : {}),
    },
    "testkube-ai-service": aiEnabled
      ? {
          enabled: true,
          // TLS terminates at the Ingress (mirrors the API): the service itself
          // serves plain HTTP, so it never needs a serving-cert secret.
          tls: { serveHTTPS: false },
          inference: buildAiInference(ai),
          ...(useGateway ? { gatewayAPI: { createHTTPRoute: true } } : {}),
        }
      : { enabled: false },
    ...(pgSubchart
      ? {
          postgresql: inClusterPostgres(
            pgPrimaryInCluster ? database.resources : undefined
          ),
        }
      : {}),
    dex: {
      ...buildEnterpriseDexBlock(cfg),
      ...(useGateway
        ? { ingress: { enabled: false }, gatewayAPI: { createHTTPRoute: true } }
        : {}),
    },
  };

  const result = prune(values);
  // When cert-manager is disabled we must keep an explicit (empty) provider:
  // pruning the empty string would let the chart fall back to its default
  // "cert-manager", which then fails because no issuerRef is set.
  if (!endpoints.certManager) {
    const g = (result.global ?? (result.global = {})) as Dict;
    g.certificateProvider = "";
  }
  return result;
}

// External DB connection for the OSS testkube-api subchart. Maps the wizard's
// connection mode onto the chart's `dsn` / `secretName`+`secretKey` keys.
function ossExternalDbBlock(database: TestkubeConfig["database"]): Dict {
  const secretKey = database.type === "mongodb" ? "mongo-dsn" : "postgres-dsn";
  switch (database.connectionMode) {
    case "manual":
      return { dsn: database.connectionString };
    case "secret":
      return { secretName: database.secretName, secretKey };
    default:
      // autogenerated / vault: leave the chart defaults (vault handled via
      // Customize annotations until first-class support lands).
      return {};
  }
}

function buildOssValues(cfg: TestkubeConfig): Dict {
  const { core, database, artifacts, nats, endpoints } = cfg;
  const mongoInCluster = database.type === "mongodb" && !database.external;
  const pgInCluster = database.type === "postgresql" && !database.external;
  const mongoExternal = database.type === "mongodb" && database.external;
  const pgExternal = database.type === "postgresql" && database.external;
  const minioInCluster = artifacts.type === "minio" && !artifacts.external;

  const values: Dict = {
    mongodb: {
      enabled: mongoInCluster,
      ...(mongoInCluster ? { resources: resourcesToValues(database.resources) } : {}),
    },
    // The bundled PostgreSQL takes resources under `primary`, unlike MongoDB.
    postgresql: pgInCluster
      ? inClusterPostgres(database.resources)
      : { enabled: false },
    // NATS subchart config; the subchart is deployed via the
    // `testkube-api.nats.enabled` condition below.
    nats: nats.embedded
      ? {
          config: {
            jetstream: {
              enabled: nats.jetstreamEnabled,
              fileStore: {
                pvc: { enabled: nats.persistent, size: nats.storageSize },
              },
            },
          },
        }
      : {},
    "testkube-api": {
      enabled: core.api,
      uiIngress: {
        enabled: !endpoints.useKubernetesService && core.dashboard,
        host: endpoints.domain
          ? `${endpoints.uiSubdomain}.${endpoints.domain}`
          : "",
      },
      apiIngress: {
        enabled: !endpoints.useKubernetesService,
        host: endpoints.domain
          ? `${endpoints.apiSubdomain}.${endpoints.domain}`
          : "",
      },
      // MinIO lives under the API subchart in the OSS chart.
      minio: minioInCluster
        ? { enabled: true, resources: resourcesToValues(artifacts.resources) }
        : { enabled: false },
      // `enabled` here means "the API uses NATS"; `embedded` runs it in-binary.
      nats: nats.embedded
        ? { enabled: true }
        : { enabled: true, embedded: false, uri: nats.uri },
      // `enabled` here selects which store the API talks to, independently of
      // whether that store is deployed in-cluster or managed elsewhere.
      mongodb: {
        enabled: database.type === "mongodb",
        ...(mongoExternal ? ossExternalDbBlock(database) : {}),
      },
      postgresql: {
        enabled: database.type === "postgresql",
        ...(pgExternal ? ossExternalDbBlock(database) : {}),
      },
      storage: {
        endpoint: artifacts.external ? artifacts.endpoint : "",
        bucket: artifacts.bucket,
        region: artifacts.region,
        ...(artifacts.connectionMode === "manual"
          ? {
              accessKeyId: artifacts.accessKeyId,
              accessKey: artifacts.secretAccessKey,
            }
          : {}),
        ...(artifacts.connectionMode === "secret"
          ? {
              secretNameAccessKeyId: artifacts.secretName,
              secretKeyAccessKeyId: artifacts.accessKeyIdKey,
              secretNameSecretAccessKey: artifacts.secretName,
              secretKeySecretAccessKey: artifacts.secretAccessKeyKey,
            }
          : {}),
      },
    },
  };

  return prune(values);
}

export function buildValues(cfg: TestkubeConfig): Dict {
  const base = isEnterprise(cfg.initial.envType)
    ? buildEnterpriseValues(cfg)
    : buildOssValues(cfg);
  return applyAdvanced(base, cfg);
}

export function generateYaml(cfg: TestkubeConfig): string {
  const enterprise = isEnterprise(cfg.initial.envType);
  const orgsEnvs =
    cfg.initial.orgsEnvs
      .map((r) => `${r.organization || "?"}/${r.environment || "?"}`)
      .join(", ") || "(none)";
  const header = [
    "# ---------------------------------------------------------------------------",
    "# Testkube Helm values — generated by the Testkube Initializer",
    `# Company:     ${cfg.initial.companyName || "(not set)"}`,
    `# Admin email: ${cfg.initial.adminEmail || "(not set)"}`,
    `# Flavor:      ${enterprise ? "Enterprise" : "OSS"} (${cfg.initial.envType})`,
    `# Kubernetes:  ${cfg.initial.kubernetesType}`,
    `# License:     ${enterprise ? cfg.initial.licenseMode : "n/a"}`,
    `# Orgs/Envs:   ${orgsEnvs}`,
    `# Database:    ${cfg.database.type}${cfg.database.external ? " (external)" : " (in-cluster)"}`,
    `# Artifacts:   ${cfg.artifacts.type}${cfg.artifacts.external ? " (external)" : " (in-cluster)"} — ${connectionComment(cfg.artifacts.connectionMode)}`,
    `# Chart:       ${enterprise ? "testkube/testkube-enterprise" : "testkube/testkube"}`,
    "# ---------------------------------------------------------------------------",
    "",
  ].join("\n");

  const body = stringify(buildValues(cfg), { indent: 2, lineWidth: 0 });
  return `${header}${body}`;
}

export function downloadYaml(cfg: TestkubeConfig): void {
  download("values.yaml", generateYaml(cfg));
}

function download(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/yaml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Secrets handling
// ---------------------------------------------------------------------------

export interface PlaintextSecret {
  label: string;
  hint: string;
}

// Inline (plaintext) secrets that will be written into values.yaml as-is.
// Used to warn the user and nudge them toward "Existing Secret" mode.
export function detectPlaintextSecrets(cfg: TestkubeConfig): PlaintextSecret[] {
  const enterprise = isEnterprise(cfg.initial.envType);
  const out: PlaintextSecret[] = [];

  if (enterprise && cfg.initial.licenseMode === "online" && cfg.initial.licenseKey) {
    out.push({
      label: "Enterprise license key",
      hint: "global.enterpriseLicenseKey — consider Offline mode with a secret ref.",
    });
  }
  if (cfg.artifacts.connectionMode === "manual" && (cfg.artifacts.accessKeyId || cfg.artifacts.secretAccessKey)) {
    out.push({
      label: "Object storage access key / secret",
      hint: "Switch the Artifacts credentials source to \"Existing Secret\".",
    });
  }
  if (cfg.database.external && cfg.database.connectionMode === "manual" && cfg.database.connectionString) {
    out.push({
      label: "Database connection string",
      hint: "Switch the Database connection source to \"Existing Secret\".",
    });
  }
  if (enterprise && cfg.auth.dexEnabled && cfg.auth.clientSecret) {
    out.push({
      label: "OIDC/Dex client secret",
      hint: "auth client secret is written in plaintext.",
    });
  }
  if (enterprise && cfg.core.ai && cfg.ai.credentialSource === "inline" && cfg.ai.apiKey) {
    out.push({
      label: "LLM API key",
      hint: "Switch the AI credentials source to \"Existing Secret\".",
    });
  }
  if (
    enterprise &&
    cfg.core.ai &&
    cfg.ai.postgresMode === "external" &&
    !cfg.ai.postgresDsnSecretRef.trim() &&
    cfg.ai.postgresDsn
  ) {
    out.push({
      label: "AI PostgreSQL DSN",
      hint: "Provide the AI database DSN via an existing Secret instead.",
    });
  }
  return out;
}

interface SecretSkeleton {
  name: string;
  keys: string[];
}

// Kubernetes Secrets referenced via "Existing Secret" mode, that the user must
// create before installing. We emit a skeleton manifest with placeholders.
export function referencedSecrets(cfg: TestkubeConfig): SecretSkeleton[] {
  const enterprise = isEnterprise(cfg.initial.envType);
  const out: SecretSkeleton[] = [];

  if (cfg.artifacts.connectionMode === "secret" && cfg.artifacts.secretName) {
    out.push(
      enterprise
        ? { name: cfg.artifacts.secretName, keys: ["root-user", "root-password", "token"] }
        : {
            name: cfg.artifacts.secretName,
            keys: [cfg.artifacts.accessKeyIdKey, cfg.artifacts.secretAccessKeyKey],
          }
    );
  }
  if (
    cfg.database.external &&
    cfg.database.connectionMode === "secret" &&
    cfg.database.secretName
  ) {
    const key = enterprise
      ? cfg.database.type === "mongodb"
        ? "MONGO_DSN"
        : ENT_POSTGRES_DSN_KEY
      : cfg.database.type === "mongodb"
        ? "mongo-dsn"
        : "postgres-dsn";
    out.push({ name: cfg.database.secretName, keys: [key] });
  }
  if (
    enterprise &&
    cfg.core.ai &&
    cfg.ai.credentialSource === "secret" &&
    cfg.ai.apiKeySecretRef.trim()
  ) {
    out.push({
      name: cfg.ai.apiKeySecretRef.trim(),
      keys: [cfg.ai.apiKeySecretKey.trim() || "apiKey"],
    });
  }
  if (
    enterprise &&
    cfg.core.ai &&
    cfg.ai.postgresMode === "external" &&
    cfg.ai.postgresDsnSecretRef.trim()
  ) {
    out.push({
      name: cfg.ai.postgresDsnSecretRef.trim(),
      keys: [cfg.ai.postgresDsnSecretKey.trim() || "dsn"],
    });
  }
  return out;
}

export function generateSecretsYaml(cfg: TestkubeConfig): string {
  const secrets = referencedSecrets(cfg);
  if (secrets.length === 0) {
    return "# No 'Existing Secret' references configured.\n# Use the \"Existing Secret\" credential source in Artifacts/Database to populate this file.\n";
  }
  const header = [
    "# ---------------------------------------------------------------------------",
    "# Kubernetes Secrets referenced by your values.yaml.",
    "# Replace the REPLACE_ME placeholders and apply BEFORE installing the chart:",
    "#   kubectl apply -n <namespace> -f secrets.yaml",
    "# ---------------------------------------------------------------------------",
    "",
  ].join("\n");

  const docs = secrets.map((s) => {
    const data = s.keys.map((k) => `  ${k}: "REPLACE_ME"`).join("\n");
    return [
      "apiVersion: v1",
      "kind: Secret",
      "metadata:",
      `  name: ${s.name}`,
      "type: Opaque",
      "stringData:",
      data,
    ].join("\n");
  });

  return `${header}${docs.join("\n---\n")}\n`;
}

export function downloadSecrets(cfg: TestkubeConfig): void {
  download("secrets.yaml", generateSecretsYaml(cfg));
}

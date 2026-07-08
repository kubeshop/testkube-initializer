import { isEnterprise, type TestkubeConfig } from "../types/config";
import { isLabEnv, isProdEnv } from "./envPresets";

export interface Issue {
  id: string;
  step: number;
  message: string;
}

export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
}

const STEP = {
  initial: 0,
  core: 1,
  database: 2,
  artifacts: 3,
  nats: 4,
  auth: 5,
  endpoints: 6,
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;
const LOCAL_TLD_RE = /\.(local|test|invalid|localhost)$/i;

function isHttpUrl(value: string, allowHttp = false): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || (allowHttp && u.protocol === "http:");
  } catch {
    return false;
  }
}

export function validate(cfg: TestkubeConfig): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const enterprise = isEnterprise(cfg.initial.envType);
  const lab = isLabEnv(cfg.initial.envType);
  const prod = isProdEnv(cfg.initial.envType);
  const err = (id: string, step: number, message: string) =>
    errors.push({ id, step, message });
  const warn = (id: string, step: number, message: string) =>
    warnings.push({ id, step, message });

  // --- License (Enterprise) ---
  if (enterprise) {
    if (cfg.initial.licenseMode === "online" && !cfg.initial.licenseKey.trim()) {
      err("license-key", STEP.initial, "Enterprise license key is required (or switch to Offline mode).");
    }
    if (cfg.initial.licenseMode === "offline" && !cfg.initial.licenseSecretRef.trim()) {
      err("license-secret", STEP.initial, "License secret reference is required for offline activation.");
    }
  }

  // --- Endpoints / TLS ---
  const domain = cfg.endpoints.domain.trim();

  if (lab && domain) {
    warn(
      "lab-domain",
      STEP.endpoints,
      "Lab does not need a base domain — leave it empty for port-forward / in-cluster access."
    );
  }

  if (lab && cfg.endpoints.certManager) {
    warn(
      "lab-cert",
      STEP.endpoints,
      "cert-manager is usually disabled for Lab — it is turned off automatically when you select Lab."
    );
  }

  if (prod && cfg.endpoints.useKubernetesService) {
    warn(
      "prod-k8s-svc",
      STEP.endpoints,
      "Production normally uses Ingress (disable “Use Kubernetes Service”)."
    );
  }

  if (!lab && !cfg.endpoints.useKubernetesService && !domain) {
    err("domain", STEP.endpoints, "Base domain is required when exposing endpoints via Ingress.");
  }

  if (prod && domain && !DOMAIN_RE.test(domain)) {
    err(
      "domain-format",
      STEP.endpoints,
      "Base domain must be a valid hostname (e.g. testkube.example.com)."
    );
  }

  if (prod && domain && LOCAL_TLD_RE.test(domain)) {
    warn(
      "domain-tld",
      STEP.endpoints,
      "Domains like .local / .test are for lab use — prefer Lab, or use a real domain for Production."
    );
    if (
      cfg.endpoints.certManager &&
      cfg.endpoints.certManagerIssuerRef.trim() === "letsencrypt-prod"
    ) {
      warn(
        "issuer-local",
        STEP.endpoints,
        "letsencrypt-prod cannot issue certificates for .local — use an issuer that exists in your cluster (e.g. selfsigned for kind)."
      );
    }
  }

  if (
    cfg.endpoints.certManager &&
    !cfg.endpoints.certManagerIssuerRef.trim() &&
    !lab
  ) {
    err(
      "issuer",
      STEP.endpoints,
      "cert-manager ClusterIssuer / Issuer name is required (must exist in your cluster)."
    );
  }

  // --- Database (external) ---
  if (cfg.database.external) {
    const m = cfg.database.connectionMode;
    if (m === "manual" && !cfg.database.connectionString.trim()) {
      err("db-conn", STEP.database, "Database connection string is required in Manual mode.");
    }
    if (m === "secret" && !cfg.database.secretName.trim()) {
      err("db-secret", STEP.database, "Database Secret name is required in Existing Secret mode.");
    }
    if (m === "vault" && !cfg.database.vaultPath.trim()) {
      err("db-vault", STEP.database, "Database Vault path is required in Vault mode.");
    }
  }

  // --- Artifacts store ---
  if (cfg.artifacts.external && !cfg.artifacts.endpoint.trim()) {
    err("art-endpoint", STEP.artifacts, "Storage endpoint is required for external object storage.");
  }
  {
    const m = cfg.artifacts.connectionMode;
    if (m === "manual" && (!cfg.artifacts.accessKeyId.trim() || !cfg.artifacts.secretAccessKey.trim())) {
      err("art-creds", STEP.artifacts, "Access key ID and secret access key are required in Manual mode.");
    }
    if (m === "secret" && !cfg.artifacts.secretName.trim()) {
      err("art-secret", STEP.artifacts, "Storage Secret name is required in Existing Secret mode.");
    }
    if (m === "vault" && !cfg.artifacts.vaultPath.trim()) {
      err("art-vault", STEP.artifacts, "Storage Vault path is required in Vault mode.");
    }
  }

  // --- NATS ---
  if (!cfg.nats.embedded && !cfg.nats.uri.trim()) {
    err("nats-uri", STEP.nats, "External NATS URI is required when embedded NATS is disabled.");
  } else if (cfg.nats.embedded && cfg.nats.persistent && !cfg.nats.storageSize.trim()) {
    warn("nats-size", STEP.nats, "NATS persistent storage size is empty.");
  }

  // --- Authentication (Enterprise / Dex) ---
  if (enterprise && cfg.auth.dexEnabled) {
    const hasClient = cfg.auth.clientId.trim() && cfg.auth.clientSecret.trim();
    const needsUpstreamIssuer = cfg.auth.connector === "oidc";

    if (cfg.auth.issuerUrl.trim() && !isHttpUrl(cfg.auth.issuerUrl.trim(), lab)) {
      err(
        "dex-issuer-url",
        STEP.auth,
        "Dex issuer URL must be a full URL (https://…). Leave empty to auto-derive from your domain."
      );
    }

    if (hasClient && needsUpstreamIssuer && !cfg.auth.upstreamIssuerUrl.trim()) {
      err(
        "oidc-issuer",
        STEP.auth,
        "Upstream OIDC issuer URL is required when Client ID and Secret are set."
      );
    }

    if (cfg.auth.upstreamIssuerUrl.trim() && !isHttpUrl(cfg.auth.upstreamIssuerUrl.trim())) {
      err(
        "upstream-issuer-format",
        STEP.auth,
        "Upstream OIDC issuer must be a full HTTPS URL (e.g. https://login.microsoftonline.com/{tenant}/v2.0)."
      );
    }

    if (cfg.auth.connector === "ldap" && hasClient) {
      warn("ldap-config", STEP.auth, "LDAP connector requires extra Dex config — use Customize or the docs.");
    }

    if (prod && !hasClient && !cfg.endpoints.useKubernetesService) {
      warn(
        "auth-idp",
        STEP.auth,
        "No upstream IdP configured — static login will use Admin email (step 1) with password \"password\"."
      );
    }

    if (!cfg.initial.adminEmail.trim() && !hasClient) {
      warn(
        "auth-admin-email",
        STEP.auth,
        "Set Admin email in step 1 — it becomes the static login user when no IdP is configured."
      );
    }
  }

  // --- Identity / housekeeping (warnings) ---
  if (!cfg.initial.companyName.trim()) {
    warn("company", STEP.initial, "Company name is not set.");
  }
  if (!cfg.initial.adminEmail.trim()) {
    warn("admin-email", STEP.initial, "Admin email is not set.");
  } else if (!EMAIL_RE.test(cfg.initial.adminEmail.trim())) {
    warn("admin-email-fmt", STEP.initial, "Admin email does not look like a valid address.");
  }
  if (cfg.initial.orgsEnvs.some((r) => !r.organization.trim() || !r.environment.trim())) {
    warn("orgs", STEP.initial, "Some organization / environment rows are incomplete.");
  }

  return { errors, warnings };
}

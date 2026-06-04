import { isEnterprise, type TestkubeConfig } from "../types/config";

export interface Issue {
  id: string;
  // Wizard step index this issue belongs to (for "Go to step").
  step: number;
  message: string;
}

export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
}

// Step indices (must match the order in App / STEPS).
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

// Validates the configuration. `errors` are blocking (missing required values
// that would break the install); `warnings` are non-blocking consistency hints.
export function validate(cfg: TestkubeConfig): ValidationResult {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const enterprise = isEnterprise(cfg.initial.envType);
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
  if (!cfg.endpoints.useKubernetesService && !cfg.endpoints.domain.trim()) {
    err("domain", STEP.endpoints, "Base domain is required when exposing endpoints via Ingress.");
  }
  if (cfg.endpoints.certManager && !cfg.endpoints.certManagerIssuerRef.trim()) {
    err("issuer", STEP.endpoints, "cert-manager issuer reference is required when cert-manager is enabled.");
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
    if (!cfg.auth.issuerUrl.trim()) {
      warn("dex-issuer", STEP.auth, "Dex issuer URL is not set.");
    }
    const needsClient = ["oidc", "google", "github", "gitlab"].includes(cfg.auth.connector);
    if (needsClient && (!cfg.auth.clientId.trim() || !cfg.auth.clientSecret.trim())) {
      warn("dex-client", STEP.auth, `Connector "${cfg.auth.connector}" usually needs a client ID and secret.`);
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

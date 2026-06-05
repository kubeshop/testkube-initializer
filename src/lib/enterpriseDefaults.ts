import type { AuthConnectorType, TestkubeConfig } from "../types/config";

// Service hostnames come from the chart's fullnameOverride values (not the Helm
// release name). Keep in sync with testkube-enterprise/values.yaml.
export const ENT_SVC = {
  minio: "testkube-enterprise-minio",
  api: "testkube-enterprise-api",
  dex: "testkube-enterprise-dex",
  ui: "testkube-enterprise-ui",
} as const;

export const ENT_SECRETS = {
  minio: "testkube-minio-credentials",
  master: "testkube-credentials-master",
  agentToken: "testkube-default-agent-token",
  dexConfig: "testkube-enterprise-dex-config",
} as const;

// Chart default OAuth client secret for the Dex static client.
const OAUTH_CLIENT_SECRET = "QWkVzs3nct6HZM5hxsPzwaZtq";

// bcrypt hash of the string "password" — used for lab / internal static users.
const STATIC_PASSWORD_HASH =
  "$2a$10$2b2cU8CPhOTaGrs1HRQuAueS7JTT5ZHsHSzYiFPm1leZck7Mc8T4W";

export function isInternalAccess(cfg: TestkubeConfig): boolean {
  return cfg.endpoints.useKubernetesService || !cfg.endpoints.domain.trim();
}

export function dexIssuerUrl(cfg: TestkubeConfig): string {
  if (cfg.auth.issuerUrl.trim()) return cfg.auth.issuerUrl.trim();
  if (!isInternalAccess(cfg)) {
    return `https://${cfg.endpoints.apiSubdomain}.${cfg.endpoints.domain}/idp`;
  }
  return "http://localhost:5556";
}

function dexIdpCallbackUrl(cfg: TestkubeConfig): string {
  if (!isInternalAccess(cfg)) {
    return `https://${cfg.endpoints.apiSubdomain}.${cfg.endpoints.domain}/idp/callback`;
  }
  return "http://localhost:5556/idp/callback";
}

export function bootstrapOrgEnv(cfg: TestkubeConfig): { org: string; env: string } {
  const row = cfg.initial.orgsEnvs.find(
    (r) => r.organization.trim() && r.environment.trim()
  );
  return {
    org: row?.organization.trim() || "default",
    env: row?.environment.trim() || "production",
  };
}

function minioInCluster(cfg: TestkubeConfig): boolean {
  return cfg.artifacts.type === "minio" && !cfg.artifacts.external;
}

function buildDexConnector(cfg: TestkubeConfig): string | null {
  const { connector, clientId, clientSecret, upstreamIssuerUrl } = cfg.auth;
  if (!clientId.trim() || !clientSecret.trim()) return null;

  const callback = dexIdpCallbackUrl(cfg);
  const id = clientId.trim();
  const secret = clientSecret.trim();

  switch (connector as AuthConnectorType) {
    case "google":
      return `connectors:
  - type: google
    id: google
    name: Google
    config:
      clientID: ${id}
      clientSecret: ${secret}
      redirectURI: ${callback}`;
    case "github":
      return `connectors:
  - type: github
    id: github
    name: GitHub
    config:
      clientID: ${id}
      clientSecret: ${secret}
      redirectURI: ${callback}`;
    case "gitlab":
      return `connectors:
  - type: gitlab
    id: gitlab
    name: GitLab
    config:
      clientID: ${id}
      clientSecret: ${secret}
      redirectURI: ${callback}`;
    case "ldap":
      return null; // LDAP needs extra fields; use Customize or docs.
    case "oidc":
    default: {
      const issuer = upstreamIssuerUrl.trim();
      if (!issuer) return null;
      return `connectors:
  - type: oidc
    id: oidc
    name: OIDC
    config:
      issuer: ${issuer}
      clientID: ${id}
      clientSecret: ${secret}
      redirectURI: ${callback}`;
    }
  }
}

function buildStaticPasswords(cfg: TestkubeConfig): string {
  const email = cfg.initial.adminEmail.trim() || "admin@example.com";
  return `enablePasswordDB: true
staticPasswords:
  - email: "${email}"
    hash: "${STATIC_PASSWORD_HASH}"
    username: "admin"
    userID: "08a8684b-db88-4b73-90a9-3cd1661f5466"`;
}

export function buildDexAdditionalConfig(cfg: TestkubeConfig): string {
  const connector = buildDexConnector(cfg);
  if (connector) return connector;
  // Fallback static user so Dex always has a connector and the install is functional.
  return buildStaticPasswords(cfg);
}

export function buildEnterpriseApiEnv(cfg: TestkubeConfig): Record<string, string | boolean> {
  if (!isInternalAccess(cfg)) return {};

  const issuer = dexIssuerUrl(cfg);
  return {
    OAUTH_ENABLED: true,
    OAUTH_SKIP_DISCOVERY: true,
    OAUTH_AUTH_URL: `${issuer}/auth`,
    OAUTH_TOKEN_URL: `http://${ENT_SVC.dex}:5556/token`,
    OAUTH_USER_INFO_URL: `http://${ENT_SVC.dex}:5556/userinfo`,
    OAUTH_JWKS_URL: `http://${ENT_SVC.dex}:5556/keys`,
    DEX_SIGNUP_ORIGIN: `${ENT_SVC.dex}:5557`,
  };
}

export function buildEnterpriseApiBlock(cfg: TestkubeConfig): Record<string, unknown> {
  const internal = isInternalAccess(cfg);
  const { org, env } = bootstrapOrgEnv(cfg);
  const oauthClientId = cfg.auth.clientId.trim() || "testkube-enterprise";

  const api: Record<string, unknown> = {
    migrations: { enabled: true },
    features: {
      disablePersonalOrgs: true,
      bootstrapOrg: org,
      bootstrapEnv: env,
      bootstrapAgentTokenSecretRef: ENT_SECRETS.agentToken,
    },
    agent: {
      host: internal ? ENT_SVC.api : "",
      port: internal ? 8089 : 443,
    },
    tls: { serveHTTPS: false },
    oauth: {
      secretRef: "",
      clientId: oauthClientId,
      clientSecret: OAUTH_CLIENT_SECRET,
      redirectUri: internal
        ? "http://localhost:8090/auth/callback"
        : "",
      issuerUrl: "",
      ...(internal ? { allowedExternalRedirectURIs: "http://localhost:*" } : {}),
    },
    outputsBucket: "testkube-cloud-outputs",
  };

  if (internal) {
    api.dashboardAddress = "http://localhost:8080";
    api.apiAddress = "http://localhost:8090";
  }

  return api;
}

export function buildEnterpriseUiBlock(cfg: TestkubeConfig): Record<string, unknown> {
  const internal = isInternalAccess(cfg);
  const ui: Record<string, unknown> = {
    authStrategy: "",
    rootRoute: `http://${ENT_SVC.ui}:8080`,
  };

  if (internal) {
    ui.apiServerEndpoint = "http://localhost:8090";
    ui.wsServerEndpoint = "ws://localhost:8090";
  }

  return {
    ui,
    additionalEnv: { REACT_APP_ENABLE_SIGNUP: "true" },
  };
}

export function buildEnterpriseStorage(cfg: TestkubeConfig): Record<string, unknown> {
  const { artifacts } = cfg;
  const internal = isInternalAccess(cfg);
  const storage: Record<string, unknown> = {
    region: artifacts.region,
    outputsBucket: artifacts.bucket,
  };

  if (minioInCluster(cfg)) {
    storage.endpoint = `${ENT_SVC.minio}:9000`;
    storage.secure = false;
    if (artifacts.connectionMode === "autogenerated") {
      storage.credsSecretRef = ENT_SECRETS.minio;
    } else if (artifacts.connectionMode === "secret" && artifacts.secretName) {
      storage.credsSecretRef = artifacts.secretName;
    }
    if (internal) {
      storage.public = { endpoint: "localhost:9000", secure: false };
    }
  } else if (artifacts.external && artifacts.endpoint) {
    storage.endpoint = artifacts.endpoint;
    if (artifacts.connectionMode === "manual") {
      storage.accessKeyId = artifacts.accessKeyId;
      storage.secretAccessKey = artifacts.secretAccessKey;
    } else if (artifacts.connectionMode === "secret" && artifacts.secretName) {
      storage.credsSecretRef = artifacts.secretName;
    }
  }

  return storage;
}

export function buildEnterpriseDexBlock(cfg: TestkubeConfig): Record<string, unknown> {
  const internal = isInternalAccess(cfg);
  const additionalConfig = buildDexAdditionalConfig(cfg);

  return {
    enabled: cfg.auth.dexEnabled,
    ingress: { enabled: !internal && !cfg.endpoints.useKubernetesService },
    configSecret: {
      create: false,
      createCustom: true,
      name: ENT_SECRETS.dexConfig,
    },
    ...(internal ? { storage: { type: "memory" } } : {}),
    grpc: { enabled: true },
    configTemplate: {
      customConfig: "",
      additionalConfig,
      // Only needed for internal mode; ingress mode uses chart template redirect URIs.
      ...(internal
        ? {
            additionalStaticClients: [
              {
                id: "testkube-enterprise",
                redirectURIs: [
                  "http://localhost:8090/auth/callback",
                  "http://localhost:38090/auth/callback",
                  "http://localhost:8090/mcp/auth/callback",
                ],
                name: "Testkube",
                secret: OAUTH_CLIENT_SECRET,
              },
              {
                id: "testkube-cloud-cli",
                name: "Testkube Enterprise CLI",
                public: true,
                redirectURIs: [
                  "http://127.0.0.1:8090/callback",
                  "http://127.0.0.1:38090/callback",
                ],
              },
            ],
          }
        : {}),
    },
  };
}

export { minioInCluster, OAUTH_CLIENT_SECRET };

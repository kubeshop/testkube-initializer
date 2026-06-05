// Generates a working LOCAL Testkube Enterprise values.yaml with SSO (Dex,
// static password) for a kind cluster accessed via port-forward.
//
// The structural base comes from the app generator (buildValues); the local
// SSO wiring (Dex static clients/passwords, OAuth env, localhost addresses,
// secret refs) is overlaid on top — the bits the wizard doesn't model yet.
//
// Run: npx tsx scripts/gen-local-sso.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";
import { buildValues } from "../src/lib/yaml";
import { defaultConfig } from "../src/lib/defaults";
import type { TestkubeConfig } from "../src/types/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "samples");
mkdirSync(outDir, { recursive: true });

const LICENSE = "66B620-0F58A8-B53956-5D98BA-EB5530-V3";
// Release name assumed below (service hostnames are <release>-<component>).
const RELEASE = "testkube-enterprise";

const cfg: TestkubeConfig = {
  ...defaultConfig,
  initial: {
    ...defaultConfig.initial,
    companyName: "Local Lab",
    adminEmail: "admin@example.com",
    envType: "enterprise-prod",
    licenseMode: "online",
    licenseKey: LICENSE,
  },
  core: { dashboard: true, api: true, workerService: true, ai: false },
  auth: {
    ...defaultConfig.auth,
    dexEnabled: true,
    connector: "oidc",
    issuerUrl: "http://localhost:5556",
    adminEmails: "admin@example.com",
  },
  endpoints: {
    ...defaultConfig.endpoints,
    domain: "",
    useKubernetesService: true, // no Ingress; access via port-forward
    certManager: false,
  },
};

type Dict = Record<string, unknown>;
function deepMerge(target: Dict, source: Dict): Dict {
  for (const [k, v] of Object.entries(source)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      target[k] &&
      typeof target[k] === "object" &&
      !Array.isArray(target[k])
    ) {
      deepMerge(target[k] as Dict, v as Dict);
    } else {
      target[k] = v;
    }
  }
  return target;
}

// Local SSO wiring (mirrors the proven local example).
const localExtras: Dict = {
  global: {
    enterpriseLicenseKey: LICENSE,
    ingress: { enabled: false },
    dex: { issuer: "http://localhost:5556" },
    storage: {
      endpoint: `${RELEASE}-minio:9000`,
      region: "eu-west-1",
      public: { endpoint: "localhost:9000", secure: false },
      credsSecretRef: "testkube-minio-credentials",
      secure: false,
    },
    credentials: {
      masterPassword: { secretKeyRef: { name: "testkube-credentials-master" } },
    },
  },
  sharedSecretGenerator: { enabled: true },
  "testkube-cloud-api": {
    additionalEnv: {
      OAUTH_ENABLED: true,
      OAUTH_SKIP_DISCOVERY: true,
      OAUTH_AUTH_URL: "http://localhost:5556/auth",
      OAUTH_TOKEN_URL: `http://${RELEASE}-dex:5556/token`,
      OAUTH_USER_INFO_URL: `http://${RELEASE}-dex:5556/userinfo`,
      OAUTH_JWKS_URL: `http://${RELEASE}-dex:5556/keys`,
      DEX_SIGNUP_ORIGIN: `${RELEASE}-dex:5557`,
    },
    api: {
      migrations: { enabled: true },
      features: {
        disablePersonalOrgs: true,
        bootstrapOrg: "demo",
        bootstrapEnv: "my-first-environment",
        bootstrapAgentTokenSecretRef: "testkube-default-agent-token",
      },
      agent: { host: `${RELEASE}-api`, port: 8089 },
      tls: { serveHTTPS: false },
      oauth: {
        secretRef: "",
        clientId: "testkube-enterprise",
        clientSecret: "QWkVzs3nct6HZM5hxsPzwaZtq",
        redirectUri: "http://localhost:8090/auth/callback",
        issuerUrl: "",
        allowedExternalRedirectURIs: "http://localhost:*",
      },
      dashboardAddress: "http://localhost:8080",
      apiAddress: "http://localhost:8090",
      outputsBucket: "testkube-cloud-outputs",
    },
    prometheus: { enabled: false },
  },
  "testkube-cloud-ui": {
    ui: {
      authStrategy: "",
      apiServerEndpoint: "http://localhost:8090",
      wsServerEndpoint: "ws://localhost:8090",
      rootRoute: `http://${RELEASE}-ui:8080`,
    },
    additionalEnv: { REACT_APP_ENABLE_SIGNUP: "true" },
  },
  "testkube-worker-service": { additionalEnv: { USE_MINIO: true } },
  nats: { config: { cluster: { enabled: false } } },
  minio: { auth: { existingSecret: "testkube-minio-credentials" } },
  dex: {
    ingress: { enabled: false },
    configSecret: { create: false, createCustom: true, name: `${RELEASE}-dex-config` },
    storage: { type: "memory" },
    grpc: { enabled: true },
    configTemplate: {
      customConfig: "",
      additionalStaticClients: [
        {
          id: "testkube-enterprise",
          redirectURIs: [
            "http://localhost:8090/auth/callback",
            "http://localhost:38090/auth/callback",
          ],
          name: "Testkube",
          secret: "QWkVzs3nct6HZM5hxsPzwaZtq",
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
      // admin@example.com / password
      additionalConfig:
        'enablePasswordDB: true\nstaticPasswords:\n  - email: "admin@example.com"\n    hash: "$2a$10$2b2cU8CPhOTaGrs1HRQuAueS7JTT5ZHsHSzYiFPm1leZck7Mc8T4W"\n    username: "admin"\n    userID: "08a8684b-db88-4b73-90a9-3cd1661f5466"\n',
    },
  },
};

const merged = deepMerge(buildValues(cfg) as Dict, localExtras);

const header = [
  "# ---------------------------------------------------------------------------",
  "# Testkube Enterprise — LOCAL values with SSO (Dex static password)",
  "# Release name (required):  testkube-enterprise",
  "# Login:  admin@example.com / password",
  "# Access: port-forward (see deploy steps). No Ingress.",
  "# Pre-create the Secrets in enterprise-local-secrets.yaml before installing.",
  "# ---------------------------------------------------------------------------",
  "",
].join("\n");

writeFileSync(
  resolve(outDir, "enterprise-local-sso.yaml"),
  header + stringify(merged, { indent: 2, lineWidth: 0 })
);

// Pre-requisite Secrets (sample local values; change for anything real).
const secrets = `# Pre-requisite Secrets for the local Enterprise SSO install.
# kubectl create namespace testkube
# kubectl apply -n testkube -f enterprise-local-secrets.yaml
---
apiVersion: v1
kind: Secret
metadata:
  name: testkube-minio-credentials
type: Opaque
stringData:
  root-user: "minio"
  root-password: "minio123"
  token: ""
---
apiVersion: v1
kind: Secret
metadata:
  name: testkube-credentials-master
type: Opaque
stringData:
  password: "local-master-password-change-me"
---
apiVersion: v1
kind: Secret
metadata:
  name: testkube-default-agent-token
type: Opaque
stringData:
  token: "local-agent-token-change-me"
`;
writeFileSync(resolve(outDir, "enterprise-local-secrets.yaml"), secrets);

console.log("Wrote samples/enterprise-local-sso.yaml and samples/enterprise-local-secrets.yaml");

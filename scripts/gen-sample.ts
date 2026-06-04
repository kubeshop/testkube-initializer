// Generates sample values.yaml files using the app's own generator, so we can
// test the real output against a cluster. Run: npx tsx scripts/gen-sample.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSecretsYaml, generateYaml } from "../src/lib/yaml";
import { defaultConfig } from "../src/lib/defaults";
import type { TestkubeConfig } from "../src/types/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "samples");
mkdirSync(outDir, { recursive: true });

// OSS, everything in-cluster, wired via Kubernetes Services (no Ingress / TLS) —
// the realistic "works on kind out of the box" scenario.
const oss: TestkubeConfig = {
  ...defaultConfig,
  initial: {
    ...defaultConfig.initial,
    companyName: "Kind Lab",
    adminEmail: "admin@kind.local",
    kubernetesType: "onprem",
    envType: "oss",
  },
  endpoints: {
    ...defaultConfig.endpoints,
    domain: "",
    useKubernetesService: true,
    certManager: false,
  },
};

// Enterprise sample (validated via `helm template`, not installed on kind).
const enterprise: TestkubeConfig = {
  ...defaultConfig,
  initial: {
    ...defaultConfig.initial,
    companyName: "Kind Lab",
    adminEmail: "admin@kind.local",
    envType: "enterprise-prod",
    licenseMode: "online",
    licenseKey: "REPLACE-WITH-LICENSE",
  },
  endpoints: {
    ...defaultConfig.endpoints,
    domain: "testkube.local",
    certManager: false,
  },
};

// OSS with the HA preset applied (advanced overrides), to validate the new
// scheduling / replicas / PDB fields render against the chart.
const ossHa: TestkubeConfig = {
  ...oss,
  advanced: {
    "global.podDisruptionBudget.enabled": true,
    "global.affinity":
      "podAntiAffinity:\n  preferredDuringSchedulingIgnoredDuringExecution:\n    - weight: 100\n      podAffinityTerm:\n        topologyKey: kubernetes.io/hostname\n        labelSelector: {}",
    "global.tolerations":
      "- key: dedicated\n  operator: Equal\n  value: testkube\n  effect: NoSchedule",
    "testkube-operator.replicaCount": "2",
  },
};

// OSS with external S3 referenced via an existing Secret (no plaintext creds).
const ossSecret: TestkubeConfig = {
  ...oss,
  artifacts: {
    ...oss.artifacts,
    type: "s3",
    external: true,
    endpoint: "s3.amazonaws.com",
    connectionMode: "secret",
    secretName: "testkube-storage-credentials",
  },
};

// Enterprise with storage creds + mongo DSN referenced via existing Secrets.
const entSecret: TestkubeConfig = {
  ...enterprise,
  database: {
    ...enterprise.database,
    external: true,
    connectionMode: "secret",
    secretName: "testkube-mongo-dsn",
  },
  artifacts: {
    ...enterprise.artifacts,
    external: true,
    endpoint: "s3.amazonaws.com",
    connectionMode: "secret",
    secretName: "testkube-storage-credentials",
  },
};

writeFileSync(resolve(outDir, "oss-kind.yaml"), generateYaml(oss));
writeFileSync(resolve(outDir, "oss-ha.yaml"), generateYaml(ossHa));
writeFileSync(resolve(outDir, "oss-secret.yaml"), generateYaml(ossSecret));
writeFileSync(resolve(outDir, "enterprise.yaml"), generateYaml(enterprise));
writeFileSync(resolve(outDir, "ent-secret.yaml"), generateYaml(entSecret));
writeFileSync(resolve(outDir, "ent-secrets-template.yaml"), generateSecretsYaml(entSecret));
console.log("Wrote samples/* (incl. secret variants)");

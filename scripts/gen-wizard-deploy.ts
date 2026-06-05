// Writes deploy-ready values.yaml exactly as the wizard page would, for cluster
// validation. No manual YAML overlays — only TestkubeConfig → generateYaml().
//
// Run: npx tsx scripts/gen-wizard-deploy.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateYaml } from "../src/lib/yaml";
import { defaultConfig } from "../src/lib/defaults";
import type { TestkubeConfig } from "../types/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "samples");
mkdirSync(outDir, { recursive: true });

// Example license for local / CI validation only.
const EXAMPLE_LICENSE = "66B620-0F58A8-B53956-5D98BA-EB5530-V3";

/** Wizard defaults + the minimum fields a user must fill in. Internal access (kind / no Ingress). */
const enterpriseKind: TestkubeConfig = {
  ...defaultConfig,
  initial: {
    ...defaultConfig.initial,
    companyName: "Acme Corp",
    adminEmail: "admin@example.com",
    envType: "enterprise-lab",
    licenseMode: "online",
    licenseKey: EXAMPLE_LICENSE,
  },
  endpoints: {
    ...defaultConfig.endpoints,
    domain: "",
    useKubernetesService: true,
    certManager: false,
  },
};

/** Wizard defaults + production-style Ingress (AKS / GKE / on-prem with domain). */
const enterpriseProd: TestkubeConfig = {
  ...defaultConfig,
  initial: {
    ...defaultConfig.initial,
    companyName: "Acme Corp",
    adminEmail: "admin@acme.com",
    envType: "enterprise-prod",
    licenseMode: "online",
    licenseKey: "REPLACE-WITH-LICENSE",
  },
  endpoints: {
    ...defaultConfig.endpoints,
    domain: "testkube.example.com",
    useKubernetesService: false,
    certManager: false,
  },
};

/** OSS wizard defaults for in-cluster kind deploy. */
const ossKind: TestkubeConfig = {
  ...defaultConfig,
  initial: {
    ...defaultConfig.initial,
    companyName: "Acme Corp",
    adminEmail: "admin@acme.com",
    envType: "oss",
  },
  endpoints: {
    ...defaultConfig.endpoints,
    domain: "",
    useKubernetesService: true,
    certManager: false,
  },
};

writeFileSync(resolve(outDir, "wizard-enterprise-kind.yaml"), generateYaml(enterpriseKind));
writeFileSync(resolve(outDir, "wizard-enterprise-prod.yaml"), generateYaml(enterpriseProd));
writeFileSync(resolve(outDir, "wizard-oss-kind.yaml"), generateYaml(ossKind));

console.log("Wrote samples/wizard-enterprise-kind.yaml");
console.log("Wrote samples/wizard-enterprise-prod.yaml");
console.log("Wrote samples/wizard-oss-kind.yaml");

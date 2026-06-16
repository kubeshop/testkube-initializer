import type { EnvType, TestkubeConfig } from "../types/config";

export function isLabEnv(envType: EnvType): boolean {
  return envType === "enterprise-lab";
}

export function isProdEnv(envType: EnvType): boolean {
  return envType === "enterprise-prod";
}

/** Endpoint defaults when switching to Ent. Lab (kind / port-forward). */
export function labEndpointPatch(): Pick<
  TestkubeConfig["endpoints"],
  "domain" | "useKubernetesService" | "certManager"
> {
  return {
    domain: "",
    useKubernetesService: true,
    certManager: false,
  };
}

/** Endpoint defaults when switching to Ent. Prod (Ingress + TLS). */
export function prodEndpointPatch(): Pick<
  TestkubeConfig["endpoints"],
  "useKubernetesService" | "certManager"
> {
  return {
    useKubernetesService: false,
    certManager: true,
  };
}

/** Endpoint defaults when switching to OSS (no Enterprise TLS/cert assumptions). */
export function ossEndpointPatch(): Pick<
  TestkubeConfig["endpoints"],
  "useKubernetesService" | "certManager"
> {
  return {
    useKubernetesService: false,
    certManager: false,
  };
}

/** Build https/wss public URLs from domain + subdomains. */
export function publicEndpointUrls(cfg: TestkubeConfig): {
  api: string;
  ui: string;
  ws: string;
  dex: string;
} {
  const { domain, apiSubdomain, uiSubdomain, websocketsSubdomain } = cfg.endpoints;
  const d = domain.trim();
  const api = `${apiSubdomain}.${d}`;
  return {
    api: `https://${api}`,
    ui: `https://${uiSubdomain}.${d}`,
    ws: `wss://${websocketsSubdomain}.${d}`,
    dex: `https://${api}/idp`,
  };
}

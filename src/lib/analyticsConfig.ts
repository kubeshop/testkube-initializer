import { generateYaml } from "./yaml";
import { captureEvent, type AnalyticsProps } from "./analytics";
import type { TestkubeConfig } from "../types/config";

/** Anonymous config profile — no license keys, emails, domains, DSNs, or YAML body. */
export function safeConfigSnapshot(config: TestkubeConfig): AnalyticsProps {
  const yaml = generateYaml(config);
  return {
    env_type: config.initial.envType,
    kubernetes_type: config.initial.kubernetesType,
    license_mode: config.initial.licenseMode,
    org_env_row_count: config.initial.orgsEnvs.length,
    core_dashboard: config.core.dashboard,
    core_api: config.core.api,
    core_worker: config.core.workerService,
    core_ai: config.core.ai,
    ai_provider: config.core.ai ? config.ai.provider : undefined,
    ai_credential_source: config.core.ai ? config.ai.credentialSource : undefined,
    ai_postgres_mode: config.core.ai ? config.ai.postgresMode : undefined,
    database_type: config.database.type,
    database_external: config.database.external,
    database_connection_mode: config.database.connectionMode,
    artifacts_type: config.artifacts.type,
    artifacts_external: config.artifacts.external,
    artifacts_connection_mode: config.artifacts.connectionMode,
    nats_embedded: config.nats.embedded,
    nats_jetstream: config.nats.jetstreamEnabled,
    nats_persistent: config.nats.persistent,
    auth_connector: config.auth.connector,
    dex_enabled: config.auth.dexEnabled,
    cert_manager: config.endpoints.certManager,
    exposure_mode: config.endpoints.exposureMode,
    use_kubernetes_service: config.endpoints.useKubernetesService,
    has_domain: Boolean(config.endpoints.domain.trim()),
    advanced_override_count: Object.keys(config.advanced).filter((k) => {
      const v = config.advanced[k];
      return v !== undefined && v !== "" && v !== false;
    }).length,
    yaml_line_count: yaml.split("\n").length,
  };
}

function envType(config: TestkubeConfig): string {
  return config.initial.envType;
}

export function trackConfigUpdate(
  key: keyof TestkubeConfig,
  patch: Partial<TestkubeConfig[keyof TestkubeConfig]>,
  prev: TestkubeConfig
): void {
  const env = envType(prev);

  if (key === "initial") {
    const p = patch as Partial<TestkubeConfig["initial"]>;
    if (p.kubernetesType !== undefined && p.kubernetesType !== prev.initial.kubernetesType) {
      captureEvent("kubernetes_type_selected", {
        kubernetes_type: p.kubernetesType,
        env_type: env,
      });
    }
    if (p.licenseMode !== undefined && p.licenseMode !== prev.initial.licenseMode) {
      captureEvent("license_mode_selected", {
        license_mode: p.licenseMode,
        env_type: env,
      });
    }
    if (p.orgsEnvs && p.orgsEnvs.length > prev.initial.orgsEnvs.length) {
      captureEvent("org_env_row_added", {
        row_count: p.orgsEnvs.length,
        env_type: env,
      });
    }
    return;
  }

  if (key === "core") {
    const p = patch as Partial<TestkubeConfig["core"]>;
    for (const component of ["dashboard", "api", "workerService", "ai"] as const) {
      const next = p[component];
      if (next !== undefined && next !== prev.core[component]) {
        captureEvent("core_component_toggled", {
          component: component === "workerService" ? "worker" : component,
          enabled: next,
          env_type: env,
        });
      }
    }
    return;
  }

  if (key === "database") {
    const p = patch as Partial<TestkubeConfig["database"]>;
    if (p.type !== undefined && p.type !== prev.database.type) {
      captureEvent("database_type_selected", { database_type: p.type, env_type: env });
    }
    if (p.external !== undefined && p.external !== prev.database.external) {
      captureEvent("database_external_toggled", { external: p.external, env_type: env });
    }
    if (p.connectionMode !== undefined && p.connectionMode !== prev.database.connectionMode) {
      captureEvent("database_connection_mode_selected", {
        connection_mode: p.connectionMode,
        env_type: env,
      });
    }
    return;
  }

  if (key === "artifacts") {
    const p = patch as Partial<TestkubeConfig["artifacts"]>;
    if (p.type !== undefined && p.type !== prev.artifacts.type) {
      captureEvent("artifacts_type_selected", { artifacts_type: p.type, env_type: env });
    }
    if (p.external !== undefined && p.external !== prev.artifacts.external) {
      captureEvent("artifacts_external_toggled", { external: p.external, env_type: env });
    }
    if (p.connectionMode !== undefined && p.connectionMode !== prev.artifacts.connectionMode) {
      captureEvent("artifacts_connection_mode_selected", {
        connection_mode: p.connectionMode,
        env_type: env,
      });
    }
    return;
  }

  if (key === "nats") {
    const p = patch as Partial<TestkubeConfig["nats"]>;
    if (p.embedded !== undefined && p.embedded !== prev.nats.embedded) {
      captureEvent("nats_embedded_toggled", { embedded: p.embedded, env_type: env });
    }
    if (p.jetstreamEnabled !== undefined && p.jetstreamEnabled !== prev.nats.jetstreamEnabled) {
      captureEvent("nats_jetstream_toggled", {
        jetstream_enabled: p.jetstreamEnabled,
        env_type: env,
      });
    }
    if (p.persistent !== undefined && p.persistent !== prev.nats.persistent) {
      captureEvent("nats_persistent_toggled", { persistent: p.persistent, env_type: env });
    }
    return;
  }

  if (key === "auth") {
    const p = patch as Partial<TestkubeConfig["auth"]>;
    if (p.connector !== undefined && p.connector !== prev.auth.connector) {
      captureEvent("auth_connector_selected", { connector: p.connector, env_type: env });
    }
    if (p.dexEnabled !== undefined && p.dexEnabled !== prev.auth.dexEnabled) {
      captureEvent("dex_toggled", { dex_enabled: p.dexEnabled, env_type: env });
    }
    return;
  }

  if (key === "endpoints") {
    const p = patch as Partial<TestkubeConfig["endpoints"]>;
    if (p.certManager !== undefined && p.certManager !== prev.endpoints.certManager) {
      captureEvent("endpoints_cert_manager_toggled", {
        cert_manager: p.certManager,
        env_type: env,
      });
    }
    if (
      p.useKubernetesService !== undefined &&
      p.useKubernetesService !== prev.endpoints.useKubernetesService
    ) {
      captureEvent("endpoints_k8s_service_toggled", {
        use_kubernetes_service: p.useKubernetesService,
        env_type: env,
      });
    }
    if (p.domain !== undefined) {
      const had = Boolean(prev.endpoints.domain.trim());
      const has = Boolean(p.domain.trim());
      if (had !== has) {
        captureEvent("domain_configured", { has_domain: has, env_type: env });
      }
    }
  }
}

export function trackAdvancedFieldChange(
  config: TestkubeConfig,
  path: string,
  stepId?: string
): void {
  captureEvent("advanced_field_changed", {
    field_path: path,
    step_id: stepId,
    env_type: config.initial.envType,
  });
}

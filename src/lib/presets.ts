import { isEnterprise, type AdvancedScalar, type TestkubeConfig } from "../types/config";

// Soft anti-affinity that spreads pods across nodes (best-effort). Stored as
// raw YAML in the global.affinity advanced override.
const HA_AFFINITY = `podAntiAffinity:
  preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        topologyKey: kubernetes.io/hostname
        labelSelector: {}`;

// Applies a sensible High-Availability baseline via the advanced overrides:
// PodDisruptionBudgets, 2 replicas for stateless components, and pod
// anti-affinity. Tune further in the Customize panels afterwards.
export function applyHaPreset(
  config: TestkubeConfig,
  set: (path: string, value: AdvancedScalar) => void
): void {
  set("global.podDisruptionBudget.enabled", true);
  set("global.affinity", HA_AFFINITY);
  if (isEnterprise(config.initial.envType)) {
    set("testkube-cloud-api.replicaCount", "2");
    set("testkube-cloud-ui.replicaCount", "2");
    set("testkube-worker-service.replicaCount", "2");
  } else {
    set("testkube-api.replicaCount", "2");
  }
}

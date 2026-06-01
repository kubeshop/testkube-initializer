import type { AdvancedScalar, TestkubeConfig } from "../types/config";

export interface StepProps {
  config: TestkubeConfig;
  update: <K extends keyof TestkubeConfig>(
    key: K,
    patch: Partial<TestkubeConfig[K]>
  ) => void;
  setAdvanced: (path: string, value: AdvancedScalar) => void;
  goToStep?: (index: number) => void;
}

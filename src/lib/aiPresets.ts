import type { AiConfig, AiProviderPreset } from "../types/config";

export interface AiProviderPresetDef {
  label: string;
  // Suggested base URL (inference.defaults.url). Empty means the AI service
  // falls back to the OpenAI public API.
  baseUrl: string;
  agentModel: string;
  tasksModel: string;
  embeddingsModel: string;
  // Whether a base URL is mandatory for this provider.
  requiresBaseUrl: boolean;
  hint: string;
}

export const AI_PROVIDER_PRESETS: Record<AiProviderPreset, AiProviderPresetDef> = {
  openai: {
    label: "OpenAI",
    baseUrl: "",
    agentModel: "gpt-4o",
    tasksModel: "gpt-4o-mini",
    embeddingsModel: "text-embedding-3-small",
    requiresBaseUrl: false,
    hint: "Uses the public OpenAI API. Leave the base URL empty unless you use a proxy.",
  },
  "azure-openai": {
    label: "Azure OpenAI",
    baseUrl: "https://<resource>.openai.azure.com/openai/deployments/<deployment>",
    agentModel: "gpt-4o",
    tasksModel: "gpt-4o-mini",
    embeddingsModel: "text-embedding-3-small",
    requiresBaseUrl: true,
    hint: "Point the base URL at your Azure deployment endpoint. Models map to your deployment names.",
  },
  custom: {
    label: "Custom / self-hosted",
    baseUrl: "https://llm.internal/v1",
    agentModel: "",
    tasksModel: "",
    embeddingsModel: "",
    requiresBaseUrl: true,
    hint: "Any OpenAI-compatible endpoint (vLLM, Ollama, LiteLLM, Bedrock proxy, …).",
  },
};

// Returns the AI config fields to apply when the user picks a provider preset.
// Only prefills model/URL fields that the preset actually defines, so an
// existing custom value is not clobbered with an empty string.
export function aiProviderPatch(provider: AiProviderPreset): Partial<AiConfig> {
  const preset = AI_PROVIDER_PRESETS[provider];
  return {
    provider,
    baseUrl: preset.baseUrl,
    agentModel: preset.agentModel,
    tasksModel: preset.tasksModel,
    embeddingsModel: preset.embeddingsModel,
  };
}

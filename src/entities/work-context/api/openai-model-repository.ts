import { invoke } from "@tauri-apps/api/core";
import { getAppSettings, setAppSettings, type AppSettings } from "./settings-repository";

export type ChatProvider = "openai" | "claude" | "glm";

export const chatProviders: readonly ChatProvider[] = ["openai", "claude", "glm"];

/** 실제 채팅 실행 경로가 구현된 provider. 나머지는 목록 표시만 가능합니다. */
export const executableChatProviders: readonly ChatProvider[] = ["openai", "claude"];

export interface OpenAiModelOption {
  provider: ChatProvider;
  id: string;
  label: string;
  description: string;
}

export const fallbackOpenAiModels: OpenAiModelOption[] = [
  { provider: "openai", id: "gpt-5.6-sol", label: "GPT-5.6 Sol", description: "최고 품질" },
  { provider: "openai", id: "gpt-5.6-terra", label: "GPT-5.6 Terra", description: "품질·비용 균형" },
  { provider: "openai", id: "gpt-5.6-luna", label: "GPT-5.6 Luna", description: "빠르고 경제적" },
];

// Claude/GLM 목록은 백엔드 조회 경로가 아직 없어 표시 전용 폴백입니다.
// 이 ID는 chat_model에 저장되므로, 백엔드가 해당 provider를 지원하는 시점에 서버 측 허용목록으로 재검증해야 합니다.
const fallbackClaudeModels: OpenAiModelOption[] = [
  { provider: "claude", id: "claude-3-7-sonnet-20250219", label: "Claude 3.7 Sonnet", description: "문맥 추론 중심" },
  { provider: "claude", id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", description: "균형형" },
  { provider: "claude", id: "claude-3-haiku-20240307", label: "Claude 3 Haiku", description: "빠른 응답" },
];

const fallbackGlmModels: OpenAiModelOption[] = [
  { provider: "glm", id: "glm-4.5", label: "GLM-4.5", description: "범용 작업 처리" },
  { provider: "glm", id: "glm-4v-plus", label: "GLM-4V Plus", description: "멀티모달(이미지+텍스트)" },
  { provider: "glm", id: "glm-4", label: "GLM-4", description: "기본 안정형" },
];

const fallbackModelsByProvider: Record<ChatProvider, OpenAiModelOption[]> = {
  openai: fallbackOpenAiModels,
  claude: fallbackClaudeModels,
  glm: fallbackGlmModels,
};

const MAX_LISTED_MODELS = 80;

export function isChatProvider(value: unknown): value is ChatProvider {
  return typeof value === "string" && (chatProviders as readonly string[]).includes(value);
}

export function isExecutableProvider(provider: ChatProvider): boolean {
  return executableChatProviders.includes(provider);
}

export function normalizeModelLabel(provider: ChatProvider, id: string): string {
  if (provider === "openai") {
    return id
      .replace(/^gpt-/, "GPT-")
      .replace(/(^|[-.])(\w)/g, (match) => match.toUpperCase());
  }
  return id;
}

function modelMap(models: OpenAiModelOption[]) {
  return new Map(models.map((model) => [model.id, model]));
}

export function fallbackModelsFor(provider: ChatProvider): OpenAiModelOption[] {
  return fallbackModelsByProvider[provider];
}

/**
 * provider별 사용 가능한 모델 목록을 반환합니다.
 * - openai: 백엔드(`list_openai_chat_models`)에서 API 키 기준으로 조회. 실패는 throw.
 * - claude/glm: 아직 백엔드 조회 커맨드가 없어 항상 폴백 목록을 반환합니다.
 */
export async function listAvailableOpenAiModels(provider: ChatProvider = "openai"): Promise<OpenAiModelOption[]> {
  const preferred = fallbackModelsFor(provider);
  if (provider !== "openai") return preferred;

  const ids = await invoke<string[]>("list_openai_chat_models");
  const known = modelMap(preferred);
  const supported = ids
    .map((id) => known.get(id) || {
      provider: "openai" as const,
      id,
      label: normalizeModelLabel("openai", id),
      description: "OpenAI 텍스트 모델",
    })
    .slice(0, MAX_LISTED_MODELS);
  return supported.length > 0 ? supported : preferred;
}

export interface StoredChatPreference {
  provider: ChatProvider;
  model: string | undefined;
}

export function toSavedSettingsPreference(settings: Partial<AppSettings>): StoredChatPreference {
  const provider: ChatProvider = isChatProvider(settings.chat_provider) ? settings.chat_provider : "openai";
  const storedModel = provider === "openai"
    ? settings.chat_model || settings.openai_model
    : settings.chat_model;
  const model = typeof storedModel === "string" ? storedModel.trim() : "";
  return { provider, model: model || undefined };
}

export async function getStoredChatPreference(): Promise<StoredChatPreference> {
  const settings = await getAppSettings();
  return toSavedSettingsPreference(settings);
}

export function chooseOpenAiModel(models: OpenAiModelOption[], stored?: string, provider: ChatProvider = "openai"): OpenAiModelOption {
  const normalized = typeof stored === "string" ? stored.trim() : "";
  const saved = normalized ? models.find((model) => model.id === normalized) : undefined;
  if (saved) return saved;
  if (models[0]) return models[0];
  return fallbackModelsFor(provider)[0] || fallbackOpenAiModels[0];
}

export async function setOpenAiModelPreference(provider: ChatProvider, model: string): Promise<void> {
  const normalized = model.trim();
  const updates: Partial<AppSettings> = {
    chat_provider: provider,
    chat_model: normalized,
  };
  // openai_model은 Chat 외 기능(Task 워크플로, 컨텍스트 발견 등)이 계속 읽으므로 OpenAI일 때만 동기화합니다.
  if (provider === "openai") updates.openai_model = normalized;
  await setAppSettings(updates);
}

export interface ChatSubmitGuardInput {
  question: string;
  isAnswering: boolean;
  isSwitchingProvider: boolean;
  selectedProvider: ChatProvider;
  selectedModel: OpenAiModelOption | undefined;
}

/**
 * 전송 가능 여부를 한 곳에서 판단합니다. provider 탭 상태와 실제 선택된 모델의 provider가
 * 모두 실행 가능해야 합니다(탭 전환 중 이전 provider 모델이 남아 있는 경쟁 상태 방어).
 */
export function chatSubmitBlockReason(input: ChatSubmitGuardInput): string | null {
  if (input.isAnswering) return "답변 중입니다.";
  if (input.isSwitchingProvider) return "모델 목록을 불러오는 중입니다. 잠시 후 다시 시도해 주세요.";
  if (!input.selectedModel?.id) return "사용할 모델을 선택해 주세요.";
  if (!isExecutableProvider(input.selectedProvider) || !isExecutableProvider(input.selectedModel.provider)) {
    return "현재 Orbit는 OpenAI와 Claude 채팅 파이프라인을 지원합니다. 지원되는 제공자의 모델을 선택해 주세요.";
  }
  if (!input.question.trim()) return "질문을 입력해 주세요.";
  return null;
}

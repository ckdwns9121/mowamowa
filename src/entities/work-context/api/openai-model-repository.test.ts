import { afterEach, describe, expect, mock, test } from "bun:test";

let invokeImpl: (command: string, args?: unknown) => Promise<unknown> = async () => {
  throw new Error("invoke not stubbed");
};
const invokeCalls: string[] = [];

mock.module("@tauri-apps/api/core", () => ({
  invoke: (command: string, args?: unknown) => {
    invokeCalls.push(command);
    return invokeImpl(command, args);
  },
}));

const {
  chatSubmitBlockReason,
  chooseOpenAiModel,
  fallbackModelsFor,
  fallbackOpenAiModels,
  listAvailableOpenAiModels,
  toSavedSettingsPreference,
} = await import("./openai-model-repository");

afterEach(() => {
  invokeCalls.length = 0;
  invokeImpl = async () => { throw new Error("invoke not stubbed"); };
});

describe("toSavedSettingsPreference", () => {
  test("restores provider and model from chat_* keys", () => {
    expect(toSavedSettingsPreference({ chat_provider: "claude", chat_model: " claude-x " }))
      .toEqual({ provider: "claude", model: "claude-x" });
  });

  test("falls back to legacy openai_model when chat keys are absent", () => {
    expect(toSavedSettingsPreference({ openai_model: "gpt-5.6-sol" }))
      .toEqual({ provider: "openai", model: "gpt-5.6-sol" });
  });

  test("treats unknown provider as openai", () => {
    expect(toSavedSettingsPreference({ chat_provider: "bogus", chat_model: "x" }).provider).toBe("openai");
  });

  test("does not leak openai_model into a non-openai provider", () => {
    expect(toSavedSettingsPreference({ chat_provider: "glm", openai_model: "gpt-5.6-sol" }))
      .toEqual({ provider: "glm", model: undefined });
  });

  test("normalizes blank model to undefined", () => {
    expect(toSavedSettingsPreference({ chat_provider: "openai", chat_model: "   " }).model).toBeUndefined();
  });
});

describe("chooseOpenAiModel", () => {
  test("prefers the stored model when it is available", () => {
    expect(chooseOpenAiModel(fallbackOpenAiModels, "gpt-5.6-luna").id).toBe("gpt-5.6-luna");
  });

  test("falls back to the first available model when stored one is missing", () => {
    expect(chooseOpenAiModel(fallbackOpenAiModels, "gpt-old").id).toBe(fallbackOpenAiModels[0].id);
  });

  test("uses the provider fallback when the list is empty", () => {
    expect(chooseOpenAiModel([], undefined, "claude").provider).toBe("claude");
  });
});

describe("listAvailableOpenAiModels", () => {
  test("maps backend ids and keeps known metadata", async () => {
    invokeImpl = async () => ["gpt-5.6-sol", "gpt-5.5"];
    const models = await listAvailableOpenAiModels("openai");
    expect(models.map((model) => model.id)).toEqual(["gpt-5.6-sol", "gpt-5.5"]);
    expect(models[0].label).toBe("GPT-5.6 Sol");
    expect(models[1].label).toBe("GPT-5.5");
    expect(models.every((model) => model.provider === "openai")).toBe(true);
  });

  test("falls back to defaults when backend returns nothing", async () => {
    invokeImpl = async () => [];
    expect(await listAvailableOpenAiModels("openai")).toEqual(fallbackOpenAiModels);
  });

  test("propagates backend failure for openai so the caller can show it", async () => {
    invokeImpl = async () => { throw new Error("no key"); };
    await expect(listAvailableOpenAiModels("openai")).rejects.toThrow("no key");
  });

  test("never calls the backend for claude or glm", async () => {
    expect(await listAvailableOpenAiModels("claude")).toEqual(fallbackModelsFor("claude"));
    expect(await listAvailableOpenAiModels("glm")).toEqual(fallbackModelsFor("glm"));
    expect(invokeCalls).toEqual([]);
  });
});

describe("chatSubmitBlockReason", () => {
  const openaiModel = fallbackOpenAiModels[0];
  const claudeModel = fallbackModelsFor("claude")[0];
  const base = { question: "오늘 일정", isAnswering: false, isSwitchingProvider: false };

  test("allows openai provider with an openai model", () => {
    expect(chatSubmitBlockReason({ ...base, selectedProvider: "openai", selectedModel: openaiModel })).toBeNull();
  });

  test("allows claude provider with a claude model", () => {
    expect(chatSubmitBlockReason({ ...base, selectedProvider: "claude", selectedModel: claudeModel })).toBeNull();
  });

  test("blocks unsupported glm provider", () => {
    const glmModel = fallbackModelsFor("glm")[0];
    expect(chatSubmitBlockReason({ ...base, selectedProvider: "glm", selectedModel: glmModel })).toMatch(/지원/);
  });

  test("blocks when the tab is openai but the selected model still belongs to another provider", () => {
    const glmModel = fallbackModelsFor("glm")[0];
    expect(chatSubmitBlockReason({ ...base, selectedProvider: "openai", selectedModel: glmModel })).toMatch(/지원/);
  });

  test("blocks while provider switch is in flight", () => {
    expect(chatSubmitBlockReason({ ...base, isSwitchingProvider: true, selectedProvider: "openai", selectedModel: openaiModel })).toMatch(/불러오는 중/);
  });

  test("blocks empty question and missing model", () => {
    expect(chatSubmitBlockReason({ ...base, question: "  ", selectedProvider: "openai", selectedModel: openaiModel })).not.toBeNull();
    expect(chatSubmitBlockReason({ ...base, selectedProvider: "openai", selectedModel: undefined })).not.toBeNull();
  });
});

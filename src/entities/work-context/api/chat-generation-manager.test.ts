import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  cancelGeneration,
  getActiveGeneration,
  getGenerationById,
  resetChatGenerationDependencies,
  setChatGenerationDependencies,
  startChatGeneration,
  subscribeGeneration,
  type ChatGenerationEvent,
} from "./chat-generation-manager";
import type { StreamAnswer } from "./chat-ai-repository";

describe("ChatGenerationManager", () => {
  beforeEach(() => {
    resetChatGenerationDependencies();
  });

  afterEach(() => {
    resetChatGenerationDependencies();
  });

  test("generates unique generateId and tracks active generation", async () => {
    let capturedOnDelta: ((delta: string) => void) | null = null;
    let resolveStream: (value: StreamAnswer) => void;
    const streamPromise = new Promise<StreamAnswer>((resolve) => {
      resolveStream = resolve;
    });

    const appendedMessages: Array<{ threadId: string; role: string; content: string }> = [];

    setChatGenerationDependencies({
      streamAnswerWithOrbitContext: async (_q, _m, _model, _threadId, callbacks) => {
        capturedOnDelta = callbacks.onDelta;
        return streamPromise;
      },
      appendChatMessage: async (threadId, role, content) => {
        appendedMessages.push({ threadId, role, content });
        return "msg-123";
      },
      attachAgentApprovalsToMessage: async () => {},
      listChatMessages: async () => [],
    });

    const threadId = "thread-1";
    const generateId = startChatGeneration({
      threadId,
      question: "오늘 일정 알려줘",
      modelId: "gpt-5.6-terra",
      messages: [],
    });

    expect(generateId).toMatch(/^gen_\d+_/);

    const active = getActiveGeneration(threadId);
    expect(active).not.toBeNull();
    expect(active?.generateId).toBe(generateId);
    expect(active?.status).toBe("running");

    // Emit delta
    capturedOnDelta!("첫 번째 토큰 ");
    expect(active?.accumulatedContent).toBe("첫 번째 토큰 ");

    // Complete stream
    resolveStream!({
      content: "첫 번째 토큰 완료된 답변입니다.",
      responseId: "resp-1",
      cancelled: false,
      approvals: [],
      runId: "run-1",
      steps: [],
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(appendedMessages.length).toBe(1);
    expect(appendedMessages[0].content).toBe("첫 번째 토큰 완료된 답변입니다.");
    expect(getActiveGeneration(threadId)).toBeNull(); // Completed sessions are no longer active
  });

  test("reconnects with generateID and catches up on accumulated stream content", async () => {
    let capturedOnDelta: ((delta: string) => void) | null = null;
    let resolveStream: (value: StreamAnswer) => void;
    const streamPromise = new Promise<StreamAnswer>((resolve) => {
      resolveStream = resolve;
    });

    setChatGenerationDependencies({
      streamAnswerWithOrbitContext: async (_q, _m, _model, _threadId, callbacks) => {
        capturedOnDelta = callbacks.onDelta;
        return streamPromise;
      },
      appendChatMessage: async () => "msg-1",
      attachAgentApprovalsToMessage: async () => {},
      listChatMessages: async () => [],
    });

    const threadId = "thread-reconnect";
    const generateId = startChatGeneration({
      threadId,
      question: "재연결 테스트",
      modelId: "gpt-5.6-terra",
      messages: [],
    });

    // Stream deltas while NO listener is attached (e.g. user is in another tab!)
    capturedOnDelta!("청크 1 ");
    capturedOnDelta!("청크 2 ");

    // Now user switches back to Chat tab: subscribe to generateId (RECONNECTION)
    const events: ChatGenerationEvent[] = [];
    const unsubscribe = subscribeGeneration(generateId, (event) => {
      events.push(event);
    });

    // 1) First event must be "sync" with all accumulated content!
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("sync");
    if (events[0].type === "sync") {
      expect(events[0].session.accumulatedContent).toBe("청크 1 청크 2 ");
      expect(events[0].session.generateId).toBe(generateId);
      expect(events[0].session.status).toBe("running");
    }

    // 2) Subsequent live deltas must be received in real time
    capturedOnDelta!("청크 3 ");
    expect(events.length).toBe(2);
    expect(events[1].type).toBe("delta");
    if (events[1].type === "delta") {
      expect(events[1].delta).toBe("청크 3 ");
      expect(events[1].accumulatedContent).toBe("청크 1 청크 2 청크 3 ");
    }

    // Unsubscribe (user switches tabs again)
    unsubscribe();

    // Delta arriving while away
    capturedOnDelta!("청크 4 ");

    // Complete the stream while user is away
    resolveStream!({
      content: "청크 1 청크 2 청크 3 청크 4 완료",
      responseId: "resp-2",
      cancelled: false,
      approvals: [],
      runId: "run-2",
      steps: [],
    });

    await new Promise((r) => setTimeout(r, 20));

    const finalSession = getGenerationById(generateId);
    expect(finalSession?.status).toBe("completed");
    expect(finalSession?.accumulatedContent).toBe("청크 1 청크 2 청크 3 청크 4 완료");
  });

  test("explicit cancellation aborts the controller and notifies listeners", async () => {
    const holder = { signal: undefined as AbortSignal | undefined };
    setChatGenerationDependencies({
      streamAnswerWithOrbitContext: async (_q, _m, _model, _threadId, callbacks) => {
        holder.signal = callbacks.signal;
        return new Promise((_, reject) => {
          callbacks.signal?.addEventListener("abort", () => {
            reject(new Error("aborted"));
          });
        });
      },
      appendChatMessage: async () => "msg-1",
      attachAgentApprovalsToMessage: async () => {},
      listChatMessages: async () => [],
    });

    const threadId = "thread-cancel";
    const generateId = startChatGeneration({
      threadId,
      question: "중단 테스트",
      modelId: "gpt-5.6-terra",
      messages: [],
    });

    const events: ChatGenerationEvent[] = [];
    subscribeGeneration(generateId, (e) => events.push(e));

    expect(holder.signal?.aborted).toBe(false);

    cancelGeneration(generateId);

    expect(holder.signal?.aborted).toBe(true);

    await new Promise((r) => setTimeout(r, 20));

    expect(events.some((e) => e.type === "cancelled")).toBe(true);
    expect(getActiveGeneration(threadId)).toBeNull();
  });
});

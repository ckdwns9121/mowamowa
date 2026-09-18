import type { ChatMessage } from "../model/chat";
import type { ChatAgentApproval, ChatAgentStepView } from "../model/chat-agent";
import {
  initialContextSources,
  resolveChatAgentApproval,
  streamAnswerWithOrbitContext,
  type ContextSourceStatus,
} from "./chat-ai-repository";
import { appendChatMessage, listChatMessages } from "./chat-repository";
import { attachAgentApprovalsToMessage } from "./chat-agent-repository";

export type GenerationStatus =
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed"
  | "cancelled";

export interface ChatGenerationSession {
  generateId: string;
  threadId: string;
  question: string;
  modelId: string;
  status: GenerationStatus;
  accumulatedContent: string;
  agentSteps: ChatAgentStepView[];
  contextSources: ContextSourceStatus[];
  approvals: ChatAgentApproval[];
  responseId: string | null;
  error: string | null;
  startedAt: number;
  completedAt?: number;
}

export type ChatGenerationEvent =
  | { type: "sync"; session: ChatGenerationSession }
  | { type: "delta"; delta: string; accumulatedContent: string; generateId: string }
  | { type: "source"; source: ContextSourceStatus; sources: ContextSourceStatus[]; generateId: string }
  | { type: "step"; steps: ChatAgentStepView[]; generateId: string }
  | { type: "approvals"; approvals: ChatAgentApproval[]; generateId: string }
  | { type: "completed"; session: ChatGenerationSession }
  | { type: "failed"; error: string; generateId: string }
  | { type: "cancelled"; generateId: string };

export type ChatGenerationListener = (event: ChatGenerationEvent) => void;

export interface ChatGenerationRunnerDependencies {
  streamAnswerWithOrbitContext: typeof streamAnswerWithOrbitContext;
  resolveChatAgentApproval: typeof resolveChatAgentApproval;
  appendChatMessage: typeof appendChatMessage;
  attachAgentApprovalsToMessage: typeof attachAgentApprovalsToMessage;
  listChatMessages: typeof listChatMessages;
}

const defaultDependencies: ChatGenerationRunnerDependencies = {
  streamAnswerWithOrbitContext,
  resolveChatAgentApproval,
  appendChatMessage,
  attachAgentApprovalsToMessage,
  listChatMessages,
};

let deps = defaultDependencies;

export function setChatGenerationDependencies(custom: Partial<ChatGenerationRunnerDependencies>) {
  deps = { ...defaultDependencies, ...custom };
}

export function resetChatGenerationDependencies() {
  deps = defaultDependencies;
}

// Global in-memory storage for active sessions across tab navigation
const sessionsByGenerateId = new Map<string, ChatGenerationSession>();
const activeSessionsByThread = new Map<string, ChatGenerationSession>();
const controllersByGenerateId = new Map<string, AbortController>();
const listenersByGenerateId = new Map<string, Set<ChatGenerationListener>>();

function emitEvent(generateId: string, event: ChatGenerationEvent) {
  const listeners = listenersByGenerateId.get(generateId);
  if (!listeners || listeners.size === 0) return;
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch (cause) {
      console.error("[ChatGenerationManager] Listener error:", cause);
    }
  }
}

export function createGenerateId(prefix = "gen"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

export interface StartChatGenerationParams {
  threadId: string;
  question: string;
  modelId: string;
  messages: ChatMessage[];
  onThreadUpdated?: (threadId: string) => Promise<void> | void;
}

export function startChatGeneration(params: StartChatGenerationParams): string {
  const { threadId, question, modelId, messages, onThreadUpdated } = params;

  // If there's an ongoing generation for this thread, cancel it first
  const existing = activeSessionsByThread.get(threadId);
  if (existing && existing.status === "running") {
    cancelGeneration(existing.generateId);
  }

  const generateId = createGenerateId("gen");
  const controller = new AbortController();

  const session: ChatGenerationSession = {
    generateId,
    threadId,
    question,
    modelId,
    status: "running",
    accumulatedContent: "",
    agentSteps: [],
    contextSources: initialContextSources.map((s) => ({ ...s })),
    approvals: [],
    responseId: null,
    error: null,
    startedAt: Date.now(),
  };

  sessionsByGenerateId.set(generateId, session);
  activeSessionsByThread.set(threadId, session);
  controllersByGenerateId.set(generateId, controller);

  // Launch the generation process asynchronously in the background
  void (async () => {
    try {
      const answer = await deps.streamAnswerWithOrbitContext(
        question,
        messages,
        modelId,
        threadId,
        {
          signal: controller.signal,
          onDelta: (delta) => {
            session.accumulatedContent += delta;
            emitEvent(generateId, {
              type: "delta",
              delta,
              accumulatedContent: session.accumulatedContent,
              generateId,
            });
          },
          onSource: (source) => {
            session.contextSources = session.contextSources.map((item) =>
              item.id === source.id ? source : item
            );
            emitEvent(generateId, {
              type: "source",
              source,
              sources: [...session.contextSources],
              generateId,
            });
          },
          onSteps: (steps) => {
            session.agentSteps = [...steps];
            emitEvent(generateId, {
              type: "step",
              steps: session.agentSteps,
              generateId,
            });
          },
        }
      );

      if (controller.signal.aborted || answer.cancelled) {
        session.status = "cancelled";
        emitEvent(generateId, { type: "cancelled", generateId });
        return;
      }

      const assistantContent = answer.content.trim()
        ? answer.content
        : answer.approvals.length > 0
          ? "변경 작업을 진행하려면 아래 승인 요청을 확인해주세요."
          : "";

      session.accumulatedContent = assistantContent;
      session.responseId = answer.responseId;
      session.approvals = answer.approvals;
      session.completedAt = Date.now();

      if (assistantContent) {
        const assistantMessageId = await deps.appendChatMessage(
          threadId,
          "assistant",
          assistantContent,
          answer.responseId ?? undefined
        );
        if (answer.approvals.length) {
          await deps.attachAgentApprovalsToMessage(answer.runId, assistantMessageId);
        }
      }

      session.status = answer.approvals.length > 0 ? "awaiting_approval" : "completed";
      emitEvent(generateId, { type: "completed", session });

      if (onThreadUpdated) {
        await onThreadUpdated(threadId);
      }
    } catch (cause) {
      if (controller.signal.aborted) {
        session.status = "cancelled";
        emitEvent(generateId, { type: "cancelled", generateId });
      } else {
        const errorMsg = cause instanceof Error ? cause.message : String(cause);
        session.status = "failed";
        session.error = errorMsg;
        emitEvent(generateId, { type: "failed", error: errorMsg, generateId });
      }
    } finally {
      controllersByGenerateId.delete(generateId);
      if (session.status !== "running" && session.status !== "awaiting_approval") {
        if (activeSessionsByThread.get(threadId)?.generateId === generateId) {
          activeSessionsByThread.delete(threadId);
        }
      }
    }
  })();

  return generateId;
}

export interface StartApprovalResolutionParams {
  threadId: string;
  proposal: ChatAgentApproval;
  approved: boolean;
  onThreadUpdated?: (threadId: string) => Promise<void> | void;
}

export function startApprovalResolution(params: StartApprovalResolutionParams): string {
  const { threadId, proposal, approved, onThreadUpdated } = params;

  const generateId = createGenerateId("approval");
  const controller = new AbortController();

  const session: ChatGenerationSession = {
    generateId,
    threadId,
    question: `${proposal.toolName} ${approved ? "승인" : "거절"}`,
    modelId: "",
    status: "running",
    accumulatedContent: "",
    agentSteps: [],
    contextSources: initialContextSources.map((s) => ({ ...s })),
    approvals: [],
    responseId: null,
    error: null,
    startedAt: Date.now(),
  };

  sessionsByGenerateId.set(generateId, session);
  activeSessionsByThread.set(threadId, session);
  controllersByGenerateId.set(generateId, controller);

  void (async () => {
    try {
      const answer = await deps.resolveChatAgentApproval(proposal, approved, {
        signal: controller.signal,
        onDelta: (delta) => {
          session.accumulatedContent += delta;
          emitEvent(generateId, {
            type: "delta",
            delta,
            accumulatedContent: session.accumulatedContent,
            generateId,
          });
        },
        onSource: (source) => {
          session.contextSources = session.contextSources.map((item) =>
            item.id === source.id ? source : item
          );
          emitEvent(generateId, {
            type: "source",
            source,
            sources: [...session.contextSources],
            generateId,
          });
        },
        onSteps: (steps) => {
          session.agentSteps = [...steps];
          emitEvent(generateId, {
            type: "step",
            steps: session.agentSteps,
            generateId,
          });
        },
      });

      if (controller.signal.aborted || answer?.cancelled) {
        session.status = "cancelled";
        emitEvent(generateId, { type: "cancelled", generateId });
        return;
      }

      if (answer) {
        const content = answer.content.trim() || (answer.approvals.length ? "다음 변경 작업을 진행하려면 아래 승인 요청을 확인해주세요." : "");
        session.accumulatedContent = content;
        session.responseId = answer.responseId;
        session.approvals = answer.approvals;
        session.completedAt = Date.now();

        if (content) {
          const messageId = await deps.appendChatMessage(threadId, "assistant", content, answer.responseId);
          if (answer.approvals.length) {
            await deps.attachAgentApprovalsToMessage(answer.runId, messageId);
          }
        }
        session.status = answer.approvals.length > 0 ? "awaiting_approval" : "completed";
        emitEvent(generateId, { type: "completed", session });
      } else {
        session.status = "completed";
        session.completedAt = Date.now();
        emitEvent(generateId, { type: "completed", session });
      }

      if (onThreadUpdated) {
        await onThreadUpdated(threadId);
      }
    } catch (cause) {
      if (controller.signal.aborted) {
        session.status = "cancelled";
        emitEvent(generateId, { type: "cancelled", generateId });
      } else {
        const errorMsg = cause instanceof Error ? cause.message : String(cause);
        session.status = "failed";
        session.error = errorMsg;
        emitEvent(generateId, { type: "failed", error: errorMsg, generateId });
      }
    } finally {
      controllersByGenerateId.delete(generateId);
      if (session.status !== "running" && session.status !== "awaiting_approval") {
        if (activeSessionsByThread.get(threadId)?.generateId === generateId) {
          activeSessionsByThread.delete(threadId);
        }
      }
    }
  })();

  return generateId;
}

/**
 * Retrieves the currently active generation session for a thread, if any.
 */
export function getActiveGeneration(threadId: string): ChatGenerationSession | null {
  const session = activeSessionsByThread.get(threadId);
  if (!session) return null;
  if (session.status === "running" || session.status === "awaiting_approval") {
    return session;
  }
  return null;
}

/**
 * Retrieves a generation session by its unique generateId.
 */
export function getGenerationById(generateId: string): ChatGenerationSession | null {
  return sessionsByGenerateId.get(generateId) ?? null;
}

/**
 * Subscribes to events for a specific generateId.
 * Immediately emits a "sync" event with the current snapshot to enable seamless reconnection!
 */
export function subscribeGeneration(
  generateId: string,
  listener: ChatGenerationListener
): () => void {
  let listeners = listenersByGenerateId.get(generateId);
  if (!listeners) {
    listeners = new Set();
    listenersByGenerateId.set(generateId, listeners);
  }
  listeners.add(listener);

  const session = sessionsByGenerateId.get(generateId);
  if (session) {
    try {
      listener({ type: "sync", session: { ...session } });
    } catch (cause) {
      console.error("[ChatGenerationManager] Error emitting sync on subscribe:", cause);
    }
  }

  return () => {
    const activeListeners = listenersByGenerateId.get(generateId);
    if (activeListeners) {
      activeListeners.delete(listener);
      if (activeListeners.size === 0) {
        listenersByGenerateId.delete(generateId);
      }
    }
  };
}

/**
 * Explicitly cancels an ongoing generation by generateId.
 */
export function cancelGeneration(generateId: string): boolean {
  const controller = controllersByGenerateId.get(generateId);
  if (controller) {
    controller.abort();
    controllersByGenerateId.delete(generateId);
    const session = sessionsByGenerateId.get(generateId);
    if (session) {
      session.status = "cancelled";
      emitEvent(generateId, { type: "cancelled", generateId });
      if (activeSessionsByThread.get(session.threadId)?.generateId === generateId) {
        activeSessionsByThread.delete(session.threadId);
      }
    }
    return true;
  }
  return false;
}

/**
 * Cleans up completed/failed session records if desired.
 */
export function clearGeneration(generateId: string) {
  const session = sessionsByGenerateId.get(generateId);
  if (session && (session.status === "completed" || session.status === "failed" || session.status === "cancelled")) {
    sessionsByGenerateId.delete(generateId);
    controllersByGenerateId.delete(generateId);
    listenersByGenerateId.delete(generateId);
    if (activeSessionsByThread.get(session.threadId)?.generateId === generateId) {
      activeSessionsByThread.delete(session.threadId);
    }
  }
}

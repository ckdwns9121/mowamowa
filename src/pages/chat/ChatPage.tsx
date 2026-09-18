import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  initialContextSources,
  type ContextSourceStatus,
} from "../../entities/work-context/api/chat-ai-repository";
import {
  cancelGeneration,
  getActiveGeneration,
  startApprovalResolution,
  startChatGeneration,
  subscribeGeneration,
} from "../../entities/work-context/api/chat-generation-manager";
import { appendChatMessage, createChatThread, deleteChatThread, listChatMessages, listChatThreads } from "../../entities/work-context/api/chat-repository";
import { listThreadAgentApprovals } from "../../entities/work-context/api/chat-agent-repository";
import {
  chatProviders,
  chatSubmitBlockReason,
  chooseOpenAiModel,
  type ChatProvider,
  fallbackModelsFor,
  fallbackOpenAiModels,
  isExecutableProvider,
  listAvailableOpenAiModels,
  getStoredChatPreference,
  type OpenAiModelOption,
  setOpenAiModelPreference,
} from "../../entities/work-context/api/openai-model-repository";
import type { ChatMessage, ChatThread } from "../../entities/work-context/model/chat";
import type { ChatAgentApproval, ChatAgentStepView } from "../../entities/work-context/model/chat-agent";
import VirtualMessageList, { type DisplayMessage } from "./VirtualMessageList";
import "./ChatPage.scss";

function ContextStatusPanel({
  sources,
  active,
  generateId,
}: {
  sources: ContextSourceStatus[];
  active: boolean;
  generateId?: string | null;
}) {
  const completed = sources.filter((source) => source.state === "complete");
  const collecting = sources.find((source) => source.state === "collecting");
  return (
    <section className={`chat-context-panel ${active ? "active" : ""}`} aria-label="컨텍스트 수집 상태">
      <div className="chat-context-summary">
        <span className="chat-context-mark">⌘</span>
        <div>
          <strong>연결 컨텍스트</strong>
          <small>
            {collecting
              ? `${collecting.label} ${collecting.detail}`
              : active
                ? `${completed.length}개 소스 수집 완료`
                : "질문을 보내면 최신 로컬 컨텍스트를 확인합니다"}
          </small>
        </div>
        {generateId && (
          <span className="chat-stream-badge" title={`세션 스트림 ID: ${generateId}`}>
            SSE 연결됨
          </span>
        )}
      </div>
      <div className="chat-context-sources">
        {sources.map((source) => (
          <div className={`chat-context-source ${source.state}`} key={source.id}>
            <span>{source.state === "collecting" ? "" : source.state === "complete" ? "✓" : source.state === "error" ? "!" : "·"}</span>
            <div><strong>{source.label}</strong><small>{source.state === "pending" ? "응답 시 확인" : source.detail}</small></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function groupApprovalsByMessage(approvals: ChatAgentApproval[]): Record<string, ChatAgentApproval[]> {
  return approvals.reduce<Record<string, ChatAgentApproval[]>>((result, approval) => {
    if (!approval.messageId) return result;
    (result[approval.messageId] ||= []).push(approval);
    return result;
  }, {});
}

const providerLabels: Record<ChatProvider, string> = { openai: "OpenAI", claude: "Claude", glm: "GLM" };

function currentAgentStatus(steps: ChatAgentStepView[]): string {
  const active = [...steps].reverse().find((step) => step.state === "running" || step.state === "waiting");
  if (!active) return steps.length ? "도구 결과를 바탕으로 답변을 정리하는 중…" : "요청을 분석하는 중…";
  if (active.state === "waiting") return `${active.label}…`;
  return `${active.label} 중…`;
}

export default function ChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeGenerateId, setActiveGenerateId] = useState<string | null>(null);
  const [contextSources, setContextSources] = useState(initialContextSources);
  const [contextStarted, setContextStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<OpenAiModelOption[]>(fallbackOpenAiModels);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ChatProvider>("openai");
  const [isSwitchingProvider, setIsSwitchingProvider] = useState(false);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [modelNotice, setModelNotice] = useState<string | null>(null);
  const [approvalsByMessage, setApprovalsByMessage] = useState<Record<string, ChatAgentApproval[]>>({});
  const [agentSteps, setAgentSteps] = useState<ChatAgentStepView[]>([]);
  const streamBufferRef = useRef("");
  const streamFrameRef = useRef<number | null>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const approvingTaskIdsRef = useRef(new Set<string>());
  const providerRequestRef = useRef(0);

  useEffect(() => { void refreshThreads(); }, []);

  useEffect(() => {
    let active = true;
    const requestId = ++providerRequestRef.current;
    void (async () => {
      let stored;
      try {
        stored = await getStoredChatPreference();
      } catch (cause) {
        if (active && requestId === providerRequestRef.current) setError(cause instanceof Error ? cause.message : String(cause));
        return;
      }
      if (!active || requestId !== providerRequestRef.current) return;
      const provider = stored.provider;
      let available: OpenAiModelOption[];
      try {
        available = await listAvailableOpenAiModels(provider);
      } catch (cause) {
        if (!active || requestId !== providerRequestRef.current) return;
        const fallback = fallbackModelsFor(provider);
        const selected = chooseOpenAiModel(fallback, stored.model, provider);
        setSelectedProvider(provider);
        setModels(fallback);
        setSelectedModelId(selected.id);
        setModelNotice(cause instanceof Error ? cause.message : String(cause));
        return;
      }
      if (!active || requestId !== providerRequestRef.current) return;
      const selected = chooseOpenAiModel(available, stored.model, provider);
      if (stored.model !== selected.id) {
        await setOpenAiModelPreference(provider, selected.id).catch((cause) => {
          if (active && requestId === providerRequestRef.current) setError(cause instanceof Error ? cause.message : String(cause));
        });
      }
      if (!active || requestId !== providerRequestRef.current) return;
      setSelectedProvider(provider);
      setModels(available);
      setSelectedModelId(selected.id);
      if (stored.model && stored.model !== selected.id) {
        setModelNotice(`현재 사용 불가 모델 ${stored.model} 대신 ${selected.label}을 사용합니다.`);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const switchProvider = useCallback(async (provider: ChatProvider) => {
    if (provider === selectedProvider) return;
    const previousProvider = selectedProvider;
    const requestId = ++providerRequestRef.current;
    setSelectedProvider(provider);
    setIsSwitchingProvider(true);
    setModelNotice(null);
    setError(null);
    try {
      const available = await listAvailableOpenAiModels(provider);
      if (requestId !== providerRequestRef.current) return;
      const stored = await getStoredChatPreference().catch(() => ({ provider, model: undefined }));
      if (requestId !== providerRequestRef.current) return;
      const selected = chooseOpenAiModel(available, stored.provider === provider ? stored.model : undefined, provider);
      await setOpenAiModelPreference(provider, selected.id);
      if (requestId !== providerRequestRef.current) return;
      setModels(available);
      setSelectedModelId(selected.id);
    } catch (cause) {
      if (requestId !== providerRequestRef.current) return;
      setSelectedProvider(previousProvider);
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      if (requestId === providerRequestRef.current) setIsSwitchingProvider(false);
    }
  }, [selectedProvider]);

  // Load persisted messages for the active thread
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    void Promise.all([listChatMessages(activeId), listThreadAgentApprovals(activeId)]).then(([nextMessages, approvals]) => {
      setMessages(nextMessages);
      setApprovalsByMessage(groupApprovalsByMessage(approvals));
    }).catch((cause) => setError(String(cause)));
  }, [activeId]);

  // Reconnection: on mount or thread change, check for ongoing generation
  useEffect(() => {
    if (!activeId) {
      setActiveGenerateId(null);
      return;
    }
    const activeGen = getActiveGeneration(activeId);
    if (activeGen && (activeGen.status === "running" || activeGen.status === "awaiting_approval")) {
      setActiveGenerateId(activeGen.generateId);
      setIsAnswering(activeGen.status === "running");
      setStreamingContent(activeGen.accumulatedContent);
      streamBufferRef.current = activeGen.accumulatedContent;
      setAgentSteps(activeGen.agentSteps);
      setContextSources(activeGen.contextSources);
      setContextStarted(true);
    } else {
      setActiveGenerateId(null);
    }
  }, [activeId]);

  function enqueueDelta(delta: string) {
    streamBufferRef.current += delta;
    if (streamFrameRef.current !== null) return;
    streamFrameRef.current = requestAnimationFrame(() => {
      setStreamingContent(streamBufferRef.current);
      streamFrameRef.current = null;
    });
  }

  // Subscribe to live generation events (SSE reconnection & stream updates)
  useEffect(() => {
    if (!activeGenerateId) return;
    const unsubscribe = subscribeGeneration(activeGenerateId, (event) => {
      if (event.type === "sync") {
        setIsAnswering(event.session.status === "running");
        setStreamingContent(event.session.accumulatedContent);
        streamBufferRef.current = event.session.accumulatedContent;
        setAgentSteps(event.session.agentSteps);
        setContextSources(event.session.contextSources);
        setContextStarted(true);
        if (event.session.approvals.length && activeId) {
          void Promise.all([listChatMessages(activeId), listThreadAgentApprovals(activeId)]).then(([nextMessages, approvals]) => {
            setMessages(nextMessages);
            setApprovalsByMessage(groupApprovalsByMessage(approvals));
          });
        }
      } else if (event.type === "delta") {
        enqueueDelta(event.delta);
      } else if (event.type === "step") {
        setAgentSteps(event.steps);
      } else if (event.type === "source") {
        setContextSources(event.sources);
      } else if (event.type === "completed") {
        if (streamFrameRef.current !== null) cancelAnimationFrame(streamFrameRef.current);
        streamFrameRef.current = null;
        setIsAnswering(false);
        setStreamingContent("");
        streamBufferRef.current = "";
        setActiveGenerateId(null);
        if (activeId) {
          void Promise.all([listChatMessages(activeId), listThreadAgentApprovals(activeId)]).then(([nextMessages, approvals]) => {
            setMessages(nextMessages);
            setApprovalsByMessage(groupApprovalsByMessage(approvals));
          });
          void refreshThreads(activeId);
        }
      } else if (event.type === "failed") {
        if (streamFrameRef.current !== null) cancelAnimationFrame(streamFrameRef.current);
        streamFrameRef.current = null;
        setIsAnswering(false);
        setStreamingContent("");
        streamBufferRef.current = "";
        setError(event.error);
        setActiveGenerateId(null);
      } else if (event.type === "cancelled") {
        if (streamFrameRef.current !== null) cancelAnimationFrame(streamFrameRef.current);
        streamFrameRef.current = null;
        setIsAnswering(false);
        setStreamingContent("");
        streamBufferRef.current = "";
        setActiveGenerateId(null);
      }
    });

    return () => {
      unsubscribe();
      if (streamFrameRef.current !== null) cancelAnimationFrame(streamFrameRef.current);
      streamFrameRef.current = null;
    };
  }, [activeGenerateId, activeId]);

  // Clean up animation frame on unmount without aborting background generation!
  useEffect(() => () => {
    if (streamFrameRef.current !== null) cancelAnimationFrame(streamFrameRef.current);
  }, []);

  useEffect(() => {
    if (!isModelPickerOpen) return;
    const close = (event: PointerEvent) => {
      if (!modelPickerRef.current?.contains(event.target as Node)) setIsModelPickerOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [isModelPickerOpen]);

  const selectedModel = models.find((model) => model.id === selectedModelId) || chooseOpenAiModel(models, undefined, selectedProvider);
  const submitBlockReason = chatSubmitBlockReason({ question, isAnswering, isSwitchingProvider, selectedProvider, selectedModel });

  const displayMessages = useMemo<DisplayMessage[]>(() => {
    const result: DisplayMessage[] = messages.map(({ id, role, content }) => ({
      id,
      role,
      content,
      approvals: approvalsByMessage[id],
    }));
    if (isAnswering) result.push({
      id: "streaming-assistant",
      role: "assistant",
      content: streamingContent,
      streaming: true,
      agentStatus: streamingContent ? undefined : currentAgentStatus(agentSteps),
    });
    return result;
  }, [messages, isAnswering, streamingContent, approvalsByMessage, agentSteps]);

  const updateTaskProposal = useCallback((proposalId: string, update: (proposal: ChatAgentApproval) => ChatAgentApproval) => {
    setApprovalsByMessage((current) => Object.fromEntries(Object.entries(current).map(([messageId, proposals]) => [
      messageId,
      proposals.map((proposal) => proposal.id === proposalId ? update(proposal) : proposal),
    ])));
  }, []);

  const approveTask = useCallback((proposalId: string) => {
    if (approvingTaskIdsRef.current.has(proposalId) || !activeId) return;
    const proposal = Object.values(approvalsByMessage).flat().find((item) => item.id === proposalId);
    if (!proposal || (proposal.status !== "pending" && proposal.status !== "failed")) return;
    approvingTaskIdsRef.current.add(proposalId);
    updateTaskProposal(proposalId, (item) => ({ ...item, status: "executing", error: null }));
    setIsAnswering(true);
    setAgentSteps([]);
    const generateId = startApprovalResolution({
      threadId: activeId,
      proposal,
      approved: true,
      onThreadUpdated: refreshThreads,
    });
    setActiveGenerateId(generateId);
  }, [activeId, approvalsByMessage, updateTaskProposal]);

  const rejectTask = useCallback((proposalId: string) => {
    if (approvingTaskIdsRef.current.has(proposalId) || !activeId) return;
    const proposal = Object.values(approvalsByMessage).flat().find((item) => item.id === proposalId);
    if (!proposal) return;
    approvingTaskIdsRef.current.add(proposalId);
    setIsAnswering(true);
    setAgentSteps([]);
    updateTaskProposal(proposalId, (item) => item.status === "pending" || item.status === "failed"
      ? { ...item, status: "executing", error: null }
      : item);
    const generateId = startApprovalResolution({
      threadId: activeId,
      proposal,
      approved: false,
      onThreadUpdated: refreshThreads,
    });
    setActiveGenerateId(generateId);
  }, [activeId, approvalsByMessage, updateTaskProposal]);

  async function refreshThreads(selectId?: string) {
    const next = await listChatThreads();
    setThreads(next);
    setActiveId((current) => selectId ?? current ?? next[0]?.id ?? null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || isAnswering) return;
    if (submitBlockReason) {
      setError(submitBlockReason);
      return;
    }
    setQuestion("");
    setError(null);
    setIsAnswering(true);
    setStreamingContent("");
    streamBufferRef.current = "";
    setContextSources(initialContextSources);
    setContextStarted(true);
    setAgentSteps([]);

    try {
      let threadId = activeId;
      if (!threadId) {
        const thread = await createChatThread(text);
        threadId = thread.id;
        setActiveId(threadId);
      }
      await appendChatMessage(threadId, "user", text);
      const withUser = await listChatMessages(threadId);
      setMessages(withUser);

      const generateId = startChatGeneration({
        threadId,
        question: text,
        modelId: selectedModel.id,
        messages: withUser.slice(0, -1),
        onThreadUpdated: refreshThreads,
      });
      setActiveGenerateId(generateId);
    } catch (cause) {
      setIsAnswering(false);
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  function handleCancel() {
    if (activeGenerateId) {
      cancelGeneration(activeGenerateId);
    }
    setIsAnswering(false);
    setStreamingContent("");
    streamBufferRef.current = "";
    setActiveGenerateId(null);
  }

  function startNewChat() {
    if (activeGenerateId) {
      cancelGeneration(activeGenerateId);
    }
    setActiveGenerateId(null);
    setActiveId(null);
    setMessages([]);
    setContextSources(initialContextSources);
    setContextStarted(false);
    setError(null);
  }

  return (
    <div className="chat-page">
      <aside className="chat-threads">
        <button className="new-chat-button" type="button" onClick={startNewChat}>＋ 새 대화</button>
        <div className="chat-thread-list">
          {threads.map((thread) => (
            <div className={`chat-thread ${activeId === thread.id ? "active" : ""}`} key={thread.id}>
              <button type="button" onClick={() => setActiveId(thread.id)}>
                <strong>{thread.title}</strong>
                <small>{new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(thread.updatedAt))}</small>
              </button>
              <button
                type="button"
                aria-label="대화 삭제"
                onClick={async () => {
                  await deleteChatThread(thread.id);
                  if (activeId === thread.id) setActiveId(null);
                  await refreshThreads();
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>
      <section className="chat-conversation">
        <ContextStatusPanel sources={contextSources} active={contextStarted} generateId={activeGenerateId} />
        {displayMessages.length === 0 ? (
          <div className="chat-empty">
            <span>✦</span>
            <h2>Orbit에게 물어보세요</h2>
            <p>Task, Calendar, Jira, GitHub, Slack, Confluence를 연결한 Knowledge Graph로 답합니다.</p>
            <div>
              <button onClick={() => setQuestion("오늘 일정과 우선순위를 정리해줘")}>오늘 일정과 우선순위</button>
              <button onClick={() => setQuestion("2024년 온콜 관련 문서와 대화를 찾아줘")}>문서·대화 검색</button>
            </div>
          </div>
        ) : (
          <VirtualMessageList messages={displayMessages} onApproveTask={approveTask} onRejectTask={rejectTask} />
        )}
        {error && <div className="chat-error">{error}</div>}
        <form className="chat-composer" onSubmit={submit}>
          <div className="chat-composer-toolbar">
            <div className="chat-provider-tabs" role="tablist" aria-label="채팅 제공자 선택">
              {chatProviders.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  role="tab"
                  aria-selected={selectedProvider === provider}
                  className={`chat-provider-tab ${selectedProvider === provider ? "active" : ""}`}
                  title={isExecutableProvider(provider) ? undefined : `${providerLabels[provider]} 실행 경로는 준비 중입니다. 모델 목록만 볼 수 있습니다.`}
                  onClick={() => void switchProvider(provider)}
                  disabled={isAnswering || isSwitchingProvider}
                >
                  {providerLabels[provider]}
                  {!isExecutableProvider(provider) && <small>준비 중</small>}
                </button>
              ))}
            </div>
            <div className="chat-model-picker" ref={modelPickerRef}>
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isModelPickerOpen}
                disabled={isAnswering || isSwitchingProvider}
                onClick={() => setIsModelPickerOpen((current) => !current)}
              >
                <span>✦</span>
                <strong>{isSwitchingProvider ? "모델 목록 불러오는 중…" : selectedModel.label}</strong>
                {!isSwitchingProvider && <small>{selectedModel.description}</small>}
                <i>⌄</i>
              </button>
              {isModelPickerOpen && (
                <div className="chat-model-menu" role="listbox" aria-label={`${providerLabels[selectedProvider]} 모델 선택`}>
                  <header>
                    <strong>응답 모델</strong>
                    <span>{selectedProvider === "openai" ? "API 키에서 사용 가능한 모델" : `${providerLabels[selectedProvider]} 기본 목록 (실행 경로 준비 중)`}</span>
                  </header>
                  {models.map((model) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={model.id === selectedModel.id}
                      className={model.id === selectedModel.id ? "selected" : ""}
                      key={model.id}
                      onClick={async () => {
                        setModelNotice(null);
                        try {
                          await setOpenAiModelPreference(model.provider, model.id);
                          setSelectedProvider(model.provider);
                          setSelectedModelId(model.id);
                          setIsModelPickerOpen(false);
                        } catch (cause) {
                          setError(cause instanceof Error ? cause.message : String(cause));
                        }
                      }}
                    >
                      <span><strong>{model.label}</strong><small>{model.id}</small></span>
                      <em>{model.description}</em>
                      {model.id === selectedModel.id && <b>✓</b>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {modelNotice && <span className="chat-model-notice" title={modelNotice}>{modelNotice}</span>}
          </div>
          <textarea
            value={question}
            disabled={isAnswering}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="오늘 일정 뭐야?"
            rows={2}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          {isAnswering ? (
            <button className="chat-cancel-button" type="button" onClick={handleCancel}>
              <span /> 중단
            </button>
          ) : (
            <button className="primary-button" disabled={submitBlockReason !== null} title={submitBlockReason ?? undefined}>
              ↑
            </button>
          )}
          <small>
            {isAnswering
              ? "에이전트가 필요한 도구를 실행하고 결과를 확인하고 있습니다."
              : isExecutableProvider(selectedProvider)
                ? "연결된 업무 컨텍스트가 OpenAI로 전송됩니다. 답변은 캐시된 데이터 기준입니다."
                : `${providerLabels[selectedProvider]} 실행 경로는 준비 중입니다. 전송하려면 OpenAI 탭을 선택해 주세요.`}
          </small>
        </form>
      </section>
    </div>
  );
}

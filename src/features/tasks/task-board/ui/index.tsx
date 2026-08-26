import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { AlarmClock, Bot, CalendarDays, Check, ChevronDown, ChevronUp, GitBranch, GripVertical, Link2, LockKeyhole, MessageSquare, MoreHorizontal, Pencil, Plus, Ticket, Trash2, X } from "lucide-react";
import type { WorkItem, WorkItemStatus } from "../../../../entities/work-context/model/work-item";
import { statusMeta, workItemStatuses } from "../../../../entities/work-context/model/work-item";
import type { WorkItemSessionProgress } from "../../../../entities/work-context/api/ai-session-repository";
import type { WorkItemLink } from "../../../../entities/work-context/model/work-item-link";
import type { PlannerCategory } from "../../../../entities/work-context/model/planner";
import { reorderWorkItemIds, sortWorkItems, type TaskSortMode } from "../../../../entities/work-context/model/work-item-sort";
import { nextTaskBoardRefreshAt, taskBoardLaneForStatus, taskBoardLanes, visibleTaskBoardItems, type TaskBoardLane } from "../../../../entities/work-context/model/task-board";

const initialVisibleLimits = { todo: 12, done: 8 } as const;
const visibleIncrement = 12;

const taskBoardLaneMeta: Record<TaskBoardLane, { label: string }> = {
  todo: { label: "할 일" },
  ai_running: { label: "진행 중" },
  review: { label: "확인 필요" },
  done: { label: "완료" },
};

function formatWorkItemCreatedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatWorkItemTargetAt(value: string, nowMs: number) {
  const target = new Date(value);
  const label = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(target);
  return `${target.getTime() <= nowMs ? "지연" : "목표"} ${label}`;
}

function TaskRow({
  item,
  progress,
  links,
  category,
  nowMs,
  onMove,
  onRename,
  onOpenContext,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
  isFocusLocked = false,
  boardCard = false,
}: {
  item: WorkItem;
  progress?: WorkItemSessionProgress;
  links: WorkItemLink[];
  category?: PlannerCategory;
  nowMs: number;
  onMove: (id: string, status: WorkItemStatus) => Promise<void>;
  onRename: (id: string, title: string) => Promise<void>;
  onOpenContext: (item: WorkItem) => void;
  onDelete: (item: WorkItem) => void;
  onDragStart?: (event: DragEvent<HTMLElement>, item: WorkItem) => void;
  onDragOver?: (event: DragEvent<HTMLElement>, item: WorkItem) => void;
  onDrop?: (event: DragEvent<HTMLElement>, item: WorkItem) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isFocusLocked?: boolean;
  boardCard?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [renameError, setRenameError] = useState<string | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const jiraCount = links.filter((link) => link.kind === "jira").length;
  const githubCount = links.filter((link) => link.kind === "github_pr" || link.kind === "github_commit").length;
  const slackCount = links.filter((link) => link.kind === "slack").length;
  const aiCount = progress?.total ?? 0;

  useEffect(() => {
    if (boardCard && item.status === "focus") cardRef.current?.focus();
  }, [boardCard, item.id, item.status]);

  async function submitTitle(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      setRenameError(null);
      await onRename(item.id, title);
      setIsEditing(false);
    } catch (cause) {
      setRenameError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <article
      ref={cardRef}
      className={`task-row ${boardCard ? `task-board-card status-${item.status}` : ""} ${item.status === "review" ? "needs-review" : ""} ${onDragStart ? "is-sortable" : ""} ${isDragging ? "is-dragging" : ""} ${isFocusLocked ? "is-focus-locked" : ""}`}
      draggable={Boolean(onDragStart) && item.status !== "focus" && !isFocusLocked}
      inert={isFocusLocked ? true : undefined}
      aria-hidden={isFocusLocked ? true : undefined}
      tabIndex={boardCard ? 0 : undefined}
      aria-label={boardCard ? `${item.title}, ${statusMeta[item.status].label}.${item.status === "focus" ? " 다른 화면이 잠겨 있습니다. 집중 종료 또는 완료를 선택할 수 있습니다." : " 드래그하거나 Alt와 좌우 방향키로 상태를 이동할 수 있습니다."}` : undefined}
      onDragStart={onDragStart ? (event) => onDragStart(event, item) : undefined}
      onDragOver={onDragOver ? (event) => onDragOver(event, item) : undefined}
      onDrop={onDrop ? (event) => onDrop(event, item) : undefined}
      onDragEnd={onDragEnd}
      onClick={boardCard ? (event) => {
        if ((event.target as HTMLElement).closest("button, input, textarea, a")) return;
        onOpenContext(item);
      } : undefined}
      onKeyDown={boardCard ? (event) => {
        if ((event.target as HTMLElement).closest("button, input, textarea, a")) return;
        if (!event.altKey && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onOpenContext(item);
          return;
        }
        if (item.status === "focus") return;
        if (!event.altKey || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
        const currentIndex = taskBoardLanes.indexOf(taskBoardLaneForStatus(item.status));
        const nextIndex = currentIndex + (event.key === "ArrowRight" ? 1 : -1);
        const nextStatus = taskBoardLanes[nextIndex];
        if (!nextStatus) return;
        event.preventDefault();
        void onMove(item.id, nextStatus);
      } : undefined}
    >
      <header className="task-card-header">
        <div className="task-card-labels">
          <span className={`task-priority-tag ${item.priority ?? "unset"}`}>{item.priority?.toUpperCase() ?? "우선순위 없음"}</span>
          {category && <span className="task-category-tag"><i style={{ background: category.color }} />{category.name}</span>}
          {(item.status === "focus" || item.status === "review" || item.status === "blocked") && <span className={`task-card-status ${item.status}`}><i aria-hidden="true" />{statusMeta[item.status].shortLabel}</span>}
        </div>
        <div className="task-card-header-actions" onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsMenuOpen(false);
        }}>
          <button type="button" aria-label={`${item.title} 작업 메뉴`} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((current) => !current)}><MoreHorizontal size={16} /></button>
          {isMenuOpen && (
            <div className="task-card-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); onOpenContext(item); }}><Link2 size={13} /> 컨텍스트 보기</button>
              <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); setIsEditing(true); }}><Pencil size={13} /> 이름 수정</button>
              {item.status === "ai_running" && <>
                <div className="task-card-menu-divider" />
                <button className="focus-action" type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); void onMove(item.id, "focus"); }}><LockKeyhole size={13} /> 집중 시작</button>
              </>}
              {item.status === "focus" && <>
                <div className="task-card-menu-divider" />
                <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); void onMove(item.id, "ai_running"); }}><X size={13} /> 집중 종료</button>
                <button type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); void onMove(item.id, "done"); }}><Check size={13} /> 완료</button>
              </>}
              {item.status !== "focus" && <>
              <div className="task-card-menu-divider" />
              {taskBoardLanes.filter((status) => status !== taskBoardLaneForStatus(item.status)).map((status) => (
                <button type="button" role="menuitem" key={status} onClick={() => { setIsMenuOpen(false); void onMove(item.id, status); }}>
                  <span className={`task-card-menu-dot ${status}`} /> {taskBoardLaneMeta[status].label}로 이동
                </button>
              ))}
              </>}
              {item.status !== "focus" && <><div className="task-card-menu-divider" />
                <button className="danger" type="button" role="menuitem" onClick={() => { setIsMenuOpen(false); onDelete(item); }}><Trash2 size={13} /> 삭제</button></>}
            </div>
          )}
        </div>
      </header>
      <div className="task-copy">
        {isEditing ? (
          <form className="task-title-editor" onSubmit={submitTitle}>
            <input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus aria-label="작업 이름" />
            <button className="task-title-save" type="submit" aria-label="작업 이름 저장"><Check size={14} strokeWidth={2} aria-hidden="true" /></button>
            <button type="button" aria-label="취소" onClick={() => { setTitle(item.title); setIsEditing(false); }}><X size={14} strokeWidth={2} aria-hidden="true" /></button>
          </form>
        ) : <button className="task-card-title" type="button" onClick={() => onOpenContext(item)}>{item.title}</button>}
        {item.status === "blocked" && item.blockedReason && <p className="task-card-blocked">{item.blockedReason}</p>}
        {renameError && <small className="task-inline-error">{renameError}</small>}
      </div>
      <div className="task-card-dates">
        <span><CalendarDays size={12} aria-hidden="true" />생성 {formatWorkItemCreatedAt(item.createdAt)}</span>
        <span className={`task-target-time ${item.targetAt && new Date(item.targetAt).getTime() <= nowMs ? "is-overdue" : ""}`}>
          <AlarmClock size={12} aria-hidden="true" />{item.targetAt ? formatWorkItemTargetAt(item.targetAt, nowMs) : "목표일 없음"}
        </span>
      </div>
      {jiraCount + githubCount + slackCount + aiCount > 0 && <footer className="task-card-compact-meta">
        <span className="task-card-connections" aria-label="연결 컨텍스트">
          {jiraCount > 0 && <small title={`Jira ${jiraCount}개`}><Ticket size={12} />{jiraCount}</small>}
          {githubCount > 0 && <small title={`GitHub ${githubCount}개`}><GitBranch size={12} />{githubCount}</small>}
          {slackCount > 0 && <small title={`Slack ${slackCount}개`}><MessageSquare size={12} />{slackCount}</small>}
          {aiCount > 0 && <small title={`AI 세션 ${aiCount}개`}><Bot size={12} />{aiCount}</small>}
        </span>
      </footer>}
    </article>
  );
}

export default function TaskBoard({
  items,
  isLoading,
  onMove,
  onRename,
  onOpenContext,
  onDelete,
  sessionProgress,
  workItemLinks,
  categories,
  onAdd,
  sortMode,
  onSortModeChange,
  onReorder,
}: {
  items: Record<WorkItemStatus, WorkItem[]>;
  isLoading: boolean;
  onMove: (id: string, status: WorkItemStatus) => Promise<void>;
  onRename: (id: string, title: string) => Promise<void>;
  onOpenContext: (item: WorkItem) => void;
  onDelete: (item: WorkItem) => void;
  sessionProgress: Record<string, WorkItemSessionProgress>;
  workItemLinks: WorkItemLink[];
  categories: PlannerCategory[];
  onAdd: () => void;
  sortMode: TaskSortMode;
  onSortModeChange: (mode: TaskSortMode) => void;
  onReorder: (status: WorkItemStatus, orderedIds: string[]) => Promise<void>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingStatus, setDraggingStatus] = useState<TaskBoardLane | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskBoardLane | null>(null);
  const [isSortUnlockOpen, setIsSortUnlockOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [visibleLimits, setVisibleLimits] = useState({ ...initialVisibleLimits });
  const [forcedVisibleIds, setForcedVisibleIds] = useState<Set<string>>(() => new Set());
  const [now, setNow] = useState(() => new Date());
  const laneItems = useMemo(() => {
    const next: Record<TaskBoardLane, WorkItem[]> = { todo: [], ai_running: [], review: [], done: [] };
    workItemStatuses.forEach((status) => {
      items[status].forEach((item) => next[taskBoardLaneForStatus(item.status)].push(item));
    });
    return next;
  }, [items]);
  const sortedItems = useMemo(() => Object.fromEntries(
    taskBoardLanes.map((status) => {
      const sorted = sortWorkItems(laneItems[status], sortMode);
      if (status === "ai_running") {
        sorted.sort((left, right) => Number(right.status === "focus") - Number(left.status === "focus"));
      }
      return [status, sorted];
    }),
  ) as Record<TaskBoardLane, WorkItem[]>, [laneItems, sortMode]);
  const linksByWorkItem = useMemo(() => workItemLinks.reduce<Map<string, WorkItemLink[]>>((result, link) => {
    const current = result.get(link.workItemId) ?? [];
    current.push(link);
    result.set(link.workItemId, current);
    return result;
  }, new Map()), [workItemLinks]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const nextRefreshAt = useMemo(() => nextTaskBoardRefreshAt(
    taskBoardLanes.flatMap((status) => laneItems[status]),
    now,
  ), [laneItems, now]);
  const displayedItems = useMemo(() => ({
    todo: visibleTaskBoardItems(sortedItems.todo, visibleLimits.todo, forcedVisibleIds, now),
    ai_running: sortedItems.ai_running,
    review: sortedItems.review,
    done: visibleTaskBoardItems(sortedItems.done, visibleLimits.done, forcedVisibleIds, now),
  }), [sortedItems, visibleLimits, forcedVisibleIds, now]);
  const focusLocked = items.focus.length > 0;

  useEffect(() => {
    setVisibleLimits({ ...initialVisibleLimits });
    setForcedVisibleIds(new Set());
  }, [sortMode]);

  useEffect(() => {
    const delay = Math.max(1, nextRefreshAt - Date.now() + 25);
    const timer = window.setTimeout(() => setNow(new Date()), delay);
    return () => window.clearTimeout(timer);
  }, [nextRefreshAt]);

  function startDrag(event: DragEvent<HTMLElement>, item: WorkItem) {
    const origin = event.target as HTMLElement;
    if (origin.closest("button, input, textarea, a")) {
      event.preventDefault();
      return;
    }
    if (sortMode !== "manual") {
      event.preventDefault();
      setIsSortUnlockOpen(true);
      return;
    }
    setDraggingId(item.id);
    setDraggingStatus(taskBoardLaneForStatus(item.status));
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", item.id);
  }

  async function dropItem(event: DragEvent<HTMLElement>, status: TaskBoardLane, target?: WorkItem) {
    event.preventDefault();
    event.stopPropagation();
    setDragOverStatus(null);
    if (!draggingId || !draggingStatus) return;

    const dragged = laneItems[draggingStatus].find((item) => item.id === draggingId);
    if (!dragged) return;

    if (draggingStatus !== status) {
      setAnnouncement(`${dragged.title}을 ${taskBoardLaneMeta[status].label}로 이동합니다.`);
      setForcedVisibleIds(status === "todo" || status === "done" ? new Set([dragged.id]) : new Set());
      setDraggingId(null);
      setDraggingStatus(null);
      await onMove(dragged.id, status);
      return;
    }

    if (!target || draggingId === target.id) {
      setDraggingId(null);
      setDraggingStatus(null);
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const placeAfter = event.clientY > bounds.top + bounds.height / 2;
    const orderedIds = reorderWorkItemIds(sortedItems[status].map(({ id }) => id), draggingId, target.id, placeAfter);
    setDraggingId(null);
    setDraggingStatus(null);
    setAnnouncement(`${dragged.title}의 순서를 변경했습니다.`);
    await onReorder(dragged.status, orderedIds.filter((id) => laneItems[status].some((item) => item.id === id && item.status === dragged.status)));
  }

  function finishDrag() {
    setDraggingId(null);
    setDraggingStatus(null);
    setDragOverStatus(null);
  }

  return (
    <>
    <section className={`task-board-page ${focusLocked ? "is-focus-locked" : ""}`} aria-label="Task 보드">
      <header className="task-board-toolbar" inert={focusLocked ? true : undefined} aria-hidden={focusLocked ? true : undefined}>
        <div>
          <h2>Task</h2>
        </div>
        <div className="task-sort-actions">
          <span>{items.todo.length + items.focus.length + items.ai_running.length + items.review.length + items.blocked.length + items.inbox.length + items.done.length}개</span>
          <label>
            <span className="sr-only">Task 정렬 방식</span>
            <select value={sortMode} onChange={(event) => onSortModeChange(event.target.value as TaskSortMode)}>
              <option value="manual">수동 정렬</option>
              <option value="newest">최신 생성순</option>
              <option value="oldest">오래된 생성순</option>
            </select>
          </label>
        </div>
      </header>

      {isLoading ? (
        <div className="empty-state">작업을 불러오는 중…</div>
      ) : (
        <div className="task-board-scroll">
          <div className="task-board">
            {taskBoardLanes.map((status) => {
              const isLockedColumn = focusLocked && status !== "ai_running";
              const isFocusColumn = focusLocked && status === "ai_running";
              return (
              <section
                className={`task-board-column task-board-column-${status} ${isFocusColumn ? "is-focus-column" : ""} ${isLockedColumn ? "is-locked" : ""} ${dragOverStatus === status ? "is-drag-over" : ""}`}
                key={status}
                aria-labelledby={`task-column-${status}`}
                inert={isLockedColumn ? true : undefined}
                aria-hidden={isLockedColumn ? true : undefined}
                onDragOver={(event) => {
                  if (!draggingId || isLockedColumn) return;
                  event.preventDefault();
                  setDragOverStatus(status);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverStatus(null);
                }}
                onDrop={(event) => { void dropItem(event, status); }}
              >
                <header className="task-board-column-header">
                  <div>
                    <span className={`task-board-status-dot ${status}`} aria-hidden="true" />
                    <div>
                      <h3 id={`task-column-${status}`}>{taskBoardLaneMeta[status].label}</h3>
                    </div>
                  </div>
                  <span className="task-board-count" aria-label={`${laneItems[status].length}개`}>{laneItems[status].length}</span>
                </header>

                {isFocusColumn && (
                  <div className="focus-lock-banner" role="status"><LockKeyhole size={14} /> 현재 한 작업에 집중 중</div>
                )}

                <div className="task-board-list">
                  {displayedItems[status].map((item) => (
                    <TaskRow
                      key={item.id}
                      item={item}
                      progress={sessionProgress[item.id]}
                      links={linksByWorkItem.get(item.id) ?? []}
                      category={item.categoryId ? categoryById.get(item.categoryId) : undefined}
                      nowMs={now.getTime()}
                      onMove={onMove}
                      onRename={onRename}
                      onOpenContext={onOpenContext}
                      onDelete={onDelete}
                      onDragStart={startDrag}
                      onDragOver={(event) => { if (draggingId) event.preventDefault(); }}
                      onDrop={(event, target) => { void dropItem(event, status, target); }}
                      onDragEnd={finishDrag}
                      isDragging={draggingId === item.id}
                      isFocusLocked={focusLocked && item.id !== items.focus[0]?.id}
                      boardCard
                    />
                  ))}
                  {sortedItems[status].length === 0 && (
                    <div className="task-board-empty">
                      <strong>{taskBoardLaneMeta[status].label} 작업이 없습니다</strong>
                      <span>{status === "todo" ? "새 작업을 추가하거나 카드를 여기로 옮겨보세요." : "다른 열의 카드를 여기로 옮겨보세요."}</span>
                      {status === "todo" && <button type="button" onClick={onAdd}><Plus size={13} /> 작업 추가</button>}
                    </div>
                  )}
                  {(status === "todo" || status === "done") && sortedItems[status].length > displayedItems[status].length && (
                    <div className="task-board-load-actions">
                      <button type="button" onClick={() => setVisibleLimits((current) => ({
                        ...current,
                        [status]: current[status] + visibleIncrement,
                      }))}>
                        <ChevronDown size={13} /> 다음 {Math.min(visibleIncrement, sortedItems[status].length - displayedItems[status].length)}개 더 보기
                      </button>
                      {visibleLimits[status] > initialVisibleLimits[status] && <button type="button" onClick={() => setVisibleLimits((current) => ({
                        ...current,
                        [status]: initialVisibleLimits[status],
                      }))}><ChevronUp size={13} /> 접기</button>}
                    </div>
                  )}
                  {(status === "todo" || status === "done")
                    && sortedItems[status].length > initialVisibleLimits[status]
                    && sortedItems[status].length === displayedItems[status].length
                    && visibleLimits[status] > initialVisibleLimits[status] && (
                    <div className="task-board-load-actions is-collapse-only">
                      <button type="button" onClick={() => setVisibleLimits((current) => ({
                        ...current,
                        [status]: initialVisibleLimits[status],
                      }))}><ChevronUp size={13} /> 기본 개수로 접기</button>
                    </div>
                  )}
                </div>
              </section>
              );
            })}
          </div>
        </div>
      )}
      <p className="sr-only" aria-live="polite">{focusLocked ? `${items.focus[0]?.title} 작업에 집중 중입니다. 다른 화면은 잠겼습니다.` : announcement}</p>
    </section>
    {isSortUnlockOpen && (
      <div className="modal-backdrop" onMouseDown={() => setIsSortUnlockOpen(false)}>
        <section className="sort-unlock-modal" onMouseDown={(event) => event.stopPropagation()}>
          <div className="sort-unlock-icon"><GripVertical size={18} strokeWidth={1.8} /></div>
          <h2>정렬을 해제하시겠습니까?</h2>
          <p>현재 날짜순으로 정렬되어 있습니다. 드래그로 순서를 바꾸려면 수동 정렬로 전환해야 합니다.</p>
          <div>
            <button type="button" onClick={() => setIsSortUnlockOpen(false)}>아니요</button>
            <button className="primary-button" type="button" onClick={() => { onSortModeChange("manual"); setIsSortUnlockOpen(false); }}>예, 정렬 해제</button>
          </div>
        </section>
      </div>
    )}
    </>
  );
}

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Pause,
  Play,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  createWorkItem,
  deleteWorkItem,
  listWorkItems,
} from "../../entities/work-context/api/work-item-repository";
import {
  getFocusSlot,
  switchFocusedWorkItem,
  transitionWorkItem,
} from "../../entities/work-context/api/work-continuity-repository";
import type { WorkItem } from "../../entities/work-context/model/work-item";
import { notifyDueWorkItems } from "../../features/tasks/task-reminders";
import { notifyDueStretchReminder } from "../../features/wellbeing/stretch-reminders";
import { PetMascot } from "../pet/PetMascot";
import "./TrayApp.scss";
import WorkInbox from "./WorkInbox";
import DayHistory from "./DayHistory";
import { controlFocusTimer, getDayRecord, getFocusTimer, type DayRecord } from "../../entities/work-context/api/focus-history-repository";
import { formatFocusDuration, type FocusTimer } from "../../entities/work-context/model/focus-history";

export default function TrayApp() {
  const [tab, setTab] = useState<"tasks" | "jira" | "reviews">("tasks");
  const [items, setItems] = useState<WorkItem[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [timer, setTimer] = useState<FocusTimer | null>(null);
  const [today, setToday] = useState<DayRecord | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listWorkItems();
      setItems(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 3_000);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") void invoke("hide_tray_window");
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [refresh]);

  useEffect(() => {
    let active = true;
    const refreshTime = () => void Promise.all([getFocusTimer(), getDayRecord(new Date())]).then(([nextTimer, nextDay]) => {
      if (active) { setTimer(nextTimer); setToday(nextDay); setHistoryError(null); }
    }).catch((cause) => active && setHistoryError(String(cause)));
    refreshTime();
    const interval = window.setInterval(refreshTime, 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      void notifyDueWorkItems().catch((cause) => {
        console.warn("목표 시간 알림을 확인하지 못했습니다.", cause);
      });
      void notifyDueStretchReminder().catch((cause) => {
        console.warn("스트레칭 알림을 확인하지 못했습니다.", cause);
      });
    };
    checkReminders();
    const interval = window.setInterval(checkReminders, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const focusItem = useMemo(() => items.find((item) => item.status === "focus"), [items]);
  const todoItems = useMemo(
    () => items.filter((item) => item.status !== "focus" && item.status !== "done"),
    [items],
  );
  const doneItems = useMemo(
    () => items.filter((item) => item.status === "done"),
    [items],
  );
  async function handleCreateTask(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    try {
      await createWorkItem({
        title: trimmed,
        status: "todo",
      });
      setNewTitle("");
      await refresh();
    } catch (cause) {
      console.error("할 일 등록 실패:", cause);
    }
  }

  async function handleStart(item: WorkItem) {
    try {
      const slot = await getFocusSlot();
      if (focusItem) {
        await switchFocusedWorkItem({
          currentWorkItemId: focusItem.id,
          requestedWorkItemId: item.id,
          expectedSlotRevision: slot.revision,
          expectedCurrentRevision: focusItem.revision,
          expectedRequestedRevision: item.revision,
          releaseStatus: "todo",
          checkpoint: focusItem.checkpoint || "트레이에서 작업 전환",
          nextAction: focusItem.nextAction || `${focusItem.title} 이어서 진행`,
        });
      } else {
        await switchFocusedWorkItem({
          currentWorkItemId: null,
          requestedWorkItemId: item.id,
          expectedSlotRevision: slot.revision,
          expectedCurrentRevision: null,
          expectedRequestedRevision: item.revision,
        });
      }
      try {
        await invoke("show_pet_window");
      } catch {
        // ignore pet window failure
      }
      await refresh();
    } catch (cause) {
      console.error("작업 시작 실패:", cause);
    }
  }

  async function handlePause() {
    try { setTimer(await controlFocusTimer("toggle")); setError(false); }
    catch { setError(true); }
  }

  async function handleComplete(item: WorkItem) {
    try {
      await transitionWorkItem({
        workItemId: item.id,
        expectedRevision: item.revision,
        targetStatus: "done",
      });
      await refresh();
    } catch (cause) {
      console.error("완료 실패:", cause);
      await refresh();
    }
  }

  async function handleUncomplete(item: WorkItem) {
    try {
      await transitionWorkItem({
        workItemId: item.id,
        expectedRevision: item.revision,
        targetStatus: "todo",
      });
      await refresh();
    } catch (cause) {
      console.error("완료 취소 실패:", cause);
      await refresh();
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteWorkItem(id);
      await refresh();
    } catch (cause) {
      console.error("삭제 실패:", cause);
    }
  }

  return (
    <div className="tray-window-container">
      <div className="tray-arrow-notch" />

      <main className="tray-shell">
        <nav className="tray-tabs" aria-label="Orbit">
          {([{ id: "tasks", label: "할 일" }, { id: "jira", label: "Jira" }, { id: "reviews", label: "PR 리뷰" }] as const).map((item) => (
            <button type="button" key={item.id} aria-current={tab === item.id ? "page" : undefined} onClick={() => { setTab(item.id); setHistoryOpen(false); }}>{item.label}</button>
          ))}
        </nav>
        {historyOpen && <DayHistory />}
        {!historyOpen && tab !== "tasks" && <WorkInbox key={tab} source={tab} />}
        <div className="tray-task-view" hidden={tab !== "tasks" || historyOpen}>
        {/* Quick Add Form */}
        <header className="tray-quick-header">
          <form className="tray-quick-form" onSubmit={handleCreateTask}>
            <Plus size={15} className="quick-add-icon" />
            <input
              type="text"
              className="quick-add-input"
              placeholder="오늘 할 일을 입력하고 Enter..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
          </form>
        </header>

        {error && <div className="tray-error-banner">작업 데이터를 불러오지 못했습니다.</div>}

        <div className="tray-body-scroll">
          {/* NOW: Active Focus Slot */}
          <section className="tray-section tray-now-section">
            <div className="section-label">
              <span className="label-text">진행 중</span>
              {focusItem && <span className="now-pulsing-dot" />}
            </div>

            {focusItem ? (
              <div className="now-card">
                <div className="now-header">
                  <div className="now-icon-wrapper">
                    <PetMascot mood={timer?.mode === "shortBreak" ? "break" : "focus"} isRunning={Boolean(timer?.running)} size={36} />
                  </div>
                  <div className="now-info">
                    <h3 className="now-title">{focusItem.title}</h3>
                    <div className="now-timer">
                      <Clock size={11} strokeWidth={2.2} />
                      <span>{formatFocusDuration(today?.tasks.find((task) => task.id === focusItem.id)?.focusMs ?? 0)} · {timer?.mode === "shortBreak" ? "휴식" : timer?.running ? "집중 중" : "일시정지"}</span>
                    </div>
                  </div>
                </div>
                <div className="now-actions">
                  <button
                    type="button"
                    className="now-btn now-btn-complete"
                    onClick={() => handleComplete(focusItem)}
                    title="작업 완료"
                  >
                    <Check size={13} strokeWidth={2.6} />
                    <span>완료</span>
                  </button>
                  <button
                    type="button"
                    className="now-btn now-btn-pause"
                    onClick={() => void handlePause()}
                    title={timer?.running ? "일시정지" : "타이머 시작"}
                  >
                    {timer?.running ? <Pause size={13} strokeWidth={2.4} /> : <Play size={13} strokeWidth={2.4} />}
                    <span>{timer?.running ? "일시정지" : timer?.mode === "shortBreak" ? "휴식 시작" : "다시 시작"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="now-idle-card">
                <Sparkles size={14} className="idle-sparkle-icon" />
                <span>몰입할 작업을 시작해보세요</span>
              </div>
            )}
          </section>

          {/* TODO: Waiting Tasks */}
          <section className="tray-section tray-todo-section">
            <div className="section-label">
              <span className="label-text">할 일</span>
              <span className="count-badge">{todoItems.length}</span>
            </div>

            {isLoading ? (
              <div className="tray-empty-hint">불러오는 중…</div>
            ) : todoItems.length > 0 ? (
              <div className="task-item-list">
                {todoItems.map((item) => (
                  <div className="task-row todo-row" key={item.id}>
                    <button
                      type="button"
                      className="task-check-btn"
                      onClick={() => handleComplete(item)}
                      title="완료하기"
                    >
                      <Circle size={15} strokeWidth={1.8} />
                    </button>
                    <div className="tray-task-copy">
                      <span className="task-row-title" title={item.title}>{item.title}</span>
                    </div>
                    <div className="task-row-actions">
                      <button
                        type="button"
                        className="task-action-btn btn-start"
                        onClick={() => handleStart(item)}
                        title="몰입 시작"
                      >
                        <Play size={11} strokeWidth={2.4} />
                        <span>시작</span>
                      </button>
                      <button
                        type="button"
                        className="task-action-btn btn-delete"
                        onClick={() => handleDelete(item.id)}
                        title="삭제"
                      >
                        <Trash2 size={12} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tray-empty-hint">대기 중인 할 일이 없습니다.</div>
            )}
          </section>

          {/* DONE: Completed Tasks */}
          {doneItems.length > 0 && (
            <section className="tray-section tray-done-section">
              <div className="section-label">
                <span className="label-text">완료</span>
                <span className="count-badge done-badge">{doneItems.length}</span>
              </div>
              <div className="task-item-list">
                {doneItems.slice(0, 10).map((item) => (
                  <div className="task-row done-row" key={item.id}>
                    <button
                      type="button"
                      className="task-check-btn is-done"
                      onClick={() => handleUncomplete(item)}
                      title="할 일로 되돌리기"
                    >
                      <CheckCircle2 size={15} strokeWidth={2.2} />
                    </button>
                    <div className="tray-task-copy">
                      <span className="task-row-title is-strikethrough" title={item.title}>{item.title}</span>
                    </div>
                    <button
                      type="button"
                      className="task-action-btn btn-delete-done"
                      onClick={() => handleDelete(item.id)}
                      title="목록에서 삭제"
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        </div>

        {/* Footer */}
        <footer className="tray-bottom-bar">
          <button type="button" className="tray-daily-toggle" aria-expanded={historyOpen} onClick={() => setHistoryOpen(!historyOpen)} title={historyError || "날짜별 집중 시간과 완료한 일 보기"}>
            {historyError ? "기록 확인 필요" : today ? `오늘 집중 ${formatFocusDuration(today.focusMs)} · 완료 ${today.completedCount}개` : "오늘 기록 불러오는 중…"}
          </button>

          <div className="tray-footer-right">
            <button
              type="button"
              className="tray-footer-btn"
              onClick={() => void invoke("toggle_pet_window")}
              title="플로팅 펫 토글"
            >
              🐾 펫
            </button>
            <button
              type="button"
              className="tray-footer-btn"
              onClick={() => void invoke("hide_tray_window")}
              title="닫기 (Esc)"
            >
              닫기
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}

import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { listWorkItems } from "../../entities/work-context/api/work-item-repository";
import {
  getFocusSlot,
  switchFocusedWorkItem,
} from "../../entities/work-context/api/work-continuity-repository";
import type { WorkItem } from "../../entities/work-context/model/work-item";
import { notifyDueWorkItems } from "../../features/tasks/task-reminders";
import { notifyDueStretchReminder } from "../../features/wellbeing/stretch-reminders";
import { PetMascot } from "../pet/PetMascot";
import "./TrayApp.scss";

export default function TrayApp() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"focus" | "tasks">("focus");

  const refresh = useCallback(async () => {
    try {
      setItems(await listWorkItems());
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

  const focusItem = items.find((item) => item.status === "focus");
  const nextItems = useMemo(
    () => items.filter((item) => item.status === "review" || item.status === "todo").slice(0, 4),
    [items],
  );
  const reviewCount = items.filter((item) => item.status === "review").length;
  const aiCount = items.filter((item) => item.status === "ai_running").length;

  async function start(item: WorkItem) {
    if (focusItem) {
      await invoke("show_main_window");
      return;
    }

    const slot = await getFocusSlot();
    await switchFocusedWorkItem({
      currentWorkItemId: null,
      requestedWorkItemId: item.id,
      expectedSlotRevision: slot.revision,
      expectedCurrentRevision: null,
      expectedRequestedRevision: item.revision,
    });
    try {
      await invoke("show_pet_window");
    } catch {
      // Ignore if not supported
    }
    await refresh();
  }

  const handleTogglePet = async () => {
    try {
      await invoke("toggle_pet_window");
    } catch (cause) {
      console.warn("펫 토글 실패:", cause);
    }
  };

  return (
    <div className="tray-window-container">
      {/* Top native pointer arrow notch */}
      <div className="tray-arrow-notch" />

      <main className="tray-shell">
        {/* macOS Native Segmented Control Tabs */}
        <header className="tray-segmented-bar">
          <div className="macos-segmented-control">
            <button
              type="button"
              className={activeTab === "focus" ? "is-active" : ""}
              onClick={() => setActiveTab("focus")}
            >
              지금 몰입
            </button>
            <button
              type="button"
              className={activeTab === "tasks" ? "is-active" : ""}
              onClick={() => setActiveTab("tasks")}
            >
              다음 작업 ({nextItems.length})
            </button>
          </div>

          <button
            type="button"
            className="tray-icon-btn"
            onClick={() => invoke("show_main_window")}
            title="Orbit 전체 앱 열기"
            aria-label="전체 앱 열기"
          >
            <ExternalLink size={13} strokeWidth={2.2} />
          </button>
        </header>

        {error && <div className="tray-error-banner">작업 데이터를 불러오지 못했습니다.</div>}

        {/* Tab 1: FOCUS MODE (Desktop Pet Companion Card) */}
        {activeTab === "focus" && (
          <section className="tray-focus-section">
            <div className="tray-pet-card">
              <div className="tray-pet-visual">
                <PetMascot mood={focusItem ? "focus" : "idle"} isRunning={Boolean(focusItem)} size={56} />
              </div>

              <div className="tray-pet-meta">
                <div className="tray-pet-tag">
                  {focusItem ? (
                    <span className="badge-focus">
                      <Flame size={11} strokeWidth={2.4} /> FOCUSING
                    </span>
                  ) : (
                    <span className="badge-idle">
                      <Sparkles size={11} strokeWidth={2.2} /> READY
                    </span>
                  )}
                </div>
                <h2 className="tray-pet-task-name">
                  {focusItem ? focusItem.title : "몰입할 작업을 시작해보세요"}
                </h2>
                <p className="tray-pet-desc">
                  {focusItem
                    ? focusItem.nextAction || "다음 행동을 기록해보세요."
                    : "아래 목록에서 작업을 선택하거나 플로팅 펫을 띄워보세요."}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="tray-action-group">
              <button
                type="button"
                className="macos-btn macos-btn-primary"
                onClick={handleTogglePet}
              >
                <span>🐾 뽀모도로 플로팅 펫 띄우기</span>
                <ChevronRight size={14} strokeWidth={2} />
              </button>

              {focusItem ? (
                <button
                  type="button"
                  className="macos-btn macos-btn-secondary"
                  onClick={() => invoke("show_main_window")}
                >
                  <CheckCircle2 size={13} strokeWidth={2} />
                  <span>앱에서 완료·전환하기</span>
                </button>
              ) : null}
            </div>
          </section>
        )}

        {/* Tab 2: NEXT TASKS LIST */}
        {activeTab === "tasks" && (
          <section className="tray-tasks-section">
            {isLoading ? (
              <div className="tray-empty-state">불러오는 중…</div>
            ) : nextItems.length > 0 ? (
              <div className="tray-task-list">
                {nextItems.map((item) => (
                  <div className="tray-task-card" key={item.id}>
                    <div className="tray-task-info">
                      <strong className="tray-task-title">{item.title}</strong>
                      <span className="tray-task-sub">
                        {item.nextAction || (item.status === "review" ? "확인 필요" : "할 일")}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="macos-btn-start"
                      onClick={() => start(item)}
                    >
                      {focusItem ? "전환" : "시작"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tray-empty-state">남은 다음 작업이 없습니다.</div>
            )}
          </section>
        )}

        {/* macOS Native Status Bottom Bar */}
        <footer className="tray-bottom-bar">
          <div className="tray-metric">
            <span className="metric-label">내 확인 필요</span>
            <span className="metric-badge">{reviewCount}</span>
          </div>
          <div className="tray-metric">
            <span className="metric-label">AI 작업 중</span>
            <span className="metric-badge">{aiCount}</span>
          </div>
          <button
            type="button"
            className="tray-main-link"
            onClick={() => invoke("show_main_window")}
          >
            대시보드 열기
          </button>
        </footer>
      </main>
    </div>
  );
}

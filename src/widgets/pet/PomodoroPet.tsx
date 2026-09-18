import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Play, Pause, RotateCcw, ExternalLink, X, Coffee } from "lucide-react";
import { listWorkItems } from "../../entities/work-context/api/work-item-repository";
import type { WorkItem } from "../../entities/work-context/model/work-item";
import { formatTimeDisplay, type PomodoroState } from "../../entities/work-context/model/pomodoro";
import { PetMascot, type PetMood } from "./PetMascot";
import "./PetMascot.scss";
import "./PomodoroPet.scss";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export default function PomodoroPet() {
  const [state, setState] = useState<PomodoroState>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_SECONDS);
  const [currentTask, setCurrentTask] = useState<WorkItem | null>(null);

  // Sync current focused task from Orbit repository
  const refreshTask = useCallback(async () => {
    try {
      const items = await listWorkItems();
      const focused = items.find((item) => item.status === "focus") || null;
      setCurrentTask(focused);
    } catch {
      // Ignore database poll errors during background
    }
  }, []);

  useEffect(() => {
    void refreshTask();
    const interval = window.setInterval(() => void refreshTask(), 3000);
    return () => window.clearInterval(interval);
  }, [refreshTask]);

  // Pomodoro countdown timer tick
  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          // Switch between Focus and Break automatically or pause
          if (state === "focus") {
            setState("shortBreak");
            return BREAK_SECONDS;
          } else {
            setState("focus");
            return FOCUS_SECONDS;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, state]);

  // Drag window handler
  const handleDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input")) return;
    void getCurrentWindow().startDragging().catch(() => {});
  };

  const toggleRun = () => setIsRunning((prev) => !prev);

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(state === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
  };

  const switchMode = () => {
    setIsRunning(false);
    if (state === "focus") {
      setState("shortBreak");
      setRemainingSeconds(BREAK_SECONDS);
    } else {
      setState("focus");
      setRemainingSeconds(FOCUS_SECONDS);
    }
  };

  const openMainWindow = async () => {
    await invoke("show_main_window");
  };

  const closePet = async () => {
    await invoke("hide_pet_window");
  };

  // Determine pet visual mood
  const mood: PetMood = state === "shortBreak" || state === "longBreak"
    ? "break"
    : isRunning
      ? "focus"
      : "idle";

  return (
    <div className="pet-window-shell" onPointerDown={handleDrag}>
      <div
        className={`pet-card ${state === "focus" ? "is-focus" : "is-break"}`}
        data-tauri-drag-region
      >
        {/* Interactive hover controls toolbar */}
        <div className="pet-hover-controls">
          <button
            type="button"
            className="pet-btn"
            onClick={toggleRun}
            title={isRunning ? "일시정지" : "시작"}
          >
            {isRunning ? <Pause size={11} strokeWidth={2.4} /> : <Play size={11} strokeWidth={2.4} />}
          </button>
          <button
            type="button"
            className="pet-btn"
            onClick={resetTimer}
            title="타이머 초기화"
          >
            <RotateCcw size={11} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="pet-btn"
            onClick={switchMode}
            title={state === "focus" ? "휴식 모드로 전환" : "집중 모드로 전환"}
          >
            <Coffee size={11} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="pet-btn"
            onClick={openMainWindow}
            title="Orbit 메인 창 열기"
          >
            <ExternalLink size={11} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="pet-btn pet-btn-close"
            onClick={closePet}
            title="펫 닫기"
          >
            <X size={11} strokeWidth={2.4} />
          </button>
        </div>

        {/* Mascot Avatar with quick toggle on click */}
        <div
          className="pet-left-avatar"
          onClick={toggleRun}
          title={isRunning ? "클릭하여 일시정지" : "클릭하여 집중 시작"}
        >
          <PetMascot mood={mood} isRunning={isRunning} size={44} />
        </div>

        {/* Status and Timer column */}
        <div className="pet-info-col" data-tauri-drag-region>
          <div className="pet-status-row" data-tauri-drag-region>
            <span
              className={`pet-mode-badge ${state === "focus" ? "badge-focus" : "badge-break"}`}
            >
              {state === "focus" ? "FOCUS" : "REST"}
            </span>
            <span className="pet-timer-val">{formatTimeDisplay(remainingSeconds)}</span>
          </div>

          <div
            className="pet-task-title"
            title={currentTask ? currentTask.title : "클릭하여 Orbit에서 작업 선택"}
            onClick={openMainWindow}
            style={{ cursor: "pointer" }}
          >
            {currentTask ? currentTask.title : "자유 몰입"}
          </div>
        </div>
      </div>
    </div>
  );
}

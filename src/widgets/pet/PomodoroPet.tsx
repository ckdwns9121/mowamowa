import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Play, Pause, RotateCcw, ExternalLink, X, Coffee, Clock } from "lucide-react";
import { listWorkItems } from "../../entities/work-context/api/work-item-repository";
import type { WorkItem } from "../../entities/work-context/model/work-item";
import {
  formatTimeDisplay,
  getStoredPomodoroSettings,
  saveStoredPomodoroSettings,
  FOCUS_PRESET_MINUTES,
  BREAK_PRESET_MINUTES,
  type PomodoroSettings,
  type PomodoroState,
} from "../../entities/work-context/model/pomodoro";
import { PetMascot, type PetMood } from "./PetMascot";
import "./PetMascot.scss";
import "./PomodoroPet.scss";

export default function PomodoroPet() {
  const [settings, setSettings] = useState<PomodoroSettings>(() => getStoredPomodoroSettings());
  const [state, setState] = useState<PomodoroState>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(() => settings.focusDurationMinutes * 60);
  const [currentTask, setCurrentTask] = useState<WorkItem | null>(null);
  const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);

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
            return settings.shortBreakDurationMinutes * 60;
          } else {
            setState("focus");
            return settings.focusDurationMinutes * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, state, settings.focusDurationMinutes, settings.shortBreakDurationMinutes]);

  // Drag window handler
  const handleDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, .pet-picker-popover")) return;
    void getCurrentWindow().startDragging().catch(() => {});
  };

  const toggleRun = () => {
    setIsDurationPickerOpen(false);
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsDurationPickerOpen(false);
    setRemainingSeconds(
      state === "focus"
        ? settings.focusDurationMinutes * 60
        : settings.shortBreakDurationMinutes * 60,
    );
  };

  const switchMode = () => {
    setIsRunning(false);
    setIsDurationPickerOpen(false);
    if (state === "focus") {
      setState("shortBreak");
      setRemainingSeconds(settings.shortBreakDurationMinutes * 60);
    } else {
      setState("focus");
      setRemainingSeconds(settings.focusDurationMinutes * 60);
    }
  };

  const openMainWindow = async () => {
    await invoke("show_main_window");
  };

  const closePet = async () => {
    await invoke("hide_pet_window");
  };

  const selectDuration = (minutes: number) => {
    const updated: PomodoroSettings = {
      ...settings,
      ...(state === "focus"
        ? { focusDurationMinutes: minutes }
        : { shortBreakDurationMinutes: minutes }),
    };
    setSettings(updated);
    saveStoredPomodoroSettings(updated);
    setIsRunning(false);
    setRemainingSeconds(minutes * 60);
    setIsDurationPickerOpen(false);
  };

  // Determine pet visual mood
  const mood: PetMood = state === "shortBreak" || state === "longBreak"
    ? "break"
    : isRunning
      ? "focus"
      : "idle";

  const cardStateClass = isRunning
    ? "is-running"
    : state === "focus"
      ? "is-focus"
      : "is-break";

  return (
    <div className="pet-window-shell" onPointerDown={handleDrag}>
      <div
        className={`pet-card ${cardStateClass}`}
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
            onClick={() => setIsDurationPickerOpen((prev) => !prev)}
            title="시간 변경 (15분 / 25분 / 45분 / 60분)"
          >
            <Clock size={11} strokeWidth={2.2} />
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
          <PetMascot mood={mood} isRunning={isRunning} size={64} />
        </div>

        {/* Status and Timer column */}
        <div className="pet-info-col" data-tauri-drag-region>
          <div className="pet-status-row" data-tauri-drag-region>
            <span
              className={`pet-mode-badge ${
                isRunning
                  ? "badge-running"
                  : state === "focus"
                    ? "badge-focus"
                    : "badge-break"
              }`}
            >
              {isRunning ? "FOCUSING" : state === "focus" ? "FOCUS" : "REST"}
            </span>
            <button
              type="button"
              className="pet-timer-btn"
              onClick={() => setIsDurationPickerOpen((prev) => !prev)}
              title="시간 설정 변경"
            >
              <span className="pet-timer-val">{formatTimeDisplay(remainingSeconds)}</span>
            </button>
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

        {/* Time duration quick picker popover */}
        {isDurationPickerOpen && (
          <div className="pet-picker-popover" onPointerDown={(e) => e.stopPropagation()}>
            <div className="pet-picker-header">
              <span>{state === "focus" ? "집중 시간 선택" : "휴식 시간 선택"}</span>
              <button
                type="button"
                className="pet-picker-close"
                onClick={() => setIsDurationPickerOpen(false)}
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            </div>
            <div className="pet-picker-chips">
              {(state === "focus" ? FOCUS_PRESET_MINUTES : BREAK_PRESET_MINUTES).map((min) => {
                const currentSetting = state === "focus"
                  ? settings.focusDurationMinutes
                  : settings.shortBreakDurationMinutes;
                const isSelected = currentSetting === min;
                return (
                  <button
                    key={min}
                    type="button"
                    className={`pet-chip-btn ${isSelected ? "is-selected" : ""}`}
                    onClick={() => selectDuration(min)}
                  >
                    {min}분
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

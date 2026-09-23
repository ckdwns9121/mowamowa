import React, { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emitTo, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Play, Pause, RotateCcw, ExternalLink, X, Coffee, Clock, PawPrint } from "lucide-react";
import { getFocusTimer, controlFocusTimer } from "../../entities/work-context/api/focus-history-repository";
import type { FocusTimer } from "../../entities/work-context/model/focus-history";
import { formatTimeDisplay, FOCUS_PRESET_MINUTES, BREAK_PRESET_MINUTES } from "../../entities/work-context/model/pomodoro";
import { useSelectedPet } from "../../entities/pet";
import { PetMascot, type PetMood } from "./PetMascot";
import "./PetMascot.scss";
import "./PomodoroPet.scss";

export default function PomodoroPet() {
  const selectedPet = useSelectedPet();
  const [celebrating, setCelebrating] = useState(false);
  const [timer, setTimer] = useState<FocusTimer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
  const state = timer?.mode ?? "focus";
  const isRunning = Boolean(timer?.running);
  const remainingSeconds = Math.ceil((timer?.remaining_ms ?? 25 * 60_000) / 1000);

  const applyTimer = useCallback((next: FocusTimer) => {
    setTimer((previous) => previous && previous.revision > next.revision ? previous : next);
  }, []);
  useEffect(() => {
    let active = true;
    const refresh = () => void getFocusTimer().then((next) => {
      if (active) { applyTimer(next); setError(null); }
    }).catch((cause) => active && setError(String(cause)));
    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, [applyTimer]);

  useEffect(() => {
    let active = true;
    let off: (() => void) | undefined;
    let timeout: number | undefined;
    void listen("pet-celebrate", () => {
      setCelebrating(true); window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setCelebrating(false), 2700);
    }).then((unlisten) => { if (active) off = unlisten; else unlisten(); }).catch(() => undefined);
    return () => { active = false; off?.(); window.clearTimeout(timeout); };
  }, []);

  async function openPetPicker() {
    try { await invoke("show_tray_window"); await emitTo("tray", "open-pet-picker"); }
    catch (cause) { setError(String(cause)); }
  }

  async function control(action: "toggle" | "reset" | "switch", minutes?: number) {
    if (busy || !timer) return;
    setBusy(true); setIsDurationPickerOpen(false);
    try { applyTimer(await controlFocusTimer(action, minutes)); setError(null); }
    catch (cause) { setError(String(cause)); }
    finally { setBusy(false); }
  }

  // Drag window handler
  const handleDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, .pet-picker-popover")) return;
    void getCurrentWindow().startDragging().catch(() => {});
  };

  const toggleRun = () => { void control("toggle"); };
  const resetTimer = () => { void control("reset"); };
  const switchMode = () => { void control("switch"); };

  const openTrayWindow = async () => {
    await invoke("show_tray_window");
  };

  const closePet = async () => {
    await invoke("hide_pet_window");
  };

  const selectDuration = (minutes: number) => { void control("reset", minutes); };

  // Determine pet visual mood
  const mood: PetMood = celebrating ? "done" : state === "shortBreak"
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
          <button type="button" className="pet-btn" onClick={() => void openPetPicker()} title="펫 선택" aria-label="펫 선택"><PawPrint size={11} strokeWidth={2.2} /></button>
          <button
            type="button"
            className="pet-btn"
            onClick={toggleRun}
            disabled={busy || !timer}
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
            disabled={busy || !timer}
            title="타이머 초기화"
          >
            <RotateCcw size={11} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="pet-btn"
            onClick={switchMode}
            disabled={busy || !timer}
            title={state === "focus" ? "휴식 모드로 전환" : "집중 모드로 전환"}
          >
            <Coffee size={11} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="pet-btn"
            onClick={openTrayWindow}
            title="Orbit 트레이 열기"
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
        <button
          type="button"
          className="pet-left-avatar"
          onClick={toggleRun}
          disabled={busy || !timer}
          aria-label={`${selectedPet.name} · ${isRunning ? "일시정지" : "집중 시작"}`}
          title={`${selectedPet.name} · ${isRunning ? "클릭하여 일시정지" : "클릭하여 집중 시작"}`}
        >
          <PetMascot mood={mood} isRunning={isRunning} size={76} />
        </button>

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
              {state !== "focus" ? "REST" : isRunning ? "FOCUSING" : "PAUSED"}
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
            title={error || timer?.task_title || "클릭하여 Orbit에서 작업 선택"}
            onClick={openTrayWindow}
            style={{ cursor: "pointer" }}
          >
            {error ? "타이머 확인 필요" : timer?.task_title || "자유 집중"}
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
                  ? (timer?.focus_ms ?? 1500000) / 60_000
                  : (timer?.break_ms ?? 300000) / 60_000;
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

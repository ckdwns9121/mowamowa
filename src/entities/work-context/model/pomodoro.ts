export type PomodoroState = "focus" | "shortBreak" | "longBreak";

export interface PomodoroSettings {
  focusDurationMinutes: number; // default 25
  shortBreakDurationMinutes: number; // default 5
  longBreakDurationMinutes: number; // default 15
  sessionsBeforeLongBreak: number; // default 4
  soundEnabled: boolean;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export interface PomodoroStatus {
  state: PomodoroState;
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  completedCycles: number;
  currentWorkItemId: string | null;
  currentWorkItemTitle: string | null;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  sessionsBeforeLongBreak: 4,
  soundEnabled: true,
  autoStartBreaks: false,
  autoStartFocus: false,
};

export function formatTimeDisplay(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.floor(Math.max(0, seconds) % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

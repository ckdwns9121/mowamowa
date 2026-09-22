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

export const FOCUS_PRESET_MINUTES = [15, 25, 45, 60] as const;
export const BREAK_PRESET_MINUTES = [5, 10, 15] as const;

const POMODORO_STORAGE_KEY = "orbit-pomodoro-settings";

export function getStoredPomodoroSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return DEFAULT_POMODORO_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<PomodoroSettings>;
    return {
      ...DEFAULT_POMODORO_SETTINGS,
      ...parsed,
      focusDurationMinutes: typeof parsed.focusDurationMinutes === "number" && parsed.focusDurationMinutes > 0
        ? parsed.focusDurationMinutes
        : DEFAULT_POMODORO_SETTINGS.focusDurationMinutes,
      shortBreakDurationMinutes: typeof parsed.shortBreakDurationMinutes === "number" && parsed.shortBreakDurationMinutes > 0
        ? parsed.shortBreakDurationMinutes
        : DEFAULT_POMODORO_SETTINGS.shortBreakDurationMinutes,
    };
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
}

export function saveStoredPomodoroSettings(settings: PomodoroSettings): void {
  try {
    localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore localStorage errors
  }
}

export function formatTimeDisplay(seconds: number): string {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.floor(Math.max(0, seconds) % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

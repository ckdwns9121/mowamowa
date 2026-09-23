export interface FocusTimer {
  work_item_id: string | null;
  task_title: string;
  mode: "focus" | "shortBreak";
  running: number;
  remaining_ms: number;
  focus_ms: number;
  break_ms: number;
  last_tick_ms: number;
  session_id: string;
  revision: number;
}

export function advanceFocusTimer(timer: FocusTimer, now: number): FocusTimer {
  const elapsed = now - timer.last_tick_ms;
  const next = { ...timer, last_tick_ms: now };
  if (!timer.running) return next;
  // A sleep, stalled webview, or clock change must never become worked time.
  if (elapsed < 0 || elapsed > 15_000 || timer.last_tick_ms === 0) return { ...next, running: 0 };
  if (elapsed < timer.remaining_ms) return { ...next, remaining_ms: timer.remaining_ms - elapsed };
  const mode = timer.mode === "focus" ? "shortBreak" : "focus";
  return { ...next, mode, running: 0, remaining_ms: mode === "focus" ? timer.focus_ms : timer.break_ms };
}

export function localDayBounds(day: Date): { start: number; end: number } {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
}

export function intervalOverlap(start: number, end: number, day: Date): number {
  const bounds = localDayBounds(day);
  return Math.max(0, Math.min(end, bounds.end) - Math.max(start, bounds.start));
}

export function formatFocusDuration(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (ms > 0 && minutes === 0) return "1분 미만";
  return minutes >= 60 ? `${Math.floor(minutes / 60)}시간${minutes % 60 ? ` ${minutes % 60}분` : ""}` : `${minutes}분`;
}

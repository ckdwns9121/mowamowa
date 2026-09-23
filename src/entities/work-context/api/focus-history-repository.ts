import { getDatabase } from "./database";
import { advanceFocusTimer, localDayBounds, type FocusTimer } from "../model/focus-history";

export async function getFocusTimer(): Promise<FocusTimer> {
  const db = await getDatabase();
  const [timer] = await db.select<FocusTimer[]>("SELECT * FROM focus_timer WHERE id = 1");
  if (!timer) throw new Error("집중 타이머를 불러오지 못했습니다.");
  return timer;
}

async function updateTimer(transform: (timer: FocusTimer, now: number) => FocusTimer): Promise<FocusTimer> {
  const db = await getDatabase();
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await getFocusTimer();
    const next = transform(current, Date.now());
    const result = await db.execute(`UPDATE focus_timer SET mode=$1, running=$2, remaining_ms=$3,
      focus_ms=$4, break_ms=$5, last_tick_ms=$6, session_id=$7, revision=revision+1
      WHERE id=1 AND revision=$8`,
    [next.mode, next.running, next.remaining_ms, next.focus_ms, next.break_ms, next.last_tick_ms, next.session_id, current.revision]);
    if (result.rowsAffected === 1) return { ...next, revision: current.revision + 1 };
  }
  throw new Error("타이머가 다른 창에서 변경됐습니다. 다시 시도해주세요.");
}

export async function recoverFocusTimer(): Promise<void> {
  const db = await getDatabase();
  // Never backfill app-closed time, including a restart within the heartbeat tolerance.
  await db.execute("UPDATE focus_timer SET running=0, last_tick_ms=0, work_item_id=(SELECT work_item_id FROM work_focus_slot WHERE slot=1), task_title=COALESCE((SELECT title FROM work_items WHERE id=(SELECT work_item_id FROM work_focus_slot WHERE slot=1)), '자유 집중'), session_id=$1, revision=revision+1 WHERE id=1", [crypto.randomUUID()]);
}

export async function tickFocusTimer(): Promise<FocusTimer> {
  const current = await getFocusTimer();
  return current.running ? updateTimer(advanceFocusTimer) : current;
}

export async function controlFocusTimer(action: "toggle" | "reset" | "switch", durationMinutes?: number): Promise<FocusTimer> {
  if (durationMinutes !== undefined && (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 180)) {
    throw new Error("집중 시간은 1~180분으로 설정해주세요.");
  }
  await tickFocusTimer();
  return updateTimer((current, now) => {
    const next = advanceFocusTimer(current, now);
    next.session_id = crypto.randomUUID();
    if (durationMinutes !== undefined) {
      const ms = Math.round(durationMinutes * 60_000);
      if (next.mode === "focus") next.focus_ms = ms; else next.break_ms = ms;
      next.remaining_ms = ms;
      next.running = 0;
    } else if (action === "toggle") {
      next.running = next.running ? 0 : 1;
    } else {
      next.running = 0;
      if (action === "switch") next.mode = next.mode === "focus" ? "shortBreak" : "focus";
      next.remaining_ms = next.mode === "focus" ? next.focus_ms : next.break_ms;
    }
    return next;
  });
}

export interface DayRecord {
  focusMs: number;
  completedCount: number;
  tasks: Array<{ id: string; title: string; focusMs: number; completed: boolean }>;
}

export async function getDayRecord(day: Date): Promise<DayRecord> {
  const db = await getDatabase();
  const { start, end } = localDayBounds(day);
  const [intervals, completions] = await Promise.all([
    db.select<Array<{ work_item_id: string | null; title: string; focus_ms: number }>>(
      `SELECT work_item_id, title, SUM(MIN(ended_at_ms,$2)-MAX(started_at_ms,$1)) AS focus_ms
       FROM focus_intervals WHERE started_at_ms < $2 AND ended_at_ms > $1
       GROUP BY work_item_id, title`, [start, end]),
    db.select<Array<{ work_item_id: string; title: string }>>(
      `SELECT work_item_id, title FROM daily_task_completions
       WHERE completed_at_ms >= $1 AND completed_at_ms < $2 AND undone=0
       ORDER BY completed_at_ms`, [start, end]),
  ]);
  const tasks = new Map<string, DayRecord["tasks"][number]>();
  for (const row of intervals) {
    const id = row.work_item_id ?? "free-focus";
    const current = tasks.get(id);
    tasks.set(id, { id, title: row.title, focusMs: (current?.focusMs ?? 0) + row.focus_ms, completed: false });
  }
  for (const row of completions) {
    const current = tasks.get(row.work_item_id);
    tasks.set(row.work_item_id, { id: row.work_item_id, title: row.title, focusMs: current?.focusMs ?? 0, completed: true });
  }
  const values = [...tasks.values()].sort((a, b) => b.focusMs - a.focusMs);
  return { focusMs: values.reduce((sum, row) => sum + row.focusMs, 0), completedCount: values.filter((row) => row.completed).length, tasks: values };
}

let clockStart: Promise<void> | undefined;
export function startFocusClock(): Promise<void> {
  clockStart ??= (async () => {
    await recoverFocusTimer();
    const { listen } = await import("@tauri-apps/api/event");
    let pending = false;
    let interrupted = false;
    await listen<boolean>("focus-clock", (event) => {
      interrupted ||= event.payload;
      if (pending) return;
      pending = true;
      const update = interrupted ? recoverFocusTimer() : tickFocusTimer();
      interrupted = false;
      void update.catch((error) => console.error("집중 시간 기록 실패", error)).finally(() => { pending = false; });
    });
  })();
  return clockStart;
}

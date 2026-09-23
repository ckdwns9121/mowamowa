-- One shared timer for the tray and pet. Only acknowledged awake intervals count.
CREATE TABLE focus_timer (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  work_item_id TEXT,
  task_title TEXT NOT NULL DEFAULT '자유 집중',
  mode TEXT NOT NULL DEFAULT 'focus' CHECK(mode IN ('focus','shortBreak')),
  running INTEGER NOT NULL DEFAULT 0 CHECK(running IN (0,1)),
  remaining_ms INTEGER NOT NULL DEFAULT 1500000 CHECK(remaining_ms >= 0),
  focus_ms INTEGER NOT NULL DEFAULT 1500000 CHECK(focus_ms > 0),
  break_ms INTEGER NOT NULL DEFAULT 300000 CHECK(break_ms > 0),
  last_tick_ms INTEGER NOT NULL DEFAULT 0,
  session_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0
);
INSERT INTO focus_timer(id, session_id) VALUES(1, lower(hex(randomblob(16))));

CREATE TABLE focus_intervals (
  id TEXT PRIMARY KEY,
  work_item_id TEXT,
  title TEXT NOT NULL,
  started_at_ms INTEGER NOT NULL,
  ended_at_ms INTEGER NOT NULL CHECK(ended_at_ms >= started_at_ms)
);
CREATE INDEX focus_intervals_dates ON focus_intervals(ended_at_ms, started_at_ms);

CREATE TRIGGER focus_timer_record_interval
BEFORE UPDATE ON focus_timer
WHEN OLD.running = 1 AND OLD.mode = 'focus' AND OLD.last_tick_ms > 0
  AND NEW.last_tick_ms > OLD.last_tick_ms
  AND NEW.last_tick_ms - OLD.last_tick_ms <= 15000
  AND OLD.remaining_ms > 0
BEGIN
  INSERT INTO focus_intervals(id, work_item_id, title, started_at_ms, ended_at_ms)
  VALUES(OLD.session_id, OLD.work_item_id, OLD.task_title, OLD.last_tick_ms,
    OLD.last_tick_ms + min(NEW.last_tick_ms - OLD.last_tick_ms, OLD.remaining_ms))
  ON CONFLICT(id) DO UPDATE SET ended_at_ms = excluded.ended_at_ms;
END;

CREATE TRIGGER focus_slot_sync_timer
AFTER UPDATE OF work_item_id ON work_focus_slot
WHEN NEW.work_item_id IS NOT OLD.work_item_id
BEGIN
  UPDATE focus_timer SET
    work_item_id = NEW.work_item_id,
    task_title = COALESCE((SELECT title FROM work_items WHERE id = NEW.work_item_id), '자유 집중'),
    mode = 'focus', running = CASE WHEN NEW.work_item_id IS NULL THEN 0 ELSE 1 END,
    remaining_ms = focus_ms,
    last_tick_ms = CAST((julianday('now') - 2440587.5) * 86400000 AS INTEGER),
    session_id = lower(hex(randomblob(16))), revision = revision + 1
  WHERE id = 1;
END;

-- Snapshot titles survive renames/deletions; undo completion invalidates the record.
CREATE TABLE daily_task_completions (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  completed_at_ms INTEGER NOT NULL,
  undone INTEGER NOT NULL DEFAULT 0 CHECK(undone IN (0,1))
);
CREATE INDEX daily_task_completions_dates ON daily_task_completions(completed_at_ms);
INSERT INTO daily_task_completions(id, work_item_id, title, completed_at_ms)
SELECT lower(hex(randomblob(16))), id, title,
  CAST((julianday(completed_at) - 2440587.5) * 86400000 AS INTEGER)
FROM work_items WHERE status = 'done' AND julianday(completed_at) IS NOT NULL;

CREATE TRIGGER work_items_daily_completion
AFTER UPDATE OF status ON work_items
WHEN NEW.status = 'done' AND OLD.status <> 'done'
BEGIN
  INSERT INTO daily_task_completions(id, work_item_id, title, completed_at_ms)
  VALUES(lower(hex(randomblob(16))), NEW.id, NEW.title,
    CAST((julianday(COALESCE(NEW.completed_at, NEW.updated_at)) - 2440587.5) * 86400000 AS INTEGER));
END;
CREATE TRIGGER work_items_daily_completion_undo
AFTER UPDATE OF status ON work_items
WHEN OLD.status = 'done' AND NEW.status <> 'done'
BEGIN
  UPDATE daily_task_completions SET undone = 1 WHERE work_item_id = NEW.id AND undone = 0;
END;

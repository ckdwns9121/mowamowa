import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readdirSync, readFileSync } from "node:fs";
import { advanceFocusTimer, intervalOverlap, localDayBounds, type FocusTimer } from "../model/focus-history";

function database() {
  const db = new Database(":memory:");
  db.exec("PRAGMA foreign_keys=ON");
  for (const name of readdirSync("src-tauri/migrations").filter((name) => name.endsWith(".sql")).sort()) db.exec(readFileSync(`src-tauri/migrations/${name}`, "utf8"));
  return db;
}
function timer(db: Database) { return db.query("SELECT * FROM focus_timer WHERE id=1").get() as FocusTimer; }
function tick(db: Database, now: number, current = timer(db)) {
  const next = advanceFocusTimer(current, now);
  return db.query(`UPDATE focus_timer SET mode=?,running=?,remaining_ms=?,last_tick_ms=?,revision=revision+1 WHERE id=1 AND revision=?`)
    .run(next.mode, next.running, next.remaining_ms, now, current.revision);
}
function start(db: Database, now: number, duration=60_000) {
  db.query("UPDATE focus_timer SET last_tick_ms=0,running=0").run();
  db.query("UPDATE focus_timer SET running=1,mode='focus',remaining_ms=?,last_tick_ms=?,session_id='session-a',revision=revision+1").run(duration, now);
}
function total(db: Database) {
  return (db.query("SELECT COALESCE(SUM(ended_at_ms-started_at_ms),0) AS total FROM focus_intervals").get() as {total:number}).total;
}

describe("shared focus history", () => {
  test("counts only awake focus intervals, not paused time or a sleep gap", () => {
    using db = database();
    start(db, 100_000);
    tick(db, 101_000); tick(db, 102_000);
    expect(total(db)).toBe(2000);
    tick(db, 3_702_000);
    expect(timer(db).running).toBe(0);
    expect(total(db)).toBe(2000);
    db.query("UPDATE focus_timer SET running=1,last_tick_ms=3702000,session_id='resumed',revision=revision+1").run();
    tick(db, 3_703_000);
    expect(total(db)).toBe(3000);
    expect(db.query("SELECT COUNT(*) AS count FROM focus_intervals").get()).toEqual({count:2});
  });
  test("finishing a focus period caps counted time and pauses in break mode", () => {
    using db = database();
    start(db,100_000,1500);
    tick(db,101_000); tick(db,102_000);
    expect(total(db)).toBe(1500);
    expect(timer(db).mode).toBe("shortBreak");
    expect(timer(db).running).toBe(0);
    db.query("UPDATE focus_timer SET running=1,session_id='break',revision=revision+1").run();
    tick(db,103_000);
    expect(total(db)).toBe(1500);
  });
  test("stale concurrent writes cannot double count the same interval", () => {
    using db = database(); start(db,100_000);
    const snapshot=timer(db);
    expect(tick(db,101_000,snapshot).changes).toBeGreaterThan(0);
    expect(tick(db,101_000,snapshot).changes).toBe(0);
    expect(total(db)).toBe(1000);
  });
  test("restart never credits even a short offline gap", () => {
    using db = database(); start(db,100_000); tick(db,101_000);
    db.query("UPDATE focus_timer SET running=0,last_tick_ms=0,session_id='reboot',revision=revision+1").run();
    tick(db,103_000);
    expect(total(db)).toBe(1000);
    expect(timer(db).running).toBe(0);
  });
  test("clock rollback pauses rather than adding negative time", () => {
    using db=database(); start(db,100_000); tick(db,99_000);
    expect(total(db)).toBe(0); expect(timer(db).running).toBe(0);
  });
  test("splits a midnight interval across local calendar days", () => {
    const day=new Date(2026,8,23);
    const midnight=localDayBounds(day).end;
    expect(intervalOverlap(midnight-20_000,midnight+40_000,day)).toBe(20_000);
    expect(intervalOverlap(midnight-20_000,midnight+40_000,new Date(2026,8,24))).toBe(40_000);
  });
  test("task focus, completion, undo and deletion keep history consistent", () => {
    using db=database();
    db.query("INSERT INTO work_items(id,title,status,source,position,created_at,updated_at) VALUES('task','원래 제목','todo','orbit',0,'2026-09-23T00:00:00Z','2026-09-23T00:00:00Z')").run();
    db.query(`INSERT INTO work_focus_transition_commands(id,correlation_id,current_work_item_id,requested_work_item_id,expected_slot_revision,expected_current_revision,expected_requested_revision,created_at)
      VALUES('cmd','cmd',NULL,'task',0,NULL,0,'2026-09-23T00:00:00Z')`).run();
    expect(timer(db).work_item_id).toBe('task'); expect(timer(db).running).toBe(1);
    const focused=timer(db); tick(db,focused.last_tick_ms+1000);
    db.query("UPDATE work_items SET status='done',completed_at='2026-09-23T01:00:00Z',updated_at='2026-09-23T01:00:00Z',revision=revision+1 WHERE id='task'").run();
    expect(timer(db).running).toBe(0);
    expect(db.query("SELECT title,undone FROM daily_task_completions").get()).toEqual({title:'원래 제목',undone:0});
    db.query("UPDATE work_items SET status='todo',completed_at=NULL,revision=revision+1 WHERE id='task'").run();
    expect(db.query("SELECT undone FROM daily_task_completions").get()).toEqual({undone:1});
    db.query("UPDATE work_items SET status='done',completed_at='2026-09-23T02:00:00Z',revision=revision+1 WHERE id='task'").run();
    db.query("DELETE FROM work_items WHERE id='task'").run();
    expect(db.query("SELECT COUNT(*) AS count FROM daily_task_completions WHERE undone=0").get()).toEqual({count:1});
    expect(db.query("SELECT title FROM focus_intervals LIMIT 1").get()).toEqual({title:'원래 제목'});
    expect(db.query("PRAGMA foreign_key_check").all()).toEqual([]);
  });
});

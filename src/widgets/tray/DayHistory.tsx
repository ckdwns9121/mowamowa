import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDayRecord, type DayRecord } from "../../entities/work-context/api/focus-history-repository";
import { formatFocusDuration, localDayBounds } from "../../entities/work-context/model/focus-history";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const sameDay = (a: Date, b: Date) => localDayBounds(a).start === localDayBounds(b).start;

export default function DayHistory() {
  const [date, setDate] = useState(new Date());
  const [month, setMonth] = useState(() => new Date(date.getFullYear(), date.getMonth(), 1));
  const [days, setDays] = useState<Map<number, DayRecord>>(new Map());
  const [record, setRecord] = useState<DayRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = new Date();

  // ponytail: one getDayRecord per day (≤31 local SQLite reads); add a
  // grouped month query if months ever feel slow to open.
  useEffect(() => {
    let active = true;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const dates = Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)).filter((day) => day <= new Date());
    void Promise.all(dates.map((day) => getDayRecord(day).then((value) => [day.getDate(), value] as const)))
      .then((rows) => { if (active) setDays(new Map(rows)); })
      .catch((cause) => active && setError(String(cause)));
    return () => { active = false; };
  }, [month, record?.completedCount, record?.tasks.length]);

  useEffect(() => {
    let active = true;
    setRecord(null); setError(null);
    const refresh = () => void getDayRecord(date).then((value) => { if (active) { setRecord(value); setError(null); } }).catch((cause) => active && setError(String(cause)));
    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, [date]);

  const moveMonth = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  const goToday = () => { setDate(new Date()); setMonth(new Date(today.getFullYear(), today.getMonth(), 1)); };
  const cells = [
    ...Array<null>(month.getDay()).fill(null),
    ...Array.from({ length: new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate() }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  return <section className="tray-history" aria-label="집중 달력">
    <header className="tray-calendar-header">
      <h2>{month.getFullYear()}년 <em>{month.getMonth() + 1}월</em></h2>
      <div>
        <button type="button" aria-label="이전 달" onClick={() => moveMonth(-1)}><ChevronLeft size={16} /></button>
        <button type="button" onClick={goToday}>오늘</button>
        <button type="button" aria-label="다음 달" onClick={() => moveMonth(1)}><ChevronRight size={16} /></button>
      </div>
    </header>

    <div className="tray-calendar-grid" role="grid">
      {WEEKDAYS.map((label) => <span key={label} className="tray-calendar-weekday">{label}</span>)}
      {cells.map((day, index) => {
        if (!day) return <span key={`pad-${index}`} />;
        const summary = days.get(day.getDate());
        const classes = ["tray-calendar-day", sameDay(day, today) && "is-today", sameDay(day, date) && "is-selected"].filter(Boolean).join(" ");
        return <button type="button" key={day.getDate()} className={classes} aria-pressed={sameDay(day, date)}
          aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일${summary?.tasks.length ? `, 완료 ${summary.completedCount}개, 집중 ${formatFocusDuration(summary.focusMs)}` : ""}`}
          onClick={() => setDate(day)}>
          <span>{day.getDate()}</span>
          <i className={summary?.completedCount ? "has-done" : summary?.tasks.length ? "has-focus" : undefined} />
        </button>;
      })}
    </div>

    <h3 className="tray-calendar-day-title">{date.getMonth() + 1}월 {date.getDate()}일 ({WEEKDAYS[date.getDay()]}){sameDay(date, today) && " · 오늘"}</h3>
    {error && <p role="alert">기록을 불러오지 못했습니다. {error}</p>}
    {!record && !error && <p role="status">기록을 불러오는 중…</p>}
    {record && <>
      <div className="tray-history-summary"><span>집중 <strong>{formatFocusDuration(record.focusMs)}</strong></span><span>완료 <strong>{record.completedCount}개</strong></span></div>
      <div className="tray-history-list">{record.tasks.map((task) => <div key={task.id}><span title={task.title}>{task.title}<small>{task.completed ? "완료" : "집중한 작업"}</small></span><strong>{formatFocusDuration(task.focusMs)}</strong></div>)}</div>
      {record.tasks.length === 0 && <p className="tray-empty-hint">이 날짜에 기록된 작업이 없습니다.</p>}
    </>}
    <p className="tray-inbox-note">집중 시간은 기록 기능을 켠 이후부터 집계합니다. 휴식·잠자기·앱 종료 시간은 제외됩니다.</p>
  </section>;
}

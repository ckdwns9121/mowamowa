import { useEffect, useState } from "react";
import { getDayRecord, type DayRecord } from "../../entities/work-context/api/focus-history-repository";
import { formatFocusDuration, localDayBounds } from "../../entities/work-context/model/focus-history";

export default function DayHistory() {
  const [date, setDate] = useState(new Date());
  const [record, setRecord] = useState<DayRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isToday = localDayBounds(date).start === localDayBounds(new Date()).start;
  useEffect(() => {
    let active = true;
    setRecord(null); setError(null);
    const refresh = () => void getDayRecord(date).then((value) => { if (active) { setRecord(value); setError(null); } }).catch((cause) => active && setError(String(cause)));
    refresh();
    const interval = window.setInterval(refresh, 1000);
    return () => { active = false; window.clearInterval(interval); };
  }, [date]);
  const move = (delta: number) => setDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta));
  return <section className="tray-history" aria-label="하루 기록">
    <header>
      <button type="button" aria-label="이전 날짜" onClick={() => move(-1)}>‹</button>
      <label><span>{isToday ? "오늘 기록" : "하루 기록"}</span><input type="date" aria-label="기록 날짜" value={`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`} onChange={(event) => { if (event.target.value) setDate(new Date(`${event.target.value}T12:00:00`)); }} /></label>
      <button type="button" aria-label="다음 날짜" disabled={isToday || date > new Date()} onClick={() => move(1)}>›</button>
      {!isToday && <button type="button" onClick={() => setDate(new Date())}>오늘</button>}
    </header>
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

"use client";
import { useEffect, useState } from "react";
import { Pet } from "./Pet";

const FOCUS_SECONDS = 25 * 60;

export function Notch() {
  const [open, setOpen] = useState(false);
  const [left, setLeft] = useState(FOCUS_SECONDS - 6 * 60 - 36);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s <= 1 ? FOCUS_SECONDS : s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="notch-wrap">
      <button
        type="button"
        className="notch"
        data-open={open}
        aria-expanded={open}
        aria-label={open ? "노치 닫기" : "노치 열기: 오늘 할 일 보기"}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="notch-collapsed">
          <Pet id="rakko" mood={1} size={34} />
          <span className="notch-timer">{mm}:{ss}</span>
        </span>
        <span className="notch-panel" />
      </button>
      <p className="notch-hint">{open ? "마우스를 벗어나면 다시 접혀요" : "노치에 마우스를 올려 보세요"}</p>
    </div>
  );
}

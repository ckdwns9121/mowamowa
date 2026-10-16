"use client";
import { useState } from "react";
import { Pet } from "./Pet";
import { Portrait } from "./Portrait";
import pets from "./pets.json";

const GROUPS: Record<string, string> = { friends: "친구들", armor: "갑옷", pajamas: "파자마", neighbors: "이웃들" };
const MOODS = [
  { value: 0, label: "쉬는 중" },
  { value: 1, label: "집중" },
  { value: 3, label: "완료" },
];

export function PetPicker() {
  const [id, setId] = useState("rakko");
  const [mood, setMood] = useState(1);
  const pet = pets.find((p) => p.id === id) ?? pets[0];

  return (
    <div className="picker">
      <div className="sticker picker-stage" style={{ "--accent": pet.accent } as React.CSSProperties}>
        <div className="picker-bubble">{pet.description}</div>
        <Pet key={pet.id} id={pet.id} mood={mood} size={220} />
        <p className="picker-name">{pet.name}</p>
        <div className="picker-moods" role="radiogroup" aria-label="펫 상태">
          {MOODS.map((m) => (
            <button key={m.value} type="button" role="radio" aria-checked={mood === m.value} onClick={() => setMood(m.value)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="picker-list">
        {Object.entries(GROUPS).map(([group, label]) => (
          <div key={group} className="picker-group">
            <h3>{label}</h3>
            <div className="picker-grid">
              {pets.filter((p) => p.group === group).map((p) => (
                <button key={p.id} type="button" className="picker-card" aria-pressed={p.id === id} onClick={() => setId(p.id)} style={{ "--accent": p.accent } as React.CSSProperties}>
                  <span className="picker-card-art"><Portrait id={p.id} size={72} /></span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

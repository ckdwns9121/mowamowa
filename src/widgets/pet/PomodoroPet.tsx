import React, { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emitTo, listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PawPrint, X } from "lucide-react";
import { createRakkoActionQueue } from "../../entities/pet/model/rakko-action";
import { useSelectedPet } from "../../entities/pet";
import { PetMascot, type PetMood } from "./PetMascot";
import "./PetMascot.scss";
import "./PomodoroPet.scss";

/** Just the companion: a draggable character with no timer chrome. */
export default function PomodoroPet() {
  const selectedPet = useSelectedPet();
  const [performing, setPerforming] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const actionQueue = useRef<ReturnType<typeof createRakkoActionQueue> | null>(null);
  const celebrateTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    setPerforming(false);
    const queue = createRakkoActionQueue(setPerforming);
    actionQueue.current = queue;
    return () => { queue.dispose(); actionQueue.current = null; };
  }, [selectedPet.id]);

  const celebrate = () => {
    setCelebrating(true);
    window.clearTimeout(celebrateTimeout.current);
    celebrateTimeout.current = window.setTimeout(() => setCelebrating(false), 2700);
  };

  useEffect(() => {
    let active = true;
    let off: (() => void) | undefined;
    void listen("pet-celebrate", celebrate)
      .then((unlisten) => { if (active) off = unlisten; else unlisten(); }).catch(() => undefined);
    return () => { active = false; off?.(); window.clearTimeout(celebrateTimeout.current); };
  }, []);

  // The character fills the window, so a press on it is a click until the
  // pointer moves a few pixels; then the OS takes over the window drag.
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".pet-hover-controls")) return;
    dragStart.current = { x: e.screenX, y: e.screenY };
    dragged.current = false;
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    const start = dragStart.current;
    if (!start || Math.hypot(e.screenX - start.x, e.screenY - start.y) < 4) return;
    dragStart.current = null;
    dragged.current = true;
    void getCurrentWindow().startDragging().catch(() => {});
  };

  const openPetPicker = async () => {
    await invoke("show_tray_window").catch(() => undefined);
    await emitTo("tray", "open-pet-picker").catch(() => undefined);
  };

  const closePet = async () => {
    actionQueue.current?.dispose();
    actionQueue.current = createRakkoActionQueue(setPerforming);
    setPerforming(false);
    await invoke("hide_pet_window");
  };

  const mood: PetMood = selectedPet.id === "rakko" && performing ? "react" : celebrating ? "done" : "idle";

  return (
    <div className="pet-window-shell" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={() => { dragStart.current = null; }}>
      <div className="pet-hover-controls">
        <button type="button" className="pet-btn" onClick={() => void openPetPicker()} title="펫 선택" aria-label="펫 선택"><PawPrint size={11} strokeWidth={2.2} /></button>
        <button type="button" className="pet-btn pet-btn-close" onClick={() => void closePet()} title="펫 닫기" aria-label="펫 닫기"><X size={11} strokeWidth={2.4} /></button>
      </div>
      <button
        type="button"
        className="pet-avatar"
        onClick={() => { if (dragged.current) { dragged.current = false; return; } if (selectedPet.id === "rakko") actionQueue.current?.request(); else celebrate(); }}
        data-performing={performing ? "true" : "false"}
        aria-label={selectedPet.id === "rakko" ? "랏코 점프와 회전" : `${selectedPet.name} 쓰다듬기`}
        title={`${selectedPet.name} · 드래그해서 옮기기`}
      >
        <PetMascot mood={mood} isRunning={false} size={96} />
      </button>
    </div>
  );
}

import { getCurrentWindow } from "@tauri-apps/api/window";
import { Plus } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { formatToday, sectionTitle, type PrimarySection } from "../model/navigation";

interface AppHeaderProps {
  activeSection: PrimarySection;
  isFocusLocked: boolean;
  onAddTask: () => void;
}

export default function AppHeader({ activeSection, isFocusLocked, onAddTask }: AppHeaderProps) {
  function handleDrag(event: ReactPointerEvent<HTMLDivElement | HTMLElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) return;
    void getCurrentWindow().startDragging().catch(() => {});
  }

  return (
    <header
      className="app-topbar"
      inert={isFocusLocked ? true : undefined}
      aria-hidden={isFocusLocked ? true : undefined}
      data-tauri-drag-region
      onPointerDown={handleDrag}
    >
      <div className="app-topbar-left" data-tauri-drag-region>
        <div className="app-topbar-traffic-pad" data-tauri-drag-region />
        <div className="app-topbar-brand" data-tauri-drag-region>
          <strong>Orbit</strong>
          <span className="app-topbar-sep">/</span>
          <h1>{sectionTitle[activeSection]}</h1>
          <span className="app-topbar-date">{formatToday()}</span>
        </div>
      </div>

      <div className="app-topbar-drag-spacer" data-tauri-drag-region />

      <div className="app-topbar-right">
        {activeSection === "tasks" && (
          <button className="primary-button primary-button-icon" type="button" onClick={onAddTask}>
            <Plus size={14} strokeWidth={2} aria-hidden="true" /> 작업 추가
          </button>
        )}
      </div>
    </header>
  );
}

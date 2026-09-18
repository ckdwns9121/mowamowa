import {
  Blocks,
  CheckSquare,
  LayoutDashboard,
  MessageCircle,
  Settings,
  TicketCheck,
  type LucideIcon,
} from "lucide-react";
import type { SourceSyncState } from "../../entities/work-context/model/work-continuity";
import type { WorkItem } from "../../entities/work-context/model/work-item";
import { type PrimarySection } from "../model/navigation";

interface NavigationItem {
  section: PrimarySection;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface AppBottomBarProps {
  activeSection: PrimarySection;
  isFocusLocked: boolean;
  items: WorkItem[];
  sourceSyncStates: SourceSyncState[];
  onNavigate: (section: PrimarySection) => void;
}

export default function AppBottomBar({
  activeSection,
  isFocusLocked,
  items,
  sourceSyncStates,
  onNavigate,
}: AppBottomBarProps) {
  const activeTaskCount = items.filter((item) => item.status !== "done").length;

  const navigation: NavigationItem[] = [
    { section: "dashboard", label: "Planner", icon: LayoutDashboard },
    { section: "tasks", label: "Task", icon: CheckSquare, count: activeTaskCount },
    { section: "sessions", label: "Workspace", icon: Blocks },
    { section: "jira", label: "Tickets", icon: TicketCheck },
    { section: "chat", label: "Chat", icon: MessageCircle },
    { section: "settings", label: "Settings", icon: Settings },
  ];

  const hasSyncProblem = sourceSyncStates.some((state) =>
    ["failed", "auth-required", "rate-limited", "partial", "stale"].includes(state.status),
  );

  const syncStatusText =
    sourceSyncStates.length === 0
      ? "연동 상태 확인"
      : sourceSyncStates.some((state) => ["failed", "auth-required", "rate-limited"].includes(state.status))
        ? "연동 확인 필요"
        : sourceSyncStates.some((state) => ["partial", "stale"].includes(state.status))
          ? "일부 지연"
          : "연동 정상";

  return (
    <footer
      className="app-bottom-bar"
      inert={isFocusLocked ? true : undefined}
      aria-hidden={isFocusLocked ? true : undefined}
      role="navigation"
      aria-label="하단 네비게이션"
    >
      <nav className="bottom-nav">
        {navigation.map(({ section, label, icon: Icon, count }) => {
          const isActive = activeSection === section;
          return (
            <button
              key={section}
              type="button"
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
              onClick={() => onNavigate(section)}
              aria-current={isActive ? "page" : undefined}
              title={label}
            >
              <Icon size={16} strokeWidth={isActive ? 2.2 : 1.75} aria-hidden="true" />
              <span>{label}</span>
              {typeof count === "number" && count > 0 && (
                <span className="bottom-nav-badge" aria-label={`할 일 ${count}개`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div
        className="bottom-sync-status"
        title={`연동 상태: ${syncStatusText}`}
        aria-label={`연동 상태: ${syncStatusText}`}
      >
        <span className={`bottom-sync-dot ${hasSyncProblem ? "needs-attention" : ""}`} />
        <span className="bottom-sync-label">{syncStatusText}</span>
      </div>
    </footer>
  );
}

export const workItemStatuses = [
  "inbox",
  "todo",
  "focus",
  "ai_running",
  "review",
  "blocked",
  "done",
] as const;

export type WorkItemStatus = (typeof workItemStatuses)[number];
export type WorkItemPriority = "p1" | "p2" | "p3";
export type WorkItemSource = "orbit" | "local" | "jira" | "github" | "slack" | "calendar";

export interface WorkItem {
  id: string;
  title: string;
  status: WorkItemStatus;
  priority: WorkItemPriority | null;
  source: WorkItemSource;
  externalId: string | null;
  externalUrl: string | null;
  goal: string | null;
  checkpoint: string | null;
  nextAction: string | null;
  doneDefinition: string | null;
  blockedReason: string | null;
  resumeCondition: string | null;
  pausedAt: string | null;
  lastFocusedAt: string | null;
  nextReviewAt: string | null;
  revision: number;
  targetAt: string | null;
  reminderSentAt: string | null;
  categoryId?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface CreateWorkItemInput {
  title: string;
  status: WorkItemStatus;
  priority?: WorkItemPriority | null;
  goal?: string;
  nextAction?: string;
  doneDefinition?: string;
  targetAt?: string | null;
  categoryId?: string | null;
}

export const statusMeta: Record<
  WorkItemStatus,
  { label: string; shortLabel: string; order: number }
> = {
  focus: { label: "현재 집중 중", shortLabel: "집중", order: 0 },
  review: { label: "내 확인 필요", shortLabel: "확인", order: 1 },
  ai_running: { label: "진행 중", shortLabel: "진행", order: 2 },
  todo: { label: "할 일", shortLabel: "할 일", order: 3 },
  blocked: { label: "막힘", shortLabel: "막힘", order: 4 },
  inbox: { label: "Inbox", shortLabel: "Inbox", order: 5 },
  done: { label: "완료", shortLabel: "완료", order: 6 },
};

/**
 * The tray only keeps today's work in view: open items made or due since
 * yesterday, and items finished today. Anything older stays one click away.
 */
export function isRecentWorkItem(item: WorkItem, now: Date): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const since = (value: string | null, start: number) => value !== null && Date.parse(value) >= start;
  if (item.status === "done") return since(item.completedAt, today);
  return item.status === "focus" || since(item.createdAt, today - 86_400_000) || since(item.targetAt, today - 86_400_000);
}

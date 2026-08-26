import type { WorkItem, WorkItemStatus } from "./work-item";

export const taskBoardLanes = ["todo", "ai_running", "review", "done"] as const;

export type TaskBoardLane = (typeof taskBoardLanes)[number];

export function taskBoardLaneForStatus(status: WorkItemStatus): TaskBoardLane {
  if (status === "focus" || status === "ai_running") return "ai_running";
  if (status === "review" || status === "blocked") return "review";
  if (status === "done") return "done";
  return "todo";
}

export function visibleTaskBoardItems(
  items: WorkItem[],
  limit: number,
  forcedIds: ReadonlySet<string> = new Set(),
  now = new Date(),
): WorkItem[] {
  if (items.length <= limit) return items;
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const requiredIds = new Set(items.filter((item) => {
    if (forcedIds.has(item.id) || item.priority === "p1") return true;
    if (!item.targetAt) return false;
    const targetTime = new Date(item.targetAt).getTime();
    return Number.isFinite(targetTime) && targetTime <= endOfToday.getTime();
  }).map((item) => item.id));
  let remainingSlots = Math.max(0, limit - requiredIds.size);
  const visibleIds = new Set(requiredIds);
  for (const item of items) {
    if (visibleIds.has(item.id) || remainingSlots === 0) continue;
    visibleIds.add(item.id);
    remainingSlots -= 1;
  }
  return items.filter((item) => visibleIds.has(item.id));
}

export function nextTaskBoardRefreshAt(items: WorkItem[], now = new Date()): number {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return items.reduce((nextBoundary, item) => {
    if (!item.targetAt) return nextBoundary;
    const targetTime = new Date(item.targetAt).getTime();
    return Number.isFinite(targetTime) && targetTime > now.getTime() && targetTime < nextBoundary
      ? targetTime
      : nextBoundary;
  }, nextMidnight.getTime());
}

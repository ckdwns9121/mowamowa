import type { WorkItemStatus } from "./work-item";

export const taskBoardLanes = ["todo", "ai_running", "review", "done"] as const;

export type TaskBoardLane = (typeof taskBoardLanes)[number];

export function taskBoardLaneForStatus(status: WorkItemStatus): TaskBoardLane {
  if (status === "focus" || status === "ai_running") return "ai_running";
  if (status === "review" || status === "blocked") return "review";
  if (status === "done") return "done";
  return "todo";
}

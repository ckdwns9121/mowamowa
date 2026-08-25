import { describe, expect, test } from "bun:test";
import { taskBoardLaneForStatus, visibleTaskBoardItems } from "./task-board";
import type { WorkItem, WorkItemStatus } from "./work-item";

function item(id: string, overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id, title: id, status: "todo", priority: null, source: "orbit", externalId: null,
    externalUrl: null, goal: null, checkpoint: null, nextAction: null, doneDefinition: null,
    blockedReason: null, resumeCondition: null, pausedAt: null, lastFocusedAt: null,
    nextReviewAt: null, revision: 0, targetAt: null, reminderSentAt: null, position: 0,
    createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z",
    completedAt: null, ...overrides,
  };
}

describe("taskBoardLaneForStatus", () => {
  test("keeps focused work inside the in-progress lane", () => {
    expect(taskBoardLaneForStatus("focus")).toBe("ai_running");
    expect(taskBoardLaneForStatus("ai_running")).toBe("ai_running");
    expect(taskBoardLaneForStatus("review")).toBe("review");
    expect(taskBoardLaneForStatus("blocked")).toBe("review");
    expect(taskBoardLaneForStatus("done")).toBe("done");
  });

  test("keeps every other work state visible in the todo lane", () => {
    const otherStatuses: WorkItemStatus[] = ["inbox", "todo"];
    expect(otherStatuses.map(taskBoardLaneForStatus)).toEqual([
      "todo",
      "todo",
    ]);
  });

  test("keeps P1, overdue, today-targeted, and newly moved tasks visible beyond the limit", () => {
    const tasks = [
      item("normal-1"), item("normal-2"), item("normal-3"),
      item("p1", { priority: "p1" }),
      item("overdue", { targetAt: "2026-08-24T10:00:00+09:00" }),
      item("today", { targetAt: "2026-08-25T22:00:00+09:00" }),
      item("forced"),
      item("future", { targetAt: "2026-08-26T10:00:00+09:00" }),
    ];
    expect(visibleTaskBoardItems(tasks, 3, new Set(["forced"]), new Date("2026-08-25T12:00:00+09:00")).map(({ id }) => id)).toEqual([
      "p1", "overdue", "today", "forced",
    ]);
  });
});

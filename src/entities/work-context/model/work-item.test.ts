import { expect, test } from "bun:test";
import { isRecentWorkItem, type WorkItem } from "./work-item";

const now = new Date(2026, 8, 29, 15);
const at = (day: number, hour = 12) => new Date(2026, 8, day, hour).toISOString();
const item = (patch: Partial<WorkItem>) => ({ status: "todo", createdAt: at(29), targetAt: null, completedAt: null, ...patch }) as WorkItem;

test("트레이는 어제부터 쌓인 할 일과 오늘 완료한 일만 보여준다", () => {
  expect(isRecentWorkItem(item({ createdAt: at(29) }), now)).toBe(true);
  expect(isRecentWorkItem(item({ createdAt: at(28, 0) }), now)).toBe(true);
  expect(isRecentWorkItem(item({ createdAt: at(27, 23) }), now)).toBe(false);
  expect(isRecentWorkItem(item({ createdAt: at(10), targetAt: at(29) }), now)).toBe(true);
  expect(isRecentWorkItem(item({ createdAt: at(10), status: "focus" }), now)).toBe(true);
  expect(isRecentWorkItem(item({ status: "done", completedAt: at(29, 1) }), now)).toBe(true);
  expect(isRecentWorkItem(item({ status: "done", completedAt: at(28, 23) }), now)).toBe(false);
});

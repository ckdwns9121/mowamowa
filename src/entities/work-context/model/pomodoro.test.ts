import { describe, expect, it } from "bun:test";
import { formatTimeDisplay, DEFAULT_POMODORO_SETTINGS } from "./pomodoro";

describe("pomodoro model", () => {
  it("formats remaining seconds into MM:SS correctly", () => {
    expect(formatTimeDisplay(1500)).toBe("25:00");
    expect(formatTimeDisplay(300)).toBe("05:00");
    expect(formatTimeDisplay(65)).toBe("01:05");
    expect(formatTimeDisplay(9)).toBe("00:09");
    expect(formatTimeDisplay(0)).toBe("00:00");
    expect(formatTimeDisplay(-5)).toBe("00:00");
  });

  it("has sensible default settings", () => {
    expect(DEFAULT_POMODORO_SETTINGS.focusDurationMinutes).toBe(25);
    expect(DEFAULT_POMODORO_SETTINGS.shortBreakDurationMinutes).toBe(5);
    expect(DEFAULT_POMODORO_SETTINGS.longBreakDurationMinutes).toBe(15);
  });
});

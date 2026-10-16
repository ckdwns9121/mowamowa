import { describe, expect, test } from "bun:test";
import { artworkUrl, elapsedAt, formatTrackTime, parseNowPlaying } from "./now-playing";

describe("now playing", () => {
  test("parse drops payloads without a title", () => {
    expect(parseNowPlaying(null)).toBeNull();
    expect(parseNowPlaying({ playing: true })).toBeNull();
    expect(parseNowPlaying({ title: "Song", playing: 1 })).toEqual({ title: "Song", playing: true });
  });

  test("elapsed extrapolates only while playing and caps at duration", () => {
    const sampledAt = 1_000;
    const item = { title: "Song", playing: true, elapsedTime: 10, timestamp: sampledAt, duration: 15 };
    expect(elapsedAt(item, sampledAt * 1000 + 3_000)).toBe(13);
    expect(elapsedAt(item, sampledAt * 1000 + 30_000)).toBe(15);
    expect(elapsedAt({ ...item, playing: false }, sampledAt * 1000 + 3_000)).toBe(10);
  });

  test("artwork becomes a data url", () => {
    expect(artworkUrl({ title: "Song", playing: true })).toBeUndefined();
    expect(artworkUrl({ title: "Song", playing: true, artworkData: "AAAA", artworkMimeType: "image/png" })).toBe("data:image/png;base64,AAAA");
    expect(formatTrackTime(65.9)).toBe("1:05");
  });
});

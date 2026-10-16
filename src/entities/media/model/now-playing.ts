// Payload shape of mediaremote-adapter `stream` events (keys we use).
export interface NowPlaying {
  title: string;
  artist?: string;
  album?: string;
  playing: boolean;
  bundleIdentifier?: string;
  duration?: number;
  elapsedTime?: number;
  /** Unix seconds when elapsedTime was sampled. */
  timestamp?: number;
  artworkData?: string;
  artworkMimeType?: string;
}

export const MEDIA_COMMAND = { play: 0, pause: 1, toggle: 2, next: 4, previous: 5 } as const;
export type MediaCommand = keyof typeof MEDIA_COMMAND;

export function parseNowPlaying(value: unknown): NowPlaying | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.title !== "string" || !item.title) return null;
  return { ...item, title: item.title, playing: Boolean(item.playing) } as NowPlaying;
}

export function artworkUrl(item: NowPlaying | null): string | undefined {
  if (!item?.artworkData) return undefined;
  return `data:${item.artworkMimeType ?? "image/jpeg"};base64,${item.artworkData}`;
}

/** Elapsed seconds at `nowMs`, extrapolated from the last sample while playing. */
export function elapsedAt(item: NowPlaying, nowMs: number): number {
  const base = item.elapsedTime ?? 0;
  if (!item.playing || !item.timestamp) return base;
  const elapsed = base + Math.max(0, nowMs / 1000 - item.timestamp);
  return item.duration ? Math.min(elapsed, item.duration) : elapsed;
}

export function formatTrackTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

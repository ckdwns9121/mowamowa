import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { MEDIA_COMMAND, parseNowPlaying, type MediaCommand, type NowPlaying } from "../model/now-playing";

export async function getNowPlaying(): Promise<NowPlaying | null> {
  return parseNowPlaying(await invoke<unknown>("now_playing"));
}

export function subscribeNowPlaying(onChange: (item: NowPlaying | null) => void): () => void {
  let active = true;
  let off: (() => void) | undefined;
  void listen<unknown>("now-playing", (event) => onChange(parseNowPlaying(event.payload)))
    .then((unlisten) => { if (active) off = unlisten; else unlisten(); })
    .catch(() => undefined);
  return () => { active = false; off?.(); };
}

export function sendMediaCommand(command: MediaCommand): Promise<void> {
  return invoke("media_send", { command: MEDIA_COMMAND[command] });
}

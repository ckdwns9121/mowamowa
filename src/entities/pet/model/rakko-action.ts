import timing from "./rakko-action.json";

export const RAKKO_ACTION_MS = timing.frames / timing.fps * 1000 + timing.settleMs;
export const RAKKO_REPLAY_GAP_MS = timing.replayGapMs;

/** One active performance and at most one queued replay, even under rapid clicks. */
export function createRakkoActionQueue(
  onActive: (active: boolean) => void,
  schedule: (callback: () => void, ms: number) => ReturnType<typeof setTimeout> = setTimeout,
  cancel: (timer: ReturnType<typeof setTimeout>) => void = clearTimeout,
) {
  let active = false;
  let queued = false;
  let disposed = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  function start() {
    if (disposed) return;
    active = true;
    onActive(true);
    timeout = schedule(() => {
      onActive(false);
      timeout = schedule(() => {
        active = false;
        if (queued) { queued = false; start(); }
      }, RAKKO_REPLAY_GAP_MS);
    }, RAKKO_ACTION_MS);
  }
  return {
    request() { if (disposed) return; if (active) queued = true; else start(); },
    dispose() { disposed = true; queued = false; if (timeout !== undefined) cancel(timeout); },
  };
}

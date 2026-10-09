import timing from "./pet-action.json";

export interface PetAction { frames: number; label: string; hint: string }
const ACTIONS: Record<string, PetAction> = timing.actions;

export const PET_REPLAY_GAP_MS = timing.replayGapMs;

/** Click performances drawn as a dedicated React timeline in the Rive artboard. */
export function getPetAction(petId: string): PetAction | null {
  return ACTIONS[petId] ?? null;
}

export function petActionMs(petId: string): number {
  const action = getPetAction(petId);
  return action ? action.frames / timing.fps * 1000 + timing.settleMs : 0;
}

/** One active performance and at most one queued replay, even under rapid clicks. */
export function createPetActionQueue(
  petId: string,
  onActive: (active: boolean) => void,
  schedule: (callback: () => void, ms: number) => ReturnType<typeof setTimeout> = setTimeout,
  cancel: (timer: ReturnType<typeof setTimeout>) => void = clearTimeout,
) {
  const durationMs = petActionMs(petId);
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
      }, PET_REPLAY_GAP_MS);
    }, durationMs);
  }
  return {
    request() { if (disposed || !durationMs) return; if (active) queued = true; else start(); },
    dispose() { disposed = true; queued = false; if (timeout !== undefined) cancel(timeout); },
  };
}

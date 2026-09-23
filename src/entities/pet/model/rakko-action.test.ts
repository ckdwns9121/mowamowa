import { describe, expect, test } from "bun:test";
import { createRakkoActionQueue, RAKKO_ACTION_MS, RAKKO_REPLAY_GAP_MS } from "./rakko-action";

function harness() {
  type Token = ReturnType<typeof setTimeout>;
  let serial = 0;
  const pending = new Map<Token, { fn: () => void; ms: number }>();
  const events: boolean[] = [];
  const queue = createRakkoActionQueue((active) => events.push(active), (fn, ms) => {
    const token = ++serial as unknown as Token;
    pending.set(token, { fn, ms });
    return token;
  }, (token) => { pending.delete(token); });
  function next() {
    const [token, job] = [...pending.entries()][0];
    pending.delete(token); job.fn(); return job.ms;
  }
  return { queue, events, pending, next };
}

describe("Rakko click performance", () => {
  test("rapid clicks queue one replay without interrupting the current landing", () => {
    const h = harness();
    for (let i = 0; i < 20; i++) h.queue.request();
    expect(h.events).toEqual([true]);
    expect(h.pending.size).toBe(1);
    expect(h.next()).toBe(RAKKO_ACTION_MS);
    expect(h.events).toEqual([true, false]);
    expect(h.next()).toBe(RAKKO_REPLAY_GAP_MS);
    expect(h.events).toEqual([true, false, true]);
    h.next(); h.next();
    expect(h.events).toEqual([true, false, true, false]);
    expect(h.pending.size).toBe(0);
  });
  test("a click during settling is retained, and changing pets cancels pending work", () => {
    const h = harness(); h.queue.request(); h.next(); h.queue.request(); h.next();
    expect(h.events).toEqual([true, false, true]);
    h.queue.dispose(); h.queue.request();
    expect(h.pending.size).toBe(0);
    expect(h.events).toEqual([true, false, true]);
  });
  test("a new click after completion starts a fresh action", () => {
    const h = harness(); h.queue.request(); h.next(); h.next(); h.queue.request();
    expect(h.events).toEqual([true, false, true]);
    h.queue.dispose();
  });
});

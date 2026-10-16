import { useEffect, useState } from "react";
import { getNowPlaying, subscribeNowPlaying } from "../api/now-playing-repository";
import type { NowPlaying } from "../model/now-playing";

export function useNowPlaying(): NowPlaying | null {
  const [item, setItem] = useState<NowPlaying | null>(null);
  useEffect(() => {
    let active = true;
    void getNowPlaying().then((initial) => active && setItem(initial)).catch(() => undefined);
    const off = subscribeNowPlaying((next) => active && setItem(next));
    return () => { active = false; off(); };
  }, []);
  return item;
}

import { useEffect, useState } from "react";
import { Music, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { artworkUrl, elapsedAt, formatTrackTime, sendMediaCommand, type NowPlaying } from "../../entities/media";

/** Expanded-notch strip: artwork, title, transport controls and progress. */
export default function NowPlayingBar({ item }: { item: NowPlaying }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!item.playing) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [item.playing]);

  const elapsed = elapsedAt(item, now);
  const art = artworkUrl(item);
  const progress = item.duration ? Math.min(100, (elapsed / item.duration) * 100) : 0;
  const send = (command: Parameters<typeof sendMediaCommand>[0]) => void sendMediaCommand(command).catch((cause) => console.warn("미디어 명령 실패:", cause));

  return (
    <section className="now-playing" aria-label="재생 중인 미디어">
      {art ? <img className="now-playing-art" src={art} alt="" /> : <span className="now-playing-art is-empty"><Music size={14} /></span>}
      <div className="now-playing-info">
        <div className="now-playing-title" title={item.title}>{item.title}</div>
        <div className="now-playing-artist">{item.artist || item.album || sourceName(item.bundleIdentifier)}</div>
        <div className="now-playing-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="now-playing-controls">
        <span className="now-playing-time">{formatTrackTime(elapsed)}{item.duration ? ` / ${formatTrackTime(item.duration)}` : ""}</span>
        <button type="button" onClick={() => send("previous")} title="이전 곡" aria-label="이전 곡"><SkipBack size={12} /></button>
        <button type="button" className="is-primary" onClick={() => send("toggle")} title={item.playing ? "일시정지" : "재생"} aria-label={item.playing ? "일시정지" : "재생"}>
          {item.playing ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button type="button" onClick={() => send("next")} title="다음 곡" aria-label="다음 곡"><SkipForward size={12} /></button>
      </div>
    </section>
  );
}

const SOURCES: Record<string, string> = {
  "com.apple.Music": "Apple Music",
  "com.spotify.client": "Spotify",
  "com.apple.Safari": "Safari",
  "com.google.Chrome": "Chrome",
  "com.apple.podcasts": "팟캐스트",
};
function sourceName(bundle?: string): string {
  return (bundle && SOURCES[bundle]) || bundle?.split(".").pop() || "";
}

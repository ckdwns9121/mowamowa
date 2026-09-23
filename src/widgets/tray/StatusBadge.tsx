export type BadgeTone = "todo" | "progress" | "done" | "review" | "blocked";

export default function StatusBadge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return <span className={`tray-status-badge is-${tone}`}><i aria-hidden="true" />{children}</span>;
}

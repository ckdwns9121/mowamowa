export type PrimarySection =
  | "dashboard"
  | "tasks"
  | "chat"
  | "sessions"
  | "jira"
  | "pull_requests"
  | "settings";

export const primarySections: readonly PrimarySection[] = [
  "dashboard",
  "tasks",
  "sessions",
  "jira",
  "pull_requests",
  "chat",
  "settings",
];

export const sectionTitle: Record<PrimarySection, string> = {
  dashboard: "Planner",
  tasks: "Task",
  sessions: "Workspace",
  jira: "Jira Tickets",
  pull_requests: "Pull Requests",
  chat: "Chat",
  settings: "Settings",
};

export function isPrimarySection(value: unknown): value is PrimarySection {
  return typeof value === "string" && primarySections.includes(value as PrimarySection);
}

export function restoreOpenSections(value: string | null): PrimarySection[] {
  if (!value) return ["dashboard"];
  try {
    const stored = JSON.parse(value);
    if (!Array.isArray(stored)) return ["dashboard"];
    const unique = stored.filter(isPrimarySection).filter((section, index, sections) =>
      sections.indexOf(section) === index,
    );
    return unique.length > 0 ? unique : ["dashboard"];
  } catch {
    return ["dashboard"];
  }
}


export function formatToday() {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date());
}

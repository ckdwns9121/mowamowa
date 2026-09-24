import { useEffect, useState, type FormEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { RefreshCw, Settings2, ArrowUpRight } from "lucide-react";
import { listCachedJiraIssues, refreshAssignedJiraIssues } from "../../entities/work-context/api/jira-issue-repository";
import { getAppSettings, setAppSettings } from "../../entities/work-context/api/settings-repository";

import StatusBadge, { type BadgeTone } from "./StatusBadge";

type Source = "jira" | "reviews";
interface Row { id: string; title: string; detail: string; url: string; status: string; tone: BadgeTone }
interface Reviews {
  account: string;
  possiblyTruncated: boolean;
  items: Array<{ number: number; title: string; url: string; repository: { nameWithOwner: string } }>;
}

export default function WorkInbox({ source }: { source: Source }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [account, setAccount] = useState("");
  const [query, setQuery] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [connectionReady, setConnectionReady] = useState(false);
  const [showCompleted, setShowCompleted] = useState(() => localStorage.getItem("orbit.jira.show-completed") === "true");

  async function refresh(force = false): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      if (source === "jira") {
        const result = await refreshAssignedJiraIssues({ force });
        setRows(result.issues.map((issue) => ({
          id: issue.key, title: issue.summary, detail: issue.key, url: issue.url, status: issue.status, tone: issue.statusCategory === "done" ? "done" : issue.statusCategory === "indeterminate" ? "progress" : "todo",
        })));
        setNotice(result.truncated ? "최근 담당 티켓 500개까지만 조회했습니다." : "");
      } else {
        const result = await invoke<Reviews>("fetch_github_review_requests");
        setRows(result.items.map((item) => ({ id: item.url, title: item.title, detail: `${item.repository.nameWithOwner} #${item.number}`, url: item.url, status: "리뷰 대기", tone: "review" })));
        setAccount(result.account);
        setNotice(result.possiblyTruncated ? "최대 100개까지 표시합니다." : "");
      }
    return true;
    } catch (cause) {
      setError(String(cause instanceof Error ? cause.message : cause));
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      if (source === "jira") {
        try {
          const [settings, hasToken] = await Promise.all([
            getAppSettings(), invoke<boolean>("secret_status", { secretId: "jira_api_token" }),
          ]);
          if (!active) return;
          if (!settings.jira_url?.trim() || !settings.jira_email?.trim() || !hasToken) {
            setSettingsOpen(true); setLoading(false); return;
          }
          setConnectionReady(true);
          const cached = await listCachedJiraIssues();
          if (active) setRows(cached.map((item) => ({ id: item.key, title: item.summary, detail: item.key, url: item.url, status: item.status, tone: item.statusCategory === "done" ? "done" : item.statusCategory === "indeterminate" ? "progress" : "todo" })));
        } catch (cause) {
          if (active) { setError(String(cause)); setSettingsOpen(true); setLoading(false); }
          return;
        }
      }
      if (source === "reviews") {
        try {
          const settings = await getAppSettings();
          if (!active) return;
          if (settings.github_reviews_enabled !== "true") { setLoading(false); return; }
          setConnectionReady(true);
        } catch (cause) {
          if (active) { setError(String(cause)); setLoading(false); }
          return;
        }
      }
      if (active) await refresh();
    })();
    return () => { active = false; };
  }, [source]);

  const filtered = rows.filter((row) => (source !== "jira" || showCompleted || row.tone !== "done") && `${row.title} ${row.detail}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <section className="tray-inbox" aria-label={source === "jira" ? "내 Jira 티켓" : "내 PR 리뷰 요청"}>
    <header className="tray-inbox-heading">
      <strong>{source === "jira" ? connectionReady ? "내 담당 티켓" : "Jira 연결" : "리뷰 요청"} {connectionReady && <span>{filtered.length}</span>}</strong>
      <div>
        {source === "jira" && <button type="button" aria-label="Jira 연결 설정" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(connectionReady ? !settingsOpen : true)}><Settings2 size={14} /></button>}
        <button type="button" aria-label="새로고침" disabled={loading || !connectionReady} onClick={() => void refresh(true)}><RefreshCw size={14} /></button>
      </div>
    </header>
    {source === "jira" && settingsOpen && <JiraConnection onSaved={async () => {
      const success = await refresh(true);
      if (success) { setConnectionReady(true); setSettingsOpen(false); }
      return success;
    }} />}
    {source === "reviews" && !connectionReady && !loading && <div className="tray-connection">
      <span>GitHub를 연결하면 나에게 요청된 PR 리뷰를 볼 수 있어요.</span>
      <small>이 Mac의 GitHub CLI 활성 계정을 사용합니다. 아직 로그인하지 않았다면 터미널에서 <code>gh auth login</code>을 실행해주세요.</small>
      <button type="button" onClick={() => void (async () => {
        if (!await refresh()) return;
        try {
          await setAppSettings({ github_reviews_enabled: "true" });
          setConnectionReady(true);
        } catch (cause) { setRows([]); setError(String(cause)); }
      })()}>GitHub 연결하고 불러오기</button>
    </div>}
    {source === "reviews" && <p className="tray-inbox-note">{account ? `@${account} · GitHub CLI 활성 계정` : "GitHub CLI에 로그인된 계정으로 확인합니다."}</p>}
    {connectionReady && <input className="tray-inbox-search" aria-label="목록 검색" placeholder={source === "jira" ? "티켓 검색" : "PR 검색"} value={query} onChange={(event) => setQuery(event.target.value)} />}
    {source === "jira" && connectionReady && <label className="tray-completed-filter"><input type="checkbox" checked={showCompleted} onChange={(event) => { setShowCompleted(event.target.checked); localStorage.setItem("orbit.jira.show-completed", String(event.target.checked)); }} />완료된 티켓 포함</label>}
    {error && <div className="tray-error-banner" role="alert">{error}{rows.length > 0 && <small>마지막으로 불러온 목록입니다.</small>}</div>}
    {notice && <p className="tray-inbox-note">{notice}</p>}
    {loading && <p className="tray-inbox-note" role="status">확인 중…</p>}
    {connectionReady && <div className="tray-inbox-list">
      {filtered.map((row) => <button className="tray-inbox-row" key={row.id} type="button" onClick={() => void openUrl(row.url).catch((cause) => setError(String(cause)))}>
        <span><span className="tray-inbox-meta"><small>{row.detail}</small><StatusBadge tone={row.tone}>{row.status}</StatusBadge></span><strong>{row.title}</strong></span><ArrowUpRight size={14} />
      </button>)}
      {!loading && !error && filtered.length === 0 && <p className="tray-empty-hint">{query ? "검색 결과가 없습니다." : source === "jira" ? "담당 티켓이 없습니다." : "대기 중인 리뷰 요청이 없습니다."}</p>}
    </div>}
  </section>;
}

function JiraConnection({ onSaved }: { onSaved: () => Promise<boolean> }) {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [tokenSaved, setTokenSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void Promise.all([getAppSettings(), invoke<boolean>("secret_status", { secretId: "jira_api_token" })]).then(([settings, saved]) => {
      setUrl(settings.jira_url || ""); setEmail(settings.jira_email || ""); setTokenSaved(saved);
    }).catch((cause) => setError(String(cause))).finally(() => setLoading(false));
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const site = new URL(url.trim());
      if (site.protocol !== "https:" || !site.hostname.endsWith(".atlassian.net") || site.username || site.password) throw new Error("https://회사명.atlassian.net 주소를 입력해주세요.");
      if (token.trim()) await invoke("set_secret", { secretId: "jira_api_token", value: token.trim() });
      await setAppSettings({ jira_url: site.origin, jira_email: email.trim() });
      setToken(""); setTokenSaved(true);
      if (!await onSaved()) setError("연결하지 못했습니다. 입력한 정보와 네트워크를 확인해주세요.");
    } catch (cause) { setError(String(cause instanceof Error ? cause.message : cause)); }
    finally { setSaving(false); }
  }
  return <form className="tray-connection" onSubmit={save}>
    <label>사이트 URL<input type="url" required disabled={loading || saving} value={url} placeholder="https://회사명.atlassian.net" onChange={(event) => setUrl(event.target.value)} /></label>
    <label>이메일<input type="email" required disabled={loading || saving} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
    <label>API 토큰<input type="password" autoComplete="off" disabled={loading || saving} required={!tokenSaved} value={token} placeholder={tokenSaved ? "저장됨 · 변경할 때만 입력" : "API 토큰 입력"} onChange={(event) => setToken(event.target.value)} /></label>
    {error && <p role="alert">{error}</p>}
    <button type="submit" disabled={loading || saving}>{saving ? "저장 중…" : "저장하고 불러오기"}</button>
  </form>;
}

# MowaMowa · 모와모와

**Your tasks in the MacBook notch. Your focus buddy on the desktop.**

**English** · [한국어](README.ko.md) · [日本語](README.ja.md)

[![CI](https://github.com/ckdwns9121/mowamowa/actions/workflows/ci.yml/badge.svg)](https://github.com/ckdwns9121/mowamowa/actions/workflows/ci.yml)
![macOS](https://img.shields.io/badge/macOS-13%2B-222222?logo=apple)

<p align="center"><img src="docs/assets/mowamowa/notch-collapsed.png" width="560" alt="The collapsed notch island with Rakko and the focus timer" /></p>

MowaMowa is a small work companion that lives in your MacBook's camera notch, like Dynamic Island on iPhone. Hover the notch and it opens into your todos, assigned Jira tickets and GitHub review requests. While you focus, the collapsed island shows your pet and the timer on either side of the camera. Macs without a notch get a matching pill at the top of the screen.

## How it works

1. **Gather**: hover the notch to add a task, check assigned tickets, or find a PR waiting for your review.
2. **Focus**: start one task. The island keeps the timer in view and your companion stays on the desktop.
3. **Reflect**: browse focus time and completed tasks in a month calendar.

## Tour

<table>
<tr>
<td width="50%" valign="top"><h3>A notch workspace</h3><p>Hover to open, move away to close. Only today's tasks and leftovers from yesterday stay in the list; older ones are one click away.</p><img src="docs/assets/mowamowa/notch-tasks.png" width="360" alt="Today's tasks in the expanded notch" /></td>
<td width="50%" valign="top"><h3>A month of focus</h3><p>An Apple Calendar style month view. Dots mark days with focus time or completed work; pick a day to see what you did.</p><img src="docs/assets/mowamowa/notch-calendar.png" width="360" alt="Month calendar of focus history" /></td>
</tr>
<tr>
<td width="50%" valign="top"><h3>Your Jira tickets</h3><p>Status badges sit beside ticket keys. Completed tickets stay hidden unless you choose to include them.</p><img src="docs/assets/mowamowa/notch-jira.png" width="360" alt="Assigned Jira tickets" /></td>
<td width="50%" valign="top"><h3>Your review queue</h3><p>See open PRs requesting your review. Click an item to open it on GitHub.</p><img src="docs/assets/mowamowa/notch-reviews.png" width="360" alt="GitHub review requests" /></td>
</tr>
<tr>
<td width="50%" valign="top"><h3>Pick your companion</h3><p>Choose from 17 pets. The pet floats on the desktop by itself; drag it anywhere.</p><img src="docs/assets/mowamowa/notch-pets.png" width="360" alt="Pet picker" /></td>
<td width="50%" valign="top"><h3>Rakko with a sword</h3><p>Left alone, Rakko draws its sword and makes two quick cuts. Click it for a jump, five fast spins and a landing burst.</p><img src="docs/assets/mowamowa/rakko-sword.png" width="360" alt="Rakko drawing and swinging a sword" /></td>
</tr>
</table>

Notch, task, calendar, Jira and PR screenshots show the real UI with fictional demo data. The Rakko frames are rendered from the Rive file.

## Install

**Public DMG releases and Homebrew installation are not available yet.** Build from source below, or install a DMG shared with you.

### From an existing DMG

Open the DMG, drag `MowaMowa.app` into **Applications**, and launch it. No source checkout, Bun or Rust is needed.

### Build an installer

Requires macOS 13+, [Bun](https://bun.sh/) 1.3.6, Rust stable and Xcode Command Line Tools.

```bash
git clone https://github.com/ckdwns9121/mowamowa.git
cd mowamowa
bun install --frozen-lockfile
bun run bundle:mac
open src-tauri/target/release/bundle/dmg
```

Install from the generated DMG. This builds for your current Mac architecture.

<details>
<summary>Universal build for Apple Silicon and Intel</summary>

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
bun run bundle:mac:universal
```

Artifacts: `src-tauri/target/universal-apple-darwin/release/bundle/`.

</details>

### First launch

- **Tasks, pets and the timer** work without an external account.
- **Jira:** enter your `https://company.atlassian.net` site, email and API token in the Jira tab.
- **PR reviews:** install GitHub CLI, sign in with `gh auth login`, then click the GitHub connect button. Check the active account with `gh auth status`.

Installed and development builds use separate data, settings and Keychain entries. Reinstalling this isolated edition preserves its own records. Data and tokens from earlier builds that shared the development storage are not imported automatically; the first launch starts with fresh settings. Existing data and Keychain entries are neither deleted nor moved. Users who need to retain records from those earlier builds need a separate migration before switching to this edition. Right-click the menu-bar icon to quit.

## Data and connections

Tasks and focus history are stored in local SQLite. Jira tokens use macOS Keychain by default; GitHub uses your local GitHub CLI authentication. Fetching connected Jira and GitHub lists contacts those services. PR reviews are not fetched until you connect.

## Development

```bash
bun run tauri dev
bun run build
bun test
bun run verify:fsd
cargo test --manifest-path src-tauri/Cargo.toml --lib
```

Built with Tauri 2, React 19, TypeScript, Rive and SQLite. See [MCP integration](docs/technical/README.md) for managing tasks from AI tools.

## Characters

This is an unofficial fan project featuring Chiikawa characters, not an official app or an affiliation with their creators or rights holders. Character names and artwork belong to their respective rights holders.

Bug reports and suggestions: [Issues](https://github.com/ckdwns9121/mowamowa/issues).

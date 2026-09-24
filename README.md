# MowaMowa · 모와모와

**Your tasks in the menu bar. Your focus buddy on the desktop.**

**English** · [한국어](README.ko.md) · [日本語](README.ja.md)

[![CI](https://github.com/ckdwns9121/mowamowa/actions/workflows/ci.yml/badge.svg)](https://github.com/ckdwns9121/mowamowa/actions/workflows/ci.yml)
![macOS](https://img.shields.io/badge/macOS-13%2B-222222?logo=apple)

<p align="center"><img src="docs/assets/mowamowa/focus-pet.png" width="480" alt="Rakko beside the focus timer" /></p>

MowaMowa is a small work companion that keeps your tasks close and stays beside you while you focus. Check your todos, assigned Jira tickets and GitHub review requests from the menu bar. Pick one task, start the timer, and work alongside your desktop pet.


## How it works

1. **Gather** — Add a task, check assigned tickets, or find a PR waiting for your review.
2. **Focus** — Start one task with a timer and a little companion on your desktop.
3. **Reflect** — Browse focus time and completed tasks by date.

## Tour

<table>
<tr>
<td width="50%" valign="top"><h3>A small menu-bar workspace</h3><p>Add a task in one line and start working. Everything lives in the menu bar, without a separate main window.</p><img src="docs/assets/mowamowa/tasks.png" width="360" alt="A small menu-bar workspace" /></td>
<td width="50%" valign="top"><h3>Pick your companion</h3><p>Choose from 17 pets. Click Rakko for a jump, five fast spins, light trails and a landing burst.</p><img src="docs/assets/mowamowa/pet-picker.png" width="360" alt="Pick your companion" /></td>
</tr>
<tr>
<td width="50%" valign="top"><h3>Your Jira tickets</h3><p>Status badges sit beside ticket keys. Completed tickets stay hidden unless you choose to include them.</p><img src="docs/assets/mowamowa/jira.png" width="360" alt="Your Jira tickets" /></td>
<td width="50%" valign="top"><h3>Your review queue</h3><p>See open PRs requesting your review. Click an item to open it on GitHub.</p><img src="docs/assets/mowamowa/reviews.png" width="360" alt="Your review queue" /></td>
</tr>
</table>

The pet and picker screenshots were captured in the installed macOS app. Task, Jira and PR screenshots use the real UI with fictional demo data.

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

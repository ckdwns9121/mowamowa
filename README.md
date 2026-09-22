# Orbit

<p align="center">
  <strong>English</strong> ·
  <a href="README.ko.md">한국어</a> ·
  <a href="README.ja.md">日本語</a>
</p>

> A lightweight macOS menu-bar micro-todo and Pomodoro timer featuring Chiikawa's master warrior, Rakko.

[![CI](https://github.com/ckdwns9121/orbit/actions/workflows/ci.yml/badge.svg)](https://github.com/ckdwns9121/orbit/actions/workflows/ci.yml)
[![Release macOS](https://github.com/ckdwns9121/orbit/actions/workflows/release.yml/badge.svg)](https://github.com/ckdwns9121/orbit/actions/workflows/release.yml)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![Bun](https://img.shields.io/badge/Bun-1.3-FBF0DF?logo=bun&logoColor=111)
![Platform](https://img.shields.io/badge/platform-macOS-black?logo=apple)

---

## Introduction

Managing complex dashboards and bulky windows adds friction to daily development workflows.

**Orbit** transforms your task workflow into a seamless **macOS menu bar micro-todo service**, paired with an animated **Rakko (Chiikawa) floating pet companion & Pomodoro timer** running in the corner of your screen.

Quickly offload tasks in one line, eliminate priority decision fatigue, and lock in on **one single task** alongside master warrior Rakko.

---

## Key Features

### 🦦 Rakko Pomodoro Floating Pet Companion
* **Always on Screen**: Floats unobtrusively on all macOS virtual spaces (Spaces) without interrupting your editor or terminal.
* **Animated Interactions**: Reacts dynamically to your focus states and timer progress with sword slashes, 1080° cyclone spins, and idle animations.
* **1-Click Toggle**: Summon or hide Rakko instantly via tray button or shortcut.

### ⚡️ Tray Micro To-Do (Menu Bar Only)
* **Accessory Mode**: Runs quietly in the macOS menu bar—no bulky desktop window. Opens in 0.2 seconds and dismisses with `Esc` or an outside click.
* **1-Line Quick-Add**: Type your task title and hit `Enter` to immediately prepend it to the top of the queue.
* **Zero-Priority Overhead**: No High/Medium/Low dropdowns. Order is naturally governed by sequence.
* **NOW & TODO & DONE Flow**:
  * `NOW`: The single active focus card with a live elapsed timer, and 1-click `[Complete]` / `[Pause]`.
  * `TODO`: The waiting task queue with `[Start]` buttons to swap focus.
  * `DONE`: Completed tasks remain visible with a strikethrough (`~~`) in the compact bottom section, giving a satisfying feeling of accomplishment.
* **Undo Completion**: Easily uncheck to restore tasks if marked by mistake.

### 🔌 Background Intelligence & MCP Support
* **Local-First Architecture**: All your work items remain on your machine in local SQLite (`tauri-plugin-sql`).
* **Model Context Protocol (MCP)**: Embedded MCP server allowing Claude Code, Cursor, and other AI agents to inspect and create Orbit tasks directly.

---

## Workflow

```text
1. Click menu bar icon (or global shortcut)
        ↓
2. Type task title and press [Enter] (immediately prepended to list)
        ↓
3. Click [Start] → Rakko mascot appears & NOW focus timer begins
        ↓
4. Check off when finished → Strikethrough feedback & recorded in today's accomplishments
```

---

## Requirements & Quick Start

### Requirements
* macOS 13+
* [Bun](https://bun.sh/) 1.3.6
* Rust stable & Xcode Command Line Tools

### Run in Development
```bash
git clone https://github.com/ckdwns9121/orbit.git
cd orbit
bun install --frozen-lockfile
bun run tauri dev
```

Click the Orbit icon in your macOS menu bar to toggle the tray popover.

### Build macOS App
```bash
# Current Mac architecture (DMG and .app)
bun run bundle:mac

# Universal binary (Apple Silicon + Intel)
rustup target add aarch64-apple-darwin x86_64-apple-darwin
bun run bundle:mac:universal
```

Artifacts are created under `src-tauri/target/release/bundle/`.

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Desktop Shell** | Tauri 2 (macOS Accessory Mode) |
| **Frontend** | React 19, TypeScript, Sass/SCSS, Lucide React |
| **Mascot Animation** | Rive Canvas & Custom Vector Animation |
| **Backend & Core** | Rust 2021, SQLite (`tauri-plugin-sql`) |
| **Storage & Security** | macOS Keychain, Rust `keyring` |
| **AI Integration** | Model Context Protocol (MCP Server) |
| **Build & Test** | Bun, Vite, Bun Test, Cargo Test |

---

## Contributing

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/ckdwns9121/orbit/issues).

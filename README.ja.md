# Orbit

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ko.md">한국어</a> ·
  <strong>日本語</strong>
</p>

> 『ちいかわ』の頼れる上位ランカー・ラッコ先生と一緒に集中する macOS メニューバー常駐型マイクロ ToDo ＆ ポモドーロタイマー。

[![CI](https://github.com/ckdwns9121/orbit/actions/workflows/ci.yml/badge.svg)](https://github.com/ckdwns9121/orbit/actions/workflows/ci.yml)
[![Release macOS](https://github.com/ckdwns9121/orbit/actions/workflows/release.yml/badge.svg)](https://github.com/ckdwns9121/orbit/actions/workflows/release.yml)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![Bun](https://img.shields.io/badge/Bun-1.3-FBF0DF?logo=bun&logoColor=111)
![Platform](https://img.shields.io/badge/platform-macOS-black?logo=apple)

---

## はじめに

重厚なダッシュボードウィンドウを開き、膨大なチケットやタスクを管理することは、日々の開発フローにおいて大きな摩擦を生みます。

**Orbit** は、日々の作業に自然に溶け込む **macOS メニューバー常駐型の超軽量マイクロ ToDo** と、画面の片隅で共に戦い・集中してくれる **ラッコ先生のポモドーロ・フローティングペットタイマー** を提供します。

思いついたタスクを 1 行で素早く追加し、複雑な優先順位付けの悩みから解放され、ラッコ先生と一緒に **目の前のたった一つのタスク** に集中しましょう。

---

## 主な機能

### 🦦 ラッコ先生のポモドーロ・フローティングペットタイマー
* **画面上のペアプロ相手**: すべての macOS 仮想デスクトップ（Spaces）上に常に表示され、コード入力や作業の邪魔をせずに見守ってくれます。
* **生き生きとしたアクション**: 集中状態やタイマー進行に合わせて、剣撃アクション、1080°スピン、待機モーションなど多彩なアニメーションを披露します。
* **ワンクリックで表示切替**: メニューバートレイのボタンやショートカットから、いつでも自由に呼び出したり隠したりできます。

### ⚡️ 超軽量メニューバートレイ ToDo（Tray Micro To-Do）
* **メニューバー常駐（Accessory Mode）**: 巨大なウィンドウなしで、上部メニューバーアイコンから 0.2 秒で開き、`Esc` や外側クリックで瞬時に隠れます。
* **1行クイック追加（Quick-Add）**: 上部の入力欄にタイトルを入れて `Enter` を押すだけで、リストの最上位に即座に追加されます。
* **決断疲れをなくすゼロ優先度（Zero Priority）**: High/Medium/Low のような形式的なランク分けを廃止し、リストの並び順だけで直感的に管理します。
* **NOW（集中中）＆ TODO（待機リスト）**:
  * `NOW`: 現在集中している 1 件のタスクカード、リアルタイム経過タイマー、ワンクリックの `[完了]` / `[一時停止]`。
  * `TODO`: 順番待ちのタスクリスト。`[開始]` ボタンで即座に集中タスクを切り替え可能。
* **DONE 取り消し線と達成感**: 完了チェックを入れると即座に消えるのではなく、取り消し線（`~~`）が引かれて下部の DONE エリアに残り、本日の達成感を与えます（誤ってチェックした場合もワンクリックで復元可能）。

### 🔌 バックグラウンドインテリジェンス ＆ MCP 連携
* **ローカルファースト（Local First）**: すべてのタスクデータは外部サーバーではなく、お使いの Mac のローカル SQLite に安全に保存されます。
* **AI エージェント連携（Orbit MCP）**: Claude Code や Cursor などの AI アシスタントが Orbit のタスクを直接参照・追加できる Model Context Protocol（MCP）サーバーを内蔵しています。

---

## 使い方

```text
1. メニューバーの Orbit アイコンをクリック（またはグローバルショートカット）
        ↓
2. 上部入力欄にタスク名を入力して [Enter]（リストの先頭に即座に追加）
        ↓
3. [開始] ボタンをクリック → ラッコ先生が召喚され NOW 集中タイマーが開始
        ↓
4. 作業完了時に [完了] をチェック → 取り消し線付きで本日の達成記録に保存
```

---

## 必要条件と起動方法

### 必要条件
* macOS 13 以降
* [Bun](https://bun.sh/) 1.3.6
* Rust stable ＆ Xcode Command Line Tools

### 開発モードでの起動
```bash
git clone https://github.com/ckdwns9121/orbit.git
cd orbit
bun install --frozen-lockfile
bun run tauri dev
```

起動後、macOS のメニューバーに Orbit アイコンが表示されます。クリックしてトレイポップアップを開いてください。

### macOS アプリのビルド
```bash
# 現在の Mac アーキテクチャ用ビルド（.app / .dmg）
bun run bundle:mac

# Apple Silicon & Intel Universal ビルド
rustup target add aarch64-apple-darwin x86_64-apple-darwin
bun run bundle:mac:universal
```

生成物は `src-tauri/target/release/bundle/` に出力されます。

---

## 技術スタック

| 領域 | 技術 |
| :--- | :--- |
| **Desktop Shell** | Tauri 2（macOS Accessory Mode） |
| **Frontend** | React 19, TypeScript, Sass/SCSS, Lucide React |
| **Mascot Animation** | Rive Canvas & Custom Vector Animation |
| **Backend & Core** | Rust 2021, SQLite (`tauri-plugin-sql`) |
| **Storage & Security** | macOS Keychain, Rust `keyring` |
| **AI Integration** | Model Context Protocol (MCP Server) |
| **Build & Test** | Bun, Vite, Bun Test, Cargo Test |

---

## コントリビューション

バグ報告や機能提案は [GitHub Issues](https://github.com/ckdwns9121/orbit/issues) までお寄せください。

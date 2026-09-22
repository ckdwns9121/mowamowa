# Orbit

<p align="center">
  <a href="README.md">English</a> ·
  <strong>한국어</strong> ·
  <a href="README.ja.md">日本語</a>
</p>

> 먼작귀(치이카와) 최고의 실력자, 용사 랏코(Rakko)와 함께하는 macOS 메뉴바 마이크로 몰입 투두 & 뽀모도로 타이머.

[![CI](https://github.com/ckdwns9121/orbit/actions/workflows/ci.yml/badge.svg)](https://github.com/ckdwns9121/orbit/actions/workflows/ci.yml)
[![Release macOS](https://github.com/ckdwns9121/orbit/actions/workflows/release.yml/badge.svg)](https://github.com/ckdwns9121/orbit/actions/workflows/release.yml)
![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![Bun](https://img.shields.io/badge/Bun-1.3-FBF0DF?logo=bun&logoColor=111)
![Platform](https://img.shields.io/badge/platform-macOS-black?logo=apple)

---

## 소개

무거운 대시보드를 열어두고 수많은 티켓과 할 일을 관리하는 것은 작업 흐름을 끊고 높은 마찰을 만듭니다.

**Orbit**은 개발 일상에 자연스럽게 녹아드는 **macOS 상단 메뉴바(트레이) 기반의 초경량 마이크로 투두**와, 화면 한구석에서 함께 싸우고 집중해주는 **랏코(Rakko) 뽀모도로 플로팅 펫 타이머**를 제공합니다.

생각난 일은 1초 만에 털어 넣고, 복잡한 우선순위 고민 없이 지금 가장 중요한 **단 하나의 작업**에 랏코와 함께 몰입하세요.

---

## 핵심 기능

### 🦦 랏코(Rakko) 뽀모도로 플로팅 펫 타이머
* **화면 위의 페어 프로그래밍 메이트**: 모든 macOS 가상 데스크톱(Spaces) 위에 항상 떠 있어 작업 중에도 시야를 방해하지 않고 함께합니다.
* **살아 숨쉬는 인터랙션**: 집중 상태와 타이머 진행에 반응하여 참격 액션, 덤블링 회오리 스핀, 대기 모션 등 다채로운 애니메이션을 선보입니다.
* **원클릭 토글**: 트레이 하단 버튼이나 단축키로 언제든 자유롭게 띄우거나 숨길 수 있습니다.

### ⚡️ 초경량 메뉴바 트레이 투두 (Tray Micro To-Do)
* **메뉴바 상주형 (Accessory Mode)**: 거대한 데스크탑 창 없이 상단 메뉴바 트레이에서 0.2초 만에 즉시 열리고, `Esc`나 클릭 한 번으로 사라집니다.
* **1줄 퀵 추가 (Quick-Add)**: 맨 위 입력창에 제목만 치고 `Enter`를 누르면 대기 목록 최상단에 즉시 등록됩니다.
* **결정 피로 없는 제로 우선순위 (Zero Priority)**: High/Medium/Low 같은 형식적인 등급 없이 목록의 위아래 순서로만 직관적으로 다룹니다.
* **NOW (1개 몰입) & TODO (대기 목록)**:
  * `NOW`: 현재 집중 중인 단 1개의 작업 카드와 실시간 경과 시간 타이머, 원클릭 `[완료]` / `[일시정지]`.
  * `TODO`: 대기 중인 할 일 목록, `[시작]` 버튼으로 즉시 집중 전환.
* **DONE 취소선 달성 피드백**: 완료 체크 시 즉시 지워지지 않고 취소선(`~~`)이 그어진 채 하단 완료 영역에 남아 오늘 하루의 성취감을 선사합니다. (실수로 체크한 경우 원클릭 복구 가능)

### 🔌 보조 업무 인텔리전스 & MCP 연동
* **로컬 우선 (Local First)**: 모든 작업 데이터는 외부 서버가 아닌 내 맥의 로컬 SQLite에 안전하게 보관됩니다.
* **AI 에이전트 연동 (Orbit MCP)**: Claude Code, Cursor 등 다양한 AI 어시스턴트가 Orbit의 할 일을 직접 조회하고 생성할 수 있는 Model Context Protocol(MCP) 서버를 지원합니다.

---

## 사용 방법

```text
1. 메뉴바 트레이 아이콘 클릭 (또는 글로벌 단축키)
        ↓
2. 상단 인풋에 할 일 입력 후 [Enter] (목록 최상단 즉시 추가)
        ↓
3. [시작] 버튼 클릭 → 랏코 펫 소환 & NOW 몰입 타이머 시작
        ↓
4. 작업 완료 시 [완료] 체크 → 취소선 피드백과 함께 오늘 달성 기록
```

---

## 요구사항 및 실행

### 요구사항
* macOS 13 이상
* [Bun](https://bun.sh/) 1.3.6
* Rust stable & Xcode Command Line Tools

### 소스에서 개발 모드 실행
```bash
git clone https://github.com/ckdwns9121/orbit.git
cd orbit
bun install --frozen-lockfile
bun run tauri dev
```

앱이 실행되면 상단 메뉴바에 Orbit 아이콘이 나타나며, 클릭하여 트레이 팝업을 열 수 있습니다.

### macOS 번들 앱 빌드
```bash
# 현재 Mac 아키텍처용 빌드
bun run bundle:mac

# Apple Silicon & Intel Universal 빌드
rustup target add aarch64-apple-darwin x86_64-apple-darwin
bun run bundle:mac:universal
```

빌드 산출물(App, DMG)은 `src-tauri/target/release/bundle/`에 생성됩니다.

---

## 기술 스택

| 영역 | 기술 |
| :--- | :--- |
| **Desktop Shell** | Tauri 2 (macOS Accessory Mode) |
| **Frontend** | React 19, TypeScript, Sass/SCSS, Lucide React |
| **Mascot Asset** | Rive Canvas & Custom Vector Animation |
| **Backend & Core** | Rust 2021, SQLite (`tauri-plugin-sql`) |
| **Storage & Security** | macOS Keychain, Rust `keyring` |
| **AI Integration** | Model Context Protocol (MCP Server) |
| **Build & Test** | Bun, Vite, Bun Test, Cargo Test |

---

## 기여 및 문의

버그 제보와 기능 제안은 [GitHub Issues](https://github.com/ckdwns9121/orbit/issues)를 이용해 주세요.

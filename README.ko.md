# 모와모와 · MowaMowa

**할 일은 메뉴바에, 집중 친구는 바탕화면에.**

[English](README.md) · **한국어** · [日本語](README.ja.md)

[![CI](https://github.com/ckdwns9121/mowamowa/actions/workflows/ci.yml/badge.svg)](https://github.com/ckdwns9121/mowamowa/actions/workflows/ci.yml)
![macOS](https://img.shields.io/badge/macOS-13%2B-222222?logo=apple)

<p align="center"><img src="docs/assets/mowamowa/focus-pet.png" width="480" alt="랏코와 함께하는 집중 타이머" /></p>

모와모와는 내 할 일을 챙겨주고, 집중하는 동안 곁에 있어주는 작은 업무 짝꿍입니다. 메뉴바에서 할 일·Jira 티켓·GitHub PR 리뷰를 확인하고, 오늘 끝낼 일을 하나 골라 펫과 함께 시작하세요.


## 이렇게 함께해요

1. **모으기** — 할 일을 적고, 담당 Jira 티켓과 나에게 요청된 PR 리뷰를 확인합니다.
2. **집중하기** — 한 가지 일을 시작하면 바탕화면의 펫과 타이머가 함께합니다.
3. **돌아보기** — 날짜별 집중 시간과 완료한 일을 살펴봅니다.

## 둘러보기

<table>
<tr>
<td width="50%" valign="top">
<h3>작은 메뉴바 작업 공간</h3>
<p>한 줄로 할 일을 추가하고, 지금 할 일을 시작하세요. 별도 메인 창 없이 메뉴바에서 관리합니다.</p>
<img src="docs/assets/mowamowa/tasks.png" width="360" alt="진행 중인 일과 대기 중인 할 일 목록" />
</td>
<td width="50%" valign="top">
<h3>오늘 함께할 친구</h3>
<p>17가지 펫 중 마음에 드는 친구를 고르세요. 랏코를 클릭하면 점프와 빠른 5회전, 반짝임과 착지 이펙트를 보여줍니다.</p>
<img src="docs/assets/mowamowa/pet-picker.png" width="360" alt="치이카와 캐릭터 펫 선택 화면" />
</td>
</tr>
<tr>
<td valign="top">
<h3>내 Jira 티켓</h3>
<p>티켓 번호 옆의 작은 상태 뱃지로 할 일과 진행 중인 일을 구분합니다. 완료 티켓은 기본으로 숨기고 필요할 때 포함할 수 있어요.</p>
<img src="docs/assets/mowamowa/jira.png" width="360" alt="상태 뱃지와 완료 티켓 필터가 있는 Jira 목록" />
</td>
<td valign="top">
<h3>쌓인 PR 리뷰</h3>
<p>나에게 리뷰가 요청된 열린 PR을 모아봅니다. 항목을 누르면 GitHub에서 바로 열립니다.</p>
<img src="docs/assets/mowamowa/reviews.png" width="360" alt="GitHub PR 리뷰 요청 목록" />
</td>
</tr>
</table>

펫과 펫 선택 화면은 설치된 macOS 앱에서 촬영했습니다. 할 일·Jira·PR 화면은 실제 UI에 가상 데이터를 넣어 촬영한 데모입니다.

## 설치

**현재 공개 DMG 릴리스와 Homebrew 설치는 아직 제공하지 않습니다.** 지금은 아래 명령으로 직접 빌드하거나, 빌드된 DMG를 전달받아 설치할 수 있습니다.

### DMG를 가지고 있다면

DMG를 열어 `MowaMowa.app`을 **응용 프로그램** 폴더로 옮기고 실행하세요. 소스 코드, Bun, Rust는 필요 없습니다.

### 소스에서 설치용 앱 만들기

macOS 13 이상, [Bun](https://bun.sh/) 1.3.6, Rust stable, Xcode Command Line Tools가 필요합니다.

```bash
git clone https://github.com/ckdwns9121/mowamowa.git
cd mowamowa
bun install --frozen-lockfile
bun run bundle:mac
open src-tauri/target/release/bundle/dmg
```

열린 폴더의 DMG로 설치하세요. `bun run bundle:mac`은 현재 Mac의 아키텍처용 앱을 만듭니다.

<details>
<summary>Apple Silicon과 Intel을 함께 지원하는 Universal 빌드</summary>

```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
bun run bundle:mac:universal
```

산출물은 `src-tauri/target/universal-apple-darwin/release/bundle/`에 생성됩니다.

</details>

### 처음 실행하면

- **할 일·펫·타이머**는 외부 계정 없이 사용할 수 있습니다.
- **Jira** 탭에서 `https://회사명.atlassian.net`, 이메일, API 토큰을 입력하세요.
- **PR 리뷰**는 GitHub CLI가 필요합니다. `gh auth login`으로 로그인한 뒤 **GitHub 연결하고 불러오기**를 누르세요. `gh auth status`로 활성 계정을 확인할 수 있습니다.

설치판은 개발판과 데이터·설정·키체인을 분리합니다. 재설치해도 설치판에서 쓰던 기록은 유지됩니다. 앱을 종료하려면 메뉴바 아이콘을 우클릭하세요.

## 데이터와 연결

할 일과 집중 기록은 로컬 SQLite에 저장합니다. Jira 토큰은 기본적으로 macOS 키체인에 저장하며, GitHub는 이 Mac의 GitHub CLI 인증을 사용합니다. 연결한 Jira·GitHub의 목록을 가져올 때 해당 서비스에 요청합니다. PR 리뷰는 연결 버튼을 누르기 전에는 조회하지 않습니다.

## 개발

```bash
bun run tauri dev       # 개발 모드
bun run build          # 프런트엔드 빌드
bun test               # 테스트
bun run verify:fsd     # 모듈 의존 방향 검사
cargo test --manifest-path src-tauri/Cargo.toml --lib
```

Tauri 2 · React 19 · TypeScript · Rive · SQLite로 만들었습니다. AI 도구에서 할 일을 다루는 기능은 [MCP 연동 문서](docs/technical/README.md)를 참고하세요.

## 캐릭터 안내

치이카와 캐릭터를 사용하는 비공식 팬 프로젝트이며, 원작자나 권리자와 제휴한 공식 앱이 아닙니다. 캐릭터와 관련 명칭·그림의 권리는 각 권리자에게 있습니다.

버그와 제안은 [Issues](https://github.com/ckdwns9121/mowamowa/issues)에 남겨주세요.

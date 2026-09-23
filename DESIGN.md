# Design

## Source of truth

- Status: Active
- Last refreshed: 2026-09-23
- Primary product surfaces: 작은 트레이의 할 일·Jira·PR 리뷰와 보조 뽀모도로 펫
- Evidence reviewed: `README.md`, `src/widgets/tray/TrayApp.tsx`, `src/widgets/tray/TrayApp.scss`, `src/widgets/pet/PomodoroPet.tsx`, `src-tauri/tauri.conf.json`
- User decision: 별도 메인 창을 제거한다. 기존 데스크톱 UI 전체를 트레이로 옮기지 않는다. 최대한 심플하게 유지한다.

## Brand

- Personality: 차분하고 정밀하며, 사용자의 기억을 대신하는 신뢰 가능한 업무 도구
- Trust signals: 데이터 출처, 마지막 동기화 시각, 자동화 이유, 승인 대상과 실패 상태를 명확히 표시
- Avoid: 과도한 카드 장식, 장난스러운 생산성 점수, 근거 없는 AI 확신, 모든 요소를 강조색으로 칠하는 화면

## Product goals

- Goals:
  - 사용자가 앱을 열고 지금 할 일과 재개할 지점을 즉시 이해한다.
  - 내 Jira 티켓과 GitHub 리뷰 요청을 작은 목록에서 확인한다.
  - 할 일을 빠르게 추가하고 시작·중단·완료한다.
  - 작은 화면에서 제목·상태·원문 링크가 분명하다.
- Non-goals:
  - Jira, Slack, GitHub를 그대로 복제하는 범용 클라이언트
  - Orca의 코드 에디터·터미널 중심 정보 구조를 Orbit에 복제하는 것
  - 장식적 대시보드나 성과 점수로 사용자를 압박하는 것
- Success signals:
  - 첫 화면에서 10초 안에 다음 행동을 선택할 수 있다.
  - 화면 간 동일 상태와 동작이 같은 컴포넌트 언어로 보인다.
  - stale·failed·approval-required 상태를 사용자가 오해하지 않는다.

## Personas and jobs

- Primary personas: 여러 AI 세션과 협업 도구를 동시에 사용하는 개인 지식 노동자·개발자
- User jobs:
  - 오늘 해야 할 일을 계획하고 하나에 집중한다.
  - 긴급 작업이 들어와도 기존 작업의 진행 지점과 다음 행동을 보존한다.
  - 흩어진 업무 근거를 찾아 Task에 연결한다.
  - 완료한 업무의 결과와 근거를 회고·성과 자료로 다시 사용한다.
- Key contexts of use: 하루 시작 브리핑, 작업 중 전환, 온콜·긴급 요청 유입, 리뷰 대기, 하루 종료 회고

## Information architecture

- Primary navigation: 할 일 / Jira / PR 리뷰 세 개의 작은 탭.
- Core routes/screens: 한 줄 빠른 추가 → NOW(집중·완료·일시정지) → TODO(시작·완료) → DONE(완료 취소).
- 보조 행동: 펫 표시/숨기기, 패널 닫기. 종료는 트레이 우클릭 메뉴.
- 기존 큰 화면을 이식하지 않는다. Jira는 내 담당 티켓 목록, GitHub는 내 리뷰 요청 목록만 표시하고 상세는 원문 링크로 연다. 연결 설정은 Jira URL·이메일·토큰뿐이다. AI 세션·Google Calendar·채팅·그래프 화면과 네이티브 명령은 제거한다.
- Content hierarchy: 지금 집중 중인 일 → 대기 중인 일 → 완료한 일. Todo는 별도 뱃지 없이 구역으로 구분한다. Jira·PR 상태 뱃지는 티켓 번호 바로 옆에 작게 배치한다.

## Design principles

1. 한 번의 클릭으로 할 일을 적고 시작한다.
2. 기존 360×520 크기와 간결한 NOW/TODO/DONE 구조를 유지한다.
3. 창을 숨겨도 입력 중인 내용과 알림 확인은 유지한다.
4. 전체화면 앱 위에서도 같은 트레이를 연다. 펫에서 별도 메인 창을 만들지 않는다. 기존 채팅/퀵패널 전역 단축키는 제거한다.

## Visual language

- Color: 중립적인 회색 canvas/surface/sidebar를 기본으로 하고 보라색은 선택·AI·주요 행동에만 사용한다. 성공·경고·오류는 의미색으로 분리한다.
- Typography: Inter와 macOS system sans를 사용한다. 화면 제목 18–20px, 섹션 제목 13–14px, 본문 12–13px, 보조 정보 10–11px를 기본으로 한다.
- Spacing/layout rhythm: 4px 기준 단위, 일반 간격 8/12/16/24px. 트레이 헤더의 한 줄 입력, 스크롤 목록, 작은 하단 버튼 구조다.
- Shape/radius/elevation: 기본 radius 4–6px, overlay 8px 이하. 경계선으로 계층을 만들고 그림자는 floating surface에만 제한한다.
- Motion: 120–200ms의 짧은 상태 전환. 레이아웃 이동은 의미가 있을 때만 사용하고 `prefers-reduced-motion`을 존중한다.
- Imagery/iconography: Lucide의 1.5–1.75px stroke를 사용한다. 아이콘 단독 버튼에는 accessible name과 tooltip을 제공한다.

## Components

- Existing components to reuse: `TrayApp`, `PetMascot`, `PomodoroPet`
- New/changed components: 메인 창 진입 경로 제거, Jira/PR 소형 목록, 종료 메뉴
- Variants and states: idle, focus, todo, done, loading, error
- Token/component ownership: 트레이 스타일은 `src/widgets/tray/TrayApp.scss`, 펫은 `src/widgets/pet`

## Accessibility

- Target standard: WCAG 2.2 AA를 목표로 한다.
- Keyboard/focus behavior: 모든 주요 흐름은 키보드로 접근 가능하며 `:focus-visible`을 제거하지 않는다. 패널·dialog가 열리면 초점 이동과 복귀를 보장한다.
- Dismiss behavior: Esc, 닫기 버튼, 외부 클릭으로 트레이를 숨긴다.
- Contrast/readability: 본문과 상태 텍스트는 AA 대비를 유지하고 색상만으로 상태를 구분하지 않는다.
- Screen-reader semantics: icon-only action, badge, 진행 상태와 비동기 오류에 적절한 label·role·live region을 제공한다.
- Reduced motion and sensory considerations: reduced-motion에서 물리 애니메이션과 반복 pulse를 제거한다.

## Responsive behavior

- Supported breakpoints/devices: macOS 메뉴바의 고정 360×520 패널.
- Layout adaptations: 긴 목록은 패널 내부 스크롤, 긴 제목은 말줄임과 tooltip.
- Touch/hover differences: pointer·keyboard 중심. 주요 동작에 accessible name을 제공한다.

## Interaction states

- Loading: 화면 전체 spinner 대신 레이아웃을 유지하는 skeleton과 source별 진행 상태를 사용한다.
- Empty: 비어 있는 이유와 첫 행동을 함께 보여준다.
- Error: 사용자 데이터는 유지하고 실패한 source, 마지막 성공 시각과 재시도 행동을 표시한다.
- Success: 짧고 비차단적인 확인을 사용하며 저장된 결과를 화면에서 즉시 확인할 수 있게 한다.
- Disabled: 비활성 이유를 인접 설명이나 tooltip으로 제공한다.
- Offline/slow network: 로컬 데이터와 캐시를 계속 보여주되 stale 표시를 명확히 한다.

## Content voice

- Tone: 짧고 직접적이며 판단 근거를 숨기지 않는 한국어
- Terminology: `Task`, `집중`, `체크포인트`, `다음 행동`, `연결`, `근거`, `동기화`, `승인`을 일관되게 사용한다.
- Microcopy rules:
  - “완료”와 “저장”처럼 결과가 다른 동사를 섞지 않는다.
  - AI가 실행하지 않은 일을 완료형으로 표현하지 않는다.
  - 오류에는 대상, 영향과 다음 행동을 포함한다.

## Implementation constraints

- Framework/styling system: Tauri 2, React 19, TypeScript, Sass/SCSS, Lucide React
- Design-token constraints: 기존 Sass 상수는 semantic CSS variable로 점진 전환한다. 새 화면에서 raw hex와 임의 radius를 추가하지 않는다.
- Performance constraints: 긴 목록은 virtualization을 유지하고, panel 전환이 전체 페이지 재렌더를 유발하지 않게 한다.
- Compatibility constraints: 현재 macOS 전용이며 light, dark, system theme를 지원한다.
- Window chrome constraints: tray와 pet만 생성한다. 전체화면 위 표시 설정은 유지한다.
- Test/screenshot expectations: 창 구성·단축키·펫 경로를 검증하고 `bun run verify:fsd`, `bun run build`, 관련 테스트와 Rust 검사를 통과한다.

## Daily records and Jira onboarding

- 하단의 오늘 집중 시간·완료 개수를 누르면 같은 패널 안에서 하루 기록을 연다. 날짜 입력과 앞뒤 이동으로 과거 기록을 본다.
- 집중 시간은 트레이와 펫이 SQLite의 같은 타이머를 사용한다. 작업 시작·교체는 타이머를 시작하고, 일시정지·휴식·완료는 집계를 멈춘다.
- 네이티브 heartbeat가 확인한 구간만 저장한다. macOS의 awake/wall clock 차이로 짧은 잠자기도 감지해 멈춘다. 앱 재시작은 일시정지 상태로 복원하고, 긴 heartbeat 단절과 시계 역행도 일시정지한다. 자정 경계는 로컬 날짜 기준으로 나눈다.
- 기록 이전 집중 시간은 추정하지 않는다. 완료 기록은 기존 완료 시각을 이관하고, 완료 취소는 집계에서 제외한다. 삭제·이름 변경 후에도 기록 당시 제목을 유지한다.
- Jira 설정이 없으면 티켓을 조회하기 전에 URL·이메일·토큰 입력 폼을 연다. 저장 후 조회가 성공해야 폼을 닫는다.
- Jira 기본 목록은 미완료. `완료된 티켓 포함` 체크 상태를 저장하고, 검색·필터 결과에 맞는 개수를 표시한다.

## Open questions

- [ ] 주간 통계와 목표 시간은 이번 간단한 하루 기록 범위에 포함하지 않는다.

## Pet collection

- 펫 선택은 기존 360×520 트레이 안에 연다. 펫 창을 키우거나 메인 창을 되살리지 않는다. 트레이 하단과 펫 툴바에서 접근한다.
- 공식 소개와 애니메이션 캐스트를 기준으로 주역 8종·갑옷 3종·파자마 4종·그 아이·오데, 총 17종을 제공한다. 이름 검색과 분류 필터, 큰 미리보기에서 대기·집중·휴식·완료 동작을 확인한다. 선택과 적용을 구분하고 적용 완료를 표시한다.
- Rive CLI로 재현 가능한 RML과 실제 .riv를 포함한다. 11종은 공식 소개 이미지 atlas의 mesh, 6종은 편집 가능한 별도 벡터 드로잉이다. 에셋 출처와 제작 범위는 assets/pets/README.md에 기록한다.
- 런타임과 WASM은 앱에 포함해 오프라인에서 작동한다. 선택은 SQLite에 저장하고 트레이·펫에 동기화한다. 변경은 타이머나 작업 기록을 초기화하지 않는다.
- 선택 목록은 정적 썸네일, 미리보기와 실제 펫만 애니메이션을 재생한다. 창이 숨겨지거나 동작 줄이기 설정이면 움직임을 멈추며 정적 대체 그림을 제공한다.
- 외곽 그림자는 추가하지 않는다. 펫 변경은 캐릭터만 교체하며, 작업 상태와 타이머 조작은 기존 흐름을 유지한다.

### Pet acting revision

- 품질 피드백: 동일한 반복 흔들림과 전신 squash/stretch는 제거한다. 얼굴을 찌그러뜨려 눈 깜빡임을 흉내내지 않는다.
- 원화 눈을 별도 부위로 분리하고, 몸통·머리·어깨·귀·꼬리·발을 실제 Rive 스켈레톤으로 리깅한다. 캐릭터마다 준비–행동–마무리와 긴 정지 구간을 따로 설계한다.
- 선택 직후에는 짧은 인사 동작을 미리 보인다. 인사·대기·집중·휴식·완료를 반복 재생해 확인할 수 있다. 실제 펫은 원래 창 크기 안에서 캐릭터를 76px로 보여 작은 동작도 읽히게 한다.

### Connected artwork constraint

- 팔이 몸통과 함께 늘어나는 품질 문제를 확인했다. 원화 atlas에서는 팔·머리·발을 독립 관절처럼 움직이지 않는다. 실제로 분리된 그림이 없으면 몸통을 고정하고 눈·시선과 제한적인 귀·꼬리 반응만 사용한다.
- 시작 인사는 유지하지만 atlas 캐릭터의 팔 흔들기는 제거한다. 별도 벡터로 그린 부위만 독립 동작을 허용한다.

## Rakko click action

- 승인된 랏코 원화와 기본 자세를 유지한다. 평소 앞모습은 교체하지 않는다. 회전에 필요한 나머지 방향만 별도 그림으로 보완한다.
- 랏코 아바타 클릭은 준비 → 점프 → 세로축을 중심으로 약 0.67초 동안 빠르게 5회전 → 착지 파동/별빛 → 원래 상태 순서로 1.5초간 재생한다.
- 클릭 연출은 타이머와 독립적이다. 타이머 재생/일시정지는 툴바 버튼으로 한다. 다른 캐릭터의 클릭 동작은 유지한다.
- 연타는 현재 동작을 끝낸 뒤 최대 한 번만 예약 재생한다. 캐릭터 변경·창 종료 때 예약을 취소한다. 동작 줄이기 설정에서는 정적 그림을 유지한다.

- 랏코 회전은 화면 평면에서 구르는 동작이 아니다. 기존 앞면과 새 사선·옆·뒤 그림을 8방향 순서로 전환한다. 수평 압축·반전 없이 각 그림의 비율을 유지한다. 회전 중에도 머리가 위를 향한다.

- 랏코 뒷면에서 멈추는 구간은 두지 않는다. 회전은 40프레임에 5바퀴, 준비·착지를 포함한 전체 동작은 90프레임(1.5초)이다.

- 회전 이펙트: 금빛·하늘색·흰색 빛줄기 3개와 주변 반짝임 8개를 시간차로 표시하고, 착지 시 충격파를 두 번 확산한다. 얼굴은 읽을 수 있게 유지하고 동작 종료 시 모두 사라진다.

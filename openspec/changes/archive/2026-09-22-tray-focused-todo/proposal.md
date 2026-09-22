# Proposal: Tray-Focused Micro To-Do Service

## Why

기존 Orbit의 대형 데스크탑 대시보드(1280x820)와 복잡한 Jira/PR 연동은 일상적인 개발 작업 흐름에서 열어보기 부담스럽고 실제 개인의 '오늘 할 일'과 겉도는 문제가 있었습니다.
이를 해결하기 위해 데스크탑 창 중심의 구조를 걷어내고, macOS 메뉴바(트레이)에서 언제든 1초 만에 열고 닫히는 **경량 상주형 마이크로 투두 & 몰입 서비스**로 전환합니다.

## What Changes

- **BREAKING**: 기본 대형 메인 윈도우(`main`)를 앱의 중심에서 제거/비활성화하고, 트레이 팝업 윈도우(`tray`)를 앱의 단독 메인 인터페이스로 전환합니다.
- **트레이 상단 퀵 추가 (Quick-Add)**: 트레이 창 상단에 인라인 인풋 필드를 배치하여 텍스트 입력 후 `Enter` 시 즉시 목록 맨 위에 할 일을 등록합니다.
- **우선순위(Priority) 완전 제거**: High/Medium/Low 등급 체계 및 드롭다운/라벨을 UI에서 완전히 배제하고, 목록의 위아래 순서로만 관리합니다.
- **NOW vs TODO 2단 몰입 구조**:
  - `NOW`: 현재 몰입 중인 단 1개의 작업 (경과 시간, [완료], [일시정지] 제어).
  - `TODO`: 대기 중인 할 일 목록 (새 할 일은 맨 위에 추가, [시작], [삭제] 제어).
- **완료 피드백 (Done Feedback)**: 체크박스 완료 시 즉시 삭제되지 않고 취소선(`~~`)이 그어진 채 하단 완료 영역에 작고 연하게 남아 하루 달성감을 제공합니다.
- **보조 편의 기능**: 트레이 하단에 뽀모도로 펫 토글 및 앱 종료 버튼 제공.

## Capabilities

### New Capabilities
- `tray-micro-todo`: macOS 시스템 트레이 팝업 내에서 인라인 할 일 퀵 추가, 우선순위 없는 선형 목록 관리, NOW(몰입) 슬롯 전환 및 취소선 완료 피드백을 제공하는 경량 투두 인터페이스.

### Modified Capabilities
<!-- None: 기존 durable spec 없음 -->

## Impact

- `src-tauri/tauri.conf.json`: 트레이 전용 서비스에 맞게 윈도우 기본 표시 설정 및 창 크기 조정.
- `src/widgets/tray/TrayApp.tsx` & `TrayApp.scss`: 메인 창 이동 버튼 위주의 뷰를 인라인 생성·완료·삭제가 자체 완결되는 마이크로 투두 뷰로 전면 개편.
- `src/entities/work-context/api/work-item-repository.ts`: 새 작업을 목록 맨 위(Top)에 등록할 수 있도록 위치(position) 산출 로직 보완.

# Design: Tray-Focused Micro To-Do Architecture

## Context

Orbit은 Tauri v2 기반 애플리케이션으로, 로컬 SQLite(`tauri-plugin-sql`)에 `work_items` 및 연속성(Continuity) 데이터를 보관합니다.
기존 아키텍처는 `main`(1280x820 대시보드), `tray`(360x520 팝오버), `pet`(플로팅 펫) 윈도우로 구성되어 있으며, 트레이 창은 메인 대시보드로 이동시키는 보조 뷰로 사용되었습니다. (배경 및 동기는 `proposal.md` 참고)

## Goals / Non-Goals

**Goals:**
- 트레이 윈도우(`tray`)를 외부 의존 없이 단독으로 할 일 등록, 몰입 실행, 완료 처리가 완결되는 UI로 구축.
- 새 할 일 생성 시 목록의 최상단(Top)에 즉시 배치(LIFO / Prepend).
- 완료된 항목에 취소선(`line-through`)을 적용하고, 하단 DONE 섹션에 컴팩트하게 노출.
- 메인 대시보드 윈도우 의존성을 제거하고 메뉴바 상주형 경험 제공.

**Non-Goals:**
- 기존 SQLite 스키마 파괴적 변경: 기존 `priority`, `goal`, `category_id` 컬럼은 호환성을 위해 유지하되, 트레이에서는 `null`로 투명하게 처리.
- MCP 도구 또는 플로팅 펫(`pet`) 로직의 삭제: 기존 자산은 보존하고 트레이에서 옵션으로 제어.

## Decisions

### 1. 신규 할 일의 상단 삽입(Prepend) 위치 계산
- **결정**: `createWorkItem` 실행 시 `MIN(position) - 1` (기존 항목이 없으면 0)을 새로운 작업의 `position`으로 부여.
- **근거**: 전체 행을 `position + 1`로 일괄 업데이트하는 비용 없이, `ORDER BY position ASC` 정렬을 통해 항상 맨 위에 노출되도록 보장.
- **대안 검토**: `created_at DESC` 정렬로 전면 교체하는 방안을 고려했으나, 추후 사용자가 수동으로 순서를 드래그/정렬할 수 있는 확장성을 위해 `position` 기반을 유지.

### 2. 트레이 내부 인터랙션 및 연속성(Continuity) 연동
- **결정**: 기존 `switchFocusedWorkItem`과 `transitionWorkItem`을 그대로 활용하여 `NOW`(status: 'focus')와 `TODO`(status: 'todo') 및 `DONE`(status: 'done') 간의 상태 전이를 완벽하게 보장.
- **근거**: 백엔드 연속성 프로토콜(작업 히스토리, 리비전, 포커스 슬롯)과의 데이터 정합성을 그대로 유지하면서도, UI는 가볍게 소비 가능.

### 3. 메인 윈도우 처리 및 트레이 단독 기동
- **결정**: `src-tauri/tauri.conf.json`에서 `main` 윈도우의 `visible`을 `false`로 변경하거나 시작 시 표시하지 않도록 하고, 트레이 아이콘 클릭 시에만 `tray` 팝업을 표시.
- **근거**: Dock을 차지하지 않고 시스템 트레이에서만 가볍게 열리도록 보장.

## Risks / Trade-offs

- **[트레이 창의 물리적 크기 제한 (360x520)]** → 목록이 길어질 경우 스크롤이 매끄럽도록 영역을 나누고, `DONE` 섹션은 컴팩트한 한 줄 아이템들로 구성하여 스크롤 낭비를 방지.
- **[오입력 또는 오클릭으로 인한 완료]** → 체크박스 클릭 시 즉시 영구 삭제되지 않고 취소선 처리된 채 DONE 섹션에 남으므로, 잘못 체크했더라도 즉시 인지 가능.

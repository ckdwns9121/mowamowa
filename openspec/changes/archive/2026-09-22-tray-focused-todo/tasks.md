# Tasks

## 1. Data Layer & Repository Preparation

- [x] 1.1 `src/entities/work-context/api/work-item-repository.ts`에서 새 작업 추가 시 최상단 삽입(`MIN(position) - 1`) 로직을 구현하고 `bun test`로 기존 테스트 통과 확인
- [x] 1.2 트레이에서 필요한 작업 완료(`transitionWorkItem`), 일시정지, 삭제(`deleteWorkItem`) 호출 흐름 확인

## 2. Tray UI Overhaul

- [x] 2.1 `src/widgets/tray/TrayApp.tsx`에 상단 퀵 인풋(Quick-Add) 구현: Enter 키 입력 시 새 할 일이 대기 목록 최상단에 즉시 추가되고 인풋 초기화 검증
- [x] 2.2 `src/widgets/tray/TrayApp.tsx`의 NOW 몰입 섹션 구현: 현재 집중 중인 1개 작업 노출, 타이머, [완료] 및 [일시정지] 액션 연동 검증
- [x] 2.3 `src/widgets/tray/TrayApp.tsx`의 TODO 대기 목록 및 DONE 완료 섹션 구현: TODO 목록에서 [시작]/[삭제], 완료 시 취소선이 그어지며 하단 DONE 영역으로 이동하는 렌더링 검증
- [x] 2.4 `src/widgets/tray/TrayApp.scss` 스타일링: 360x520 창에 최적화된 마이크로 레이아웃, 인풋 스타일, 취소선(`text-decoration: line-through`) 및 컴팩트 스타일 적용
- [x] 2.5 `src/widgets/tray/TrayApp.tsx`에서 DONE 완료 항목을 다시 체크 해제 시 TODO 대기 목록으로 복원하고 NOW 슬롯에 영향이 없음을 검증

## 3. Window Configuration & Verification

- [x] 3.1 `src-tauri/tauri.conf.json`에서 메인 윈도우(`main`) 자동 노출 방지(`visible: false`) 및 트레이 팝업 중심 동작 구성 확인
- [x] 3.2 전체 프론트엔드 빌드 및 타입 검사(`bun run build`)를 실행하여 회귀 오류가 없음을 검증

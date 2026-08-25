# Task 즉시 완료 정책

- 상태: Accepted
- 관련 결정: [ADR-008](../ADR/ADR-008-태스크-완료-마찰-제거.md)

## 정책

1. 사용자가 완료를 선택하면 별도 입력 없이 Task를 즉시 `done`으로 전이한다.
2. Task 완료 시각 기록과 focus 해제는 같은 데이터베이스 전이에서 처리한다.
3. 완료 과정에서 결과·결정·위험·회고 또는 연결 evidence 스냅샷을 새로 만들지 않는다.
4. 과거 버전에서 저장한 completion episode는 삭제하지 않고 기존 검색과 감사 용도로 보존한다.
5. 완료 Task를 재개하면 `completed_at`을 해제하며 Task의 기존 연결은 유지한다.

## 근거

- `src/entities/work-context/api/work-continuity-repository.ts`
- `src-tauri/migrations/0034_allow_direct_task_completion.sql`

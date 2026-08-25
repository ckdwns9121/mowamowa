# Feature Specs

사용자 관점에서 기능이 어떻게 동작해야 하는지를 관리한다. 구현 파일이나 SQL 상세보다 화면 흐름, 상태, 입력·출력, 오류와 수용기준을 설명한다.

## 작성 기준

- 새 문서는 [Spec template](../templates/spec-template.md)을 복사해 시작한다.
- PRD의 목표와 수용기준을 구체적인 동작 계약으로 변환한다.
- 정상 흐름뿐 아니라 빈 상태, 오류, 권한과 충돌 상황을 포함한다.
- 구현 선택은 [design-documents/](../design-documents/README.md)에 기록한다.
- 장기적인 시스템 결정은 [ADR](../ADR/README.md)과 연결한다.

## 파일 이름

- `태스크-즉시-완료.md`
- `집중-모드-전환.md`
- `구글-캘린더-연동.md`

`spec-`, 공백, 밑줄이나 대괄호를 붙이지 않는다. 폴더가 문서 유형을 이미 나타내므로 기능명만 한글 하이픈 형식으로 작성한다.

기존 [업무 연속성 Spec](../prd/spec-orbit-work-continuity.md)은 링크 호환성을 위해 기존 위치에 유지한다.

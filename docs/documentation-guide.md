# Orbit 문서 운영 가이드

- 상태: Accepted
- 소유자: Orbit maintainer
- 최종 갱신: 2026-08-15

## 목적

Orbit의 문서는 코드 설명을 반복하지 않고 **무엇을 왜 만들며, 어떤 결정을 했고, 어떻게 구현·검증하는지**를 추적 가능하게 만든다. 모든 문서는 하나의 질문에 답해야 하며, 같은 사실을 여러 문서에서 서로 다르게 소유하지 않는다.

## 정보 구조

```text
docs/
├── README.md                 # 전체 문서 지도
├── documentation-guide.md   # 작성·상태·검토 규칙
├── product/                  # 문제, 원칙, 범위와 제품 방향
├── prd/                      # 제품 요구사항
├── specs/                    # 사용자 흐름, 상태와 기능 계약
├── design-documents/         # 기능별 구현, migration과 rollout 설계
├── architecture/             # 시스템 경계와 장기 구조
├── technical/                # 기술 스택과 운영 절차
├── ADR/                      # 확정된 의사결정 기록
├── policies/                 # 항상 지켜야 하는 불변 규칙
├── evidence/                 # 수용기준과 검증 증거
├── templates/                # 새 문서의 시작점
└── assets/                   # 공개 가능한 이미지와 다이어그램 자산
```

기존 루트 문서는 링크 호환성을 위해 당장 이동하지 않는다. 새 문서는 위 구조를 따르고, 기존 문서는 내용 변경이 발생할 때 적절한 디렉터리로 이동하거나 인덱스에서 legacy로 표시한다.

## 문서 유형과 소유권

| 유형 | 답하는 질문 | 변경 조건 | 템플릿 |
| --- | --- | --- | --- |
| Product brief | 누구의 어떤 문제를 푸는가? | 문제·대상·제품 원칙 변경 | [Product brief](templates/product-brief-template.md) |
| PRD | 무엇을 왜 만들고 성공을 어떻게 판단하는가? | 범위·사용자 가치·AC 변경 | [PRD](templates/prd-template.md) |
| Feature Spec | 사용 흐름과 기능 계약은 무엇인가? | 상태·API·화면 동작 변경 | [Spec](templates/spec-template.md) |
| RFC | 어떤 대안을 검토하고 있는가? | 합의 전 제안 | [RFC](templates/rfc-template.md) |
| Architecture | 시스템 경계와 품질 속성은 무엇인가? | 경계·데이터 흐름·운영 모델 변경 | [Architecture](templates/architecture-template.md) |
| Technical Design | 한 변경을 구체적으로 어떻게 구현하는가? | 중요한 구현·migration·rollout 변경 | [Technical Design](templates/technical-design-template.md) |
| ADR | 무엇을 결정했고 왜 선택했는가? | 결정 확정 또는 기존 결정 대체 | [ADR](templates/adr-template.md) |
| Policy | 구현과 무관하게 무엇을 항상 지키는가? | 제품·데이터 불변 규칙 변경 | [Policy](templates/policy-template.md) |
| Evidence | 요구사항이 실제로 충족됐는가? | 검증 실행 또는 결과 변경 | [Evidence](templates/evidence-template.md) |
| Meeting note | 무엇을 논의하고 누가 무엇을 하는가? | 회의·결정 세션 종료 | [Meeting note](templates/meeting-notes-template.md) |

## 문서 상태

- `Draft`: 논의 중이며 구현 기준이 아니다.
- `Proposed`: 리뷰 가능한 구체안이다.
- `Accepted`: 현재 제품·구현의 기준이다.
- `Implemented`: Accepted 요구가 코드와 검증에 반영됐다.
- `Superseded`: 새 문서로 대체됐다. 대체 문서를 반드시 연결한다.
- `Deprecated`: 더 이상 적용하지 않지만 대체 문서가 없을 수 있다.

## 파일 이름

새 문서는 의미를 바로 알 수 있는 **한글 단어를 하이픈으로 연결한 이름**을 사용한다.

- 일반 문서: `태스크-상태-전이.md`
- PRD: `개인-업무-연속성.md`
- Spec: `태스크-즉시-완료.md`
- Design Document: `태스크-즉시-완료-설계.md`
- Architecture: `컨텍스트-그래프-아키텍처.md`
- ADR: `ADR-009-태스크-완료-정책.md`
- Evidence: `태스크-즉시-완료-검증-2026-08-25.md`

작성 규칙:

1. 공백, 대괄호, 밑줄과 영문식 `kebab-case` 제목을 사용하지 않는다.
2. 조사보다 핵심 명사를 사용하고 단어 사이는 `-`로 구분한다.
3. `AI`, `API`, `OAuth`, `SQLite`, `FSD`, `MCP`, `ADR`처럼 통용되는 기술 식별자는 영문을 허용한다.
4. `README.md`는 폴더 인덱스이므로 예외로 유지한다.
5. ADR 번호는 기존 문서의 다음 번호를 사용하며 재사용하지 않는다.
6. 기존 영문·공백 파일명은 링크 호환성을 위해 즉시 일괄 변경하지 않고, 문서를 크게 수정하거나 이동할 때 모든 참조와 함께 새 규칙으로 바꾼다.

## 최소 메타데이터

모든 신규 문서는 제목 바로 아래에 다음 항목을 둔다.

```markdown
- 상태: Draft
- 소유자: 이름 또는 역할
- 작성일: YYYY-MM-DD
- 최종 갱신: YYYY-MM-DD
- 관련 문서: 링크
```

문서 종류에 따라 결정자, 대상 릴리스, 대체 문서, 관련 PR·Issue를 추가한다.

## 변경 흐름

```text
문제·가치 변경        → Product brief 또는 PRD
기능 동작 변경        → PRD AC + `specs/` Feature Spec
대안 합의 필요        → RFC
시스템 경계 변경      → Architecture + RFC
구현 방식 확정        → `design-documents/` Design Document + ADR
불변 규칙 변경        → Policy + ADR
구현 완료             → Evidence + 관련 문서 상태 갱신
UI 시스템 변경        → DESIGN.md + 필요 시 Technical Design
```

## 작성 규칙

1. 문서 하나가 소유하는 질문을 첫 문단에 명시한다.
2. 확인하지 않은 사실은 `TBD`나 `확인 필요`로 남긴다.
3. 요구사항은 검증 가능한 수용기준과 연결한다.
4. 결정에는 검토한 대안과 결과를 기록한다.
5. 코드 경로는 현재 파일과 일치할 때만 근거로 사용한다.
6. 실행하지 않은 테스트를 통과했다고 기록하지 않는다.
7. ADR 원문은 결론을 뒤집어 수정하지 않고 새 ADR로 대체한다.
8. secret, 실제 고객명, 비공개 URL과 개인 업무 데이터는 문서·이미지에 넣지 않는다.

## 리뷰 체크리스트

- [ ] 문서 유형과 저장 위치가 질문에 맞는다.
- [ ] 상태·소유자·날짜·관련 문서가 있다.
- [ ] 목표와 비목표가 구분된다.
- [ ] 결정 또는 요구사항에 근거가 있다.
- [ ] 수용기준과 검증 방법이 구체적이다.
- [ ] 보안·개인정보·migration·접근성 영향이 검토됐다.
- [ ] 관련 인덱스와 링크가 갱신됐다.

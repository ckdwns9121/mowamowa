# Design Documents

승인된 PRD와 Spec을 실제 코드, 데이터와 배포 변경으로 구현하는 방법을 관리한다. 한 기능 또는 변경 단위의 구현 설계이며 시스템 전체의 장기 구조는 [architecture/](../architecture/README.md)가 소유한다.

## 포함할 내용

1. 배경과 연결된 PRD·Spec
2. 현재 구조와 변경 구조
3. 데이터 모델과 상태 전이
4. 모듈·API·Tauri command 경계
5. migration, 호환성과 rollback
6. 테스트와 검증 방법
7. 보안, 성능과 운영 영향

## 파일 이름

- `태스크-즉시-완료-설계.md`
- `AI-에이전트-도구호출-설계.md`
- `구글-OAuth-연동-설계.md`

`td-`, 공백, 밑줄이나 대괄호를 사용하지 않는다. 새 설계는 [Technical Design template](../templates/technical-design-template.md)을 사용하되 한글 하이픈 파일명으로 저장한다.

# 🦦 먼작귀 랏코(ラッコ) 선생 공식 원작 기반 Rive 리깅용 벡터 레이어

먼작귀(치이카와) 원작 공식 일러스트의 선화와 비율을 100% 그대로 보존하여 부위별로 정밀 분리한 **공식 정품 기반 순수 벡터 SVG 레이어 세트**입니다.

모든 레이어는 표준 **393x405 (`viewBox="0 0 393 405"`) 좌표계**를 공유하므로, Rive 또는 Figma에 올렸을 때 어떠한 위치 어긋남 없이 원작과 1:1로 일치합니다.

---

## 📁 공식 레이어 파일 구성

| 파일명 | 레이어 ID | 설명 및 Rive 리깅 용도 |
|---|---|---|
| **`00_rakko_rive_rigging_master.svg`** | `Rakko_Root` | **(강력 추천)** 원작 랏코의 모든 파츠가 계층 구조로 완벽히 정렬된 마스터 파일. Rive 캔버스에 드래그 앤 드롭 즉시 리깅 가능 |
| `01_ears.svg` | `Ears` | 원작 고유 위치의 칠흑 같은 검은 귀 |
| `02_head_body_base.svg` | `Body_Head_Base` | 보송보송한 버터 크림색 털과 외곽 털 스파이크가 살아있는 몸체 베이스 |
| `03a_eye_left.svg` | `Eye_Left` | 왼쪽 눈동자 (Scale Y를 조절하여 눈 깜빡임 구현) |
| `03b_eye_right.svg` | `Eye_Right` | 오른쪽 눈동자 (Scale Y를 조절하여 눈 깜빡임 구현) |
| `04_face_details.svg` | `Face_Details_Scar_Mouth` | **오른쪽 눈 위 선명한 십자가(＋) 흉터**, 미간 주름, 코, 'w' 입, 핑크 볼터치 |
| `05_cape.svg` | `Cape_Muffler` | 랏코의 트레이드마크인 순백색 목 머플러/망토 |
| `06_paws.svg` | `Paws` | 가슴 앞에 다소곳이 모으고 있는 검은 앞발 |
| `07_sword.svg` | `Sword` | 어깨 뒤로 살짝 삐져나온 1위 랭커의 대검 자루 |
| `08_feet.svg` | `Feet` | 하단의 앙증맞은 검은 발 |

---

## 🛠️ Rive(rive.app) 빠른 사용법

1. [rive.app](https://rive.app)에서 새 아트보드 생성 (`393x405`).
2. `00_rakko_rive_rigging_master.svg`를 드래그 앤 드롭.
3. 좌측 계층 트리에서 `Eye_Left`, `Eye_Right`, `Ears`, `Paws` 등에 본(Bone)을 달고 애니메이션 작업.

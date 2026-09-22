# 🦦 먼작귀 랏코(ラッコ) 선생 Rive 리깅용 벡터 에셋 가이드

Rive([rive.app](https://rive.app)) 또는 Figma에서 캐릭터 관절(Bone)을 리깅하고 애니메이션을 제작할 수 있도록 **완전 분리된 순수 벡터 SVG 레이어 세트**입니다.

모든 에셋은 표준 **400x400 (`viewBox="0 0 400 400"`) 아트보드**를 공유하므로, 에디터에 드래그 앤 드롭했을 때 별도의 위치 정렬 없이 100% 원본 좌표에 자동 정렬됩니다.

---

## 📁 파일 구성

| 파일명 | 레이어 ID | 설명 및 Rive 리깅 팁 |
|---|---|---|
| `00_rakko_rive_rigging_master.svg` | `Rakko_Root` | **(추천)** 모든 레이어가 계층 구조로 묶인 마스터 파일. Rive에 이것 하나만 던지면 즉시 리깅 가능 |
| `01_ears.svg` | `Ears` (`Ear_Left`, `Ear_Right`) | 검은 귀 좌/우. 본(Bone)을 심어 쫑긋거리는 텐션 애니메이션 적용 |
| `02_head_base.svg` | `Head_Base` | 보송보송한 크림색 얼굴 윤곽 및 양볼 털 돌기 |
| `03_eyes.svg` | `Eyes` (`Eye_Left`, `Eye_Right`) | 좌/우 눈동자. **Y축 스케일(Scale Y)을 0%로 줄여 깜빡임(Blink)** 구현 |
| `04_face_details.svg` | `Face_Details` | 결연한 눈썹, 미간 주름, **오른쪽 눈 십자 흉터(＋)**, 코, `w` 입, 핑크 볼터치 |
| `05_cape.svg` | `Cape` | 순백색 히어로 망토/머플러. 천(Cloth) 웨이브 모션 가능 |
| `06_body_feet_tail.svg` | `Body_Feet_Tail` | 몸통, 앙증맞은 검은 꼬리, 검은 뒷발 |
| `07_arms_paws.svg` | `Arms_Paws` | 대검이나 파르페를 쥘 수 있는 검은 앞발 |
| `08_greatsword.svg` | `Greatsword` | 토벌 랭커 1위 랏코의 대검 (칼날, 가드, 손잡이, 폼멜) |
| `09_strawberry_parfait.svg` | `Strawberry_Parfait` | 휴식 모드 시 들고 먹는 달콤한 딸기 파르페 디저트 |

---

## 🛠️ Rive 에디터 작업 단계 (How-to)

1. **에셋 불러오기**:
   - [rive.app](https://rive.app)에서 새 파일 생성 (`400x400` 아트보드).
   - `00_rakko_rive_rigging_master.svg` 파일을 캔버스로 드래그 앤 드롭합니다.
   - 레이어 패널에 `Head_Group`, `Cape`, `Body`, `Greatsword` 등이 그룹별로 자동 생성됩니다.

2. **본(Bone) 리깅 추천 구조**:
   ```text
   Root_Bone (골반/중심)
     ├── Spine_Bone (가슴/망토)
     │     ├── Arm_Left_Bone ── Hand_Left_Bone (앞발/무기)
     │     ├── Arm_Right_Bone ── Hand_Right_Bone (앞발/디저트)
     │     └── Head_Bone (머리 전체)
     │           ├── Ear_Left_Bone (왼쪽 귀)
     │           ├── Ear_Right_Bone (오른쪽 귀)
     │           └── Eyes_IK / Constraints (마우스 시선 추적)
     ├── Leg_Left_Bone (왼발)
     └── Leg_Right_Bone (오른발)
   ```

3. **State Machine 설정 가이드**:
   - **Inputs**:
     - `state`: Number (0 = Idle 대기, 1 = Focus 집중, 2 = Break 휴식, 3 = Victory 완료)
     - `isRunning`: Boolean (타이머 카운트다운 진행 여부)
     - `onPoke`: Trigger (마우스 클릭 인터랙션)
     - `mouseX`, `mouseY`: Number (커서 추적 시선 회전)
   - **타임라인(Timelines)**:
     - `idle`: 부드러운 숨쉬기, 4초 주기 눈 깜빡임, 귀 쫑긋
     - `focus`: 대검을 치켜들고 결연하게 자세 잡기, 기합 넣기
     - `break`: 딸기 파르페를 양손으로 잡고 냠냠 먹는 행복한 모션

4. **Export 및 Orbit 앱 연동**:
   - Rive 에디터에서 `Export > For Web (.riv)`로 저장.
   - 산출물 `rakko.riv`를 Orbit 프로젝트의 `src/widgets/pet/assets/rakko.riv`에 넣으면 앱에서 즉시 인터랙티브 펫으로 동작하게 연결할 수 있습니다.

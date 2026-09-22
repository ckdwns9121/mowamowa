import React from "react";

export type PetMood = "focus" | "break" | "idle" | "done";

interface PetMascotProps {
  mood: PetMood;
  isRunning: boolean;
  size?: number;
}

/**
 * 먼작귀(ち이카와) 공식 설정 기반 랭킹 1위 '랏코(ラッコ)' 선생 마스코트
 * - 연노랑색(버터색) 보송보송한 몸과 얼굴 (#FFF3A1)
 * - 양쪽 귀, 팔, 발, 꼬리가 모두 뚜렷한 [검은색] (#18181B)
 * - 랏코 시그니처: [순백색 망토] (#FFFFFF) 와 등 뒤의 [대검]
 * - [오른쪽 눈 위]의 선명한 십자가(＋) 흉터
 * - 늠름한 미간 주름과 눈썹, 그리고 디저트를 먹을 때 사르르 녹아내리는 갭모에
 */
export const PetMascot: React.FC<PetMascotProps> = ({
  mood,
  isRunning,
  size = 48,
}) => {
  return (
    <div
      className={`pet-mascot-container pet-mood-${mood} ${isRunning ? "is-running" : "is-paused"}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        className="pet-mascot-svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground shadow */}
        <ellipse cx="24" cy="44" rx="14" ry="3.5" className="pet-shadow" />

        <g className="pet-body-group">
          {/* Black Sea Otter Tail (peeking from left) */}
          <ellipse
            cx="13"
            cy="36"
            rx="4"
            ry="6"
            transform="rotate(-25 13 36)"
            fill="#18181B"
            className="rakko-tail"
          />

          {/* Pure White Hero Cape (Back) */}
          <path
            d="M12 25 C9 34 12 42 16 43 C21 44 27 44 32 43 C36 42 39 34 36 25 Z"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="0.8"
            className="rakko-cape"
          />

          {/* Pale Yellow Body (연노랑 해달 바디) */}
          <ellipse cx="24" cy="33" rx="10" ry="9" fill="#FFF3A1" />

          {/* Black Feet (검은색 발) */}
          <ellipse cx="19" cy="41" rx="3.5" ry="2.3" fill="#18181B" />
          <ellipse cx="29" cy="41" rx="3.5" ry="2.3" fill="#18181B" />

          {/* Round Black Otter Ears (검은색 귀) */}
          <circle cx="12.5" cy="16.5" r="3.6" fill="#18181B" />
          <circle cx="35.5" cy="16.5" r="3.6" fill="#18181B" />
          {/* Inner ear soft tint */}
          <circle cx="13" cy="16.5" r="1.8" fill="#27272A" />
          <circle cx="35" cy="16.5" r="1.8" fill="#27272A" />

          {/* Head: Fluffy Pale Yellow (연노랑 동글동글 머리) */}
          <ellipse cx="24" cy="20" rx="12.5" ry="11.5" fill="#FFF3A1" />

          {/* Trademark Cross Scar (＋) above RIGHT eye (viewer's right: x ~ 29) */}
          <path
            d="M29 11 L29 15 M27 13 L31 13"
            stroke="#18181B"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Rosy blush cheeks (사랑스러운 핑크 볼) */}
          <ellipse cx="15.5" cy="23.5" rx="2.4" ry="1.6" fill="#FDA4AF" opacity="0.8" />
          <ellipse cx="32.5" cy="23.5" rx="2.4" ry="1.6" fill="#FDA4AF" opacity="0.8" />

          {/* Black Sea Otter Nose (검은 코) */}
          <ellipse cx="24" cy="21.8" rx="1.6" ry="1.2" fill="#18181B" />

          {/* Whisker freckles (수염 점) */}
          <circle cx="16" cy="23" r="0.5" fill="#18181B" />
          <circle cx="32" cy="23" r="0.5" fill="#18181B" />

          {/* White Cape Front Tie & Knot (하얀 망토 매듭) */}
          <path
            d="M17 26 C19 28 29 28 31 26 C30 30 18 30 17 26 Z"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="0.6"
          />
          <ellipse cx="24" cy="27" rx="1.8" ry="1.4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.6" />

          {mood === "break" ? (
            // === BREAK MODE: Rakko melting with sweets (표정 풀려 순해진 랏코) ===
            <g className="rakko-break-group">
              {/* Soft, relieved gentle eyebrows */}
              <path
                d="M16 18 Q18.5 16.5 21 17.5"
                stroke="#18181B"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M32 18 Q29.5 16.5 27 17.5"
                stroke="#18181B"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Blissful curved smiling eyes (^ ^) */}
              <path
                d="M16.5 21 Q18.5 18 20.5 21"
                stroke="#18181B"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M27.5 21 Q29.5 18 31.5 21"
                stroke="#18181B"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Happy mouth tasting sweet parfait */}
              <path
                d="M21.5 23.8 Q24 27 26.5 23.8 Z"
                fill="#F43F5E"
                stroke="#18181B"
                strokeWidth="1"
              />

              {/* Beloved Strawberry Parfait (랏코의 최애 딸기 파르페) */}
              <g className="rakko-parfait">
                <path
                  d="M21 30.5 L27 30.5 L25.8 38 L22.2 38 Z"
                  fill="rgba(224, 242, 254, 0.9)"
                  stroke="#7DD3FC"
                  strokeWidth="0.8"
                />
                <rect x="22.5" y="34.5" width="3" height="2" rx="0.5" fill="#FB923C" />
                <ellipse cx="24" cy="29.5" rx="3.2" ry="2" fill="#FFFFFF" />
                <polygon points="24,24.5 22.5,28 25.5,28" fill="#EF4444" />
                <circle cx="24" cy="24.5" r="0.7" fill="#22C55E" />

                {/* Black paws holding the parfait cup (검은 앞발) */}
                <ellipse cx="19.5" cy="33" rx="2" ry="1.6" fill="#18181B" />
                <ellipse cx="28.5" cy="33" rx="2" ry="1.6" fill="#18181B" />
              </g>

              {/* Sweet floating heart */}
              <path
                d="M34.5 13 C34.5 11 36.5 10 38 11.5 C39.5 10 41.5 11 41.5 13 C41.5 15.5 38 17.5 38 17.5 C38 17.5 34.5 15.5 34.5 13 Z"
                fill="#F43F5E"
                className="rakko-heart"
              />
            </g>
          ) : mood === "focus" ? (
            // === FOCUS MODE: Ranker #1 Warrior Rakko with Greatsword ===
            <g className={`rakko-focus-group ${isRunning ? "is-training" : ""}`}>
              {/* Intense Resolute Eyebrows (\ /) + Forehead Furrow */}
              <path
                d="M16 16 L20.5 17.8"
                stroke="#18181B"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              <path
                d="M32 16 L27.5 17.8"
                stroke="#18181B"
                strokeWidth="2.1"
                strokeLinecap="round"
              />
              {/* Furrow between brows (미간 주름) */}
              <line x1="24" y1="16.5" x2="24" y2="18" stroke="#18181B" strokeWidth="1.2" strokeLinecap="round" />

              {/* Determined Master Eyes with Glint */}
              <circle cx="18.5" cy="20.8" r="2.4" fill="#18181B" />
              <circle cx="17.7" cy="20.1" r="0.9" fill="#FFFFFF" />
              <circle cx="29.5" cy="20.8" r="2.4" fill="#18181B" />
              <circle cx="28.7" cy="20.1" r="0.9" fill="#FFFFFF" />

              {/* Tightly closed serious mouth */}
              <line
                x1="22.2"
                y1="24.4"
                x2="25.8"
                y2="24.4"
                stroke="#18181B"
                strokeWidth="1.4"
                strokeLinecap="round"
              />

              {/* Rakko's Greatsword (토벌 랭커의 대검) */}
              <g className="rakko-sword">
                {/* Silver Greatsword Blade */}
                <path
                  d="M33 25 L33 10 Q34.5 7.5 36 10 L36 25 Z"
                  fill="#F8FAFC"
                  stroke="#64748B"
                  strokeWidth="0.8"
                  className="sword-blade"
                />
                {/* Crossguard */}
                <line
                  x1="30.5"
                  y1="25.5"
                  x2="38.5"
                  y2="25.5"
                  stroke="#475569"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                {/* Sword Hilt */}
                <rect x="33.7" y="26.5" width="1.6" height="5" rx="0.8" fill="#18181B" />

                {/* Black Right Paw gripping the sword (검은 앞발) */}
                <ellipse cx="34.5" cy="28" rx="2.4" ry="2" fill="#18181B" />
              </g>

              {/* Black Left Paw posed forward (검은 앞발) */}
              <ellipse cx="16" cy="31" rx="2.5" ry="2" fill="#18181B" className="paw-left" />
            </g>
          ) : (
            // === IDLE MODE: Dignified Master Rakko with Sheathed Greatsword ===
            <g className="rakko-idle-group">
              {/* Serious Master Eyebrows (\ /) */}
              <path
                d="M16 16.5 L20.5 18"
                stroke="#18181B"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path
                d="M32 16.5 L27.5 18"
                stroke="#18181B"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              {/* Furrow */}
              <line x1="24" y1="16.8" x2="24" y2="18" stroke="#18181B" strokeWidth="1" strokeLinecap="round" />

              {/* Calm, confident gaze */}
              <circle cx="18.5" cy="21" r="2.3" fill="#18181B" />
              <circle cx="17.8" cy="20.3" r="0.9" fill="#FFFFFF" />
              <circle cx="29.5" cy="21" r="2.3" fill="#18181B" />
              <circle cx="28.8" cy="20.3" r="0.9" fill="#FFFFFF" />

              {/* Cute sea otter 'w' mouth */}
              <path
                d="M21.5 24 Q22.8 25.2 24 24.2 Q25.2 25.2 26.5 24"
                stroke="#18181B"
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />

              {/* Black paws resting at sides (검은 앞발) */}
              <ellipse cx="15.5" cy="32" rx="2.3" ry="1.9" fill="#18181B" />
              <ellipse cx="32.5" cy="32" rx="2.3" ry="1.9" fill="#18181B" />

              {/* Greatsword on back (등 뒤에 멘 대검) */}
              <line
                x1="32.5"
                y1="31"
                x2="37"
                y2="17"
                stroke="#64748B"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <line
                x1="30.5"
                y1="23"
                x2="35.5"
                y2="21.5"
                stroke="#475569"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};


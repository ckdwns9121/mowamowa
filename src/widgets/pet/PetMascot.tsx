import React from "react";

export type PetMood = "focus" | "break" | "idle" | "done";

interface PetMascotProps {
  mood: PetMood;
  isRunning: boolean;
  size?: number;
}

/**
 * 먼작귀(ちいかわ)의 듬직하고 귀여운 랭커 '랏코(ラッコ)' 선생 마스코트
 * - 이마의 트레이드마크 십자 흉터와 늠름한 눈썹
 * - focus: 토벌의 검을 쥐고 비장하게 집중하는 랏코 (러닝 시 블루 젬 발광 및 검기 애니메이션)
 * - break: 가장 좋아하는 달콤한 딸기 파르페를 양손으로 들고 행복해하는 랏코
 * - idle: 붉은 망토를 두르고 늠름하게 서 있는 듬직한 랏코
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
        {/* Soft ground shadow */}
        <ellipse cx="24" cy="44" rx="14" ry="3.5" className="pet-shadow" />

        {/* Common Rakko Body & Cape */}
        <g className="pet-body-group">
          {/* Sea otter tail */}
          <ellipse
            cx="13"
            cy="37"
            rx="4.5"
            ry="6"
            transform="rotate(-20 13 37)"
            fill="#8D7B68"
            className="rakko-tail"
          />

          {/* Red Hero Cape Back */}
          <path
            d="M13 25 C10 34 13 41 16 42.5 C21 43.5 27 43.5 32 42.5 C35 41 38 34 35 25 Z"
            fill="#D9383A"
            className="rakko-cape"
          />

          {/* Sea Otter Body */}
          <ellipse cx="24" cy="33" rx="10" ry="9" fill="#8D7B68" />
          {/* Cream Belly */}
          <ellipse cx="24" cy="34" rx="6.5" ry="6" fill="#FFFDF7" />

          {/* Little feet */}
          <ellipse cx="19" cy="41" rx="3.5" ry="2.2" fill="#756453" />
          <ellipse cx="29" cy="41" rx="3.5" ry="2.2" fill="#756453" />

          {/* Round Otter Ears */}
          <ellipse cx="13" cy="16" rx="3.8" ry="3.8" fill="#8D7B68" />
          <ellipse cx="13.5" cy="16" rx="2.2" ry="2.2" fill="#FFFDF7" />
          <ellipse cx="35" cy="16" rx="3.8" ry="3.8" fill="#8D7B68" />
          <ellipse cx="34.5" cy="16" rx="2.2" ry="2.2" fill="#FFFDF7" />

          {/* Head (Ivory cream) */}
          <ellipse cx="24" cy="20" rx="12.5" ry="11" fill="#FFFDF7" />

          {/* Iconic Forehead Scar (+) above left eye */}
          <path
            d="M17 11 L17 15 M15 13 L19 13"
            stroke="#B59F89"
            strokeWidth="1.3"
            strokeLinecap="round"
          />

          {/* Rosy blush cheeks */}
          <ellipse cx="15.5" cy="23.5" rx="2.4" ry="1.6" fill="#FFAAA6" opacity="0.6" />
          <ellipse cx="32.5" cy="23.5" rx="2.4" ry="1.6" fill="#FFAAA6" opacity="0.6" />

          {/* Cute otter nose */}
          <ellipse cx="24" cy="22.2" rx="1.6" ry="1.2" fill="#1E1B18" />

          {/* Whisker freckles */}
          <circle cx="15" cy="23.5" r="0.6" fill="#8D7B68" />
          <circle cx="33" cy="23.5" r="0.6" fill="#8D7B68" />

          {/* Cape Brooch Collar */}
          <polygon points="21,27 24,30.5 27,27" fill="#D9383A" />
          <circle cx="24" cy="28.5" r="1.8" fill="#FFD166" />
          <circle cx="24" cy="28.5" r="0.8" fill="#F59E0B" />

          {mood === "break" ? (
            // === BREAK MODE: Rakko enjoying strawberry parfait ===
            <g className="rakko-break-group">
              {/* Happy eyes (^ ^) */}
              <path
                d="M16.5 21 Q18.5 18.5 20.5 21"
                stroke="#1E1B18"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M27.5 21 Q29.5 18.5 31.5 21"
                stroke="#1E1B18"
                strokeWidth="1.8"
                strokeLinecap="round"
                fill="none"
              />

              {/* Happy open smile */}
              <path
                d="M22 24.2 Q24 27.5 26 24.2 Z"
                fill="#F43F5E"
                stroke="#1E1B18"
                strokeWidth="1.1"
                strokeLinejoin="round"
              />

              {/* Parfait Glass */}
              <g className="rakko-parfait">
                <path
                  d="M21 30.5 L27 30.5 L25.8 38 L22.2 38 Z"
                  fill="rgba(224, 242, 254, 0.85)"
                  stroke="#7DD3FC"
                  strokeWidth="0.8"
                />
                {/* Parfait layers (caramel/custard) */}
                <rect x="22.5" y="34.5" width="3" height="2" rx="0.5" fill="#FB923C" />
                {/* Whipped cream swirl */}
                <ellipse cx="24" cy="29.5" rx="3.2" ry="2" fill="#FFFDF7" />
                {/* Sweet Strawberry */}
                <polygon points="24,24.5 22.5,28 25.5,28" fill="#EF4444" />
                <circle cx="24" cy="24.5" r="0.7" fill="#22C55E" />

                {/* Little paws holding parfait */}
                <ellipse cx="19.5" cy="33" rx="2" ry="1.6" fill="#FFFDF7" />
                <ellipse cx="28.5" cy="33" rx="2" ry="1.6" fill="#FFFDF7" />
              </g>

              {/* Floating sweet heart */}
              <path
                d="M34.5 13 C34.5 11 36.5 10 38 11.5 C39.5 10 41.5 11 41.5 13 C41.5 15.5 38 17.5 38 17.5 C38 17.5 34.5 15.5 34.5 13 Z"
                fill="#F43F5E"
                className="rakko-heart"
              />
            </g>
          ) : mood === "focus" ? (
            // === FOCUS MODE: Resolute Rakko with his famous sword ===
            <g className={`rakko-focus-group ${isRunning ? "is-training" : ""}`}>
              {/* Determined Cool Eyebrows (\ /) */}
              <path
                d="M16 16.5 L20.5 18"
                stroke="#1E1B18"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path
                d="M32 16.5 L27.5 18"
                stroke="#1E1B18"
                strokeWidth="1.9"
                strokeLinecap="round"
              />

              {/* Focused Master Eyes with Sparkle */}
              <circle cx="18.5" cy="20.8" r="2.4" fill="#1E1B18" />
              <circle cx="17.7" cy="20.1" r="0.9" fill="#FFFFFF" />
              <circle cx="29.5" cy="20.8" r="2.4" fill="#1E1B18" />
              <circle cx="28.7" cy="20.1" r="0.9" fill="#FFFFFF" />

              {/* Resolute small mouth */}
              <line
                x1="22.2"
                y1="24.6"
                x2="25.8"
                y2="24.6"
                stroke="#1E1B18"
                strokeWidth="1.3"
                strokeLinecap="round"
              />

              {/* Master's Sword */}
              <g className="rakko-sword">
                {/* Silver Blade */}
                <path
                  d="M33.5 25 L33.5 11 Q34.5 8.5 35.5 11 L35.5 25 Z"
                  fill="#F1F5F9"
                  stroke="#94A3B8"
                  strokeWidth="0.7"
                  className="sword-blade"
                />
                {/* Golden Crossguard */}
                <line
                  x1="31"
                  y1="25.5"
                  x2="38"
                  y2="25.5"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Blue Gem of the Slayer */}
                <circle cx="34.5" cy="25.5" r="1.3" fill="#38BDF8" className="sword-gem" />
                {/* Sword Hilt */}
                <rect x="33.7" y="26.5" width="1.6" height="5" rx="0.8" fill="#92400E" />

                {/* Right paw gripping sword */}
                <ellipse cx="34.5" cy="28.5" rx="2.4" ry="2" fill="#FFFDF7" />
              </g>

              {/* Left paw posed forward */}
              <ellipse cx="16" cy="31" rx="2.5" ry="2" fill="#FFFDF7" className="paw-left" />
            </g>
          ) : (
            // === IDLE MODE: Cool and dignified Master Rakko ===
            <g className="rakko-idle-group">
              {/* Calm, confident eyebrows */}
              <path
                d="M16 17 L20 18"
                stroke="#1E1B18"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M32 17 L28 18"
                stroke="#1E1B18"
                strokeWidth="1.6"
                strokeLinecap="round"
              />

              {/* Gentle eyes */}
              <circle cx="18.5" cy="21" r="2.3" fill="#1E1B18" />
              <circle cx="17.8" cy="20.3" r="0.9" fill="#FFFFFF" />
              <circle cx="29.5" cy="21" r="2.3" fill="#1E1B18" />
              <circle cx="28.8" cy="20.3" r="0.9" fill="#FFFFFF" />

              {/* Cute sea otter 'w' mouth */}
              <path
                d="M21.5 24.2 Q22.8 25.5 24 24.4 Q25.2 25.5 26.5 24.2"
                stroke="#1E1B18"
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />

              {/* Paws at sides */}
              <ellipse cx="15.5" cy="32" rx="2.3" ry="1.9" fill="#FFFDF7" />
              <ellipse cx="32.5" cy="32" rx="2.3" ry="1.9" fill="#FFFDF7" />

              {/* Sheathed sword at side */}
              <line
                x1="33"
                y1="31"
                x2="37"
                y2="20"
                stroke="#94A3B8"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <circle cx="33" cy="31" r="1.2" fill="#38BDF8" />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};


import React, { useState, useEffect, useRef, useCallback } from "react";
import rakkoSvg from "./assets/rakko.svg";
import rakkoBackSvg from "./assets/rakko-back.svg";

export type PetMood = "focus" | "break" | "idle" | "done";

interface PetMascotProps {
  mood: PetMood;
  isRunning: boolean;
  size?: number;
}

/**
 * 먼작귀(ちいかわ) 랭커 1위 랏코(ラッコ) 선생 마스코트
 * - 원작 공식 일러스트 앞모습 & 뒷모습(망토) 기반
 * - 점프 + 3D Y축 회오리 스핀(Cyclone Whirlwind 1080°) + 회전 발도술
 * - 집중 모드: 발도된 대검 파지 + 검기 오라
 * - 휴식 모드: 딸기 디저트 힐링
 */
export const PetMascot: React.FC<PetMascotProps> = ({
  mood,
  isRunning,
  size = 64,
}) => {
  const [isWhirlwindSpinning, setIsWhirlwindSpinning] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);
  const prevRunningRef = useRef(isRunning);

  const triggerEpicWhirlwindSlash = useCallback(() => {
    setIsWhirlwindSpinning(true);
    setShowSlash(false);
    setShowShockwave(false);

    // 회오리 스핀 정점(약 550ms): 대검 발도 및 360도 원형 검기 링 번쩍임
    const slashTimer = setTimeout(() => {
      setShowSlash(true);
    }, 550);

    // 착지 순간(약 900ms): 히어로 랜딩 충격파 링
    const shockTimer = setTimeout(() => {
      setShowShockwave(true);
    }, 900);

    // 액션 시퀀스 완료 후 전투 자세로 전환
    const endTimer = setTimeout(() => {
      setIsWhirlwindSpinning(false);
      setShowSlash(false);
      setShowShockwave(false);
    }, 1300);

    return () => {
      clearTimeout(slashTimer);
      clearTimeout(shockTimer);
      clearTimeout(endTimer);
    };
  }, []);

  // 타이머 집중 시작 시 회오리 스핀 발도술 발동
  useEffect(() => {
    if (isRunning && !prevRunningRef.current && mood === "focus") {
      triggerEpicWhirlwindSlash();
    }
    prevRunningRef.current = isRunning;
  }, [isRunning, mood, triggerEpicWhirlwindSlash]);

  const isSwordActive = (mood === "focus" && isRunning) || isWhirlwindSpinning;

  return (
    <div
      className={`pet-mascot-container pet-mood-${mood} ${isRunning ? "is-running" : "is-paused"} ${
        isWhirlwindSpinning ? "is-jump-spinning" : ""
      }`}
      style={{ width: size, height: size }}
      aria-hidden="true"
      onClick={triggerEpicWhirlwindSlash}
    >
      {/* 바닥 착지 시 충격파 이펙트 */}
      {showShockwave && <div className="rakko-landing-shockwave" />}

      <div
        className={`pet-rakko-avatar-wrapper ${isWhirlwindSpinning ? "anim-whirlwind-jump" : ""}`}
        style={{ width: size, height: size }}
      >
        {/* 회오리바람 토네이도 볼텍스 이펙트 */}
        {isWhirlwindSpinning && (
          <div className="rakko-cyclone-vortex">
            <div className="cyclone-wind-ring ring-1" />
            <div className="cyclone-wind-ring ring-2" />
            <div className="cyclone-wind-ring ring-3" />
          </div>
        )}

        {/* 회오리 360도 원형 참격 검기 링 (Whirlwind Slash Ring) */}
        {showSlash && (
          <div className="rakko-slash-effect">
            <svg className="slash-arc-svg whirlwind-slash-svg" viewBox="0 0 100 100">
              <ellipse
                cx="50"
                cy="50"
                rx="44"
                ry="22"
                fill="none"
                stroke="url(#whirlwind-slash-gradient)"
                strokeWidth="7"
                strokeLinecap="round"
                transform="rotate(-15 50 50)"
              />
              <defs>
                <linearGradient id="whirlwind-slash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(56, 189, 248, 0)" />
                  <stop offset="35%" stopColor="#38bdf8" />
                  <stop offset="70%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
            </svg>
            <div className="slash-sparkle-1">✦</div>
            <div className="slash-sparkle-2">⚔️</div>
          </div>
        )}

        {/* 3D Y축 회오리 회전 컨테이너 (앞모습/뒷모습 3D 공간 교차) */}
        <div className={`rakko-3d-flipper ${isWhirlwindSpinning ? "spinning-flipper" : ""}`}>
          {/* 앞면: 공식 랏코 원작 앞모습 */}
          <div className="rakko-card rakko-card-front">
            <img
              src={rakkoSvg}
              alt="먼작귀 랏코 선생 앞모습"
              className={`pet-rakko-img ${isSwordActive ? "rakko-warrior-aura" : ""}`}
              draggable={false}
            />
          </div>

          {/* 뒷면: 회전 중에만 렌더링하여 평상시 겹침/찌꺼기 원천 차단 */}
          {isWhirlwindSpinning && (
            <div className="rakko-card rakko-card-back">
              <img
                src={rakkoBackSvg}
                alt="먼작귀 랏코 선생 뒷모습"
                className={`pet-rakko-img ${isSwordActive ? "rakko-warrior-aura" : ""}`}
                draggable={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

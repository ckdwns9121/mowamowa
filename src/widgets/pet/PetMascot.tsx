import React from "react";
import rakkoSvg from "./assets/rakko.svg";

export type PetMood = "focus" | "break" | "idle" | "done";

interface PetMascotProps {
  mood: PetMood;
  isRunning: boolean;
  size?: number;
}

/**
 * 먼작귀(ちいかわ) 공식 랏코(ラッコ) 선생 마스코트
 * - 원작 공식 일러스트 기반 투명 SVG 적용
 * - focus: 집중 모드 시 늠름한 검투 훈련 이펙트(⚔️)
 * - break: 휴식 모드 시 최애 딸기 디저트 이펙트(🍓)
 * - idle: 차분하게 대기하는 랭커 1위 랏코 선생
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
      <div className="pet-rakko-avatar-wrapper" style={{ width: size, height: size }}>
        <img
          src={rakkoSvg}
          alt="먼작귀 랏코 선생"
          className="pet-rakko-img"
          draggable={false}
        />

        {/* Dynamic mood accessory badges over official art */}
        {mood === "break" && (
          <div className="rakko-mood-badge rakko-badge-break" title="휴식 중! 달콤한 딸기 타임">
            🍓
          </div>
        )}
        {mood === "focus" && isRunning && (
          <div className="rakko-mood-badge rakko-badge-focus" title="토벌 집중 훈련 중!">
            ⚔️
          </div>
        )}
      </div>
    </div>
  );
};


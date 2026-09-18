import React from "react";

export type PetMood = "focus" | "break" | "idle" | "done";

interface PetMascotProps {
  mood: PetMood;
  isRunning: boolean;
  size?: number;
}

/**
 * Animated pixel-art desktop pet mascot inspired by retro desktop companions / PokeTokenBar.
 * - focus: working hard, typing on laptop, glowing screen, blinking/focused eyes
 * - break: sleeping peacefully with Zzz or sipping coffee
 * - idle: standing/bouncing gently, waiting for user to start
 * - done: celebrating, arms up, sparkling
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
        {/* Soft Shadow */}
        <ellipse cx="24" cy="44" rx="16" ry="3.5" className="pet-shadow" />

        {mood === "break" ? (
          // === BREAK MODE: Cozy sleeping / coffee companion ===
          <g className="pet-body-group pet-sleeping">
            {/* Cute rounded body */}
            <rect x="12" y="16" width="24" height="22" rx="11" fill="#FFB703" />
            <ellipse cx="24" cy="27" rx="9" ry="8" fill="#FFF3B0" />

            {/* Cat / Fox Ears */}
            <polygon points="12,18 17,8 21,17" fill="#FB8500" />
            <polygon points="36,18 31,8 27,17" fill="#FB8500" />
            <polygon points="14,17 17,11 19,17" fill="#FFB703" />
            <polygon points="34,17 31,11 29,17" fill="#FFB703" />

            {/* Sleeping Closed Eyes (^_^) */}
            <path
              d="M17 24 Q20 28 23 24"
              stroke="#023047"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M25 24 Q28 28 31 24"
              stroke="#023047"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Blushing cheeks */}
            <circle cx="16" cy="27" r="2.5" fill="#FF006E" opacity="0.35" />
            <circle cx="32" cy="27" r="2.5" fill="#FF006E" opacity="0.35" />

            {/* Cute smile */}
            <path
              d="M22 28 Q24 30 26 28"
              stroke="#023047"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Zzz floating animation */}
            <g className="pet-zzz">
              <text x="32" y="14" className="zzz-text zzz-1">z</text>
              <text x="37" y="9" className="zzz-text zzz-2">Z</text>
            </g>
          </g>
        ) : mood === "focus" ? (
          // === FOCUS MODE: Focused worker with laptop / typing animation ===
          <g className={`pet-body-group pet-focusing ${isRunning ? "anim-typing" : ""}`}>
            {/* Cute rounded body */}
            <rect x="12" y="14" width="24" height="22" rx="10" fill="#3A86FF" />
            <ellipse cx="24" cy="25" rx="9" ry="8" fill="#E0EAFF" />

            {/* Antenna / Cyber ears */}
            <rect x="22" y="7" width="4" height="7" rx="2" fill="#8338EC" />
            <circle cx="24" cy="6" r="3.5" fill="#FF006E" className="pet-bulb" />

            {/* Cat Ears */}
            <polygon points="12,16 16,8 20,15" fill="#8338EC" />
            <polygon points="36,16 32,8 28,15" fill="#8338EC" />

            {/* Focused big eyes with sparkle */}
            <circle cx="19" cy="22" r="3.2" fill="#023047" />
            <circle cx="29" cy="22" r="3.2" fill="#023047" />
            <circle cx="20" cy="21" r="1.2" fill="#FFFFFF" />
            <circle cx="30" cy="21" r="1.2" fill="#FFFFFF" />

            {/* Tiny concentrated mouth */}
            <line x1="22" y1="26" x2="26" y2="26" stroke="#023047" strokeWidth="1.5" strokeLinecap="round" />

            {/* Mini Laptop */}
            <g className="pet-laptop">
              {/* Laptop screen */}
              <rect x="15" y="27" width="18" height="12" rx="2" fill="#0F172A" />
              {/* Screen glow code lines */}
              <rect x="17" y="29" width="14" height="8" rx="1" fill="#1E293B" />
              <line x1="18" y1="31" x2="26" y2="31" stroke="#06D6A0" strokeWidth="1.2" strokeLinecap="round" className="code-line-1" />
              <line x1="18" y1="34" x2="28" y2="34" stroke="#38BDF8" strokeWidth="1.2" strokeLinecap="round" className="code-line-2" />

              {/* Laptop base */}
              <polygon points="13,39 35,39 33,42 15,42" fill="#64748B" />

              {/* Little paws typing */}
              <ellipse cx="16" cy="38" rx="2.5" ry="2" fill="#FFFFFF" className="paw-left" />
              <ellipse cx="32" cy="38" rx="2.5" ry="2" fill="#FFFFFF" className="paw-right" />
            </g>
          </g>
        ) : (
          // === IDLE / WAITING MODE: Ready & friendly pet ===
          <g className="pet-body-group pet-idle">
            <rect x="12" y="14" width="24" height="24" rx="11" fill="#10B981" />
            <ellipse cx="24" cy="26" rx="9" ry="8" fill="#ECFDF5" />

            {/* Ears */}
            <polygon points="12,16 16,7 20,15" fill="#047857" />
            <polygon points="36,16 32,7 28,15" fill="#047857" />
            <polygon points="14,15 16,10 18,15" fill="#A7F3D0" />
            <polygon points="34,15 32,10 30,15" fill="#A7F3D0" />

            {/* Happy eyes */}
            <circle cx="19" cy="22" r="3" fill="#064E3B" />
            <circle cx="29" cy="22" r="3" fill="#064E3B" />
            <circle cx="20" cy="21" r="1.1" fill="#FFFFFF" />
            <circle cx="30" cy="21" r="1.1" fill="#FFFFFF" />

            {/* Rosy cheeks */}
            <circle cx="16" cy="26" r="2.2" fill="#F43F5E" opacity="0.4" />
            <circle cx="32" cy="26" r="2.2" fill="#F43F5E" opacity="0.4" />

            {/* Cute open smile */}
            <path
              d="M21 26 Q24 30 27 26"
              stroke="#064E3B"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

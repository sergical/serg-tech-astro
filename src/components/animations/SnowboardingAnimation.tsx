import React from "react";
import type { AnimationProps } from "./types";

export const SnowboardingAnimation: React.FC<AnimationProps> = ({
  isActive,
}) => (
  <svg width="100" height="32" viewBox="0 0 100 32" className="w-full h-full">
    <path d="M10 25 L90 15" stroke="currentColor" strokeWidth="2" fill="none" />
    <g
      style={{
        animation: isActive
          ? "snowboard-slide 3s ease-in-out infinite"
          : "none",
      }}
    >
      <circle cx="30" cy="18" r="3" fill="currentColor" />
      <line
        x1="30"
        y1="21"
        x2="30"
        y2="26"
        stroke="currentColor"
        strokeWidth="2"
      />
      <line
        x1="27"
        y1="23"
        x2="33"
        y2="23"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect x="26" y="26" width="8" height="2" fill="currentColor" rx="1" />
    </g>
    <style>{`
      @keyframes snowboard-slide {
        0% { transform: translateX(-20px); }
        100% { transform: translateX(50px); }
      }
    `}</style>
  </svg>
);

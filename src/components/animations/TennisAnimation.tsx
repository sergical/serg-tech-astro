import React from "react";
import type { AnimationProps } from "./types";

export const TennisAnimation: React.FC<AnimationProps> = ({ isActive }) => (
  <svg width="100" height="32" viewBox="0 0 100 32" className="w-full h-full">
    <rect x="2" y="12" width="3" height="8" fill="currentColor" rx="1" />
    <rect x="95" y="12" width="3" height="8" fill="currentColor" rx="1" />
    <circle
      cx="50"
      cy="16"
      r="3"
      fill="currentColor"
      style={{
        animation: isActive ? "tennis-ball 2s ease-in-out infinite" : "none",
      }}
    />
    <style>{`
      @keyframes tennis-ball {
        0% { transform: translateX(-40px); }
        50% { transform: translateX(40px); }
        100% { transform: translateX(-40px); }
      }
    `}</style>
  </svg>
);

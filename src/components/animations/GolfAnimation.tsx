import React from "react";
import type { AnimationProps } from "./types";

export const GolfAnimation: React.FC<AnimationProps> = ({ isActive }) => (
  <svg width="100" height="32" viewBox="0 0 100 32" className="w-full h-full">
    <circle cx="15" cy="20" r="3" fill="currentColor" />
    <line
      x1="15"
      y1="23"
      x2="15"
      y2="28"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="12"
      y1="25"
      x2="18"
      y2="25"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line
      x1="85"
      y1="8"
      x2="85"
      y2="20"
      stroke="currentColor"
      strokeWidth="2"
    />
    <polygon points="85,8 90,12 85,16" fill="currentColor" />
    <circle
      cx="25"
      cy="24"
      r="2"
      fill="currentColor"
      style={{
        animation: isActive
          ? "golf-ball 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite"
          : "none",
      }}
    />
    <style>{`
      @keyframes golf-ball {
        0% { transform: translate(0, 0); }
        10% { transform: translate(8px, -6px); }
        20% { transform: translate(16px, -10px); }
        30% { transform: translate(24px, -13px); }
        40% { transform: translate(32px, -14px); }
        50% { transform: translate(40px, -14px); }
        60% { transform: translate(48px, -12px); }
        70% { transform: translate(56px, -8px); }
        80% { transform: translate(62px, -4px); }
        90% { transform: translate(66px, -1px); }
        100% { transform: translate(68px, 0px); }
      }
    `}</style>
  </svg>
);

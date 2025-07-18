import React from "react";

interface AnimationProps {
  isActive: boolean;
}

export const LegoAnimation: React.FC<AnimationProps> = ({ isActive }) => (
  <svg width="100" height="32" viewBox="0 0 100 32" className="w-full h-full">
    <g>
      <rect
        x="40"
        y="20"
        width="20"
        height="8"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        rx="1"
      />
      <circle cx="44" cy="18" r="2" fill="currentColor" />
      <circle cx="56" cy="18" r="2" fill="currentColor" />
      <rect
        x="35"
        y="12"
        width="30"
        height="8"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        rx="1"
        opacity={isActive ? "1" : "0.3"}
        style={{
          animation: isActive
            ? "lego-build 2s ease-in-out infinite alternate"
            : "none",
        }}
      />
      <circle
        cx="40"
        cy="10"
        r="2"
        fill="currentColor"
        opacity={isActive ? "1" : "0.3"}
        style={{
          animation: isActive
            ? "lego-build 2s ease-in-out infinite alternate"
            : "none",
        }}
      />
      <circle
        cx="50"
        cy="10"
        r="2"
        fill="currentColor"
        opacity={isActive ? "1" : "0.3"}
        style={{
          animation: isActive
            ? "lego-build 2s ease-in-out infinite alternate"
            : "none",
        }}
      />
      <circle
        cx="60"
        cy="10"
        r="2"
        fill="currentColor"
        opacity={isActive ? "1" : "0.3"}
        style={{
          animation: isActive
            ? "lego-build 2s ease-in-out infinite alternate"
            : "none",
        }}
      />
    </g>
    <style>{`
      @keyframes lego-build {
        0% { transform: translateY(10px); opacity: 0.3; }
        100% { transform: translateY(0); opacity: 1; }
      }
    `}</style>
  </svg>
);

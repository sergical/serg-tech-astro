"use client";

import React, { useState } from "react";
import {
  GolfAnimation,
  LegoAnimation,
  SnowboardingAnimation,
  TennisAnimation,
} from "./animations";

interface HobbyBlockProps {
  name: string;
  textColor: string;
}

const HobbyBlock: React.FC<HobbyBlockProps> = ({ name, textColor }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getAnimatedSVG = () => {
    switch (name) {
      case "Tennis":
        return <TennisAnimation isActive={isHovered} />;
      case "Snowboarding":
        return <SnowboardingAnimation isActive={isHovered} />;
      case "Lego":
        return <LegoAnimation isActive={isHovered} />;
      case "Golf":
        return <GolfAnimation isActive={isHovered} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="border p-1 border-muted hover:border-primary transition-all duration-300 ease-in-out opacity-100 hover-group-hover:opacity-50 hover:!opacity-100 hover:!border-opacity-100 cursor-pointer relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`${name} hobby`}
      style={{ minHeight: "48px" }}
    >
      <div className="relative h-full flex items-center justify-center">
        <span
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${textColor} ${
            isHovered ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          {name}
        </span>
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${textColor} ${
            isHovered ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
          aria-hidden="true"
        >
          {getAnimatedSVG()}
        </div>
      </div>
    </div>
  );
};

export default HobbyBlock;

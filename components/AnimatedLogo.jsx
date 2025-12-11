"use client";
import React, { useState } from "react";

/**
 * AnimatedLogo Component
 *
 * Displays the SPIKES logo with animated letters that bounce
 * up and down when hovered, creating a wave effect.
 *
 * @param {Object} props
 * @param {string} props.size - Size variant: "sm" (40px), "md" (80px), "lg" (120px)
 * @param {string} props.className - Additional CSS classes
 */
export default function AnimatedLogo({ size = "md", className = "" }) {
  const [isHovered, setIsHovered] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "h-10",
      cactus: "h-8",
      text: "text-xl",
      gap: "gap-2"
    },
    md: {
      container: "h-20",
      cactus: "h-16",
      text: "text-4xl",
      gap: "gap-3"
    },
    lg: {
      container: "h-28",
      cactus: "h-24",
      text: "text-6xl",
      gap: "gap-4"
    }
  };

  const config = sizeConfig[size] || sizeConfig.md;
  const letters = "SPIKES".split("");

  return (
    <div
      className={`flex items-center ${config.gap} ${config.container} cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cactus Icon */}
      <div className={`${config.cactus} flex-shrink-0`}>
        <svg
          viewBox="0 0 50 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto"
        >
          {/* Left arm */}
          <path
            d="M8 40 L8 28 Q8 20 15 20 Q22 20 22 28 L22 40 Q22 48 15 48 Q8 48 8 40 Z"
            fill="#10B981"
            className={isHovered ? "animate-cactus-wiggle" : ""}
          />
          {/* Center body */}
          <path
            d="M22 52 L22 12 Q22 4 32 4 Q42 4 42 12 L42 52 Q42 60 32 60 Q22 60 22 52 Z"
            fill="#10B981"
          />
          {/* Right arm */}
          <path
            d="M42 40 L42 32 Q42 24 49 24 Q56 24 56 32 L56 40 Q56 48 49 48 Q42 48 42 40 Z"
            fill="#10B981"
            className={isHovered ? "animate-cactus-wiggle-delayed" : ""}
          />
        </svg>
      </div>

      {/* Animated Letters */}
      <div className="flex">
        {letters.map((letter, index) => (
          <span
            key={index}
            className={`
              ${config.text} font-bold text-primary inline-block
              transition-transform duration-300
              ${isHovered ? "animate-letter-bounce" : ""}
            `}
            style={{
              animationDelay: isHovered ? `${index * 50}ms` : "0ms",
              fontFamily: "'Poppins', sans-serif"
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Water drop */}
      <div className={`${config.cactus} flex-shrink-0 flex items-center`}>
        <svg
          viewBox="0 0 20 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`h-1/2 w-auto ${isHovered ? "animate-drop-bounce" : ""}`}
        >
          <path
            d="M10 0 Q0 15 10 28 Q20 15 10 0 Z"
            fill="#10B981"
          />
        </svg>
      </div>
    </div>
  );
}

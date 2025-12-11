"use client";
import React, { useState, useEffect } from "react";

/**
 * SwipeUpIntro Component
 *
 * Shows an intro animation with a hand gesture swiping up
 * to reveal the main content. The animation plays once when
 * the user first visits the contracts page.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to reveal after animation
 * @param {string} props.storageKey - localStorage key to track if animation was shown
 * @param {boolean} props.forceShow - Force show the animation (for testing)
 */
export default function SwipeUpIntro({
  children,
  storageKey = "spikes-intro-shown",
  forceShow = false
}) {
  const [showIntro, setShowIntro] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Check if intro was already shown
    const wasShown = localStorage.getItem(storageKey);

    if (!wasShown || forceShow) {
      setShowIntro(true);
      setIsAnimating(true);

      // Start the swipe animation after a brief delay
      const animationTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);

      // Complete the intro and show content
      const completeTimer = setTimeout(() => {
        setShowIntro(false);
        setIsComplete(true);
        localStorage.setItem(storageKey, "true");
      }, 2500);

      return () => {
        clearTimeout(animationTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setIsComplete(true);
    }
  }, [storageKey, forceShow]);

  // Skip animation on click
  const skipIntro = () => {
    setShowIntro(false);
    setIsComplete(true);
    localStorage.setItem(storageKey, "true");
  };

  if (isComplete && !showIntro) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Intro Overlay */}
      {showIntro && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          onClick={skipIntro}
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)"
          }}
        >
          {/* Hero Image/Logo Container */}
          <div
            className={`
              relative flex flex-col items-center justify-center
              transition-all duration-700 ease-out
              ${isAnimating ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}
            `}
          >
            {/* Main Logo/Image */}
            <div className="mb-8">
              <svg
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-48 h-48 md:w-64 md:h-64"
              >
                {/* Large Cactus */}
                <g className="animate-float">
                  {/* Left arm */}
                  <path
                    d="M50 130 L50 90 Q50 70 70 70 Q90 70 90 90 L90 130 Q90 150 70 150 Q50 150 50 130 Z"
                    fill="#10B981"
                  />
                  {/* Center body */}
                  <path
                    d="M80 170 L80 50 Q80 30 100 30 Q120 30 120 50 L120 170 Q120 190 100 190 Q80 190 80 170 Z"
                    fill="#10B981"
                  />
                  {/* Right arm */}
                  <path
                    d="M120 130 L120 100 Q120 80 140 80 Q160 80 160 100 L160 130 Q160 150 140 150 Q120 150 120 130 Z"
                    fill="#10B981"
                  />
                  {/* Decorative dots */}
                  <circle cx="100" cy="60" r="4" fill="#059669" />
                  <circle cx="100" cy="80" r="4" fill="#059669" />
                  <circle cx="100" cy="100" r="4" fill="#059669" />
                  <circle cx="70" cy="100" r="3" fill="#059669" />
                  <circle cx="140" cy="110" r="3" fill="#059669" />
                </g>
              </svg>
            </div>

            {/* Animated SPIKES Text */}
            <div className="flex gap-1 mb-8">
              {"SPIKES".split("").map((letter, index) => (
                <span
                  key={index}
                  className="text-5xl md:text-7xl font-bold text-primary animate-letter-bounce"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    fontFamily: "'Poppins', sans-serif"
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>

            {/* Tagline */}
            <p className="text-lg md:text-xl text-emerald-700 font-medium mb-12">
              Sistema de Gestion de Contratos
            </p>

            {/* Hand Swipe Indicator */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-swipe-up">
              <div className="flex flex-col items-center">
                {/* Hand emoji/icon */}
                <div className="text-5xl mb-2 animate-hand-drag">
                  <svg
                    viewBox="0 0 64 64"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-16 h-16"
                  >
                    {/* Hand pointing up */}
                    <path
                      d="M32 8 L32 40 M32 8 L26 16 M32 8 L38 16"
                      stroke="#059669"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Palm */}
                    <ellipse
                      cx="32"
                      cy="48"
                      rx="12"
                      ry="8"
                      fill="#fcd34d"
                      stroke="#f59e0b"
                      strokeWidth="2"
                    />
                    {/* Fingers */}
                    <path
                      d="M24 42 L24 32 Q24 28 28 28 L28 42"
                      fill="#fcd34d"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M28 40 L28 26 Q28 22 32 22 L32 40"
                      fill="#fcd34d"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M32 40 L32 26 Q32 22 36 22 L36 40"
                      fill="#fcd34d"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M36 42 L36 32 Q36 28 40 28 L40 42"
                      fill="#fcd34d"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                {/* Swipe hint text */}
                <span className="text-emerald-600 text-sm font-medium opacity-75">
                  Desliza hacia arriba
                </span>
              </div>
            </div>
          </div>

          {/* Skip hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-emerald-600 text-sm opacity-50">
            Toca para saltar
          </div>
        </div>
      )}

      {/* Main Content with fade-in */}
      <div
        className={`
          transition-all duration-500 ease-out
          ${isComplete ? "opacity-100" : "opacity-0"}
        `}
      >
        {children}
      </div>
    </>
  );
}

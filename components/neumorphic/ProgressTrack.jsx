"use client";
import React from "react";

/**
 * ProgressTrack Component
 *
 * A progress bar component with neumorphic inset design (soft UI).
 * Shows percentage completion with color-coded variants.
 *
 * @param {Object} props
 * @param {number} props.value - Progress value (0-100)
 * @param {number} [props.max=100] - Maximum value
 * @param {string} [props.variant='primary'] - Color variant: 'primary' | 'success' | 'warning' | 'danger' | 'info'
 * @param {string} [props.size='md'] - Size: 'sm' | 'md' | 'lg'
 * @param {boolean} [props.showPercentage=false] - Show percentage text
 * @param {string} [props.label] - Label text displayed above the progress bar
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.animated=true] - Animate the progress fill
 * @param {boolean} [props.striped=false] - Show striped pattern
 */
export default function ProgressTrack({
  value = 0,
  max = 100,
  variant = "primary",
  size = "md",
  showPercentage = false,
  label,
  className = "",
  animated = true,
  striped = false,
  ...props
}) {
  // Calculate percentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Size classes
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  // Variant colors
  const variantColors = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
  };

  // Track (background) classes with inset shadow
  const trackClasses = `
    relative
    bg-background-light dark:bg-background-dark
    shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark
    rounded-full
    overflow-hidden
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, " ");

  // Fill classes
  const fillClasses = `
    h-full
    rounded-full
    ${variantColors[variant]}
    ${animated ? "transition-all duration-500 ease-out" : ""}
    ${striped ? "bg-striped" : ""}
  `.trim().replace(/\s+/g, " ");

  return (
    <div className="w-full">
      {/* Label and percentage */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress track */}
      <div className={trackClasses} {...props}>
        {/* Progress fill */}
        <div
          className={fillClasses}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}

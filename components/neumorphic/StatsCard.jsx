"use client";
import React from "react";
import NeumorphicCard from "./NeumorphicCard";
import ProgressTrack from "./ProgressTrack";

/**
 * StatsCard Component
 *
 * A statistics card component with neumorphic design.
 * Displays an icon, value, label, optional progress bar, and growth indicator.
 *
 * @param {Object} props
 * @param {string} props.icon - Material icon name
 * @param {string|number} props.value - Main stat value to display
 * @param {string} props.label - Label text
 * @param {string} [props.sublabel] - Optional sublabel/description
 * @param {string} [props.iconColor='primary'] - Icon background color: 'primary' | 'success' | 'warning' | 'danger' | 'info'
 * @param {number} [props.progress] - Progress value (0-100) - shows progress bar if provided
 * @param {number} [props.growth] - Growth percentage (positive or negative)
 * @param {string} [props.growthLabel] - Label for growth indicator
 * @param {string} [props.className] - Additional CSS classes
 * @param {function} [props.onClick] - Click handler
 */
export default function StatsCard({
  icon,
  value,
  label,
  sublabel,
  iconColor = "primary",
  progress,
  growth,
  growthLabel,
  className = "",
  onClick,
  ...props
}) {
  // Icon container color classes
  const iconColorClasses = {
    primary: "bg-primary bg-opacity-10 text-primary",
    success: "bg-success bg-opacity-10 text-success",
    warning: "bg-warning bg-opacity-10 text-warning",
    danger: "bg-danger bg-opacity-10 text-danger",
    info: "bg-info bg-opacity-10 text-info",
  };

  // Growth indicator
  const isPositiveGrowth = growth >= 0;
  const growthIcon = isPositiveGrowth ? "trending_up" : "trending_down";
  const growthColor = isPositiveGrowth ? "text-success" : "text-danger";

  return (
    <NeumorphicCard
      className={className}
      onClick={onClick}
      hover={!!onClick}
      {...props}
    >
      <div className="flex flex-col gap-4">
        {/* Icon and Value */}
        <div className="flex items-start justify-between">
          {/* Icon circle */}
          <div className={`
            w-14 h-14 rounded-full
            flex items-center justify-center
            shadow-neumorphic-light dark:shadow-neumorphic-dark
            ${iconColorClasses[iconColor]}
          `}>
            <span className="material-icons-outlined text-2xl">
              {icon}
            </span>
          </div>

          {/* Growth indicator */}
          {growth !== undefined && growth !== null && (
            <div className={`flex items-center gap-1 ${growthColor}`}>
              <span className="material-icons-outlined text-lg">
                {growthIcon}
              </span>
              <span className="text-sm font-semibold">
                {Math.abs(growth)}%
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        <div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {value}
          </div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            {label}
          </div>
          {sublabel && (
            <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
              {sublabel}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {progress !== undefined && progress !== null && (
          <div className="mt-2">
            <ProgressTrack
              value={progress}
              variant={iconColor}
              size="sm"
              showPercentage={false}
            />
            {growthLabel && (
              <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {growthLabel}
              </div>
            )}
          </div>
        )}
      </div>
    </NeumorphicCard>
  );
}

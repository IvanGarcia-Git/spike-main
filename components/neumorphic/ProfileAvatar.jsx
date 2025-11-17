"use client";
import React from "react";

/**
 * ProfileAvatar Component
 *
 * A user avatar component with neumorphic design.
 * Supports images, initials, icons, and status indicators.
 *
 * @param {Object} props
 * @param {string} [props.src] - Image URL
 * @param {string} [props.alt] - Image alt text
 * @param {string} [props.name] - User name (used to generate initials if no image)
 * @param {string} [props.size='md'] - Avatar size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * @param {string} [props.shape='circle'] - Avatar shape: 'circle' | 'square'
 * @param {boolean} [props.status] - Show status indicator
 * @param {string} [props.statusType='online'] - Status type: 'online' | 'offline' | 'busy' | 'away'
 * @param {string} [props.className] - Additional CSS classes
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.bgColor] - Custom background color for initials
 * @param {string} [props.icon] - Material icon name (instead of image/initials)
 */
export default function ProfileAvatar({
  src,
  alt = "",
  name,
  size = "md",
  shape = "circle",
  status,
  statusType = "online",
  className = "",
  onClick,
  bgColor,
  icon,
  ...props
}) {
  // Size classes
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-xl",
    "2xl": "w-24 h-24 text-3xl",
  };

  // Shape classes
  const shapeClasses = {
    circle: "rounded-full",
    square: "rounded-xl",
  };

  // Status indicator size
  const statusSizeClasses = {
    xs: "w-2 h-2",
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
    "2xl": "w-5 h-5",
  };

  // Status colors
  const statusColors = {
    online: "bg-success",
    offline: "bg-slate-400",
    busy: "bg-danger",
    away: "bg-warning",
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate random color based on name
  const getColorFromName = (name) => {
    if (bgColor) return bgColor;
    if (!name) return "#94a3b8"; // slate-400

    const colors = [
      "#14b8a6", // primary (teal)
      "#10b981", // success (green)
      "#f59e0b", // warning (amber)
      "#3b82f6", // info (blue)
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#f97316", // orange
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  // Avatar container classes
  const containerClasses = `
    relative
    inline-flex
    items-center
    justify-center
    font-semibold
    shadow-neumorphic-light dark:shadow-neumorphic-dark
    ${sizeClasses[size]}
    ${shapeClasses[shape]}
    ${onClick ? "cursor-pointer hover:shadow-neumorphic-light-hover dark:hover:shadow-neumorphic-dark-hover transition-all" : ""}
    ${className}
  `.trim().replace(/\s+/g, " ");

  return (
    <div className={containerClasses} onClick={onClick} {...props}>
      {/* Avatar content */}
      {src ? (
        // Image
        <img
          src={src}
          alt={alt || name || "Avatar"}
          className={`w-full h-full object-cover ${shapeClasses[shape]}`}
        />
      ) : icon ? (
        // Icon
        <div
          className={`w-full h-full flex items-center justify-center ${shapeClasses[shape]}`}
          style={{ backgroundColor: getColorFromName(name) }}
        >
          <span className="material-icons-outlined text-white">
            {icon}
          </span>
        </div>
      ) : (
        // Initials
        <div
          className={`w-full h-full flex items-center justify-center text-white ${shapeClasses[shape]}`}
          style={{ backgroundColor: getColorFromName(name) }}
        >
          {getInitials(name)}
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <span
          className={`
            absolute
            bottom-0
            right-0
            ${statusSizeClasses[size]}
            ${statusColors[statusType]}
            border-2
            border-background-light dark:border-background-dark
            rounded-full
          `}
        />
      )}
    </div>
  );
}

"use client";
import React from "react";

/**
 * NeumorphicButton Component
 *
 * A button component with neumorphic design (soft UI).
 * Features raised/inset states, multiple variants, sizes, and loading state.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.variant='primary'] - Button variant: 'primary' | 'secondary' | 'danger' | 'success'
 * @param {string} [props.size='md'] - Button size: 'sm' | 'md' | 'lg'
 * @param {boolean} [props.active=false] - Active/pressed state (inset shadow)
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {boolean} [props.loading=false] - Loading state (shows spinner)
 * @param {boolean} [props.fullWidth=false] - Full width button
 * @param {string} [props.icon] - Material icon name (displayed on left)
 * @param {string} [props.iconRight] - Material icon name (displayed on right)
 * @param {function} [props.onClick] - Click handler
 * @param {string} [props.type='button'] - Button type: 'button' | 'submit' | 'reset'
 */
export default function NeumorphicButton({
  children,
  className = "",
  variant = "primary",
  size = "md",
  active = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconRight,
  onClick,
  type = "button",
  ...props
}) {
  // Base classes
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50";

  // State classes
  const stateClasses = active || loading
    ? "shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
    : "shadow-neumorphic-light dark:shadow-neumorphic-dark hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark active:shadow-neumorphic-inset-light dark:active:shadow-neumorphic-inset-dark";

  // Variant classes
  const variantClasses = {
    primary: "bg-background-light dark:bg-background-dark text-primary hover:text-primary-dark",
    secondary: "bg-background-light dark:bg-background-dark text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
    danger: "bg-background-light dark:bg-background-dark text-danger hover:text-red-700",
    success: "bg-background-light dark:bg-background-dark text-success hover:text-green-700",
  };

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-2 text-sm rounded-lg gap-2",
    md: "px-4 py-3 text-base rounded-xl gap-2",
    lg: "px-6 py-4 text-lg rounded-xl gap-3",
  };

  // Disabled classes
  const disabledClasses = disabled || loading
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  // Width class
  const widthClass = fullWidth ? "w-full" : "";

  // Combine all classes
  const combinedClasses = `
    ${baseClasses}
    ${stateClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${widthClass}
    ${className}
  `.trim().replace(/\s+/g, " ");

  // Handle click
  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={combinedClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <span className="material-icons-outlined animate-spin">
          refresh
        </span>
      )}

      {/* Left icon */}
      {!loading && icon && (
        <span className="material-icons-outlined">
          {icon}
        </span>
      )}

      {/* Button text */}
      {children}

      {/* Right icon */}
      {!loading && iconRight && (
        <span className="material-icons-outlined">
          {iconRight}
        </span>
      )}
    </button>
  );
}

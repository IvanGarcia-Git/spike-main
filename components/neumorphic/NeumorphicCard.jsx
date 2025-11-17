"use client";
import React from "react";

/**
 * NeumorphicCard Component
 *
 * A flexible card component with neumorphic design (soft UI).
 * Supports both raised and inset variants, hover states, and dark mode.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to display inside the card
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.variant='raised'] - Card variant: 'raised' | 'inset'
 * @param {string} [props.size='md'] - Padding size: 'sm' | 'md' | 'lg' | 'xl'
 * @param {boolean} [props.hover=false] - Enable hover effect (elevation on hover)
 * @param {function} [props.onClick] - Click handler function
 * @param {string} [props.radius='xl'] - Border radius: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * @param {React.ElementType} [props.as='div'] - HTML element or React component to render as
 */
export default function NeumorphicCard({
  children,
  className = "",
  variant = "raised",
  size = "md",
  hover = false,
  onClick,
  radius = "xl",
  as: Component = "div",
  ...props
}) {
  // Base classes
  const baseClasses = "transition-all duration-300";

  // Variant classes
  const variantClasses = {
    raised: "bg-background-light dark:bg-background-dark shadow-neumorphic-light dark:shadow-neumorphic-dark",
    inset: "bg-background-light dark:bg-background-dark shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark",
  };

  // Size classes (padding)
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  };

  // Radius classes
  const radiusClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  };

  // Hover effect
  const hoverClasses = hover
    ? "hover:shadow-neumorphic-light-hover dark:hover:shadow-neumorphic-dark-hover cursor-pointer"
    : "";

  // Combine all classes
  const combinedClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${radiusClasses[radius]}
    ${hoverClasses}
    ${onClick ? "cursor-pointer" : ""}
    ${className}
  `.trim().replace(/\s+/g, " ");

  return (
    <Component
      className={combinedClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
}

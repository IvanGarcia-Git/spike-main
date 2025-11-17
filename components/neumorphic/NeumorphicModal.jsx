"use client";
import React, { useEffect } from "react";
import NeumorphicCard from "./NeumorphicCard";
import NeumorphicButton from "./NeumorphicButton";

/**
 * NeumorphicModal Component
 *
 * A modal dialog component with neumorphic design.
 * Features overlay, close button, header, footer, and animations.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {function} props.onClose - Close handler
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.title] - Modal title
 * @param {string} [props.size='md'] - Modal size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {boolean} [props.showCloseButton=true] - Show X close button
 * @param {boolean} [props.closeOnOverlayClick=true] - Close when clicking overlay
 * @param {boolean} [props.closeOnEscape=true] - Close on Escape key press
 * @param {React.ReactNode} [props.footer] - Footer content
 * @param {string} [props.className] - Additional CSS classes for modal content
 */
export default function NeumorphicModal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className = "",
  ...props
}) {
  // Handle escape key press
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 animate-fade-in p-4"
      onClick={handleOverlayClick}
    >
      <div
        className={`w-full ${sizeClasses[size]} animate-slide-up`}
        {...props}
      >
        <NeumorphicCard className={`relative ${className}`}>
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <span className="material-icons-outlined">close</span>
            </button>
          )}

          {/* Header */}
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {title}
              </h2>
            </div>
          )}

          {/* Content */}
          <div className="mb-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-divider-light dark:border-divider-dark">
              {footer}
            </div>
          )}
        </NeumorphicCard>
      </div>
    </div>
  );
}

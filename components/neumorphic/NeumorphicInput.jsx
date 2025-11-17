"use client";
import React, { forwardRef } from "react";

/**
 * NeumorphicInput Component
 *
 * An input component with neumorphic inset design (soft UI).
 * Supports icons, labels, error states, and various input types.
 *
 * @param {Object} props
 * @param {string} [props.label] - Label text displayed above the input
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.type='text'] - Input type (text, email, password, number, etc.)
 * @param {string} [props.value] - Controlled input value
 * @param {function} [props.onChange] - Change handler
 * @param {string} [props.className] - Additional CSS classes for the container
 * @param {string} [props.inputClassName] - Additional CSS classes for the input element
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.icon] - Material icon name (displayed on left)
 * @param {string} [props.iconRight] - Material icon name (displayed on right)
 * @param {function} [props.onIconClick] - Handler for left icon click
 * @param {function} [props.onIconRightClick] - Handler for right icon click
 * @param {string} [props.size='md'] - Input size: 'sm' | 'md' | 'lg'
 * @param {boolean} [props.required=false] - Required field indicator
 */
const NeumorphicInput = forwardRef(({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  className = "",
  inputClassName = "",
  error,
  disabled = false,
  icon,
  iconRight,
  onIconClick,
  onIconRightClick,
  size = "md",
  required = false,
  ...props
}, ref) => {
  // Base container classes
  const containerClasses = `flex flex-col ${className}`;

  // Size classes
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-5 py-4 text-lg",
  };

  // Input wrapper classes (inset shadow)
  const wrapperClasses = `
    flex items-center gap-2
    bg-background-light dark:bg-background-dark
    shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark
    rounded-xl
    transition-all duration-200
    ${error ? "ring-2 ring-danger ring-opacity-50" : "focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-30"}
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${sizeClasses[size]}
  `.trim().replace(/\s+/g, " ");

  // Input classes
  const inputClasses = `
    flex-1
    bg-transparent
    border-none
    outline-none
    text-slate-700 dark:text-slate-300
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    disabled:cursor-not-allowed
    ${inputClassName}
  `.trim().replace(/\s+/g, " ");

  // Icon classes
  const iconClasses = `
    material-icons-outlined
    text-slate-400 dark:text-slate-500
    ${onIconClick || onIconRightClick ? "cursor-pointer hover:text-primary transition-colors" : ""}
  `;

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper with inset shadow */}
      <div className={wrapperClasses}>
        {/* Left icon */}
        {icon && (
          <span
            className={iconClasses}
            onClick={onIconClick}
          >
            {icon}
          </span>
        )}

        {/* Input element */}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          {...props}
        />

        {/* Right icon */}
        {iconRight && (
          <span
            className={iconClasses}
            onClick={onIconRightClick}
          >
            {iconRight}
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-danger mt-1 flex items-center gap-1">
          <span className="material-icons-outlined text-base">error</span>
          {error}
        </p>
      )}
    </div>
  );
});

NeumorphicInput.displayName = "NeumorphicInput";

export default NeumorphicInput;

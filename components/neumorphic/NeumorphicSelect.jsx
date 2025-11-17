"use client";
import React, { forwardRef } from "react";

/**
 * NeumorphicSelect Component
 *
 * A select dropdown component with neumorphic inset design (soft UI).
 * Features label, error state, and custom styling.
 *
 * @param {Object} props
 * @param {string} [props.label] - Label text displayed above the select
 * @param {Array} props.options - Options array: [{ value, label }]
 * @param {string} [props.value] - Selected value
 * @param {function} [props.onChange] - Change handler
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.className] - Additional CSS classes for container
 * @param {string} [props.selectClassName] - Additional CSS classes for select element
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.size='md'] - Select size: 'sm' | 'md' | 'lg'
 * @param {boolean} [props.required=false] - Required field indicator
 */
const NeumorphicSelect = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Seleccionar...",
  className = "",
  selectClassName = "",
  error,
  disabled = false,
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

  // Wrapper classes (inset shadow)
  const wrapperClasses = `
    relative
    flex items-center
    bg-background-light dark:bg-background-dark
    shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark
    rounded-xl
    transition-all duration-200
    ${error ? "ring-2 ring-danger ring-opacity-50" : "focus-within:ring-2 focus-within:ring-primary focus-within:ring-opacity-30"}
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${sizeClasses[size]}
  `.trim().replace(/\s+/g, " ");

  // Select classes
  const selectClasses = `
    flex-1
    bg-transparent
    border-none
    outline-none
    text-slate-700 dark:text-slate-300
    disabled:cursor-not-allowed
    appearance-none
    pr-8
    ${selectClassName}
  `.trim().replace(/\s+/g, " ");

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      {/* Select wrapper with inset shadow */}
      <div className={wrapperClasses}>
        {/* Select element */}
        <select
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={selectClasses}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Dropdown icon */}
        <span className="absolute right-3 pointer-events-none material-icons-outlined text-slate-400 dark:text-slate-500">
          expand_more
        </span>
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

NeumorphicSelect.displayName = "NeumorphicSelect";

export default NeumorphicSelect;

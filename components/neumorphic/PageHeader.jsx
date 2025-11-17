"use client";
import React from "react";
import NeumorphicButton from "./NeumorphicButton";
import ProfileAvatar from "./ProfileAvatar";

/**
 * PageHeader Component
 *
 * A consistent header component for pages with neumorphic design.
 * Features title, breadcrumbs, actions, and user profile.
 *
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} [props.subtitle] - Optional subtitle/description
 * @param {Array} [props.breadcrumbs] - Breadcrumb items: [{ label, href }]
 * @param {React.ReactNode} [props.actions] - Action buttons or components
 * @param {boolean} [props.showUser=false] - Show user avatar and name
 * @param {Object} [props.user] - User data: { name, avatar, email }
 * @param {string} [props.className] - Additional CSS classes
 */
export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  showUser = false,
  user,
  className = "",
  ...props
}) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`} {...props}>
      {/* Left side: Title and breadcrumbs */}
      <div className="flex-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {crumb.label}
                  </span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span className="material-icons-outlined text-xs">
                    chevron_right
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right side: Actions and user */}
      <div className="flex items-center gap-4">
        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}

        {/* User info */}
        {showUser && user && (
          <div className="flex items-center gap-3 pl-4 border-l border-divider-light dark:border-divider-dark">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {user.name}
              </div>
              {user.email && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {user.email}
                </div>
              )}
            </div>
            <ProfileAvatar
              src={user.avatar}
              name={user.name}
              size="md"
            />
          </div>
        )}
      </div>
    </div>
  );
}

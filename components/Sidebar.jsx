"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AnimatedLogo from "@/components/AnimatedLogo";

/**
 * Sidebar Component
 *
 * Application sidebar navigation with collapsible design.
 * Features:
 * - Collapsed mode: narrow icon-only bar
 * - Expanded mode: floating panel with icons and labels (on hover)
 * - Permission-based menu items
 * - Responsive mobile support
 *
 * @param {Object} props
 * @param {number} props.userGroupId - User group ID for permission checks
 * @param {boolean} props.isManager - Manager permission flag
 * @param {boolean} props.isMobileOpen - Whether sidebar is open on mobile
 * @param {function} props.onClose - Callback to close sidebar on mobile
 * @param {boolean} props.isCollapsed - Whether sidebar is in collapsed mode
 * @param {function} props.onToggleCollapse - Callback to toggle collapsed state
 */
export default function Sidebar({
  userGroupId,
  isManager,
  isMobileOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(null);

  // Show icon bar only when collapsed, show expanded panel only when not collapsed
  const showIconBar = isCollapsed;
  const showExpanded = !isCollapsed;

  const toggleTaskMenu = () => setOpenMenu(openMenu === 'tasks' ? null : 'tasks');
  const toggleLeadsMenu = () => setOpenMenu(openMenu === 'leads' ? null : 'leads');
  const toggleToolsMenu = () => setOpenMenu(openMenu === 'tools' ? null : 'tools');

  // Handle link click - close sidebar on mobile
  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  // Menu items configuration
  const menuItems = [
    { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { href: "/control-horario", icon: "schedule", label: "Control Horario", matchStart: true },
    { href: "/contratos", icon: "receipt_long", label: "Contratos" },
    { href: "/comparativas", icon: "compare_arrows", label: "Comparativas" },
    { href: "/notas", icon: "note_alt", label: "Notas Rápidas" },
  ];

  const taskSubItems = [
    { href: "/agenda", icon: "book", label: "Agenda personal" },
  ];

  const leadsSubItems = [
    ...(userGroupId === 1 ? [
      { href: "/campaigns", icon: "campaign", label: "Campañas" },
      { href: "/groups", icon: "groups", label: "Grupos" },
    ] : []),
    { href: "/gestor-lead", icon: "manage_search", label: "Gestor Leads" },
  ];

  const toolsSubItems = [
    ...(userGroupId === 1 ? [
      { href: "/emitir-factura", icon: "receipt_long", label: "Emitir Factura" },
    ] : []),
    { href: "/generar-justo-titulo", icon: "receipt_long", label: "Generar Justo Titulo" },
    { href: "/studio", icon: "edit_note", label: "Studio Contratos" },
  ];

  const bottomItems = [
    { href: "/drive?section=precios", icon: "folder", label: "Drive" },
    { href: "/liquidaciones", icon: "payments", label: "Liquidaciones" },
  ];

  // Check if a path is active
  const isActive = (href, matchStart = false) => {
    if (matchStart) {
      return pathname.startsWith(href.split('?')[0]);
    }
    return pathname === href || pathname === href.split('?')[0];
  };

  // Icon button component for collapsed state
  const IconButton = ({ href, icon, label, active, onClick, isSubmenu = false }) => {
    const content = (
      <span className={`material-icons-outlined text-xl ${active ? "text-primary" : "text-slate-500 dark:text-slate-400"}`}>
        {icon}
      </span>
    );

    const className = `
      w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200
      ${active
        ? "bg-primary/10 shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
        : "hover:bg-slate-100 dark:hover:bg-slate-700"
      }
    `;

    if (onClick) {
      return (
        <button onClick={onClick} className={className} title={label}>
          {content}
        </button>
      );
    }

    return (
      <Link href={href} onClick={handleLinkClick} className={className} title={label}>
        {content}
      </Link>
    );
  };

  // Menu item component for expanded state
  const MenuItem = ({ href, icon, label, active, onClick }) => {
    const content = (
      <>
        <span className={`material-icons-outlined text-xl flex-shrink-0 ${active ? "text-primary" : ""}`}>
          {icon}
        </span>
        <span className={`ml-3 font-medium whitespace-nowrap ${active ? "text-primary font-semibold" : ""}`}>
          {label}
        </span>
      </>
    );

    const className = `
      flex items-center px-4 py-3 rounded-xl transition-all duration-200 w-full
      ${active
        ? "bg-primary/10 text-primary shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary"
      }
    `;

    if (onClick) {
      return (
        <button onClick={onClick} className={className}>
          {content}
          <span className="material-icons-outlined text-sm ml-auto">
            {openMenu ? "expand_less" : "expand_more"}
          </span>
        </button>
      );
    }

    return (
      <Link href={href} onClick={handleLinkClick} className={className}>
        {content}
      </Link>
    );
  };

  // Submenu toggle for expanded state
  const SubMenuToggle = ({ icon, label, isOpen, onClick, menuKey }) => (
    <button
      onClick={onClick}
      className={`
        flex items-center px-4 py-3 rounded-xl transition-all duration-200 w-full
        text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary
      `}
    >
      <span className="material-icons-outlined text-xl flex-shrink-0">{icon}</span>
      <span className="ml-3 font-medium whitespace-nowrap">{label}</span>
      <span className="material-icons-outlined text-sm ml-auto">
        {isOpen ? "expand_less" : "expand_more"}
      </span>
    </button>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          flex h-full
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        {/* Collapsed Icon Bar - Only visible when sidebar is collapsed */}
        {showIconBar && (
          <aside
            className={`
              flex flex-col items-center py-4 px-2
              bg-background-light dark:bg-background-dark
              border-r border-slate-200 dark:border-slate-700
              transition-all duration-300 ease-in-out
              w-16
            `}
          >
          {/* Hamburger / Toggle button */}
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 flex items-center justify-center rounded-xl mb-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <span className="material-icons-outlined text-slate-600 dark:text-slate-400">
              menu
            </span>
          </button>

          {/* Icon-only menu items */}
          <nav className="flex-1 flex flex-col items-center space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <IconButton
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href, item.matchStart)}
              />
            ))}

            {/* Tasks submenu icon */}
            <IconButton
              icon="task_alt"
              label="Tareas"
              active={taskSubItems.some(item => isActive(item.href))}
              onClick={toggleTaskMenu}
            />

            {/* Leads submenu icon */}
            <IconButton
              icon="leaderboard"
              label="Leads"
              active={leadsSubItems.some(item => isActive(item.href))}
              onClick={toggleLeadsMenu}
            />

            {/* Tools submenu icon */}
            <IconButton
              icon="build"
              label="Herramientas"
              active={toolsSubItems.some(item => isActive(item.href))}
              onClick={toggleToolsMenu}
            />

            {/* Separator */}
            <div className="w-8 h-px bg-slate-200 dark:bg-slate-700 my-2" />

            {/* Bottom items */}
            {bottomItems.map((item) => (
              <IconButton
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
              />
            ))}
          </nav>
        </aside>
        )}

        {/* Expanded Panel - Only visible when sidebar is not collapsed */}
        {showExpanded && (
          <aside
            className={`
              flex flex-col
              bg-background-light dark:bg-background-dark
              shadow-xl rounded-r-2xl md:rounded-2xl
              transition-all duration-300 ease-in-out overflow-hidden
              w-72
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <AnimatedLogo size="sm" />
              <button
                onClick={onToggleCollapse}
                className="w-8 h-8 hidden md:flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Colapsar menú"
              >
                <span className="material-icons-outlined text-slate-500 text-sm">
                  chevron_left
                </span>
              </button>

              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <span className="material-icons-outlined text-slate-600 dark:text-slate-400">
                  close
                </span>
              </button>
            </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <MenuItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href, item.matchStart)}
              />
            ))}

            {/* Tasks Submenu */}
            <SubMenuToggle
              icon="task_alt"
              label="Tareas"
              isOpen={openMenu === 'tasks'}
              onClick={toggleTaskMenu}
              menuKey="tasks"
            />
            {openMenu === 'tasks' && (
              <div className="pl-4 space-y-1">
                {taskSubItems.map((item) => (
                  <MenuItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.href)}
                  />
                ))}
              </div>
            )}

            {/* Leads Submenu */}
            <SubMenuToggle
              icon="leaderboard"
              label="Leads"
              isOpen={openMenu === 'leads'}
              onClick={toggleLeadsMenu}
              menuKey="leads"
            />
            {openMenu === 'leads' && (
              <div className="pl-4 space-y-1">
                {leadsSubItems.map((item) => (
                  <MenuItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.href)}
                  />
                ))}
              </div>
            )}

            {/* Tools Submenu */}
            <SubMenuToggle
              icon="build"
              label="Herramientas"
              isOpen={openMenu === 'tools'}
              onClick={toggleToolsMenu}
              menuKey="tools"
            />
            {openMenu === 'tools' && (
              <div className="pl-4 space-y-1">
                {toolsSubItems.map((item) => (
                  <MenuItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.href)}
                  />
                ))}
              </div>
            )}

            {/* Separator */}
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-3" />

            {/* Bottom items */}
            {bottomItems.map((item) => (
              <MenuItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
              />
            ))}
          </nav>
        </aside>
        )}
      </div>
    </>
  );
}

"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
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
 * - Hover to expand on desktop with delay to prevent flickering
 * - Permission-based menu items
 * - Responsive mobile support (click/tap only)
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

  // Hover delay configuration (ms)
  const HOVER_DELAY = 200;

  // Refs for hover timeout management
  const hoverTimeoutRef = useRef(null);
  const sidebarRef = useRef(null);

  // Check if we're on mobile (used to disable hover behavior on touch devices)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle mouse enter - expand sidebar after delay (desktop only)
  const handleMouseEnter = useCallback(() => {
    if (isMobile || isMobileOpen) return;

    // Clear any pending close timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Only expand if currently collapsed
    if (isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        onToggleCollapse?.();
      }, HOVER_DELAY);
    }
  }, [isMobile, isMobileOpen, isCollapsed, onToggleCollapse]);

  // Handle mouse leave - collapse sidebar after delay (desktop only)
  const handleMouseLeave = useCallback(() => {
    if (isMobile || isMobileOpen) return;

    // Clear any pending open timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // Only collapse if currently expanded
    if (!isCollapsed) {
      hoverTimeoutRef.current = setTimeout(() => {
        onToggleCollapse?.();
      }, HOVER_DELAY);
    }
  }, [isMobile, isMobileOpen, isCollapsed, onToggleCollapse]);

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
    { href: "/studio", icon: "edit_note", label: "Contratos Colaboración" },
  ];

  const bottomItems = [
    { href: "/drive", icon: "folder", label: "Drive" },
    // Liquidaciones solo visible para managers
    ...(isManager ? [{ href: "/liquidaciones", icon: "payments", label: "Liquidaciones" }] : []),
  ];

  // Check if a path is active
  const isActive = (href, matchStart = false) => {
    if (matchStart) {
      return pathname.startsWith(href.split('?')[0]);
    }
    return pathname === href || pathname === href.split('?')[0];
  };

  // Unified sidebar item component with animations
  const SidebarItem = ({ href, icon, label, active, isCollapsed, onClick, hasSubmenu, isOpen, onToggle }) => {
    const baseClasses = `
      flex items-center rounded-xl transition-all duration-300
      ${isCollapsed ? 'w-10 h-10 justify-center' : 'w-full px-4 py-3'}
      ${active
        ? "bg-primary/10 shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark"
        : "hover:bg-slate-100 dark:hover:bg-slate-700"
      }
    `;

    const iconClasses = `
      material-icons-outlined text-xl flex-shrink-0 transition-colors duration-300
      ${active ? "text-primary" : "text-slate-500 dark:text-slate-400"}
    `;

    const labelClasses = `
      font-medium whitespace-nowrap transition-all duration-300 overflow-hidden
      ${active ? "text-primary font-semibold" : "text-slate-600 dark:text-slate-400"}
      ${isCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}
    `;

    const content = (
      <>
        <span className={iconClasses}>{icon}</span>
        <span className={labelClasses}>{label}</span>
        {hasSubmenu && !isCollapsed && (
          <span className={`
            material-icons-outlined text-sm ml-auto transition-transform duration-300
            ${isOpen ? 'rotate-180' : 'rotate-0'}
          `}>
            expand_more
          </span>
        )}
      </>
    );

    if (hasSubmenu) {
      return (
        <button onClick={onToggle} className={baseClasses} title={isCollapsed ? label : undefined}>
          {content}
        </button>
      );
    }

    if (href) {
      return (
        <Link href={href} onClick={onClick} className={baseClasses} title={isCollapsed ? label : undefined}>
          {content}
        </Link>
      );
    }

    return (
      <button onClick={onClick} className={baseClasses} title={isCollapsed ? label : undefined}>
        {content}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 md:hidden
          transition-opacity duration-300
          ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          flex flex-col h-full
          bg-background-light dark:bg-background-dark
          border-r border-slate-200 dark:border-slate-700
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          overflow-hidden
        `}
      >
        {/* Header */}
        <div className={`
          flex items-center justify-between p-4
          border-b border-slate-200 dark:border-slate-700
          transition-all duration-300
          ${isCollapsed ? 'justify-center' : ''}
        `}>
          {/* Logo - visible when expanded */}
          <div className={`
            transition-all duration-300 overflow-hidden
            ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}
          `}>
            <AnimatedLogo size="sm" />
          </div>

          {/* Toggle button */}
          <button
            onClick={onToggleCollapse}
            className={`
              w-10 h-10 flex items-center justify-center rounded-xl
              hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors
              ${isCollapsed ? '' : 'hidden md:flex w-8 h-8'}
            `}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <span className="material-icons-outlined text-slate-600 dark:text-slate-400 transition-transform duration-300"
              style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
            >
              {isCollapsed ? 'menu' : 'chevron_left'}
            </span>
          </button>

          {/* Mobile close button - only when expanded on mobile */}
          {!isCollapsed && (
            <button
              onClick={onClose}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <span className="material-icons-outlined text-slate-600 dark:text-slate-400">
                close
              </span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`
          flex-1 overflow-y-auto overflow-x-hidden
          transition-all duration-300
          ${isCollapsed ? 'p-2' : 'p-3'}
        `}>
          <div className={`space-y-1 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
            {menuItems.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href, item.matchStart)}
                isCollapsed={isCollapsed}
                onClick={handleLinkClick}
              />
            ))}

            {/* Agenda Personal - Direct link */}
            <SidebarItem
              href="/agenda"
              icon="book"
              label="Agenda Personal"
              active={isActive("/agenda")}
              isCollapsed={isCollapsed}
              onClick={handleLinkClick}
            />

            {/* Leads Submenu */}
            <SidebarItem
              icon="leaderboard"
              label="Leads"
              active={leadsSubItems.some(item => isActive(item.href))}
              isCollapsed={isCollapsed}
              hasSubmenu
              isOpen={openMenu === 'leads'}
              onToggle={toggleLeadsMenu}
            />
            <div className={`
              overflow-hidden transition-all duration-300
              ${openMenu === 'leads' && !isCollapsed ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}
            `}>
              <div className="pl-4 space-y-1">
                {leadsSubItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.href)}
                    isCollapsed={false}
                    onClick={handleLinkClick}
                  />
                ))}
              </div>
            </div>

            {/* Tools Submenu */}
            <SidebarItem
              icon="build"
              label="Herramientas"
              active={toolsSubItems.some(item => isActive(item.href))}
              isCollapsed={isCollapsed}
              hasSubmenu
              isOpen={openMenu === 'tools'}
              onToggle={toggleToolsMenu}
            />
            <div className={`
              overflow-hidden transition-all duration-300
              ${openMenu === 'tools' && !isCollapsed ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}
            `}>
              <div className="pl-4 space-y-1">
                {toolsSubItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isActive(item.href)}
                    isCollapsed={false}
                    onClick={handleLinkClick}
                  />
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className={`
              h-px bg-slate-200 dark:bg-slate-700 my-3
              transition-all duration-300
              ${isCollapsed ? 'w-8 mx-auto' : 'w-full'}
            `} />

            {/* Bottom items */}
            {bottomItems.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
                isCollapsed={isCollapsed}
                onClick={handleLinkClick}
              />
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

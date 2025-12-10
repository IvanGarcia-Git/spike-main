"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar Component
 *
 * Application sidebar navigation with neumorphic design.
 * Features collapsible submenus and permission-based menu items.
 * Now with responsive support and collapsible mode.
 *
 * @param {Object} props
 * @param {number} props.userGroupId - User group ID for permission checks
 * @param {boolean} props.isManager - Manager permission flag
 * @param {boolean} props.isMobileOpen - Whether sidebar is open on mobile
 * @param {function} props.onClose - Callback to close sidebar on mobile
 * @param {boolean} props.isCollapsed - Whether sidebar is in collapsed mode (icons only)
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
  const [openMenu, setOpenMenu] = useState(null); // null, 'tasks', 'leads', 'tools'

  const toggleTaskMenu = () => setOpenMenu(openMenu === 'tasks' ? null : 'tasks');
  const toggleLeadsMenu = () => setOpenMenu(openMenu === 'leads' ? null : 'leads');
  const toggleToolsMenu = () => setOpenMenu(openMenu === 'tools' ? null : 'tools');

  // Handle link click - close sidebar on mobile
  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  // Menu item component
  const MenuItem = ({ href, icon, label, isActive }) => (
    <Link
      href={href}
      onClick={handleLinkClick}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center p-3 rounded-xl transition-all duration-200
        ${isCollapsed ? "justify-center" : ""}
        ${
          isActive
            ? "shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-primary"
            : "text-slate-600 dark:text-slate-400 hover:text-primary hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark"
        }
      `}
    >
      <span className={`material-icons-outlined flex-shrink-0 ${isActive ? "text-primary" : ""}`}>
        {icon}
      </span>
      {!isCollapsed && (
        <span className={`ml-4 ${isActive ? "font-semibold" : "font-medium"} whitespace-nowrap`}>
          {label}
        </span>
      )}
    </Link>
  );

  // Submenu toggle component
  const SubMenuToggle = ({ icon, label, isOpen, onClick }) => (
    <button
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`
        flex items-center p-3 rounded-xl text-slate-600 dark:text-slate-400
        hover:text-primary hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark
        transition-all duration-200 w-full
        ${isCollapsed ? "justify-center pr-3" : "justify-between pr-2"}
      `}
    >
      <div className={`flex items-center ${isCollapsed ? "" : "flex-1 min-w-0"}`}>
        <span className="material-icons-outlined flex-shrink-0">{icon}</span>
        {!isCollapsed && <span className="ml-4 font-medium whitespace-nowrap">{label}</span>}
      </div>
      {!isCollapsed && (
        <span className="material-icons-outlined text-sm flex-shrink-0 ml-2">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      )}
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

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0
          flex-shrink-0 p-4 overflow-x-hidden
          transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 z-[60]' : '-translate-x-full z-50'}
          md:translate-x-0 md:z-auto
          bg-background-light dark:bg-background-dark
          ${isCollapsed ? 'w-24' : 'w-80'}
        `}
      >
        {/* Close button for mobile - outside the inner container */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-6 right-6 z-[60] w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
            close
          </span>
        </button>

        <div className={`flex flex-col h-full bg-background-light dark:bg-background-dark rounded-xl p-5 overflow-x-hidden shadow-lg md:shadow-none ${isCollapsed ? 'items-center' : ''}`}>
          {/* Logo */}
          <div className={`flex items-center mb-10 p-2 ${isCollapsed ? 'justify-center' : ''}`}>
            {isCollapsed ? (
              <img
                src="/images/logo-icon.png"
                alt="SPIKES"
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <img
                src="/images/logo.png"
                alt="SPIKES Logo"
                className="h-12 w-auto"
              />
            )}
            {isCollapsed && (
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg hidden">
                S
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={onToggleCollapse}
            className={`
              hidden md:flex items-center justify-center w-full p-2 mb-4 rounded-xl
              text-slate-500 hover:text-primary
              hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark
              transition-all duration-200
            `}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <span className="material-icons-outlined">
              {isCollapsed ? "chevron_right" : "chevron_left"}
            </span>
            {!isCollapsed && <span className="ml-2 text-sm font-medium">Colapsar</span>}
          </button>

          {/* Navigation */}
          <nav className={`flex-grow space-y-2 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'w-full' : 'pr-2'}`}>
            {/* Dashboard */}
            <MenuItem
              href="/dashboard"
              icon="dashboard"
              label="Dashboard"
              isActive={pathname === "/dashboard"}
            />

            {/* Control Horario */}
            <MenuItem
              href="/control-horario"
              icon="schedule"
              label="Control Horario"
              isActive={pathname.startsWith("/control-horario")}
            />

            {/* Contratos */}
            <MenuItem
              href="/contratos"
              icon="receipt_long"
              label="Contratos"
              isActive={pathname === "/contratos"}
            />

            {/* Comparativas */}
            <MenuItem
              href="/comparativas"
              icon="compare_arrows"
              label="Comparativas"
              isActive={pathname === "/comparativas"}
            />

            {/* Notas Rápidas */}
            <MenuItem
              href="/notas"
              icon="note_alt"
              label="Notas Rápidas"
              isActive={pathname === "/notas"}
            />

            {/* Tareas Submenu */}
            <SubMenuToggle
              icon="task_alt"
              label="Tareas"
              isOpen={openMenu === 'tasks'}
              onClick={toggleTaskMenu}
            />
            {openMenu === 'tasks' && !isCollapsed && (
              <div className="pl-4 space-y-2">
                <MenuItem
                  href="/agenda"
                  icon="book"
                  label="Agenda personal"
                  isActive={pathname === "/agenda"}
                />
              </div>
            )}

            {/* Leads Submenu */}
            <SubMenuToggle
              icon="leaderboard"
              label="Leads"
              isOpen={openMenu === 'leads'}
              onClick={toggleLeadsMenu}
            />
            {openMenu === 'leads' && !isCollapsed && (
              <div className="pl-4 space-y-2">
                {/* Super Admin only */}
                {userGroupId === 1 && (
                  <>
                    <MenuItem
                      href="/campaigns"
                      icon="campaign"
                      label="Campañas"
                      isActive={pathname === "/campaigns"}
                    />
                    <MenuItem
                      href="/groups"
                      icon="groups"
                      label="Grupos"
                      isActive={pathname === "/groups"}
                    />
                  </>
                )}
                <MenuItem
                  href="/gestor-lead"
                  icon="manage_search"
                  label="Gestor Leads"
                  isActive={pathname === "/gestor-lead"}
                />
              </div>
            )}

            {/* Herramientas Submenu */}
            <SubMenuToggle
              icon="build"
              label="Herramientas"
              isOpen={openMenu === 'tools'}
              onClick={toggleToolsMenu}
            />
            {openMenu === 'tools' && !isCollapsed && (
              <div className="pl-4 space-y-2">
                {/* Super Admin only */}
                {userGroupId === 1 && (
                  <MenuItem
                    href="/emitir-factura"
                    icon="receipt_long"
                    label="Emitir Factura"
                    isActive={pathname === "/emitir-factura"}
                  />
                )}
                <MenuItem
                  href="/generar-justo-titulo"
                  icon="receipt_long"
                  label="Generar Justo Titulo"
                  isActive={pathname === "/generar-justo-titulo"}
                />
                <MenuItem
                  href="/studio"
                  icon="edit_note"
                  label="Studio Contratos"
                  isActive={pathname === "/studio"}
                />
              </div>
            )}

            {/* Drive */}
            <MenuItem
              href="/drive?section=precios"
              icon="folder"
              label="Drive"
              isActive={pathname === "/drive"}
            />

            {/* Liquidaciones */}
            <MenuItem
              href="/liquidaciones"
              icon="payments"
              label="Liquidaciones"
              isActive={pathname === "/liquidaciones"}
            />
          </nav>
        </div>
      </aside>
    </>
  );
}

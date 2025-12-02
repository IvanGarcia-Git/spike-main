"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar Component
 *
 * Application sidebar navigation with neumorphic design.
 * Features collapsible submenus and permission-based menu items.
 * Now with responsive support - hidden on mobile by default.
 *
 * @param {Object} props
 * @param {number} props.userGroupId - User group ID for permission checks
 * @param {boolean} props.isManager - Manager permission flag
 * @param {boolean} props.isMobileOpen - Whether sidebar is open on mobile
 * @param {function} props.onClose - Callback to close sidebar on mobile
 */
export default function Sidebar({ userGroupId, isManager, isMobileOpen = false, onClose }) {
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
      className={`
        flex items-center p-3 rounded-xl transition-all duration-200
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
      <span className={`ml-4 ${isActive ? "font-semibold" : "font-medium"}`}>
        {label}
      </span>
    </Link>
  );

  // Submenu toggle component
  const SubMenuToggle = ({ icon, label, isOpen, onClick }) => (
    <button
      onClick={onClick}
      className="flex justify-between items-center p-3 pr-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all duration-200 w-full"
    >
      <div className="flex items-center flex-1 min-w-0">
        <span className="material-icons-outlined flex-shrink-0">{icon}</span>
        <span className="ml-4 font-medium">{label}</span>
      </div>
      <span className="material-icons-outlined text-sm flex-shrink-0 ml-2">
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

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0
          w-80 flex-shrink-0 p-4 overflow-x-hidden
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 z-[60]' : '-translate-x-full z-50'}
          md:translate-x-0 md:z-auto
          bg-background-light dark:bg-background-dark
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

        <div className="flex flex-col h-full bg-background-light dark:bg-background-dark rounded-xl p-5 overflow-x-hidden shadow-lg md:shadow-none">
          {/* Logo */}
          <div className="flex items-center mb-10 p-2">
            <img
              src="/images/logo.png"
              alt="SPIKES Logo"
              className="h-12 w-auto"
            />
          </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-2 overflow-y-auto overflow-x-hidden pr-2">
          {/* Dashboard */}
          <MenuItem
            href="/dashboard"
            icon="dashboard"
            label="Dashboard"
            isActive={pathname === "/dashboard"}
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
          {openMenu === 'tasks' && (
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
          {openMenu === 'leads' && (
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
          {openMenu === 'tools' && (
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

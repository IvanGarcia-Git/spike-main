"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar Component
 *
 * Application sidebar navigation with neumorphic design.
 * Features collapsible submenus and permission-based menu items.
 *
 * @param {Object} props
 * @param {number} props.userGroupId - User group ID for permission checks
 * @param {boolean} props.isManager - Manager permission flag
 */
export default function Sidebar({ userGroupId, isManager }) {
  const pathname = usePathname();
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  const [showLeadsMenu, setShowLeadsMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const toggleTaskMenu = () => setShowTaskMenu((prev) => !prev);
  const toggleLeadsMenu = () => setShowLeadsMenu((prev) => !prev);
  const toggleToolsMenu = () => setShowToolsMenu((prev) => !prev);

  // Menu item component
  const MenuItem = ({ href, icon, label, isActive }) => (
    <Link
      href={href}
      className={`
        flex items-center p-3 rounded-xl transition-all duration-200
        ${
          isActive
            ? "shadow-neumorphic-inset-light dark:shadow-neumorphic-inset-dark text-primary"
            : "text-slate-600 dark:text-slate-400 hover:text-primary hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark"
        }
      `}
    >
      <span className={`material-icons-outlined ${isActive ? "text-primary" : ""}`}>
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
      className="flex justify-between items-center p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all duration-200 w-full"
    >
      <div className="flex items-center">
        <span className="material-icons-outlined">{icon}</span>
        <span className="ml-4 font-medium">{label}</span>
      </div>
      <span className="material-icons-outlined text-sm">
        {isOpen ? "expand_less" : "expand_more"}
      </span>
    </button>
  );

  return (
    <aside className="w-64 flex-shrink-0 p-4">
      <div className="flex flex-col h-full bg-background-light dark:bg-background-dark rounded-xl p-6">
        {/* Logo */}
        <div className="flex items-center mb-10 p-2 h-8">
          <span className="text-2xl font-bold tracking-wider text-primary">
            SPIKES
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-2 overflow-y-auto">
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
            isOpen={showTaskMenu}
            onClick={toggleTaskMenu}
          />
          {showTaskMenu && (
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
            isOpen={showLeadsMenu}
            onClick={toggleLeadsMenu}
          />
          {showLeadsMenu && (
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
                icon="person_check"
                label="Gestor Leads"
                isActive={pathname === "/gestor-lead"}
              />
            </div>
          )}

          {/* Herramientas Submenu */}
          <SubMenuToggle
            icon="build"
            label="Herramientas"
            isOpen={showToolsMenu}
            onClick={toggleToolsMenu}
          />
          {showToolsMenu && (
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
                icon="edit_document"
                label="Contratos Colaboración"
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

          {/* Usuarios (Manager only) */}
          {isManager && (
            <MenuItem
              href="/usuarios"
              icon="manage_accounts"
              label="Usuarios"
              isActive={pathname === "/usuarios"}
            />
          )}
        </nav>
      </div>
    </aside>
  );
}

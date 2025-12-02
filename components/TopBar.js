"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCookie, deleteCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import * as jose from "jose";

export default function TopBar({ userGroupId, isManager, onMenuClick }) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState("/avatar.png");
  const [userEmail, setUserEmail] = useState("");
  const [userUuid, setUserUuid] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const userDropdownRef = useRef(null);
  const appsRef = useRef(null);
  const settingsRef = useRef(null);
  const notificationsRef = useRef(null);
  const router = useRouter();

  const fetchProfilePicture = async (userId) => {
    const jwtToken = getCookie("factura-token");
    try {
      const response = await authGetFetch(`users/profile-picture/${userId}`, jwtToken);
      if (response.ok) {
        const { profileImageUri } = await response.json();
        setProfileImageUri(profileImageUri || "/avatar.png");
      } else {
        console.error("Error al obtener la imagen de perfil");
      }
    } catch (error) {
      console.error("Error al enviar la solicitud:", error);
      setProfileImageUri("/avatar.png");
    }
  };

  const handleLogout = () => {
    deleteCookie("factura-token");
    router.push("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (appsRef.current && !appsRef.current.contains(event.target)) {
        setIsAppsOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const token = getCookie("factura-token");
    if (token) {
      try {
        const payload = jose.decodeJwt(token);
        fetchProfilePicture(payload.userId);
        setUserEmail(payload.userEmail);
        setUserUuid(payload.userUuid);
      } catch (error) {
        console.error("Error al decodificar el token:", error);
      }
    }

    // Load unread notifications count from localStorage
    const count = localStorage.getItem("totalUnreadNotifications");
    setUnreadNotifications(parseInt(count) || 0);
  }, []);

  return (
    <div className="sticky top-0 z-50 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-700 px-4 md:px-6 py-4 no-print">
      <div className="flex items-center justify-between md:justify-end">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
        >
          <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
            menu
          </span>
        </button>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Apps Button */}
          <div ref={appsRef} className="relative">
            <button
              className="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsAppsOpen((prev) => !prev);
                setIsNotificationsOpen(false);
                setIsUserDropdownOpen(false);
              }}
            >
              <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
                apps
              </span>
            </button>

            {isAppsOpen && (
              <div className="absolute right-0 mt-4 w-72 neumorphic-card bg-background-light dark:bg-background-dark rounded-xl shadow-xl p-4 z-50 max-h-[80vh] overflow-y-auto">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                    Aplicaciones
                  </h3>
                </div>
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      dashboard
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Dashboard
                    </span>
                  </Link>
                  <Link
                    href="/contratos"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      receipt_long
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Contratos
                    </span>
                  </Link>
                  <Link
                    href="/comparativas"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      compare_arrows
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Comparativas
                    </span>
                  </Link>
                  <Link
                    href="/notas"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      note_alt
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Notas
                    </span>
                  </Link>
                  <Link
                    href="/agenda"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      book
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Agenda
                    </span>
                  </Link>
                  <Link
                    href="/gestor-lead"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      manage_search
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Gestor Leads
                    </span>
                  </Link>
                  {userGroupId === 1 && (
                    <>
                      <Link
                        href="/campaigns"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                        onClick={() => setIsAppsOpen(false)}
                      >
                        <span className="material-icons-outlined text-primary text-xl">
                          campaign
                        </span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Campañas
                        </span>
                      </Link>
                      <Link
                        href="/groups"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                        onClick={() => setIsAppsOpen(false)}
                      >
                        <span className="material-icons-outlined text-primary text-xl">
                          groups
                        </span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Grupos
                        </span>
                      </Link>
                      <Link
                        href="/emitir-factura"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                        onClick={() => setIsAppsOpen(false)}
                      >
                        <span className="material-icons-outlined text-primary text-xl">
                          receipt_long
                        </span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Factura
                        </span>
                      </Link>
                    </>
                  )}
                  <Link
                    href="/generar-justo-titulo"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      gavel
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Justo Título
                    </span>
                  </Link>
                  <Link
                    href="/studio"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      edit_note
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Studio
                    </span>
                  </Link>
                  <Link
                    href="/drive?section=precios"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      folder
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Drive
                    </span>
                  </Link>
                  <Link
                    href="/liquidaciones"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-xl">
                      payments
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Liquidaciones
                    </span>
                  </Link>
                  {isManager && (
                    <Link
                      href="/usuarios"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsAppsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        manage_accounts
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Usuarios
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          {isManager && (
            <div ref={settingsRef} className="relative">
              <button
                className="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSettingsOpen((prev) => !prev);
                  setIsAppsOpen(false);
                  setIsNotificationsOpen(false);
                  setIsUserDropdownOpen(false);
                }}
              >
                <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
                  settings
                </span>
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-4 w-72 neumorphic-card bg-background-light dark:bg-background-dark rounded-xl shadow-xl p-4 z-50 max-h-[80vh] overflow-y-auto">
                  <div className="mb-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                      Configuración
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <Link
                      href="/usuarios"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        manage_accounts
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Usuarios
                      </span>
                    </Link>

                    <Link
                      href="/companies"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        apartment
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Compañías
                      </span>
                    </Link>
                    <Link
                      href="/canales"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        hub
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Canales
                      </span>
                    </Link>
                    <Link
                      href="/estados"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        done_all
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Estados
                      </span>
                    </Link>
                    <Link
                      href="/origins"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        local_offer
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Orígenes
                      </span>
                    </Link>
                    <Link
                      href="/users-visibility"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        visibility
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Visibilidad
                      </span>
                    </Link>
                    <Link
                      href="/contract-customize"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        view_column
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Personalizar Columnas
                      </span>
                    </Link>
                    <Link
                      href="/prioridad-leads"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        low_priority
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Prioridad de Leads
                      </span>
                    </Link>
                    <Link
                      href="/notifications-settings"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <span className="material-icons-outlined text-primary text-xl">
                        notifications_active
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Ajustes de Notificaciones
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Button */}
          <Link href="/notificaciones" passHref>
            <div className="relative cursor-pointer">
              <button className="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all">
                <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
                  notifications
                </span>
              </button>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unreadNotifications}
                </span>
              )}
            </div>
          </Link>

          {/* User Avatar */}
          <div ref={userDropdownRef} className="relative">
            <button
              className="w-12 h-12 rounded-full neumorphic-card p-0.5 flex items-center justify-center hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsUserDropdownOpen((prev) => !prev);
                setIsAppsOpen(false);
                setIsSettingsOpen(false);
              }}
            >
              <img
                src={profileImageUri}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </button>

            {isUserDropdownOpen && (
              <div className="absolute right-0 mt-4 w-56 neumorphic-card bg-background-light dark:bg-background-dark rounded-xl shadow-xl p-2 z-50">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                    {userEmail}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Usuario activo
                  </p>
                </div>
                <ul className="py-2">
                  <li>
                    <Link
                      href={`/perfil?uuid=${userUuid}`}
                      className="flex items-center px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <span className="material-icons-outlined text-slate-600 dark:text-slate-300 mr-3 text-xl">
                        person
                      </span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Mi perfil
                      </span>
                    </Link>
                  </li>
                  <li>
                    <button
                      className="w-full flex items-center px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all cursor-pointer"
                      onClick={() => {
                        handleLogout();
                        setIsUserDropdownOpen(false);
                      }}
                    >
                      <span className="material-icons-outlined text-red-600 dark:text-red-400 mr-3 text-xl">
                        logout
                      </span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">
                        Cerrar sesión
                      </span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

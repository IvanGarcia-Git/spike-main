"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCookie, deleteCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import * as jose from "jose";

export default function TopBar() {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAppsOpen, setIsAppsOpen] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState("/avatar.png");
  const [userEmail, setUserEmail] = useState("");
  const [userUuid, setUserUuid] = useState("");
  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const appsRef = useRef(null);
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
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (appsRef.current && !appsRef.current.contains(event.target)) {
        setIsAppsOpen(false);
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
  }, []);

  return (
    <div className="sticky top-0 z-50 bg-background-light dark:bg-background-dark border-b border-slate-200 dark:border-slate-700 px-6 py-4 no-print">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-4">
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
              <div className="absolute right-0 mt-4 w-72 neumorphic-card bg-background-light dark:bg-background-dark rounded-xl shadow-xl p-4 z-50">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
                    Aplicaciones
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Link
                    href="/contratos"
                    className="neumorphic-card-inset p-3 rounded-lg flex flex-col items-center gap-2 hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-2xl">
                      description
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                      Contratos
                    </span>
                  </Link>
                  <Link
                    href="/gestor-lead"
                    className="neumorphic-card-inset p-3 rounded-lg flex flex-col items-center gap-2 hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-2xl">
                      people
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                      Leads
                    </span>
                  </Link>
                  <Link
                    href="/studio"
                    className="neumorphic-card-inset p-3 rounded-lg flex flex-col items-center gap-2 hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-2xl">
                      edit_document
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                      Studio
                    </span>
                  </Link>
                  <Link
                    href="/drive"
                    className="neumorphic-card-inset p-3 rounded-lg flex flex-col items-center gap-2 hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-2xl">
                      folder
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                      Drive
                    </span>
                  </Link>
                  <Link
                    href="/liquidacion"
                    className="neumorphic-card-inset p-3 rounded-lg flex flex-col items-center gap-2 hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-2xl">
                      account_balance
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                      Liquidación
                    </span>
                  </Link>
                  <Link
                    href="/campaigns"
                    className="neumorphic-card-inset p-3 rounded-lg flex flex-col items-center gap-2 hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all"
                    onClick={() => setIsAppsOpen(false)}
                  >
                    <span className="material-icons-outlined text-primary text-2xl">
                      campaign
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                      Campañas
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <Link href="/configuracion">
            <button className="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all">
              <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
                settings
              </span>
            </button>
          </Link>

          {/* Notifications Button */}
          <div ref={notificationsRef} className="relative">
            <button
              className="w-12 h-12 rounded-full neumorphic-button flex items-center justify-center hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all relative"
              onClick={(e) => {
                e.stopPropagation();
                setIsNotificationsOpen((prev) => !prev);
                setIsAppsOpen(false);
                setIsUserDropdownOpen(false);
              }}
            >
              <span className="material-icons-outlined text-slate-600 dark:text-slate-300">
                notifications
              </span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-4 w-80 neumorphic-card bg-background-light dark:bg-background-dark rounded-xl shadow-xl p-4 z-50">
                <div className="mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Notificaciones
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tienes 3 notificaciones nuevas
                  </p>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="neumorphic-card-inset p-3 rounded-lg hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className="material-icons-outlined text-blue-500 text-xl">
                        info
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Nueva actualización disponible
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Hace 5 minutos
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="neumorphic-card-inset p-3 rounded-lg hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className="material-icons-outlined text-green-500 text-xl">
                        check_circle
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Contrato aprobado
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Hace 1 hora
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="neumorphic-card-inset p-3 rounded-lg hover:shadow-neumorphic-light dark:hover:shadow-neumorphic-dark transition-all cursor-pointer">
                    <div className="flex items-start gap-3">
                      <span className="material-icons-outlined text-orange-500 text-xl">
                        warning
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Revisión pendiente
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Hace 2 horas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button className="w-full text-center text-xs font-medium text-primary hover:underline">
                    Ver todas las notificaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div ref={userDropdownRef} className="relative">
            <button
              className="w-12 h-12 rounded-full neumorphic-card p-0.5 flex items-center justify-center hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsUserDropdownOpen((prev) => !prev);
                setIsAppsOpen(false);
                setIsNotificationsOpen(false);
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

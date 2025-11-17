"use client";
import { useRef, useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import * as jose from "jose";
import localFont from "next/font/local";
import { getCookie } from "cookies-next";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const LayoutContext = createContext(null);

export const useLayout = () => useContext(LayoutContext);

export default function RootLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userGroupId, setUserGroupId] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  const [showLeadsMenu, setShowLeadsMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [sideBarHidden, setSideBarHidden] = useState(false);

  const pathname = usePathname();

  const toggleTaskMenu = () => setShowTaskMenu((prev) => !prev);
  const toggleLeadsMenu = () => setShowLeadsMenu((prev) => !prev);
  const toggleToolsMenu = () => setShowToolsMenu((prev) => !prev);

  const checkAuthentication = () => {
    const token = getCookie("factura-token");
    if (token) {
      try {
        const payload = jose.decodeJwt(token);
        setUserGroupId(payload.groupId);
        setIsManager(payload.isManager);
        return true;
      } catch (error) {
        console.error("Error al decodificar el token:", error);
        return false;
      }
    }
    return false;
  };

  useEffect(() => {
    const authenticated = checkAuthentication();
    setIsAuthenticated(authenticated);
  }, [pathname]);

  return (
    <html lang="es">
      <head>
        <title>Spikes</title>
        <meta name="description" content="Spikes CRM" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LayoutContext.Provider value={{ sideBarHidden, setSideBarHidden }}>
          {isAuthenticated ? (
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              {!sideBarHidden && (
                <aside className="w-64 flex-shrink-0 p-4">
                  <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center mb-10 p-2 h-8">
                      <span className="text-2xl font-bold tracking-wider text-slate-800 dark:text-slate-100">
                        SPIKES
                      </span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-grow space-y-2">
                      <Link
                        href="/dashboard"
                        className={`flex items-center p-3 rounded-lg ${
                          pathname === "/dashboard"
                            ? "neumorphic-button active"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        } transition`}
                      >
                        <span className={`material-icons-outlined ${pathname === "/dashboard" ? "text-primary" : ""}`}>
                          dashboard
                        </span>
                        <span className={`ml-4 ${pathname === "/dashboard" ? "font-semibold text-primary" : "font-medium"}`}>
                          Dashboard
                        </span>
                      </Link>

                      <Link
                        href="/contratos"
                        className={`flex items-center p-3 rounded-lg ${
                          pathname === "/contratos"
                            ? "neumorphic-button active"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        } transition`}
                      >
                        <span className={`material-icons-outlined ${pathname === "/contratos" ? "text-primary" : ""}`}>
                          receipt_long
                        </span>
                        <span className={`ml-4 ${pathname === "/contratos" ? "font-semibold text-primary" : "font-medium"}`}>
                          Contratos
                        </span>
                      </Link>

                      <Link
                        href="/comparativas"
                        className={`flex items-center p-3 rounded-lg ${
                          pathname === "/comparativas"
                            ? "neumorphic-button active"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        } transition`}
                      >
                        <span className={`material-icons-outlined ${pathname === "/comparativas" ? "text-primary" : ""}`}>
                          compare_arrows
                        </span>
                        <span className={`ml-4 ${pathname === "/comparativas" ? "font-semibold text-primary" : "font-medium"}`}>
                          Comparativas
                        </span>
                      </Link>

                      <Link
                        href="/notas"
                        className={`flex items-center p-3 rounded-lg ${
                          pathname === "/notas"
                            ? "neumorphic-button active"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        } transition`}
                      >
                        <span className={`material-icons-outlined ${pathname === "/notas" ? "text-primary" : ""}`}>
                          note_alt
                        </span>
                        <span className={`ml-4 ${pathname === "/notas" ? "font-semibold text-primary" : "font-medium"}`}>
                          Notas Rápidas
                        </span>
                      </Link>

                      {/* Tareas Submenu */}
                      <button
                        onClick={toggleTaskMenu}
                        className="flex justify-between items-center p-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition w-full"
                      >
                        <div className="flex items-center">
                          <span className="material-icons-outlined">task_alt</span>
                          <span className="ml-4 font-medium">Tareas</span>
                        </div>
                        <span className="material-icons-outlined text-sm">
                          {showTaskMenu ? "expand_less" : "expand_more"}
                        </span>
                      </button>

                      {showTaskMenu && (
                        <div className="pl-4">
                          <Link
                            href="/agenda"
                            className={`flex items-center p-3 rounded-lg ${
                              pathname === "/agenda"
                                ? "neumorphic-button active"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            } transition`}
                          >
                            <span className={`material-icons-outlined ${pathname === "/agenda" ? "text-primary" : ""}`}>
                              book
                            </span>
                            <span className={`ml-4 ${pathname === "/agenda" ? "font-semibold text-primary" : "font-medium"}`}>
                              Agenda personal
                            </span>
                          </Link>
                        </div>
                      )}

                      {/* Leads Submenu */}
                      <button
                        onClick={toggleLeadsMenu}
                        className="flex justify-between items-center p-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition w-full"
                      >
                        <div className="flex items-center">
                          <span className="material-icons-outlined">leaderboard</span>
                          <span className="ml-4 font-medium">Leads</span>
                        </div>
                        <span className="material-icons-outlined text-sm">
                          {showLeadsMenu ? "expand_less" : "expand_more"}
                        </span>
                      </button>

                      {showLeadsMenu && (
                        <div className="pl-4 space-y-2">
                          {userGroupId === 1 && (
                            <>
                              <Link
                                href="/campaigns"
                                className={`flex items-center p-3 rounded-lg ${
                                  pathname === "/campaigns"
                                    ? "neumorphic-button active"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                } transition`}
                              >
                                <span className={`material-icons-outlined ${pathname === "/campaigns" ? "text-primary" : ""}`}>
                                  campaign
                                </span>
                                <span className={`ml-4 ${pathname === "/campaigns" ? "font-semibold text-primary" : "font-medium"}`}>
                                  Campañas
                                </span>
                              </Link>

                              <Link
                                href="/groups"
                                className={`flex items-center p-3 rounded-lg ${
                                  pathname === "/groups"
                                    ? "neumorphic-button active"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                                } transition`}
                              >
                                <span className={`material-icons-outlined ${pathname === "/groups" ? "text-primary" : ""}`}>
                                  groups
                                </span>
                                <span className={`ml-4 ${pathname === "/groups" ? "font-semibold text-primary" : "font-medium"}`}>
                                  Grupos
                                </span>
                              </Link>
                            </>
                          )}

                          <Link
                            href="/gestor-lead"
                            className={`flex items-center p-3 rounded-lg ${
                              pathname === "/gestor-lead"
                                ? "neumorphic-button active"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            } transition`}
                          >
                            <span className={`material-icons-outlined ${pathname === "/gestor-lead" ? "text-primary" : ""}`}>
                              person_check
                            </span>
                            <span className={`ml-4 ${pathname === "/gestor-lead" ? "font-semibold text-primary" : "font-medium"}`}>
                              Gestor Leads
                            </span>
                          </Link>
                        </div>
                      )}

                      {/* Herramientas Submenu */}
                      <button
                        onClick={toggleToolsMenu}
                        className="flex justify-between items-center p-3 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition w-full"
                      >
                        <div className="flex items-center">
                          <span className="material-icons-outlined">build</span>
                          <span className="ml-4 font-medium">Herramientas</span>
                        </div>
                        <span className="material-icons-outlined text-sm">
                          {showToolsMenu ? "expand_less" : "expand_more"}
                        </span>
                      </button>

                      {showToolsMenu && (
                        <div className="pl-4 space-y-2">
                          {userGroupId === 1 && (
                            <Link
                              href="/emitir-factura"
                              className={`flex items-center p-3 rounded-lg ${
                                pathname === "/emitir-factura"
                                  ? "neumorphic-button active"
                                  : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                              } transition`}
                            >
                              <span className={`material-icons-outlined ${pathname === "/emitir-factura" ? "text-primary" : ""}`}>
                                receipt_long
                              </span>
                              <span className={`ml-4 ${pathname === "/emitir-factura" ? "font-semibold text-primary" : "font-medium"}`}>
                                Emitir Factura
                              </span>
                            </Link>
                          )}

                          <Link
                            href="/generar-justo-titulo"
                            className={`flex items-center p-3 rounded-lg ${
                              pathname === "/generar-justo-titulo"
                                ? "neumorphic-button active"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            } transition`}
                          >
                            <span className={`material-icons-outlined ${pathname === "/generar-justo-titulo" ? "text-primary" : ""}`}>
                              receipt_long
                            </span>
                            <span className={`ml-4 ${pathname === "/generar-justo-titulo" ? "font-semibold text-primary" : "font-medium"}`}>
                              Generar Justo Titulo
                            </span>
                          </Link>

                          <Link
                            href="/studio"
                            className={`flex items-center p-3 rounded-lg ${
                              pathname === "/studio"
                                ? "neumorphic-button active"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                            } transition`}
                          >
                            <span className={`material-icons-outlined ${pathname === "/studio" ? "text-primary" : ""}`}>
                              edit_document
                            </span>
                            <span className={`ml-4 ${pathname === "/studio" ? "font-semibold text-primary" : "font-medium"}`}>
                              Contratos Colaboración
                            </span>
                          </Link>
                        </div>
                      )}

                      <Link
                        href="/drive?section=precios"
                        className={`flex items-center p-3 rounded-lg ${
                          pathname === "/drive"
                            ? "neumorphic-button active"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        } transition`}
                      >
                        <span className={`material-icons-outlined ${pathname === "/drive" ? "text-primary" : ""}`}>
                          folder
                        </span>
                        <span className={`ml-4 ${pathname === "/drive" ? "font-semibold text-primary" : "font-medium"}`}>
                          Drive
                        </span>
                      </Link>

                      <Link
                        href="/liquidaciones"
                        className={`flex items-center p-3 rounded-lg ${
                          pathname === "/liquidaciones"
                            ? "neumorphic-button active"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        } transition`}
                      >
                        <span className={`material-icons-outlined ${pathname === "/liquidaciones" ? "text-primary" : ""}`}>
                          payments
                        </span>
                        <span className={`ml-4 ${pathname === "/liquidaciones" ? "font-semibold text-primary" : "font-medium"}`}>
                          Liquidaciones
                        </span>
                      </Link>

                      {isManager && (
                        <Link
                          href="/usuarios"
                          className={`flex items-center p-3 rounded-lg ${
                            pathname === "/usuarios"
                              ? "neumorphic-button active"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                          } transition`}
                        >
                          <span className={`material-icons-outlined ${pathname === "/usuarios" ? "text-primary" : ""}`}>
                            manage_accounts
                          </span>
                          <span className={`ml-4 ${pathname === "/usuarios" ? "font-semibold text-primary" : "font-medium"}`}>
                            Usuarios
                          </span>
                        </Link>
                      )}
                    </nav>
                  </div>
                </aside>
              )}

              {/* Main content */}
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          ) : (
            <div className="w-full h-screen">
              {children}
            </div>
          )}

          <ToastContainer
            position="top-right"
            autoClose={5000}
            newestOnTop={true}
            hideProgressBar={true}
          />
        </LayoutContext.Provider>
      </body>
    </html>
  );
}

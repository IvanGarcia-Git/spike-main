"use client";
import { useRef, useState, useEffect, createContext, useContext, use } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import Link from "next/link";
import Image from "next/image";
import * as jose from "jose";
import localFont from "next/font/local";
import { getCookie, deleteCookie } from "cookies-next";
import { FaEye } from "react-icons/fa";
import { CiBellOn } from "react-icons/ci";
import { FiSettings, FiPower } from "react-icons/fi";
import { FaUserTag } from "react-icons/fa";
import { CiBoxList } from "react-icons/ci";
import { BsGrid3X3Gap } from "react-icons/bs";
import { MdEditNotifications, MdLowPriority } from "react-icons/md";
import "./globals.css";
import "./css/sidebar.css";
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

const quickAccessMenuItems = [
  {
    name: "Contratos",
    href: "/contratos",
    icon: "leaderboard",
  },
  {
    name: "Comparativas",
    href: "/comparativas",
    icon: "analytics",
  },
  {
    name: "Notas",
    href: "/notas",
    icon: "note",
  },
  {
    name: "Agenda",
    href: "/agenda",
    icon: "book",
  },
  {
    name: "Campañas",
    href: "/campaigns",
    icon: "campaign",
  },
  {
    name: "Grupos",
    href: "/groups",
    icon: "groups",
  },
  {
    name: "Leads",
    href: "/gestor-lead",
    icon: "person_check",
  },
  {
    name: "Factura",
    href: "/emitir-factura",
    icon: "receipt_long",
    onlyAdmin: true,
  },
  {
    name: "Justo T.",
    href: "/generar-justo-titulo",
    icon: "receipt_long",
  },
  {
    name: "Drive",
    href: "/drive?section=precios",
    icon: "folder",
  },
  {
    name: "Liquid...",
    href: "/liquidaciones",
    icon: "payments",
  },
  {
    name: "Studio",
    href: "/studio",
    icon: "edit_document",
  },
];

const LayoutContext = createContext(null);

export const useLayout = () => useContext(LayoutContext);

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userGroupId, setUserGroupId] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [showTopToolsMenu, setShowTopToolsMenu] = useState(false);
  const [showTaskMenu, setShowTaskMenu] = useState(false);
  const [showLeadsMenu, setShowLeadsMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState("/avatar.png");
  const [userEmail, setUserEmail] = useState("");
  const [userUuid, setUserUuid] = useState("");
  const [showQuickAccessMenu, setShowQuickAccessMenu] = useState(false);

  const [sideBarHidden, setSideBarHidden] = useState(false);

  const userDropdownRef = useRef(null);
  const configMenuRef = useRef(null);
  const topToolsMenuRef = useRef(null);
  const quickAccessRef = useRef(null);

  const toggleTaskMenu = () => {
    setShowTaskMenu((prev) => !prev);
  };

  const toggleConfigMenu = () => {
    setShowConfigMenu((prev) => !prev);
  };

  const toggleQuickAccessMenu = () => {
    setShowQuickAccessMenu((prev) => !prev);
  };

  const toggleLeadsMenu = () => {
    setShowLeadsMenu((prev) => !prev);
  };

  const toggleToolsMenu = () => {
    setShowToolsMenu((prev) => !prev);
  };

  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    deleteCookie("factura-token");
    setIsAuthenticated(false);
    router.push("/");
  };

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
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }

      if (configMenuRef.current && !configMenuRef.current.contains(event.target)) {
        setShowConfigMenu(false);
      }

      if (topToolsMenuRef.current && !topToolsMenuRef.current.contains(event.target)) {
        setShowTopToolsMenu(false);
      }

      if (quickAccessRef.current && !quickAccessRef.current.contains(event.target)) {
        setShowQuickAccessMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
  // Si el usuario está autenticado, busca sus datos.
  if (isAuthenticated) {
    const token = getCookie("factura-token");
    if (token) {
      try {
        const payload = jose.decodeJwt(token);
        fetchProfilePicture(payload.userId);
        setUserEmail(payload.userEmail);
        setUserUuid(payload.userUuid);
      } catch (error) {
        console.error("Error al decodificar el token:", error);
        handleLogout();
      }
    }
  } else {
    setProfileImageUri("/avatar.png");
    setUserEmail("");
    setUserUuid("");
  }
}, [isAuthenticated]);

  useEffect(() => {
    const authenticated = checkAuthentication();
    setIsAuthenticated(authenticated);
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <html lang="es">
      <head>
        <title>Spikes</title>
        <meta name="description" content="Spikes CRM" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LayoutContext.Provider value={{ sideBarHidden, setSideBarHidden }}>
          {isAuthenticated && (
            <>
              <div className="sticky top-0 left-0 w-full h-12 bg-background z-50 flex items-center justify-end pr-4 space-x-6 mt-1">
              <div ref={quickAccessRef} className="relative">
                <div className="cursor-pointer" onClick={
                  () => {
                    toggleQuickAccessMenu();
                  }
                }>
                  <BsGrid3X3Gap className="text-gray-800" size={26} />
                </div>
                {showQuickAccessMenu && (
                  <div className="absolute right-0 mt-4 bg-white shadow-lg rounded-lg text-black z-50 min-w-max">
                    <ul className="sidebar-menu grid grid-cols-3 gap-2 px-4 py-2">
                      {quickAccessMenuItems.map((item) => (
                        item.onlyAdmin && userGroupId !== 1 ? null : (
                        <li
                          key={item.name}
                          onClick={() => {
                            setShowQuickAccessMenu(false);
                          }}
                          className="relative h-24 w-24"
                        >
                          <Link
                            href={item.href}
                            className={`flex flex-col items-center justify-center rounded-full text-black hover:bg-gray-300 w-full h-full ${
                              pathname === item.href ? "bg-backgroundHover" : ""
                            }`}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: "40px" }}>{item.icon}</span>
                            <span className="compact-title text-sm">{item.name}</span>
                          </Link>
                        </li>
                        )
                      ))}
                    </ul>
                  </div>
                )}
                </div>

                {isManager && (
                  <div ref={configMenuRef} className="relative">
                    {/* Ícono de Configuración */}
                    <div
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevenir cierre del menú
                        toggleConfigMenu();
                      }}
                    >
                      <FiSettings className="text-gray-800" size={24} />
                    </div>

                    {/* Menú Desplegable */}
                    {showConfigMenu && (
                      <div className="absolute right-0 mt-4 w-64 bg-white shadow-lg rounded-lg text-black z-50">
                        <ul className="sidebar-menu flex flex-col pl-4 py-2">
                          <li
                            onClick={() => {
                              setShowConfigMenu(false);
                            }}
                            className="relative"
                          >
                            <Link
                              href="/usuarios"
                              className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                pathname === "/usuarios" ? "bg-backgroundHover" : ""
                              }`}
                            >
                              <span className="material-symbols-outlined">manage_accounts</span>
                              <span className="compact-title">Usuarios</span>
                            </Link>
                          </li>

                          {userGroupId === 1 && (
                            <>
                              <li
                                onClick={() => {
                                  setShowConfigMenu(false);
                                }}
                                className="relative"
                              >
                                <Link
                                  href="/companies"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/companies" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">apartment</span>
                                  <span className="compact-title">Compañías</span>
                                </Link>
                              </li>
                              <li
                                onClick={() => {
                                  setShowConfigMenu(false);
                                }}
                                className="relative"
                              >
                                <Link
                                  href="/canales"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/canales" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">valve</span>
                                  <span className="compact-title">Canales</span>
                                </Link>
                              </li>
                              <li
                                onClick={() => {
                                  setShowConfigMenu(false);
                                }}
                                className="relative"
                              >
                                <Link
                                  href="/estados"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/estados" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">done_all</span>
                                  <span className="compact-title">Estados</span>
                                </Link>
                              </li>
                              <li
                                onClick={() => {
                                  setShowConfigMenu(false);
                                }}
                                className="relative"
                              >
                                <Link
                                  href="/origins"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/origins" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">
                                    <FaUserTag />
                                  </span>
                                  <span className="compact-title">Orígenes</span>
                                </Link>
                              </li>
                              <li
                                onClick={() => {
                                  setShowConfigMenu(false);
                                }}
                                className="relative"
                              >
                                <Link
                                  href="/users-visibility"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/users-visibility" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">
                                    <FaEye />
                                  </span>
                                  <span className="compact-title">Visibilidad</span>
                                </Link>
                              </li>
                              <li
                                onClick={() => {
                                  setShowConfigMenu(false);
                                }}
                                className="relative"
                              >
                                <Link
                                  href="/contract-customize"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/contract-customize" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">
                                    <CiBoxList />
                                  </span>
                                  <span className="compact-title">Personalizar Columnas</span>
                                </Link>
                              </li>
                              <li
                                onClick={() => {
                                  setShowConfigMenu(false);
                                }}
                                className="relative"
                              >
                                <Link
                                  href="/prioridad-leads"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/prioridad-leads" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">
                                    <MdLowPriority />
                                  </span>
                                  <span className="compact-title">Prioridad de Leads</span>
                                </Link>
                              </li>
                              <li
                                onClick={() => {
                                  setShowConfigMenu(false);
                                }}
                                className="relative"
                              >
                                <Link
                                  href="/notifications-settings"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/notifications-settings"
                                      ? "bg-backgroundHover"
                                      : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">
                                    <MdEditNotifications />
                                  </span>
                                  <span className="compact-title">Ajustes de Notificaciones</span>
                                </Link>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <Link href="/notificaciones" passHref>
                  <div className="relative cursor-pointer">
                    <CiBellOn className="text-gray-800" size={28} />
                    {localStorage.getItem("totalUnreadNotifications") > 0 && (
                      <span className="absolute -top-2 -right-2 text-white bg-red-600 rounded-full px-2 py-0.5 text-xs">
                        {localStorage.getItem("totalUnreadNotifications")}
                      </span>
                    )}
                  </div>
                </Link>

                <div ref={userDropdownRef} className="relative">
                  <div
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsUserDropdownOpen((prev) => !prev);
                    }}
                  >
                    <img
                      src={profileImageUri}
                      alt="Avatar"
                      className="w-9 h-9 bg-blue-500/50 rounded-full"
                    />
                  </div>

                  {isUserDropdownOpen && (
                    <div className="absolute right-4 mt-4 w-48 bg-white shadow-lg rounded-lg text-black z-50">
                      <ul className="py-2">
                        <li className="flex items-center px-4 py-2">
                          <Link href={`/perfil?uuid=${userUuid}`} className="hover:underline">
                            <p className="text-gray-700 font-medium">Mi perfil</p>
                          </Link>
                        </li>
                        <li className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                          <FiPower className="text-gray-600 mr-2" size={18} />
                          <button
                            className="text-gray-700 font-medium hover:text-gray-900"
                            onClick={() => {
                              handleLogout();
                              setIsUserDropdownOpen(false);
                            }}
                          >
                            Cerrar sesión
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {!sidebarOpen && (
                <button
                  onClick={toggleSidebar}
                  className="fixed bottom-4 left-4 z-50 p-2 bg-background rounded-full text-black shadow-lg lg:hidden"
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
              )}
              {/* Sidebar */}
              {!sideBarHidden && (
                <aside
                  id="sidebar"
                  className={`sidebar transition-all duration-500 ease-in-out fixed top-0 left-0 lg:relative lg:w-72 h-screen z-[60] ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                  } lg:translate-x-0`}
                >
                  {sidebarOpen && (
                    <div
                      onClick={toggleSidebar}
                      className="fixed inset-0 bg-background lg:hidden"
                    ></div>
                  )}

                  <div
                    id="sidebar-content"
                    className="sidebar-content transition-all duration-300 ease-in-out h-screen w-72 overflow-auto scrollbars bg-background"
                  >
                    {/* Botón de cerrar */}
                    <button
                      onClick={toggleSidebar}
                      className="absolute top-4 right-4 z-50 p-2 bg-background rounded-full lg:hidden"
                    >
                      <span className="material-symbols-outlined text-black">close</span>
                    </button>
                    <Link href="/" className="sidebar-logo pt-4 pb-2 pl-6 flex items-center w-full">
                      <Image
                        src="/images/logo.svg"
                        alt="Spikes Logo"
                        width={36}
                        height={36}
                        className="object-contain z-50"
                      />
                      <h4 className="text-2xl font-medium tracking-wide compact-hide text-black ml-3 z-50">
                        Spikes
                      </h4>
                    </Link>

                    {/* Menú */}
                    <div className="w-full inline-flex flex-col px-3 pb-3 mt-4">
                      <ul className="sidebar-menu flex flex-col">
                        <li className="relative">
                          <Link
                            href="/contratos"
                            className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                              pathname === "/contratos" ? "bg-backgroundHover" : ""
                            }`}
                          >
                            <span className="material-symbols-outlined">leaderboard</span>
                            <span className="compact-title">Contratos</span>
                          </Link>
                        </li>
                        <li className="relative">
                          <Link
                            href="/comparativas"
                            className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                              pathname === "/comparativas" ? "bg-backgroundHover" : ""
                            }`}
                          >
                            <span className="material-symbols-outlined">analytics</span>
                            <span className="compact-title">Comparativas</span>
                          </Link>
                        </li>
                        <li className="relative">
                          <Link
                            href="/notas"
                            className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                              pathname === "/notas" ? "bg-backgroundHover" : ""
                            }`}
                          >
                            <span className="material-symbols-outlined">note</span>
                            <span className="compact-title">Notas Rápidas</span>
                          </Link>
                        </li>
                      </ul>
                      <div className="z-50 compact-hide">
                        <button
                          onClick={toggleTaskMenu}
                          className="flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300"
                        >
                          <span className="material-symbols-outlined">checklist</span>
                          <span>Tareas</span>
                          <span className="material-symbols-outlined">
                            {showTaskMenu ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                      </div>

                      {showTaskMenu && (
                        <ul className="sidebar-menu flex flex-col pl-4">
                          <li className="relative">
                            <Link
                              href="/agenda"
                              className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                pathname === "/agenda" ? "bg-backgroundHover" : ""
                              }`}
                            >
                              <span className="material-symbols-outlined">book</span>
                              <span className="compact-title">Agenda personal</span>
                            </Link>
                          </li>
                        </ul>
                      )}

                      <div className="z-50 compact-hide">
                        <button
                          onClick={toggleLeadsMenu}
                          className="flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300"
                        >
                          <span className="material-symbols-outlined">fact_check</span>
                          <span>Leads</span>
                          <span className="material-symbols-outlined">
                            {showLeadsMenu ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                      </div>

                      {showLeadsMenu && (
                        <ul className="sidebar-menu flex flex-col pl-4">
                          {userGroupId === 1 && (
                            <>
                              <li className="relative">
                                <Link
                                  href="/campaigns"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/campaigns" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">campaign</span>
                                  <span className="compact-title">Campañas</span>
                                </Link>
                              </li>
                              <li className="relative">
                                <Link
                                  href="/groups"
                                  className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                    pathname === "/groups" ? "bg-backgroundHover" : ""
                                  }`}
                                >
                                  <span className="material-symbols-outlined">groups</span>
                                  <span className="compact-title">Grupos</span>
                                </Link>
                              </li>
                            </>
                          )}
                          <li className="relative">
                            <Link
                              href="/gestor-lead"
                              className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                pathname === "/gestor-lead" ? "bg-backgroundHover" : ""
                              }`}
                            >
                              <span className="material-symbols-outlined">person_check</span>
                              <span className="compact-title">Gestor Leads</span>
                            </Link>
                          </li>
                        </ul>
                      )}

                      <div className="z-50 compact-hide">
                        <button
                          onClick={toggleToolsMenu}
                          className="flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300"
                        >
                          <span className="material-symbols-outlined">build</span>
                          <span>Herramientas</span>
                          <span className="material-symbols-outlined">
                            {showToolsMenu ? "expand_less" : "expand_more"}
                          </span>
                        </button>
                      </div>

                      {showToolsMenu && (
                        <ul className="sidebar-menu flex flex-col pl-4">
                          {userGroupId === 1 && (
                            <li className="relative">
                              <Link
                                href="/emitir-factura"
                                className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                  pathname === "/emitir-factura" ? "bg-backgroundHover" : ""
                                }`}
                              >
                                <span className="material-symbols-outlined">receipt_long</span>
                                <span className="compact-title">Emitir Factura</span>
                              </Link>
                            </li>
                          )}
                          <li className="relative">
                            <Link
                              href="/generar-justo-titulo"
                              className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                pathname === "/generar-justo-titulo" ? "bg-backgroundHover" : ""
                              }`}
                            >
                              <span className="material-symbols-outlined">receipt_long</span>
                              <span className="compact-title">Generar Justo Titulo</span>
                            </Link>
                          </li>
                          <li className="relative">
                            <Link
                              href="/studio"
                              className={`flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                pathname === "/studio" ? "bg-backgroundHover" : ""
                              }`}
                            >
                              <span className="material-symbols-outlined">edit_document</span>
                              <span className="compact-title">Studio</span>
                            </Link>
                          </li>
                        </ul>
                      )}

                      <ul className="sidebar-menu flex flex-col">
                        <li className="relative">
                          <Link
                            href="/drive?section=precios"
                            className={`
                                      flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                        pathname === "/drive" ? "bg-backgroundHover" : ""
                                      }
                                    `}
                          >
                            <span className="material-symbols-outlined">folder</span>
                            <span className="compact-title">Drive</span>
                          </Link>
                        </li>
                      </ul>

                      <ul className="sidebar-menu flex flex-col">
                        <li className="relative">
                          <Link
                            href="/liquidaciones"
                            className={`
                                      flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                        pathname === "/liquidaciones" ? "bg-backgroundHover" : ""
                                      }
                                    `}
                          >
                            <span className="material-symbols-outlined">payments</span>
                            <span className="compact-title">Liquidaciones</span>
                          </Link>
                        </li>
                        <li className="relative">
                          <Link
                            href="/studio"
                            className={`
                                      flex flex-row items-center gap-3 py-3 pl-4 pr-6 mb-1 rounded-full text-black hover:bg-gray-300 ${
                                        pathname === "/studio" ? "bg-backgroundHover" : ""
                                      }
                                    `}
                          >
                            <span className="material-symbols-outlined">edit_document</span>
                            <span className="compact-title">Contratos</span>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </aside>
              )}
            </>
          )}

          <div className={`flex justify-center items-center ${isAuthenticated ? "lg:ml-72" : ""} `}>
            <div className="w-full bg-white shadow-none rounded-lg overflow-y-auto h-full md:h-auto">
              {children}
            </div>
          </div>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            newestOnTop={true}
            hideProgressBar={true}
            className="mt-12"
          />
        </LayoutContext.Provider>
      </body>
    </html>
  );
}

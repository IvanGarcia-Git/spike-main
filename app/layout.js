"use client";
import { useRef, useState, useEffect, createContext, useContext, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import * as jose from "jose";
import localFont from "next/font/local";
import { getCookie } from "cookies-next";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import ClockInReminder from "@/components/time-tracking/clock-in-reminder.component";
import "./globals.css";
import "./animations.css";
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

/**
 * Check if a valid auth token exists.
 * Returns { authenticated: boolean, payload: object|null }
 */
function checkAuthToken() {
  const token = getCookie("factura-token");
  if (!token) return { authenticated: false, payload: null };
  try {
    const payload = jose.decodeJwt(token);
    // Check if token is expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return { authenticated: false, payload: null };
    }
    return { authenticated: true, payload };
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return { authenticated: false, payload: null };
  }
}

export default function RootLayout({ children }) {
  // Initialize isAuthenticated with lazy state — check token immediately
  // This prevents the flash where the app shows the login view before
  // the useEffect runs on navigation
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const { authenticated } = checkAuthToken();
    return authenticated;
  });
  const [userGroupId, setUserGroupId] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [sideBarHidden, setSideBarHidden] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const pathname = usePathname();

  // Update auth state on route change
  // This ensures user data (groupId, isManager, role) is refreshed
  // and handles token expiration during navigation
  useEffect(() => {
    const { authenticated, payload } = checkAuthToken();

    if (authenticated && payload) {
      setUserGroupId(payload.groupId);
      setIsManager(payload.isManager === true);
      setUserRole(payload.role || null);
    }

    // Only update isAuthenticated if it changed
    // This prevents unnecessary re-renders
    setIsAuthenticated((prev) => {
      if (prev === authenticated) return prev;
      return authenticated;
    });
  }, [pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Reset sideBarHidden on route change (pages might set it and forget to reset)
  useEffect(() => {
    setSideBarHidden(false);
  }, [pathname]);

  return (
    <html lang="es">
      <head>
        <title>Spikes</title>
        <meta name="description" content="Spikes CRM" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LayoutContext.Provider value={{
          sideBarHidden,
          setSideBarHidden,
          isMobileSidebarOpen,
          setIsMobileSidebarOpen,
          isSidebarCollapsed,
          setIsSidebarCollapsed
        }}>
          {isAuthenticated ? (
            <div className="flex h-screen overflow-hidden">
              {!sideBarHidden && (
                <Sidebar
                  userGroupId={userGroupId}
                  isManager={isManager}
                  userRole={userRole}
                  isMobileOpen={isMobileSidebarOpen}
                  onClose={() => setIsMobileSidebarOpen(false)}
                  isCollapsed={isSidebarCollapsed}
                  onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
              )}
              <div className="flex-1 flex flex-col overflow-hidden">
                <TopBar
                  userGroupId={userGroupId}
                  isManager={isManager}
                  onMenuClick={() => setIsMobileSidebarOpen(true)}
                />
                <main className="flex-1 overflow-y-auto contracts-pastel-bg">
                  {children}
                </main>
              </div>
              <ClockInReminder />
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
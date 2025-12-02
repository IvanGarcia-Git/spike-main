"use client";
import { useRef, useState, useEffect, createContext, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import * as jose from "jose";
import localFont from "next/font/local";
import { getCookie } from "cookies-next";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
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
  const [sideBarHidden, setSideBarHidden] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const pathname = usePathname();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

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
        {/* Google Fonts - Poppins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Material Icons */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        {/* FontAwesome 4 */}
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
          setIsMobileSidebarOpen
        }}>
          {isAuthenticated ? (
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              {!sideBarHidden && (
                <Sidebar
                  userGroupId={userGroupId}
                  isManager={isManager}
                  isMobileOpen={isMobileSidebarOpen}
                  onClose={() => setIsMobileSidebarOpen(false)}
                />
              )}

              {/* Main content area with TopBar */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <TopBar
                  userGroupId={userGroupId}
                  isManager={isManager}
                  onMenuClick={() => setIsMobileSidebarOpen(true)}
                />

                {/* Main content */}
                <main className="flex-1 overflow-y-auto">
                  {children}
                </main>
              </div>
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

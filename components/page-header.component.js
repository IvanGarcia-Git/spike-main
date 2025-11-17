"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCookie, deleteCookie } from "cookies-next";
import { authGetFetch } from "@/helpers/server-fetch.helper";
import * as jose from "jose";
import { FiPower } from "react-icons/fi";

export default function PageHeader({ title }) {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState("/avatar.png");
  const [userEmail, setUserEmail] = useState("");
  const [userUuid, setUserUuid] = useState("");
  const userDropdownRef = useRef(null);
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
    <header className="flex justify-between items-center mb-8">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      <div className="flex items-center space-x-4">
        <button className="p-3 rounded-full neumorphic-button">
          <span className="material-icons-outlined">apps</span>
        </button>
        <button className="p-3 rounded-full neumorphic-button">
          <span className="material-icons-outlined">settings</span>
        </button>
        <button className="p-3 rounded-full neumorphic-button">
          <span className="material-icons-outlined">notifications</span>
        </button>
        <div ref={userDropdownRef} className="relative">
          <button
            className="w-10 h-10 rounded-full neumorphic-card p-0.5 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setIsUserDropdownOpen((prev) => !prev);
            }}
          >
            <img
              src={profileImageUri}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          </button>

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
    </header>
  );
}

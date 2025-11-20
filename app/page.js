"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import EmailResetPasswordModal from "@/components/email-reset-password.modal";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const token = getCookie("factura-token");
    if (token) {
      try {
        const payload = jose.decodeJwt(token);
        if (payload) {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error al decodificar el token:", error);
      }
    }
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();

        // Pequeño delay para asegurar que la cookie se establezca
        await new Promise(resolve => setTimeout(resolve, 100));

        const token = getCookie("factura-token");

        if (token) {
          router.push("/dashboard");
        }
      } else {
        const errorData = await response.json();
        alert("Nombre de usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("Error enviando la solicitud:", error);
      alert("Error de conexión. Verifica que el servidor esté funcionando.");
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4 transition-colors duration-300">
      {/* Login Card */}
      <div className={`w-full max-w-md ${isModalOpen ? "hidden" : "block"}`}>
        {/* Login Form Card */}
        <div className="neumorphic-card p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/images/logo.svg"
              alt="SPIKES Logo"
              className="h-20 w-auto"
            />
          </div>

          <form onSubmit={handleSubmit}>
            {/* Username Field */}
            <div className="mb-6">
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                htmlFor="username"
              >
                Nombre de usuario
              </label>
              <div className="relative">
                <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  person
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                htmlFor="password"
              >
                Contraseña
              </label>
              <div className="relative">
                <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  lock
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  className="w-full neumorphic-card-inset pl-12 pr-12 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  disabled={isLoading}
                >
                  <span className="material-icons-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="mb-8 text-right">
              <button
                type="button"
                onClick={openModal}
                className="text-sm font-medium text-primary hover:underline transition-all"
                disabled={isLoading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full neumorphic-button active bg-primary text-white py-3 rounded-lg font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all duration-200 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-icons-outlined animate-spin mr-2">
                    refresh
                  </span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <span className="material-icons-outlined mr-2">login</span>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              © 2025 Spikes CRM/ERP. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 dark:bg-opacity-50 z-50 p-4">
          <EmailResetPasswordModal
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
        </div>
      )}
    </div>
  );
}

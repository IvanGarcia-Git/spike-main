"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "cookies-next";
import * as jose from "jose";
import EmailResetPasswordModal from "@/components/email-reset-password.modal";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

    console.log("🔐 Iniciando login con:", { username });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("📡 Respuesta del servidor:", response.status, response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Login exitoso, datos:", data);
        console.log("🍪 Verificando cookie...");

        // Pequeño delay para asegurar que la cookie se establezca
        await new Promise(resolve => setTimeout(resolve, 100));

        const token = getCookie("factura-token");
        console.log("🍪 Cookie obtenida:", token ? "SÍ" : "NO");

        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        console.error("❌ Error en login:", errorData);
        alert("Nombre de usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("💥 Error enviando la solicitud:", error);
      alert("Error de conexión. Verifica que el servidor esté funcionando.");
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className={`bg-foreground shadow-md rounded-lg p-20 max-w-lg w-full ${isModalOpen ? "hidden" : "block"}`}>
        <h2 className="text-3xl text-black font-bold text-center text-primary mb-8">
          Inicio de sesión
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              className="block text-sm font-semibold text-black mb-2"
              htmlFor="username"
            >
              Nombre de usuario
            </label>
            <input
              id="username"
              type="text"
              placeholder="Nombre de usuario"
              className="w-full text-black px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-sm text-black font-semibold mb-2"
              htmlFor="password"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="Contraseña"
              className="w-full text-black px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-12">
            <button
              type="button"
              onClick={openModal}
              className="block text-sm text-black font-semibold mb-2"
            >
              ¿Has olvidado tu contraseña?
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-[#faca15] text-black py-3 rounded-full font-semibold hover:bg-gray-300 transition-colors duration-200"
          >
            Accede a tu cuenta
          </button>
        </form>
      </div>
      {isModalOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 `}>
          <EmailResetPasswordModal
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
        </div>
      )}
    </div>
  );
}

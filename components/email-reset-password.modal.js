"use client";
import { authFetch, getFetch, postFetch } from "@/helpers/server-fetch.helper";
import { useState } from "react";

export default function EmailResetPasswordModal({
    isModalOpen,
    setIsModalOpen
}) {
    const [email, setEmail] = useState("");
    const [messageError, setMessageError] = useState("");
    const [userNotFound, setUserNotFound] = useState(false);

    const sendResetPasswordEmail = async (uuid, email) => {
        
        try {
            const response = await postFetch('users/send-reset-password', {uuid: uuid, email: email});

            const data = await response.json();

            if (!response.ok) {
                alert('Error al enviar el correo de restablecimiento');
            }

            return data;
        } catch (error) {
            console.error('Failed sending the email:', error.message);
            throw error;
        }
    };

    const handleSendEmail = async (event) => {
        event.preventDefault();

        if (email === '') {
            setMessageError('No se ha introducido ningún correo electrónico.')
            return;
        }

        try {
            const response = await getFetch(`users/by-email/${email}`);

            if (response.ok) {
                const user = await response.json();

                if (user) {
                    setUserNotFound(false);
                    setIsModalOpen(false);
                    sendResetPasswordEmail(user.uuid, email);
                    alert("Correo enviado con exito")
                }
                else {
                    setUserNotFound(true);
                    setMessageError("No existe usuario con este correo.")
                    setEmail('');
                }
            } else {
                alert("Usuario no encontrado");
            }
        } catch (error) {
            console.error("Error enviando la solicitud:", error);
        }

    }

    return (
        <div className="w-full max-w-md neumorphic-card p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Restablecer contraseña
                </h2>
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <span className="material-icons-outlined">close</span>
                </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Por favor, introduce tu correo electrónico para restablecer tu contraseña:
            </p>

            {/* Email Input */}
            <div className="mb-6">
                <label
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    htmlFor="reset-email"
                >
                    Correo electrónico
                </label>
                <div className="relative">
                    <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        email
                    </span>
                    <input
                        id="reset-email"
                        type="email"
                        placeholder="Escribe aquí tu correo..."
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full neumorphic-card-inset pl-12 pr-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 bg-transparent text-slate-800 dark:text-slate-200"
                    />
                </div>
                {messageError && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-2 ml-1">
                        {messageError}
                    </p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 neumorphic-button py-3 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all duration-200"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSendEmail}
                    className="flex-1 neumorphic-button active bg-primary text-white py-3 rounded-lg font-semibold hover:shadow-neumorphic-inset-light dark:hover:shadow-neumorphic-inset-dark transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <span className="material-icons-outlined text-sm">send</span>
                    Enviar
                </button>
            </div>
        </div>
    );
}
